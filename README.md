# Zed T-SQL Tools

Format SQL Server scripts with Poor Man's T-SQL Formatter. Includes a Zed language
server adapter, a standalone formatter, and an experimental sqlcmd query helper.

**Status:** pre-release. The external formatter works in Zed on Linux. Windows and
adapter acceptance checks are still pending; see [release status](docs/release-status.md).
The extension is not yet in Zed's gallery.

## Try it from source

Requires Node.js 22+ and Zed's **SQL** extension for syntax highlighting.
From this checkout:

```sh
npm ci --ignore-scripts
node bin/zed-settings.js
```

Merge the printed `languages.SQL` block into your Zed user settings. It contains
absolute paths for this machine. Project settings override user settings: remove
old project-specific formatter paths if necessary. Run **editor: format** in a SQL
file. Formatting on save starts disabled.

The settings command only prints JSON; it does not overwrite editor preferences.
Keep the checkout in place. This repository's own `.zed/settings.json` already
uses the local formatter.

Standalone, from fish:

```fish
node bin/format.js --config examples/formatter.json < input.sql > formatted.sql
```

Use a different output file: redirecting to the input file truncates it before it
can be read. SQL goes to stdout; errors go to stderr with a failing exit status.
Formatting never connects to a database.

## What it does

- Uses Poor Man's formatting engine, with explicit options.
- Preserves standalone `GO` and `GO count` directives outside strings/comments.
- Returns no replacement text when a batch fails to parse.
- Formats unsaved buffers through a local stdin/stdout language server.
- Generates machine-specific Zed settings and supports portable offline packages.

The upstream parser is coarse. It is not a SQL validator, and newer T-SQL syntax
may be unsupported. See [formatting behavior and limits](docs/formatting.md).

## Other machines and the extension

[Portable installation](docs/portability.md) works before public publishing.
The development adapter lives in `extension/`; run `node bin/zed-settings.js --lsp`
for local LSP settings after installing it as a dev extension. Automatic downloads
remain disabled until the maintainer configures and publishes the npm package.

[Publishing guide](PUBLISHING.md): account names, repository setup, npm release,
manual Zed testing, and the community registry PR. No website or backend deployment
is needed.

## Query helper

The optional [query helper](docs/query-helper.md) runs a saved SQL file through
Microsoft's sqlcmd, using a named connection profile. Results appear in the terminal.
It does not provide an object explorer, result grid, or persistent database session.
Live SQL Server validation is pending. Execute trusted scripts only.

## Development and security

```sh
npm test
npm run test:package
```

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and
[CHANGELOG.md](CHANGELOG.md). Tests do not connect to a database.

Node tools: [AGPL-3.0-only](LICENSE). Rust adapter: [MIT](extension/LICENSE).
Poor Man's engine and other dependencies retain their own notices;
see [THIRD_PARTY.md](THIRD_PARTY.md).
