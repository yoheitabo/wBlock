#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_SCRIPT="${ROOT_DIR}/scripts/build-dmg.sh"

if ! grep -Fq -- '-destination "generic/platform=macOS"' "${BUILD_SCRIPT}"; then
  echo "expected build-dmg.sh to use generic/platform=macOS" >&2
  exit 1
fi

if grep -Fq -- '-destination "platform=macOS"' "${BUILD_SCRIPT}"; then
  echo "build-dmg.sh still uses platform=macOS" >&2
  exit 1
fi

if VERSION=99999 "${BUILD_SCRIPT}" >/dev/null 2>&1; then
  echo "build-dmg.sh accepted an invalid release version before building" >&2
  exit 1
fi

for contract in \
  'MARKETING_VERSION=${VERSION}' \
  'WBLOCK_DMG_VERSION_MISMATCH' \
  'WBLOCK_DMG_EXTENSION_MANIFEST_MISSING' \
  'WBLOCK_DMG_EXTENSION_VERSION_MISMATCH'; do
  if ! grep -Fq -- "${contract}" "${BUILD_SCRIPT}"; then
    echo "build-dmg.sh omits release verification contract: ${contract}" >&2
    exit 1
  fi
done
