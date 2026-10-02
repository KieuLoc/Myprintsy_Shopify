# ARCHITECTURE.md — Overlay system

## Mục tiêu

Popup/overlay marketing trên storefront MyPrintsy, quản lý trong **Overlay group** (`sections/overlay-group.json`). Mỗi popup thường có **desktop + mobile** section riêng.

## Overlay map

| Schema name | Section type | JS / custom element | Storage / notes |
|-------------|--------------|---------------------|-----------------|
| Cart reminder (desktop/mobile) | `overlay-cart-reminder-popup*` | `cart-reminder-popup` · `overlay-cart-reminder-popup.js` | Cart reminder keys |
| Welcome (desktop) / Welcom (mobile) | `overlay-welcome-popup*` | Reuse `cart-reminder-popup` | `welcome-popup` / `welcome-order-completed` · `enabled` default false |
| Welcome-Step2 (desktop/mobile) | `overlay-welcome-step2*` | `welcome-step2-popup` · `overlay-welcome-step2.js` | Tách khỏi Success; chưa gắn trigger storefront |
| Success opt-in (desktop/mobile) | `overlay-success-opt-in*` | `success-opt-in-popup` · `overlay-success-opt-in.js` | Cart reminder gọi `SuccessOptInPopup.open()` |
| Exit intent / Newsletter / Privacy / Klaviyo teaser | tương ứng `overlay-*` | — | Một số `disabled` trong group |

Order trong group (rút gọn): cart drawer → newsletter → privacy → cart reminder → **welcome** → **welcome-step2** → success → exit → klaviyo.

## Layout patterns (GUI)

### Welcome desktop / Welcome-Step2 desktop

```
┌─────────────┬──────────────────────┐
│ Left image  │ Right panel BG image │
│ (cover)     │ + HTML overlay copy  │
└─────────────┴──────────────────────┘
```

- Setting: `image_desktop` / `image` + `image_content_bg`.
- CSS riêng: `overlay-welcome-popup.css`, `overlay-welcome-step2.css`.
- Brand fonts: Playfair Display (± Great Vibes / Poppins tùy popup).

### Welcome mobile / Welcome-Step2 mobile

```
┌──────────────────┐
│ Top product image│
├──────────────────┤
│ Bottom panel BG  │
│ + overlay copy   │
└──────────────────┘
```

### Success opt-in (gốc)

Desktop: logo header + 50/50 media/content. Mobile: media trên + panel dưới (decor CSS). Snippet: `snippets/success-opt-in-promo-code.liquid`.

## Data flow (Success)

```
Cart reminder (email success / flow)
        │
        ▼
SuccessOptInPopup.open({ destination? })
        │
        ▼
CTA → /discount/{code}?redirect=/checkout  (nếu có promo + link checkout)
```

Welcome-Step2 dùng class riêng `WelcomeStep2Popup` — **không** vào `SuccessOptInPopup.instances`, tránh open nhầm.

## Device split

- Desktop section: `@media (max-width: 749px)` → `display: none` (trừ design mode).
- Mobile section: `@media (min-width: 750px)` → `display: none` (trừ design mode).
- JS chọn instance theo `data-device-target` + `matchMedia('(max-width: 749px)')`.

## Files quan trọng

| Area | Paths |
|------|--------|
| Group wire | `sections/overlay-group.json` |
| Welcome | `sections/overlay-welcome-popup*.liquid`, `assets/overlay-welcome-popup*.css` |
| Step2 | `sections/overlay-welcome-step2*.liquid`, `assets/overlay-welcome-step2*.css`, `assets/overlay-welcome-step2.js` |
| Success | `sections/overlay-success-opt-in*.liquid`, `assets/overlay-success-opt-in*.css`, `assets/overlay-success-opt-in.js` |
| Cart reminder | `sections/overlay-cart-reminder-popup*.liquid`, `assets/overlay-cart-reminder-popup.js` |

## Ngoài overlay

- Theme Dawn chuẩn: `templates/`, `sections/`, `snippets/`, `assets/`, `config/`.
- App phụ: `shopify-gift-box-discount/` (Function/discount) — tách khỏi overlay theme.
- Snapshot: `_live_check/`, `_live_pull_check/` — **không** sửa khi làm feature.

## CodeGraph

Index local: `.codegraph/`. Liquid + JS được index; hỏi kiến trúc qua `codegraph_explore` trước khi đọc hàng loạt file.
