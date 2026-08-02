#!/bin/bash
echo "=== NGINX ACCESS LOG - TOP IPs ==="
cat /var/log/nginx/access.log 2>/dev/null | awk '{print $1}' | sort | uniq -c | sort -rn | head -20

echo ""
echo "=== NGINX ACCESS LOG - TOP REQUESTED URLs ==="
cat /var/log/nginx/access.log 2>/dev/null | awk '{print $7}' | sort | uniq -c | sort -rn | head -30

echo ""
echo "=== NGINX ACCESS LOG - TOP User-Agents ==="
cat /var/log/nginx/access.log 2>/dev/null | awk -F'"' '{print $6}' | sort | uniq -c | sort -rn | head -20

echo ""
echo "=== NGINX ACCESS LOG SIZE ==="
ls -lh /var/log/nginx/access.log 2>/dev/null

echo ""
echo "=== TOTAL REQUESTS (access.log) ==="
wc -l /var/log/nginx/access.log 2>/dev/null

echo ""
echo "=== VIDEOS FOLDER SIZE ==="
du -sh /var/www/videos 2>/dev/null || echo "No /var/www/videos"

echo ""
echo "=== DOCKER CONTAINERS ==="
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null

echo ""
echo "=== DOCKER CONTAINER LOGS (last 50) ==="
docker logs --tail 50 mastaba-v4-container 2>/dev/null || echo "No container logs"

echo ""
echo "=== ACTIVE CONNECTIONS ==="
ss -s 2>/dev/null

echo ""
echo "=== NGINX SITES ENABLED ==="
ls -la /etc/nginx/sites-enabled/ 2>/dev/null

echo ""
echo "=== NGINX SITE CONFIG ==="
cat /etc/nginx/sites-enabled/default 2>/dev/null || cat /etc/nginx/sites-enabled/mastaba 2>/dev/null || echo "checking all configs..."
for f in /etc/nginx/sites-enabled/*; do echo "--- $f ---"; cat "$f" 2>/dev/null; done

echo ""
echo "=== LARGE FILES ON DISK ==="
find / -type f -size +100M -exec ls -lh {} \; 2>/dev/null | head -20

echo ""
echo "=== BANDWIDTH BY RESPONSE SIZE (top URLs by bytes) ==="
cat /var/log/nginx/access.log 2>/dev/null | awk '{sum[$7]+=$10} END {for (url in sum) printf "%10d %s\n", sum[url], url}' | sort -rn | head -20

echo ""
echo "=== REQUESTS PER HOUR TODAY ==="
cat /var/log/nginx/access.log 2>/dev/null | awk '{print $4}' | cut -d: -f1-2 | uniq -c | tail -24

echo ""
echo "=== HTTP STATUS CODES ==="
cat /var/log/nginx/access.log 2>/dev/null | awk '{print $9}' | sort | uniq -c | sort -rn | head -10

echo ""
echo "=== CHECK FOR ROTATED LOGS ==="
ls -lh /var/log/nginx/ 2>/dev/null
