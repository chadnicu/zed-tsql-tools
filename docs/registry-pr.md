Adds a formatting-only language server for Poor Man's T-SQL Formatter.

It reuses the existing SQL language/grammar and adds document formatting for T-SQL
scripts. The Rust adapter installs an exact version of the scoped npm package
through Zed's extension API. The adapter is MIT licensed; the separate Node
formatter is AGPL-3.0-only. No database connection is needed for formatting.

The extension directory is `extension/` in the linked repository. The optional
query helper is a separate CLI and is not registered by this extension.

Validation:

- Submitted commit: [REPLACE WITH FULL COMMIT]
- Linux: [REPLACE WITH ZED/OS VERSION AND MANUAL RESULT]
- Windows: [REPLACE WITH ZED/OS VERSION AND MANUAL RESULT]
- Clean automatic npm installation: [REPLACE WITH RESULT]
- Node tests, offline package test, WASM build, and security CI: [REPLACE WITH CI LINK]
