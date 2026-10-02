# Myprintsy Gift Box Tier — Shopify Function

Shopify Function áp dụng **bảng tier gift box** ở checkout, khớp với `assets/addon-gift-box-pricing.js` trên theme.

## Bảng tier (USD)

| Qty | Tổng |
|-----|------|
| 1 | $4.99 |
| 2 | $8.99 |
| 3 | $11.99 |
| 4 | $14.99 |
| 5+ | $14.99 + (qty−4) × $3 |

Checkout variant mặc định: **$4.99 × qty**. Function giảm phần chênh lệch **chỉ trên dòng gift box** (`_addon_gift_box: true`).

## Phạm vi ảnh hưởng

- ✅ Chỉ dòng **Add-On Gift Box** (property `_addon_gift_box` hoặc title chứa "Gift Box Service")
- ❌ Không đụng sản phẩm chính, Hulk, theme, shipping
- ⚠️ Footer **Estimated total** trên `/cart` vẫn có thể hiển thị giá Shopify variant (chưa sync tier) — checkout mới khớp tier

---

## Yêu cầu

- [Shopify Partner account](https://partners.shopify.com)
- Node.js 22+
- Shopify CLI 3.x (`shopify version`)

---

## Cài đặt (lần đầu)

### 1. Tạo app trên Partner Dashboard

1. Partner → Apps → Create app → Custom app
2. Ghi lại **Client ID**

### 2. Link app local

```bash
cd shopify-gift-box-discount
npm install
shopify app config link
```

Chọn org + app vừa tạo. CLI sẽ ghi `client_id` vào `shopify.app.toml`.

### 3. Cài app lên dev store

```bash
shopify app dev --store sqj5k3-d1.myshopify.com
```

Mở URL install khi CLI hiện, approve scopes `write_discounts`.

### 4. Deploy function

```bash
shopify app deploy
```

Chọn deploy extension `gift-box-tier-discount`.

### 5. Tạo Automatic Discount trong Admin

1. **Discounts** → **Create discount**
2. Chọn **Amount off products** (hoặc app discount có Function)
3. Chọn app **Myprintsy Gift Box Tier**
4. Chọn function **Myprintsy Gift Box Tier Pricing**
5. Loại: **Automatic discount** (không cần code)
6. **Product discount** bật, **Order/Shipping** tắt
7. Không giới hạn sản phẩm / minimum (function tự filter gift box)
8. **Save** + **Activate**

Lặp lại bước 5 trên live store sau khi deploy production.

---

## Test

```bash
cd extensions/gift-box-tier-discount
npm install
npm test
npm run build
```

**Manual checkout test**

1. Cart: main product + gift box qty **4** → line gift box hiển thị **$14.99**
2. Checkout: gift box **$14.99** (không còn $19.96)
3. Order admin: có dòng discount "Gift box bundle pricing"

---

## Đồng bộ tier với theme

Khi đổi bảng tier trong theme (`assets/addon-gift-box-pricing.js`), cập nhật cùng logic trong:

`extensions/gift-box-tier-discount/src/gift-box-tier-pricing.js`

Rồi `npm test` + `shopify app deploy`.

---

## Rollback

Admin → Discounts → tắt discount **Gift box bundle** → checkout về giá variant $4.99×qty.
