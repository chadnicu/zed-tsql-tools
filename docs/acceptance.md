# Manual release acceptance

Record OS, Node, Zed, and package versions and the tested Git commit in
`docs/release-status.md`. Do not mark a platform verified from CI alone.

## Formatter and adapter — Linux and Windows

1. Run `npm ci --ignore-scripts`, `npm test`, and `npm run test:package`.
2. Build the adapter using the commands in `CONTRIBUTING.md`.
3. In Zed, install the existing SQL extension, then **Install Dev Extension** from
   this repository's `extension/` directory.
4. Run `node bin/zed-settings.js --lsp`. Merge the output into Zed settings, replacing
   the old SQL external formatter. In this repository, update the project override
   too, or use a separate scratch worktree without `.zed/settings.json`.
5. Open a scratch `.sql` file, paste the following, and format before saving:

   ```sql
   select N'Ștefan 😀' as name, 1 as value;
   GO 2 -- preserve this batch repeat
   select 'first
   GO 99
   last' as multiline;
   ```

   Check that the real `GO 2` remains separate, `GO 99` stays inside the literal,
   comments/Unicode survive, and a second format makes no changes.
6. Make an unsaved edit; confirm Format uses it. Try `select 'unfinished`: the
   formatter must report an error and leave the buffer unchanged.
7. Format `examples/procedure.sql` without executing it. Repeat from an installation
   path containing spaces. Check `zed: open log` if registration or launch fails.
8. After npm publication, enable downloads, rebuild/reinstall the adapter, and
   remove its `lsp.poor-mans-tsql-lsp.binary` override. On a fresh Zed profile,
   verify package installation and formatting. Restart Zed and verify again.
   No custom local Node/script path should be needed in this final test.

## Experimental query helper

These checks require a development SQL Server and permission to connect. They
are separate from formatter release acceptance.

1. Add a development profile following `docs/query-helper.md`.
2. Run `examples/connection-check.sql`; confirm the expected database and Unicode.
3. Run two harmless SELECT batches separated by GO and verify both results.
4. Execute a deliberately invalid SELECT; the task must return a nonzero exit.
5. On that development database, interrupt `WAITFOR DELAY '00:00:10';` with Ctrl+C.
   The local client/task must exit. This does not test transaction rollback.
6. Test SQL-password prompting and the authentication method you intend to support.
   Record sqlcmd's Go/ODBC variant and version. Do not claim integrated-auth parity
   from a SQL-password connection test.
