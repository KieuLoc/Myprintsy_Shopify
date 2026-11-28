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

- Hero gnome sofa asset cho opt-in 1+2; Success opt-in 2 section; reminder 2 → variant 2
- Check pass

## 2026-11-28 00:33 — Success opt-in gnome + opt-in 2 (DEV)

- Hero: theme asset `success-opt-in-gnome-sofa.jpg` (snippet `success-opt-in-hero`) cho opt-in 1 + 2
- Success opt-in 2: section desktop/mobile, `data-variant="2"`
- Cart reminder 2 `openSuccessOptIn` → `variant:'2'`; reminder 1 giữ variant 1
- Check `check-success-opt-in-2.js`: gnome src + routing

## 2026-11-27 21:58 — CR2 countdown 5 phút (DEV)
