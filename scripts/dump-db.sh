#!/usr/bin/env bash
# Dumps the Supabase Postgres DB to a timestamped file in backups/.
# Requires DATABASE_URL in .env - see the "Database Backups" section in .env.example.
set -euo pipefail

cd "$(dirname "$0")/.." # repo root, regardless of where this is invoked from

if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
    echo "Set DATABASE_URL in .env first (see .env.example) - the Session pooler URI from" >&2
    echo "Supabase Dashboard -> Connect -> Session pooler." >&2
    exit 1
fi

mkdir -p backups
out="backups/backup_$(date +%Y%m%d_%H%M%S).sql"

echo "Dumping database to $out ..."

# pg_dump --verbose prints a line per table/sequence as it goes (to stderr, so it won't end up in
# the dump file), but a single huge table can still go quiet for a while - this heartbeat pings
# every 10s on top of that, so a slow dump never looks like it's just frozen.
(
    while true; do
        sleep 10
        echo "  ...still dumping ($(date +%H:%M:%S))"
    done
) &
heartbeat_pid=$!
trap 'kill "$heartbeat_pid" 2>/dev/null' EXIT

pg_dump "$DATABASE_URL" --verbose --file "$out"

echo "Done: $out ($(du -h "$out" | cut -f1))"
