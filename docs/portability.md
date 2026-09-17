# Use on another machine

Requires Node.js 22+ and Zed's SQL syntax extension. Copying a settings file with
absolute paths between machines is not sufficient; generate it on each machine.

## From a checkout

Copy or clone the repository, then run from its root:

```sh
npm ci --ignore-scripts
node bin/zed-settings.js
```

Merge the printed SQL block into Zed's user settings. Keep the checkout in place.
The output uses the actual Node executable and installation directory, including
Windows paths with spaces. Remove stale formatter overrides in project settings.

## Offline archive

Build the archive on a machine with dependencies installed:

```sh
npm run pack:portable
```

The filename is printed and placed in `dist/`. It depends on the configured package
name; before release configuration it is `zed-mssql-tools-0.1.0.tgz`.
The archive bundles runtime dependencies and their licenses. Node itself is not
bundled. Copy it to the other machine, then install into a user-owned directory.

Linux / fish, replacing the archive filename if needed:

```fish
set archive ./zed-mssql-tools-0.1.0.tgz
set install_dir "$HOME/.local/share/zed-tsql-tools"
npm install --prefix "$install_dir" "$archive" --offline --ignore-scripts --no-audit --no-fund
```

Windows / PowerShell:

```powershell
$archive = './zed-mssql-tools-0.1.0.tgz'
$installDir = "$env:LOCALAPPDATA/zed-tsql-tools"
npm install --prefix $installDir $archive --offline --ignore-scripts --no-audit --no-fund
```

Before package renaming, run `node` with the path
`INSTALL_DIRECTORY/node_modules/zed-mssql-tools/bin/zed-settings.js`.
After renaming to `@YOUR_NPM_USERNAME/tsql-tools`, use
`INSTALL_DIRECTORY/node_modules/@YOUR_NPM_USERNAME/tsql-tools/bin/zed-settings.js`.
Quote the full path. Merge the resulting JSON into Zed's settings as above.

Profiles are separate, local user data. They do not travel with the archive.
Re-create connections on the destination machine; passwords are never bundled.

## After gallery publication

Install Zed's SQL extension and **Poor Man's T-SQL Formatter**. The adapter installs
the pinned Node package using Zed's runtime. Remove old external-formatter or
development `binary` overrides, then select the formatting language server:

```json
{
  "languages": {
    "SQL": {
      "language_servers": ["poor-mans-tsql-lsp", "..."],
      "formatter": "language_server",
      "format_on_save": "off"
    }
  }
}
```

This last route is available only after registry acceptance. A public GitHub repo
alone does not make the extension available in Zed.
