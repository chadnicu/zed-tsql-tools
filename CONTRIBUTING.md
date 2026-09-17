# Contributing

For a bug, include a minimal SQL example with invented names and values, the
formatter options, OS, Node version, and expected output. Discuss larger changes
in an issue before implementing them. See [SECURITY.md](SECURITY.md) for private
vulnerability reports.

## Development

Node.js 22+; no build step for the JavaScript tools.

```sh
npm ci --ignore-scripts
npm test
npm run test:package
```

The package smoke test installs an archive offline into a temporary directory,
including a path with spaces. No test connects to SQL Server.

For Rust adapter changes, install Rust with rustup, then:

```sh
rustup target add wasm32-wasip2
cargo fmt --manifest-path extension/Cargo.toml --check
cargo build --locked --manifest-path extension/Cargo.toml --target wasm32-wasip2 --release
```

Follow [the manual acceptance checklist](docs/acceptance.md) for affected platforms.
Adapter or registration changes require a real Zed test; Node tests do not cover
the editor's extension host.

## Code and tests

- Keep formatter, profile storage, process execution, and release tooling separate.
- Use Node built-ins where practical. Pin dependencies and commit both lockfiles.
- Pass process arguments as arrays with `shell: false`. Do not interpolate SQL,
  paths, profile values, or credentials into shell commands.
- Keep stdout reserved for SQL or LSP messages. Diagnostics belong on stderr.
- Add a regression test for a bug at the interface where it occurs. Include CRLF,
  Unicode, comments, and quoted text when changing batch detection.
- Format JavaScript with two-space indentation and semicolons; use `cargo fmt`
  for Rust. Keep functions small when it makes responsibilities clearer; avoid
  abstractions that only add indirection.
- Do not commit private SQL, profiles, environment files, access tokens, or binary
  build outputs. Describe actual verification, including checks not performed.

Submit one focused PR with the problem, behavior change, and validation. Keep
review discussion respectful and specific. Publishing is a maintainer task;
see [PUBLISHING.md](PUBLISHING.md).

Node code is AGPL-3.0-only. Code under `extension/` is MIT. Contributions retain
the license of the component being changed; do not relicense upstream code.
