#!/bin/bash

echo "Installing MongoDB Community Edition..."

# Import MongoDB public GPG key (modern method)
echo "Step 1: Importing MongoDB GPG key..."
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

# Add MongoDB repository
echo "Step 2: Adding MongoDB repository..."
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
echo "Step 3: Updating package list..."
sudo apt-get update

# Install MongoDB
echo "Step 4: Installing MongoDB..."
sudo apt-get install -y mongodb-org

# Start MongoDB service
echo "Step 5: Starting MongoDB service..."
sudo systemctl start mongod
sudo systemctl enable mongod

# Check MongoDB status
echo "Step 6: Checking MongoDB status..."
sudo systemctl status mongod --no-pager

echo ""
echo "MongoDB installation complete!"
echo "MongoDB should now be running on mongodb://localhost:27017"

