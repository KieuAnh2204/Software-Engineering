param(
  [string]$BaseUrl = "http://localhost:3003"
)

Write-Host "Seeding products to $BaseUrl..."

$products = @(
  @{ name = "Pizza Margherita"; description = "Classic Italian pizza with tomato and mozzarella"; price = 12.99; category = "main"; restaurantId = "507f1f77bcf86cd799439011"; image = "default-product.jpg"; available = $true; preparationTime = 20 },
  @{ name = "Spaghetti Carbonara"; description = "Creamy pasta with bacon"; price = 10.99; category = "main"; restaurantId = "507f1f77bcf86cd799439011"; image = "default-product.jpg"; available = $true; preparationTime = 15 },
  @{ name = "Caesar Salad"; description = "Fresh salad with caesar dressing"; price = 7.99; category = "appetizer"; restaurantId = "507f1f77bcf86cd799439011"; image = "default-product.jpg"; available = $true; preparationTime = 10 },
  @{ name = "Tiramisu"; description = "Italian dessert with coffee"; price = 5.99; category = "dessert"; restaurantId = "507f1f77bcf86cd799439011"; image = "default-product.jpg"; available = $true; preparationTime = 5 },
  @{ name = "Beef Burger"; description = "Juicy beef burger with cheese"; price = 9.99; category = "main"; restaurantId = "507f1f77bcf86cd799439011"; image = "default-product.jpg"; available = $true; preparationTime = 15 },
  @{ name = "Caesar Salad"; description = "Fresh salad with dressing"; price = 6.99; category = "appetizer"; restaurantId = "507f1f77bcf86cd799439011"; image = "default-product.jpg"; available = $true; preparationTime = 8 }
)

foreach ($p in $products) {
  try {
    $resp = Invoke-RestMethod -Uri "$BaseUrl/api/products" -Method Post -ContentType 'application/json' -Body ($p | ConvertTo-Json -Depth 5)
    Write-Host "Created: $($resp.data.name) -> $($resp.data._id)" -ForegroundColor Green
  } catch {
    Write-Warning $_
  }
}

Write-Host "Done seeding."