"""Check all locked npm and crates.io dependencies against OSV advisories."""
import json
import sys
import tomllib
import urllib.request
from pathlib import Path

root = Path(__file__).resolve().parent.parent
lockfile = root / "extension" / "Cargo.lock"
packages = [
    {"name": package["name"], "version": package["version"], "ecosystem": "crates.io"}
    for package in tomllib.loads(lockfile.read_text())["package"]
    if package.get("source", "").startswith("registry+")
]
npm_lock = json.loads((root / "package-lock.json").read_text())
packages.extend(
    {"name": package.get("name", path.rsplit("node_modules/", 1)[-1]),
     "version": package["version"], "ecosystem": "npm"}
    for path, package in npm_lock["packages"].items()
    if path and not package.get("link")
)
request = urllib.request.Request(
    "https://api.osv.dev/v1/querybatch",
    data=json.dumps({
        "queries": [
            {"package": {"name": package["name"], "ecosystem": package["ecosystem"]},
             "version": package["version"]}
            for package in packages
        ]
    }).encode(),
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(request, timeout=30) as response:
    results = json.load(response)["results"]
if len(results) != len(packages):
    raise RuntimeError("OSV returned an incomplete result set")
findings = [
    f'{package["name"]}@{package["version"]}: {advisory["id"]}'
    for package, result in zip(packages, results)
    for advisory in result.get("vulns", [])
]
print(f"OSV checked {len(packages)} locked dependencies; {len(findings)} advisory matches.")
for finding in findings:
    print(finding)
sys.exit(bool(findings))
