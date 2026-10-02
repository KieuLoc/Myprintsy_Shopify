# Revert gift box cart image fix (2026-06-13)
# Backup: .revert-backup/gift-box-cart-image-2026-06-13/
#
# Chay:
#   cd "d:\Shoppify\...\theme_export__..."
#   .\scripts\revert-gift-box-cart-image.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Bak = Join-Path $Root ".revert-backup\gift-box-cart-image-2026-06-13"
$ThemeId = "183186358588"
$Store = "myprintsy-3.myshopify.com"

if (-not (Test-Path $Bak)) {
  Write-Host "Khong tim thay backup: $Bak" -ForegroundColor Red
  exit 1
}

Write-Host "=== REVERT gift box cart image fix -> live ===" -ForegroundColor Yellow
Write-Host "Store: $Store | Theme: $ThemeId"
Write-Host "Backup: $Bak"
Write-Host ""

Set-Location $Root

$files = @(
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
  --only sections/main-cart-items.liquid `
  --only snippets/cart-drawer.liquid

Write-Host ""
Write-Host "=== REVERT XONG ===" -ForegroundColor Green
Write-Host "Snippets gift-box-cart-image*.liquid co the xoa tay neu muon (orphan sau revert)."
