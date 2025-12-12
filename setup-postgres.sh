#!/bin/bash
# PostgreSQL Setup Script for Production VM

set -e

echo "🐘 Setting up PostgreSQL on the VM..."

# Install PostgreSQL if not already installed
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL..."
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
else
    echo "✅ PostgreSQL is already installed"
fi

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
echo "Creating database and user..."
sudo -u postgres psql <<EOF
-- Create user if not exists
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'Sync') THEN
    CREATE USER "Sync" WITH PASSWORD 'Sync2024ProductionDB9876SecurePass';
  END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE "Sync"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'Sync')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE "Sync" TO "Sync";
ALTER DATABASE "Sync" OWNER TO "Sync";
EOF

# Configure PostgreSQL to accept connections from Docker containers
echo "Configuring PostgreSQL..."
PG_VERSION=$(psql --version | awk '{print $3}' | cut -d. -f1)
PG_CONF="/etc/postgresql/$PG_VERSION/main/postgresql.conf"
PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"

# Backup original files
sudo cp "$PG_CONF" "$PG_CONF.backup"
sudo cp "$PG_HBA" "$PG_HBA.backup"

# Update postgresql.conf to listen on localhost
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" "$PG_CONF"

# Add host-based authentication for local connections
if ! sudo grep -q "host.*Sync.*Sync.*127.0.0.1/32.*scram-sha-256" "$PG_HBA"; then
    echo "host    Sync            Sync            127.0.0.1/32            scram-sha-256" | sudo tee -a "$PG_HBA"
fi

# Restart PostgreSQL
sudo systemctl restart postgresql

echo "✅ PostgreSQL setup complete!"
echo ""
echo "Database: Sync"
echo "User: Sync"
echo "Host: localhost"
echo "Port: 5432"
echo ""
echo "Test connection with:"
echo "psql -h localhost -U Sync -d Sync"
