# First public release

Run commands from this repository's root unless a step says otherwise. Commands
below use fish; account names are the only placeholders. Nothing needs deploying
to a web server. GitHub hosts source, npm hosts the Node tools, and Zed's registry
builds/distributes the adapter after review.

## 1. Create the accounts and empty repository

On GitHub, create a **public** repository:

- **Name:** `zed-tsql-tools`
- **Description:** `T-SQL formatting and SQL Server tools for Zed.`
- **README / .gitignore / license:** leave unchecked; the files already exist here.
- **Topics:** `zed`, `tsql`, `sql-server`, `formatter`, `language-server`

In repository Settings, enable private vulnerability reporting, secret scanning,
and push protection where available. The checked-in Security workflow supplies
CodeQL; do not also enable a duplicate default CodeQL setup. Enable Issues.

Create/sign into an npm account and enable two-factor authentication. Your npm
username may differ from GitHub. Use a scope you own:
`@YOUR_NPM_USERNAME/tsql-tools`. No organization or paid private package is needed
for a public scoped package.

## 2. Configure local metadata

```fish
set github_owner YOUR_GITHUB_USERNAME
set npm_owner YOUR_NPM_USERNAME
set repo_dir (pwd)
node scripts/configure-release.js --github "$github_owner/zed-tsql-tools" --npm "@$npm_owner/tsql-tools" --author 'YOUR PUBLIC NAME'
npm run check:release
```

This updates package metadata, the lockfile, the extension repository/author, and
its scoped npm capability. It deliberately leaves publication and downloads
blocked. Keep the same fish session, or set these variables again later.

The public identities are:

| Component | Name |
| --- | --- |
| GitHub repository | `zed-tsql-tools` |
| npm package | `@YOUR_NPM_USERNAME/tsql-tools` |
| Zed title | `Poor Man's T-SQL Formatter` |
| Zed extension/server ID | `poor-mans-tsql-lsp` |
| Initial version | `0.1.0` |

## 3. Run local checks and build the adapter

Install Node 22+ and Rust through rustup if missing. Then:

```fish
npm ci --ignore-scripts
npm test
npm run test:package
python3 scripts/audit-dependencies.py
rustup target add wasm32-wasip2
cargo fmt --manifest-path extension/Cargo.toml --check
cargo build --locked --manifest-path extension/Cargo.toml --target wasm32-wasip2 --release
```

The WASM target is **wasip2**, as in Zed's current development guide. Keep the
Cargo lockfile committed. Do not replace a failed build with a claimed pass.

In Zed, install the existing **SQL** extension and then choose **Install Dev
Extension**, selecting this repository's `extension/` directory. Generate the
local settings:

```fish
node bin/zed-settings.js --lsp
```

Merge the result into Zed user settings. Remove any project-specific external
formatter override, or use a separate scratch worktree. Follow the formatter
checks in [docs/acceptance.md](docs/acceptance.md) on Linux and Windows. Record the
OS/Zed versions and commit in [docs/release-status.md](docs/release-status.md).
Keep generated machine-specific settings out of commits.

## 4. Push the source and let CI run

Inspect the diff first. From this repository:

```fish
git status --short
git diff
# Remove the local npm publication guard only when ready to publish.
npm pkg delete private
git add .
git commit -m 'chore: configure first public release'
git branch -M main
git remote add origin "https://github.com/$github_owner/zed-tsql-tools.git"
git push -u origin main
```

If `origin` already exists, inspect `git remote -v` and use it rather than adding a
duplicate. Do not reset or overwrite an unrelated remote.

Wait for **Test** and **Security** in GitHub Actions. Test runs Node 22/24 on
Windows/Linux, offline package installation, and the Rust WASM build. Security
runs dependency/secret checks and CodeQL. Fix failures before publication.

Automatic dependency PRs are configured through Dependabot. Protect `main` after
the initial release (step 8), so the setup pushes below are not blocked mid-release.

## 5. Publish the Node package

From this checkout, after green CI and manual checks:

```fish
npm login
npm whoami
npm run check:release
npm publish --access public
npm view "@$npm_owner/tsql-tools@0.1.0" version
```

