## 2026-11-28 23:43 — LIVE: SOI xmas + SOI2 CR2 size (#183186358588)

- SOI1 mobile Christmas center; SOI2 mobile ~2/3 width bottom-left like CR2
- Desktop SOI1/2 hero reindeer bedding; code centered
- Files: overlay-success-opt-in*.liquid/css/js, hero snippet, reindeer asset, overlay-group

## 2026-11-28 23:30 — SOI2 mobile ~CR2 2/3 width (DEV)

- SOI2 mobile width = `min((100vw-2rem)*2/3, 28rem)` giống Cart Reminder 2; typography/padding thu nhỏ

## 2026-11-28 23:26 — SOI1 xmas center / SOI2 CR2 corner (DEV)

- Format burgundy Christmas → SOI1 mobile (giữa màn); mã căn giữa
- SOI2 mobile: cùng size, vị trí bottom-left như Cart Reminder 2 (overlay trong suốt)

## 2026-11-28 23:17 — SOI2 card size + desktop reindeer hero (DEV)

- SOI2 mobile: card nhỏ như SOI1 (không full màn)
- Desktop SOI1+SOI2 fallback hero: `success-opt-in-reindeer-bedding.jpg`; clear SOI1 image_picker override

## 2026-11-28 18:47 — CR2 copy: 25% off (LIVE+DEV)

- `timer_label`: Extra 10% → `25% off for your cart` (desktop+mobile)
- Push DEV #186878558524 + LIVE #183186358588

## 2026-11-28 18:23 — SOI2 mobile mock (DEV)

- Mobile Success opt-in 2: hero + X, burgundy grid panel, title, code box, disclaimer, countdown H:M:S, cream CTA + ghost dismiss
- CSS `overlay-success-opt-in-2.css`; countdown trong `overlay-success-opt-in.js`
- Desktop SOI2 vẫn disabled / chưa restyle; DEV enable SOI2 mobile để preview

- Check pass: code MERRY25, countdown 00:05:00, panel rgb(112,16,20)
## 2026-11-28 17:33 — LIVE: Cart reminder 2 (#183186358588)

- Push LIVE CR2 (desktop+mobile), force_show=false; tắt CR1
- SOI2 section+config lên LIVE nhưng `disabled: true`; SOI1 ảnh cũ giữ
- Reminder2 submit fallback SOI1 khi SOI2 tắt
- Không push SOI1 liquid/hero đổi ảnh

## 2026-11-28 07:26 — Admin config CR2 + SOI2 (DEV)

- Cart reminder 2 / Success opt-in 2 đã trong Overlay group + schema settings như bản 1
- `force_show` chuyển thành checkbox theme editor (DEV vẫn bật để preview)
- Success opt-in image_picker: chọn ảnh admin → dùng; để trống → gnome asset
- Check SOI2 + CR2 GUI pass

## 2026-11-28 00:34 — Success opt-in gnome + opt-in 2 (DEV)






