# PROGRESS.md — trạng thái làm việc

> Cập nhật ngắn sau mỗi milestone. Chi tiết ngày → [JOURNAL.md](./JOURNAL.md).

**Last updated:** 2026-08-25

## Đang ổn định (DEV `#186878558524`)

- [x] Sync LIVE → local → DEV baseline
- [x] Clone Cart reminder → **Welcome** desktop + **Welcom** mobile
- [x] Welcome desktop GUI (ảnh trái + BG phải, fonts mockup, line breaks heading/subtext)
- [x] Welcome mobile GUI (ảnh trên + BG dưới)
- [x] Clone Success → **Welcome-Step2** desktop + mobile (JS/custom element tách)
- [x] Welcome-Step2 desktop GUI theo mockup (code box, timer box placeholder, 2 CTA + link)
- [x] Welcome-Step2 mobile GUI theo mockup (3 nút pill + icons)
- [x] CodeGraph CLI + Cursor MCP + `codegraph init`
- [x] Agent docs: `AGENTS.md` / `ARCHITECTURE.md` / `PROGRESS.md`

## Chưa làm / placeholder

- [ ] Welcome-Step2: **countdown timer thật** (hiện chỉ text setting GUI)
- [ ] Welcome-Step2: **trigger flow** (sau Welcome step 1 / opt-in) — hỏi user trước khi sửa logic
- [ ] Welcome: bật `enabled` + tinh chỉnh timing khi go-live flow
- [ ] Nối link collection thật cho SHOP BESTSELLER / TOP TRENDING / Browse All Deals
- [ ] Push **LIVE** — chỉ khi user yêu cầu rõ
- [ ] Restart Cursor sau setup CodeGraph (MCP load)

## Đang giữ nguyên (đừng đụng trừ khi được bảo)

- Logic/trigger **Welcome** (user: keep)
- Success opt-in gốc + Cart reminder production behavior
- LIVE theme trừ khi có lệnh push LIVE

## Next recommended

1. User restart Cursor → xác nhận MCP `codegraph` xanh.
2. Theme editor DEV: up ảnh nền panel Welcome / Welcome-Step2 (desktop + mobile).
3. Khi sẵn sàng: hỏi user về **logic** nối Welcome → Welcome-Step2 + countdown.

## Store / preview

- Store: `myprintsy-3.myshopify.com`
- Preview DEV: `https://myprintsy-3.myshopify.com?preview_theme_id=186878558524`
- Editor DEV: `https://myprintsy-3.myshopify.com/admin/themes/186878558524/editor`
