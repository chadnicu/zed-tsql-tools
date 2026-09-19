# Security

## Reporting

Use **Security → Report a vulnerability** on the project's GitHub repository.
The maintainer must enable private vulnerability reporting before launch. Do not
post credentials, real connection profiles, or sensitive SQL in public issues.
No response-time commitment is made for this volunteer project.

Only the latest release is maintained. During development there is no published
release; report against the current main branch.

## Trust boundaries

- Formatting runs locally. The formatter does not connect to a database, send SQL
  over the network, or evaluate SQL as JavaScript. The LSP accepts stdin/stdout
  messages; it does not open a TCP listener.
- The Zed adapter installs one explicitly configured, version-pinned npm package.
  Installation requires registry access. Formatting afterward is local. Downloads
  stay disabled until the maintainer enables the published package.
- The Node server and CLI are ordinary local processes, not sandboxes. Large or
  pathological SQL can consume CPU/memory in the upstream parser. Do not expose
  the LSP as a public network service.
- The query helper deliberately executes a saved file through sqlcmd. sqlcmd
  scripting commands, including file inclusion and OS-command execution where
  supported, retain their normal behavior. Run trusted scripts only. This is not
  a read-only database client or a SQL sandbox.
- SQL passwords are prompted for by sqlcmd or passed through its environment,
  never through command arguments or saved profiles. Other processes with the
  same OS privileges may inspect process environments. No keychain integration
  is provided. Certificate validation is bypassed only by explicit profile choice.
- Profile writes are serialized and replaced atomically; new POSIX files use
  mode 0600 and new directories 0700. Windows uses the parent directory's ACL.
  Do not put profiles in untrusted shared directories.

## Checks

OSV checks of both committed dependency lockfiles, Gitleaks, package-content checks, and behavioral tests are
part of release validation. GitHub CI also runs CodeQL and dependency updates.
These checks cannot prove the absence of vulnerabilities. See
[the audit record](docs/security-audit.md) for what actually ran and remaining gaps.
