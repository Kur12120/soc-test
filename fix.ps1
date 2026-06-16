# Fix docker-compose.yml
$dc = Get-Content "docker-compose.yml" -Raw
$dc = $dc -replace 'VITE_API_BASE_URL:.*', 'VITE_API_BASE_URL: ${VITE_API_BASE_URL:-[127.0.0.1](http://127.0.0.1:3000/api})'
Set-Content "docker-compose.yml" -Encoding UTF8 -Value $dc
Write-Host "docker-compose.yml fixed"

# Fix .env
$env = Get-Content ".env" -Raw
$env = $env -replace 'VITE_API_BASE_URL=.*', 'VITE_API_BASE_URL=[127.0.0.1](http://127.0.0.1:3000/api)'
Set-Content ".env" -Encoding UTF8 -Value $env
Write-Host ".env fixed"

# Check users
docker exec -i soc-postgres psql -U postgres -d soc_management -c "SELECT full_name, email, role FROM users;"

# Restart
docker-compose down
docker-compose up -d

# Wait for startup
Write-Host "Waiting 25 seconds for containers to start..."
Start-Sleep -Seconds 25

# Test login
$body = '{"email":"admin@soc.local","password":"Admin123!"}'
curl.exe -X POST [127.0.0.1](http://127.0.0.1:3000/api/auth/login) -H "Content-Type: application/json" -d $body

# Show logs
docker logs soc-backend --tail 10
