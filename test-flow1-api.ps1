# Test Flow 1: Restaurant Registration & Menu Management
# Script to test all APIs for Flow 1

Write-Host "🧪 Testing Flow 1: Restaurant Registration & Menu Management" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Base URLs
$USER_SERVICE = "http://localhost:3001"
$PRODUCT_SERVICE = "http://localhost:3003"

# Variables to store data
$script:authToken = ""
$script:userId = ""
$script:brandId = ""
$script:restaurantId = ""
$script:categoryId = ""
$script:dishId = ""

# Helper function to display results
function Show-Result {
    param(
        [string]$Step,
        [bool]$Success,
        [object]$Response
    )
    
    if ($Success) {
        Write-Host "✅ $Step" -ForegroundColor Green
        Write-Host "   Response: $($Response | ConvertTo-Json -Depth 2 -Compress)" -ForegroundColor Gray
    } else {
        Write-Host "❌ $Step" -ForegroundColor Red
        Write-Host "   Error: $Response" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 1: Register Brand Manager
Write-Host "1️⃣  Testing: Register Brand Manager..." -ForegroundColor Yellow
try {
    $registerBody = @{
        username = "test_brand_manager_$(Get-Random -Maximum 9999)"
        email = "test$(Get-Random -Maximum 9999)@example.com"
        password = "123456"
        fullName = "Test Brand Manager"
        phone = "0901234567"
        role = "BRAND_MANAGER"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$USER_SERVICE/api/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $registerBody

    $script:authToken = $response.data.token
    $script:userId = $response.data.user.id
    
    Show-Result "Register Brand Manager" $true $response
    Write-Host "   💾 Saved: authToken, userId" -ForegroundColor Cyan
} catch {
    Show-Result "Register Brand Manager" $false $_.Exception.Message
    exit 1
}

# Test 2A: Create Brand (for chain scenario)
Write-Host "2️⃣  Testing: Create Brand (Chain Scenario)..." -ForegroundColor Yellow
try {
    $brandBody = @{
        name = "Test Chain Restaurant"
        description = "Test chain description"
        logo = "https://example.com/logo.png"
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $script:authToken"
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "$USER_SERVICE/api/brands" `
        -Method Post `
        -Headers $headers `
        -Body $brandBody

    $script:brandId = $response.data._id
    
    Show-Result "Create Brand" $true $response
    Write-Host "   💾 Saved: brandId = $script:brandId" -ForegroundColor Cyan
} catch {
    Show-Result "Create Brand" $false $_.Exception.Message
    exit 1
}

# Test 2B: Create Restaurant with brandId (Chain Branch 1)
Write-Host "3️⃣  Testing: Create Restaurant - Branch 1 (With brandId)..." -ForegroundColor Yellow
try {
    $restaurantBody = @{
        name = "Test Chain - Branch 1"
        brandId = $script:brandId
        address = @{
            street = "123 Test Street"
            ward = "Ward 1"
            district = "District 1"
            city = "Ho Chi Minh"
        }
        phone = "0281234567"
        email = "branch1@test.com"
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $script:authToken"
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "$USER_SERVICE/api/restaurants" `
        -Method Post `
        -Headers $headers `
        -Body $restaurantBody

    $script:restaurantId = $response.data._id
    
    Show-Result "Create Restaurant - Branch 1" $true $response
    Write-Host "   💾 Saved: restaurantId = $script:restaurantId" -ForegroundColor Cyan
} catch {
    Show-Result "Create Restaurant - Branch 1" $false $_.Exception.Message
    exit 1
}

# Test 3: Create Category
Write-Host "4️⃣  Testing: Create Category..." -ForegroundColor Yellow
try {
    $categoryBody = @{
        name = "Test Category - Pho"
        description = "Vietnamese noodle soup"
        restaurantId = $script:restaurantId
        displayOrder = 1
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $script:authToken"
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "$PRODUCT_SERVICE/api/categories" `
        -Method Post `
        -Headers $headers `
        -Body $categoryBody

    $script:categoryId = $response.data._id
    
    Show-Result "Create Category" $true $response
    Write-Host "   💾 Saved: categoryId = $script:categoryId" -ForegroundColor Cyan
} catch {
    Show-Result "Create Category" $false $_.Exception.Message
    exit 1
}

# Test 4: Create Dish
Write-Host "5️⃣  Testing: Create Dish..." -ForegroundColor Yellow
try {
    $dishBody = @{
        name = "Pho Bo"
        description = "Beef noodle soup"
        price = 50000
        categoryId = $script:categoryId
        restaurantId = $script:restaurantId
        images = @("https://example.com/pho.jpg")
        preparationTime = 15
        unit = "bowl"
        tags = @("pho", "beef", "noodle")
        isAvailable = $true
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $script:authToken"
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "$PRODUCT_SERVICE/api/dishes" `
        -Method Post `
        -Headers $headers `
        -Body $dishBody

    $script:dishId = $response.data._id
    
    Show-Result "Create Dish" $true $response
    Write-Host "   💾 Saved: dishId = $script:dishId" -ForegroundColor Cyan
} catch {
    Show-Result "Create Dish" $false $_.Exception.Message
    exit 1
}

# Test 5: Get Brands
Write-Host "6️⃣  Testing: Get Brands..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $script:authToken"
    }

    $response = Invoke-RestMethod -Uri "$USER_SERVICE/api/brands" `
        -Method Get `
        -Headers $headers

    Show-Result "Get Brands" $true $response
} catch {
    Show-Result "Get Brands" $false $_.Exception.Message
}

# Test 6: Get Restaurants by Brand
Write-Host "7️⃣  Testing: Get Restaurants by Brand..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$USER_SERVICE/api/restaurants?brandId=$script:brandId" `
        -Method Get

    Show-Result "Get Restaurants by Brand" $true $response
} catch {
    Show-Result "Get Restaurants by Brand" $false $_.Exception.Message
}

# Test 7: Get Categories by Restaurant
Write-Host "8️⃣  Testing: Get Categories by Restaurant..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$PRODUCT_SERVICE/api/categories?restaurantId=$script:restaurantId" `
        -Method Get

    Show-Result "Get Categories by Restaurant" $true $response
} catch {
    Show-Result "Get Categories by Restaurant" $false $_.Exception.Message
}

# Test 8: Get Dishes by Restaurant
Write-Host "9️⃣  Testing: Get Dishes by Restaurant..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$PRODUCT_SERVICE/api/dishes?restaurantId=$script:restaurantId" `
        -Method Get

    Show-Result "Get Dishes by Restaurant" $true $response
} catch {
    Show-Result "Get Dishes by Restaurant" $false $_.Exception.Message
}

# Test 9: Search Dishes
Write-Host "🔟 Testing: Search Dishes..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$PRODUCT_SERVICE/api/dishes/search?keyword=pho&restaurantId=$script:restaurantId" `
        -Method Get

    Show-Result "Search Dishes" $true $response
} catch {
    Show-Result "Search Dishes" $false $_.Exception.Message
}

# Test 10: Update Dish
Write-Host "1️⃣1️⃣  Testing: Update Dish..." -ForegroundColor Yellow
try {
    $updateBody = @{
        price = 55000
        description = "Beef noodle soup - Updated price"
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $script:authToken"
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "$PRODUCT_SERVICE/api/dishes/$script:dishId" `
        -Method Put `
        -Headers $headers `
        -Body $updateBody

    Show-Result "Update Dish" $true $response
} catch {
    Show-Result "Update Dish" $false $_.Exception.Message
}

# Test 11: Check Restaurant Ownership (Internal API)
Write-Host "1️⃣2️⃣  Testing: Check Restaurant Ownership..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$USER_SERVICE/api/restaurants/$script:restaurantId/check-owner?user_id=$script:userId" `
        -Method Get

    Show-Result "Check Restaurant Ownership" $true $response
} catch {
    Show-Result "Check Restaurant Ownership" $false $_.Exception.Message
}

# Summary
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "✅ Flow 1 Testing Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Test Summary:" -ForegroundColor Cyan
Write-Host "   • User ID:        $script:userId" -ForegroundColor White
Write-Host "   • Brand ID:       $script:brandId" -ForegroundColor White
Write-Host "   • Restaurant ID:  $script:restaurantId" -ForegroundColor White
Write-Host "   • Category ID:    $script:categoryId" -ForegroundColor White
Write-Host "   • Dish ID:        $script:dishId" -ForegroundColor White
Write-Host ""
Write-Host "🎯 All tests completed successfully!" -ForegroundColor Green
Write-Host ""

# Test Flow 1 - Simple Scenario
Write-Host "Testing Flow 1: Simple Restaurant (Auto Brand Creation)" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

$USER_SERVICE = "http://localhost:3001"
$PRODUCT_SERVICE = "http://localhost:3003"

$authToken = ""
$userId = ""
$restaurantId = ""
$brandId = ""
$categoryId = ""
$dishId = ""

function Show-Result {
    param([string]$Step, [bool]$Success, [object]$Response)
    
    if ($Success) {
        Write-Host "[OK] $Step" -ForegroundColor Green
        Write-Host "     $($Response | ConvertTo-Json -Depth 2 -Compress)" -ForegroundColor Gray
    } else {
        Write-Host "[FAIL] $Step" -ForegroundColor Red
        Write-Host "       Error: $Response" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 1: Register
Write-Host "Step 1: Register Brand Manager..." -ForegroundColor Yellow
try {
    $body = @{
        username = "simple_owner_$(Get-Random -Maximum 9999)"
        email = "simple$(Get-Random -Maximum 9999)@example.com"
        password = "123456"
        fullName = "Simple Restaurant Owner"
        phone = "0909999999"
        role = "BRAND_MANAGER"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$USER_SERVICE/api/auth/register" -Method Post -ContentType "application/json" -Body $body
    $authToken = $response.data.token
    $userId = $response.data.user.id
    
    Show-Result "Register" $true $response
    Write-Host "     Token: $($authToken.Substring(0,20))..." -ForegroundColor Cyan
} catch {
    Show-Result "Register" $false $_.Exception.Message
    exit 1
}

# Test 2: Create Restaurant
Write-Host "Step 2: Create Restaurant (Auto Brand)..." -ForegroundColor Yellow
try {
    $body = @{
        name = "Pho Ba Lan"
        address = @{
            street = "45 Le Van Sy"
            ward = "Ward 12"
            district = "District 3"
            city = "Ho Chi Minh"
        }
        phone = "0281234567"
        email = "balan@example.com"
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $authToken"
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "$USER_SERVICE/api/restaurants" -Method Post -Headers $headers -Body $body
    $restaurantId = $response.data._id
    $brandId = $response.data.brandId._id
    
    Show-Result "Create Restaurant" $true $response
    Write-Host "     Restaurant ID: $restaurantId" -ForegroundColor Cyan
    Write-Host "     Brand ID (Auto): $brandId" -ForegroundColor Cyan
} catch {
    Show-Result "Create Restaurant" $false $_.Exception.Message
    exit 1
}

# Test 3: Create Category
Write-Host "Step 3: Create Category..." -ForegroundColor Yellow
try {
    $body = @{
        name = "Pho"
        description = "Vietnamese noodle soup"
        restaurantId = $restaurantId
        displayOrder = 1
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $authToken"
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "$PRODUCT_SERVICE/api/categories" -Method Post -Headers $headers -Body $body
    $categoryId = $response.data._id
    
    Show-Result "Create Category" $true $response
    Write-Host "     Category ID: $categoryId" -ForegroundColor Cyan
} catch {
    Show-Result "Create Category" $false $_.Exception.Message
    exit 1
}

# Test 4: Create Dish
Write-Host "Step 4: Create Dish..." -ForegroundColor Yellow
try {
    $body = @{
        name = "Pho Tai"
        description = "Beef noodle with rare beef"
        price = 50000
        categoryId = $categoryId
        restaurantId = $restaurantId
        images = @("https://example.com/pho-tai.jpg")
        preparationTime = 15
        unit = "bowl"
        tags = @("pho", "beef", "tai")
        isAvailable = $true
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $authToken"
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "$PRODUCT_SERVICE/api/dishes" -Method Post -Headers $headers -Body $body
    $dishId = $response.data._id
    
    Show-Result "Create Dish" $true $response
    Write-Host "     Dish ID: $dishId" -ForegroundColor Cyan
} catch {
    Show-Result "Create Dish" $false $_.Exception.Message
    exit 1
}

# Test 5: Get Dishes
Write-Host "Step 5: Get Dishes..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$PRODUCT_SERVICE/api/dishes?restaurantId=$restaurantId" -Method Get
    Show-Result "Get Dishes" $true $response
    Write-Host "     Total dishes: $($response.data.Count)" -ForegroundColor Cyan
} catch {
    Show-Result "Get Dishes" $false $_.Exception.Message
}

# Summary
Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Created Resources:" -ForegroundColor Cyan
Write-Host "  User ID:        $userId" -ForegroundColor White
Write-Host "  Brand ID:       $brandId (Auto-created)" -ForegroundColor White
Write-Host "  Restaurant ID:  $restaurantId" -ForegroundColor White
Write-Host "  Category ID:    $categoryId" -ForegroundColor White
Write-Host "  Dish ID:        $dishId" -ForegroundColor White
Write-Host ""
