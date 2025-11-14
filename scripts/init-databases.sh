#!/bin/bash
set -e

# Script to create multiple databases in PostgreSQL container
# Used by docker-compose.yml

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create databases for each microservice
    CREATE DATABASE auth;
    CREATE DATABASE users;
    CREATE DATABASE data;
    CREATE DATABASE payments;

    -- Grant privileges
    GRANT ALL PRIVILEGES ON DATABASE auth TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE users TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE data TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE payments TO $POSTGRES_USER;

    -- Create extensions if needed
    \c auth;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    \c users;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    \c data;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    \c payments;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOSQL

echo "Multiple databases created successfully!"
