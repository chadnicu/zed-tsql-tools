# Zed MSSQL tools

Local Poor Man's T-SQL formatter and a basic `sqlcmd` query helper. Node.js 22+
required. Working external-formatter integration, plus a formatter language server
and a development Zed adapter in `extension/`. Not yet published in the gallery.

## Use on another machine now

Copy `dist/zed-mssql-tools-0.1.0.tgz` to the other machine. It bundles the Node
dependencies, so installation needs no registry access. Install into a folder you
own, for example (fish):

```fish
npm install --prefix "$HOME/.local/share/zed-tsql-tools" ./zed-mssql-tools-0.1.0.tgz --offline --ignore-scripts --no-audit --no-fund
node "$HOME/.local/share/zed-tsql-tools/node_modules/zed-mssql-tools/bin/zed-settings.js"
```

On Windows PowerShell:

```powershell
npm install --prefix "$env:LOCALAPPDATA/zed-tsql-tools" ./zed-mssql-tools-0.1.0.tgz --offline --ignore-scripts --no-audit --no-fund
node "$env:LOCALAPPDATA/zed-tsql-tools/node_modules/zed-mssql-tools/bin/zed-settings.js"
```

Merge the printed `languages.SQL` settings into Zed's **user settings** to make
formatting available across projects. This generates correct absolute paths on
each machine. Project formatter settings override user settings: remove stale
project-specific formatter paths if necessary. Keep the installed folder in place.
Keep Zed's SQL syntax extension installed. The settings helper prints JSON only;
it never overwrites existing settings. To build a new archive, create `dist/` then
run `npm run pack:portable` after installing dependencies.

For public release and gallery integration, see [PUBLISHING.md](PUBLISHING.md).

## 1. Install and format

From this checkout (fish, PowerShell, or other shell):

```sh
npm ci --ignore-scripts
npm test
```

Install Zed's **SQL** extension for syntax highlighting. This repo's
`.zed/settings.json` connects **Format Document** to the formatter. Formatting on
save is off initially. Open a SQL file in this worktree and run `editor: format`.
For another project, copy the SQL settings and use **absolute paths** for both
the formatter and config, for example:

```json
{
  "languages": {
    "SQL": {
      "format_on_save": "off",
      "formatter": {
        "external": {
          "command": "node",
          "arguments": [
            "/absolute/path/to/zed-tsql-tools/bin/format.js",
            "--config",
            "/absolute/path/to/zed-tsql-tools/examples/formatter.json"
          ]
        }
      }
    }
  }
}
```

On Windows use paths such as `C:/tools/zed-mssql-extension/bin/format.js`.
Forward slashes work in JSON and avoid backslash escaping. If Zed cannot find
Node, set `command` to the absolute Node executable path (Windows example:
`C:/Program Files/nodejs/node.exe`). Restart Zed after PATH changes.

Standalone formatting in fish:

```fish
node bin/format.js --config examples/formatter.json < input.sql > formatted.sql
```

Use a different output file: shell redirection to the input file would truncate
it before the formatter reads it. The formatter itself never writes input files.

