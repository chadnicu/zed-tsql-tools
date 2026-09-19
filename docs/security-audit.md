# Local release audit — 2026-09-17

Scope: JavaScript formatter/LSP/query tools, Rust adapter source and lockfile,
package contents, Git history, and release/CI configuration. No live database,
Windows desktop, or Zed extension-host penetration test was performed.

## Checks performed

| Check | Result |
| --- | --- |
| `npm audit --omit=dev` | 0 reported vulnerabilities in installed runtime dependencies |
| OSV batch query for Cargo.lock | 87 registry packages checked; 0 advisory matches |
| Gitleaks 8.30.1, Git history | No leaks found in the existing three commits |
| Gitleaks, current source snapshot | No leaks found in the release-preparation source snapshot |
| Node behavioral tests | 18 tests passed on Linux / Node 22.22.2 |
| Packed installation from an empty offline cache | Passed; unscoped and configured scoped archives install offline; generated settings work from another directory |

Gitleaks was downloaded from its official release and verified against the
published SHA-256 checksum. Only package names/versions were sent to dependency
advisory services; SQL and connection data were not submitted.

## Changes from this audit

- Reject terminal control characters in connection metadata and loaded profile names.
- Create new POSIX profile directories with mode 0700; files remain 0600.
- Forward cancellation and force termination after two seconds if sqlcmd remains;
  report cancellation as failure rather than successful query completion.
- Add package installation/content checks and release metadata consistency checks.
- Preserve configured environment overrides in the Rust adapter; install an exact
  package version only after the maintainer explicitly enables it.
- Scope npm installation capability to the configured package.
- Keep publishing credentials out of CI. Pin GitHub Actions to verified commit IDs,
  default workflow permissions to read-only, and disable persisted checkout credentials.
- Add secret scanning, dependency checks, CodeQL configuration, and dependency updates.

## Limits and pending validation

Zero advisory/secret matches are evidence, not a security guarantee. The upstream
formatter is a coarse parser with no execution-time or memory isolation. SQL
semantics are not formally verified. Query execution intentionally permits sqlcmd
commands; it is not a sandbox. Same-user process environment inspection remains
possible for password authentication.

CodeQL is configured but has not run locally. WASM compilation, real Zed adapter
installation, Windows behavior, and live SQL Server authentication/cancellation
remain manual/CI release gates. See [release status](release-status.md).

Current CI uses `python3 scripts/audit-dependencies.py` for both npm and Rust,
including bundled npm dependencies. This replaces the npm audit CLI after its
quick-audit endpoint returned HTTP 400 on 2026-09-19. Endpoint errors still fail CI.

Reproduce with `python3 scripts/audit-dependencies.py`,
`gitleaks git --redact`, `npm test`, and `npm run test:package`.
