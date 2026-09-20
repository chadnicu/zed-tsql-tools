# Release status

Version: 0.1.0, published to npm and GitHub; gallery submission awaiting review. Updated 2026-09-20.

| Check | Status |
| --- | --- |
| Linux Node 22 tests | 20 tests passed locally including installed Go sqlcmd flag check |
| External formatter inside Zed on Linux | User-confirmed before release preparation |
| Portable archive / offline install | Passed locally; rechecked by package smoke test |
| Windows Node 22/24 | Passed in GitHub CI at ce5d081 |
| Linux Node 24 | Passed in GitHub CI at ce5d081 |
| Rust dependencies | Locked and checked against OSV |
| WASM adapter build | Maintainer reported local build passed; dev extension loaded on Linux |
| Dev adapter in Zed, Linux | Maintainer confirmed dev extension reinstall and formatting on save after restart at ce5d081 on Fedora 44 / Zed 1.20.2 |
| Dev adapter in Zed, Windows | Pending manual acceptance |
| Automatic npm installation in Zed | Maintainer reports following reinstall/no-binary-override steps at f8bcfd1 and confirms scratch SQL formats on save on Linux; installed CLI reports Zed 1.20.2, Windows untested |
| Live SQL Server query helper | Maintainer confirmed a SELECT query on Linux; broader acceptance pending; experimental |
| npm account, GitHub owner/repository | Configured: @onta.nicolae/tsql-tools and chadnicu/zed-tsql-tools |
| Public npm/gallery publication | npm and GitHub 0.1.0 published; Zed registry PR #7682 awaiting review |

The repository can be shared for development. Do not describe it as a verified
cross-platform gallery release until the pending formatter/adapter checks pass.
Use [the acceptance checklist](acceptance.md) and record actual versions/commit IDs.

Release links:

- [GitHub v0.1.0](https://github.com/chadnicu/zed-tsql-tools/releases/tag/v0.1.0), tagged at ce5d0810cff0be7c02b0759c3bf8f1c63ae9ba7a. Attached archive is the exact published npm package.
- [Zed registry PR #7682](https://github.com/zed-industries/extensions/pull/7682), submitting the same tested commit. Gallery installation is not available until accepted and published.
- [Test CI](https://github.com/chadnicu/zed-tsql-tools/actions/runs/35502136117) and [Security CI](https://github.com/chadnicu/zed-tsql-tools/actions/runs/35502136124) passed for the submitted commit.

A separate fresh-profile installation and Windows Zed manual acceptance remain unverified; the registry PR states these limits.
