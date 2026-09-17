use zed_extension_api::{self as zed, settings::LspSettings, Result};

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
        // Before publication, supply Node + bin/lsp.js through Zed's binary override.
        // Never download an unclaimed npm package name.
        let binary = LspSettings::for_worktree("poor-mans-tsql", worktree)?
            .binary
            .ok_or("Package not published yet. Configure lsp.poor-mans-tsql.binary (see PUBLISHING.md).")?;
        let command = binary
            .path
            .ok_or("Set lsp.poor-mans-tsql.binary.path to Node.")?;
        Ok(zed::Command {
            command,
            args: binary.arguments.unwrap_or_default(),
            env: Default::default(),
        })
    }

    fn language_server_initialization_options(
        &mut self,
        _id: &zed::LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<Option<zed::serde_json::Value>> {
        Ok(LspSettings::for_worktree("poor-mans-tsql", worktree)?.initialization_options)
    }
}

zed::register_extension!(PoorMansTsql);
