#!/usr/bin/env bash
set -euo pipefail

# reset_mysql_root_password.sh (copy inside zenith workspace)
# Safely attempt to reset the local MySQL root password for a Homebrew-installed MySQL on macOS.
# WARNING: This script will stop the Homebrew MySQL service, start a temporary server with
# --skip-grant-tables, change the root password, then restart the brew service.
# Use at your own risk and review before running.

NEW_PASSWORD='P@ssw0rdZenith2025!'

echo "🔐 Reset MySQL root password script"

# Find Homebrew prefix (if available)
BREW_PREFIX=""
if command -v brew >/dev/null 2>&1; then
  BREW_PREFIX=$(brew --prefix)
  echo "Homebrew prefix: $BREW_PREFIX"
fi

# Candidate mysql formula prefixes
CANDIDATES=()
if [ -n "$BREW_PREFIX" ]; then
  CANDIDATES+=("$BREW_PREFIX/opt/mysql" "$BREW_PREFIX/opt/mysql@8.0" "$BREW_PREFIX/opt/mysql@5.7" "$BREW_PREFIX/opt/mariadb")
fi
CANDIDATES+=("/usr/local/opt/mysql" "/opt/homebrew/opt/mysql" "/usr/local/mysql")

MYSQL_PREFIX=""
for p in "${CANDIDATES[@]}"; do
  if [ -d "$p" ]; then
    MYSQL_PREFIX="$p"
    break
  fi
done

# Locate binaries
MYSQL_BIN="$(command -v mysql || true)"
MYSQLADMIN_BIN="$(command -v mysqladmin || true)"
MYSQLD_SAFE_BIN="$(command -v mysqld_safe || true)"
MYSQLD_BIN="$(command -v mysqld || true)"
if [ -n "$MYSQL_PREFIX" ]; then
  [ -x "$MYSQL_PREFIX/bin/mysql" ] && MYSQL_BIN="$MYSQL_PREFIX/bin/mysql"
  [ -x "$MYSQL_PREFIX/bin/mysqladmin" ] && MYSQLADMIN_BIN="$MYSQL_PREFIX/bin/mysqladmin"
  [ -x "$MYSQL_PREFIX/bin/mysqld_safe" ] && MYSQLD_SAFE_BIN="$MYSQL_PREFIX/bin/mysqld_safe"
  [ -x "$MYSQL_PREFIX/bin/mysqld" ] && MYSQLD_BIN="$MYSQL_PREFIX/bin/mysqld"
fi

echo "mysql: ${MYSQL_BIN:-(not found)}"
echo "mysqladmin: ${MYSQLADMIN_BIN:-(not found)}"
echo "mysqld_safe: ${MYSQLD_SAFE_BIN:-(not found)}"

if [ -z "$MYSQL_BIN" ] || [ -z "$MYSQLADMIN_BIN" ]; then
  echo "Could not find mysql/mysqladmin client. Ensure MySQL is installed (Homebrew or system)."
  exit 1
fi

echo "Stopping Homebrew MySQL service (if running)..."
brew services stop mysql 2>/dev/null || brew services stop mysql@8.0 2>/dev/null || brew services stop mariadb 2>/dev/null || true

# Ensure no stray mysqld processes remain (mysqld_safe will refuse to start if one exists)
echo "Checking for stray mysqld processes..."
PIDS=$(pgrep -f mysqld || true)
if [ -n "$PIDS" ]; then
  echo "Found existing mysqld processes: $PIDS — attempting graceful shutdown..."
  # Try mysqladmin shutdown first (may fail if we don't know the password)
  if [ -x "$MYSQLADMIN_BIN" ]; then
    "$MYSQLADMIN_BIN" shutdown 2>/dev/null || true
  fi
  # Force-kill remaining processes
  for pid in $PIDS; do
    echo "Killing pid $pid"
    kill "$pid" 2>/dev/null || true
  done
  sleep 1
fi

# Start a temporary server with disabled grants
STARTED_TMP=0
if [ -n "$MYSQLD_SAFE_BIN" ] && [ -x "$MYSQLD_SAFE_BIN" ]; then
  echo "Starting temporary mysqld_safe (no grant tables, no networking)..."
  "$MYSQLD_SAFE_BIN" --skip-grant-tables --skip-networking > /tmp/mysqld_safe.log 2>&1 &
  TMP_PID=$!
  STARTED_TMP=1
elif [ -n "$MYSQLD_BIN" ] && [ -x "$MYSQLD_BIN" ]; then
  echo "Starting temporary mysqld (no grant tables, no networking)..."
  "$MYSQLD_BIN" --skip-grant-tables --skip-networking > /tmp/mysqld.log 2>&1 &
  TMP_PID=$!
  STARTED_TMP=1
else
  echo "Could not find mysqld_safe or mysqld binary to start a temporary server."
  echo "If MySQL is running you may be able to change the password without this temporary server."
  exit 1
fi

cleanup() {
  echo "Cleaning up: stopping temporary server and restarting brew service..."
  if [ "$STARTED_TMP" -eq 1 ] && [ -n "${TMP_PID:-}" ]; then
    kill "${TMP_PID}" 2>/dev/null || true
    sleep 1
  fi
  brew services start mysql 2>/dev/null || brew services start mysql@8.0 2>/dev/null || brew services start mariadb 2>/dev/null || true
}
trap cleanup EXIT

echo "Waiting for temporary MySQL to accept connections..."
RETRIES=0
MAX=30
while true; do
  if "$MYSQLADMIN_BIN" ping --silent >/dev/null 2>&1 || "$MYSQL_BIN" -e "SELECT 1;" >/dev/null 2>&1; then
    break
  fi
  sleep 1
  RETRIES=$((RETRIES+1))
  if [ $RETRIES -ge $MAX ]; then
    echo "Temporary MySQL did not come up within ${MAX}s. Check /tmp/mysqld_safe.log or /tmp/mysqld.log"
    tail -n +1 /tmp/mysqld_safe.log /tmp/mysqld.log 2>/dev/null || true
    exit 1
  fi
done

echo "Temporary MySQL is up — resetting root password..."

# Try modern ALTER USER first (MySQL 8+)
if "$MYSQL_BIN" -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY '${NEW_PASSWORD}';" >/dev/null 2>&1; then
  echo "ALTER USER succeeded (caching_sha2_password)."
else
  echo "ALTER USER (caching_sha2_password) failed — trying mysql_native_password..."
  if "$MYSQL_BIN" -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${NEW_PASSWORD}';" >/dev/null 2>&1; then
    echo "ALTER USER succeeded (mysql_native_password)."
  else
    echo "ALTER USER failed — attempting direct update to mysql.user (legacy fallback)"
    "$MYSQL_BIN" -u root -e "USE mysql; UPDATE user SET authentication_string=PASSWORD('${NEW_PASSWORD}') WHERE User='root' AND Host='localhost'; FLUSH PRIVILEGES;" || true
  fi
fi

echo "Verifying new root password..."
if "$MYSQL_BIN" -u root -p"${NEW_PASSWORD}" -e "SELECT 1;" >/dev/null 2>&1; then
  echo "✅ Root password reset successfully. New password: ${NEW_PASSWORD}"
else
  echo "⚠️ Could not verify root login with the new password. Check logs above."
  exit 1
fi

echo "All done — temporary server will be shut down and Homebrew service restarted."
