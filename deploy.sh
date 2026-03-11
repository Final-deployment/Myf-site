#!/bin/bash
set -e

APP_DIR="/var/www/apps/scientific-bench"
mkdir -p $APP_DIR
cd $APP_DIR

echo ">>> Unzipping updated application (Patch)..."
unzip -o deploy_production_latest.zip || true

echo ">>> Stopping old container if running..."
docker stop mastaba-v4-container 2>/dev/null || true
docker rm mastaba-v4-container 2>/dev/null || true

echo ">>> Removing old Docker image..."
docker rmi mastaba-v4-image 2>/dev/null || true

echo ">>> Building and starting Docker container..."
docker compose up -d --build

echo ">>> Configuring Nginx..."
cp nginx_app.conf /etc/nginx/sites-available/scientific-bench
ln -sf /etc/nginx/sites-available/scientific-bench /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo ">>> Reloading Nginx..."
nginx -t && systemctl reload nginx

echo ">>> Cleaning up..."
rm -f deploy_production_latest.zip

echo ">>> Deployment Complete!"
docker ps
