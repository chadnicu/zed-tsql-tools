"""Check crates.io packages in the committed lockfile against OSV advisories."""
import json
import sys
import tomllib
import urllib.request
from pathlib import Path

lockfile = Path(__file__).resolve().parent.parent / "extension" / "Cargo.lock"
packages = [
    package
    for package in tomllib.loads(lockfile.read_text())["package"]
    if package.get("source", "").startswith("registry+")
]
request = urllib.request.Request(
    "https://api.osv.dev/v1/querybatch",
    data=json.dumps({
        "queries": [
            {"package": {"name": package["name"], "ecosystem": "crates.io"},
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
print(f"OSV checked {len(packages)} locked crates; {len(findings)} advisory matches.")
for finding in findings:
    print(finding)
sys.exit(bool(findings))
