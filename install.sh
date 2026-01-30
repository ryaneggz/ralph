#!/usr/bin/env bash
set -euo pipefail

REPO="ryaneggz/ralph"
BRANCH="master"
DEST="${1:-.ralph}"

echo "Installing Ralph into ${DEST}..."

if command -v git &>/dev/null; then
  git clone --depth 1 "https://github.com/${REPO}.git" "$DEST"
elif command -v curl &>/dev/null; then
  mkdir -p "$DEST"
  curl -sL "https://github.com/${REPO}/archive/refs/heads/${BRANCH}.tar.gz" | tar xz --strip-components=1 -C "$DEST"
elif command -v wget &>/dev/null; then
  mkdir -p "$DEST"
  wget -qO- "https://github.com/${REPO}/archive/refs/heads/${BRANCH}.tar.gz" | tar xz --strip-components=1 -C "$DEST"
else
  echo "Error: git, curl, or wget is required." >&2
  exit 1
fi

echo "Ralph installed to ${DEST}"
