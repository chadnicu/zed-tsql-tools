Adds Poor Man's T-SQL Formatter, a formatting-only language server for SQL Server scripts. It uses the existing SQL language/grammar and complements the SQL extension with document formatting and format on save.

The Rust adapter installs the exact version `@onta.nicolae/tsql-tools@0.1.0` through Zed's npm API. The adapter is MIT licensed; the separately downloaded Node formatter is AGPL-3.0-only. Formatting requires no database connection. The optional query CLI in the source repository is not registered by this extension.

The extension lives in `extension/`, selected by the registry entry's `path` field.

Validation:

- Submitted commit: ce5d0810cff0be7c02b0759c3bf8f1c63ae9ba7a, reachable on main.
- Maintainer confirmed reinstalling the dev extension and formatting on save after restarting Zed at this revision: Fedora 44, Zed 1.20.2.
- Maintainer reported following the no-binary-override installation steps and successful formatting with the published npm package; an independent fresh-profile installation was not separately verified.
- Windows/Linux Node 22/24 tests, offline package installation, and WASM build: [Test CI passed](https://github.com/chadnicu/zed-tsql-tools/actions/runs/35502136117).
- Dependency/secret scans and CodeQL: [Security CI passed](https://github.com/chadnicu/zed-tsql-tools/actions/runs/35502136124).
- Windows Zed manual testing has not been performed.

- [x] I've read [the contribution guidelines](https://github.com/zed-industries/extensions/blob/main/CONTRIBUTING.md) and followed the relevant guidance for adding or updating my extension.