`--config` is optional; omitted means upstream defaults. The example selects
four-space indentation, leading commas, and separate JOIN/ON lines. Supported
settings are the standard text-formatting options in the
[upstream README](https://github.com/TaoK/PoorMansTSqlFormatter).
Unknown keys and wrong types fail. No implicit project-config discovery.

SQL alone goes to stdout. Parse failures produce stderr and exit 1 without
formatted output, so Zed can retain the original document. Blank input is
unchanged. The wrapper preserves upstream line endings; it does not rewrite
multiline string literals to force a document-wide newline style.

The engine is pinned to `poor-mans-t-sql-formatter@1.6.10`. Its parser is coarse
and may not understand newer T-SQL. A successful format is not SQL validation.
Compare formatting against your stored procedures before enabling format on save.

## 2. Saved profiles and terminal queries

Install Microsoft's [sqlcmd](https://learn.microsoft.com/en-us/sql/tools/sqlcmd/sqlcmd-download-install)
separately. No database server or driver is installed by this project. The helper
uses common sqlcmd flags; actual compatibility/authentication must be checked
against your installed Go or ODBC sqlcmd and SQL Server.

Create a profile from this checkout (fish):

```fish
node bin/query.js add dev --server localhost,1433 --database MyDatabase --user myuser
node bin/query.js list
node bin/query.js run dev /absolute/path/to/query.sql
```

Without `--password-env`, sqlcmd prompts for the password in the terminal.
For environment-based authentication, create a profile with an explicit variable:

```fish
node bin/query.js add dev-env --server localhost,1433 --database MyDatabase --user myuser --password-env MSSQL_DEV_PASSWORD
read --silent --prompt-str 'SQL password: ' --export MSSQL_DEV_PASSWORD
node bin/query.js run dev-env /absolute/path/to/query.sql
set --erase MSSQL_DEV_PASSWORD
```

Zed must inherit that variable to use it in tasks. A variable set in a separate
terminal is not automatically available to an already-running Zed process.
Using the sqlcmd prompt avoids that setup. Profiles store server, database,
authentication method, username, and optionally the password variable **name**;
never passwords. Passwords are passed to sqlcmd through its environment, not argv.

For integrated authentication:

```fish
node bin/query.js add work --server sql.example.com --database App --auth integrated
```

Windows uses the current identity; Linux requires working Kerberos/driver setup.
Entra/MFA workflows and OS keychain storage are outside this initial version.
Use `--trust-server-certificate` when adding a profile only if you intend to bypass
certificate validation (for example a local self-signed server).

Profiles live at:

- Linux: `$XDG_CONFIG_HOME/zed-mssql-tools/profiles.json`, defaulting to
  `~/.config/zed-mssql-tools/profiles.json`.
- Windows: `%APPDATA%/zed-mssql-tools/profiles.json`.

Every command accepts `--profiles PATH`. Existing names cannot be overwritten by
`add`; edit the JSON to change or remove a profile. A `.lock` file serializes
writes. After a crash, remove it only after ensuring no profile writer is running.
POSIX files use mode 0600; Windows permissions follow the directory ACL.

## 3. Run from Zed

Create the `dev` profile, save your SQL file, then choose
`task: spawn` → **MSSQL: run saved file (dev)**. Results and SQL errors appear in
Zed's terminal. The task executes the **entire saved file**, including `GO`
batches; unsaved edits and selections are not used. It can execute CREATE, ALTER,
and data-changing statements. Check the named connection/database printed before
the results. Ctrl+C is forwarded to sqlcmd; cancellation is not a rollback.

For another worktree, copy `.zed/tasks.json` and replace `bin/query.js` with the
absolute script path. Duplicate the run task with a different profile name for
another connection. Use `--sqlcmd /absolute/path/to/sqlcmd` if it is not on PATH.
The helper propagates sqlcmd's exit status (`-b` enabled) and streams output
directly without buffering result sets in Node. SQL input files are UTF-8.

No object explorer, grid, query history, persistent session, or selection runner
yet. Each run starts a new sqlcmd process. sqlcmd scripting commands are passed
through unchanged.

## Validation status

Automated tests cover formatting procedures/GO, Unicode and multiline literals,
idempotence, config errors, CLI failures, profile persistence, credential handling,
paths with spaces, and child exit statuses. Tests never connect to a database.
GitHub Actions is configured for Node 22/24 on Linux and Windows; configuring CI
does not mean those jobs have run.

Local verification still required on each OS:

1. `npm ci --ignore-scripts` and `npm test`.
2. Format a representative stored procedure in Zed; compare with your VS Code output.
3. Run a saved `SELECT DB_NAME(), @@VERSION;` against a development database.
4. Check Unicode results, multiple GO batches, SQL errors, password prompt, and Ctrl+C.

## Third-party code

The Node tools are AGPL-3.0-only; Poor Man's T-SQL Formatter is AGPL-3.0 and its
license and bundled notices are retained. The separate Rust adapter under
`extension/` is MIT licensed. Publication is disabled until the owner/package
name is configured. Zed and sqlcmd are separate installations.
See [THIRD_PARTY.md](THIRD_PARTY.md).
