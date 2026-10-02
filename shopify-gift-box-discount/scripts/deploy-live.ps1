# Deploy Gift Box Tier Function
# Chay trong PowerShell (terminal RIENG):
#   Set-Location "d:\Shoppify\...\shopify-gift-box-discount"
#   .\scripts\deploy-live.ps1

$ErrorActionPreference = "Stop"
$AppRoot = Split-Path $PSScriptRoot -Parent
Set-Location $AppRoot

Write-Host "=== Myprintsy Gift Box Tier — deploy ===" -ForegroundColor Cyan
Write-Host "Folder: $AppRoot"

if ((Get-Content "shopify.app.toml" -Raw) -match "YOUR_CLIENT_ID") {
  Write-Host ""
  Write-Host "[1/2] App chua link Partner — mo wizard (chon org + tao/chon app)..." -ForegroundColor Yellow
  shopify app config link
}

Write-Host ""
Write-Host "[2/2] Build + deploy function..." -ForegroundColor Cyan
shopify app deploy --force

Write-Host ""
Write-Host "=== XONG DEPLOY — lam tiep tren Admin LIVE ===" -ForegroundColor Green
Write-Host ""
Write-Host "A) Cai app len myprintsy-3 (neu chua):"
Write-Host "   Partner Dashboard -> Apps -> Myprintsy Gift Box Tier -> Install app -> chon myprintsy-3"
Write-Host ""
Write-Host "B) Tao automatic discount:"
Write-Host "   Admin -> Discounts -> Create discount -> chon app function"
Write-Host "   - Function: Myprintsy Gift Box Tier Pricing"
Write-Host "   - Automatic | Product discount ON | Activate"
Write-Host ""
Write-Host "C) Test checkout: gift box qty 4 = `$14.99 (khong `$19.96)"
