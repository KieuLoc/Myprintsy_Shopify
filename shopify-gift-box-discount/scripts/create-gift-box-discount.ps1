# Tao automatic discount cho Gift box tier 2 tren store LIVE.
# Partner app KHONG dung client_credentials tren paid store -> dung OAuth code (1 lan).
#
# Chay:
#   cd shopify-gift-box-discount
#   .\scripts\create-gift-box-discount.ps1

$ErrorActionPreference = "Stop"

$clientId = "9d8e6652e7c277350e62bc2ecff165bc"
$shop = "myprintsy-3"
$redirectUri = "https://shopify.dev/apps/default-app-home/api/auth"
$scope = "write_discounts,read_products"

Write-Host ""
Write-Host "=== Gift box discount setup (OAuth one-time) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Luu y: Partner app tren store LIVE khong dung client_credentials." -ForegroundColor Yellow
Write-Host "Can lay authorization code qua trinh duyet (1 lan)." -ForegroundColor Yellow
Write-Host ""

$clientSecret = Read-Host "Dan Client secret tu Dev Dashboard (Settings - Credentials)"

$authUrl = ('https://{0}.myshopify.com/admin/oauth/authorize?client_id={1}&scope={2}&redirect_uri={3}' -f `
  $shop, $clientId, $scope, [uri]::EscapeDataString($redirectUri))

Write-Host ""
Write-Host "[1/3] Mo link nay (da login Admin myprintsy-3):" -ForegroundColor Cyan
Write-Host $authUrl
Write-Host ""
Write-Host "Sau khi approve, trinh duyet redirect sang shopify.dev - copy tham so 'code' tren URL." -ForegroundColor Yellow
Write-Host 'Vi du: .../api/auth?code=abc123&hmac=...' -ForegroundColor DarkGray
Write-Host ""

$code = Read-Host "Dan authorization code vao day"

Write-Host ""
Write-Host "[2/3] Doi code lay access token..." -ForegroundColor Cyan

$tokenBody = ('client_id={0}&client_secret={1}&code={2}' -f $clientId, $clientSecret, $code)
try {
  $tokenResp = Invoke-RestMethod `
    -Uri "https://$shop.myshopify.com/admin/oauth/access_token" `
    -Method POST `
    -ContentType "application/x-www-form-urlencoded" `
    -Body $tokenBody
} catch {
  Write-Host "Loi lay token:" -ForegroundColor Red
  if ($_.Exception.Response) {
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    Write-Host $reader.ReadToEnd()
  } else {
    Write-Host $_.Exception.Message
  }
  exit 1
}

$token = $tokenResp.access_token
if (-not $token) {
  Write-Host "Khong co access_token trong response." -ForegroundColor Red
  $tokenResp | ConvertTo-Json -Depth 5
  exit 1
}

Write-Host "Token OK. Scope:" $tokenResp.scope

Write-Host ""
Write-Host "[3/3] Tao automatic discount..." -ForegroundColor Cyan

$gqlBody = @{
  query = @'
mutation {
  discountAutomaticAppCreate(
    automaticAppDiscount: {
      title: "Gift box bundle pricing"
      functionHandle: "gift-box-tier-discount"
      discountClasses: [PRODUCT]
      startsAt: "2026-06-13T00:00:00Z"
    }
  ) {
    automaticAppDiscount {
      discountId
      title
      status
    }
    userErrors {
      field
      message
    }
  }
}
'@
} | ConvertTo-Json -Compress

$result = Invoke-RestMethod `
  -Uri "https://$shop.myshopify.com/admin/api/2026-04/graphql.json" `
  -Method POST `
  -Headers @{
    "X-Shopify-Access-Token" = $token
    "Content-Type"           = "application/json"
  } `
  -Body $gqlBody

$result | ConvertTo-Json -Depth 10

$errors = $result.data.discountAutomaticAppCreate.userErrors
if ($errors -and $errors.Count -gt 0) {
  Write-Host ""
  Write-Host "GraphQL userErrors - xem tren." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "=== XONG ===" -ForegroundColor Green
Write-Host "Admin -> Discounts -> kiem tra 'Gift box bundle pricing' (Active)"
Write-Host "Test checkout: gift box qty 5 = `$17.99"
