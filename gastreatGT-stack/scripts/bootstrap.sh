#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="${ROOT}/repos.yaml"
WITH_PG=false

usage() {
  cat <<'EOF'
Uso: ./scripts/bootstrap.sh [--with-pg]

Clona los repositorios de microservicios definidos en repos.yaml
dentro de kinalsports-stack.

Opciones:
  --with-pg   Clona tambien el repo opcional pg (Postgres standalone)
  -h, --help  Muestra esta ayuda
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --with-pg) WITH_PG=true; shift ;;
    -h | --help) usage; exit 0 ;;
    *) echo "Opcion desconocida: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ ! -f "$MANIFEST" ]]; then
  echo "No se encontro repos.yaml en ${ROOT}" >&2
  exit 1
fi

ORG="$(awk -F': ' '/^org:/{print $2; exit}' "$MANIFEST")"
BRANCH="$(awk -F': ' '/^branch:/{print $2; exit}' "$MANIFEST")"

if [[ -z "$ORG" || -z "$BRANCH" ]]; then
  echo "repos.yaml debe definir org y branch" >&2
  exit 1
fi

clone_repo() {
  local name="$1"
  local path="$2"
  local url="https://github.com/${ORG}/${name}.git"
  local target="${ROOT}/${path}"

  mkdir -p "$(dirname "$target")"

  if [[ -d "${target}/.git" ]]; then
    echo "[skip] ${path} (ya clonado)"
    return 0
  fi

  if [[ -d "$target" && -n "$(ls -A "$target" 2>/dev/null)" ]]; then
    echo "[warn] ${path} existe pero no es un repo git. Omite o elimina la carpeta manualmente." >&2
    return 1
  fi

  echo "[clone] ${url} -> ${path}"
  git clone --branch "$BRANCH" "$url" "$target"
}

parse_section() {
  local section="$1"
  awk -v section="$section" '
    $0 ~ "^" section ":$" { in_section=1; next }
    /^optional:$/ { if (section == "repos") in_section=0 }
    /^repos:$/ { if (section == "optional") in_section=0 }
    in_section && /^  - name:/ { name=$3; next }
    in_section && /^    path:/ { print name " " $2; next }
  ' "$MANIFEST"
}

cd "$ROOT"

echo "Organizacion: ${ORG}"
echo "Rama: ${BRANCH}"
echo ""

while read -r name path; do
  [[ -z "$name" || -z "$path" ]] && continue
  clone_repo "$name" "$path"
done < <(parse_section repos)

if [[ "$WITH_PG" == true ]]; then
  while read -r name path; do
    [[ -z "$name" || -z "$path" ]] && continue
    clone_repo "$name" "$path"
  done < <(parse_section optional)
fi

echo ""
echo "Bootstrap completado."
echo "Siguiente paso:"
echo "  cp .env.docker.example .env.docker"
echo "  docker compose --env-file .env.docker up --build"
