# Release preparation

Suggested public repository: **zed-tsql-tools**.
Gallery title: **Poor Man's T-SQL Formatter**.
Extension ID: **poor-mans-tsql**.
Suggested npm name: **@YOUR_NPM_USERNAME/tsql-tools** (ownership must be verified).

## Current state

- External formatter: tested locally and confirmed working in Zed.
- Portable npm archive: usable before public publishing, with bundled dependencies.
- Formatting-only LSP: document synchronization and formatting over stdin/stdout.
- Rust adapter: development source, not yet built or verified in Zed.
- No public npm package, GitHub remote, or gallery submission yet.

The query helper remains an optional CLI/task tool. The gallery adapter exposes
formatting only. It reuses the SQL language from Zed's existing SQL extension;
it does not ship a duplicate grammar.

## Publish order

1. Create an empty public GitHub repository, without generated files. Set its URL
   in the root package metadata and `extension/extension.toml`.
2. Confirm the npm account/scope; rename the package and regenerate the lockfile.
   Keep `private: true` until the release is ready.
3. Run Node tests on Windows/Linux, build the WASM adapter, and manually test the
   submitted revision in Zed. Verify the portable install on both operating systems.
4. Publish the versioned npm package. Switch the adapter's development-only launch
   path to Zed's `npm_install_package` / `node_binary_path`, using the confirmed
   scoped package and an exact published version. Retain local binary overrides.
5. Submit the extension directory through a PR to `zed-industries/extensions`.
   Gallery acceptance is reviewed by Zed; it is not automatic.

Do not enable automatic downloads before the npm name is owned and published.

## Local extension validation

Run these yourself from the repository root (fish-compatible). Rust/WASM builds
and Zed GUI installation are left to you under your local workflow preference:

```fish
npm ci --ignore-scripts
npm test
rustup target add wasm32-wasip1
cargo build --manifest-path extension/Cargo.toml --target wasm32-wasip1 --release
```

Then use Zed **Install Dev Extension**, choosing the `extension/` directory.
Keep Zed's existing SQL extension installed. Use the following settings with
your machine's actual paths; replace the existing external formatter setting:

```json
{
  "languages": {
    "SQL": {
      "language_servers": ["poor-mans-tsql", "..."],
      "formatter": "language_server",
      "format_on_save": "off"
    }
  },
  "lsp": {
    "poor-mans-tsql": {
      "binary": {
        "path": "/absolute/path/to/node",
        "arguments": ["/absolute/path/to/zed-tsql-tools/bin/lsp.js"]
      },
      "initialization_options": {
        "formatter": {
          "indent": "    ",
          "uppercaseKeywords": true,
          "trailingCommas": false,
          "spaceAfterExpandedComma": true,
          "breakJoinOnSections": true
        }
      }
    }
  }
}
```

The language server honors editor indentation unless `formatter.indent` overrides
it. Options are read during initialization; restart the language server after
changing them. Only whole-document formatting is advertised. SQL is processed
locally, without a database connection or network request.

## Licenses and registry requirements

Node tools and formatter integration: AGPL-3.0-only. Rust adapter: MIT.
Zed's license policy applies to the extension binary itself and explicitly
excludes external language servers/tools. Preserve both components' licenses.

Official references:

- https://zed.dev/docs/extensions/publishing/license-requirements
- https://zed.dev/docs/extensions/publishing/prerequisites
- https://zed.dev/docs/extensions/publishing/publishing-guide
