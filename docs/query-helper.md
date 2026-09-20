# Query helper (experimental)

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

## Run from Zed

Create the `dev` profile, save your SQL file, then choose
`task: spawn` → **MSSQL: run saved file (dev)**. Results and SQL errors appear in
Zed's terminal. The task executes the **entire saved file**, including `GO`
batches; unsaved edits and selections are not used. It can execute CREATE, ALTER,
and data-changing statements. Check the named connection/database printed before
the results. Ctrl+C interrupts sqlcmd; after two seconds it is forcibly terminated if still
running. The task returns exit status 130. Cancellation is not a rollback.

For another worktree, copy `.zed/tasks.json` and replace `bin/query.js` with the
absolute script path. Duplicate the run task with a different profile name for
another connection. Use `--sqlcmd /absolute/path/to/sqlcmd` if it is not on PATH.
The helper propagates sqlcmd's exit status (`-b` enabled) and streams output
directly without buffering result sets in Node. Use UTF-8 SQL input files with
sqlcmd (Go). The helper does not pass the ODBC-only `-f` encoding flag because
Go sqlcmd rejects it. With ODBC sqlcmd, encoding follows the client's defaults;
verify non-ASCII input and output before using that variant.

To check flags against an installed client without connecting (fish):

```fish
env TEST_SQLCMD=(command -v sqlcmd) node --test --test-name-pattern='installed sqlcmd' test/query.test.js
```

No object explorer, grid, query history, persistent session, or selection runner
yet. Each run starts a new sqlcmd process. sqlcmd scripting commands are passed
through unchanged.

Results use `|` between columns and trim trailing spaces (`-s | -W`) to avoid
padding short values to the database column's declared width. This is terminal
display, not an escaped CSV export; values can themselves contain pipes or
newlines. Connection and authentication happen on every run, so this helper does
not provide the latency of an editor with a persistent database session.
