#!/usr/bin/env bash
# Runs an .sql file directly against the database. 
# Specifically designed to go around the SQL Editor's size limit, 
# Ask you to enter y/n prompt then retype the database password from DATABASE_URL, so you can be super 100% for real sure.
#
# Usage: npm run db:run-sql -- path/to/file.sql
set -euo pipefail

cd "$(dirname "$0")/.." # repo root, regardless of where this is invoked from

if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
    echo "Set DATABASE_URL in .env first (see .env.example), the Session pooler URI from" >&2
    echo "Supabase Dashboard -> Connect -> Session pooler." >&2
    exit 1
fi

file="${1:-}"
if [ -z "$file" ]; then
    echo "Usage: npm run db:run-sql -- path/to/file.sql" >&2
    exit 1
fi
if [ ! -f "$file" ]; then
    echo "No such file: $file" >&2
    exit 1
fi

RED=$'\033[1;31m'
BOLD=$'\033[1m'
RESET=$'\033[0m'

# Supabase connection strings encode the project ref (not the human-chosen project name, which
# isn't in the URL at all, only the Management API knows it) as postgres.<ref> in the username.
project_ref=$(echo "$DATABASE_URL" | sed -nE 's#^[a-zA-Z]+://[^:]*\.([a-zA-Z0-9]+):.*#\1#p')
db_password=$(echo "$DATABASE_URL" | sed -nE 's#^[a-zA-Z]+://[^:]*:([^@]*)@.*#\1#p')

echo "${RED}${BOLD}================================ DANGER ================================${RESET}"
echo "${RED}About to run an arbitrary SQL file DIRECTLY against a live database.${RESET}"
echo "${RED}There is no undo if this modifies or deletes data.${RESET}"
echo "${RED}"
echo "${RED}  File:        ${BOLD}${file}${RESET}"
if [ -n "$project_ref" ]; then
    echo "${RED}  Project ref: ${BOLD}${project_ref}${RESET} ${RED}(check this against your Supabase dashboard URL)${RESET}"
else
    echo "${RED}  Project ref: ${BOLD}could not be parsed from DATABASE_URL${RESET}"
fi
echo "${RED}==========================================================================${RESET}"
echo

read -rp "Type 'y' to continue, anything else cancels: " confirm
if [ "$confirm" != "y" ]; then
    echo "Cancelled."
    exit 1
fi

if [ -z "$db_password" ]; then
    echo "Could not parse a password out of DATABASE_URL, so the password re-entry check below" >&2
    echo "can't run. Fix DATABASE_URL's format first rather than skip this safety check." >&2
    exit 1
fi

read -rsp "To confirm, paste the database password from your connection string: " typed_password
echo
if [ "$typed_password" != "$db_password" ]; then
    echo "${RED}Password did not match. Cancelled.${RESET}" >&2
    exit 1
fi

echo "Running $file ..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"
echo "Done."