Complete npm's interactive authentication/2FA prompts. Check that `npm whoami`
prints the intended owner. `prepublishOnly` reruns metadata checks, tests, and the
package smoke test. The last command must return `0.1.0`.

A published npm name/version is immutable. If release code changes afterward,
bump the version and synchronize package.json, package-lock.json, the extension
manifest, extension/server.json, and Cargo package version/lockfile before retrying.
Do not reuse 0.1.0 for different published code. A scoped package avoids guessing
ownership of an unscoped name.

## 6. Enable and test automatic installation

Only after verifying the published npm package:

```fish
node scripts/configure-release.js --enable-downloads
npm run check:release -- --gallery
cargo build --locked --manifest-path extension/Cargo.toml --target wasm32-wasip2 --release
```

Reinstall the dev extension. Remove `lsp.poor-mans-tsql-lsp.binary` from Zed settings;
keep the SQL language-server selection. Use a fresh Zed profile/installation to
confirm that the adapter downloads the package and formats without a custom Node
path. Repeat on Linux and Windows, following [acceptance](docs/acceptance.md).

The adapter installs the exact version in `extension/server.json`, never `latest`.
Update the acceptance record, commit, push, and wait for green CI again:

```fish
git add extension/server.json docs/release-status.md
git commit -m 'chore: enable published formatter package'
git push
set release_commit (git rev-parse HEAD)
```

Wait for green CI. Reinstall the dev extension at this exact commit and repeat the
formatter/automatic-install checks. Record the commit and results in the registry
PR description, without changing the source revision again. Then:

```fish
git tag -a v0.1.0 -m 'First T-SQL tools release'
git push origin v0.1.0
npm run pack:portable
```

On GitHub, create a release from `v0.1.0`, titled **0.1.0 — T-SQL formatting for
Zed**. Describe the formatter; label the query helper experimental. Attach the
archive printed by `pack:portable`. The full corresponding source is in the tag.
Do not claim the gallery entry is available until the registry PR is merged.

## 7. Submit to Zed's community registry

Install GitHub CLI and the registry's documented pnpm prerequisite if needed.
Authenticate locally with `gh auth login`. Use a separate folder for the registry:

```fish
mkdir -p ../zed-registry-work
cd ../zed-registry-work
gh repo fork zed-industries/extensions --clone --remote
cd extensions
git switch -c add-poor-mans-tsql-lsp
git submodule add "https://github.com/$github_owner/zed-tsql-tools.git" extensions/poor-mans-tsql-lsp
git -C extensions/poor-mans-tsql-lsp checkout "$release_commit"
```

Add this block to the registry's top-level `extensions.toml`:

```toml
[poor-mans-tsql-lsp]
submodule = "extensions/poor-mans-tsql-lsp"
path = "extension"
version = "0.1.0"
```

`path` is necessary: the Rust extension lives inside the source repository.
Then:

```fish
pnpm install --frozen-lockfile
pnpm sort-extensions
git add .gitmodules extensions.toml extensions/poor-mans-tsql-lsp
git commit -m 'Add Poor Mans T-SQL Formatter language server'
git push -u origin add-poor-mans-tsql-lsp
gh pr create --repo zed-industries/extensions --title 'Add Poor Mans T-SQL Formatter' --body-file "$repo_dir/docs/registry-pr.md"
```

Before the last command, replace the bracketed manual-test details in
`docs/registry-pr.md` with real versions and the submitted commit. The registry
requires manual testing of that exact revision. Keep the release commit reachable
on the public branch. Maintainers may request changes or prefer a contribution
to the existing SQL extension; acceptance is not guaranteed.

## 8. Install on your other machines

After merge/publication, install **SQL** and **Poor Man's T-SQL Formatter** from
Zed's extension gallery. Use the settings in [docs/portability.md](docs/portability.md).
Before gallery approval, use its checkout/archive installation instructions.

After the first release, add a GitHub branch ruleset for `main`: require PRs and
the CI checks for future changes. Do not require signed commits unless your local
setup supports them. Use PRs for subsequent release metadata updates.

No publishing credentials belong in this repository. The first release is manual;
OIDC trusted publishing can be configured later if releases become frequent.

Upstream requirements and source links: [docs/release-requirements.md](docs/release-requirements.md).
