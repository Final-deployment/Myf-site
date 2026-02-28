#!/bin/bash
set -e

DOMAINS="muslimyouth.ps,www.muslimyouth.ps"
EMAIL="mohammadaydi93@gmail.com" # Using the admin email provided earlier

echo ">>> Installing Nginx, Certbot and plugin..."
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

echo ">>> Configuring Nginx for HTTP first..."
# Create a temporary config to allow Certbot's acme-challenge
cat <<EOF | sudo tee /etc/nginx/sites-available/scientific-bench
server {
    listen 80;
    server_name muslimyouth.ps www.muslimyouth.ps;
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/scientific-bench /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl reload nginx

echo ">>> Obtaining SSL certificate and configuring Nginx for HTTPS..."
# --nginx plugin will automatically modify the nginx config to add 443 and redirects
sudo certbot --nginx -d $DOMAINS --non-interactive --agree-tos -m $EMAIL --redirect

echo ">>> SSL Setup Complete!"
sudo systemctl reload nginx
