use std::{env, path::PathBuf};
use zed_extension_api::{self as zed, settings::LspSettings, Result};

const SERVER_ID: &str = "poor-mans-tsql-lsp";
const RELEASE: &str = include_str!("../server.json");

struct PoorMansTsql;

impl zed::Extension for PoorMansTsql {
    fn new() -> Self {
        Self
    }

    fn language_server_command(
        &mut self,
        _id: &zed::LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<zed::Command> {
        if let Some(binary) = LspSettings::for_worktree(SERVER_ID, worktree)?.binary {
            if let Some(command) = binary.path {
                return Ok(zed::Command {
                    command,
                    args: binary.arguments.unwrap_or_default(),
                    env: binary.env.unwrap_or_default().into_iter().collect(),
                });
            }
        }

        let release: zed::serde_json::Value =
            zed::serde_json::from_str(RELEASE).map_err(|error| error.to_string())?;
        if release["downloadEnabled"].as_bool() != Some(true) {
            return Err("Automatic installation is not enabled for this development build. Use a binary override; see PUBLISHING.md.".into());
        }
        let package = release["npmPackage"]
            .as_str()
            .ok_or("Missing npm package in server.json")?;
        let version = release["version"]
            .as_str()
            .ok_or("Missing version in server.json")?;
        let server = PathBuf::from("node_modules")
            .join(package)
            .join("bin/lsp.js");
        if zed::npm_package_installed_version(package)?.as_deref() != Some(version)
            || !server.is_file()
        {
            zed::npm_install_package(package, version)?;
        }
        let absolute_server = env::current_dir()
            .map_err(|error| error.to_string())?
            .join(server);
        Ok(zed::Command {
            command: zed::node_binary_path()?,
            args: vec![absolute_server.to_string_lossy().into_owned()],
            env: Default::default(),
        })
    }

    fn language_server_initialization_options(
        &mut self,
        _id: &zed::LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<Option<zed::serde_json::Value>> {
        Ok(LspSettings::for_worktree(SERVER_ID, worktree)?.initialization_options)
    }
}

zed::register_extension!(PoorMansTsql);
