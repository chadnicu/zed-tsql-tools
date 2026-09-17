# Registry requirements checked 2026-09-17

This note records upstream requirements. See `PUBLISHING.md` for this project's release procedure. GitHub owner and npm scope remain owner-supplied values.

## Zed registry

- Manually test the exact submitted commit inside Zed before submission.
- An extension providing only a language server should have an ID identifying that role, such as `poor-mans-tsql-lsp`. IDs must be unique, kebab-case, and omit `zed` and `extension`.
- Download the language server through the extension API or locate an existing installation; do not bundle it into the extension.
- Explain the distinct formatter functionality alongside the existing SQL extension. Registry acceptance remains a maintainer decision; existing functionality should normally be improved upstream.

Source: [Zed publishing prerequisites](https://zed.dev/docs/extensions/publishing/prerequisites).

The compiled Rust adapter needs an accepted license **inside `extension/`**. MIT is accepted; AGPL is absent from the accepted list. The separate Node formatter can retain its AGPL license: the registry explicitly distinguishes extension binaries from downloaded tools. An MIT `extension/LICENSE` therefore does not relicense the formatter or its dependency.

Source: [Zed license requirements](https://zed.dev/docs/extensions/publishing/license-requirements).

Use manifest fields `id`, `name`, `version`, `schema_version = 1`, `authors`, `description`, and the real public `repository` URL. Build Rust code as `cdylib` for `wasm32-wasip2`. For manual validation, install Rust through rustup, select **Install Dev Extension**, and choose `extension/`; inspect **zed: open log** for failures.

Source: [Zed development guide](https://zed.dev/docs/extensions/developing-extensions).

### Submission from a monorepo

1. Publish the source repository publicly, with the release commit on a branch.
2. Fork `zed-industries/extensions` to a personal GitHub account and clone the fork.
3. Add the public source repository using an HTTPS submodule URL under `extensions/poor-mans-tsql-lsp`.
4. Add this entry to the registry's top-level `extensions.toml`, adjusting ID/version if changed:

```toml
[poor-mans-tsql-lsp]
submodule = "extensions/poor-mans-tsql-lsp"
path = "extension"
version = "0.1.0"
```

5. Run `pnpm sort-extensions`; commit the manifest, `.gitmodules`, and submodule pointer; open a registry pull request.
6. Registry maintainers review, merge, package, and publish the extension. A GitHub source release alone does not publish to Zed.

Source: [Zed publishing guide](https://zed.dev/docs/extensions/publishing/publishing-guide).

## API compatibility and package installation

`zed_extension_api` 0.7.0 is published. It offers `node_binary_path`, `npm_install_package`, and `npm_package_installed_version`, supporting installation of an explicitly versioned npm server and launching its JavaScript entry with Zed's Node runtime. Scope installation permission to the actual npm package using the `npm:install` capability.

Sources: [0.7.0 API](https://docs.rs/zed_extension_api/latest/zed_extension_api/), [capability documentation](https://zed.dev/docs/extensions/capabilities).

The official compatibility table currently ends at API 0.6.0/Zed 0.192.x. It does **not** establish a minimum Zed version for API 0.7.0. Do not invent that version; document tested Zed versions after manual validation. Zed's Windows migration instructions explicitly recommend API 0.7 for extensions using `std::env::current_dir`.

Sources: [API compatibility table](https://github.com/zed-industries/zed/tree/main/crates/extension_api), [official Windows migration issue](https://github.com/zed-industries/extensions/issues/3350).

## npm publication

Choose a scope the maintainer owns, such as `@YOUR_NPM_USERNAME/tsql-tools`, and configure the adapter with that exact package name before release. Scoped packages require `npm publish --access public` for public visibility. Direct publication requires account 2FA or a granular token configured to bypass 2FA. For a first manual release, use the account's interactive login and 2FA; no CI token is necessary.

Sources: [Scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/), [npm 2FA requirements](https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification/).

For later automation, npm supports OIDC trusted publishers, avoiding stored publishing tokens. That setup currently requires npm 11.5.1+ and Node 22.14.0+, and GitHub publishing requires the package's `repository.url` to match the GitHub repository. This is optional for the first manual release.

Source: [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).
