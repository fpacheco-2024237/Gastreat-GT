#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PARENT="$(cd "${ROOT}/.." && pwd)"

link_repo() {
  local name="$1"
  local src="${PARENT}/${name}"
  local dest="${ROOT}/${name}"

  if [[ ! -d "$src" ]]; then
    echo "No se encontro ${src}" >&2
    return 1
  fi

  if [[ -L "$dest" ]]; then
    echo "OK (ya enlazado): ${name}"
    return 0
  fi

  if [[ -e "$dest" ]]; then
    echo "Existe ${dest} y no es un enlace simbolico" >&2
    return 1
  fi

  ln -s "../${name}" "$dest"
  echo "Enlazado: ${name} -> ../${name}"
}

link_repo client-admin
link_repo client-user
link_repo server-admin
link_repo server-user
link_repo authentication-service

echo
echo "Listo. Ejecuta desde kinalsports-stack:"
echo "  docker compose --env-file .env.docker up --build"
