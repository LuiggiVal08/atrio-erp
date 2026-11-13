#!/bin/sh
set -e

for pkg in core-accounting l10n_ve l10n_co; do
  src="/packages/$pkg"

  if [ ! -d "$src" ]; then
    echo "Missing workspace package: $src" >&2
    exit 1
  fi

  if [ ! -d "$src/node_modules" ]; then
    echo "Installing dependencies for $pkg..."
    (cd "$src" && npm ci)
  fi

  if [ ! -f "$src/dist/index.js" ] || [ -n "$(find "$src/src" -newer "$src/dist/index.js" -print -quit 2>/dev/null)" ]; then
    echo "Building $pkg..."
    (cd "$src" && npm run build)
  fi

  mkdir -p /app/node_modules/@atrio
  rm -rf "/app/node_modules/@atrio/$pkg"
  ln -s "$src" "/app/node_modules/@atrio/$pkg"
done

exec npm run start:dev
