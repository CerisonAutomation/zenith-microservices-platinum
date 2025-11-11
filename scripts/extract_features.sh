ALTER TABLE `pH7_Sessions'ADD COLUMN 'lastEditdate' timestamp NOT NULL DEFAULT '0000-00-00';
ALTER TABLE `pH7_Sessions'ADD COLUMN 'lasteditdate'timestamp NOT NULL DEFAULT'0000-00-00';

#!/bin/bash

# Get the current macOS user
USERNAME=$(whoami)

# Set your new MySQL root password here
NEW_PASSWORD='P '

echo "👤 macOS User: $USERNAME"
echo "🚧 Stopping MySQL service..."
brew services stop mysql

echo "🚀 Launching MySQL in safe mode (skip grant tables)..."
sudo /usr/local/opt/mysql/bin/mysqld_safe --skip-grant-tables &

echo "⏳ Waiting for MySQL safe mode..."
sleep 5

echo "🔐 Resetting MySQL root password..."
mysql -u root <<EOF
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${NEW_PASSWORD}';
FLUSH PRIVILEGES;
EOF

echo "🛑 Killing MySQL safe-mode process..."
sudo killall mysqld

echo "🔁 Restarting MySQL service..."
brew services start mysql

echo "✅ MySQL root password reset complete!"
echo "👤 macOS User: $USERNAME"
echo "🔑 New MySQL Password: ${NEW_PASSWORD}"
echo "🧪 Test with: mysql -u root -p"
