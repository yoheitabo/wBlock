#!/usr/bin/env python3
"""Keep the Safari Web Extension version aligned with the host app version."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
PROJECT = ROOT / "wBlock.xcodeproj" / "project.pbxproj"
MANIFEST = ROOT / "wBlock Scripts (iOS)" / "Resources" / "manifest.json"
VERSION_PATTERN = re.compile(r"(?:0|[1-9]\d*)(?:\.(?:0|[1-9]\d*)){0,3}")


def project_version() -> str:
    versions = set(re.findall(r"MARKETING_VERSION = ([^;]+);", PROJECT.read_text()))
    if len(versions) != 1:
        raise SystemExit(
            "[WBLOCK_MARKETING_VERSION_AMBIGUOUS] expected one project MARKETING_VERSION, "
            f"found {sorted(versions)}"
        )
    return versions.pop()


def validate_version(version: str) -> str:
    if VERSION_PATTERN.fullmatch(version) is None:
        raise SystemExit(f"[WBLOCK_EXTENSION_VERSION_INVALID] invalid manifest version: {version}")
    if any(int(component) > 65535 for component in version.split(".")):
        raise SystemExit(f"[WBLOCK_EXTENSION_VERSION_INVALID] component exceeds 65535: {version}")
    return version


def main() -> None:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check-project", action="store_true")
    mode.add_argument("--check", metavar="VERSION")
    mode.add_argument("--set", metavar="VERSION")
    args = parser.parse_args()

    document = json.loads(MANIFEST.read_text())
    actual = validate_version(document.get("version", ""))
    expected = validate_version(
        project_version() if args.check_project else args.check if args.check is not None else args.set
    )
    if args.check_project or args.check is not None:
        if actual != expected:
            raise SystemExit(
                "[WBLOCK_EXTENSION_VERSION_MISMATCH] "
                f"manifest has {actual}; expected {expected}"
            )
        print(f"Safari extension manifest version matches expected version: {actual}")
        return

    document["version"] = expected
    MANIFEST.write_text(json.dumps(document, indent=4) + "\n")
    print(f"Set Safari extension manifest version: {expected}")


if __name__ == "__main__":
    main()
