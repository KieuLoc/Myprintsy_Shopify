# Revert live theme ve truoc "gift box variant bundle" (2026-06-13)
# Backup: .revert-backup/gift-box-variant-bundle-2026-06-13/
#
# Chay:
#   cd "d:\Shoppify\...\theme_export__..."
#   .\scripts\revert-gift-box-variant-bundle.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Bak = Join-Path $Root ".revert-backup\gift-box-variant-bundle-2026-06-13"
$ThemeId = "183186358588"
$Store = "myprintsy-3.myshopify.com"

if (-not (Test-Path $Bak)) {
  Write-Host "Khong tim thay backup: $Bak" -ForegroundColor Red
  exit 1
}

Write-Host "=== REVERT gift box variant bundle -> live ===" -ForegroundColor Yellow
Write-Host "Store: $Store | Theme: $ThemeId"
Write-Host "Backup: $Bak"
Write-Host ""

Set-Location $Root

# Copy backup len root theme (de push)
$files = @(
  "assets\addon-gift-box-pricing.js",
  "assets\cart.js",
  "snippets\addon-gift-box.liquid",
  "sections\main-cart-items.liquid",
  "snippets\cart-drawer.liquid"
)

foreach ($rel in $files) {
  $src = Join-Path $Bak $rel
  $dst = Join-Path $Root $rel
  if (-not (Test-Path $src)) {
    Write-Host "Thieu file backup: $rel" -ForegroundColor Red
    exit 1
  }
  Copy-Item -Path $src -Destination $dst -Force
  Write-Host "Restored $rel"
}

Write-Host ""
Write-Host "Pushing backup len live..." -ForegroundColor Cyan
shopify theme push --theme $ThemeId --store $Store --allow-live `
  --only assets/addon-gift-box-pricing.js `
  --only assets/cart.js `
  --only snippets/addon-gift-box.liquid `
  --only sections/main-cart-items.liquid `
  --only snippets/cart-drawer.liquid

Write-Host ""
Write-Host "=== REVERT XONG ===" -ForegroundColor Green
Write-Host "Luu y: snippets/gift-box-tier-variant-map.liquid co the con tren theme (orphan, khong anh huong)."
Write-Host "Gift box checkout quay ve: qty x variant `$4.99 (khong bundle tier)."
