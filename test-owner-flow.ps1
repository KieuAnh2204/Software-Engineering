# TEST OWNER ONBOARDING FLOW
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TESTING 3-STEP OWNER ONBOARDING FLOW" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# STEP 1: Register Owner
Write-Host "STEP 1: Register Owner Account" -ForegroundColor Green
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$body1 = @{
  email = "pizzaowner$timestamp@test.com"
  password = "pizza123"
  username = "pizzaowner$timestamp"
  name = "Pizza House Owner"
  logo_url = "https://example.com/pizza-logo.jpg"
} | ConvertTo-Json

try {
  $response1 = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register/owner" -Method POST -Body $body1 -ContentType "application/json"
  Write-Host "✅ SUCCESS!" -ForegroundColor Green
  Write-Host "   Token: $($response1.token.Substring(0,20))..." -ForegroundColor Cyan
  Write-Host "   Owner ID: $($response1.owner._id)" -ForegroundColor Cyan
  
  $ownerId = $response1.owner._id
  $token = $response1.token
} catch {
  Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

# STEP 2: Create Restaurant
Write-Host "`nSTEP 2: Create Restaurant" -ForegroundColor Green
$body2 = @{
  owner_id = $ownerId
  name = "Pizza House $timestamp"
  description = "Best pizza in town"
  address = "123 Nguyen Hue, District 1"
  phone = "0909999999"
  open_time = "08:00"
  close_time = "22:00"
} | ConvertTo-Json

$headers = @{
  Authorization = "Bearer $token"
}

try {
  $response2 = Invoke-RestMethod -Uri "http://localhost:3003/api/restaurants" -Method POST -Body $body2 -ContentType "application/json" -Headers $headers
  Write-Host "✅ SUCCESS!" -ForegroundColor Green
  Write-Host "   Restaurant ID: $($response2._id)" -ForegroundColor Cyan
  Write-Host "   Restaurant Name: $($response2.name)" -ForegroundColor Cyan
} catch {
  Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

# STEP 3: Owner Login
Write-Host "`nSTEP 3: Owner Login" -ForegroundColor Green
$body3 = @{
  email = "pizzaowner$timestamp@test.com"
  password = "pizza123"
} | ConvertTo-Json

try {
  $response3 = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login/owner" -Method POST -Body $body3 -ContentType "application/json"
  Write-Host "✅ SUCCESS!" -ForegroundColor Green
  Write-Host "   Token: $($response3.token.Substring(0,20))..." -ForegroundColor Cyan
  Write-Host "   Owner: $($response3.owner.display_name)" -ForegroundColor Cyan
} catch {
  Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
