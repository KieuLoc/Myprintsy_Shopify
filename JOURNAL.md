# Journal — Myprintsy Shopify Theme

## 2026-10-04 (tối) — Bật BMSM cho Ultra Cloak / Hoodie 3D / Jogger / Bomber Jacket / Zip Hoodie

**User:** bật lại flag, các type kia nhận BMSM luôn, không tắt về Free Ship nữa.
**Fix:** `snippets/free-shipping-callout.liquid` — bỏ flag `bmsm_extra_on`, dùng 1 danh sách cố định `bmsm_types` (cloak, ultra cloak, hoodie 3d, jogger, bomber jacket, zip hoodie). Thêm type mới = thêm vào danh sách.
**Check:** `scripts/check-cloak-bmsm.js` DEV + LIVE — 6 type → BMSM; Wearable Blanket Hoodie, Mug → Free Shipping. PASS.
**LIVE:** pushed `183186358588`. Commit GitHub `main`.

## 2026-10-04 — Revert BMSM về chỉ Cloak (flag off các type khác)

**User:** chưa tạo collection giảm giá → chỉ giữ Cloak, các type khác flag off, mai bật.
**Fix:** `snippets/free-shipping-callout.liquid` — chỉ type `Cloak` (khớp chính xác) hiện BMSM. `bmsm_extra_on = false` tắt `bmsm_extra_types` (Ultra Cloak, Hoodie 3D, Jogger, Bomber Jacket, Zip Hoodie). Mai: đổi `bmsm_extra_on = true` + chạy check với `BMSM_EXTRA_ON=1`.
**Gotcha:** gộp `a or b and c` trong 1 `{% if %}` Liquid cho kết quả sai (Ultra Cloak vẫn BMSM) → tách thành 2 `if` gán biến.
**Check:** `scripts/check-cloak-bmsm.js` DEV + LIVE — Cloak → BMSM; 7 type còn lại → Free Shipping. PASS.
**LIVE:** pushed `183186358588`. Commit GitHub `main`.

## 2026-10-04 — Hoodie 3D / Jogger / Bomber Jacket / Zip Hoodie → BMSM

**User:** hoodie 3d, jogger, bomber jacket, zip hoodie cũng hiển thị như BMSM.
**Fix:** `snippets/free-shipping-callout.liquid` — thêm so khớp chính xác `hoodie 3d`, `jogger`, `bomber jacket`, `zip hoodie` (không dùng contains "hoodie" để Wearable Blanket Hoodie giữ Free Shipping).
**Check:** `scripts/check-cloak-bmsm.js` DEV + LIVE — Cloak, Ultra Cloak, hoodie 3d, Jogger, Bomber Jacket, Zip Hoodie → BMSM; Wearable Blanket Hoodie, Mug → Free Shipping. PASS.
**LIVE:** pushed `183186358588`. Commit GitHub `main`.

## 2026-10-03 — Cloak → hiển thị BMSM

**User:** sản phẩm product_type cloak hiển thị giống template BMSM.
**Fix:** `snippets/free-shipping-callout.liquid` — nếu `product.type` chứa "cloak" (Cloak, Ultra Cloak) thì render `special-coupon` (hộp Buy More, Save More), còn lại giữ Free Shipping. Áp dụng cho mọi template đang dùng snippet này, không cần đổi template từng sản phẩm.
**Check:** `scripts/check-cloak-bmsm.js` trên DEV `186878558524` — Yggdrasil Cloak (type Cloak) + 2 Ultra Cloak → BMSM, hoodie 3d + Jogger → Free Shipping. PASS.
**LIVE:** pushed `183186358588`, check chạy lại trên LIVE PASS. Commit GitHub `main`.

## 2026-09-24 — Push DEV + LIVE (Free Ship / BMSM template)

**User:** push DEV và LIVE.
**Pushed:** free-shipping-callout, special-coupon, EDD placement, pack CSS, price CSS, product templates (default/pack/sweater/no-customily/ths/test → Free Ship; **buy-more-save-more** → BMSM).
**Themes:** DEV `186878558524` + LIVE `183186358588` (`--allow-live`).

## 2026-09-23 — BMSM sát Delivered-to (EDD)

**User (GUI):** Khoảng trắng giữa Buy More Save More và Delivered to Viet Nam.
**Root cause:** Size Chart nằm giữa 2 khối + margin PDP `1.5rem`.
**Fix:** `edd-pdp-placement.js` đặt EDD ngay sau `.bmsm`; margin BMSM/EDD = 0.
**Check:** `node scripts/check-edd-placement-stable.js` → gap **0px**, flips 0. DEV only.

## 2026-09-23 — Pack không %: chữ căn giữa

**User (GUI):** Pack không có dòng giảm giá (Pack 1) → chữ căn giữa theo chiều dọc.
**Done:** bỏ spacer ẩn; `min-height: 5.6rem` + `justify-content: center` + class `--solo`. Cũng tách `(Save 10%)` giống `(10% OFF)`. Push DEV ✅

## 2026-09-23 — Fix nháy Style/Color/Pack (EDD thrash)

**User:** https://www.myprintsy.com/products/cat-rainbow-personalized-shirt — cả khối Style/Color/Pack (+ delivery) nháy nhảy liên tục.
**Root cause:** `assets/edd-pdp-placement.js` poll 250ms × 160 + MutationObserver toàn document → cứ `insertBefore` delivery slot trước `variant-selects` + `forceDeliveryToInline` mỗi lần → DOM thrash.
**Done (logic):**
- Không re-place khi slot đã đúng chỗ; skip `forceDeliveryToInline` sau lần enhance đầu.
- Flag `__myprintsyEddPlacing` + dừng poll khi `isPlacementStable` (max ~10s).
- Gift-box MO bỏ qua khi EDD đang place.
**Check:** `node scripts/check-edd-placement-stable.js` — 2s sau settle, previousSibling của `variant-selects` **flips=0** ✅
**Push DEV** `#186878558524` ✅. LIVE chưa (user URL là LIVE → cần push LIVE mới hết nháy trên www).

## 2026-09-23 — Fix Buy 4+ wrap + pill nhảy (border)

**User (GUI):** `4+` xuống dòng; Style/Color/Pack nhảy liên tục.
**Done:**
- `special-coupon.liquid` — cột qty `auto` + `white-space: nowrap` (Buy 4+ 1 dòng).
- `component-product-variant-picker.css` — pill **luôn border 2px** (trước 1→2px khi checked → CLS); transition chỉ `border-color`.
**Push DEV** ✅. Nếu vẫn nhảy liên tục (không chỉ lúc click) → có thể do logic `viewTransition` thay cả `variant-selects` — hỏi user trước khi sửa logic.

## 2026-09-23 — Coupon → Buy More Save More + giá PDP ×2

**User (GUI):** bỏ ribbon Coupon 10%/20%; đổi sang box “Buy More, Save More” như mockup; giá sản phẩm to gấp đôi mọi product template.
**Done:**
- `snippets/special-coupon.liquid` — UI mới: Buy 2/3/4+ → 10%/15%/20% Off + note “Auto apply discounts on Cart Page” (chỉ display; 6 template vẫn `render 'special-coupon'`).
- `assets/section-main-product.css` — `.product__info-container .price--large`: 1.8/1.6rem → **3.6/3.2rem**.
**Push DEV** `#186878558524` ✅. LIVE chưa.

## 2026-09-22 — Pack pills: Pack 1 cao bằng pack có % OFF

**User (GUI):** Pack không có % OFF (vd Pack 1) cũng cùng chiều cao với Pack 2+.
**Done:** label pack luôn stack 2 dòng; không có OFF thì dòng dưới spacer ẩn (`visibility:hidden`) cùng font-size. Push DEV `#186878558524` ✅

## 2026-09-22 — Pack pills: % OFF xuống dòng kiểu Macorner

**User (GUI):** "10% OFF / 15% OFF…" xuống dòng, chữ bé màu nhạt như Macorner.
**Done:**
- `snippets/product-variant-options.liquid` — label pill tách `Pack N` + `10% OFF` khi value có `(…% OFF)`; **radio value giữ nguyên** (chỉ đổi display).
- `assets/component-product-variant-picker.css` — `.variant-option__discount` font 1.1rem, màu `rgba(fg, 0.5)`.
**Push DEV** `#186878558524` ✅ — preview: `?preview_theme_id=186878558524`. LIVE chưa push.

## 2026-09-22 — Pull LIVE mới nhất về local

**User:** pull mới nhất từ LIVE để lát push code không bị ghi đè.
**Done:** `shopify theme pull --theme 183186358588 --store myprintsy-3.myshopify.com --nodelete --path .`
**Result:** theme `Shopify Dawm Copy - Test` (#183186358588) pulled ✅ — local = LIVE baseline; `--nodelete` giữ file chỉ có local (JOURNAL / docs / scripts…).

## 2026-09-18 — Welcome ↔ Cart reminder: gap 2 phút, không hiện cùng lúc

**User (logic):** đang có lúc 2 popup cùng hiện. Cái nào hiện trước thì 2 phút sau cái kia mới được hiện, và ngược lại.
**Bối cảnh:** cả hai là **cùng một** custom element `cart-reminder-popup`, phân biệt bằng `data-storage-key` (`welcome-popup` vs `cart-reminder-popup`, desktop + mobile dùng chung key) ⇒ gate chung được, không cần code riêng 2 bên.
**Done** (`assets/overlay-cart-reminder-popup.js`):
- `static PEER_COOLDOWN_MS = 2 * 60 * 1000`.
- `peerStorageKey()` / `isPeerOpen()` / `peerCooldownLeftMs()` — đọc timestamp `markShown` của popup kia trong localStorage (đã có sẵn, không thêm key mới).
- Gate ở đầu `tryOpen`: còn cooldown thì **`scheduleOpen(còn lại + 250ms)`** rồi return — tức là hoãn, không huỷ, hết 2 phút mà vẫn đủ điều kiện thì hiện.
- Hết 2 phút nhưng popup kia **vẫn đang mở** → retry 5s (không bao giờ chồng nhau).
- **Không** gate `openFromTeaser` / `open(true)` design-mode: đó là user tự bấm / preview.
**Check:** `node scripts/check-overlay-peer-cooldown.js` — 5 nhánh: reminder sau welcome (chờ 110s), welcome sau reminder (chờ 110s), hết cooldown → mở, popup kia chưa từng hiện → mở, popup kia còn mở → retry 5s. Mutant (bỏ gate) → fail đúng ✅
**Push DEV** `#186878558524` ✅
**Push LIVE** `#183186358588` ✅ (2026-09-18 00:05) — `cart-notification.js` + `customily-preview-atc.js` + `overlay-cart-reminder-popup.js`. 4/4 check pass trước khi push. Lưu ý CLI cần `--allow-live` khi chạy non-interactive.

## 2026-09-17 — Rule mới: test trước khi push + ảnh popup sai design

**User:** thêm rule "code phải có test, test cẩn thận trước khi push"; và hỏi ảnh cốc đen "CREEP IT REAL" trên popup ở đâu ra (không khớp gallery).
**Rule:** `.cursor/rules/test-before-push.mdc` (alwaysApply) — check nằm ở `scripts/check-*.js`, Node + Playwright + `assert`, phải cover cả case lỗi, fail thì không push.

**Ảnh popup:** là ảnh **theme tự chụp canvas Customily** lúc click (`resolveLiveCustomilyImage` → `canvas.toDataURL`), src `data:image/jpeg`. Đo trên LIVE: đường này trả đúng ảnh 5 cốc pickleball 650px ⇒ ca của user là **chụp nhầm frame** lúc canvas còn render design cũ.
**Cause thật sự làm nó không tự sửa:** `syncDetailsTextOnly` có `!curIsLiveCapture` — ảnh đang là `data:`/`blob:` thì **từ chối** thay bằng `_customily-preview` của line item từ cart ⇒ frame sai đóng băng vĩnh viễn.
**Fix (logic, user chọn):** bỏ `!curIsLiveCapture` — cart trả về thì luôn preload rồi swap sang ảnh server (ảnh chuẩn của item vừa add).
**Check:** `node scripts/check-atc-popup-image.js` — unit test file local (nạp class, bỏ `customElements.define`, gọi thẳng `syncDetailsTextOnly`): server preview thì swap, ảnh Shopify CDN thường thì giữ capture. Đã verify check **fail** với code cũ ✅
**Cũng đổi (user yêu cầu):** popup mở ngay khi click như cũ (trả lại listener capture trong `customily-preview-atc.js`), giữ gate `Loading…` bám submit, mốc treo **25s → 15s** (`cart-notification.js` + fallback spinner preview).
**Check gate:** `scripts/check-atc-popup-gate.js`. **LIVE chưa push.**

**Vẫn bị (user report lần 2, DEV, Pack 4):** ảnh sai xuất hiện ngay lúc optimistic ⇒ không phải chuyện swap sau cart, mà là **chọn sai node**.
**User yêu cầu:** popup phải luôn lấy **ảnh chính đang hiển thị**.
**Root cause:** `resolveLiveCustomilyImage` cộng `+1e7` cho *bất kỳ* `<img>` có src chứa `customily|cl-preview|/previews/` — một preview cũ nằm **dưới** canvas (Customily khôi phục personalization trước) vẫn "visible" theo check display/visibility/opacity nên thắng điểm.
**Fix (logic):**
- canvas `+2e7` > img `+1e7` — canvas là thứ đang hiện trên màn hình.
- bỏ `canvas.upper-canvas` (layer fabric trong suốt → chụp ra frame trắng).
- `<img>` phải là **topmost tại tâm của chính nó** (`document.elementFromPoint`) mới được tính ⇒ ảnh nằm dưới canvas bị loại.
- capture < 20000 chars = canvas trắng → bỏ (ponytail heuristic, upgrade: `getImageData`).
- `resolveOptimisticImage`: canvas → **ảnh chính gallery** → cached URL (trước đây cached URL đứng trước ảnh chính).
**Check:** `node scripts/check-atc-popup-source.js` — 3 nhánh: canvas thắng preview cũ 900px; canvas trắng → ảnh chính; chỉ có upper-canvas → ảnh chính. Verify check **fail** khi bỏ guard topmost ✅
**Chưa verify được trên trang thật:** storefront giờ redirect traffic headless sang google.com (bot mitigation) ⇒ chỉ có unit check + user test tay. **Push DEV** ✅ LIVE chưa.

**Countdown 6 → 5 (user yêu cầu):** `let left = 5` trong `startCheckoutCountdown` (+ sửa doc comment).
**Check:** `node scripts/check-atc-countdown.js` — `5s→1s` rồi `Loading…`, và suốt thời gian đó `href` bị bỏ + `aria-disabled=true` (không bấm được), reset thì trả lại label/href. Mutant `left=6` → check fail đúng ✅ **Push DEV** ✅

## 2026-09-17 — Đo thật ATC bằng Playwright (LIVE, pickleball mug Pack 5)

**User:** tự mở link, tự check network, chỉ ra lỗi ở đâu.
**Repro treo (100%):** không tick option bắt buộc `Add Box for Protection & Free Replacement` → click ATC **không** fire `submit`, **không** có `/cart/add`, cart = 0; popup vẫn mở + `Loading… 5s→1s→Loading…` đến 25s rồi tự đóng, **không báo lỗi gì cho user**.
**Cause (code mình):** `assets/customily-preview-atc.js` (~L517) listener click **capture** trên `product-form .product-form__submit` gọi `openCartNotificationOptimistic()` trước khi Customily/app option quyết định có submit hay không.
**Timing khi tick đủ option** (t0 = click): 0.9s → 2 POST S3 `customily-shopify` (1.1s + 1.4s) · 2.0/2.3s → HEAD thumb 13KB + preview 104KB · 2.8s → `RequestFutureProductionFile` (0.42s) · **3.26s** → `submit` + `/cart/add` (2.45s) ⇒ ~5.7s. Customily ~3.3s, `/cart/add` ~2.4s.
**Ghi chú:** chỉ **1** production file (`_customily-eps-name = pklaah2a03 pack 1-5`), không phải 5.
**Giới hạn:** Shopify chặn automation — `/cart/add.js` trả 200 body `{}`, không set cookie `cart`, token đổi mỗi request ⇒ không test được chuyện "mất hàng trong giỏ" bằng script.
**Fix (logic, user chọn):** xóa listener click capture trong `customily-preview-atc.js`; popup chỉ mở từ `product-form.onSubmitHandler` (đường duy nhất tới `/cart/add`).
**Verify trên DEV** `#186878558524` (Playwright assert): không tick option → `submitAt=null, popupAt=null` (trước đây treo 25s) · tick option → `submit 3.27s`, popup `3.39s` (popup không bao giờ đi trước submit). ✅
**Còn lại:** ATC trong Preview modal (`buildActions`, ~L238) vẫn mở popup theo click — cùng loại rủi ro, chưa đụng vì spinner/CSS `myprintsy-preview-atc-inflight` do path đó quản. **LIVE chưa push.**

## 2026-09-16 — ATC: View Cart bám /cart/add thật

**User (logic+GUI):** countdown bám add thật; đếm ngược 6→1 rồi `Loading…` nếu chưa xong (không đếm lên).
**Handle:** khóa `href` lúc `openOptimistic`. Hết 0 không mở nút. Mở khi `renderContents`. Fail → đóng popup. Treo 25s → đóng, không unlock giỏ trống.
**Files:** `assets/cart-notification.js`, `assets/product-form.js`.
**Không đụng:** Welcome. **Push DEV + LIVE** ✅
**Test:** https://myprintsy-3.myshopify.com?preview_theme_id=186878558524

## 2026-09-17 — ATC hang: View Cart kẹt Loading (Pack 4 mug)

**User:** pickleball mug Pack 4 — popup kẹt `Loading…`.
**Cause:** View Cart chỉ unlock khi `product-form.renderContents`. Customily tự `/cart/add` (Pack 4 × 4 tên generate lâu) → handler theme không chạy.
**Fix:** poll `/cart.js` fingerprint; cart đổi → mở View Cart. 25s: cart đổi thì unlock, không thì đóng popup.
**File:** `assets/cart-notification.js`. LIVE chưa.

## 2026-09-16 — Pull LIVE về local

**User:** pull mới nhất từ LIVE.
**Done:** `shopify theme pull --live` theme `#183186358588` vào workspace, `--nodelete` (giữ JOURNAL / `_dev_preserve` / file chỉ có local).
**Ghi đè:** bản local ATC/Customily chưa push → giờ = LIVE.

## 2026-09-15 — product_link: hàng link 16px

**User (GUI):** More with This Design size 16px.
**Done:** `.product-link-row` `font-size: 1.6rem` (20px → 16px).
**Push DEV** `#186878558524` + **LIVE** `#183186358588` ✅

## 2026-09-15 — Cart mobile: sticky Checkout chỉ khi scroll past nút gốc

**User (logic+GUI):** mobile cart — Checkout dưới Subtotal; sticky bottom chỉ hiện khi nút gốc không còn trong viewport (giống Preview PDP). Thử DEV.
**Done:** bỏ ẩn `.cart__ctas`; sticky `.is-visible` khi `rect.bottom < 0`. Padding/chat hide theo class `cart-sticky-checkout-visible`.
**Không đụng:** desktop cart.
**Push DEV** `#186878558524` + **LIVE** `#183186358588` ✅

## 2026-09-15 — Welcome + Step2: thu nhỏ ~6% giữ tỉ lệ

**User (GUI):** bé đi dài + rộng một xíu, giữ tỉ lệ.
**Desktop:** Step1 1000×560 → **940×526**; Step2 1000×620 → **940×583**.
**Mobile:** dialog 36rem → **34rem**; ảnh Step1 28rem/42vh → 26rem/40vh; Step2 24rem/38vh → 23rem/36vh.
**Không đụng:** Cart reminder size, Welcome logic.
**Push DEV** `#186878558524` + **LIVE** `#183186358588` ✅

## 2026-09-15 — Welcome-Step2: 1 nút Browse All Deals + help text to hơn

**User (GUI):** bỏ SHOP BESTSELLER / SHOP TOP TRENDING; giữ Browse All Deals; dòng “If you missed it…” to hơn — desktop + mobile.
**Done:** không render 2 CTA; desktop Browse All Deals thành pill; mobile giữ nút gold tertiary. Help: desktop `clamp(1.5–1.75rem)`, mobile `1.45rem`.
**Không đụng:** Welcome step 1 logic, countdown, Klaviyo.
**Push DEV** `#186878558524` + **LIVE** `#183186358588` ✅

## 2026-09-15 — product_link: hàng link 20px

**User (GUI):** More with This Design size 20px.
**Done:** `.product-link-row` `font-size: 2rem` (14px → 20px).
**Push DEV** `#186878558524` + **LIVE** `#183186358588` ✅

## 2026-09-15 — product_link: bỏ special-coupon 10/20%

**User:** template product_link xóa coupon 20% (block special-coupon, gồm cả 10%).
**Done (GUI):** xóa `custom_liquid_dr9fED` trong `templates/product.product_link.json`.
**Không đụng:** default product / template khác.
**Push DEV** `#186878558524` + **LIVE** `#183186358588` ✅

## 2026-09-15 — product_link: ưu tiên `product_links` list

**Cause:** leftover `more_with_this_design` (`áasdsd`) được đọc trước → PDP không hiện list Lockx/lockxkk.
**Fix:** metafield `custom.product_links` (list.link) ưu tiên.
**Push DEV** `#186878558524` + **LIVE** `#183186358588` ✅

## 2026-09-15 — product_link: 1 link không hiện + cần nhiều URL

**Cause:** `assign items = metafield.value` làm mất `.url`; definition type `link` (One) không phải `list.link`.
**Fix:** đọc `mf.value.url` từ metafield object; fallback `metafield_tag`; for-loop cho list.
**Staff nhiều link:** xóa definition → tạo lại Type **List + Link**, key `custom.more_with_this_design`.
**Push DEV** `#186878558524` + **LIVE** `#183186358588` ✅

## 2026-09-15 — product_link: heading trống vì chỉ có text, chưa URL

**Cause:** metafield type `link` (One), không `list.link`; Admin điền `áasdsd` không có URL; Liquid `for` không iterate 1 object → heading rỗng.
**Fix:** nhận 1 link đơn (`items.url`); chỉ render khi có URL.
**Staff:** click field → Label + dán/chọn URL. Muốn nhiều link (LIGHTER | CAP): sửa definition One → List, hoặc xóa tạo lại List + Link.
**Push DEV** `#186878558524` + **LIVE** `#183186358588` ✅

## 2026-09-15 — product_link: đọc metafield `more_with_this_design`

**User:** form Admin auto-key `custom.more_with_this_design` (Name: More with this design).
**Done:** snippet đọc `more_with_this_design` trước, fallback `product_links`.
**Staff:** Type phải là **List** + Link (không để One).
**Push DEV** `#186878558524` + **LIVE** `#183186358588` ✅

## 2026-09-14 — product_link: hàng Text + URL setup trong Admin

**User:** người khác tự setup trên Shopify (không JSON / không fake variant).
**Done:**
- Block `product_links` trên template `product_link` (sau Judge.me, trước coupon).
- Đọc metafield product `custom.product_links` (`list.link`) — mỗi dòng Text + URL.
- Gate `template.suffix == 'product_link'`. Default / `variant_link` không đổi.
**Staff (một lần):** Settings → Custom data → Products → Add definition
- Name: `More with this design`
- Namespace/key: `custom.product_links`
- Type: Link → List of values
- Pin to product.
**Staff (mỗi SP):** Product → Metafields → Add LIGHTER / CLASSIC CAP / SEE MORE + URL. Gán theme template `product_link`.
**Push DEV** `#186878558524` + **LIVE** `#183186358588` ✅

## 2026-09-14 — Template product_link (copy default product)

**User:** tạo theme template `product_link` base từ default product.
**Done:** `templates/product.product_link.json` = copy `templates/product.json` (không đổi section/block/logic).
**Assign:** Admin → product → Theme template → `product_link`. Preview: `?view=product_link`.
**Push DEV** `#186878558524` + **LIVE** `#183186358588` ✅
**Không đụng:** logic `variant_link` / default product.

## 2026-09-14 — Welcome teaser mobile: hạ xuống sát Preview đỏ (GUI)

**User:** 110px cao quá (ngang Country/region); muốn nằm ngay trên nút Preview đỏ, không bị che.
**Done:** mobile `bottom: 6.8rem + safe-area` (dock Preview ~6.5rem). Desktop giữ 110px = chat.
**Push DEV** `#186878558524` + **LIVE** `#183186358588` ✅

## 2026-09-14 — Welcome teaser: nâng hộp quà ngang chat Inbox (GUI)

**User:** teaser hộp quà trái thấp hơn teaser chat phải; giữ trái, kéo cao cho bằng.
**Done:** `overlay-welcome-teaser.css` — `bottom: calc(110px + safe-area)` (cùng mốc `#ShopifyChat` trong `theme.liquid`).
**Push DEV** `#186878558524` + **LIVE** `#183186358588` ✅

## 2026-09-14 — Welcome: Get My Discount → Step2 ngay + bỏ openForm → LIVE

**User:** push fix DEV-only lên LIVE.
**Scope:** chỉ `assets/overlay-cart-reminder-popup.js` (Welcome-gated; Cart Reminder không đổi).
**Live behavior:** Get My Discount → mở Step2 ngay; Klaviyo list API chạy nền; không `openForm` native.
**Không push:** `overlay-group.json` (Welcome `enabled` trên LIVE giữ nguyên).
**Push LIVE** `#183186358588` ✅

## 2026-09-13 — Welcome: Get My Discount kẹt loading (DEV+LIVE)

**Cause:** `await submitKlaviyoEmbedForm` chờ embed Klaviyo tới 8s+3s → nút `...` đứng lâu.
**Fix:** Welcome mở Step2 ngay; Klaviyo chạy nền; chờ embed rút 0.5s; fallback list API nếu embed chưa sẵn.
**Push DEV** `#186878558524` + **LIVE** `#183186358588` ✅

## 2026-09-13 — Welcome-Step2 desktop: timer font = Poppins như mobile (DEV+LIVE)

**User (GUI):** countdown "expires in" desktop đang Playfair, muốn giống mobile.
**Fix:** `overlay-welcome-step2.css` — `__timer` + `__timer-label` → Poppins (import Poppins).
**Push DEV** `#186878558524` + **LIVE** `#183186358588` ✅

## 2026-09-13 — ATC: chặn khi Customily Required trống + ảnh đúng màu (DEV)

**User:** ATC vẫn hiện popup/ảnh dù ô Required trống; mobile lệch màu.
**Fix:**
- `customily-preview-atc.js` — check Required trước optimistic/ATC (capture stop); focus + viền đỏ.
- `product-form.js` — không submit optimistic nếu Required trống.
- `cart-notification.js` — ưu tiên featured image theo variant (không tin Customily paint cũ).
**Push DEV** `#186878558524` ✅ — LIVE chưa.

## 2026-09-13 — Mobile ATC: ảnh notification đúng màu variant (DEV)

**User:** chọn Black vẫn hiện preview vàng.
**Cause:** mobile ưu tiên Customily HTTPS overlay cũ hơn ảnh Shopify active.
**Fix:** `resolveOptimisticImage` — live paint → remembered (keyed) → Shopify active → Customily HTTPS cuối; chỉ scan slide `is-active`.
**Push DEV** `#186878558524` ✅ — LIVE chưa.

## 2026-09-13 — Welcome-Step2 desktop: timer font = Poppins như mobile (DEV)

**User (GUI):** countdown "expires in" desktop đang Playfair, muốn giống mobile.
**Fix:** `overlay-welcome-step2.css` — `__timer` + `__timer-label` → Poppins (import Poppins).
**Push DEV** `#186878558524` + **LIVE** `#183186358588` ✅

## 2026-09-13 — ATC: tắt popup lúc Loading… không tự mở lại → LIVE

**Push LIVE** `#183186358588` — `cart-notification.js` + `customily-preview-atc.js` + `product-form.js` (suppress sau X).

## 2026-09-13 — ATC: tắt popup lúc Loading… không tự mở lại (DEV)

**Cause:** User X lúc optimistic → `_suppressNextOpen`; Customily submit muộn gọi `openOptimistic()` lại **xóa** suppress rồi mở + countdown lần 2.
**Fix:**
- `close()` set suppress khi optimistic/countdown.
- `openOptimistic({ fromUserGesture })` — chỉ click sớm mới clear suppress; gọi muộn thì return nếu đã X.
- Capture/`openCartNotificationOptimistic` dùng `fromUserGesture: true`; `product-form` không.
**Push DEV** `#186878558524` ✅ — LIVE chưa.

## 2026-09-13 — Welcome: bật enabled=true (DEV)

**User:** bật flag Welcome.
**Done:** `overlay-group.json` — `overlay_welcome_popup` + `_mobile` → `enabled: true`.
**Push DEV** `#186878558524` ✅ — LIVE chưa.

## 2026-09-13 — Welcome: bỏ Klaviyo openForm popup sau Get My Discount (DEV)

**User:** bấm xong lại ra form "A SOFTER SEASON / GET MY 10% OFF".
**Cause:** `scheduleKlaviyoOpenFormFallback` mở form native Klaviyo (`VtBEnx`) thay vì Step2.
**Fix:** Welcome chỉ `subscribeToKlaviyo` (list API) + mở Step2 — không embed/openForm.
**Push DEV** `#186878558524` ✅ — LIVE chưa.

## 2026-09-13 — Welcome: Get My Discount kẹt loading (DEV)

**Cause:** `await submitKlaviyoEmbedForm` chờ embed Klaviyo tới 8s+3s → nút `...` đứng lâu.
**Fix:** Welcome mở Step2 ngay; Klaviyo chạy nền; chờ embed rút 0.5s; fallback list API nếu embed chưa sẵn.
**Push DEV** `#186878558524` ✅ — LIVE chưa (bảo nếu cần).

## 2026-09-13 — Welcome email gate → LIVE (scoped)

**Push LIVE** `#183186358588` — chỉ 8 file Welcome (không `overlay-group.json` để tránh đụng setting Cart Reminder/Success).
- JS gate/`completeKlaviyoSubmit`: `isWelcomePopup()` → Step2; còn lại → Success như cũ.
- Liquid defaults: desktop `VtBEnx`, mobile `R96Af3`, list `XDYfDR`.

## 2026-09-13 — Welcome: gate Get My Discount theo email + fix Klaviyo→Step2 (DEV)

**Logic:** `syncWelcomeSubmitGate()` — nút Get My Discount `disabled` tới khi email hợp lệ; `handleSubmitClick` validate lại trước Klaviyo → Step2.
**Bugfix:** `handleKlaviyoFormSubmit` gọi `completeKlaviyoSubmit` (Welcome → Step2), không mở Success opt-in.
**Push DEV** `#186878558524` ✅ + **LIVE** `#183186358588` ✅

## 2026-09-08 — Fix duplicate product title trên optimistic popup (DEV)

**Cause:** `.product__title` Dawn = visually-hidden + text → `textContent` bị double.
**Fix:** strip visually-hidden + dedupe chuỗi; patch details replace sạch 1 block.
**Push DEV** `#186878558524` ✅

## 2026-09-08 — Bỏ nháy ảnh lần cuối (DEV)

**User:** còn nháy 1 lần.
**Cause:** gift-box/`renderContents` lần 2 remount `<img>` + gọi lại `open()` animation.
**Fix:** mọi lần update chỉ patch details nếu đã có ảnh; đã `active` thì không `open()` lại.
**Push DEV** `#186878558524` ✅

## 2026-09-08 — Fix ảnh notification nhảy / load lại nhiều lần (DEV)

**User:** ảnh load đi load lại, nhảy nhảy.
**Cause:** openOptimistic 2 lần remount `<img>` + renderContents đổi URL + applyCached đổi src lần nữa.
**Fix:** khóa `_lockedImageSrc`; optimistic lần 2 no-op; khi đã optimistic chỉ replace details, giữ nguyên `<img>`.
**Push DEV** `#186878558524` ✅

## 2026-09-08 — Fix optimistic: không tắt rồi hiện lần 2

**User:** bấm hiện → tắt luôn → load xong hiện lại; nếu tắt sớm thì đừng hiện lần 2.
**Cause:** cùng click ATC, `body` click handler đóng notification ngay sau `openOptimistic`.
**Fix** `cart-notification.js`:
- Hoãn gắn body listener + ignore ATC click / 500ms đầu.
- `close()` lúc `_optimistic` → `_suppressNextOpen`; `renderContents` vẫn cập nhật cart bubble/HTML nhưng **không** `open()`.
**Không** hủy được pipeline Customily (generate/S3) — chỉ skip UI lần 2.
**Push DEV** `#186878558524` ✅ — LIVE chưa.

## 2026-09-08 — Optimistic cart-notification → DEV only

**User:** phác/làm optimistic trên DEV, không push LIVE.
**Done:**
- `cart-notification.js`: `openOptimistic` / `closeOptimistic` (ảnh Preview cache / gallery / PDP + title/price tạm); `renderContents` thay bản thật; lỗi → đóng.
- `customily-preview-atc.js`: capture click `#customily-cart-btn`; Preview-ATC → optimistic + đóng preview ngay.
- `product-form.js`: gọi optimistic lúc submit; lỗi → `closeOptimistic`.
**Push DEV** `#186878558524` ✅ — **LIVE không đụng.**
**Test:** https://myprintsy-3.myshopify.com?preview_theme_id=186878558524 — bấm ATC, popup hiện ngay; vài giây sau refresh nội dung thật.

## 2026-09-08 — Push ABC cart-notification → LIVE

**User:** pushs live.
**Push LIVE** `#183186358588` `--allow-live --nodelete --only`:
- `sections/cart-notification-product.liquid`
- `assets/cart-notification.js`
- `assets/customily-preview-atc.js`
**Optimistic UI:** chưa làm.

## 2026-09-08 — Re-push ABC → DEV (confirm scope, chưa optimistic)

**User:** chưa làm optimistic; push logic ABC lên DEV; đảm bảo không hỏng phần khác.
**Push DEV lại** `#186878558524` (`--only` 3 file, `--nodelete`) ✅
**Scope / blast:**
- `cart-notification-product.liquid` — chỉ HTML ảnh popup ATC
- `cart-notification.js` — chỉ `renderContents` → gán src nếu có cache
- `customily-preview-atc.js` — chỉ nhớ URL khi Preview + warm `Image()`; không đổi ATC/gallery/overlay flow
**Không đụng:** cart drawer, gift box, overlays Welcome, product-form ATC, Customily generate.
**Optimistic UI:** chưa làm.

## 2026-09-08 — Cart notification ảnh Customily nhanh hơn (A+B+C) → DEV

**User:** làm ABC rồi push DEV trước.
**Done:**
- **A** `cart-notification-product.liquid`: `loading=eager` + `fetchpriority=high` (bỏ lazy).
- **B** Ưu tiên `_customily-preview` → `_customily-preview-url` → `_customily-thumb`.
- **C** Preview nhớ `window.__myprintsyLastCustomilyPreviewSrc` (+ warm Image); `cart-notification.js` gán lại src khi `renderContents`.
**Push DEV** `#186878558524` ✅ — LIVE chưa.
**Preview:** https://myprintsy-3.myshopify.com?preview_theme_id=186878558524

## 2026-09-08 — Push Welcome lên LIVE (enabled=false)

**User:** push Welcome lên LIVE, flag tắt để tạm không hiện.
**Done:** `shopify theme push --theme 183186358588 --allow-live --nodelete --only …`
**Files:** Welcome desktop/mobile + Step2 + teaser CSS/JS/liquid + `overlay-group.json` + `overlay-cart-reminder-popup.js` (Welcome reuse JS này).
**Flag:** `overlay_welcome_popup` / `_mobile` → `enabled: false` (đã sẵn trong group, không cần sửa thêm).
**LIVE:** code Welcome có sẵn, storefront không hiện popup cho đến khi bật flag.

## 2026-09-08 — Pull LIVE → local → DEV (giữ logic DEV)

**User:** pull LIVE; rồi sync DEV nhưng giữ hết logic DEV vừa nãy.
**Done:**
1. `shopify theme pull --theme 183186358588 … --force` → local = LIVE
2. Pull DEV `#186878558524` → `_dev_preserve/` (snapshot)
3. Restore logic DEV lên local (Welcome / Step2 / teaser + JS/snippet khác LIVE + `overlay-group.json`)
4. `shopify theme push --theme 186878558524 … --force` → DEV = LIVE nền + logic DEV
**Giữ từ DEV:** overlay Welcome/Step2 (liquid+css+js), `welcome-teaser`, `overlay-group.json`, `cart-preview-modal.js`, `overlay-cart-reminder-popup.js`, `variant-link.js`, snippets cart/gift/success/variant-link.
**Từ LIVE:** templates / locales / settings (không đè bằng bản DEV cũ).
**Preview DEV:** https://myprintsy-3.myshopify.com?preview_theme_id=186878558524
**LIVE không đụng.** Snapshot `_dev_preserve/` còn local nếu cần đối chiếu.

## 2026-09-06 — Cài Ponytail (Cursor rules)

**User:** cài https://github.com/DietrichGebert/ponytail
**Cách:** Cursor = copy `.cursor/rules/ponytail.mdc` (`alwaysApply: true`). Không ghi đè `AGENTS.md` MyPrintsy. Không push theme (chỉ agent rules local).

## 2026-09-05 — Đo lại ATC Limoncello **không** CPU throttle

**User:** mình thấy ~7s ra modal ATC; sao đo 12.7s?
**Giải thích:** lần trước `ATC_CPU=4` (giả lập máy yếu) → render Customily 0→5.3s bị kéo dài.
**Đo lại:** `ATC_CPU=1`, type ANNA, tap `#customily-cart-btn` (`measure-atc-limoncello-fast.js`).

| Mốc | ms (no throttle) | So với 4x |
|---|---:|---|
| First Customily net (preview URL) | **921** | 5320 |
| S3 upload xong | ~3434 | ~8007 |
| CDN HEAD xong | ~5137 | ~9759 |
| EPS xong | ~5893 | ~10571 |
| `POST /cart/add` start | **6097** | 11502 |
| `POST /cart/add` done | **8798** | 12712 |

**Kết luận:** không throttle ≈ **~6–9s** (khớp user ~7s). 12.7s là lab 4x. Vẫn ~Customily chiếm phần lớn trước `/cart/add`.

## 2026-09-05 — Đo lại ATC mobile Limoncello mug (LIVE)

**User:** video PDP load lâu + ATC lâu; đo lại product limoncello trên mobile.
**URL:** `/products/mediterranean-style-majolica-print-sun-kissed-limoncello-personalized-accent-mug-upthth1l21`
**Setup:** Playwright iPhone 414×896, CPU throttle **4x**, type `ANNA`, tap `#customily-cart-btn` (`scripts/measure-atc-tap.js`).

**ATC timeline (từ lúc tap):**

| Giai đoạn | ms | Ai |
|---|---:|---|
| Render preview (chưa network) | 0 → ~5320 | Customily CPU |
| Presigned preview URL ×2 | 5320 → 6096 | Customily |
| Upload S3 preview+thumb | 6137 → 8007 | Customily |
| HEAD verify CDN | 8065 → 9759 | Customily |
| `RequestFutureProductionFile` | 9909 → 10571 | Customily |
| `/cart.js?customily_upsell` | 10887 → 10924 | Customily |
| **`POST /cart/add`** | **11502 → 12712** | **Theme (~1.2s)** |
| `cart.js` ×3 | 12813 → 13655 | Theme |

**Tổng đến `/cart/add` done:** ~**12.7s** · Theme chỉ ~**1.2s** · Customily ~**90%+**.
**UI:** modal “Item has been added…” hiện (screenshot `debug-atc-tap.png`); selector Dawn `cart-notification.active` không khớp → script báo `notified:false` dù đã add.

**Gallery cold load** (`measure-limoncello-gallery-load.js`, chưa gõ tên): DOMContentLoaded ~6.4s; main+thumbs Shopify ready ~**8.3s**. Video trắng gallery có thể là lúc Customily/canvas xen giữa (sau personalize) — cold load không blank.

**Kết luận:** Cùng pattern Aug 19 — ATC chậm chủ yếu Customily pipeline. Chưa sửa code (chỉ đo).

## 2026-08-25 — Thêm AGENTS.md / ARCHITECTURE.md / PROGRESS.md

**User:** thêm các file md để tối ưu khi dùng agent.
**Done:**
- `AGENTS.md` — rules, CodeGraph, deploy DEV, boundaries
- `ARCHITECTURE.md` — overlay map, layout, data flow
- `PROGRESS.md` — trạng thái + next steps
**Note:** agent nên đọc 3 file này + dùng `codegraph_explore`.

## 2026-08-25 — Setup CodeGraph cho repo theme

**User:** setup https://github.com/colbymchenry/codegraph cho repo này.
**Done:**
- `npm i -g @colbymchenry/codegraph@latest` (v1.5.0)
- `codegraph install --target=cursor --location=local` → `.cursor/mcp.json`
- `codegraph.json` exclude `_live_*`, `node_modules`, …
- `codegraph init` → 332 files, 3,602 nodes, 6,380 edges (~1.5s)
- Telemetry off
**Next:** Restart Cursor để MCP CodeGraph load.

## 2026-08-24 — Welcome-Step2 mobile GUI theo mockup

**User:** design Welcome step 2 cho mobile.
**Done (GUI only):**
- Top image + bottom panel BG (user upload, hoa/lemon hai bên)
- Heading + flourish / code box / info / divider / timer label+box / help
- 3 nút pill: navy BESTSELLERS / outline TRENDING / gold Browse All Deals (+ SVG icons)
- CSS `overlay-welcome-step2-mobile.css`; timer chưa countdown
**Push DEV** `#186878558524` ✅

## 2026-08-24 — Welcome-Step2 desktop GUI theo mockup

**User:** desktop thiết kế kiểu mockup Welcome Step 2.
**Done (GUI only):**
- Layout 50/50: left image + right panel BG (user upload) như Welcome
- Heading / code box + copy / info / timer box / help / 2 buttons / Browse All Deals
- CSS riêng `overlay-welcome-step2.css` (Playfair, navy/gold)
- Timer box text setting — chưa countdown logic
- Mobile chưa đụng
**Push DEV** `#186878558524` ✅

## 2026-08-24 — Clone Success opt-in → Welcome-Step2 (desktop + mobile)

**User:** keep logic Welcome; clone Success opt-in thành Welcome-Step2 desktop + mobile.
**Done:**
- `sections/overlay-welcome-step2.liquid` — schema `Welcome-Step2 (desktop)`
- `sections/overlay-welcome-step2-mobile.liquid` — schema `Welcome-Step2 (mobile)`
- `assets/overlay-welcome-step2.js` — custom element `welcome-step2-popup` / `WelcomeStep2Popup` (tách khỏi Success)
- Reuse CSS + snippet Success; settings copy từ Success
- Wire `overlay-group.json` (sau Welcome, trước Success)
- Welcome gốc không đụng
**Push DEV** `#186878558524` ✅

## 2026-08-23 — Welcome desktop: fix double "YOU'VE GOT AN"

**User:** sao bị double chữ you've got an.
**Nguyên nhân:** fallback gán line1 = "YOU'VE GOT AN" + line2 = full heading → double.
**Done:** split theo `EXTRA` (ổn định hơn); bỏ fallback double.
**Push DEV** `#186878558524` ✅

## 2026-08-23 — Welcome desktop: sửa lại xuống dòng (heading + subtext)

**User:** bản desktop lại bị mất xuống dòng.
**Nguyên nhân:** Liquid lỗi apostrophe `'YOU'VE GOT AN'` → push trước fail, xuống dòng không lên DEV.
**Done:** quote `"YOU'VE GOT AN"`; hard-split heading 2 dòng; auto `<br>` trước `exclusive` nếu thiếu.
**Push DEV** `#186878558524` ✅

## 2026-08-23 — Welcome desktop: đẩy Congratulations + heading lên

**User:** cho đoạn Congratulations và You...off dịch lên trên 1 tí.
**Done:** .welcome-popup__copy translateY(-1.6rem) + giảm padding-top / tăng padding-bottom panel phải.
**Push DEV** #186878558524 ✅

## 2026-08-23 — Welcome desktop fonts giống mockup

**User:** để font chữ như ảnh.
**Done:** Great Vibes (Congratulations script) + Playfair Display (heading serif) + Poppins (subtext/button/dismiss). Load Google Fonts trong section Welcome desktop.
**Push DEV** `#186878558524` ✅
## 2026-08-23 — Welcome desktop GUI: panel phải = ảnh nền + overlay chữ/nút

**User:** làm cách A; bên phải chỉ chèn text + màu + button; background user up.
**Done (GUI only):**
- `overlay-welcome-popup.liquid`: bỏ logo/cart/Klaviyo; Left image + Right panel background (`image_content_bg`); text/button/dismiss + color pickers
- `overlay-welcome-popup.css`: 50/50, content overlay trên bg cover
- Defaults copy mockup (Congratulations / 10% OFF / GET MY DISCOUNT)
**Push DEV** `#186878558524` ✅ — LIVE chưa. Logic trigger giữ từ cart-reminder JS.
## 2026-08-22 — Clone Cart reminder → Welcome (desktop) / Welcom (mobile) + push DEV

**User:** clone bộ Cart reminder desktop+mobile, đổi tên bản clone thành Welcome (desktop) / Welcom (mobile), push DEV.
**Done:**
- `sections/overlay-welcome-popup.liquid` (clone desktop) — name schema `Welcome (desktop)`
- `sections/overlay-welcome-popup-mobile.liquid` (clone mobile) — name schema `Welcom (mobile)` (đúng spelling user)
- Thêm vào `overlay-group.json` (sau Cart reminder); settings copy từ cart reminder
- Storage key riêng `welcome-popup` / `welcome-order-completed` (không đụng cart reminder)
- `enabled: false` mặc định — Cart reminder gốc vẫn chạy; bật Welcome trong theme editor khi làm việc
- Dùng chung JS/CSS cart reminder (chưa tách logic)
**Push DEV** `#186878558524` ✅ — LIVE chưa.

## 2026-08-22 — Đồng bộ LIVE → local → DEV

**User:** ??ng b? t? live v? dev ?? chu?n b? code tr�n DEV.
**Done:**
1. `shopify theme pull --theme 183186358588 --store myprintsy-3.myshopify.com --force` ? local = LIVE (Shopify Dawm Copy - Test)
2. `shopify theme push --theme 186878558524 --store myprintsy-3.myshopify.com --force` ? DEV - MyPrintsy Overlays
**Preview DEV:** https://myprintsy-3.myshopify.com?preview_theme_id=186878558524
**LIVE kh�ng ??ng.** Local + DEV ?� kh?p LIVE, s?n s�ng code tr�n DEV.

## 2026-08-19 ? IG in-app: scroll xu?ng footer b? ??

**User:** b?n m? web t? Instagram, scroll xu?ng cu?i th� ??.
**Context:** video ~0:15, in-app browser (thanh "Messenger" d??i URL), ?� t?i footer Policies / Get In Touch, widget chat Shopify Inbox hi?n g�c ph?i.
**Nguy�n nh�n kh? d? (ch?a s?a):**
1. Instagram/Messenger WebView iOS y?u h?n Safari.
2. T?i ?�y trang k�ch ho?t c�ng l�c: newsletter Klaviyo `Yy9PSK` (IntersectionObserver + `refreshForms` + `dispatchEvent('resize')` m?i 500ms), Shopify Inbox, cart-reminder `fast-scroll` khi scroll s�u.
3. Main thread ?� b?n ~48% l�c idle (Klaviyo rAF, Judge.me, customily-preview-atc).
**Ch?a ??ng code** ? ch? user.

## 2026-08-19 ? ?o th?t ATC mobile ~12s: 90% l� Customily

**User:** b?m Add to Cart ph?i ~10s m?i hi?n notification.

**?o:** Playwright mobile 414�896, CPU throttle 4x, LIVE product `with-a-fck-fck-here-personalized-ceramic-coffee-mug` (scripts `measure-atc-tap.js`, `profile-pdp-mobile.js`).

**Timeline (m?c t�nh t? l�c tap ATC):**

| Giai ?o?n | Th?i gian | C?a ai |
| --- | --- | --- |
| Render + export ?nh preview (kh�ng c� network) | 0 ? 4.8s | Customily (CPU) |
| Xin presigned URL S3 | 4.8 ? 5.3s | Customily |
| Upload preview + thumb l�n S3 | 5.7 ? 8.1s | Customily |
| HEAD verify 2 file tr�n CDN | 7.5 ? 9.0s | Customily |
| `RequestFutureProductionFile` (EPS) | 9.2 ? 9.6s | Customily |
| `/cart.js?customily_upsell` | 10.0 ? 10.1s | Customily |
| **`POST /cart/add`** | **10.7 ? 11.8s** | **Theme (1.1s)** |
| `cart.js` �3 + notification hi?n | ~12.3s | Theme + app |

**Profile main thread l�c idle (40s):** `judgeme-stars.js` interval 400ms = 56ms/tick (3.36s), MO `load_feature` 5.1s, rAF `customily.js` 2.77s, `customily-preview-atc.js` interval 500ms = 30ms/tick (2.37s), rAF Klaviyo 2.11s, MO `customily-preview-atc` 0.7s, MO `judgeme-autofill-guard` 0.7s, `edd-pdp-placement` 250ms 0.46s ? **~48% main thread b?n khi ??ng y�n**.

**K?t lu?n:** `/cart/add` c?a theme ch? 1.1s; ~90% th?i gian n?m ? pipeline l?u design c?a Customily. Polling c?a theme kh�ng ph?i th? ph?m ch�nh nh?ng l�m 4.8s CPU ??u d�i th�m.

**Ch?a s?a** ? ch? user ch?n h??ng t?i ?u.

## 2026-08-19 ? Audit asset Customily (h??ng D: ch?nh Admin, kh�ng ??ng code)

**User:** ch?n D tr??c.

**?o (`scripts/audit-customily-assets.js`, `audit-customily-image-dims.js`):**

- Canvas Customily: **1024�1024** ? ?� ?�ng khuy?n ngh?, kh�ng ph?i v?n ??.
- ?nh mockup template (`cdn.customily.com/product-images/*`): **5 file 800�800**. File JPG g?c **101?180 KB** (t?ng ~700 KB); b?n **WebP Customily t? sinh l?i n?ng h?n: 189?358 KB** (t?ng 1.34 MB) ? mobile Chrome nh?n b?n WebP n?ng g?p ?�i.
- Preview export khi ATC: **JPEG 1000�1000 = 679 KB** + **thumb 500�500 = 251 KB** ? **upload ~930 KB** l�n S3 (2.5s); HEAD verify CDN 1.6s.
- Customily **kh�ng c� setting ch?nh ch?t l??ng/size ?nh preview** trong Admin (?� tra help center; "Meta Filters quality/size" l� cho AI image generation, kh�ng li�n quan).
- `RequestFutureProductionFile` (EPS) ch? 0.44s ? print file server-side, kh�ng ph?i n�t th?t.

**Khuy?n ngh? Admin:** n�n l?i 5 ?nh mockup xu?ng <100 KB; r� canvas print file (mm/inch + dpi) ?�ng v�ng in th?t c?a mug; b? dynamic image / template side kh�ng d�ng. ??c t�nh c?t ~1?2s, ph?n 4.8s render client v?n do Customily.

**Ch?a ??ng code theme.**

## 2026-08-19 ? Mobile ATC spinner l�u (gift box PDP)

**User:** ?i?n tho?i b?m Add to Cart load l�u, spinner k?t.
**Cause:** `startGhostKlaviyoWatch` MO body `subtree + attributes class/style` g?i `disarmGhostKlaviyoForms` (getComputedStyle) m?i mutation ? ATC `loading` + cart-notification innerHTML block main thread. Judge.me hardenAll c�ng l�c.
**Fix:** Klaviyo MO ch? `childList`, debounce 250ms, skip khi ATC `.loading`; Judge.me skip harden khi ATC loading.
**Push LIVE** `#183186358588` ?



## 2026-08-19 ? Mobile: tap email popup b? zoom

**User:** � Enter your email ?� g� ???c nh?ng iOS zoom.
**Cause:** font 1.4rem (~14px) < 16px ? Safari zoom khi focus.
**Fix:** input email popup mobile `font-size: 16px`.
**Push LIVE** `#183186358588` ?



## 2026-08-19 ? Mobile: Enter your email kh�ng hi?n b�n ph�m

**User:** popup cart-reminder mobile, tap � email vi?n xanh nh?ng kh�ng ra keyboard.
**Cause:** `judgeme-autofill-guard.js` pointerdown tr�n `input[type=email]` ? `readonly` + `blur` ngay trong gesture iOS ? focus visual, kh�ng m? keyboard. Unlock `readonly` sau 40ms qu� mu?n.
**Fix:** kh�ng burst-lock khi tap trong cart-reminder / Klaviyo / footer; b? email kh?i trigger Judge.me; live Klaviyo context g?m host `cart-reminder-popup` ?ang m?.
**Push LIVE** `#183186358588` ?



## 2026-08-19 ? GET IT NOW ?�ng popup, kh�ng ra success

**User:** b?m GET IT NOW kh�ng qua trang success, auto close.
**Cause:** `overlay_success_opt_in` (desktop) `disabled: true` trong `overlay-group.json`. Cart-reminder `completeKlaviyoSubmit` close reminder r?i `SuccessOptIn.open()` t�m `deviceTarget=desktop` ? kh�ng c� instance ? return false.
**Fix:** b?t section desktop; `SuccessOptIn.open()` fallback instance c�n l?i; `window.SuccessOptInPopup` expose.
**Push LIVE** `#183186358588` ?



## 2026-08-19 ? Q: pagination review 1, 2 b? d?c (ch? v?n ngang)

**User:** screenshot mobile ? `1 / 2 / > / >|` x?p c?t gi?a; h?i sao ch? d?c ch? ngang.
**Cause:** patch 13/08 k�o pager xu?ng cu?i list. Selector `[class*='jdgm-paginate']` match c? **container** `.jdgm-paginate` l?n **t?ng n�t** `.jdgm-paginate__page` / `__next-page` / `__last-page`. JS `ensureReviewPaginationAtBottom()` `appendChild` t?ng n�t ra ngo�i wrapper ? list `flex-direction:column` x?p d?c. CSS c�ng selector c�n `width:100%` + `display:flex` cho t?ng s?.
**Ch? c�n ngang:** widget Judge.me m?i (`.jm-pagination`, class n�t kh�ng ch?a `jdgm-paginate`) ? ch? move container, n�t ? trong v?n h�ng ngang. S?n ph?m ?5 review th� kh�ng hi?n pager.
**Fix:** CSS/JS ch? target container `.jdgm-paginate` / `.jm-pagination` (b? `[class*='jdgm-paginate']`). `flex-direction:row` + n�t `width:auto`. JS `rehomeOrphanPagerButtons()` gom n�t ?� b? k�o ra ngo�i. GUI only.
**Push LIVE** `#183186358588` ?

## 2026-08-19 ? Q: custom xong ra trang kh�c v�o l?i b? load 2 l?n

**User:** l�c custom xong tho�t ra trang kh�c, v�o l?i PDP b? load 2 l?n (kh�ch b�o).
**Ph�n t�ch:** theme kh�ng `location.reload` tr�n PDP. Customily l?u t�n/pack localStorage ? v�o l?i: (1) Shopify ?nh g?c, (2) Customily restore + GetProduct + v? l?i canvas = nh�n nh? load 2 l?n. Theme pin fallback Shopify + gallery MO l�m flash r� h?n. Prefetch Pack HTML sau idle l� request ph?, kh�ng reload trang.
**Ch?a fix** ? user b�o bug, h?i tr??c khi s?a logic.
**Admin:** t?t `Settings ? Advanced settings ? Save personalization data before adding to cart` (Customily help). Kh�ng ??ng theme.

## 2026-08-18 ? Desktop scroll: nav ?� / b? Size-Pack che (z-index)

**User:** cu?n PDP desktop ? menu "Home & Living"? overlap Size/Type/Pack; h?i do z-index h�m tr??c.
**Cause:** `product__info-wrapper` + `variant-selects` `z-index:5/20` > header Dawn `z-index:3?4` ? c?t ph?i paint tr�n sticky nav khi scroll.
**Fix:** G? z-index tr�n info/variant-selects; gi? gallery isolate `z-index:0` + Klaviyo `pointer-events:none` (kh�ng c?n z-index cao tr�n pills).
**Push LIVE** `#183186358588` ?

## 2026-08-13 ? Q: Opera kh�ng load Customily preview (Chrome OK)

**User:** h?i ? Opera l?i kh�ng load Customily; Chrome b�nh th??ng. Screenshot: Pack 5 + t�n ? gallery ch? ch? tr�n n?n t�m (options v?n c�).
**Ph�n t�ch:** Customily load **m?t ph?n** (form + canvas ch?), thi?u l?p mockup doormat. Theme kh�ng c� nh�nh Opera-specific. Kh? n?ng cao: Opera ad/tracker blocker ch?n `cdn.customily.com` assets, ho?c timing lazy img khi?n fallback Shopify ch?a pin. C?n DevTools Opera ? Network/Console.
**Ch?a fix** ? user ch? h?i.
**Network Opera (filter customil):** script/CSS Customily 200/304, GetProduct + .webp OK ? **kh�ng b? ch?n CDN**. L?i preview = runtime (QuotaExceededError localStorage ??y ho?c canvas thi?u l?p mockup), kh�ng ph?i load fail.

## 2026-08-13 ? Desktop: Type + Pack kh�ng b?m (ch? Size ???c)

**User:** ch?n ???c Size; Type v� Buy More Save More kh�ng click tr�n desktop.
**Cause:** Klaviyo ghost form (~440�213) + MAYBE LATER v?n n?m ?� v�ng Type/Pack (Size ? tr�n n�n c�n ?n). `z-index:-1` ch?a ?? ? wrapper Klaviyo v?n gi? hit area.
**Fix:** Park ghost Klaviyo xu?ng ?�y (`translateY(100%)`, `z-index:-9999`, `visibility:hidden`); cage embed slot popup ?�ng; `variant-selects` pills `z-index:20`; MO theo d�i Klaviyo inject.
**Push LIVE** `#183186358588` ?

## 2026-08-13 ? H? Klaviyo ghost xu?ng ?�y stacking

**User:** ?cho n� ?� xu?ng cu?i c�ng ?c k? ? mu?n l?p MAYBE LATER / form Klaviyo n?m d??i c�ng, kh�ng ?� Pack.
**Fix:** CSS `z-index:-1` + JS `setProperty z-index:-1` tr�n form/n�t ghost v� wrapper nh? (kh�ng full-screen). Popup m? / footer / newsletter gi? `z-index:auto`.
**Push LIVE** `#183186358588` ?

## 2026-08-13 ? Pack 1/Type b? form Klaviyo trong su?t ?�

**User:** Pack 1 b? che; DevTools highlight `form.needsclick.klaviyo-form` 440�213 ph? Type + Pack 1/2. H?i form ? ?�u; ti?p theo highlight n�t **MAYBE LATER** (`button.klaviyo-form-button`) ?� Pack 4/5.
**Ngu?n:** Klaviyo onsite (app `company_id=WcffRx`). Theme embed cart-reminder desktop `XumJWa` / mobile `YaAhN2` ? n�t dismiss ?MAYBE LATER? (JS `bindKlaviyoEmbedDismiss`). Popup ?�ng nh?ng Klaviyo v?n ?? form/n�t invisible tr�n PDP. Footer newsletter `Yy9PSK` l� embed th?t.
**Fix:** `pointer-events:none` + `z-index:-1` cho form/n�t ghost v� wrapper nh?; ch? b?t l?i khi `.cart-reminder-popup.is-open` / footer / newsletter. **Kh�ng** exception `[data-klaviyo-embed-slot]`.
**Push LIVE** `#183186358588` ?

## 2026-08-13 ? Chrome: Pack 2/3 click kh�ng ?n (nh? b? ?�)

**User:** Chrome b?m Pack 2/3 kh�ng ???c ? nh? c� l?p ?�.
**Cause:** (1) overlay gallery `z-index` 4 + sticky media `z-index` 2 ?� c?t form; (2) Chrome autofill � t�n ph? pill; (3) `pointerover` + `inert` tr�n host Customily ch?n click.
**Fix:** isolate media-wrapper `z-index:0`, info/variant-selects `z-index:5`; b? `inert` + `pointerover`; autocomplete `one-time-code`.
**Push LIVE** `#183186358588` ?

## 2026-08-13 ? Reload Pack 3 v?n tr?ng; b?m Pack kh�c m?i ???c

**User:** sau reload v?n ch? tr�n t�m; ph?i ch?n Pack kh�c m?i ra doormat.
**Cause:** Customily chi?m `.media` l�c restore t�n (reload) ? nu?t fallback b�n trong. B?m Pack ? `variantChange` d?ng l?i media n�n ??n?.
**Fix:** pin ?nh Shopify l�n `product-media-container` (ngo�i `.media`); modal-opener `z-index:1` ?? canvas kh�ng ?�; pin ngay + interval 40s, kh�ng skip khi updating.
**Push LIVE** `#183186358588` ?

## 2026-08-13 ? Fix Pack 3 + t�n + reload ? ch? c�n ch? tr�n n?n t�m

**User:** OK s?a ? Pack 3, nh?p t�n, reload ? gallery ch? c�n ch? (thumbnail v?n ?�ng).
**Cause:** Customily restore t�n + focus � name ? poll gallery b? skip (`isTypingInCustomily`); Customily ?n/??i class ?nh Shopify; canvas text-only n?m tr�n n?n `.media`.
**Fix (desktop ?750px only):** Shopify-CDN src lu�n l� base (b? `cl-preview`); fallback img t? src ?� l?u/thumbnail n?u Customily ??i src; MO gallery re-�p visible; poll kh�ng skip khi ?ang focus � t�n. Mobile kh�ng ??i. Kh�ng ??c pixel canvas.
**Push LIVE** `#183186358588` ? ? user b�o v?n kh�ng ?n.

## 2026-08-13 ? Check: kh�ng ph?i cache; stacking canvas ?� wrapper

**User:** s?a m�i kh�ng ?n ? cache hay sai code?
**Check LIVE:** theme `#183186358588` ?�ng [live]; HTML ?� tr? `customily-preview-atc.js?v=?274` (timestamp push h�m nay). **Kh�ng ph?i cache file c?.**
**Sai th?t:** Customily wrap/??t canvas **c�ng c?p** `.media > *`. `z-index` tr�n `<img>` ch? stack trong wrapper ? canvas `z-index:1` v?n ?�. Fallback `insertBefore(firstChild)` n?m **d??i** l?p ch?.
**Fix:** fallback `appendChild` + `z-index:6` ph? `.media`; h? canvas c? `product-media-container` xu?ng 0; blob/data URL = overlay; ancestor wrapper `z-index:3`.
**Push LIVE** `#183186358588` ?

## 2026-08-13 ? Desktop: Pack 2 + t�n + reload ? ch? c�n ch? tr�n n?n tr?ng

**User:** ch?n Pack 2, nh?p t�n, reload ? gallery ch? hi?n ch? (vd. ?jj?) tr�n tr?ng; l?n ??u v�o OK; mobile kh�ng b?.
**Cause:** reload Customily restore t�n s?m tr�n canvas tr?ng + theme ?n ?nh Shopify (`myprintsy-has-customily-overlay`).
**Fix (desktop ?750px only):** kh�ng ?n Shopify; ?nh mug `z-index:3`, canvas Customily d??i. Mobile gi? logic c?. Kh�ng ??c pixel canvas.
**Push LIVE** `#183186358588` ?

## 2026-08-13 ? Pagination review xu?ng cu?i list

**User:** mobile ph�n trang `1 2 3` n?m gi?a review (sau review ??u) ? mu?n xu?ng cu?i ph?n review.
**Fix:** CSS flex column + `order:9999` cho `.jdgm-paginate` / `.jm-pagination`; JS `ensureReviewPaginationAtBottom()` append pager cu?i list. GUI only.
**Push LIVE** `#183186358588` ?

## 2026-08-12 ? Revert gallery/preview fixes v? l�c sau ?n ?5 star?

**User:** revert h?t code t? l�c s?a preview gallery; v? th?i ?i?m v?a xong ?n histogram 5 star.
**Scope:** `customily-preview-atc.js` + `.css` ? undo to�n b? patch Aug 12 (scroll/idle/keepalive/z-index desktop?). Gi? `upgradeModalPreviewImage` + gallery overlay c? (`isCustomilyOverlayImgReady`). **Kh�ng ??ng** `judgeme-stars` (?n 5 star gi? nguy�n).
**Push LIVE** `#183186358588` ?

## 2026-08-12 ? Desktop gallery gi?ng mobile (kh�ng ??ng mobile)

**User:** mobile kh�ng m?t ?nh ? l�m desktop load gi?ng mobile; kh�ng s?a mobile.
**Gi?i th�ch:** Dawn `.media > *` absolute ch?ng l?p. Desktop Customily hay ?n img + ?� canvas tr?ng ? tr?ng. Mobile Customily/layout slider th??ng v?n th?y ?nh Shopify.
**Fix (desktop ?750px only):** Shopify `z-index:3`, canvas d??i; g� t�n m?i `preview-live`. JS skip demote tr�n mobile.
**Push LIVE** `#183186358588` ? (`customily-preview-atc.js` + `.css`)

## 2026-08-12 ? Load Customily xong v?n m?t ?nh ch�nh

**User:** options/Enter Name ?� v?; ?nh ch�nh v?n tr?ng sau Customily load (thumb c�n).
**Cause:** canvas Customily tr?ng ?� l�n ?nh Shopify (z-index cao h?n) d� base ?� `opacity:1`.
**Fix:** ?nh Shopify `z-index:3` m?c ??nh; canvas/overlay Customily `z-index:1` (d??i). Ch? khi user g� t�n ? class `myprintsy-customily-preview-live` n�ng overlay l�n. Kh�ng ??c pixel canvas.
**Ch?a push** ? ch? user.

## 2026-08-12 ? H?i: Pack 4 reload ? m?t � Enter Name

**User:** ch?n Pack 4 ? reload v?n Pack 4 nh?ng m?t Personalized Options (� ghi t�n) + (?nh) ch? c�n ATC.
**Quan s�t ?nh:** kh�ng c� kh?i Customily options / n�t Preview; ATC theme; mug ?Stephanie? = ?nh Shopify m?u (kh�ng ph?i live Customily).
**Cause kh? d?:** Customily die l�c init ? nghi m?nh `keepCanvasAlive` (m?i 1s `fillRect`/`getImageData` l�n canvas Customily) + poll gallery ??ng canvas ? app Customily crash/kh�ng inject options. Pack 4 ch? l�m l? v� load n?ng h?n (4 � t�n).
**Fix:** b? to�n b? canvas keepalive / snapshot / `getImageData` / toggle opacity canvas. Ch? c�n �p ?nh Shopify visible + h?y Dawn fade. Poll gallery nh? 2s ~3 ph�t.
**Push LIVE** `#183186358588` ? (`customily-preview-atc.js` + `.css`)

## 2026-08-12 ? B? ?n ?nh Shopify; Customily ch? overlay

**User:** v?n tr?ng; b? logic ?n ?nh, c� overlay th� ghi ?� th�i.
**Fix:** kh�ng c�n CSS/JS ?n Shopify (`opacity:0`). ?nh g?c lu�n hi?n `z-index:1`. Canvas/img Customily `position:absolute` ?� `z-index:2`; canvas ch?a v? th� `opacity:0` ?? kh�ng ph? tr?ng. Ghi ?� Customily hide b?ng `forceShopifyBaseVisible`.
**Push LIVE** `#183186358588` ? + **DEV** `#186878558524` ?

## 2026-08-12 ? ?nh tr?ng ngay khi Preview/ATC Customily load xong

**User:** Customily load xong, n�t Preview + Add to cart hi?n ? ?nh ch�nh tr?ng lu�n.
**Cause:** l�c mount n�t, Customily ?n ?nh Shopify + ?� canvas/img tr?ng (tr?ng). Theme c? coi overlay img `naturalWidth>40` l� ready d� ?ang `display:none` ? ?n Shopify.
**Fix:** ch? ?n Shopify khi overlay **?ang hi?n** ho?c canvas c� pixel m�u (kh�ng ph?i fill tr?ng). Shopify `z-index:3` cho ??n l�c overlay th?t s? v?. Sync l?i l�c Preview/ATC xu?t hi?n.
**Push LIVE** `#183186358588` ? + **DEV** `#186878558524` ?

## 2026-08-12 ? H?i: scroll xu?ng r?i l�n m?t ?nh gallery PDP

**User:** desktop l??t xu?ng r?i l�n ? � ?nh ch�nh tr?ng, thumbnail v?n c�n.
**Cause kh? d?:** Customily overlay (canvas/img) b? browser/Customily pause khi ra kh?i viewport; theme ?ang ?n ?nh Shopify (`myprintsy-has-customily-overlay` + Customily hide base) ? c? 2 l?p tr?ng. Poll gallery ch? ~18s l�c load, kh�ng re-sync l�c scroll l?i.
**Kh�c:** Dawn `scroll-trigger animate--fade-in` c� th? ?? `opacity:0.01` khi offscreen.
**Fix:** user mu?n kh�ng t?t preview ? snapshot overlay tr??c khi ra viewport, IO restore khi k�o l�n, h?y Dawn fade gallery, `content-visibility:visible`. Fallback Shopify ch? khi kh�ng c�n snap.
**Push LIVE** `#183186358588` ? + **DEV** `#186878558524` ?

## 2026-08-12 ? Gallery tr?ng lu�n c? khi kh�ng scroll (idle)

**User:** ?? 1 l�c ?nh t? load tr?ng m?t (kh�ng c?n l??t).
**Cause:** Chrome/Customily x�a canvas khi idle; IntersectionObserver kh�ng fire n?u v?n trong viewport; poll overlay d?ng ~18s.
**Fix:** watchdog 1s `keepCanvasAlive` + n?u overlay blank th� hi?n snap (ngo�i `.media`) ho?c ?nh Shopify.
**Push LIVE** `#183186358588` ? + **DEV** `#186878558524` ?

## 2026-08-11 ? Desktop: ?n histogram ?5 star: 2??

**User:** desktop hi?n ?o?n ?5 start: 2?? ? mu?n b?.
**Cause:** Judge.me histogram (ph�n b? sao) ch? ?n tr�n mobile; desktop v?n hi?n / text b? c?t.
**Fix:** ?n `.jdgm-histogram` + rating-distribution m?i viewport (`judgeme-stars.css` + inject JS). Gi? sao + ?i?m + Based on + Write a review.
**Push LIVE** `#183186358588` ? + **DEV** `#186878558524` ?

## 2026-08-11 ? Modal Preview: ?nh n�t/l?n h?n

**User:** mu?n ?nh trong modal b?m Preview n�t h?n.
**Fix:** n?i card + `max-height` ?nh; JS `upgradeModalPreviewImage` ?u ti�n URL preview (kh�ng thumb) + quality cao h?n.
**Limit:** ?? n�t g?c v?n ph? thu?c template Customily (~1000px).
**Push DEV** `#186878558524` ? ? LIVE ch?a.

## 2026-08-11 ? H?i: ?nh Preview n�t h?n ???c kh�ng?

**Answer:** ???c m?t ph?n. N�t ch? y?u do Customily (background template ~1000px, canvas render) + ?nh g?c; theme ch? h? tr? nh? (tr�nh scale nh?, zoom). Ch?a ??ng code ? h?i user mu?n ch?nh ch? n�o (gallery / modal) + c� cho s?a kh�ng.

## 2026-08-11 ? Fix l?i review Laura l?ch tr�i (l?n 2)

**User:** Laura tr? xu?ng v?n l?ch tr�i sau fix clearfix.
**Fix:** `alignReviewItemsLeft()` ? ?n classic SSR khi c� revamp, dedupe `data-review-id`, ?o `getBoundingClientRect` c?n m?i item theo item ??u; CSS ch?n media bleed.
**Push LIVE** `#183186358588` ? + **DEV** `#186878558524` ?

## 2026-08-11 ? Fix iOS zoom khi focus "Start writing here?"

**Cause:** Safari zoom input/textarea khi `font-size < 16px`.
**Fix:** `judgeme-stars.css` + `.js` ? form review `font-size: 16px !important`.
**Push LIVE** `#183186358588` ? + **DEV** `#186878558524` ?

## 2026-08-11 ? Fix review list l?ch tr�i t? Laura tr? xu?ng

**Cause:** `.jdgm-rev__br` b? `display:none` + `clear:none` ? m?t clearfix float avatar; ?nh review l�m l?ch c�c item sau.
**Fix:** gi? clearfix (?n visual), clearfix header, constrain ?nh `max-width:100%`, normalize padding review items.
**Push LIVE** `#183186358588` ? + **DEV** `#186878558524` ?

## 2026-08-11 ? Fix footer Klaviyo SUBMIT l?ch ph?i (mobile) l?i

**User:** footer mobile l?i l?i ? SUBMIT tr�n/c?t ph?i d??i UNLOCK 10%.
**Fix:** harden `klaviyo-vip-form.css` mobile (column + stretch + clear position/float/margin); `newsletter-klaviyo-embed.js` resetBox + MutationObserver/resize re-tidy.
**Push LIVE** `#183186358588` ? + **DEV** `#186878558524` ?

## 2026-08-11 ? Fix Quantity UI v? sau reorder

**Cause:** `insertBefore` v�o parent c?a Preview (`.product-form__buttons`) ? CSS buttons l�m +/-/input v? (ch? c�n g?ch minus).
**Fix:** ??t Quantity **sibling ngay sau** `#customily-options` / custom-texts ? kh�ng nh�t v�o buttons.
**Push LIVE** `#183186358588` ? + **DEV** `#186878558524` ?

## 2026-08-11 ? Review header: sao ? ?i?m, b? "out of 5", Based on c?n tr�i

**User:** mu?n sao r?i ??n ?i?m; b? "out of 5"; "Based on ? reviews" th?ng h�ng tr�i v?i sao.
**Fix:** `judgeme-stars.js` ? `cleanAverageScoreText()` + classic/revamp header; CSS zero pad/margin tr�i cho Based on.
**Push LIVE** `#183186358588` ? + **DEV** `#186878558524` ? (c�ng batch Quantity reorder)

## 2026-08-11 ? User: Quantity n?m tr�n Personalized Options

**Explain:** Theme block order = Quantity tr??c Buy buttons; Customily inject Personalized Options v�o gi?a ? Quantity tr�ng nh? tr�n option.
**Fix:** `ensureQuantityAbovePreview()` trong `customily-preview-atc.js` ? khi c� Customily/native names, k�o Quantity xu?ng ngay tr�n Preview/ATC.
**Push LIVE** `#183186358588` ? + **DEV** `#186878558524` ?

## 2026-08-11 ? Fix Judge.me review header mobile (gi?ng WP)

**User:** ph?n review mobile l?i (histogram overlap) ? l�m gi?ng Wanderprints; desktop gi? nguy�n.
**Fix:** `judgeme-stars.css` + inject `judgeme-stars.js` ? `@media max-width:749px` ?n histogram, layout summary tr�i + Write a review ph?i.
**Push LIVE** `#183186358588` ? + **DEV** `#186878558524` ?

## 2026-08-09 ? X�a remote variants_link (dropdown)

**User:** dropdown v?n th?y `variants_link`.
**Fix:** `shopify theme push` kh�ng `--nodelete` + `--only` 3 file c? ? Cleaning remote.
**LIVE** `#183186358588` ? + **DEV** `#186878558524` ?

## 2026-08-09 ? Fix Size radio name newline + harden variant_link

**User:** b?m Size kh�ng ?n tr�n variant_link; h?i x�a `variants_link` dropdown.
**Cause:** `product-variant-options.liquid` capture `input_name` d�nh newline ? `name="Size-1\n"`.
**Fix:** `assign input_name = option.name | append: '-' | append: option.position`; harden `variant-link.js` (kh�ng redirect c�ng pathname).
**Push LIVE** `#183186358588` ? + **DEV** `#186878558524` ?
**variants_link remote:** ch?a x�a ???c qua CLI; user x�a tay Edit code (3 file c?).

## 2026-08-09 ? Template variant_link (thay variants_link)

**User:** x�a `variants_link`, t?o `variant_link` base Default product; click variant c� metafield Link url ? nh?y URL.
**Code:**
- X�a `templates/product.variants_link.json`, `assets/variants-link.js`, `snippets/variants-link-redirect.liquid`
- Th�m `templates/product.variant_link.json` (copy `product.json`)
- `assets/variant-link.js` + `snippets/variant-link-redirect.liquid`
- Gate `main-product.liquid` ? `template.suffix == 'variant_link'`
**Metafield:** `custom.link_url` (URL) tr�n Variant
**Note:** SP ?ang g�n `variants_link` ph?i ch?n l?i template `variant_link` trong Admin.
**Push LIVE** `#183186358588` ? + **DEV** `#186878558524` ?
**Remote:** file c? `product.variants_link.json` c� th? c�n tr�n theme (push `--nodelete`); dropdown c� th? v?n hi?n `variants_link` ??n khi x�a tay trong Edit code.

## 2026-08-09 ? Style form review: bo g�c + Submit ?? ATC

**User:** bo tr�n Cancel/Submit + � name/email nh? Preview/ATC; Submit `#be2926`.
**Code:** `judgeme-stars.css` + inject trong `judgeme-stars.js` (radius `0.8rem`).
**Push LIVE** `#183186358588` ? + **DEV** `#186878558524` ?

## 2026-08-09 ? Draft English message for Judge.me support

**User:** mu?n chat ti?ng Anh chi ti?t ?? t?t revamp / form x? xu?ng nh? Wanderprints.
**Deliverable:** copy-paste support message (EN).

## 2026-08-09 ? User: Early User tick/untick ??u popup

**Clarify:** Early User Program ? form x? xu?ng. Tr??c ?� untick; tick c?ng popup. `review_widget_revamp_enabled` v?n quy?t ??nh UX; c?n CSS/JS hack ho?c Judge.me support switch legacy widget.
**Ch?a code** ? ch? user duy?t hack theme.

## 2026-08-09 ? User: Early User Program ?t�ch r?i?

**Guide:** ?ang **checked** = widget m?i/modal. Mu?n gi?ng WP ? **b? t�ch** Join Early User Program ? Save ? hard refresh PDP.

## 2026-08-09 ? User g?i Styling tab Write a review flow

**Answer:** Styling ch? color/corner; v?n modal. Kh�ng c� toggle x? xu?ng. C?n legacy Review Widget / contact Judge.me / CSS hack theme.

## 2026-08-09 ? User: Write a review flow ?n�y c� k?

**Answer:** ?�ng khu v?c form fields, nh?ng preview = **popup modal**, kh�ng ph?i x? xu?ng. Flow tab kh�ng c� toggle modal vs inline. C?n form location / t?t Revamp (legacy) nh? WP.

## 2026-08-09 ? User h?i ti?p ?�u t?t Revamp (?ang Color and styling)

**Guide:** Revamp kh�ng n?m trong Color and styling. Xem Installation / Settings / header toggle widget; ho?c Write a Review widget Customize ? form location.

## 2026-08-09 ? Write a review ?x? xu?ng? nh? Wanderprints

**Diff:** Myprintsy `review_widget_revamp_enabled: true` vs Wanderprints `false` (classic). Form expand = Judge.me setting, kh�ng ph?i Liquid theme.
**WP CSS:** `style.judgeme.css` ch? style; v�i theme fix `jm-mfp-is-open { position:static }`.
**Ch?a s?a code** ? ch? user ch?n: t?t Revamp trong Judge.me admin hay CSS hack theme.

## 2026-08-09 ? User: t�m code Write a review ?? ??i spec

**Map:** N�t style = `judgeme-stars.css` + `styleHeaderLikeWP()` trong `judgeme-stars.js`. Click m? form = Judge.me app (kh�ng trong theme). Autofill click = `judgeme-autofill-guard.js`.

## 2026-08-08 ? T?t autofill to�n storefront

**User:** t?t lu�n, kh�ng bao gi? autofill tr�n trang. Push ?i.
**Code:** `judgeme-autofill-guard.js` ? harden m?i input/form; load m?i trang trong `theme.liquid`.
**Note:** Checkout Shopify hosted v?n ngo�i theme. Chrome c� th? v?n hi?n trong v�i case ? best-effort.
**Push LIVE** `#183186358588` ? + **DEV** `#186878558524` ?

## 2026-08-08 ? User: sao trang kh�c ko b? autofill review

**Clarify:** Popup v?n l� Chrome UI; trigger v� HTML Judge.me tr�n site (� email trong form). Site kh�c markup kh�c ? Chrome kh�ng g?i �. Kh�ng ph?i layer CSS theme ?�.

## 2026-08-08 ? Ch?n Chrome autofill Judge.me review

**User:** oke l�m ?i (Write a review + sao hi?n email).
**Code:** `judgeme-autofill-guard.js` + load trong `theme.liquid` (product/collection).
**Push LIVE** `#183186358588` ? + **DEV** `#186878558524`

## 2026-08-08 ? User: Write a review c?ng hi?n email autofill

**Answer:** C�ng nguy�n nh�n v?i b?m sao ? Chrome autofill + Judge.me form (� email), kh�ng ph?i layer theme.

## 2026-08-08 ? User: b?m 5 sao review hi?n email autofill

**Answer:** Kh�ng ph?i layer theme ?�. Chrome autofill + form Judge.me (c� � email g?n/focus). UI ?Qu?n l� ??a ch?? = Chrome.

## 2026-08-08 ? Rule: no Pack option ? 1 � t�n (no-customily)

**User:** SP kh�ng c� option Pack th� auto ch? 1 �. Nh?.
**Rule:** no-customily + kh�ng Pack/Buy more ? lu�n 1 field. C� Pack N ? N �.
**Code:** `hasPackOption()` trong `no-customily-pack-names.js` (explicit).
**Push LIVE** `#183186358588` ?

## 2026-08-08 ? Fix lu�n hi?n 6 � t�n (no-customily)

**User:** Pack n�o c?ng 6 �.
**Cause:** CSS `display:block` ghi ?� `[hidden]`.
**Fix:** `[hidden]{display:none!important}` + JS sync Pack ch?c h?n.
**Push LIVE** `#183186358588` ?

## 2026-08-08 ? Push LIVE No Customily pack names + ATC text

**User:** push live.
**Files:** buy-buttons, main-product, customily-preview-atc.js/css, no-customily-pack-names.js
**Push LIVE** `#183186358588` ?

## 2026-08-08 ? No Customily: ATC ??ng nh?t ?Add to cart?

**User:** ko rewrite c� sao ko; mu?n ??ng nh?t ch�nh t? 2 text.
**Answer:** skip c?ng OK; t?t h?n rewrite ?�ng `variantStrings.addToCart` / ?Add to cart? (c th??ng) tr�n no-customily ? kh?p Dawn, h?t nh�y. Customily c? v?n ?Add to Cart?.
**Push DEV** `#186878558524` ?

## 2026-08-08 ? No Customily: ATC kh�ng nh�y + � t�n theo Pack

**User:** Pack ??i ? ATC nh�y Add to cart/Cart; Pack N ? N � t�n. Ch? no-customily.
**Fix:** skip ATC label rewrite tr�n no-customily; `no-customily-pack-names.js` + 6 slot `Custom Text N`.
**Push DEV** `#186878558524` ?

## 2026-08-08 ? Rule: ch? s?a logic template No Customily

**User:** nh? ch? s?a logic theme m?i (no-customily), ??ng ??ng lu?ng Customily c?.
**Rule:** m?i thay ??i No Customily ph?i gate `template.suffix == 'no-customily'` / class `myprintsy-no-customily-preview`. Default product + Customily preview/ATC gi? nguy�n.
**Tighten:** CSS CustomText scoped d??i `.myprintsy-no-customily-preview`.

## 2026-08-08 ? Fix � CustomText + remove Preview no-customily

**User:** ch?a c� � t�n; Preview tr�n ATC h?ng ? remove.
**Fix:** input d�ng label+input r� (kh�ng Dawn `.field` floating); CSS hi?n placeholder; JS `remove()` Preview tr�n template no-customily.
**Push LIVE** `#183186358588` ?

## 2026-08-08 ? Push LIVE No Customily native + related

**User:** live ?i.
**Files:** buy-buttons, theme.liquid, main-product, product-info.js, customily-preview-atc.js/css, product-form.js
**Push LIVE** `#183186358588` ?

## 2026-08-08 ? No Customily: native properties[Custom Text] theo guide

**User:** l�m nh? h??ng d?n Shopify line item property.
**Code:** `buy-buttons.liquid` ? input `properties[Custom Text]` tr??c ATC (ch? `template.suffix == no-customily`); `theme.liquid` + ATC gate t?t Customily tr�n template n�y.
**Push DEV** `#186878558524` ?

## 2026-08-08 ? User h?i properties[Custom Text] native c� x�i ???c kh�ng

**Answer:** C� ? Shopify line item property ho?t ??ng, hi?n tr�n cart/order. Ph� h?p No Customily (?nh fix). L?u �: kh�ng thay Customily production n?u fulfillment d?a Customily; t�n property / multi-pack / required / style c?n kh?p quy tr�nh.

## 2026-08-08 ? No Customily: gi? � name, gallery Shopify c? ??nh

**User:** template v?n c� � nh?p name; ?nh kh�ng Customily preview ? ?nh fix t? Shopify.
**Code:** class `myprintsy-no-customily-preview` tr�n `product-info`; CSS ?n Preview/overlay/canvas; JS restore Shopify src + hide Customily media; `hasCustomilyPreviewHost` = false tr�n template n�y.
**Push DEV** `#186878558524` ?

## 2026-08-08 ? Push LIVE template No Customily

**User:** push live.
**File:** `templates/product.no-customily.json`
**Push LIVE** `#183186358588`

## 2026-08-07 ? T?o template No Customily + push DEV

**User:** t?o theme template "No Customily" base t? Default product, push l�n.
**File:** `templates/product.no-customily.json` (copy `product.json`)
**Push DEV** `#186878558524`

## 2026-08-06 ? Push DEV fix 2 ch? ATC

**User:** push dev.
**File:** `assets/product-form.js`
**Push DEV** `#186878558524` ?

## 2026-08-06 ? Fix 2 ch? Add to Cart khi ??i size

**Fix:** `product-form.js` ? getter `submitButtonText` b? qua `.myprintsy-btn-icon`; `repairSubmitButtonIcon` x�a ch? nh?m tr�n icon; `toggleSubmitButton` ghi ?�ng span nh�n.

## 2026-08-06 ? User: ??i size b? 2 ch? Add to Cart (SP kh�ng custom?)

**Explain:** Kh? n?ng cao ? `customily-preview-atc.js` g?n icon `<span>` v�o n�t ATC; khi ??i size `product-form.js` `toggleSubmitButton` ghi text v�o `querySelector('span')` (span ??u = icon) ? hi?n 2 l?n "Add to Cart". SP c� Customily th??ng ?n n�t theme n�n �t th?y; SP kh�ng custom d�ng n�t theme ? d? th?y. Ch?a fix (ch? gi?i th�ch, h?i user).

## 2026-08-05 ? User h?i sao b?m Write a review ra g?i � email

**Investigate:** Chrome autofill khi m? form review (Judge.me) ? input email trong form b? focus/detect.

## 2026-08-05 ? User h?i b? scripts theme c�n ch?y kh�ng

**Answer:** C� ? `scripts/` l� tool local (Node dump/measure), kh�ng ph?i runtime Shopify. ZIP theme kh�ng c?n scripts/node_modules.

## 2026-08-05 ? User ZIP 200MB vs limit 50MB

**Explain:** Folder workspace ? theme thu?n. `node_modules` ~520MB + `shopify-gift-box-discount` ~102MB + scripts/_live_* l�m ph�nh. Theme th?t (assets/layout/sections/?) ch? v�i MB. Zip ch? th? m?c theme Shopify, b? node_modules/scripts/app.

## 2026-08-05 ? User confirm n�t T?i l�n t?p zip

**Guide:** ?�ng ? Kh�m ph� ch? ?? ? Nh?p ? T?i l�n t?p zip. Upload xong = theme m?i trong th? vi?n, ch?a ?� Dawn live.

## 2026-08-05 ? User h?i upload ZIP theme l�n Shopify

**Guide only (kh�ng l�m g�):** C� upload ZIP ???c. Upload = t?o theme m?i (kh�ng ghi ?� Dawn hi?n t?i). Sau ?� Preview ? Publish khi OK. Mu?n update theme ?ang ch?y th� d�ng Shopify CLI `shopify theme push` ho?c Edit code / GitHub. ZIP thay th? tr?c ti?p theme live: kh�ng c� ? ph?i upload m?i r?i publish.

## 2026-08-05 ? User h?i sao LCP >2s vs Macorner 0.9s

**Explain:** LCP v?n ?nh Shopify; l?ch do contention (Customily CDN defer s?m + apps/CSS), ?nh SP n?ng h?n, ?o c�/kh�ng cache, c� th? fade-in animation; kh�ng ph?i LCP = Customily overlay.

## 2026-08-05 ? User h?i LCP l� ?nh Shopify hay Customily

**Answer:** th??ng LCP = ?nh Shopify gallery (img theme) v� Customily canvas/overlay load sau; Customily ch?m ?nh h??ng ?preview xong?, �t khi l� element LCP n?u ?nh Shopify hi?n s?m.

## 2026-08-05 ? Push LIVE idle Pack prefetch

**User:** push live.
**Files:** `product-info.js`, `pack-preview-cache.js`
**Push LIVE** `#183186358588`.

## 2026-08-05 ? Idle prefetch Pack sections (+ warm GetProduct imgs)

**User:** ok l�m prefetch idle.
**Code:** `product-info.js` ? sau load/idle prefetch HTML section t?ng Pack (cache s?n); `pack-preview-cache.js` ? warm ?nh t? GetProduct JSON, cache max 16.
**Push DEV** `#186878558524`.

## 2026-08-05 ? User h?i prefetch idle c� l�m load trang l�u h?n kh�ng

**Answer:** g?n nh? kh�ng ? ch?y sau load/idle, kh�ng ch?n LCP/FCP. C� th? t?n th�m data/bandwidth n?n; m?ng y?u c� th? tranh t� v?i request kh�c sau khi trang ?� hi?n.

## 2026-08-05 ? User: Customily load r?i, ch?n Pack v?n h?i ch?m

**Explain:** sau load, ch?m Pack ch? y?u Customily GetProduct + v? l?i preview (~1s l?n 1/pack). Theme ?� cache section HTML + GetProduct + skip Dawn media. L?n 2 c�ng Pack nhanh h?n. Prefetch all packs = logic m?i ? h?i tr??c n?u mu?n.

## 2026-08-05 ? User h?i sao Macorner LCP ~0.91s nhanh

**Explain:** LCP = `img.image-magnify-lightbox` (?nh SP g?c), kh�ng ph?i Customily canvas; cache b?t + kh�ng throttle; Customily/tracker kh�ng ch?n ?nh hero ? LCP fire s?m.

## 2026-08-05 ? Push LIVE Customily head+defer + ATC gate

**User:** push live.
**Files:** `layout/theme.liquid`, `sections/main-product.liquid`
**Push LIVE** `#183186358588`.

## 2026-08-05 ? User h?i ?defer l� sao?

**Explain:** `defer` = t?i script song song, ch?y sau khi HTML parse xong, gi? th? t?; kh�c `async` (ch?y ngay khi t?i xong, c� th? chen). Theme: Customily d�ng `defer`; tracker delay th�m sau idle.

## 2026-08-04 ? User h?i tracker ?� xu?ng body ch?a

**Answer:** ch?a chuy?n literal xu?ng cu?i body. GTM/gtag/TikTok v?n stub trong head nh?ng ch? load th?t sau idle/load (~2?3.5s) ? kh�ng tranh Customily l�c ??u. FB/Klaviyo th??ng qua app/`content_for_header`.

## 2026-08-04 ? User h?i Pack/Option c�n cache kh�ng, sao load l�u

**Answer:** c�n ? `pack-preview-cache.js` warm ?nh + cache memory `GetProduct` trong session. L?n 1 v?n ch?m (Customily API); l?n 2+ c�ng Pack URL m?i nhanh. Load l�u l?n ??u sau ??i head/defer l� b�nh th??ng; kh�ng t?t cache.

## 2026-08-04 ? User h?i c� c?n metafield Have Customily kh�ng

**Answer:** kh�ng b?t bu?c ? theme ?� gate ATC/Customily b?ng tag `no-customily`/`skip-customily`; metafield ch? optional n?u mu?n qu?n l� ki?u admin True/False.

## 2026-08-04 ? User g?i Network filter customi (check double-load)

**Verdict:** kh�ng double-load CDN ? ch? 1� `unified.js` + 1� `customily.js`; th�m theme helpers + opentype + API (status/GetProduct) l� b�nh th??ng.

## 2026-08-04 ? User h?i c�n g� theo guide Customily

**Answer:** ph?n code ?� xong tr�n DEV. C�n l?i: test DEV ? push LIVE n?u OK; metafield Have Customily kh�ng b?t bu?c (?� d�ng tag opt-out); ki?m tra kh�ng double-load script t? app embed.

## 2026-08-04 ? Customily guide: head+defer + ATC gate ? DEV

**User:** s?a ???c g� trong code th� s?a, push DEV.
**Code:**
- `theme.liquid`: Customily l�n `<head>`, `defer`, **unified tr??c** `customily.js`; tracking idle gi? nguy�n.
- `main-product.liquid`: disable ATC t?i `customily-app-will-load` / `wont-load` (fallback 5s); opt-out tag `no-customily`/`skip-customily`.
**Push DEV** `#186878558524`.

## 2026-08-04 ? Confirm PDF Guide Disable ATC = ?�ng ph?n ATC

**User:** h?i PDF `Guide-Disabled-Add-To-Cart-Button-Until-Customily-Loads` c� ?�ng guide kh�ng.
**Verdict:** ?�ng guide cho ph?n ?n/disable ATC t?i khi Customily load (event `customily-app-will-load` / `wont-load` + timeout 5s + optional metafield `custom.have_customily`). Kh�ng ph?i guide reorder script head/defer.
**Theme:** ch?a c� script n�y.

## 2026-08-04 ? Confirm hi?u advice Customily (load script)

**User:** g?i chat Customily support ? h?i ?Hi?u k?.
**Hi?u:** Customily ?ang `async` cu?i body ? b? tracker head tranh bandwidth; fix ?? xu?t: Customily l�n `head` + `defer`, unified tr??c `customily.js`, tracker xu?ng body; + ?n ATC t?i khi Customily ready.
**Hi?n theme:** tracking ?� defer idle; Customily v?n `async` cu?i body + th? t? `customily.js` r?i m?i unified (ng??c guide). Ch?a implement theo guide ? ch? user b?o l�m.

## 2026-08-03 ? Noti admin khi kh�ch chat Shopify Inbox

**User:** mu?n admin nh?n noti khi user chat tr�n khung Inbox storefront.
**Guide:** c?u h�nh push/desktop/email trong Shopify Inbox + app Shopify (kh�ng s?a theme).

## 2026-08-03 ? User g?i m�n Inbox Chat settings (h?i noti)

**User:** screenshot `Inbox ? Chat` (Agent / Staff hours / Instant answers).
**Guide:** m�n n�y l� c?u h�nh khung chat storefront, kh�ng ph?i push noti; h??ng d?n sang ch? b?t th�ng b�o.

## 2026-08-03 ? Shopify Inbox: h?i c�ch nh?n noti v? m�y

**User:** khung chat chat ???c nh?ng kh�ng th?y noti; mu?n th�ng b�o v? m�y.
**Note:** kh�ng s?a theme ? ?�y l� c?u h�nh Shopify Inbox / app / tr�nh duy?t (kh�ng ph?i code storefront).

## 2026-08-03 ? B? g?i � autofill tr�n Enter Name

**User:** b? logic hi?n g?i � ? Enter Name.
**Fix:** kh�ng c�n `autocomplete=name`; lu�n `autocomplete=off` khi g�; gi? shield Pack ?? popup Chrome kh�ng ?� Pack.
**Push LIVE** `#183186358588`.

## 2026-08-03 ? Enter Name b?m m�i m?i ???c sau reload

**User:** reload xong b?m Enter Name ch?m; nghi ph?i load xong.
**Cause:** `focusin` blur � t�n tr??c khi listener unlock g?n; + `disabled` l�c load.
**Fix:** unlock ngay ? document `pointerdown` capture; load ch? soft-lock; `disabled` ch? khi b?m Pack.
**Push LIVE** `#183186358588`.

## 2026-08-03 ? Autofill ch? khi b?m Enter Name; b? CSS z-index zoom

**User:** zoom 80% th� Pack ???c ? h?i c� ph?i do zoom; mu?n g?i � ch? khi b?m Enter Name; ??ng CSS kh�ng c? ??nh.
**Gi?i th�ch:** ?�ng autofill Chrome (v? tr� popup ??i theo zoom), kh�ng ph?i CSS layout theme.
**Fix:** b? z-index variant-selects; � t�n m?c ??nh lock `autocomplete=off`; ch? khi user pointerdown Enter Name ? `autocomplete=name`; b?m Pack th� dismiss popup b?ng JS.
**Push LIVE** `#183186358588`.

## 2026-08-03 ? Pack-only kh�ng b?m: autofill ?� Buy More

**User:** Size/Option b?m ???c; Buy More Save More (Pack) kh�ng.
**Cause:** Pack n?m s�t � Enter Name ? Chrome autofill ?� ?�ng v�ng Pack; Size/Option cao h?n n�n tho�t. Autofill l� UI browser, `pointer-events:none` kh�ng xuy�n ???c.
**Fix:** hover/pointerdown Pack ? `disabled` nh�y + `inert` host ?? ?�ng popup; `autocomplete=new-password`; z-index variant-selects > customily.
**Push LIVE** `#183186358588`.

## 2026-08-03 ? Autofill v?n ?� Pack: kh�a � t�n m?nh h?n

**User:** v?n b? ? b?m Pack ra g?i � email, kh�ng ??i Pack.
**Cause:** focus programmatic / Chrome v?n m? autofill tr�n ?Enter Name?; click tr�ng dropdown.
**Fix:** ch? unlock � t�n khi user pointerdown tr?c ti?p; freeze + pointer-events:none l�c b?m Pack; type=search; ch?n focusin sau Pack click.
**Push LIVE** `#183186358588`.

## 2026-08-03 ? Fix Chrome autofill ?� Pack sau reload

**User:** reload xong b?m Pack ra g?i � email/S?T, kh�ng ??i ???c Pack.
**Cause:** Chrome autofill � ?Enter Name? (Customily) n?i ?� l�n pill Pack ? click tr�ng g?i �.
**Fix:** readonly-until-focus + `autocomplete=new-password`; blur � Customily tr??c khi pointerdown v�o variant pills.
**Push LIVE** `#183186358588`.

## 2026-08-03 ? Fix Pack kh�ng b?m ???c sau gallery hotfix

**User:** gallery ?c r?i nh?ng b?m ??i Pack kh�ng ???c.
**Cause:** Dawn `viewTransition` gi? `variant-selects` c? 500ms ? tr�ng `name` radio; + poll `forceShopifyBaseVisible` m?i 400ms ?�nh nhau v?i Customily; focus l?i radio sau swap.
**Fix:** x�a ngay variant-selects c? sau swap; b? focus radio; gi?m poll gallery; autocomplete `one-time-code`.
**Push LIVE** `#183186358588`.

## 2026-08-03 ? Hotfix: canvas b? ?n ? tr?ng + Pack 1 kh�ng load

**User:** v?n tr?ng + ch?; b?m Pack 1 kh�ng load.
**Cause:** fix tr??c `opacity:0` canvas khi ch?a ready + Customily c?ng ?n ?nh Shopify ? blank; Pack ??i canvas nh?ng b? ?n n�n ?kh�ng load?.
**Fix:** kh�ng bao gi? ?n canvas; ch? ?n base khi Customily IMG ready; �p hi?n ?nh Shopify khi ch?a ready; t?t autocomplete � name (kh�ng ??i name=).
**Push LIVE** `#183186358588`.

## 2026-08-03 ? Fix gallery tr?ng + ch? sau reload (Pack/name)

**User:** ch?n r?i reload ? gallery tr?ng ch? c�n ch? t�n (vd. 88).
**Cause:** CSS `:has(canvas)` / 2 img ?n ?nh Shopify qu� s?m; Customily mount canvas text-only tr??c khi v? ??a.
**Fix:** ch? ?n base khi overlay READY; ?n canvas ch?a ready; b? `:has()` eager hide.
**Push LIVE** `#183186358588`.

## 2026-08-03 ? Fix lag b?m Size/Option/Pack

**User:** b?m option c� l�c m�i m?i ???c.
**Cause:** m?i click ? section fetch + swap variant-selects + Dawn `updateMedia` + body MO (labels/EDD/Judge.me) + pack-preview scan ch?y ch?ng l�c Customily GetProduct.
**Fix:** skip Dawn media khi c� Customily host; flag `__myprintsyPdpUpdating` t?m pause observers; label MO scope `product-info`; pack-preview b? scan pointerdown + debounce; EDD/Judge.me debounce + skip khi updating.
**Push LIVE** `#183186358588`.

## 2026-08-02 ? Fix m?t focus � nh?p Customily (Name For Plate)

**User:** nh?p xong mu?n nh?p ti?p ph?i b?m ra ngo�i r?i b?m v�o l?i.
**Cause:** `labelObserver` tr�n `body` + `characterData` + interval 1s rewrite m?i l?n Customily c?p nh?t counter `(2|20)` khi g� ? DOM churn / steal focus.
**Fix:** `customily-preview-atc.js` ? b? `characterData`; skip rewrite khi ?ang focus trong Customily; ignore mutation trong `.customily_option`; gallery sync debounce + ch? ch?y sau blur / khi kh�ng typing.
**Push LIVE** `#183186358588`.
**V� sao tr??c kh�ng b?:** tr??c kh�ng c� (ho?c nh? h?n) `labelObserver` + `characterData` tr�n body + sync gallery m?i `input`. C�c l?n t?i ?u Preview/gallery g?n ?�y m?i th�m ? m?i l?n g� counter `(2|20)` k�ch ho?t rewrite ? m?t focus.

## 2026-08-02 ? Push LIVE: Customily restore + Preview lag + gallery B

**User:** push live.
**Includes:** `theme.liquid` (Customily m?i PDP, tracking defer, Judge.me scoped); `customily-preview-atc.js/css` (sticky/chat, gallery overlay, Preview observer); `pack-preview-cache.js` scoped; product templates `image_zoom: lightbox`.
**Push LIVE** `#183186358588`.

## 2026-08-02 ? DEV: restore Customily load m?i PDP (fix m?t Preview)

**User:** "sao n� k load preview v?i" ? m?t Preview/options tr�n DEV.
**Cause:** Customily opt-in ch?t (ch? tag customily/personalized) ? SP untagged kh�ng load script.
**Fix:** load l?i m?i product+cart; ch? skip khi tag `no-customily`/`skip-customily`. Gi? live preview.
**Push DEV** `#186878558524`.

## 2026-08-02 ? Desktop Preview lag: gi?m observer + lightbox (gi? live gallery)

**User:** gi? live g� ch?; l�m t?i ?u theme + push DEV. H?i tr??c ?�y sao kh�ng lag.
**Cause kh? d?:** body MutationObserver l�c Preview; pack-cache observe body+style; chat sticky poll/click m?i viewport; hover zoom desktop.
**Fix:** Preview modal ? poll only (no body MO); chat sticky mobile-only; pack-cache scope `product-info`; `image_zoom` hover?lightbox (main product templates). Live Customily gi? nguy�n.
**Push DEV** `#186878558524`.

## 2026-08-02 ? Gallery B: b? vi?n + ?n ?nh g?c khi Customily overlay

**User:** ch?n B ? A + ?n ?nh Shopify khi Customily overlay.
**Fix:** `customily-preview-atc.css` ? no border media container; hide base img khi canvas/2 imgs / class overlay. `customily-preview-atc.js` ? `syncCustomilyGalleryOverlay` mark class.
**Push DEV + LIVE**.

## 2026-08-02 ? Sticky Preview v?n ?� chat: h? z-index + si?t detect

**User:** "v?n b? v?y" ? Preview ?? v?n hi?n d??i chat.
**Cause:** dock `z-index: 2147483000` > Inbox `2147482900`; detect open fail (host nh? / shadow).
**Fix:** dock `z-index: 2147482000` (d??i chat); CSS `display:none` khi `body.myprintsy-chat-open`; detect + poll 700ms.
**Push DEV + LIVE**.

## 2026-08-02 ? ?n sticky Preview khi m? chat Inbox

**User:** b?m chat th� b? sticky Preview ? d??i.
**Fix:** `customily-preview-atc.js` ? `isShopifyChatOpen()` + kh�ng `canShow` khi chat m?; watch `#ShopifyChat` + click; `body.myprintsy-chat-open` CSS ?n dock.
**Push DEV** `#186878558524` + **LIVE** `#183186358588`.

## 2026-07-31 ? Customily opt-in ch?t + push DEV

**User:** "l�m ?i r?i push dev" ? b? fallback load m?i PDP.
**Fix:** Customily ch? load khi cart, ho?c PDP c� tag `customily`/`personalized`, ho?c metafield `customily.product_id`. Untagged = kh�ng load.
**Push DEV** `#186878558524`.

## 2026-07-31 ? PDP perf A+B ? push DEV

**User:** l�m A+B r?i push DEV.
**A:** `pack-preview-cache.js` ? `defer`; Judge.me CSS/JS/inline ch? `product` + `collection`.
**B:** GTM + gtag + TikTok stub s?m, load th?t sau `load` + `requestIdleCallback` (timeout 3.5s); Customily ch? cart/product, skip n?u tag `no-customily`/`skip-customily`, ?u ti�n tag `customily`/`personalized` + metafield (fallback v?n load PDP untagged ?? kh�ng g�y personalize).
**Push DEV** `#186878558524` (DEV - MyPrintsy Overlays) ? **kh�ng** push live.

## 2026-07-31 ? PDP slow: audit performance (ch?a s?a code)

**User:** load trang product ch?m ? h?i t?i ?u th�m ???c g�.
**Audit:** head t?i GTM + gtag + TikTok s?m; jQuery CDN global; Customily (~300KB+) m?i PDP; `pack-preview-cache.js` blocking `script_tag`; Judge.me CSS/JS global; EDD country poll + app; main-product nhi?u CSS sync; product.json c� 3 section apps tr?ng + complementary + related + review widget.
**Action:** ?? xu?t ?u ti�n, ch? user ch?n tr??c khi s?a logic.

## 2026-07-30 ? Revert chat desktop fix (auto-open bug)

**User:** revert fix chat desktop ? chat b? auto m?.
**Action:** revert `theme.liquid` v? b?n tr??c (pin global 110px/130px, kh�ng mobile-only / clearPin).
**Push LIVE** `#183186358588`.

## 2026-07-30 ? Chat desktop: b? pin mobile (fix m?t n�t chat) ? REVERTED

**User:** "c�i chat tr�n desktop ?�u r" ? kh�ng th?y widget chat tr�n desktop.
**Cause:** CSS/JS pin chat (bottom 110px, scale 0.72, expanded full-width) �p d?ng **c? desktop**; selector `inbox-online-store-chat` kh�ng id + pinShadowFixed l�m layout Inbox v?.
**Fix:** ch? pin tr�n `@media (max-width: 749px)`; desktop clear inline styles ? Shopify Inbox m?c ??nh; ch? target `#ShopifyChat`.
**Push LIVE** `#183186358588`.

## 2026-07-30 ? Mobile: t�n SP c�ch thumbnail (restore)

**User:** t�n SP s�t ?nh sau revert gallery ? cho xu?ng t� nh? tr??c.
**Fix:** restore `product__title` `margin-top: 2.1rem` mobile (kh�ng ??ng gallery spacing).
**Push LIVE** `#183186358588`.

## 2026-07-30 ? Chat teaser cao h?n (fix overlap title mobile)

**User:** � chat "Chat with us" b? th?p qu�, ?� l�n title.
**Fix:** bottom `110px` (n�t) / `130px` (teaser m?); b? `scale` khi expanded; pin shadow DOM + `inbox-online-store-chat`.
**Push LIVE** `#183186358588`.

## 2026-07-30 ? Chat bottom 70px

**User:** cho n�t chat l�n 70.
**Fix:** `theme.liquid` ? `bottom: 70px`.
**Push LIVE** `#183186358588`.

## 2026-07-30 ? Variant pill border m?ng h?n (3px ? 2px)

**User:** vi?n ?? Size / Buy More Save More d�y qu� ? m?ng 1 ch�t.
**Fix:** `component-product-variant-picker.css` + `product*.json` custom_css ? checked border `2px`.
**Push LIVE** `#183186358588`.

## 2026-07-30 ? Chat bottom ch?t 40px

**User:** ch?t chat `bottom: 40px`.
**Push LIVE** `#183186358588`.

## 2026-07-30 ? Chat bottom 35px

**User:** h? chat c�n 35px.
**Fix:** `theme.liquid` ? `bottom: calc(35px + safe-area)`.
**Push LIVE** `#183186358588`.

## 2026-07-30 ? Chat: pin ?�ng #ShopifyChat (fix kh�ng ?n)

**User:** h? chat 20px nh?ng kh�ng th?y ??i.
**Cause:** Shopify Inbox m?i d�ng `#ShopifyChat` (custom element), kh�ng c�n `#dummy-chat-button-iframe`; code c? ch? pin wrapper `#shopify-chat` (0�0).
**Fix:** CSS + JS pin `#ShopifyChat` + MutationObserver ch?ng app ghi ?� `bottom: 120px`.
**Push LIVE** `#183186358588`.

## 2026-07-30 ? Chat widget h? th�m 20px

**User:** n�t chat (Shopify Inbox) h? xu?ng th�m 20px.
**Fix:** `theme.liquid` ? `bottom` fallback `5rem - 20px`; JS dock offset `-20px`.
**Push LIVE** `#183186358588`.

## 2026-07-30 ? REVERT to�n b? gallery spacing (user request)

**User:** "revert l?i ?o?n fix kho?ng c�ch gi?a c�c ?nh" ? l?i t�m lum.
**Revert:** b? h?t CSS gallery spacing mobile (crop `34rem`, margin/padding media-list, title `2.1rem`).
**Push LIVE** `#183186358588`.

## 2026-07-30 ? Gallery mobile: revert -11rem ? crop contain (REVERTED)

**User:** "l?i r n�" ? thumbnail overlap ?nh ch�nh sau `-11rem`.
**Cause:** `margin-top: -11rem` k�o thumbnail **l�n 110px**, ?� l�n ?nh; kho?ng tr?ng th?t n?m trong box `contain`, kh�ng ph?i margin CSS.
**Fix:** b? `-11rem`; mobile crop box ?nh `padding-top: min(34rem, var(--ratio-percent))` (~340px).
**Verify (390px):** `gapImgThumb: 1px`, kh�ng overlap, kh�ng void tr?ng.
**Push LIVE** `#183186358588`.

## 2026-07-30 ? Gallery gap: -11rem (REVERTED ? qu� m?nh)

**User:** ?nh ch�nh ? thumbnail v?n xa.
**Cause:** `1rem = 10px` ? kho?ng tr?ng n?m trong ?nh product (d??i c?c).
**Attempt:** `thumbnail-slider` `margin-top: -11rem` ? **g�y overlap, ?� revert**.
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Gallery mobile: thumbnail s�t ?nh ch�nh

**User:** kho?ng c�ch ?nh to ? 4 thumbnail xa qu�.
**Fix:** CSS t?nh ? `media-list` mb 0; `thumbnail-slider` mt `-1rem`; b? padding slide + thumbnail list.
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Color label + selected value kh�ng c�ch xa

**User:** "Color:" v� "Blue Ocean" c�ch qu� xa.
**Cause:** `.form__label` d�ng `justify-content: space-between` (copy WP Size Chart row).
**Fix:** ??i `flex-start` + `gap: 0.4rem`.
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Customily label kh�ng b? input che ch�n ch?

**User:** label "Enter Name For Mug?" b? khung input che m?t ph?n ?u�i ch? (g, p?).
**Cause:** `margin-bottom: 0 !important` tr�n `.option_name` ? label s�t input.
**Fix:** label flex column + `gap: 0.6rem`; input `min-height` + padding d?c.
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Label PDP m�u ?en (#111) thay #626262

**User:** m�u label sai ? WP Size m�u ?en, kh�ng x�m.
**Fix:** `.form__label` + Personalized Options + Customily labels ? `#111111`.
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Label PDP ki?u Wanderprints Size (Poppins 16/600/1.5rem/#626262)

**User:** Size/Color/Buy More/Personalized Options gi?ng WP inspect ? `wp-font-semibold`, `wp-text-[16px]`, `wp-leading-6`, `wp-text-neutral-60`.
**Ref WP:** Poppins 600, 16px, line-height 1.5rem, color `#626262`.
**Fix:** `section-main-product.css` `.form__label`; `customily-preview-atc.css` title + Customily labels.
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Personalized Options title font-weight 600

**User:** "Personalized Options" c?ng ?? `font-weight: 600`.
**Fix:** `.myprintsy-personalized-options-title` trong `customily-preview-atc.css`.
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Label Size/Pack/Color v? font-weight 600

**User:** Size, Buy More Save More, Color ? `font-weight: 600`.
**Fix:** `section-main-product.css` + `templates/product*.json` custom_css.
**Push LIVE** `#183186358588`.

**User:** Size/Buy More v?n ??m ? do template `custom_css` �p `font-weight: 600`.
**Fix:** `section-main-product.css` ? `500 !important`; s?a `custom_css` trong t?t c? `templates/product*.json` 600?500.
**Push LIVE** `#183186358588`.

## 2026-07-29 ? PDP labels m?nh h?n (Size / Pack / Customily)

**User:** ch? Size, Buy More Save More, option trong � Customily ? m?nh l?i, ??ng b? nhau.
**Fix:** `font-weight: 500` th?ng nh?t:
- `section-main-product.css` ? `.form__label` (Size, Color, Buy More?)
- `component-product-variant-picker.css` ? pill 11oz/Pack (b? 800 khi checked)
- `customily-preview-atc.css` ? "Personalized Options" + label field Customily
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Revert gallery spacing fix (gi? title margin)

**User:** nh�y qu�, fix gap ?nh?thumbnail m�i kh�ng ?n ? revert.
**Revert:** x�a to�n b? `ensureMobileGallerySpacingStyle` + CSS gallery override trong `section-main-product.css`.
**Keep:** `product-info .product__info-container .product__title { margin-top: 2.1rem !important }` (mobile).
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Fix gallery gap lock s?m + Customily `top:6px` override

**User:** nh�y 2 l?n, k?t qu? cu?i gap v?n xa nh? c?.
**Cause:** JS lock gap l?n ??u (~16px) tr??c khi Customily inject CSS l?n 2 (`top:6px` canvas) ? kh�ng remeasure.
**Fix:**
- CSS t?nh: override canvas + margin slider (kh�ng margin �m thumbnail).
- JS: ch? Customily CSS / 8s ? ?o l?i khi s? style tag ??i; bump pull n?u gapAfter >14px; append style cu?i head m?i tick.
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Gallery gap 2 phase: Dawn l�c ??u, 1/2 gap sau Customily

**User:** l�c m?i v�o b? ?� (margin �m); sau nh�y Customily gap tr?ng l?i to ? mu?n gi? layout c? l�c ??u, sau load ch? c�n 1/2 gap tr?ng.
**Fix:**
- B? block gallery spacing mobile trong `section-main-product.css` (kh�ng margin �m ngay t? CSS t?nh).
- `ensureMobileGallerySpacingStyle()`: ch? Customily ready (canvas / img >400px) ? ?o `naturalGap` ? `pull = max(0, naturalGap/2 - 16px)` + b? `margin-bottom:1rem` slider.
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Tune gap ?nh ch�nh ? subimage (-0.6rem)

**User:** kho?ng tr?ng v?n to sau reload.
**Fix:** gi? pin CSS/JS ch?ng Customily; gi?m `thumbnail-slider margin-top` `-1.2rem` ? `-0.6rem` (tr�nh overlap ~11px).
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Fix gap ?nh ch�nh ? subimage (Customily reset)

**User:** kho?ng tr?ng gi?a ?nh l?n v� 5 thumbnail v?n to; reload l?i v? nh? c?.
**Cause:** Customily inject CSS mobile sau load (canvas/top/margin) + rule Dawn `.slider--mobile{margin-bottom:1rem}`; spacing wrapper d? b? ghi ?�.
**Fix:**
- `section-main-product.css`: `product-info .product__media-wrapper ?` margin/padding 0, thumbnail `margin-top:-1.2rem`
- `customily-preview-atc.js`: `ensureMobileGallerySpacingStyle()` append `<style>` cu?i `head` m?i 1s (20s) ?? th?ng Customily
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Gi?m gap title ? subimage c�n 1/2

**User:** spacing ?n r?i nh?ng xa qu�; cho g?n l?i n?a.
**Fix:** `product-info .product__info-container .product__title` `margin-top` `4.2rem` ? `2.1rem` (mobile).
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Fix spacing m?t sau reload (Customily override padding)

**User:** reload xong spacing v? nh? c? / nh�y r?i m?t.
**Cause:** Customily inject inline `<style>` sau ~8s: `product-info .product__info-wrapper.grid__item { padding: 0 1.5rem !important }` ? x�a `padding-top` wrapper (specificity cao h?n).
**Fix:** `assets/section-main-product.css` ? b? `padding-top` wrapper; chuy?n kho?ng c�ch thumbnail?title sang `product-info .product__info-container .product__title { margin-top: 4.2rem !important }` (Customily kh�ng ??ng).
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Mobile PDP spacing r� h?n (thumbnail s�t / title xa)

**User:** kh�ng th?y kh�c l?m sau fix nh�y.
**Cause:** gap th?t c�n b? `.slider--mobile { margin-bottom: 1rem }` + padding thumbnail row ??n? m?t hi?u ?ng.
**Fix:** `assets/section-main-product.css` (max-width 749px)
- ?nh ch�nh ? thumbnail: `.product__media-list` `margin-bottom` `0.4rem`; `.thumbnail-slider` `margin-top: -0.4rem`; thumbnail list padding `0.2rem`, `margin-bottom: 0`
- thumbnail ? title: `.product__info-wrapper` `padding-top: 2.4rem`; `.product__title` `margin-top: 1.8rem`
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Fix nh�y spacing PDP mobile r?i v? c?

**User:** l�c ??u spacing ?�ng, sau nh�y reload th� quay v? nh? ban ??u.
**Cause:** selector title d�ng `:first-child` n�n sau khi app block/render ch�n th�m node ph�a tr�n, rule kh�ng c�n match.
**Fix:** `assets/section-main-product.css`
- ??i `.product__info-container > .product__title:first-child` ? `.product__info-container .product__title`
- th�m `margin-top: 1rem !important` ?? gi? ?n ??nh sau re-render
- gi? kho?ng c�ch gallery b?ng `margin-bottom: 1.6rem !important` cho `.product__media-list` (mobile)
**Push LIVE** `#183186358588`.

## 2026-07-29 ? H? n�t chat s�t m�p tr�n Preview sticky

**User:** chat cao qu�; mu?n ? m�p tr�n n�t Preview sticky.
**Fix:** `theme.liquid` ? bottom ?o theo chi?u cao `#myprintsy-sticky-preview-dock` (GAP 0); fallback `5rem + safe-area`.
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Mobile: t�n SP c�ch gallery r� h?n

**User:** v?n s�t ?nh; cho xu?ng t�.
**Fix:** `.product__info-wrapper` padding-top `2px` ? `1.2rem` (+ title margin 0.4rem).
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Mobile: subimage s�t h?n + title t�ch xa

**User:** subimage (4-5 thumbnails) mu?n k�o s�t ?nh ch�nh h?n; t�n ?Mediterranean...? mu?n c�ch xu?ng th�m.
**Fix:** `assets/section-main-product.css`
- `.product__media-list` (max-width: 749px) `margin-bottom` `3rem` ? `1.6rem`
- `.product__info-container > .product__title:first-child` `margin-top` `0.4rem` ? `1rem`
**Push LIVE** `#183186358588`.

## 2026-07-29 ? EDD font nh? h?n (1.3rem)

**User:** size ch? Delivered to / Estimated delivery b� h?n x�u.
**Fix:** `section-main-product.css` ? EDD text `1.3rem`, flag 20px.
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Revert slideshow `adapt_image` (banner mobile)

**User:** banner homepage mobile b? crop ch? tr�i; h?i c� do s?a g?n ?�y kh�ng ? kh�ng; do `medium` t? 23/07.
**Fix:** `templates/index.json` ? 5 slideshow `slide_height`: `medium` ? `adapt_image`.
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Country name s�t ?Delivered to? nh? 1 space

**Cause:** flex `gap: 6px` + margin t?o kho?ng th?a.
**Fix:** inline flow; b? gap; ch? `&nbsp;` s?n c� gi?a label v� t�n n??c.
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Mobile: t�n SP c�ch gallery +2px

**Fix:** `.product__info-wrapper { padding-top: 2px }` max-width 749px.
**Push LIVE** `#183186358588`.

## 2026-07-29 ? T�n country s�t ?Delivered to? (1 h�ng)

**Cause:** span SetuBridge `display:block` ? xu?ng d�ng c�ch xa.
**Fix:** force flex row + inline-flex children; t�n n??c to h?n (1.6rem).
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Fix l?i click Viet Nam kh�ng m? select (v2)

**Cause:** open r?i b? ?�ng (outside/blur/re-render); v�ng b?m h?p.
**Fix:** state `pickerOpen` global; `pointerdown` tr�n c? h�ng Delivery to; ignore outside 400ms; re-apply open m?i `run()`.
**Push LIVE** `#183186358588`.

## 2026-07-29 ? Fix click t�n n??c kh�ng m? select EDD (option A)

**Cause:** blur + reparent DOM/MutationObserver ?�ng picker ngay sau m?; listener g?n n�t d? m?t khi app re-render.
**Fix:** event delegation; `data-edd-picker-open`; kh�ng reparent khi ?ang m?; b? blur-close; CSS `:not(.is-country-open)`.
**Push LIVE** `#183186358588`. Select ch? c� n??c SetuBridge (VN/US).

## 2026-07-29 ? Push LIVE: delivery WP + Klaviyo mobile

**Push LIVE** `#183186358588`: `edd-pdp-placement.js`, `section-main-product.css`, `newsletter-klaviyo-embed.js`, `klaviyo-vip-form.css`.

## 2026-07-28 ? Fix form Klaviyo footer tr�n mobile (SUBMIT b? c?t)

**User:** footer mobile l?i ? � email + n�t SUBMIT b? c?t ph?i.
**Cause:** JS tidy lu�n �p button `width:auto` + email `width:100%` trong flex row ? overflow.
**Fix:** mobile = column + width 100% cho email/button (JS + `klaviyo-vip-form.css`). Ch?a push.

## 2026-07-28 ? Delivery EDD ki?u WP (click t�n n??c m?i hi?n select)

**User:** l�m ph?n deliver gi?ng Wanderprints ? ?n dropdown, b?m t�n n??c m?i show ch?n n??c.
**Fix:** `edd-pdp-placement.js` inject n�t t�n n??c xanh + toggle `.sb_country_checker`; CSS box border + ?n select m?c ??nh trong `section-main-product.css`.
**Note:** danh s�ch n??c v?n theo SetuBridge (kh�ng ph?i modal localization WP). Ch?a push.

## 2026-07-28 ? H?i t?i ?u load PDP (EDD + logic g?n ?�y)

**User:** h?i th�i, ch?a l�m.
**G?i � ch�nh:** gi?m poll/observer EDD; Customily gate theo SP; Judge.me ch? PDP; defer sticky/label rewrite.
**Ch?a ??ng code.**

## 2026-07-28 ? Fix form Klaviyo l?ch tr�i

**Cause:** `.newsletter-form__field-wrapper` max-width 36rem + margin 0 ? d�nh tr�i; email min-width 42rem tr�n.
**Fix:** wrapper `--klaviyo` max 72rem + margin auto; email component ~48rem, min-width 0.
**Push DEV + LIVE**

## 2026-07-28 ? C?n gi?a + k�o d�i � email Klaviyo

**User:** cho form email ra gi?a, thanh nh?p d�i nh? ?nh WP.
**Fix:** CSS/JS c?n gi?a row; component email ~56rem (78vw); input 100% trong component.
**Push DEV + LIVE**

## 2026-07-28 ? Email Klaviyo d??i UNLOCK YOUR 10%

**User:** x�a disclaimer + ??a � email/SUBMIT l�n d??i UNLOCK.
**Fix:** newsletter trong `footer-group` (UNLOCK + Klaviyo Yy9PSK); ?n copy VIP; t?t newsletter footer tr�ng; t?t newsletter homepage tr�ng.
**Push DEV + LIVE**

## 2026-07-28 ? ?n disclaimer Klaviyo VIP

**User:** x�a ch? ?By subscribing, you agree??
**Fix:** CSS + JS ?n form-row disclaimer; form v?n sync Klaviyo.
**Push DEV + LIVE**

## 2026-07-28 ? Style Klaviyo VIP form (gi? sync Klaviyo)

**User:** mu?n d�ng � VIP Perks (Klaviyo), h?i ch?nh ?c kh�ng.
**Answer:** ???c ? CSS override pill WP; copy/n�t text s?a trong Klaviyo Editor.
**Fix:** `klaviyo-vip-form.css`; t?t native Shopify form homepage.
**Push DEV + LIVE**

## 2026-07-28 ? Newsletter email form ki?u Wanderprints

**User:** redesign ch? email gi?ng WP (pill input + Subscribe!).
**Fix:** native form WP-style trong `newsletter.liquid`; CSS navy pill; b?t email_form tr�n homepage, b? Klaviyo kh?i section newsletter (VIP footer gi? nguy�n).
**Push DEV + LIVE**

## 2026-07-28 ? Map footer files (ch? m?u redesign)

**User:** footer x?u, h?i ?o?n code n�o ?? g?i m?u.
**Map:** `footer-group.json` (n?i dung 3 c?t), `footer.liquid` + `section-footer.css` (layout), Klaviyo VIP trong footer, `newsletter.liquid` (UNLOCK 10% tr�n homepage).
**Ch?a s?a GUI** ? ch? m?u.

## 2026-07-28 ? Delivered to thi?u tr�n Plate = rule EDD app

**User:** plate v?n kh�ng c� Delivered to.
**Check:** mug OK; plate `findSpecificEDDMsg`/render kh�ng ch?y.
**Cause:** collection `513675723068` match rule EDD nh?ng `is_enable: 0`; plate kh�ng thu?c collection n�o c?a rule ?ang b?t. `hide_default_message: 1`.
**Theme:** ?� th�m slot visible sau price (kh�ng ?n n?a).
**C?n:** b?t/s?a rule trong app Delivery Date ETA (SetuBridge).

## 2026-07-28 ? Fix Delivered to m?t tr�n plate (v� SP kh�c)

**User:** plate kh�ng c� Delivered to (mug th� c�).
**Cause:** `edd-pdp-placement.js` ?n `.custom_delivery_estimation_widget` khi ch?a c� `.sb_ETA` ? app kh�ng inject.
**Fix:** slot visible sau price trong `main-product.liquid`; kh�ng ?n slot inject; ch? ?n duplicate tr?ng.
**Push DEV + LIVE**

## 2026-07-28 ? Delivered to v?n ch?a th?y ? force show

**User:** v?n ch?a th?y Delivered to.
**Check live/DEV:** `.sb_ETA` ?� c� (sau gi�, tr??c Size).
**Fix:** CSS + `edd-pdp-placement.js` force visible `.sb_delivery` / flag / country.
**Push DEV + LIVE** ? nh? hard refresh.

## 2026-07-28 ? Review: c�ch SP 1 d�ng + Write ??y l�n

**User:** Customer Reviews c�ch xu?ng 1 d�ng t�ch SP; Write a review ??y l�n.
**Fix:** `margin-top: 2.4rem` section review; b? `margin-top: 28px` action-buttons; si?t gap header mobile.
**Push DEV + LIVE**

## 2026-07-28 ? Kh�i ph?c Delivered to (EDD) sau gi�

**User:** m?t block Delivered to / Estimated delivery.
**Cause:** app Delivery Date ETA inject `.sb_ETA` v�o product-form (d??i variant), kh�ng c�n sau gi�.
**Fix:** `edd-pdp-placement.js` ??a `.sb_ETA` l�n tr??c Size; block_order + b? div tr�ng.
**Push DEV + LIVE**

## 2026-07-28 ? Gap review ? You may also like = 10px

**User:** mu?n c�ch 10px.
**Fix:** Judge.me widget `padding-bottom: 10px`.
**Push DEV + LIVE**

## 2026-07-28 ? Fix gap 48px Judge.me padding-bottom

**Root cause:** `.jm-stack--space-300.jm-review-widget` c� `padding-bottom: 48px`.
**Fix:** override `padding-bottom: 0` trong CSS + JS; heading related `padding-top: 0`.
**Push DEV + LIVE**

## 2026-07-28 ? You May Also Like s�t d�ng k? review

**User:** ??y heading g?n d�ng k? ph�a tr�n.
**Fix:** ?n apps section r?ng (selector `:not(:has(*))`); related `padding-top: 0`; heading `padding-top: 8px`; b? bottom review/widget.
**Push DEV + LIVE**

## 2026-07-28 ? Accordion + Customer Reviews c�ng c? 15px (WP)

**User:** Description / Shipping / Personalization / Customer Reviews c�ng c?, nh? nh? Wanderprints.
**Fix:** accordion `.accordion__title` + Judge.me title ? **15px / 600 / #444**.
**Push DEV + LIVE**

## 2026-07-28 ? You May Also Like ??y l�n (b?t kho?ng tr?ng)

**User:** review ? You may also like b? kho?ng tr?ng l?n.
**Cause:** Apps section tr?ng + padding related + margin-bottom review.
**Fix:** ?n app section r?ng; `margin/padding-top` related `12px`; review `margin-bottom: 0`.
**Push DEV + LIVE**

## 2026-07-28 ? Label Personalized Options ??m nh? WP

**User:** label kh�ng ??m nh? Wanderprints (Custom Family Name?).
**Ref WP:** `option_name` 15px / 600 / `#111`.
**Fix:** label `#111` + `font-weight: 600`; input gi? 400.
**Push DEV + LIVE**

## 2026-07-28 ? Personalized Options font Poppins

**User:** font trong Personalized Options ?? Poppins gi?ng ?nh.
**Fix:** `customily-preview-atc.css` ? Poppins tr�n title + `#customily-options` / `.customily_option`.
**Push DEV + LIVE**

## 2026-07-28 ? D�ng k? Personalized Options nh?t l?i

**User:** d�ng k? ??m qu� ? ?? nh?t nh? ?nh.
**Fix:** `1px solid #d1d1d1` (was `2px #333`).
**Push DEV + LIVE**

## 2026-07-28 ? D�ng k? Personalized Options ??m h?n

**User:** d??i ?Personalized Options? c� d�ng k? ? cho ??m l�n.
**Fix:** `.myprintsy-personalized-options-title` border `2px solid #333` (was `#e8e8e8` 1px).
**Push DEV + LIVE**

## 2026-07-28 ? ?n Shop Pay Installments tr�n PDP

**User:** x�a ?Pay in 2 interest-free?? tr�n product page.
**Fix:** b? `{{ form | payment_terms }}` trong `sections/main-product.liquid`.
**Push DEV + LIVE**

## 2026-07-28 ? Chat c? ??nh (kh�ng theo Preview)

**User:** Preview hi?n/?n th� chat v?n ? ch? ?� ? c? ??nh lu�n.
**Fix:** b? ?o dock ??ng; `bottom: calc(6.5rem + safe-area)` c? ??nh s�t m�p tr�n v�ng Preview.
**Push DEV + LIVE**

## 2026-07-28 ? Chat s�t m�p tr�n n�t Preview

**User:** cho chat n?m ngay s�t c?nh tr�n button Preview.
**Fix:** gi?m kho?ng h? `GAP` t? `12` -> `0` (chat ch?m s�t m�p tr�n dock Preview).
**Push DEV + LIVE**

## 2026-07-28 ? Chat ngay tr�n sticky Preview

**User:** chat ?? tr�n n�t Preview sticky ? ?�y 1 x�u.
**Was:** `top: 75%`. **Fix:** `bottom` = chi?u cao dock Preview + 12px (?o ??ng khi sticky hi?n).
**Push DEV + LIVE**

## 2026-07-28 ? Sao You May Also Like = #E95D2C

**User:** sao product cards (You May Also Like) gi?ng m�u/ki?u review.
**Cause:** Dawn `.rating-star` (kh�ng ph?i Judge.me), m�u foreground ?en.
**Fix:** `component-rating.css` ? `#E95D2C`, size ~16px, empty `#dadada`.
**Push DEV + LIVE**

## 2026-07-28 ? M�u sao #E95D2C (gi?ng WP)

**User:** m�u sao gi?ng WP `#E95D2C`; h?i 5.0 t�nh sao.
**Fix:** ??i `#f5a623` ? `#E95D2C` (CSS/JS/inline).
**Note:** 5.0 = Judge.me average rating (trung b�nh ?i?m review SP).
**Push DEV + LIVE**

## 2026-07-28 ? Review header ki?u Wanderprints

**User:** header Customer Reviews gi?ng ?nh WP (sao + ?i?m navy + Based on + Write pill).
**Fix:** CSS + JS ? inject sao header, ?i?m `#1c4c78` 20px, ?Based on X reviews?, Write outline pill.
**Push DEV + LIVE**

## 2026-07-28 ? Sao review = Wanderprints (16px)

**User:** sao to nh? wanderprints.com.
**Ref:** Judge.me `stars_size: medium` ? `16px` / line-height `18px`.
**Was:** `13px`. **Fix:** `16px` (CSS/JS/inline).
**Push DEV + LIVE**

## 2026-07-28 ? Review: sao to h?n, ch? nh? h?n

**User:** ng�i sao to 1 x�u, ch? nh? 1 x�u.
**Was:** sao `11px`; ch? review inherit (~16px).
**Fix:** sao `13px`; body/name `14px`; date `12px` (judgeme CSS/JS + inline).
**Push DEV + LIVE**

## 2026-07-28 ? Label Size/Option/Buy More ? 16px

**User:** Size, Option, Buy More Save More font-size 16; h?i ?ang bao nhi�u.
**Was:** Theme Editor custom_css `1.75rem` (~17.5px).
**Fix:** `16px` trong custom_css + `.form__label` CSS `16px !important`.
**Push DEV + LIVE**

## 2026-07-28 ? Font t�n SP nh? l?i nh? Wanderprints

**User:** ch? to qu� ? b� nh? ?nh / wanderprints.com.
**Fix:** `.product__title h1` ? `16px` / `line-height: 24px` (wp-leading-6).
**Push DEV + LIVE**

## 2026-07-28 ? Font t�n SP kh?p reference DevTools

**User:** ?�y, l�m gi?ng ch?a ? Poppins + `wp-text-black` (#000).
**Fix:** `.product__title h1` ? Poppins 500, `#000`, line-height 1.5, size 2?2.2rem.
**Push DEV + LIVE**

## 2026-07-28 ? Font t�n s?n ph?m PDP

**User:** t�n SP font gi?ng ?nh (sans geometric medium).
**Fix:** `.product__title h1` ? weight 500, size ~2?2.2rem (l?n ??u `#1a1a1a`).
**Push DEV + LIVE**

## 2026-07-28 ? Fix radius ?�ng option pills (kh�ng ATC)

**User:** kh�ng ph?i n�t ATC ? l� Size/Option/Pack; v?n vu�ng.
**Cause:** Theme Editor custom_css `border-radius: 5px` tr�n product templates.
**Fix:** ??i custom_css ? `1.6rem` + CSS `.product-form__input--pill label` `!important`.
**Push DEV + LIVE**

## 2026-07-28 ? Pill v?n vu�ng: custom CSS 5px + Dawn rem

**User:** sao v?n vu�ng.
**Cause:** Theme Editor `custom_css` tr�n product: `border-radius: 5px`; Dawn `1rem`?10px c?ng nh?.
**Fix:** `1.6rem !important` tr�n pill label (?16px).
**Push DEV + LIVE**

## 2026-07-28 ? Variant option pills border-radius 1rem

**User:** Size / Option / Pack buttons `border-radius: 1rem`.
**Fix:** `.product-form__input--pill ? label` (+ `:before`) ? `1rem`.
**Push DEV + LIVE**

## 2026-07-28 ? Personalized Options title m�u + LIVE

**User:** m�u ch? `rgba(0,0,0,0.75)` gi?ng Enter Name; push live.
**Fix:** `.myprintsy-personalized-options-title` color.
**Push DEV + LIVE** `#183186358588`

## 2026-07-28 ? Title ?Personalized Options? tr�n form Customily

**User:** ch�n ch? Personalized Options ?? user bi?t ?i?n th�ng tin trong ?�.
**Fix:** inject heading tr??c `.customily_option` + CSS center/border (GUI only).
**Push DEV** `#186878558524`

## 2026-07-28 ? Pack 2 ? 2 � Enter Name: t�m code

**User:** Pack 2 hi?n 2 ch? nh?p t�n ? ?�ng ch?a? t�m code tr??c khi s?a.
**Answer:** ?�ng h�nh vi Customily (Pack N ? N �). Theme **kh�ng** t?o c�c input ?�.
**Where:** Customily Option Set + template; theme ch? load CDN + `product-info.js` / `pack-preview-cache.js` / gift-box ??c `#N`.

## 2026-07-26 ? Sticky Preview ?? nh?ng URL bar kh�ng ??

**User:** khi Preview hi?n URL v?n ??; ch? mu?n n�t Preview ??.
**Fix:** dock tr?ng full-bottom + n�t ?? b�n trong; kh�a `theme-color=#ffffff` khi sticky ch?y (Chrome kh�ng nh?t ?? n?a).
**Push DEV + LIVE**

## 2026-07-26 ? Thanh URL ?? v� sticky Preview

**User:** ?? c? thanh URL.
**Cause:** `theme-color` tr?ng ? Chrome Android l?y m�u ?? t? sticky Preview ? ?�y.
**Fix:** `theme-color` ? `#ffffff`.
**Push DEV + LIVE**

## 2026-07-26 ? Chat 3/4 + sticky ?� Ends soon l?i

**User:** Preview b? Ends soon ?�; chat xu?ng t?m 3/4 m�n.
**Fix:** chat `top: 75%`; sticky full-width + z-index cao l?i (?� Ends soon).
**Push DEV + LIVE**

## 2026-07-26 ? Chat gi?a m�n: CSS fail ? JS ng?n

**User:** v?n kh�ng ???c.
**Why:** Inbox ghi ?� b?ng inline `!important` ? stylesheet thua.
**Fix:** JS ng?n `setProperty(..., important)` + poll 15�400ms r?i d?ng; MO style tr�n iframe.
**Push DEV + LIVE**

## 2026-07-26 ? Chat gi?a m�n h�nh

**User:** ch?nh chat l�n gi?a m�n h�nh.
**Fix:** CSS `top: 50%` + `translateY(-50%)` + scale (Inbox admin kh�ng h? tr?).
**Push DEV + LIVE**

## 2026-07-26 ? Chat Highest v?n b? che

**User:** Vertical Highest tr�n mobile v?n b? che.
**Why:** Inbox Highest ch? nh�ch nh?; sticky Preview full-width + z-index c?c cao ?� l�n.
**Fix:** sticky `right: 5.6rem` ch?a g�c chat; z-index sticky 40; chat scale CSS nh?.
**Push DEV + LIVE**

## 2026-07-26 ? Chat: b? JS n?ng, ch? CSS

**User:** s?a v? tr� chat th�m nhi?u code c� gi?m perf?
**Answer:** poll/shadow scan th� c� overhead th?a. ?� b? JS, gi? CSS `bottom: 32vh` + scale.
**Push DEV + LIVE**

## 2026-07-26 ? Chat b? sticky Preview che ? �p l�n 32vh

**User:** chat v?n th?p, b? Preview che.
**Fix:** CSS m?nh h?n + JS `setProperty(..., important)` `bottom: 32vh` (poll 20s) ? Inbox hay ghi ?� inline.
**Push DEV + LIVE**

## 2026-07-26 ? Chat l�n ~3/4 m�n h�nh

**User:** n�t chat d?ch l�n th�m, t?m 3/4 m�y ph�a d??i.
**Fix:** `bottom: 25vh` (desktop `22vh`).
**Push DEV + LIVE**

## 2026-07-26 ? Fix PDP load m�i (In demand loop)

**User:** v?n l?i, load m�i ? check ho?c revert.
**Cause:** `fillPdpTrustBuyers()` trong MutationObserver lu�n set `textContent` ? `characterData` ? g?i l?i v� h?n (regression khi sync s? In demand).
**Fix:** ch? ghi khi kh�c; b? `fillPdpTrustBuyers` kh?i MO callback.
**Push DEV + LIVE**

## 2026-07-26 ? Fix PDP tr?ng ph?n d??i (sticky freeze)

**User:** ph?n d??i PDP kh�ng load (tr?ng sau accordion).
**Cause:** sticky Preview `MutationObserver` body (class/style) + label rewriter ? v�ng l?p / treo main thread; HTML reviews/footer v?n c�.
**Fix:** b? MO; ch? scroll/resize/IO + poll 20s; guard update.
**Push DEV + LIVE**

## 2026-07-26 ? Shopify chat nh? h?n + l�n tr�n

**User:** � chat b� l?i + d?ch l�n tr�n 1 t�.
**Fix:** `theme.liquid` ? scale iframe `#dummy-chat-button-iframe` ~0.7, `bottom: 3.2rem`.
**Push DEV + LIVE**

## 2026-07-26 ? Sticky Preview ?? nh? ATC

**User:** n�t sticky Preview sang ??.
**Fix:** background `#2f2a26` ? `#be2926`.
**Push DEV + LIVE**

## 2026-07-26 ? Sticky Preview ch? hi?n khi scroll qua n�t g?c

**User:** sticky ?en ch? hi?n khi scroll xu?ng d??i n�t Preview; ? tr�n (d� ch?a th?y n�t) c?ng kh�ng hi?n.
**Fix:** `rect.bottom < 0` (?� scroll past) thay v� m?i l�c out-of-view.
**Push DEV + LIVE**

## 2026-07-26 ? Cart Checkout ?? gi?ng ATC

**User:** `/cart` n�t Checkout sang ?? nh? Add to Cart.
**Fix:** `.cart-macorner-checkout` `#1773b0` ? `#be2926`, hover `#a82422`.
**Push DEV + LIVE**

## 2026-07-26 ? ??ng b? s? In demand PDP ? Preview

**User:** random In demand tr�n product kh�c v?i Preview ? d�ng chung 1 s?.
**Fix:** cache `getBuyersCount()` (?u ti�n s? ?� fill tr�n PDP) ? PDP + modal Preview c�ng s? trong 1 session trang.
**Push DEV + LIVE**

## 2026-07-26 ? Sticky Preview bottom 0

**User:** ?? 0 rem.
**Fix:** `bottom: 0`.
**Push DEV + LIVE**

## 2026-07-26 ? Sticky Preview s�t ?�y h?n

**User:** th?p xu?ng k?ch d??i x�u.
**Fix:** `bottom` 1.2rem ? `max(0.4rem, safe-area)`.
**Push DEV + LIVE**

## 2026-07-26 ? Sticky Preview full-width + ?� Ends soon

**User:** d�i nh? checkout `/cart`; th?p xu?ng; ?� l�n Ends soon n?u c�.
**Fix:** full-width (left/right 1.2rem, radius 1.4rem, min-height 5rem); bottom th?p; z-index c?c cao; b? logic nh�ch l�n tr�nh banner.
**Push DEV + LIVE**

## 2026-07-26 ? Sticky Preview nh�ch l�n tr�nh banner 10%

**User:** b? che b?i ?Ends soon / extra 10% off? ? mu?n v? tr� l�n tr�n, kh�ng ?� nhau.
**Fix:** `bottom` m?c ??nh ~7.2rem + JS ?o fixed bar ?�y viewport r?i ??y Preview l�n tr�n (c� gap).
**Push DEV** `#186878558524` + **LIVE** `#183186358588`

## 2026-07-26 ? Push sticky Preview LIVE

**User:** live ?i.
**Push LIVE** `#183186358588`: `customily-preview-atc.js` + `.css` (mobile sticky Preview).

## 2026-07-26 ? Sticky Preview mobile (Macorner)

**User:** scroll PDP m� m�n kh�ng c�n n�t Preview ? hi?n n�t Preview d??i; **mobile only**.
**Done:** IntersectionObserver theo `#customily-preview-button`; sticky pill bottom (eye + Preview); click ? native Preview; ?n khi modal m? / desktop.
**Files:** `customily-preview-atc.js` + `.css`
**Push DEV** `#186878558524`

## 2026-07-26 ? Pull LIVE check r?i push PDP/ATC batch

**User:** pull LIVE xem c� update kh�ng (s? ghi ?�), xong push l�n.

**Pull:** `_live_pull_check` t? `#183186358588`.
**R?i ro ghi ?� (?� SKIP):** `templates/*.json`, `sections/header-group.json` ? LIVE l?n h?n local (Theme Editor).
**LIVE kh�ng c� file-only m?i;** `product-info.js` / `settings_data.json` / `product.json` kh?p.
**LIVE stub:** `customily-preview-atc.*` (reverted 2026-07-16) ? ?� thay b?ng DEV full.

**Push LIVE** `#183186358588` (14 files): judgeme-stars css/js, theme.liquid, section-main-product.css, component-cart-notification.css, customily-preview-atc css/js, cart-notification liquid/js + sections, buy-buttons, main-product, product-form.js.

## 2026-07-25 ? Macorner d�ng g� ?? preview?

**User:** macorner.co c� Customily kh�ng?
**Check PDP:** c� `product-customily.css`, `.customily-preview-button`, `#customily-cart-btn`, `properties[_customily-thumb]` ? **c� d�ng Customily**.
**Th�m:** `cdn.medzt.com/custom-app/.../sdk-v2.js` (Medzt custom SDK + reviews API) ? l?p ri�ng, kh�ng thay Customily preview.
**Theme:** Dawn custom `macorner-shopify-2.0`.

## 2026-07-25 ? Preview hi?n ?loc loc? (2 l?n)

**User:** nh?p 1 � ?loc? m� mug hi?n 2 ch?.
**Answer:** Kh�ng ph?i theme. Form ch? 1 input ? Customily template th??ng c� **2 text layer** c�ng bind 1 option (ho?c 2-side). S?a trong Customily Template Editor (layers), kh�ng s?a b?ng theme CSS/JS.

## 2026-07-25 ? Fix CSS v?: Preview ATC m?t n?n ??

**User:** Preview ATC xanh nh?t / l?i.
**Cause:** l?n ??i `border-radius` l�m m?t selector `.myprintsy-customily-preview-atc {` ? rule ?? orphaned.
**Fix:** restore selector + `background:#be2926 !important`.
**Push DEV** `#186878558524`

## 2026-07-25 ? Preview modal ATC/Close bo g�c 0.8rem

**User:** trong Preview c?ng ??i bo g�c gi?ng modal cart / PDP.
**Fix:** `.myprintsy-customily-preview-atc` + `.myprintsy-customily-preview-close-btn` ? `0.8rem`.
**Push DEV** `#186878558524`

## 2026-07-25 ? Preview/ATC bo g�c nh? modal cart

**User:** n�t Preview + ATC tr�n PDP revert bo g�c gi?ng ?nh modal (kh�ng pill).
**Fix:** `border-radius: 999px` ? `0.8rem` (c�ng `.cart-notification__btn`).
**Push DEV** `#186878558524`

## 2026-07-25 ? Cart X gi?ng Preview dialog

**User:** d?u X cart modal gi?ng dialog Preview.
**Fix:** d�ng `&times;` + n�t tr�n tr?ng + shadow (copy `.myprintsy-customily-preview-x`); b? SVG Dawn.
**Push DEV** `#186878558524`

## 2026-07-25 ? Cart modal X ??m h?n tr�n mobile

**User:** d?u X mobile tr�ng x?u/nh?t, mu?n ??m nh? desktop.
**Fix:** b? opacity 0.7; m�u `#1a1a1a`; stroke d�y h?n tr�n icon; mobile size l?n h?n.
**Push DEV** `#186878558524`

## 2026-07-25 ? Reviews align ?nh l?n (kh�ng theo thumbnail)

**User:** l? tr�i Customer Reviews th?ng ?nh to, ?ang th?ng ?nh con.
**Cause:** Judge.me `#judgeme_product_reviews` c� `max-width:1200px; margin:0 auto` ? l?ch tr�i ~50px (tr�ng n�t slider thumbnail).
**Fix:** `margin-left:0` + `max-width:100%` (CSS + JS).
**Push DEV** `#186878558524`

## 2026-07-25 ? Judge.me spacing: sai class (revamp)

**User:** desktop ?k kh�c g�?.
**Cause:** Judge.me d�ng widget **revamp** (`.jm-review-item`, `.jdgm-review-list`, `--jm-space-600` = 24px). Override c? nh?m legacy `.jdgm-rev` ? kh�ng ?n.
**Fix:** CSS/JS target `.jm-review-item` + stack margins; si?t accordion PDP; gi? legacy rules.
**Push DEV** `#186878558524`

## 2026-07-25 ? Judge.me desktop spacing: override shopify_v2.css

**User:** desktop kh�ng th?y kh�c.
**Cause:** Judge.me `shopify_v2.css` ? `.jdgm-rev{margin-top:16px;padding-top:16px}` + `.jdgm-rev__br:empty{display:block}` + widget `margin/padding:24px`.
**Fix:** override ?�ng rule ?� + ?n `.jdgm-rev__br` + si?t section `:has(.jdgm-rev-widg)`.
**Push DEV** `#186878558524`

## 2026-07-25 ? Judge.me reviews spacing l?n 2 (�p m?nh)


**User:** v?n c�ch xa gi?a c�c review.
**Fix:** padding review `8px 0` + inject CSS/inline mu?n qua `judgeme-stars.js` (c�ng pattern sao).
**Push DEV** `#186878558524`

## 2026-07-25 ? Judge.me reviews: si?t kho?ng tr?ng


**User:** nhi?u kho?ng tr?ng gi?a item; h?i code hay config.
**Answer:** Config Judge.me h?n ch?; ch?nh s�t ? **CSS theme**.
**Done:** `judgeme-stars.css` gi?m margin/padding header/summary/actions/review rows.
**Push DEV** `#186878558524`

## 2026-07-25 ? ATC ch? c�ng c? Preview (16px)


**User:** Add to Cart b� nh? Preview.
**Done:** Preview + ATC ??ng b? `16px`; �p `.text` + inline JS ch?ng Customily.
**Push DEV** `#186878558524`

## 2026-07-25 ? Trust buyers random 20?200


**User:** s? 580 ? random 20?200.
**Done:** PDP `[data-myprintsy-trust-buyers]` + modal Preview c�ng range; set 1 l?n/page (kh�ng nh�y).
**Push DEV** `#186878558524`

## 2026-07-25 ? Fix 2 n�t Add to Cart tr�ng


**User:** sao 3 n�t (Preview + ATC + ATC).
**Cause:** Theme ATC + Customily `#customily-cart-btn` c�ng hi?n.
**Fix:** ?n duplicate (gi? Customily); CSS `:has(#customily-cart-btn)`.
**Push DEV** `#186878558524`

## 2026-07-25 ? Icon m?t + gi? h�ng tr�n Preview / ATC


**User:** th�m icon gi?ng Macorner (eye + cart).
**Done:** JS inject SVG icon; CSS flex gap; poll gi? icon khi Customily re-render.
**Push DEV** `#186878558524`

## 2026-07-25 ? ATC hoa l?n 2: inject style + inline !important


**User:** v?n b? vi?t hoa ATC.
**Fix:** JS inject `<style>` cu?i head + `style.setProperty('text-transform','none','important')` tr�n n�t/`.text`; poll 1s.
**Push DEV** `#186878558524`

## 2026-07-25 ? ATC v?n hoa: override Customily `.add_to_cart .text`


**User:** ATC v?n vi?t hoa trong khi Preview ?� ?Preview?.
**Cause:** Customily CSS `button.add_to_cart .text { text-transform: uppercase !important }`.
**Fix:** theme CSS `none !important` tr�n `.add_to_cart .text` + JS ?u ti�n ghi `.text`.
**Push DEV** `#186878558524`

## 2026-07-25 ? JS rewrite label Preview / Add to Cart (Macorner)


**User:** ?l�m ?i? ? duy?t theme JS ghi ?� text.
**Done:** `customily-preview-atc.js` ? Preview + Add to Cart; MutationObserver ~20s ch?ng Customily ghi l?i.
**Push DEV** `#186878558524`

## 2026-07-25 ? Clarify: Customily ghi ?� ATC, kh�ng ch?ng n�t


**User:** ?b? ghi ?� b?i button kh�c l�n hay sao?.
**Answer:** Kh�ng ph?i 2 n�t ?� layout. Customily **hijack** ATC theme ? `#customily-cart-btn` + inject Preview ri�ng v?i text s?n `PREVIEW YOUR PERSONALIZATION`. Ch? hoa = text/CSS app, kh�ng ph?i theme ?� nhau.

## 2026-07-25 ? Preview/ATC text UPPERCASE: c?n config Customily


**User:** ?ko ?c, hay c�i n�y ph?i config? ? n�t v?n PREVIEW YOUR PERSONALIZATION / ADD TO CART.
**Clarify:** CSS `text-transform:none` kh�ng ??i ???c ch? ?� vi?t HOA trong HTML. Preview label do **Customily** inject; ATC c� th? b? app/theme cache. ??i wording ? Customily admin (ho?c JS rewrite n?u user duy?t logic).

## 2026-07-25 ? PDP text gi?ng Macorner (ATC/Preview/Quantity/trust)


**User:** s?a text gi?ng ?nh Macorner (Quantity / Preview / Add to Cart / trust).
**GUI:** b? UPPERCASE ? sentence case; font-weight 600; Quantity label 1.2rem/400; th�m 2 d�ng trust d??i ATC.
**Push DEV** `#186878558524`

## 2026-07-25 ? Title Size/Option/Pack: gi? bold + nh? h?n

**User:** ?? l?i bold 3 title, ch? b� h?n x�u.
**Done:** `font-weight: 700`, `font-size: 1.1rem`.
**Push DEV** `#186878558524`

## 2026-07-25 ? Label v?n ??m: �p override legend UA bold

**User:** ?h?i ??m l� sao? ? Size/Option/Buy More v?n nh�n bold.
**Cause:** `<legend>` browser default `font-weight: bold`.
**Fix:** target `legend.form__label` + `font-weight: 400 !important`.
**Push DEV** `#186878558524`

## 2026-07-25 ? PDP label: b? bold (kh�ng lowercase)

**User:** ?ch? th??ng? = b? bold, gi? vi?t hoa ??u t?.
**Done:** `font-weight: 400`, b? `text-transform: lowercase`.
**Push DEV** `#186878558524`

## 2026-07-25 ? PDP: Size/Option/Pack label + gi� nh? h?n

**User:** label b� + gi� b�.
**Done:** label 1.2rem; `.price--large` ~1.8/1.6rem.
**Push DEV** `#186878558524`

## 2026-07-25 ? Sao reviews nh? r� h?n (11px)

**User:** kh�ng th?y b�.
**Done:** ??i sang `font-size: 11px !important` (px c? ??nh) + JS set inline size.
**Push DEV** `#186878558524`

## 2026-07-25 ? Sao reviews nh? h?n

**User:** ng�i sao b� ?i.
**Done:** `font-size` 0.82em ? 0.65em (CSS + JS inject + theme inline).
**Push DEV** `#186878558524`

## 2026-07-25 ? Sao reviews v?n ?en: override m?nh h?n

**Cause:** Judge.me hardcode `.jdgm-star{color:#33383C}` inject mu?n, CSS theme thua.
**Fix:** JS append `<style>` cu?i body + paint inline `!important` ~20s; inline style trong `theme.liquid`.
**Alt:** Judge.me Admin ? ??i Star color (setting `star_color:#33383C`).
**Push DEV** `#186878558524`

## 2026-07-25 ? Fix sao Customer Reviews v?n ?en (DEV)

**User:** ?ang xem DEV, sao trong product Customer Reviews v?n ?en ? nghi s?a nh?m ch?.
**Cause:** Judge.me widget inject CSS/var `#33383C` **sau** theme CSS ? ?� m�u.
**Fix:** CSS nh?m `#judgeme_product_reviews` / `.jdgm-rev-widg` + `judgeme-stars.js` paint l?i sau widget load.
**Push DEV** `#186878558524`

## 2026-07-25 ? Fix sao Judge.me v?n ?en tr�n DEV

**Cause:** (1) user xem LIVE `www.myprintsy.com` ch?a c� CSS; (2) Judge.me set `--jdgm-star-color:#33383C` load sau CSS theme.
**Fix:** override CSS var + selector m?nh; load `judgeme-stars.css` cu?i `</body>`.
**Push DEV** `#186878558524`
**Note:** c?n preview DEV URL, kh�ng ph?i domain LIVE.

## 2026-07-25 ? PDP ATC/Preview bo tr�n pill

**User:** n�t Preview + ATC bo tr�n nh? Macorner.
**Done:** `border-radius: 999px` cho ATC + Preview.
**Push DEV** `#186878558524`

## 2026-07-25 ? Judge.me stars cam + nh? h?n

**User:** ng�i sao Customer Reviews m�u cam, b� ?i x�u.
**Done:** `judgeme-stars.css` `#f5a623`, font-size ~0.82em; load trong `theme.liquid`.
**Push DEV** `#186878558524`

## 2026-07-25 ? PDP: ch? ATC + Preview nh? h?n

**User:** ch? Add to cart / Preview your personalization b� ?i x�u.
**Done:** `font-size` 25px ? 18px (c? 2 n�t).
**Push DEV** `#186878558524`

## 2026-07-25 ? Modal ATC: ch? b�, ?nh to, heading th??ng 1 d�ng

**User:** ch? nh? h?n; ?nh to h?n; ?Item has been?? in th??ng + b� ?? mobile 1 d�ng.
**Push DEV** `#186878558524`

## 2026-07-25 ? Preview ATC ?? brand

**User:** n�t Add to cart trong preview c�ng ?? `#be2926`.
**Push DEV** `#186878558524`

## 2026-07-25 ? Modal ATC r?ng h?n + ?nh to h?n

**User:** d�i modal ra, ph�ng to ?nh.
**Done:** width ~58rem; ?nh ~13rem (mobile 11rem); src ?nh l?n h?n.
**Push DEV** `#186878558524`

## 2026-07-25 ? Modal ATC: n�t View Cart ?? brand

**User:** View Cart & Checkout c�ng m�u ATC `#be2926`.
**Push DEV** `#186878558524`

## 2026-07-25 ? Fix layout modal ATC (?nh tr�i / ch? ph?i)

**Cause:** `cart-notification.js` inject `innerHTML` ? m?t wrapper flex ? ?nh/ch? x?p d?c.
**Fix:** `#cart-notification-product` t? `display:flex; flex-direction:row`.
**Push DEV** `#186878558524`

## 2026-07-25 ? GUI cart notification modal (DEV)

**User:** ??i dialog add item gi?ng Macorner (modal gi?a m�n).
**Done:** overlay + modal tr?ng; heading xanh; ?nh/title/size/qty/gi� ??; 2 n�t Continue / View Cart & Checkout; Prefer Customily thumb n?u c�.
**Push DEV** `#186878558524`

## 2026-07-25 ? ATC ? cart notification (DEV)

**User:** revert redirect `/cart`; ATC (PDP + Preview) show dialog View cart.
**Done:** b? `data-redirect-to-cart`; `product-form` l?i xin sections + `cart.renderContents`; Preview ATC ?�ng modal khi `cartUpdate` ?? hi?n notification; b? hide spinner ATC / quiet-click.
**Push DEV** `#186878558524`

## 2026-07-25 ? Audit ATC Macorner (Fatherhood shirt)

**URL:** macorner.co/.../fatherhood-is-kingdom-work-personalized-shirt-magbvnml6
**Flow t? `product-form.js`:**
1. Customily save design (n�t ATC `type=button` `#custom-btn-atc` + submit ?n)
2. `fetch /cart/add` JSON ? **kh�ng** xin `sections` (v� **kh�ng** c� `cart-drawer` / `cart-notification` tr�n PDP)
3. OK ? `window.location = /cart`
4. Gift (n?u b?t + visible): `await` gift **tr??c** main add
**?M??t? ch? y?u:** UX loading n�t/modal + add nh? (kh�ng section HTML) + redirect cart; **kh�ng** ph?i skip Customily save.
**So v?i MyPrintsy:** DEV ?� g?n gi?ng (redirect + skip sections); kh�c: MyPrintsy settings `cart_type: notification` (c� cart UI s?n); ch? gift ?� stash/async.

## 2026-07-25 ? Gi?m nh�y khi load PDP (DEV)

**User:** v�o trang b? nh�y nh�y, h?i t?ng t?c load.
**Cause:** `lockAtcBrandColor` poll + set inline style ~12s sau load ? reflow/flicker m�u n�t.
**Fix:** b? paint/poll; m�u/radius ch? CSS; gi? hide spinner khi click ATC.
**Note:** nh�y c�n l?i ch? y?u Customily mount preview (CDN) ? theme kh�ng b? ???c n?u v?n personalize.
**Push DEV** `#186878558524`

## 2026-07-25 ? Fix lag/tab xoay m�i (DEV)

**Cause:** `MutationObserver` + set style/class trong `lockAtcBrandColor` ? v�ng l?p v� h?n; optimistic ATC + cart reload c?ng d? treo.
**Fix:** b? observer; paint 1 l?n/node; ATC ?n ??nh (??i `/cart/add` r?i redirect, kh�ng ch? gift); CSS v?n ?n spinner; clear pending flags.
**Push DEV** `#186878558524`

## 2026-07-24 ? Optimistic ATC an to�n (DEV) v2

**User:** sau revert v?n xoay 1 l�c.

**Done (kh�ng fetch-hook / kh�ng flag k?t):**
- Redirect mode: `keepalive` `/cart/add` + **redirect ngay**; kh�ng b?t spinner PDP
- Safety reset n�t sau 10s n?u c�n ? PDP
- Gift: optimistic ? stash only; cart `syncPendingAtcGift`
- Cart poll theo `item_count > baseline` (tr�nh reload sai khi variant ?� c� trong gi?)
- Push DEV `#186878558524`

## 2026-07-24 ? REVERT optimistic ATC (DEV) ? xoay m�i

**User:** ATC xoay m�i sau b?n ?sang cart tr??c?.

**Cause:** fetch hook + flag `__myprintsyOptimisticNavStarted` khi?n submit return s?m, `aria-disabled` k?t, redirect kh�ng ch?y.
**Fix:** revert v? ATC ?n ??nh ? ??i `/cart/add` OK r?i redirect (kh�ng ch? gift / kh�ng sections). G? fetch patch + CSS ?n spinner.
**Push DEV** `#186878558524`

## 2026-07-24 ? Optimistic ATC ? cart song song (DEV)

**User:** th? load song song, sang cart tr??c.

**Done:**
- `product-form.js` (redirect mode): `keepalive` `/cart/add` + kick gift + **redirect ngay** (kh�ng ch? response)
- `cart-gift-box.js`: poll `/cart.js` t?i khi c� variant; overlay ?Updating??; reload 1 l?n n?u Liquid ch?a k?p
- Push DEV `#186878558524`

**Risk:** add fail sau khi ?� sang cart ? poll timeout, c� th? kh�ng th?y l?i sold-out tr�n PDP.

## 2026-07-24 ? Preview modal gi?ng Macorner (DEV)

**User:** th?a kho?ng tr?ng tr�n; l�m gi?ng m?u �o ?en; th�m 2 d�ng text d??i.

**Done (GUI):**
- Si?t padding top card; X g�c ph?i (kh�ng ?? Customily X center t?o kho?ng tr?ng)
- 2 d�ng trust d??i ?nh (checkmark xanh): refund + ?435 people??
- `customily-preview-atc.js/.css` ? push DEV `#186878558524`

**Follow-up:** Customily X v?n top-center trong flow ? ?n native X + th�m X g�c ph?i card (Macorner). Push l?i DEV.

## 2026-07-23 ? ATC redirect nhanh (local, CH?A push)

**User:** ATC load l�u m?i v�o cart; l�m nhanh; gi?i th�ch; **??ng push DEV**.

**Nguy�n nh�n ch?m:**
1. `cart_type: notification` ? `/cart/add` k�m render section HTML + m? popup
2. Gift box upsert tu?n t? (`/cart.js` ? update ? add) n?u ch? tr??c khi sang cart

**C�ch l�m:**
- `product-form.js` + `buy-buttons` `data-redirect-to-cart="true"`: sau `/cart/add` OK ? **redirect `/cart` ngay**; **kh�ng** xin sections; **kh�ng** ch? gift
- Gift: stash `gift-box-pending-atc` + `keepalive` fetch; `cart-gift-box.js` sync khi v�o cart (thi?u gift ? upsert + reload)

**Files:** `product-form.js`, `buy-buttons.liquid`, `addon-gift-box-pricing.js`, `addon-gift-box.liquid`, `cart-gift-box.js`

**Push DEV** `#186878558524` (2026-07-24).

## 2026-07-23 ? Fix Preview ATC lag / kh�ng b?m ???c (DEV)

**User:** DEV ? kh�ng b?m ???c, b?m b? lag; console aria-hidden cart-reminder + Klaviyo.

**Cause:** `customily-preview-atc.js` MutationObserver to�n document (class/style) ? Customily DOM churn = lag.
**Fix:**
- Observer ch? b?t ng?n sau khi b?m Preview; debounce inject
- Cart-reminder closed: `pointer-events:none` + blur focus Klaviyo khi `aria-hidden`

**Push DEV** `#186878558524`

## 2026-07-23 ? Customily Preview ATC + Close (DEV)

**User:** PDP click preview ? th�m Add to cart + Close ki?u Macorner (mobile + desktop); push DEV.

**Done (GUI + ATC click):**
- `customily-preview-atc.js/.css` vi?t l?i (kh�ng capture hijack Preview ? tr�nh l?i click 2026-07-16)
- Header ?Looks Good to Go?? + subtitle
- H�ng n�t: **Add to cart** (cam) + **Close** (x�m) ? ?�ng modal r?i ATC qua product-form
- Load l?i trong `main-product.liquid`

**REVERT:** g? 2 d�ng load CSS/JS trong `main-product.liquid`; ?? stub r?ng l?i 2 asset n?u c?n.

**Push DEV** `#186878558524`

## 2026-07-23 ? CLS B: slideshow medium + push LIVE (REVERT note)

**User:** l�m B r?i push live; ghi nh? ?? revert.

**Change:** `templates/index.json` ? t?t c? slideshow `slide_height`:
- **Tr??c:** `adapt_image`
- **Sau:** `medium`
- Sections: `slideshow_nz7mjK`, `slideshow_gL8XLx`, `slideshow_KjWFz8` (disabled), `slideshow_eCAGDj`, `slideshow_TTR9pE`

**Impact:** ch? hi?n th? hero (c� th? crop ?nh); **kh�ng** ??i logic ATC/Customily.

**REVERT:**
1. Theme Editor ? t?ng Slideshow ? Slide height ? **Adapt to first image**
2. Ho?c trong `templates/index.json` ??i l?i `"slide_height": "medium"` ? `"adapt_image"` (5 ch?) r?i `shopify theme push --theme 183186358588 --allow-live --only templates/index.json`
3. Ho?c restore t? backup theme tr??c commit n�y

**Push LIVE** `#183186358588`

## 2026-07-23 ? CLS desktop A+C push LIVE

**User:** pull LIVE ? l�m A+C ? push live. Mobile gi? nguy�n.

**Pull** `#183186358588` r?i:
- **A:** `section-main-product.css` ? desktop `min-height: 500px` cho media wrapper/gallery (Customily reserve)
- **C:** `load-css-async` + `desktop_blocking: true` cho slider CSS (featured-collection, collection-list, multicolumn, featured-blog) ? desktop blocking, mobile async

**Push LIVE** `#183186358588`

## 2026-07-23 ? Soi CLS desktop (gi? mobile)

**User:** c�, mobile gi? nguy�n.

**Field:** Desktop Origin CLS **0.3** (Fail); Mobile CLS **0** (Pass).
**Lab homepage desktop:** CLS ~0.50 (Lighthouse), �t attribute ph?n t?.

**Nghi v?n (?u ti�n):**
1. **Origin = nhi?u URL** ? PDP + Customily inject (desktop) r?t hay g�y CLS; mobile origin l?i ?n
2. Homepage nhi?u **slideshow `adapt_image`** xen collection
3. CSS async g?n ?�y (`component-slider`?) c� th? reflow desktop
4. Overlay cart-reminder = `position:fixed` ? �t kh? n?ng CLS
5. DMCA badge unsized (footer) ? impact nh?

**Ch?a s?a code** ? ch? user ch?n h??ng (PDP Customily / slideshow / CSS).

## 2026-07-23 ? Re-push image delivery LIVE

**User:** oke push live ?i.

**Push LIVE** `#183186358588` (card-collection/product + callers) ? x�c nh?n l?i.

## 2026-07-22 ? Fix Improve image delivery + push LIVE

**User:** ok l�m r?i push live.

**Root cause:** `card-collection` d�ng `sizes: calc(100vw - 3rem)` (g?n full mobile) + `src` 1500w d� grid homepage `columns_mobile: 2` / `columns_desktop: 8` ? browser t?i ~750px cho slot ~327px.

**Done:**
- `card-collection.liquid`: `sizes` theo `columns_desktop`/`columns_mobile`; cap srcset ?1000w; `src` 535
- `collection-list` + `main-list-collections`: truy?n columns th?t
- `card-product.liquid`: sizes theo columns; b? 1066/full; `src` 360; callers truy?n columns

**Push LIVE** `#183186358588`

## 2026-07-22 ? PageSpeed Improve image delivery

**User:** h?i fix ???c kh�ng (PSI ~1445 KiB; ?nh 750px cho slot ~327px).

**Answer:** Fix ???c m?t ph?n b?ng theme (`sizes`/`srcset` card collection); compression/AVIF ch? y?u Shopify CDN + ?nh Admin. Kh�ng n�n shrink qu� m?nh ? ?nh m? tr�n retina.

## 2026-07-22 ? Push CSS async + Customily gate LIVE

**User:** push live.

**Push LIVE** `#183186358588`: `theme.liquid`, `load-css-async.liquid`, `announcement-bar`, `featured-collection`, `collection-list`, `featured-blog`, `multicolumn`.

## 2026-07-22 ? Fix render-blocking CSS (c?n th?n, DEV)

**User:** ok fix c?n th?n.

**Keep blocking (tr�nh FOUC):** `base.css`; hero `slideshow.liquid` (slider+slideshow).
**Done:**
- `load-css-async.liquid` snippet
- localization CSS ? async
- announcement: ch? load slideshow/slider khi >1 announcement
- featured-collection / collection-list / featured-blog / multicolumn: slider CSS async
**Kh�ng ??ng:** Shopify `accelerated-checkout` CSS (app).
**Push DEV** `#186878558524`

## 2026-07-22 ? FOUC l� g�

**User:** h?i FOUC.

**Explain:** Flash of Unstyled Content ? trang hi?n tr??c khi CSS k?p apply ? nh�y layout/font r?i m?i ?�ng style. R?i ro khi defer render-blocking CSS.

## 2026-07-22 ? Render-blocking CSS: ch?a l�m

**User:** h?i ?� fix render-blocking (slideshow/slider/base/localization CSS) ch?a.

**Answer:** Ch?a. M?i l�m Customily gate product+cart. Render-blocking CSS v?n load blocking nh? Dawn m?c ??nh.

## 2026-07-22 ? Customily ch? product+cart (DEV)

**User:** ok l�m; kh�ng bi?t check SP n�o c� Customily.

**Approach:** ch?a c� tag/metafield ? gate theo template: ch? `product` + `cart` load `customily.js` + unified (b? home/collection). PDP v?n load h?t (store g?n nh? personalize).
**Push DEV** `#186878558524`: `layout/theme.liquid`
**Test:** home kh�ng c�n customily.js; PDP personalize + cart v?n OK. App setting ?Load scripts from store's theme? ph?i b?t.

## 2026-07-22 ? Customily load c� ?i?u ki?n: ch?a l�m

**User:** t??ng ?� l�m r?i.

**Clarify:** m?i **n�i / ?? xu?t** � 2; ch?a code. ?� l�m kh�c: si?t `hasCustomilyPreviewHost` (skip gallery Pack) ? kh�ng ph?i b? load script Customily tr�n non-PDP/non-personalize. `theme.liquid` v?n load `customily.js` m?i trang + unified m?i product/cart.

## 2026-07-22 ? C� n�n fix PageSpeed Insights?

**User:** h?i n�n fix render-blocking + cache TTL kh�ng, impact g�.

**Verdict:** Cache TTL third-party ? theme g?n nh? kh�ng fix ???c TTL; n�n l�m � Customily/load c� ?i?u ki?n thay v� ?k�o d�i cache?. Render-blocking CSS ? n�n c�n nh?c nh? (homepage), r?i ro FOUC; CWV mobile ?� Pass n�n kh�ng g?p. ?u ti�n: Customily c� ?i?u ki?n > defer CSS non-critical.

## 2026-07-22 ? PageSpeed Insights: render-blocking + cache TTL

**User:** g?i screenshot Insights (mobile).

**Render-blocking (~590ms):** CSS theme (`base`, slideshow, slider, localization) + Shopify accelerated-checkout CSS ch?n first paint.
**Cache TTL ng?n (~680 KiB):** `customily.js` 10m; Facebook fbevents 20m; setubridgeapps (EDD/ETA) 4h ? third-party, theme kh� k�o d�i TTL.

## 2026-07-22 ? ??c PageSpeed Insights (mobile)

**User:** g?i https://pagespeed.web.dev/analysis/https-www-myprintsy-com/2kmwskcomi?form_factor=mobile

**Field (origin mobile):** LCP 1.5s ? INP 192ms ? CLS 0 ? ? CWV Passed. TTFB 0.8s bi�n. Desktop origin CLS 0.3 ? Fail.
**URL c? th?:** thi?u CrUX URL-level ? fallback origin.

## 2026-07-22 ? Pull LIVE m?i nh?t v? local

**User:** pull m?i nh?t t? live v?.

**Done:** `shopify theme pull --theme 183186358588 --force`

## 2026-07-22 ? ATC?cart kh�ng ch? gift (DEV)

**User:** duy?t t?i ?u ATC xong v�o cart kh�ng lag.

**Done:**
- `product-form.js`: redirect ngay sau `/cart/add` + publish (b? wait gift ~2.5s)
- `addon-gift-box-pricing.js`: keepalive m?i cart fetch; stash `gift-box-pending-atc`; `syncPendingAtcGift`
- `cart-gift-box.js`: v�o cart sync pending, thi?u gift th� upsert + reload

**Push DEV** `#186878558524`

## 2026-07-20 ? Variant nhanh do cache g�?

**User:** h?i variant load nhanh l� do cache g� (memcache?).

**Answer:** Kh�ng ph?i Redis/Memcached server. Ch? y?u: (1) `product-info.js` Map HTML section in-memory tab; (2) `pack-preview-cache.js` warm ?nh + cache GetProduct trong session; (3) HTTP cache browser. ?�ng tab / hard refresh m?t mem JS.

## 2026-07-20 ? V� sao gift box l�u

**User:** h?i sao gift box l?i l�u.

**Explain:** sau ATC product xong m?i ch?y gift (tu?n t?): `/cart.js` ? c� th? `/cart/update.js` g? gift c? ? `/cart/add.js` th�m gift. Nhi?u round-trip; redirect c�n ch? max ~2.5s. Kh�ng ph?i UI ch?m ? l� API cart Shopify n?i ?u�i.

## 2026-07-20 ? ATC ? /cart ch?m h?n dialog ? View cart

**User:** redirect ATC?cart l�u; dialog r?i View cart th� l? h?n.

**Why:** redirect ch? gift upsert (max ~2.5s) + full load `/cart` ngay sau ATC; dialog hi?n s?m sau `/cart/add`, user b?m View cart sau ? gift th??ng xong r?i, nav c?m gi�c nhanh.
**?? xu?t (ch? duy?t):** redirect ngay sau `/cart/add` (kh�ng ch? gift); gift `keepalive`; cart page sync gift thi?u n?u c?n.

## 2026-07-20 ? Push ATC ? /cart DEV

**User:** l�n DEV.

**Push DEV** `#186878558524`: `product-form.js`, `addon-gift-box-pricing.js`, `buy-buttons.liquid`.

## 2026-07-20 ? ATC PDP ? /cart (gi? dialog code)

**User:** b?m Add to Cart v�o trang cart lu�n, kh�ng show dialog; code dialog ?? ?�.

**Done:** `product-form.js` redirect `/cart` sau ATC (skip `renderContents`); gift box tick ? ch? upsert max 2.5s; `keepalive` gift fetch; `cart-notification` gi? nguy�n. Toggle: `data-redirect-to-cart="false"`. `buy-buttons.liquid` set `true`.
**Ch?a push** ? ch? DEV/LIVE.

## 2026-07-20 ? Revert defer related + h?i h??ng kh�c

**User:** b? defer related; revert; l�m c�i kh�c.

**Done:** `global.js` tr? IntersectionObserver Dawn; push DEV `#186878558524`. LIVE kh�ng c?n (ch?a push th�nh c�ng).
**Next (ch? ch?n):** (2) Customily load c� ?i?u ki?n ? impact t?c ?? l?n h?n.

## 2026-07-20 ? Defer related c� l�m ?nh tr�n nhanh h?n?

**User:** h?i ?nh ph�a tr�n c� load l? h?n kh�ng.

**Answer:** G?n nh? kh�ng r� so v?i Dawn c? (IntersectionObserver ?� kh�ng fetch related l�c m? trang). ??i ch? y?u timing UX (sau ?nh tr�n ? load related, kh�ng c?n scroll). L?i LCP ?nh tr�n nh?/kh�ng ?�ng k?. Mu?n ?nh tr�n nhanh h?n h?n ? � 2 Customily c� ?i?u ki?n / b?t app / t?i ?u ?nh.

## 2026-07-20 ? N�n push defer related LIVE?

**User:** h?i l?i c� n�n push live kh�ng.

**Verdict:** N�n push n?u DEV ?n ? r?i ro logic th?p (ch? timing fetch). Trade-off: related load s?m h?n scroll-lazy c? (user kh�ng scroll v?n fetch) ? ?�ng � A. LIVE ch?a push (l?n tr??c interrupted).

## 2026-07-19 ? Impact logic defer related

**User:** h?i impact ??n logic kh�ng.

**Answer:** Kh�ng ??i ATC/cart/variant/Customily/gift box. Ch? ??i **th?i ?i?m fetch** related/complementary: sau ?nh above-fold thay v� IntersectionObserver (scroll). N?i dung API recommendations nh? c?.

## 2026-07-19 ? Push defer related DEV

**User:** push DEV.

**Push DEV** `#186878558524`: `assets/global.js` (You may also like / complementary sau above-fold, kh�ng setTimeout).

## 2026-07-19 ? Defer related/complementary sau above-fold (A)

**User:** ch?n A; khi tr�n load xong th� load d??i ngay; kh�ng setTimeout v�i gi�y.

**Done:** `global.js` `ProductRecommendations` ? b? IntersectionObserver (scroll); ch? ?nh gallery PDP (`whenProductAboveFoldReady`) ? `requestAnimationFrame` ? fetch. Kh�ng ch? Customily (tr�nh treo). Kh�ng fixed delay.
**Ch?a push** ? ch? DEV/LIVE.

## 2026-07-19 ? Clarifying delay vs lazy scroll

**User:** h?i ?load sau? vs ?scroll m?i load?.

**Hai h??ng:**
A) Defer: v?n load m?i l?n v�o PDP, nh?ng sau LCP/idle (kh�ng c?n scroll).
B) Lazy viewport: ch? fetch khi s?p/ scroll t?i section.
**Ch?a ch?n** ? ch? user.

## 2026-07-19 ? ?u ti�n above-fold, delay You may also like

**User:** h?i ph?n tr�n load tr??c, You may also like + b�n d??i load sau ???c kh�ng.

**Answer:** ???c. Above-fold (?nh, Customily, gift box, ATC) gi? nguy�n. Complementary / related / description d??i: lazy b?ng IntersectionObserver ho?c tr� ho�n fetch recommendations + CSS/JS. **Ch?a code** ? ch? duy?t.

## 2026-07-19 ? Gi?i th�ch delay JS/CSS sau LCP

**User:** h?i ?Delay JS/CSS kh�ng g?p?? l� sao.

**Explain:** LCP = ?nh/preview ch�nh hi?n xong. Reviews, complementary, zoom, app blocks kh�ng c?n ngay ? load `defer`/idle/`requestIdleCallback`/IntersectionObserver sau LCP ? trang c?m gi�c m? nhanh h?n; r?i ro: feature d??i fold hi?n mu?n v�i tr?m ms?v�i gi�y.

## 2026-07-19 ? C�n c�ch t?i ?u t?c ???

**User:** h?i c�n t?i ?u t?c ?? g� n?a.

**?� xong:** ?nh PDP; pack-preview-cache; Pack section cache; skip gallery + si?t detect Customily.
**C�n (?u ti�n):** (2) Customily load c� ?i?u ki?n; delay JS/CSS non-critical; audit/b?t app embeds; Liquid PDP g?n.
**Kh� b?ng theme:** GetProduct l?n 1, spinner Customily, TTFB apps, analytics.

## 2026-07-19 ? Gi?i th�ch � 2: Customily load khi c?n

**User:** h?i c�n � 2 th� sao.

**� 2:** hi?n `customily.js` load m?i trang + unified script m?i product/cart. ?? xu?t ch? load khi product/cart th?c s? c?n personalize (tag/metafield/vendor Customily).
**L?i:** PDP th??ng + homepage/collection nh? h?n (b?t JS/network).
**R?i ro:** sai ?i?u ki?n ? personalize kh�ng hi?n; cart preview Customily c� th? c?n script cart; App Embed Customily c� th? double-load n?u kh�ng t?t ??ng b?.
**Ch?a code** ? ch? user duy?t.

## 2026-07-19 ? Gi?i th�ch l?i si?t detect v?a push

**User:** h?i v?a s?a g� + impact.

**S?a:** `hasCustomilyPreviewHost()` ? b? `script[src*="customily"]` + `window.Customily`; ch? DOM preview th?t.
**Impact:** Pack + kh�ng Customily UI ? gallery Dawn ??i l?i ?�ng; Pack + c� Customily UI ? v?n skip sync gallery.

## 2026-07-19 ? Push si?t detect Customily LIVE

**User:** push live `product-info.js` (si?t detect).

**Push LIVE** `#183186358588`: `assets/product-info.js`.

## 2026-07-19 ? Cache Shopify ch? mem?

**User:** h?i ?mem cache th�i �?.

**Answer:** Merchant kh�ng c� Redis. C� nhi?u l?p: CDN Shopify + HTTP cache browser + (theme ta) Map JS in-memory session (Pack/GetProduct). Kh�ng ph?i Redis server.

## 2026-07-19 ? Shopify c� d�ng Redis?

**User:** h?i Shopify c� d�ng Redis kh�ng.

**Answer:** Merchant/theme **kh�ng** c?u h�nh Redis. Online Store l� SaaS (CDN + cache Shopify). N?i b? Shopify c� th? d�ng Redis/cache ri�ng ? kh�ng expose. App/Hydrogen t? host th� t? g?n Redis n?u c?n. Theme MyPrintsy kh�ng li�n quan Redis.

## 2026-07-19 ? Si?t detect Customily (product-info)

**User:** l�m si?t detect; h?i impact.

**Change:** `hasCustomilyPreviewHost()` b? `script[src*="customily.com"]` + `window.Customily` (load m?i PDP). Ch? c�n DOM preview th?t (`.cl-product`, ATC Customily, id/class customily?).
**Impact:** product kh�ng personalize ? Pack ??i gallery Dawn l?i ?�ng. Product c� Customily ? v?n skip nh? c? khi UI ?� mount. Edge: Customily mount ch?m ? v�i l?n Pack ??u c� th? sync gallery (�t nh�y) r?i m?i skip.

## 2026-07-19 ? C�n t?i ?u PDP kh�ng?

**User:** h?i c�n c�ch t?i ?u trang product.

**?� LIVE:** srcset/preload; pack-preview-cache; product-info Pack cache + skip updateMedia.
**C�n l�m (theme, c?n duy?t):** si?t detect Customily; delay JS non-critical (reviews/apps); Customily ch? load khi product c� personalize; b?t CSS/JS block th?a tr�n PDP; audit app embeds.
**Kh� b?ng theme:** spinner Customily, GetProduct l?n 1, TTFB apps, analytics (472 req).

## 2026-07-18 ? Restore source t? backup

**User:** h?i c� c�ch update l?i to�n b? source ?� backup tr??c ?� kh�ng (m�n Themes Admin).

**C�ch:**
1. Admin ? Themes ? Import (upload .zip backup) ? th�nh Draft ? Preview ? Publish n?u OK
2. Ho?c CLI: `shopify theme push` t? folder/zip backup (LIVE c?n `--allow-live`)
3. Tr??c khi ??ng LIVE: Duplicate theme Active l�m safety net
**L?u �:** Import kh�ng ghi ?� Active ngay ? ph?i Publish. N?u l?i ch? `product-info.js` th� revert 1 file nh? h?n full restore.

## 2026-07-18 ? S?n ph?m kh�ng Customily c� l?i skip gallery?

**User:** h?i product kh�ng d�ng Customily c� b? l?i kh�ng.

**Answer:** Kh�ng. Skip ch? khi `lastPackOptionChange && hasCustomilyPreviewHost()`. Kh�ng Customily ? `updateMedia` ch?y b�nh th??ng. Edge: script Customily global tr�n m?i PDP th� detect c� th? true d� product kh�ng personalize ? Pack ??i c� th? b? sync gallery (hi?m).

## 2026-07-18 ? ??nh Shopify n?n? l� g�

**User:** h?i ?nh Shopify ph�a d??i / n?n l� ?nh g�.

**Answer:** Gallery Dawn (`media-gallery` / `product-media-gallery`) = ?nh upload trong Admin Products ? Media (featured theo variant). Customily ?� preview personalization l�n v�ng ?� ? user th??ng ch? th?y l?p Customily.

## 2026-07-18 ? V� sao Dawn c?n updateMedia

**User:** h?i t?i sao l�c ??u c?n sync media-gallery.

**Answer:** Dawn chu?n: m?i variant c� `featured_media` ? ??i Color/Size/Pack th� gallery theme ph?i nh?y ?nh ?�ng variant (kh�ng Customily). Tr�n MyPrintsy + Customily, t?ng theme b? che ? sync Pack th?a; Color/Size v?n c?n khi kh�ng c� Customily che.

## 2026-07-18 ? Push product-info.js LIVE

**User:** push l�n live xem n�o.

**Push LIVE** `#183186358588`: `assets/product-info.js` (Pack section cache + skip updateMedia khi Pack + Customily).

## 2026-07-18 ? Clarifying skip gallery + Customily ch?m

**User:** th?c m?c ?sao l?i kh�ng ??i? khi Customily ch?m/l?i.

**Clarify:** Skip ch? b? sync **gallery Dawn (theme)**. Preview tr�i user th?y l� **Customily** ? ??i Pack v?n g?i GetProduct nh? c?; ch?m th� v?n ch? app, kh�ng ph?i do skip. Kh�c bi?t ch? khi Customily fail/?n ? theme gallery n?n: **c� skip** = ?nh Pack c?; **kh�ng skip** = theme ?� ??i featured Pack (c� th? th?y ?�ng h?n m?t ch�t).

## 2026-07-18 ? Impact skip gallery sync khi c� Customily

**User:** h?i impact b? `updateMedia` khi Pack + Customily.

**Khi n�o skip:** ch? `lastPackOptionChange` + detect Customily tr�n trang.
**V?n ch?y:** price, URL, variant id, sku, inventory, ATC enable.
**L?i:** b?t DOM thrash/flicker gallery Dawn; Customily GetProduct lo preview tr�i.
**R?i ro:** product kh�ng Customily v?n sync b�nh th??ng; Pack ??i m� Customily ch?m/l?i ? gallery theme kh�ng ??i theo featured media (preview ph? thu?c Customily); ??i Color/Size v?n `updateMedia`.

## 2026-07-18 ? Audit ch?a push LIVE

**User:** c�n g� ch?a push live?

**So s�nh local vs LIVE `#183186358588`:**
- **DIFF:** `assets/product-info.js` (Pack section cache + skip updateMedia Customily) ? ch? DEV / local, **ch?a LIVE**
- **SAME:** pack-preview-cache.js, theme.liquid, product-form.js, index.json

**Ch?a code / ch? duy?t (kh�ng ph?i ?ch?a push?):**
- Autofill off Customily input
- Email signup homepage: block `email_form` disabled (Theme Editor)

## 2026-07-17 ? Confirm Footer email ? Klaviyo

**User:** Footer Show email signup ON + Klaviyo form ID `Yy9PSK` ? h?i nh?p email c� v�o Klaviyo kh�ng.

**Answer:** C� ? embed form Klaviyo `Yy9PSK` thay Shopify form; submit ?i v�o Klaviyo (list/flow g?n v?i form ?� trong Klaviyo).

## 2026-07-17 ? User h?i Theme Editor ?trong ?�y �?

**User:** screenshot Theme Editor, nh�n Newsletter popup (Enable t?t).

**Clarify:** popup ? � email homepage. Fix ? Template ? **Email signup** ? b?t l?i block **Email form** (?ang disabled). Newsletter popup ?? ri�ng.

## 2026-07-17 ? Footer/newsletter m?t � email

**User:** ph?n ?UNLOCK YOUR 10% OFF!? m?t ch? nh?p email.

**Cause:** section `newsletter` tr�n homepage (`templates/index.json`) ? block `email_form` ?ang `"disabled": true`. Heading + paragraph v?n hi?n; Klaviyo embed (`Yy9PSK`) / � email kh�ng render.
**Fix:** b?t l?i block `email_form` trong Theme Editor ho?c set `disabled: false` ? **ch? user duy?t**.

## 2026-07-17 ? Autofill l? tr�n � Enter Name (Customily)

**User:** � text personalization ?�i khi g?i � s? ki?u `100057616662042`; mu?n t?t g?i �.

**Cause:** Chrome autofill nh?m field Customily (app render input, theme kh�ng control s?n).
**Fix ?? xu?t:** script nh? set `autocomplete="off"` (+ `readonly` trick n?u c?n) tr�n input Customily khi mount ? **ch? user duy?t** tr??c khi code.

## 2026-07-16 ? Customily ?Load scripts from store's theme?

**User:** h?i v� sao b?t toggle n�y gi�p trang load nhanh h?n.

**Explain:** script nh�ng theme t?i c�ng HTML (song song, ?�ng ch? product/cart) thay v� ??i App Embed/ScriptTag inject sau khi trang render ? b?t waterfall, designer hi?n s?m h?n. L?u �: ph?i t? g?n script v�o theme.

## 2026-07-16 ? (1) Push pack cache LIVE + (2) audit Pack/product-info DEV

**User:** l�m 1 v� 2.

**1 LIVE** `#183186358588`: `assets/pack-preview-cache.js` + `layout/theme.liquid` (load tr??c Customily tr�n product).

**2 DEV** `#186878558524`: `assets/product-info.js`
- Cache HTML section (t?i ?a 16 URL) ? ??i Pack l?i c�ng option kh�ng fetch l?i.
- ??i Pack + c� Customily ? skip `updateMedia` theme (Customily lo gallery).
- Featured media ?� active ? skip rebuild list/modal.

**Ch?a push product-info l�n LIVE** ? ch? test DEV.

## 2026-07-16 ? C�n t?i ?u th�m g� ? code theme?

**User:** h?i c�n optimize ???c g� b?ng code.

**C�n l�m ???c (theme):** delay non-critical theme JS; audit variantChange/section fetch khi Pack; Liquid b?t n?ng; ?nh ?� l�m + cache Pack DEV.
**Kh�/kh�ng n�n b?ng theme:** TTFB apps, spinner Customily init, GetProduct l?n ??u, analytics embeds.
**?� xong:** srcset/preload LIVE; pack-preview-cache DEV.

## 2026-07-16 ? Spinner Preview + ATC khi load PDP

**User:** h?i v� sao 2 n�t xoay khi load product.

**Answer:** Customily class `ld-over-inverse` ? engine personalization ch?a s?n s�ng (script + GetProduct + font). Theme kh�ng ?i?u khi?n spinner ?�. H?t khi Customily ready (~?o tr??c ~7s).

## 2026-07-16 ? Push ?nh PDP LIVE + cache Pack tr�n DEV

**User:** push ?? ph�n gi?i l�n live; l�m � A cache.

**LIVE** `#183186358588`: product-thumbnail / media-gallery / product-media (srcset/preload).
**DEV** `#186878558524`: + `pack-preview-cache.js` (warm ?nh + cache GET GetProduct trong session), load tr??c Customily trong `theme.liquid` (product only).

## 2026-07-16 ? Network khi b?m Pack (user DevTools)

**Evidence:** m?i click ~ GetProduct ~954ms + webp ~275KB ~1.08s (+ analytics collect).
**Verdict:** ch?m = **Customily** (API + ?nh), kh�ng ph?i theme gallery. Cache theme ch? gi�p webp l?n 2+ n?u c�ng URL; GetProduct m?i l?n = app Customily.

## 2026-07-16 ? ?? xu?t cache ?nh khi ??i Pack

**User:** h?i ?? xu?t; cache c� s?a b?ng code ???c kh�ng, impact g�.

**?? xu?t:**
1. ?u ti�n th? theme: HTTP cache browser ?� c�; JS cache/reuse `<img>` / decode khi Customily/DOM cho ph�p ? r?i ro trung b�nh (selector Customily d? g�y).
2. Tr�nh fetch section th?a n?u ch? ??i Pack (c?n audit product-info) ? impact logic variant.
3. Customily support = b?n nh?t.

**Impact cache theme:** kh�ng ??ng ATC/checkout n?u ch? reuse URL ?nh; r?i ro UI nh�y/sai � n?u DOM Customily ??i version.

## 2026-07-16 ? Pack ??i ? gallery ch?m

**User:** ch?n Pack 1?5 th� ?nh b�n tr�i ??i (Pack 4 = l??i 4 ?nh gi?ng nhau) nh?ng load l�u.

**Nguy�n nh�n kh? d?:** Customily pack preview (render N � ?nh) + c� th? k�m variantChange/section fetch theme. Kh�ng ph?i layout ?nh nh? h?n sau t?i ?u srcset.

## 2026-07-16 ? ?nh PDP c� b? nh? h?n kh�ng?

**User:** h?i t?i ?u srcset/widths c� l�m ?nh hi?n nh? h?n kh�ng.

**Answer:** Kh�ng ? k�ch th??c hi?n th? (CSS/layout) gi? nguy�n. Ch? gi?m file t?i xu?ng (max ~1346 thay 1946+). M�n to v?n ?? n�t; zoom modal v?n t?i 2048.

## 2026-07-16 ? T?i ?u ?nh PDP + gi?i th�ch thread load

**User:** l�m t?i ?u ?nh; h?i th�m thread load.

**Done (GUI):**
- `product-thumbnail.liquid`: cap widths ?1346; LCP `fetchpriority=high` + `decoding=async`; ?nh sau `lazy` + `low`
- `product-media-gallery.liquid`: `<link rel=preload>` ?nh hero
- `product-media.liquid` (modal): b? srcset 2200?4096; fix `sizes` mobile `100vw`

**Thread load:** Browser ?� t?i nhi?u ?nh song song (?6 conn/host). Theme kh�ng t?o OS thread; preload + fetchpriority = ?u ti�n LCP trong h�ng ??i song song ?�.

**Push:** DEV `#186878558524`

## 2026-07-16 ? ?nh PDP: c� ?nh h??ng ch?c n?ng kh�ng?

**User:** h?i t?i ?u ?nh c� impact ch?c n?ng g� kh�ng.

**Answer:** Kh�ng ??ng ATC/Customily/gift/checkout n?u ch? ??i size/lazy/srcset ?�ng c�ch. R?i ro nh?: zoom/lightbox h?i m?m n?u resize qu� tay; LCP/SEO ?nh t?t h?n. Kh�ng ??i logic.

## 2026-07-16 ? ?nh PDP impact metric n�o

**User:** h?i t?i ?u ?nh PDP ?nh h??ng ph?n n�o.

**Answer:** Ch? y?u LCP/FCP, bandwidth, Load/Finish; **kh�ng** gi?m TTFB; DCL g?n nh? kh�ng; Customily spinner g?n nh? kh�ng. ?o tr??c: hero width=1100 ~2.5s tr�n waterfall.

## 2026-07-16 ? Apps ??u c?n, kh�ng b? ???c th� sao

**User:** app to�n c?n thi?t, h?i h??ng c�n l?i.

**H??ng:** kh�ng g? app ? (1) delay/lazy embed kh�ng critical path n?u app cho ph�p (2) ?nh PDP (3) Customily support (4) Liquid g?n (5) ch?p nh?n s�n TTFB app-heavy. Theme c� th? l�m ?nh + ki?m tra sync JS; kh�ng k? v?ng DCL c�n 1s.

## 2026-07-16 ? DOMContentLoaded t?i ?u ???c g�?

**User:** h?i DCL c� t?i ?u ???c kh�ng.

**Explain:** DCL ? TTFB + parse HTML + script blocking (sync). ?o PDP: TTFB ~3.1s, DCL ~4.2s ? ph?n sau TTFB ~1s. ?u ti�n gi?m TTFB/apps; theme: tr�nh sync JS n?ng, CSS critical, �t HTML ph�nh. `defer`/`async` ?� d�ng kh� nhi?u.

## 2026-07-16 ? Gi?i th�ch Pixelfy ?1 active? vs ?No activity?

**User:** h?i m�u thu?n Extensions 1 active vs Unused access no activity 30d.

**Explain:** 1 active = App embed/extension ?ang b?t tr�n Online Store (v?n ch?y tr�n web). No activity = m?t s? quy?n Admin API (Products, Store analytics?) kh�ng b? app g?i g?n ?�y ? kh�ng c� ngh?a pixel kh�ng fire tr�n storefront.

## 2026-07-16 ? App kh�ng d�ng c� t?n th?i gian load kh�ng?

**User:** h?i app idle (vd AOD Order Tracking, no activity 30d) c� l�m ch?m trang kh�ng.

**Answer:** Th??ng **kh�ng** t?n TTFB/PDP n?u kh�ng c� App embed / script storefront. V?n t?n: quy?n data, webhook/API n?n, r?i ro b?o m?t, clutter. G? ???c n?u ch?c kh�ng c?n.

## 2026-07-16 ? Gift box tier 2 app: kh�ng ?ang d�ng

**User:** app hi?n 0 active Functions, no activity 30 days ? h?i c� d�ng kh�ng.

**Verdict:** App = Shopify Function discount (checkout tier). **Kh�ng active** ? kh�ng ch?y. Gift box tr�n PDP/cart v?n ch?y b?ng **theme** (`addon-gift-box-pricing.js` + variants). G? app **kh�ng** t?t addon gift box storefront; ch? b? function discount (v?n ?� t?t).

## 2026-07-16 ? Review list apps vs PDP/TTFB

**User:** g?i Installed apps, h?i c�i n�o kh�ng d�ng / ?nh h??ng load.

**App embeds ?ang b?t (settings_data):** Judge.me, Delivery Date ETA, Klaviyo, Pixelfy, Simprosys, Inbox, Clarity (x2), Booster Page Speed.

**G?i � th? t?t tr??c (�t r?i ro business):** Clarity brandAgents + Clarity (ho?c 1 c�i), Pixelfy n?u th?a pixel, Booster n?u nghi ng?.
**Gi?:** Customily, Gift box tier 2, Klaviyo, Judge.me (n?u c�n review), Delivery Date (n?u c�n hi?n EDD).
**Backend/�t PDP:** Flow, GraphiQL, Hextom, Simprosys (feed), Pin Auto / Post Studio (social).

## 2026-07-16 ? C�ch t?i ?u TTFB Shopify PDP

**User:** h?i t?i ?u TTFB ki?u g�.

**Answer:** ch? y?u Admin/apps (b?t app inject, app embed ch? product n?u c?n), Liquid n?ng; theme c?t �t h?n. Shopify Plus/CDN �t ??ng ???c TTFB HTML app-heavy. Checklist: Apps and sales channels ? t?t app kh�ng c?n ? ?o l?i Network responseStart.

## 2026-07-16 ? Gi?i th�ch TTFB HTML ~3s

**User:** h?i TTFB l� g�.

**Explain:** Time To First Byte ? th?i gian t? b?m v�o URL ??n khi browser nh?n byte HTML ??u ti�n t? server (~3s tr�n PDP ?o ???c). Ch?a t�nh t?i ?nh/JS; ch?m th??ng do Shopify render Liquid + app inject.

## 2026-07-16 ? T?ng k?t t?i ?u PDP load

**User:** h?i c�n t?i ?u sao ?? product load l? h?n.

**T�m t?t ?u ti�n:**
1. Customily (?� ON theme scripts) ? h?i support / gi?m ?? ph?c t?p option
2. TTFB ~3s ? gi?m app inject Shopify
3. ?nh PDP ? width nh? h?n, lazy thumb
4. Analytics ? Clarity/TikTok/multi-pixels/Klaviyo

Kh�ng c�n vi?c ?ch�n script Customily? ? ?� xong.

## 2026-07-16 ? Customily ?Load scripts from theme? ?� ON

**User:** ch?p setting ? toggle ?� b?t s?n.

**Verdict:** Setup ?�ng b�i faster-loading r?i (theme c� script + setting ON). PDP ch?m c�n l?i = Customily init / TTFB / ?nh / analytics ? kh�ng c�n b??c ?b?t setting? ?? r�t th�m.

## 2026-07-16 ? User kh�ng th?y Customily trong Apps sidebar

**User:** list Apps g?n ?�y kh�ng c� Customily.

**Guide:** m? full Apps list / search admin ?Customily? / Settings ? Apps and sales channels. Theme v?n c� script Customily ? app c� th? ?� c�i nh?ng kh�ng n?m recent list.

## 2026-07-16 ? User nh?m Settings General Shopify

**User:** h?i setting Customily c� trong Shopify Settings ? General kh�ng.

**Answer:** Kh�ng. Ph?i v�o **app Customily** ? Store ? Settings ? Developer Settings ? ?Load scripts from store's theme?.

## 2026-07-16 ? Customily load-from-theme: h??ng d?n user

**User:** mu?n l�m c�ch Customily faster loading.

**Status theme:** `theme.liquid` ?� c� script Customily (product + cart) ? ph?n code **?� xong**.
**B??c c�n l?i (user l�m trong app):** b?t **Load scripts from store's theme** trong Customily Developer Settings r?i Save. Kh�ng b?t ? d? load double / �t l?i.

## 2026-07-16 ? Gi?i th�ch Customily ?scripts in theme? (faster loading)

**User:** ??c help Customily https://help.customily.com/articles/5943496222-adding-customily-scripts-to-your-shopify-theme-for-faster-loading

**Explain:** m?c ??nh app load sau page load ? ch? l�u; g?n script v�o theme + b?t ?Load scripts from store's theme? ? load s?m h?n, tr�nh double. Theme MyPrintsy ?� c� tag trong `theme.liquid` ? c?n check setting app ?� b?t ch?a.

## 2026-07-16 ? PDP load ch?m (?o live)

**User:** trang product load kh� ch?m (spinner Preview + ATC).

**Playwright live tumbler:**
- TTFB `responseStart` ? **3.1s** (HTML ch?m)
- DCL ? **4.2s** � Load ? **5.8s** � Customily ATC ready ? **7.2s**
- ~**584** requests; `hasLdOver: true` (spinner Customily tr�n 2 n�t)
- Customily: unified.js ~1.5s, customily.js ~1.4s, GetProduct/font/API ti?p
- Analytics: Clarity, Klaviyo, TikTok, multi-pixels (~78 req)
- ?nh hero width=1100 ~2.5s

**Nguy�n nh�n ch�nh:** TTFB + Customily init + ?nh l?n + third-party ? kh�ng ph?i ATC redirect (?� revert).

## 2026-07-16 ? Revert ATC ? /cart (v? b?n LIVE)

**User:** b? ATC sang `/cart`; revert v? live nguy�n b?n.

**Done:**
- Pull LIVE `#183186358588`: `product-form.js` (+ gift box files) ? local (notification `renderContents`, kh�ng redirect, kh�ng debug logs)
- Push c�ng 3 file l�n DEV `#186878558524` ?? DEV kh?p LIVE

**H�nh vi:** ADD TO CART ? cart-notification popup (nh? live).

## 2026-07-16 ? Option A: redirect ngay sau ATC (DEV)

**Fix:** b? `waitForGiftBoxBeforeRedirect`; gift upsert keepalive + `cart.js` sync.
**Post-fix Playwright (gift off):** add?nav ~9ms; click?`/cart` v?n ~9s (Customily). Cart nav DCL~1.2s / duration~2.6s.
**L?u �:** bottleneck spinner v?n Customily + `/cart/add` ? theme kh�ng r�t ???c ph?n ?�.

## 2026-07-16 ? User g?i Network `/cart` (sau ATC)

**Screenshot:** 478 req | 1.7 MB xfer | 22.1 MB resources | **Finish 14.15s** | **DCL 1.74s** | **Load 3.95s**

**??c:**
- DCL/Load ? khi cart d�ng ???c (~2?4s) ? h?p l� h?n Finish
- Finish 14s + 478 req ph?n l?n analytics/third-party (collect, pixel, track?) k�o d�i sau Load
- Kh�ng ch?ng minh theme wait gift; b? sung hypothesis D: cart navigation + app noise, nh?ng bottleneck spinner PDP v?n l� Customily + `/cart/add`

## 2026-07-16 ? T? ?o ATC lag tr�n DEV (Playwright)

**Hypotheses:** A gift-wait / B cart/add / C theme post-add / D cart page / E Customily pre-add

**Runtime (gift UNCHECKED, `#customily-cart-btn`):**
- Click ? `/cart` URL ? **8.4s**
- Customily save (preview URL + S3 upload + EPS) tr??c `/cart/add` ? **3.5s+**
- `POST /cart/add` ? **3.0s** (`responseEnd` ~2973ms)
- Theme redirect sau add ? **0ms** (navigate ngay)
- Gift default **checked** tr�n PDP tumbler n�y
- Cart page ?o b? Shopify **429** (bot) ? kh�ng tin timing load cart

**Verdict:** A REJECTED � B CONFIRMED � C REJECTED � D INCONCLUSIVE � E CONFIRMED

## 2026-07-16 ? ATC ch?m d� b? check gift box (DEV)

**User:** tr�n DEV b? check Add-on Gift Box v?n th?y l�u.

**K?t lu?n:** kh�ng c�n wait gift box khi unchecked. Delay c�n l?i =
1. Th?i gian `POST /cart/add` (Customily g?n properties / save design ? request n?ng)
2. Full page load `/cart` (kh�c v?i popup in-page)

? Gift box kh�ng ph?i th? ph?m khi unchecked; bottleneck = add API + navigation.

## 2026-07-16 ? Nguy�n nh�n + gi?i ph�p ch?m ATC ? /cart

**User:** ch?m khi ATC v�o cart; xin nguy�n nh�n + gi?i ph�p tr??c (ch?a code).

**Nguy�n nh�n:**
1. Pipeline tu?n t?: `/cart/add` ? gift upsert (`/cart.js` + update + `/cart/add.js`) ? redirect ? full load `/cart`
2. Wait gift box khi tick (max ~2.5s) ? c? � ?? cart ?? gift line
3. Full page navigation + apps (Hulk/Customily?) ch?m h?n in-page notification

**Gi?i ph�p ch? duy?t:**
- A (khuy?n ngh?): redirect ngay sau `/cart/add`; gift box ch?y `keepalive` + cart page sync c�n thi?u
- B: c� gift ? ch? upsert; kh�ng gift ? redirect ngay (?ang g?n v?y)
- C: `/cart/add` k�m gift lines 1 request (?? data nhanh nh?t, refactor l?n)

## 2026-07-16 ? ?�nh gi� t?c ?? Network

**User:** h?i `472 requests | 908 kB | 19.3 MB | Finish 1.7 min` c� ?n kh�ng.

**Verdict:** transferred t?t (~0.9MB); request + resources cao; Finish 1.7 ph�t k�m (th??ng do third-party / request n?n, kh�ng = th?i gian user th?y trang).

## 2026-07-16 ? Gi?i th�ch ch? s? Network DevTools

**User:** h?i � ngh?a `706 requests | 2.7 MB transferred | 19.6 MB resources`.

**Explain:** t?ng request; data th?c t?i qua m?ng; t?ng dung l??ng resource (uncompressed / t? cache).

## 2026-07-16 ? ATC ? /cart tr�n DEV (kh�ng live)

**User:** b?t l?i Add to Cart v�o `/cart`; ch? push DEV ?? test.

**Done:** restore redirect (b?n t?i ?u gift box) tr�n `product-form.js` + gift box pending/keepalive.

**Push DEV only** `#186878558524` ? **kh�ng** push LIVE.

## 2026-07-16 ? Revert ATC ? hi?n l?i cart notification

**User:** revert Add to Cart; hi?n l?i b?ng notification nh? c? (kh�ng redirect `/cart`).

**Done:** restore `product-form.js` ? `cart.renderContents()` (cart-notification).

**Push LIVE** `#183186358588` (2026-07-16)

## 2026-07-16 ? T?i ?u ATC ? /cart (gift box nhanh h?n)

**User:** ch? gift box l�u; t?i ?u v?n load gift box nh?ng nhanh h?n.

**Done (logic):**
- ATC redirect: **kh�ng xin sections** notification (request nh? h?n)
- Ch? ch? gift box khi checkbox **?ang tick**; kh�ng tick ? redirect ngay
- `await` promise upsert tr?c ti?p (max 2.5s) thay v� poll + min 250ms
- Gift box fetch d�ng `keepalive` (l? timeout v?n c? ho�n t?t)

**Files:** `product-form.js`, `addon-gift-box-pricing.js`, `addon-gift-box.liquid`

**Ch?a push** ? ch? user.

## 2026-07-16 ? Revert Customily Preview ATC / Macorner modal

**User:** b?m Preview b? l?i ? revert code + push live.

**Revert:** g? load `customily-preview-atc.js/.css` kh?i `main-product.liquid`; asset ?? stub r?ng (tr�nh cache c�n g?i file c?).

**Push LIVE** `#183186358588`

## 2026-07-15 ? Customily Preview modal: n�t ADD TO CART

**User:** trong modal Preview Your Personalization th�m ATC ki?u Macorner (d??i ?nh preview).

**Done:** inject button v�o `#csh-list-preview-modal` / content Customily ? click dispatch `customily-trigger-add-to-cart` + fallback submit product-form (redirect `/cart` theo product-form.js).

**Files:** `assets/customily-preview-atc.js`, `assets/customily-preview-atc.css`, `sections/main-product.liquid`

**Push LIVE** `#183186358588` (2026-07-15): `product-form.js`, `customily-preview-atc.js/.css`, `main-product.liquid`

**Fix (c�ng ?�m):** modal th?t l� `.customily-modal-preview-only` (kh�ng ph?i list-preview) ? rewrite inject v�o `.main` / `.cl-preview-wrapper`. **Push LIVE l?i** `#183186358588`.

**GUI Macorner (c�ng ?�m):** card tr?ng bo g�c + title/subtitle + X ?? + ATC cam d??i ?nh. Update `customily-preview-atc.js/.css`. **Push LIVE + DEV** `#183186358588` / `#186878558524`.

## 2026-07-15 ? PDP Add to Cart ? /cart (gi? notification code)

**User:** b?m ADD TO CART v�o CART lu�n, kh�ng hi?n popup b�; code popup ??ng b?.

**Done (logic):** `product-form.js` ? sau ATC th�nh c�ng (kh�ng quick-add) skip `cart.renderContents()`, ch? gift-box upsert idle r?i redirect `/cart`. `cart-notification` liquid/JS/CSS gi? nguy�n. Toggle l?i: `data-redirect-to-cart="false"` tr�n `<product-form>`.

**Push LIVE** `#183186358588` (2026-07-15) c�ng batch Customily Preview ATC.

## 2026-07-15 ? Cart Preview d�ng ?nh Customily (kh�ng ph?i PDP)

**User:** Preview hi?n ?nh trang product; ph?i hi?n ?nh preview ?�ng c?a SP ?� personalize.

**Root cause:** modal/`data-preview-src` d�ng `item.image` (catalog). Customily l?u URL ? `_customily-preview` / `_customily-thumb`.

**Fix:** ?u ti�n `_customily-preview` ? `_customily-thumb` ? `item.image` cho modal + thumb cart.

**File:** `sections/main-cart-items.liquid`

**Push LIVE** `#183186358588` (2026-07-15) c�ng batch m�u quantity.

## 2026-07-15 ? Quantity +/- ki?u Macorner (product + cart)

**User:** h�nh c?ng tr? SP ? trang product v� cart l�m nh? m?u (border x�m, chia 3 �, `-` x�m nh?t, `+` coral).

**Done (GUI only):**
- CSS m?i `assets/component-quantity-macorner.css`
- Load tr�n `main-product.liquid` + `main-cart-items.liquid`
- Logic quantity kh�ng ??i

**Update:** product ? label ?Quantity? ngang h�ng v?i +/- (flex row).
**Update:** ??o m�u ? � s? n?n nh?t `#f2f2f2`, n�t `+/-` n?n tr?ng.

**Push LIVE** `#183186358588` (2026-07-15): `component-quantity-macorner.css`, `main-product.liquid`, `main-cart-items.liquid`
**Push LIVE l?i** (c�ng ng�y): m�u quantity ??o + Customily preview (`component-quantity-macorner.css`, `main-cart-items.liquid`)

## 2026-07-15 ? Cart: b?t Preview + modal Proceed To Checkout

**User:** th�m n�t Preview d??i ?nh SP ch�nh tr�n cart; b?m ra modal ?nh l?n + n�t orange ?Proceed To Checkout?.

**Done (GUI):**
- B?t l?i `.cart-macorner-preview-link` (ch? SP ch�nh, gift box v?n kh�ng c�)
- Icon k�nh l�p +; m? modal overlay ?nh large + close X
- CTA ? `/checkout`
- Edit Options v?n ?n

**Files:** `sections/main-cart-items.liquid`, `assets/component-cart-macorner.css`, `assets/cart-preview-modal.js` (m?i)

**Push LIVE** `#183186358588` + **DEV** `#186878558524` (2026-07-15)

**Fix (c�ng ng�y):** b? overlay `cart-item__link` sang product ? ?nh + Preview ??u m? modal (kh�ng v�o PDP). Push l?i LIVE + DEV.

## 2026-07-15 ? Pull LIVE theme v? local

**User:** pull m?i nh?t t? live v?.

**Done:** `shopify theme pull --live --force`
- Theme: **Shopify Dawm Copy - Test** `#183186358588`
- Store: myprintsy-3.myshopify.com
- Local ?� sync v?i b?n live m?i nh?t

## 2026-07-12 ? Revert gift box tier map ? vertical-gift-box-1..5

**User:** revert logic add-on gift box variant m?i; v?n x�i variant c?.

**Revert:**
- Map l?i `vertical-gift-box-1` ? `vertical-gift-box-5` (b? `add-on-gift-box-service-copy-*`)
- Max tier **5**; qty > 5 = bulk 5 + remainder
- Gi� tier UI: 499/899/1199/1499/1799 (b? 1999 / tier 6)
- Cart image fallback: `add-on-gift-box-service` ? `vertical-gift-box-1`

**Gi?:** multi-product parent key + cart sync F5 fix.

**Files:** `gift-box-tier-variant-map.liquid`, `addon-gift-box-pricing.js`, `gift-box-cart-image-source.liquid`, `gift-box-cart-image.liquid` (+ mirror Function src).

## 2026-07-12 ? Cart Macorner GUI ? LIVE

**User:** oke push live.

**Push LIVE `#183186358588`:** `component-cart-macorner.css`, `icon-buyer-protection.png`, `cart-expiry-banner.js`, `cart-macorner-sidebar-extras.liquid`, `main-cart-items.liquid`, `main-cart-footer.liquid`, `cart-page-recommendations.liquid`, `cart.json`.

**URL:** https://myprintsy-3.myshopify.com/cart

## 2026-07-12 ? Cart: Shopping Cart font + Subtotal to h?n

**User:** Shopping Cart theo m?u (sans xanh ??m), Subtotal to h?n x�u.

**Fix:** title d�ng `--font-body-family` weight 700; Subtotal 1.6?2rem weight 700. Push DEV.

## 2026-07-12 ? Cart: t?m ?n Preview + Edit Options

**User:** b? Preview v� Edit Options, l�m sau. CSS `display: none !important` (gi? markup ?? b?t l?i d?). Push DEV.

## 2026-07-12 ? Cart: t�n SP font body + b? max-width 30rem

**User:** font gi?ng m?u (sans xanh ??m), t�n d�i h?n ??ng xu?ng d�ng s?m.

**Fix:** `cart-item__name` d�ng `--font-body-family`, weight 500, m�u `#1a3a6b`. Override `.cart-item__details > * { max-width: 30rem }` ? `none`. C?t ?nh 32%?26% ?? ch? c� ch?. Push DEV.

## 2026-07-12 ? Cart layout: sidebar r?ng h?n + gi� ngang s? l??ng

**Theo m� t? user:**
1. C?t checkout 38?42rem (d�i sang tr�i, c?t tr�i h?p h?n x�u), gap 5?4rem.
2. Gi� s?n ph?m: `grid-row: 2` c�ng h�ng quantity (tr??c ?� span 1/3 + flex-start n�n n?m tr�n).

Push DEV `#186878558524`.

## 2026-07-12 ? Buyer Protection: kh�i ph?c vi?n b?c m?ng ki?u Macorner

**User:** ?nh m?u ??p (vi?n b?c + tr?ng m?ng). L?n tr??c c?t thresh 150 m?t h?t vi?n ??p.

**Fix:** Restore t? PNG g?c, ch? b? n?n card (thresh 230). Gi? silver rim + white ring + orange + cart. Icon 120�136. Push DEV.

## 2026-07-12 ? Buyer Protection: b? qu?ng x�m quanh logo

**User:** logo nhi?u vi?n x�m. **Fix:** flood-fill threshold 150 (t? ?nh g?c) ? b�c qu?ng x�m + v�ng tr?ng, ch? c�n shield cam + gi?. Push DEV PNG m?i.

## 2026-07-12 ? Buyer Protection: logo to, ch? nh?

**Theo m?u user:** icon 80?112px, title 2.2?1.9rem, item 1.55?1.3rem, check 1.6?1.35rem. Push DEV.

## 2026-07-12 ? Buyer Protection: d�ng PNG m?u th?t (b? SVG v? tay)

**L� do:** SVG v? tay kh�ng gi?ng m?u, user ch�. Chuy?n sang d�ng ?nh gi?+shield g?c user g?i.

**?� l�m:** Copy ?nh ? `assets/icon-buyer-protection.png` (128�145), flood-fill b? n?n tr?ng/x�m ? trong su?t. Thay `<svg>` b?ng `<img asset_url>`. Push DEV `#186878558524`.

## 2026-07-12 ? Buyer Protection: gi? ?? chi ti?t (mesh)

**Clarification user:** Kh�ng ph?i nh�e k? thu?t ? mu?n gi? c� ?? n�t nh? m?u (tay c?m + l??i ngang/d?c + b�nh).

**Fix:** L?i d�ng path shield Macorner + cart stroke chi ti?t (handle, trapezoid mesh 2H�3V, axle, 2 wheels). Push DEV.

## 2026-07-12 ? Buyer Protection: ??i gi? ? d?u ? trong shield

**L� do:** Icon gi? fill d�y nh�n blob/m?t n�t, user ch� x?u.

**Fix:** Shield cam 2 tone + ? tr?ng stroke (chu?n trust badge). Push DEV `#186878558524`.

## 2026-07-12 ? ??i Buyer Protection icon (b? path Macorner)

**L� do:** Path Macorner + clip/scale b? soft/m?t n�t, user mu?n logo kh�c t??ng t? m�u cam.

**Fix:** SVG shield ??n gi?n (2 tone cam `#ff7a3d` / `#f36621` + gi? tr?ng), kh�ng clipPath/scale. Push DEV `#186878558524`.

## 2026-07-12 ? Fix Buyer Protection icon b? m?t n�t (DEV)

**Nguy�n nh�n:** SVG d�ng `transform scale` + `clipPath` l?ng nhau ? browser soft-raster c?nh.

**Fix:** V? l?i b?ng stroke vi?n (kh�ng scale), k�ch th??c c? ??nh 80�96px, `shape-rendering: geometricPrecision`. Push DEV `#186878558524`.

## 2026-07-12 ? Buyer Protection icon: path shield Macorner (DEV)

**?� l�m:** G?n SVG path shield Macorner (user cung c?p) v�o `snippets/cart-macorner-sidebar-extras.liquid` ? rim x�m + vi?n tr?ng + fill 2 tone cam + icon gi?.

**Push:** DEV `#186878558524` ? `cart-macorner-sidebar-extras.liquid` + `component-cart-macorner.css` (icon wrap ~7.6�9rem).

**Preview:** `https://myprintsy-3.myshopify.com/cart?preview_theme_id=186878558524`

## 2026-05-30 ? Fix overlay-group upload error

**L?i:** `Section type 'overlay-newsletter-popup' does not refer to an existing section file`

**Nguy�n nh�n:** `overlay-group.json` ???c sync tr??c khi c�c file section placeholder t?n t?i tr�n remote dev theme.

**?� l�m:**

- X�c nh?n ?? 5 file: `overlay-newsletter-popup`, `overlay-privacy-banner`, `overlay-exit-intent-popup`, `overlay-klaviyo-teaser`, `overlay-cart-reminder-popup`
- `shopify theme push --theme 185931399484` ? upload th�nh c�ng, kh�ng l?i
- Sync `overlay-group.json` settings: `return_delay: 15`, `inactivity_time: 60`

**N?u v?n th?y banner ?? tr�n `127.0.0.1:9292`:** hard refresh (Ctrl+F5) ho?c restart `shopify theme dev`.

## 2026-05-30 ? 403 Cloudflare challenge tr�n localhost dev

**Tri?u ch?ng:** `GET http://127.0.0.1:9292/ 403` + text *"B?n c?n x�c minh k?t n?i ?? c� th? ti?p t?c"*

**Nguy�n nh�n:** Cloudflare bot protection c?a Shopify (kh�ng ph?i l?i theme/overlay). Trigger sau nhi?u request li�n ti?p (`/cart`, `/cart/add`).

**Fix:**

- M? tr?c ti?p: `https://sqj5k3-d1.myshopify.com/?preview_theme_id=185931399484`
- Ho?c restart `shopify theme dev`, x�a cookie `127.0.0.1`, b?t JavaScript, ??i challenge t? pass
- Preview URL remote v?n load OK (200)

## 2026-05-30 ? Cart reminder popup kh�ng hi?n (ch? test dev)

**Nguy�n nh�n:**

1. Test tr�n `myprintsy.com` (live) ? popup tr�n live v?n **disabled**
2. Bug Liquid: `data-enabled="{{ popup_enabled }}"` kh�ng output `"true"` ? JS lu�n skip
3. Section `overlay_cart_reminder_popup` b? `disabled: true` trong overlay-group

**Fix (dev only `#185931399484`):**

- S?a `data-enabled` / `data-disable-homepage` output explicit true/false
- B?t cart reminder trong `overlay-group.json` (`enabled: true`, b? disabled)
- Push dev only ? **kh�ng push live**

**C�ch test:** d�ng preview dev `?preview_theme_id=185931399484` ho?c `127.0.0.1:9292`, v�o `/cart` r?i click link sang trang kh�c.

## 2026-05-31 ? Session m?i

- User ch�o, ch?a c� task c? th?.
- Review PRD intern: `[VSF-Intern][PRD] Prototype AML Screening Engine & Investigation Assistant.pdf` ? mentor prep c�u h?i cho bu?i h?i ?�p.

## 2026-05-31 ? Ph�n t�ch: detect kh�ch ?� ??t h�ng (cart reminder popup)

**C�u h?i:** L�m sao bi?t kh�ch ?� order ?? kh�ng hi?n popup n?a (login + guest)?

**Hi?n tr?ng code (`overlay-cart-reminder-popup.js`):**

- Ch?a c� logic ??� ??t h�ng?
- Ch? c� `checkout-nav` (click checkout t? `/cart`) ? sessionStorage, x�a sau load trang ??u
- `canShow()` ch? check: enabled, cart > 0, frequency cap, excluded pages
- Checkout/thank-you page **kh�ng ch?y theme JS** ? kh�ng set flag t? storefront

**C�ch detect kh? thi:**

1. **Cart r?ng** ? Shopify clear cart sau checkout ? popup t? skip (?� c�)
2. **Guest ? Web Pixel** ? `checkout_completed` ? set localStorage l�u d�i
3. **Login ? Liquid** ? `customer.orders_count`, ho?c so `created_at` order g?n nh?t
4. **Klaviyo** ? ?� c� integration email; purchase track qua Shopify webhook (kh�ng d�ng tr?c ti?p cho popup client-side)

**Ch?a implement** ? ch? y�u c?u logic t? user.

## 2026-05-31 ? Web Pixel checkout_completed (order suppression)

**Y�u c?u:** Kh�ng show cart reminder popup sau khi kh�ch ?� order (?u ti�n guest).

**Theme changes:**

- `overlay-cart-reminder-popup.js` ? `hasRecentOrder()` ??c `localStorage` key `cart-reminder-order-completed`
- Setting `order_suppression_days` (default 7, 0 = t?t)
- Reference pixel: `assets/cart-reminder-order-completed-pixel.js` (copy v�o Admin, kh�ng load t? theme)

**Admin (b?t bu?c):** Settings ? Customer events ? Add custom pixel ? paste code t? file tr�n.

**L?u �:** Pixel ch?y cho c? guest + login; guest l� case theme kh�ng c� `customer.orders`.

**Verify 2026-05-31:** Unit test 6/6 PASS; Playwright localhost markup PASS; order flag block PASS.

## 2026-05-31 ? Once per session (cart reminder popup)

- `sessionStorage` key `{storageKey}-session-shown` set khi popup m? (non-preview)
- `canShow()` skip n?u ?� show trong session; reset khi ?�ng tab/m? tab m?i

## 2026-05-31 ? Frequency cap 12h ? live

- JS: `isFrequencyCapped()` ??i t? seconds (dev) sang hours
- `overlay-group.json`: `frequency_cap: 12`
- Push live theme `#183186358588` (Shopify Dawm Copy - Test) tr�n myprintsy-3

## 2026-05-31 ? Push full cart reminder l�n live

- Push 5 files: JS, CSS, section liquid, overlay-group.json, cart-reminder-popup-items snippet
- Live theme `#183186358588` (myprintsy-3) ? user s? g?i live ID kh�c sau n?u c?n

## 2026-05-31 ? Cart reminder popup UI refresh

- Header: logo (`settings.logo`) + shop name + gold divider
- Layout: header full-width, body ?nh tr�i / content ph?i
- Palette cream `#FDF9F0`, gold accent `#B8892E`, button ?en vi?n gold

## 2026-05-31 ? Popup header: logo gi?a, b? shop name

- X�a `<span class="cart-reminder-popup__brand-name">` kh?i section liquid
- CSS: `brand-inner` flex full-width + `justify-content: center`; x�a style brand-name

## 2026-05-31 ? Mobile layout ri�ng cho cart reminder popup

- Desktop: logo header + ?nh tr�i / content ph?i (gi? nguy�n)
- Mobile (`?749px`): layout ri�ng ? ?nh ? logo ? cart items ? email ? button (kh�ng heading/subtext)
- JS: `getActiveLayoutRoot()` ch?n email/button ?�ng layout theo viewport
- Mobile image d�ng `image_mobile` setting (fallback desktop)

## 2026-05-31 ? T�ch section mobile ri�ng trong Overlay group

- **Desktop:** `overlay-cart-reminder-popup.liquid` ? "Cart reminder popup (desktop)"
- **Mobile:** `overlay-cart-reminder-popup-mobile.liquid` ? "Cart reminder popup (mobile)"
- CSS t�ch: `overlay-cart-reminder-popup.css` + `overlay-cart-reminder-popup-mobile.css`
- JS: `data-device-target`, shared storage key, singleton global events, design mode section select
- `overlay-group.json`: th�m `overlay_cart_reminder_popup_mobile`

## 2026-05-31 ? Live: frequency 12h + once per session

- JS: `isFrequencyCapped()` ??c **hours** (kh�ng c�n seconds test mode)
- `overlay-group.json`: `frequency_cap: 12`, `once_per_session: true` (desktop + mobile)
- Push live `#183186358588` (Shopify Dawm Copy - Test) myprintsy-3

## 2026-05-31 ? Success opt-in popup (desktop + mobile)

- Sections: `overlay-success-opt-in.liquid`, `overlay-success-opt-in-mobile.liquid`
- Assets: JS open/close + CSS placeholder (cream/gold)
- Cart reminder Get It Now ? ?�ng reminder ? m? success popup ? CTA redirect `/cart`
- Th�m v�o `overlay-group.json`

## 2026-05-31 ? Success opt-in mobile design

- Layout: logo + star divider ? ?nh ? eyebrow ? heading (gold highlight) ? divider ? subtext ? n�t ?? ? dismiss link
- Schema: image, heading_prefix/highlight/suffix, dismiss_label

## 2026-05-31 ? Success mobile v2 (pink/coral mock)

- Layout: hero image ? logo ? script eyebrow ? serif heading ? subtext ? coral CTA ? pink dismiss
- Pink cream bg, sparkles + leaf decor, bo g�c 1.6rem
- Push dev `#185931399484`

## 2026-05-31 ? Success desktop design (gold/cream mock)

- Logo + star divider ? ?nh tr�i / content ph?i
- Eyebrow italic, heading gold highlight, red CTA, dismiss link
- Push dev `#185931399484`

## 2026-05-31 ? Cart reminder mobile: centered modal

- ??i t? bottom sheet (`align-items: flex-end`) ? **c?n gi?a m�n h�nh**
- Dialog bo 4 g�c, shadow centered, hero image max-height 20rem
- Push dev `#185931399484` + live `#183186358588`

## 2026-05-31 ? Cart reminder mobile: eyebrow / heading / subtext

- Th�m 3 field Content gi?ng desktop (d??i logo, tr�n cart items)
- Schema + CSS mobile + overlay-group.json defaults
- Push dev `#185931399484`
- Push live `#183186358588`

## 2026-05-31 ? Success opt-in mobile: centered modal

- ??i t? bottom sheet ? c?n gi?a m�n h�nh (gi?ng cart reminder mobile)
- Push dev `#185931399484` + live `#183186358588`

## 2026-05-31 ? Pull full live theme

- `shopify theme pull --theme 183186358588 --store myprintsy-3.myshopify.com --nodelete`
- Sync to�n b? file t? live v? local workspace

## 2026-05-31 ? Cart reminder: dismiss link label

- Th�m field + link dismiss (desktop + mobile) gi?ng success opt-in
- JS `data-cart-reminder-dismiss` ? close popup
- Push dev `#185931399484` + live `#183186358588`

## 2026-05-31 ? Success opt-in mobile: red CTA button

- Checkout button ??i coral ? ?? `#c41e3a` + vi?n gold (gi?ng desktop)
- Pull live ? push dev + live

## 2026-05-31 ? Cart reminder: Get It Now ? Success opt-in only

- B? redirect th?ng `/cart` t? cart reminder
- Get It Now ? ?�ng reminder ? m? Success opt-in
- Checkout URL ch? c?u h�nh ? Success opt-in (desktop/mobile)
- Push dev `#185931399484` + live `#183186358588`

## 2026-05-31 ? Cart reminder: inactivity trigger on cart/checkout

- Wire `inactivity_time` (default 60s): no activity on `/cart` or checkout ? show popup on page
- Leave-cart trigger unchanged (pending ? next page)

## 2026-05-31 ? Cart reminder: exit-intent on `/cart`

- `mouseout` on `/cart`: chu?t l�n v�ng tab/?�ng (`clientY <= 8`) ho?c ra kh?i viewport ? `tryOpen('cart-exit-intent', { allowOnCartCheckout: true })`
- Debounce 800ms; desktop only (chu?t); c�ng frequency/session cap v?i c�c trigger kh�c
- Push `assets/overlay-cart-reminder-popup.js` (inactivity + exit-intent) ? dev `#185931399484` + live `#183186358588`

## 2026-05-31 ? Cart reminder: kh�ng hi?n th? tr�n /cart v� /checkout

- Desktop + mobile d�ng chung `overlay-cart-reminder-popup.js`; `canShow()` lu�n ch?n `/cart` v� `/checkout`

## 2026-05-31 ? Cart reminder desktop: Klaviyo openForm

- B? email field custom; Get It Now ? `_klOnsite.push(['openForm', 'XumJWa'])` (setting `klaviyo_form_id`)

## 2026-05-31 ? Cart reminder mobile: Klaviyo openForm

- Mobile: `openForm` `YaAhN2`; push dev `#185931399484`

## 2026-05-31 ? Cart reminder: trigger = gi? c� h�ng

- Kh�ng c?n r?i `/cart`: m?i trang (tr? cart/checkout) + `cart.item_count > 0` ? `scheduleEligibleShow` ? `canShow()` ? hi?n popup
- B? flow `pending` / leave-cart / pagehide; gi? checkout-nav skip, inactivity + exit-intent tr�n trang ???c ph�p

## 2026-05-31 ? Cart reminder: text theme ph�a tr�n form Klaviyo

- Khi `klaviyo_replace_content`: hi?n th? eyebrow / heading / subtext (Theme Editor) **tr�n** embed `klaviyo-form-{ID}`; form email + n�t v?n t? Klaviyo ho?c fallback
- Push dev `#185931399484` (desktop + mobile liquid + CSS)

## 2026-05-31 ? Dev: frequency cap 1 gi�y

- `frequency_cap_seconds: 1` trong `overlay-group.json` (desktop + mobile); JS ?u ti�n gi�y khi > 0
- Nh? ??t l?i `0` tr??c khi l�n production

## 2026-05-31 ? Production caps + push live

- `once_per_session: true`, `frequency_cap: 12`, `frequency_cap_seconds: 0`, `enabled: false`
- Pull live ? restore cart reminder t? transcript ? push dev `#185931399484` + live `#183186358588` (myprintsy-3)

## 2026-05-31 ? Dev: t?t once_per_session + b?t popup

- `once_per_session: false`, `enabled: true` (desktop + mobile) trong `overlay-group.json` ?? test l?p popup

## 2026-05-31 ? Cart reminder: gi? gi? + ch? thay khung email Klaviyo

- `klaviyo_replace_content`: layout c? (text + `cart-reminder-popup-items` + Klaviyo email) + dismiss theme; kh�ng ?n gi?
- Class embed: `--replaces-email`; schema label: "Use Klaviyo for email field only"

## 2026-05-31 ? Klaviyo Forms dashboard (Submitted) vs List API

**M?c ti�u user:** s? Submitted tr�n 2 form Embed (Desktop/Mobile Cart Reminder Trigger-Adjusted), kh�ng ch? list `XDYfDR`.

**Ph�n bi?t:**
- API `subscribeToKlaviyo` ? list ? **kh�ng** t?ng metric Submitted tr�n Sign-up forms
- Ch? submit qua **embed Klaviyo** (`button[type=submit]` trong `.klaviyo-form-{ID}`) m?i ??m Submitted

**Theme:** `XumJWa` (desktop), `YaAhN2` (mobile); JS th�m `scheduleKlaviyoEmbedRefresh` + `waitForKlaviyoEmbed` tr??c fallback API; debug `sessionStorage` key `cart-reminder-debug`.

**Klaviyo (user):** Desktop form ?ang **Editing** ? Publish **Live**; x�c nh?n Form ID trong Targeting ? Embed kh?p theme; popup ph?i hi?n form Klaviyo (kh�ng ph?i n�t ?en GET IT NOW fallback).

## 2026-05-31 ? Fix embed trong popup ?n (post-repro)

**Root cause (runtime + Klaviyo docs):** Popup `visibility:hidden` l�c page load ? Klaviyo onsite JS scan m?t l?n ? kh�ng inject v�o `.klaviyo-form-*` ? lu�n fallback GET IT NOW ? API list, **Submitted form = 0**.

**Fix JS:** `remountKlaviyoEmbedDiv` + `forceReloadKlaviyoOnsiteScript` khi `open()`; `hasKlaviyoEmbedField` kh�ng nh?m input fallback; `bindKlaviyoEmbedSubmitSuccess` ?�ng popup sau submit embed; GET IT NOW ch? close khi fallback/API.

## 2026-05-31 ? Post-repro: sai URL reload Klaviyo script

**Runtime:** Shopify embed d�ng `https://static.klaviyo.com/onsite/js/WcffRx/klaviyo.js?company_id=WcffRx` ? code c? reload `.../onsite/js/klaviyo.js?...` (path kh�c).

**Fix:** `getKlaviyoScriptUrl()` clone URL script hi?n c�; poll sau `script.onload`; soft scan tr??c, hard reload sau 3s n?u embed v?n r?ng; log `embedChildCount` trong debug.

## 2026-05-31 ? Prerender Klaviyo ngo�i popup ?n

**Root cause:** `.klaviyo-form-*` n?m trong modal `visibility:hidden` ? Klaviyo kh�ng inject l�c page load.

**Fix:** `data-klaviyo-prerender` (off-screen, ngo�i modal) + `adoptPrerenderedKlaviyoEmbed()` chuy?n DOM v�o slot khi m? popup; ch? m?t `klaviyo-form-{ID}` l�c load trang.

## 2026-05-31 ? Popup kh�ng hi?n: SyntaxError JS

**Runtime:** `node --check overlay-cart-reminder-popup.js` ? thi?u `]` trong `querySelector('[data-klaviyo-embed-slot])` d�ng ~955 ? to�n file JS fail, `cart-reminder-popup` kh�ng ch?y.

**Fix:** ?�ng ngo?c ?�ng `[data-klaviyo-embed-slot]`.

## 2026-05-31 ? Fallback GET IT NOW ?en (post-repro)

**Runtime:** Popup hi?n (dev preview) nh?ng v?n fallback theme; `hardReload` g? `klaviyo.js` tr??c khi prerender inject xong.

**Fix:** C� prerender ? ch? poll/adopt, kh�ng `hardReload`; observer adopt khi modal m?; clone DOM t? prerender; CSS prerender `visibility:visible` + `translateX(-120vw)`; poll 40�500ms.

## 2026-05-31 ? Prerender `aria-hidden="true"` (post-repro 2)

**Hypothesis M:** Klaviyo skip v�ng `aria-hidden` ? `prerenderChildCount` lu�n 0.

**Fix:** B? `aria-hidden` tr�n `data-klaviyo-prerender` (desktop + mobile liquid); adopt d�ng **move** DOM (kh�ng clone) ?? gi? event submit Klaviyo.

## 2026-05-31 ? Popup test Klaviyo openForm (h??ng 2)

**M?c ti�u:** Test `_klOnsite.push(['openForm', formId])` t�ch kh?i cart reminder embed.

**Files m?i:** `overlay-klaviyo-openform-popup.liquid`, `overlay-klaviyo-openform-popup-mobile.liquid`, `overlay-klaviyo-openform-popup.js/css`; `overlay-group.json` sections `overlay_klaviyo_openform_test*`. Desktop `XumJWa`, mobile `YaAhN2`. Cart reminder **kh�ng ??i**.

## 2026-05-31 ? Cart reminder: openForm fallback (h??ng 2 ? production)

**Self-test:** preview `#185931399484` ? `openForm` m? form Klaviyo, submit email OK.

**Cart reminder:** Khi embed fallback (GET IT NOW ?en), b?m n�t ? `pushKlaviyoOpenForm()` (`openForm` + form ID) ? ?�ng popup cart ? user submit tr�n popup Klaviyo ? **Submitted** form. Setting `fallback_use_openform` (default true). API list ch? khi t?t checkbox. Fix ?�ng popup sau embed submit.

**Post-repro fix:** Runtime test ? `waitForKlaviyoEmbed(5000)` ch?n openForm; cart kh�ng ?�ng. Fix: openForm path b? ch? 5s; `close()` r?i `requestAnimationFrame` ? `openForm`. Verified: `cartOpen:false`, logs `openFormPath` + `scheduleKlaviyoOpenFormAfterClose`.

## 2026-05-31 ? Revert to�n b? code v? live

**L?nh:** `shopify theme pull --theme 183186358588 --store myprintsy-3.myshopify.com --force`

**K?t qu?:** Local = live theme **Shopify Dawm Copy - Test**. ?� x�a file ch? c� tr�n dev (openForm test, pixel JS, debug instrumentation). `overlay-group`: cart reminder `enabled: false`, caps production.

## 2026-05-31 ? X�c nh?n revert ho�n t?t (s?n s�ng l�m l?i)

**Verify local disk:**

- `overlay-cart-reminder-popup.js` ? **608 d�ng** (kh�ng c�n debug/prerender/openForm)
- `overlay-cart-reminder-popup-mobile.liquid` ? **376 d�ng**
- Kh�ng c�n file `overlay-klaviyo-openform-popup*`
- `overlay-group.json`: desktop/mobile cart reminder `enabled: false`, `once_per_session: true`, `frequency_cap: 12`, form `XumJWa` / `YaAhN2`

**C�n l?i (kh�ng ?nh h??ng theme):** `node_modules/playwright` t? self-test; `JOURNAL.md` gi? l?ch s? dev.

**L?u �:** `shopify theme dev` (#185931399484) ?� sync m?t ph?n live l�n dev tr??c khi credential l?i ? restart CLI n?u c?n test dev.

## 2026-05-31 ? Submit email qua Klaviyo formID (embed), kh�ng listID

**Y�u c?u:** Email trong cart reminder ph?i ??m **Submitted** tr�n form Embed (`XumJWa` desktop / `YaAhN2` mobile), kh�ng d�ng API list `XDYfDR`.

**Nguy�n nh�n c?:** Popup ?n l�c load ? Klaviyo embed kh�ng inject ? fallback theme (n�t ?en GET IT NOW) ? `subscribeToKlaviyo()` g?i listID.

**Fix:**

- Prerender `klaviyo-form-{formId}` off-screen l�c page load (`data-klaviyo-prerender`)
- Khi popup m?: adopt DOM Klaviyo t? prerender v�o slot ? hi?n form Klaviyo (Enter email + GET IT NOW v�ng)
- C� `form_id`: **kh�ng** g?i `subscribeToKlaviyo`; click n�t submit c?a Klaviyo embed
- L?ng nghe `klaviyoForms` event `submit` ? ?�ng popup + m? Success opt-in

**L?i sync:** `Invalid JSON in tag 'schema'` ? thi?u d?u ph?y + tr�ng key `info` ? `klaviyo_list_id_desktop/mobile`. ?� s?a, schema parse OK.

## 2026-06-05 ? GET IT NOW b?m kh�ng ph?n h?i (fallback ?en)

**Tri?u ch?ng:** Popup cart reminder ?�ng layout nh?ng n�t **GET IT NOW ?en** (fallback theme). B?m kh�ng ?�ng popup, kh�ng submit.

**Nguy�n nh�n:** Klaviyo embed ch?a inject ? fallback hi?n ? c� `form_id` n�n `submitKlaviyoEmbedForm()` return `false` (kh�ng d�ng listID) ? JS d?ng im.

**Fix:**

- Ch? 1 div `klaviyo-form-{id}` (prerender off-screen, b? duplicate trong slot ?n)
- Prerender r?ng h?n (36rem), poll Klaviyo scan l�c page load
- N?u embed v?n ch?a s?n s�ng: ?�ng cart popup ? `openForm` (`XumJWa`/`YaAhN2`) ? user submit tr�n form Klaviyo ? ??m Submitted
- `klaviyoForms` submit m? Success opt-in k? c? khi cart popup ?� ?�ng

## 2026-06-05 ? Desktop popup che m?t email + GET IT NOW

**Tri?u ch?ng:** C?t ph?i scroll c? kh?i ? email/n�t b? khu?t d??i danh s�ch cart.

**Fix CSS:** Ch? list cart scroll (`max-height: 16rem`); email + Klaviyo + dismiss `flex-shrink: 0` lu�n hi?n.

## 2026-06-06 ? B?t cart reminder tr�n dev theme

- `overlay-group.json`: desktop + mobile `enabled: true`
- Push: `shopify theme push --theme 185931399484 --store sqj5k3-d1.myshopify.com`

## 2026-06-06 ? Fix push l?i return_delay + push dev

**L?i:** `Setting 'return_delay' must be a step in the range` ? `return_delay: 3` invalid (schema `step: 5`).

**Fix:** `return_delay: 5`, gi? dev test: `frequency_cap_seconds: 30`, `once_per_session: false`.

**Push OK:** overlay-group + cart reminder liquid/js/css ? `#185931399484`.

## 2026-06-06 ? � email bi?n m?t trong popup

**Nguy�n nh�n:** `syncKlaviyoEmbedVisibility()` query `input[type="email"]` trong c? slot ? match lu�n input c?a **fallback** ? ?n fallback d� Klaviyo embed ch?a load.

**Fix:** Ch? ki?m tra email b�n trong `.klaviyo-form-{formId}`; fallback hi?n khi embed ch?a c� field th?t.

## 2026-06-06 ? GET IT NOW kh�ng submit Klaviyo embed

**Tri?u ch?ng:** B?m GET IT NOW ? popup ?�ng / l?i, kh�ng ??m Submitted tr�n form Embed.

**Nguy�n nh�n:** Embed ch?a load ? fallback ? `openForm` sau khi **?�ng** cart popup; submit qua prerender ch?a th?.

**Fix:** `fillAndSubmitKlaviyoEmbed()` th? prerender r?i slot; `openForm` fallback **kh�ng ?�ng** cart popup tr??c; blur focus tr??c `aria-hidden`.

## 2026-06-06 ? Klaviyo Targeting: cart value > $199

**Screenshot Targeting form `XumJWa`:**
- URL rules: OFF (kh�ng ch?n dev store)
- **Show based on total cart value: ON** ? **Is greater than 199**

**Gi? thuy?t G:** Gi? theme popup (~$4.99 + tumbler) < $199 ? Klaviyo **kh�ng inject** embed ? fallback ?en GET IT NOW.

**H�nh ??ng:** T?t cart value rule tr�n form embed (popup theme ?� t? trigger), ho?c test cart > $199 ?? verify. Log `hypothesisId: G` ghi `cartTotalDollars` + `meetsKlaviyoCartValueRule`.

## 2026-06-06 ? Runtime verify + fix remount x�a embed

**Log reproduce (CONFIRMED):**
- `cartTotalDollars: 44.94`, `meetsKlaviyoCartValueRule: false` ? `slotReady: false` (G ?)
- `cartTotalDollars: 244.54`, `meetsKlaviyoCartValueRule: true` ? `hasKlaviyoField: true` r?i `remount` ? `slotReady: false` (H ?)

**Fix code:** `remountKlaviyoEmbedTarget` ? `ensureKlaviyoEmbedTarget` ? **kh�ng remove** div ?� c� Klaviyo inject; ch? t?o div m?i khi thi?u + `refreshForms`.

**Klaviyo config (user):** T?t ?Show based on total cart value > 199? tr�n `XumJWa` / `YaAhN2` ?? embed ho?t ??ng v?i gi? th??ng.

## 2026-06-06 ? GET IT NOW Klaviyo xoay m�i (spinner)

**Tri?u ch?ng:** N�t v�ng Klaviyo embed load OK nh?ng b?m GET IT NOW ? spinner quay m�i, popup kh�ng ?�ng.

**Log:** Kh�ng c� `handleSubmitClick` (user b?m n�t Klaviyo native, kh�ng ph?i fallback ?en).

**Gi? thuy?t P:** CSS `:not(:has(input[type=email]))` + `syncKlaviyoEmbedVisibility` flip fallback khi Klaviyo ?ang submit (input t?m ?n) ? `pointer-events: none` / DOM unstable ? API Klaviyo kh�ng ho�n t?t.

**Fix:**
- `klaviyoEmbedLocked` ? kh�ng flip v? fallback sau khi embed ?� load
- `hasKlaviyoEmbedContent` nh?n di?n `.klaviyo-form-version-cid`, `button[type=submit]`
- X�a CSS `pointer-events: none` khi thi?u email input (gi? ch? `:empty`)
- `klaviyoForms` log all types; handle `stepSubmit` + `redirectedToUrl` ?�ng popup

**Network screenshot user:** `profiles/?company_id=WcffRx` CORS t? `shop_events_listener` = Shopify Customer Events, **kh�ng ph?i** Klaviyo form submit API. Log ch? c� `embedOpen`/`viewedStep`, **kh�ng c�** `submit`/`stepSubmit` ? Klaviyo submit ch?a ho�n t?t. Th�m watchdog `R` + network log `Q` sau click.

## 2026-06-06 ? User t?t cart value > $199 tr�n Klaviyo `XumJWa`

Targeting screenshot: cart contents rules **t?t c? OFF**. C?n **Publish** form ? hard refresh preview ? test gi? < $50: k? v?ng `slotReady: true` ?n ??nh (kh�ng flip fallback).

**Log verify sau t?t $199:** gi? $44.94 ? `slotReady: true` ?. Submit v?n k?t: kh�ng c� `submit`/`stepSubmit`/`O`.

**Fix submit spinner (gi? thuy?t S):**
- `triggerKlaviyoScan` skip `refreshForms` khi popup m? + embed locked (tr�nh re-render mid-submit)
- `mountKlaviyoEmbed` skip remount khi embed ?� locked
- `syncDeviceKlaviyoEmbedPresence` x�a `.klaviyo-form-*` tr�n device ?n (desktop/mobile c�ng DOM)
- Submit tracking: `composedPath()` + rebind m?i l?n m? popup

## 2026-06-06 ? ROOT CAUSE submit spinner (log T)

**Log O:** click GET IT NOW, `buttonType: button`, `embedLocked: true`.

**Log Q:** `http://a.klaviyo.com/client/profiles/?company_id=WcffRx` transferSize 0, duration 1ms (blocked). `https://event-bulk-create` OK 433ms.

**Log R:** 12s sau `gotConversion: false`, `buttonDisabled: true` ? submit kh�ng ho�n t?t.

**Root cause:** Klaviyo g?i profiles API qua **HTTP** tr�n trang **HTTPS** ? mixed content blocked ? spinner m�i.

**Fix:** `bindKlaviyoHttpsUpgradeOnce()` patch `fetch` + `XHR.open` ? upgrade `http://a.klaviyo.com` ? `https://`.

**Verify fail:** Kh�ng c� log `T` ? patch ch?y sau Klaviyo app embed. Request v?n `http://` (log Q line 19). User test **localhost** `127.0.0.1:9292` ? CORS preflight fail.

**Fix v2:** `assets/klaviyo-https-patch.js` load **tr??c** `content_for_header` trong `theme.liquid`. Watchdog 12s ? `handleKlaviyoSubmitTimeout` fallback subscribe + ?�ng popup (dev/localhost UX).

## 2026-06-06 ? myprintsy.com: API OK nh?ng kh�ng c� klaviyoForms submit

**Log Q:** `https://a.klaviyo.com/client/profiles/` 663ms + `client/subscriptions/?onsite=true` 550ms ?

**Log R:** `gotConversion: false`, `buttonDisabled: false` ? API xong nh?ng event `submit` kh�ng fire, popup v?n m?.

**Fix v3:** Detect `client/subscriptions&onsite=true` ? `completeKlaviyoSubmit()` sau 1.5s. Capture email l�c click (`pendingKlaviyoSubmitEmail`).

**Fix v4:** localhost `subscriptions` **403** (DataDome) ? kh�ng coi request timing l� success. `klaviyo-https-patch.js` track `response.ok` ? event `klaviyo-onsite-subscribe-result`. Ch? `completeKlaviyoSubmit` khi `ok: true`.

## 2026-06-06 ? Production myprintsy.com 403 DataDome

**Log W:** `ok: false, status: 403` tr�n `www.myprintsy.com`. Klaviyo embed hi?n "An error occurred when submitting".

**Fix v5:** Kh�ng `completeKlaviyoSubmit` khi 403. `getKlaviyoCompanyId` ch? nh?n string (tr�nh `company_id=function()`). HTTPS patch ch? tr�n localhost/http ? production d�ng fetch native Klaviyo.

**Fix v6 (log verify):** Production `subscribeStatus: 0` ? XHR patch kh�ng ch?y tr�n HTTPS ? kh�ng b?t 403. Lu�n patch XHR tracking; watchdog skip fallback khi `sawOnsiteSubscribe && !subscribeOk`.

**Deploy live:** Push `#183186358588` ? `klaviyo-https-patch.js` + `overlay-cart-reminder-popup.js` (fix v6).

**Deploy live test settings:** `overlay-group.json` ? `once_per_session: false`, `frequency_cap_seconds: 5`, `return_delay: 5`, `enabled: true` (desktop + mobile).

**Layout fix:** Klaviyo embed chi?m `flex:1` ? v�ng cart tr?ng ph�nh to. CSS: items `flex:0`, ?n khi r?ng, Klaviyo `min-height:0`. JS: `refreshCartItems()` t? `/cart.js` khi m? popup.

**UI revert:** B? `min-height: 0` tr�n `.klaviyo-embed--replaces-email` + `[class*='klaviyo-form-']` ? rule n�y �p n�t GET IT NOW b� l?i. Gi? cart items `flex: 0 0 auto`.

**Mobile Klaviyo:** B? fallback `is-visible` m?c ??nh (design mode); mount embed trong editor; CSS email/fallback gi?ng desktop; form `YaAhN2`.

**Deploy dev `#185931399484`:** JS, CSS desktop/mobile, liquid sections, `overlay-group.json`, `klaviyo-https-patch.js`.

**Mobile embed fix:** Kh�ng `remove()` `klaviyo-form-YaAhN2` khi inactive (CSS ?� ?n section). Th�m `bootstrapKlaviyoEmbed()` poll `refreshForms` khi mobile connect/resize.

**Deploy live `#183186358588`:** mobile embed fix + CSS full-width email.

**Mobile text center:** `overlay-cart-reminder-popup-mobile.css` ? `text-align: center` cho embed/input; n�t submit `display:flex` + `align-items/justify-content: center`; link MAYBE LATER c?n gi?a. Push live.

**Mobile hero image cover:** `.cart-reminder-popup__media` ? container `width:100%`, `height:20rem`, `overflow:hidden`; img `position:absolute` + `object-fit:cover` full bleed tr�n c�ng popup.

**Mobile b? logo:** X�a block `.cart-reminder-popup__brand` trong `overlay-cart-reminder-popup-mobile.liquid` + CSS brand/logo/divider. Desktop gi? nguy�n.

**Production caps:** `overlay-group.json` ? `once_per_session: true`, `frequency_cap: 12`, `frequency_cap_seconds: 0` (desktop + mobile). Push live.

**Success popup copy code:** Snippet `success-opt-in-promo-code.liquid` + icon copy c?nh heading; `overlay-success-opt-in.js` copy clipboard (desktop + mobile).

**Push dev `#185931399484`:** success opt-in copy (snippet, liquid desktop/mobile, js, css).

**Pull live + push copy:** Live `overlay-group.json` ?� b? ch?nh ? cart/success overlay `disabled: true`, m� `MYPRINTSY15`, ?nh m?i. Pull v? sync local; ch? push code copy l�n live (kh�ng ghi ?� overlay-group).

## 2026-05-31 ? Gift box tier pricing trong cart

**Y�u c?u:** Gi� cart theo b?ng tier; t? box th? 5 tr? ?i +$3/box (kh�ng flat $17.99, kh�ng gi?i h?n 20).

**B?ng gi�:**

- 1?$4.99, 2?$8.99, 3?$11.99, 4?$14.99
- 5+? $14.99 + (qty?4)�$3 (vd: 6 box = $20.99, 10 box = $32.99)

**Files:** `addon-gift-box-pricing.js`, `cart-gift-box.js`, `addon-gift-box.liquid`, `main-cart-items.liquid`, `cart-drawer.liquid`

**L?u � checkout:** Qty ?5 c� gi� ??ng ? c?n Shopify Functions/discount ho?c variant ?? tier ?? kh?p thanh to�n.

**Push live `#183186358588`:** `addon-gift-box-pricing.js`, `cart-gift-box.js`, `addon-gift-box.liquid`, `main-cart-items.liquid`, `cart-drawer.liquid`.

**Revert image fix:** B? `_gift_box_image_url` property + hi?n th? custom URL; cart/drawer d�ng l?i `item.image` m?c ??nh Shopify. Gi? nguy�n logic gi� tier.

**Fix duplicate gift box:** `findGiftBoxLines()` x�a t?t c? d�ng tr�ng (property + legacy variant); queue `upsertGiftBoxLine`; cart auto-dedupe on load.

**Revert optimistic cart qty:** B? c?p nh?t gi� t?c th� ? g�y m?t item. `upsertGiftBoxLine` ??i sang add-tr??c/x�a-sau + `cart/change` khi c�ng variant.

**Revert full gift box cart integration:** Pull dev `#185931399484` ? `addon-gift-box.liquid`, `main-cart-items.liquid`, `cart-drawer.liquid` v? b?n PDP-only tier; x�a `cart-gift-box.js`, `addon-gift-box-pricing.js`; push live.

**PDP gift box qty lag:** B? `variant:change` + document listener reset qty; lock khi user b?m +/-; init guard ch?ng double-bind; gi� sync ngay theo Pack.

## 2026-06-13 ? Fix lag cart reminder popup (performance)

**Tri?u ch?ng:** Trang gi?t/lag, ??c bi?t mobile khi c� gi? h�ng + popup cart reminder.

**Nguy�n nh�n:**
- Debug instrumentation g?i `fetch` t?i `127.0.0.1:7487` tr�n **m?i** s? ki?n Klaviyo (production v?n ch?y)
- Klaviyo bootstrap/prerender poll qu� d�y (500ms � 16?24 l?n) + m?i l?n `dispatchEvent(scroll)` + `dispatchEvent(resize)` to�n trang
- Listener `scroll` reset inactivity timer li�n t?c khi user cu?n trang
- Patch HTTPS Klaviyo tr�ng l?p trong `overlay-cart-reminder-popup.js` (?� c� `klaviyo-https-patch.js`)

**Fix:**
- `debugLog` ch? ch?y khi `sessionStorage.setItem('cart-reminder-debug','1')`
- Debounce `triggerKlaviyoScan` (350ms); b? fake `scroll`; `resize` nudge 1 l?n duy nh?t
- Gi?m poll: bootstrap 8 l?n, prerender 10�900ms
- B? `scroll` kh?i inactivity listeners
- X�a duplicate HTTPS patch kh?i cart reminder JS

**Files:** `overlay-cart-reminder-popup.js`, `klaviyo-https-patch.js`

## 2026-06-13 ? ??c code gift box PDP + cart (ch? bug report user)

**Y�u c?u:** User mu?n fix bug trang product + cart (ch? y?u cart: +/- quantity, load gi�). **Ch?a implement** ? ch? user g?i chi ti?t bug.

**Trang Product (PDP):**
- File: `snippets/addon-gift-box.liquid` (render t? `main-product.liquid` ? block `variant_picker`)
- +/- ri�ng: `.addon-gift-box__qty-minus/plus` ? `setGiftUnitQuantity()` ? c?p nh?t gi� hi?n th? `getGiftBoxTierPrice()`
- B?ng tier hi?n th?: 1?4.99, 2?8.99, 3?11.99, 4?14.99; code hi?n t?i `q>=5` return **flat 17.99** (journal ghi ?�ng l� 14.99 + (qty?4)�3)
- Add to cart: subscribe `PUB_SUB_EVENTS.cartUpdate` source `product-form` ? `addGiftBoxToCart(baseQty � giftUnitQty)` qua `/cart/add.js` ho?c `/cart/update.js`
- Property line: `_addon_gift_box: true`, `_addon_for_product_id`
- Sync qty theo Pack variant (tr? khi user ?� lock b?ng +/-)
- **Kh�ng** publish `cartUpdate` sau khi th�m gift box (tr�nh loop)

**Trang Cart (`/cart`):**
- Quantity: Dawn chu?n ? `QuantityInput` (`global.js`) ? `change` (debounce 300ms) ? `cart.js` `updateQuantity()` ? `/cart/change.js` + re-render sections
- Gift box line: nh?n di?n `_addon_gift_box` trong `main-cart-items.liquid` + `cart-drawer.liquid` ? **ch? d�ng ?? sort** (addon rows xu?ng cu?i)
- **Kh�ng c�n** `cart-gift-box.js`, `addon-gift-box-pricing.js` (?� revert 2026-05-31) ? cart **kh�ng** c� logic tier price / sync gift qty khi ??i qty s?n ph?m ch�nh
- Gi� cart hi?n th?: `item.original_price` / `item.final_line_price` t? Shopify variant (kh�ng override tier)

**Gap c� th? l� bug (ch? user x�c nh?n):**
1. Cart +/- gift box: qty ??i nh?ng gi� line kh�ng theo b?ng tier
2. Cart +/- s?n ph?m ch�nh: gift box qty kh�ng t? sync
3. PDP tier 5+ sai c�ng th?c so v?i spec
4. Checkout: gi� tier ch? UI, Shopify charge theo variant price

## 2026-06-13 ? Fix cart gift box +/- nh?y qty + gi� ch?m

**Tri?u ch?ng:** Tr�n `/cart`, b?m +/- gift box (vd qty 7 ? $23.99) b? nh?y linh tinh, gi� load ch?m/sai.

**Nguy�n nh�n:**
- Race condition `cart.js`: nhi?u request `/cart/change.js` song song ? response c? ghi ?� qty m?i
- Kh�ng c�n tier pricing JS sau revert ? gi� Shopify variant ? b?ng tier

**Fix:**
- `cart.js`: request sequence per line ? b? qua response stale
- `addon-gift-box-pricing.js` + `cart-gift-box.js`: gi� tier c?p nh?t ngay khi +/-, sau cartUpdate, ?i?u ch?nh estimated total
- Liquid: `data-addon-gift-box`, `data-gift-box-tier-price`, load scripts
- PDP: tier 5+ ? `14.99 + (qty?4)�3`

## 2026-06-13 ? Thu h?p scope fix gift box cart (kh�ng ?nh h??ng t�nh n?ng kh�c)

**?i?u ch?nh sau feedback user:**
- `cart.js`: race guard **ch?** line c� `data-addon-gift-box="true"`; line s?n ph?m th??ng gi? nguy�n Dawn
- `cart-gift-box.js`: b? s?a estimated total (tr�nh conflict Hulk/discount); ch? patch `[data-gift-box-tier-price]`
- Script gift box **ch? load** khi cart c� item `_addon_gift_box`
- Revert s?a PDP `addon-gift-box.liquid` v� footer total ? ngo�i scope bug cart

## 2026-06-13 ? Fix TOTAL s?n ph?m ch�nh kh�ng nh�n quantity (cart)

**Tri?u ch?ng:** S?n ph?m ch�nh qty 8 nh?ng c?t TOTAL v?n $112.95 (b?ng ??n gi�).

**Nguy�n nh�n:** Hulk Product Options ghi ?� `[data-hulkapps-line-price]` sau khi Dawn re-render cart.

**Fix:** `cart.js` ? `syncCartLinePrices()` t? `parsedState.items` sau update qty; skip gift box line (tier ri�ng).

**L?u � UX:** Gift box qty 8 ? $26.99 l� **tier t?ng 8 h?p** (?�ng), kh�ng ph?i 26.99�8.

## 2026-06-13 ? Fix 429 Too Many Requests (cart +/-)

**Console:** `POST /cart/change` + `GET /cart.js?customily_upsell` ? 429.

**Nguy�n nh�n:** B?m +/- nhanh ? nhi?u `/cart/change` song song; Customily fetch th�m `/cart.js` sau m?i cart update.

**Fix `cart.js`:**
- Gom quantity theo line: ch? 1 request in-flight, g?i qty m?i nh?t khi xong
- B? qua response stale
- G?p 429 ? retry 1 l?n sau 800ms
- Sync line price (Hulk) gi? nguy�n, b? triple timeout

## 2026-06-13 ? Gi� c?p nh?t ngay (optimistic) + push dev + live

**Y�u c?u:** TOTAL c?p nh?t ngay theo c�ng th?c khi +/-, kh�ng ch? loading/spinner.

**Fix `cart.js`:**
- `applyOptimisticLineTotal()`: gift box ? tier; s?n ph?m th??ng ? unit�qty t? `[data-hulkapps-ci-price]`
- G?i ngay khi click +/- (rAF) v� trong `updateQuantity`
- B? disable overlay + spinner khi ??i qty
- API `/cart/change` ch?y ng?m (debounce 300ms, coalesce, retry 429)

**Push (7 files):**
- Dev `#185931399484` ? `sqj5k3-d1.myshopify.com` ?
- Live `#183186358588` ? `myprintsy-3.myshopify.com` (`--allow-live`) ?

**Files:** `cart.js`, `cart-gift-box.js`, `addon-gift-box-pricing.js`, `main-cart-items.liquid`, `cart-drawer.liquid`, `overlay-cart-reminder-popup.js`, `klaviyo-https-patch.js`

**Test:** hard refresh `myprintsy.com/cart` ho?c preview dev; verify `cart.js` c� `applyOptimisticLineTotal`.

## 2026-06-13 ? Fix Pack ? gift box qty + cart notification popup (PDP)

**Tri?u ch?ng live:**
- Ch?n Pack 2 nh?ng gift box qty v?n 1
- Add to cart kh�ng hi?n cart notification popup

**Nguy�n nh�n:** Mismatch version ? `addon-gift-box.liquid` g?i `GiftBoxPricing.getDisplayQty()` / `upsertGiftBoxLine()` nh?ng `addon-gift-box-pricing.js` ?� push ch? c� API t?i gi?n ? JS throw trong `cartUpdate` subscriber **tr??c** `renderContents()` ? popup kh�ng m?.

**Fix:**
- `addon-gift-box.liquid`: logic self-contained + fallback pricing; try/catch cartUpdate; sync pack qua radio/dropdown/pack-size-picker/Hulk fields (#N) + MutationObserver
- `addon-gift-box-pricing.js`: alias `getDisplayQty`, `getTierTotalCents`, `formatMoney`

**Push:** dev `#185931399484` + live `#183186358588` ?

## 2026-06-13 ? Fix cart qty error b�o oan ("only add N...")

**Tri?u ch?ng:** ??i qty sang s? kh�c v?n hi?n l?i ??; s? trong message tr�ng qty ?ang hi?n th?.

**Nguy�n nh�n:** `cart.js` so s�nh `updatedValue` v?i input DOM **c?** (stale) sau re-render ? input c� th? ?� ??i trong l�c ch? API (optimistic/coalesce) ? b�o oan.

**Fix:** Ch? show error khi `requestedQuantity > updatedValue` (request hi?n t?i b? server cap). Update th�nh c�ng ? clear message.

**Scope:** Ch? `assets/cart.js` ? kh�ng ??ng gift box, Hulk, cart drawer.

**Push:** dev `#185931399484` + live `#183186358588` ?

## 2026-06-13 ? Cart error "You can only add 10..." hi?n li�n t?c

**Tri?u ch?ng:** Qty = 10, b?m + ho?c ??i qty ? message ?? "You can only add 10 of this item to your cart" k?t l?i.

**Nguy�n nh�n:**
1. **Shopify limit th?t:** variant gift box (ho?c SP ch�nh) ch? c�n / max **10** t?n kho (`quantity_rule.max` ho?c inventory).
2. **UX theme:** `cart.js` so s�nh input DOM c? (stale) sau re-render ? d? hi?n/clear error sai khi c� optimistic qty.

**Fix `cart.js`:** Ch? show error khi `requestedQuantity > updatedValue` t? API; update th�nh c�ng th� clear message.

**Admin (n?u c?n >10 box):** Products ? Gift Box variant ? t?ng **Inventory** ho?c b?t **Continue selling when out of stock**.

## 2026-06-13 ? Fix cart qty nh?y l�i (56 ? 6)

**Tri?u ch?ng:** B?m + t?ng qty, th?nh tho?ng nh?y v? s? th?p.

**Nguy�n nh�n:** Response `/cart/change` c? v?n re-render cart HTML; `onCartUpdate` t? app kh�c refresh cart trong l�c +/-; API ch? g?i sau debounce 300ms.

**Fix `cart.js`:** Skip DOM replace n?u pending ? response qty; block `onCartUpdate` khi pending/in-flight; g?i `updateQuantity` ngay khi b?m +/- (v?n coalesce).

**Push:** dev + live ?

## 2026-06-13 ? Cart vs checkout qty/gi� l?ch (swap 3?2)

**Tri?u ch?ng:** Cart main=3 gift=2; checkout gift=3 main=2. Gi� gift box cart tier $8.99, checkout $4.99�qty.

**Nguy�n nh�n qty swap (bug theme):** Hai d�ng cart g?i `/cart/change` **song song** ? response c? re-render **c?** cart HTML ? qty hai d�ng b? ??o.

**Fix `cart.js`:** Serialize cart updates ? ch? 1 request in-flight to�n cart; queue pending theo line.

**Tinh ch?nh an to�n (c�ng ng�y):**
- Rebuild `appliedQuantityByLine` t? `parsedState.items` sau m?i response OK (tr�nh line index stale sau remove)
- Skip API tr�ng khi pending qty ?� kh?p server v� kh�ng c�n request in-flight (click +/- + debounce change)

**Push serialize + tinh ch?nh:** dev `#185931399484` ? + live `#183186358588` ?

**Gi� checkout kh�c cart (gi?i h?n hi?n t?i):**
- Checkout = **variant Shopify** ($4.99 � qty) ? ch?a c� Shopify Function/discount sync tier
- Estimated total footer = Shopify `cart.total_price` (variant), kh�ng ph?i tier

**C?n checkout tier ?�ng:** Shopify Function / discount app (scope ri�ng, ch?a l�m).

## 2026-06-13 ? Checkout qty ??o (cart 3+4, checkout 4+3)

**Tri?u ch?ng:** Cart UI ?�ng (main=3, gift=4) nh?ng checkout ??o (main=4, gift=3).

**Nguy�n nh�n th?t:** Gift box sort xu?ng cu?i DOM (`_normal_rows` + `_addon_rows`) nh?ng input v?n `name="updates[]"`. Khi b?m Checkout, form POST map **theo th? t? DOM** ? line 1 nh?n qty c?a main, line 2 nh?n qty gift (ho?c ng??c n?u gift l� line 1 tr�n server).

**Fix (ch? liquid):** ??i `updates[]` ? `updates[{{ item.key }}]` (line item key, kh�ng ph?i line index ? `updates[1]` b? Shopify hi?u l� variant id ? "Cannot find variant").

**Push:** dev `#185931399484` ? + live `#183186358588` ?

## 2026-06-13 ? Shopify Function: gift box tier checkout

**M?c ti�u:** Checkout gift box kh?p tier cart ($14.99 cho 4 box, kh�ng c�n $19.96).

**App m?i:** `shopify-gift-box-discount/` (t�ch kh?i theme)
- Function `cart.lines.discounts.generate.run`
- Logic mirror `assets/addon-gift-box-pricing.js` trong `src/gift-box-tier-pricing.js`
- Ch? discount d�ng `_addon_gift_box: true` (fallback title "Gift Box Service")
- Tests: 4 passed ? | Build WASM ?

**Deploy (c?n Partner app + Admin):**
1. `shopify app config link` + `shopify app deploy`
2. Admin ? Discounts ? Automatic ? ch?n app function
3. B?t **Product discount** class

**Kh�ng ??ng theme.** Rollback: t?t automatic discount trong Admin.

---

## REVERT GUIDE ? to�n b? thay ??i session cart/checkout (2026-06-13)

### Tr?ng th�i push

| Th�nh ph?n | Dev `#185931399484` | Live `#183186358588` | Ghi ch� |
|------------|---------------------|----------------------|---------|
| `assets/cart.js` | ? ?� push | ? ?� push | Serialize qty, optimistic price |
| `sections/main-cart-items.liquid` | ? ?� push | ? ?� push | `updates[item.key]` checkout fix |
| `snippets/cart-drawer.liquid` | ? ?� push | ? ?� push | idem |
| `shopify-gift-box-discount/` | ? ch?a deploy | ? ch?a deploy | **Local only** ? c?n `shopify app deploy` ri�ng |

**Theme: push xong.** **Function: ch?a l�n store** ? gi� checkout tier v?n $4.99�qty cho ??n khi deploy + b?t discount Admin.

---

### File ?� th�m / s?a (?? revert)

#### A. Theme ? ?� live (revert = push l?i file c?)

1. **`assets/cart.js`**
   - Serialize `/cart/change` (1 request in-flight)
   - `pendingQuantityByLine`, `appliedQuantityByLine`, `cartChangeInFlight`
   - Optimistic gi� gift tier + Hulk
   - Error qty ch? khi `requested > server max`
   - **Revert:** kh�i ph?c Dawn g?c ho?c backup `cart.js` tr??c session; `shopify theme push --only assets/cart.js`

2. **`sections/main-cart-items.liquid`**
   - `name="updates[{{ item.key }}]"` (fix checkout qty + Cannot find variant)
   - `data-line-key` tr�n m?i `<tr>`
   - **Revert c?:** `name="updates[]"` (Dawn g?c ? l?u � qty swap n?u gift sort cu?i)

3. **`snippets/cart-drawer.liquid`**
   - Gi?ng (2) cho drawer checkout form
   - **Revert:** idem main-cart-items

#### B. Shopify Function ? M?I, ch?a deploy (revert = x�a folder / kh�ng deploy)

```
shopify-gift-box-discount/
??? shopify.app.toml
??? package.json
??? README.md
??? .gitignore
??? extensions/gift-box-tier-discount/
    ??? shopify.extension.toml
    ??? package.json
    ??? schema.graphql
    ??? vite.config.js
    ??? locales/en.default.json
    ??? src/
        ??? index.js
        ??? gift-box-tier-pricing.js          ? mirror tier theme
        ??? cart_lines_discounts_generate_run.js
        ??? cart_lines_discounts_generate_run.graphql
        ??? cart_lines_discounts_generate_run.test.js
```

- **Revert tr??c deploy:** x�a folder `shopify-gift-box-discount/` ? **zero impact** store
- **Revert sau deploy:** Admin ? Discounts ? **Deactivate/Delete** automatic discount; optional `shopify app deploy` g? extension

#### C. Journal

- **`JOURNAL.md`** ? ch? ghi ch�p, kh�ng ?nh h??ng store

---

### Impact review

| Ph?n | Impact | M?c |
|------|--------|-----|
| Cart +/- qty | Serialize, �t nh?y l�i/429 | ? C?i thi?n |
| Checkout qty main?gift | Fix `updates[item.key]` | ? C?i thi?n |
| Gift box gi� cart UI | Tier JS (c?, gi? nguy�n) | Kh�ng ??i logic m?i |
| Checkout gi� gift tier | Ch?a c� (Function ch?a deploy) | ? Ch?a |
| Main product / Hulk / PDP | Kh�ng ??ng | ? |
| Cart drawer | C�ng liquid fix | Th?p |
| Estimated total footer | V?n Shopify variant total | Kh�ng ??i |
| Function (khi b?t) | Ch? gift box line discount | Trung b�nh ? test stacking discount |

---

### L?nh revert nhanh (theme live)

```powershell
# Ch? cart.js (n?u c� backup Dawn)
shopify theme push --theme 183186358588 --only assets/cart.js --store myprintsy-3.myshopify.com --allow-live

# Checkout fix liquid ? revert v? updates[]
# (s?a file local tr??c, r?i push)
shopify theme push --theme 183186358588 --only sections/main-cart-items.liquid snippets/cart-drawer.liquid --store myprintsy-3.myshopify.com --allow-live
```

---

## 2026-06-13 ? Gift box tier: variant bundle (non-Plus checkout)

**V?n ??:** Custom app Function b? ch?n tr�n store non-Plus ? checkout v?n $4.99 � qty.

**Gi?i ph�p (C�ch 1):** Add/swap **variant bundle** theo tier ? cart line `quantity: 1`, property `_gift_box_units: N`, UI v?n hi?n qty + gi� tier.

**Map variant:** `vertical-gift-box-1` ? `vertical-gift-box-5` (+ fallback gi� tr�n `add-on-gift-box-service`).

**Files:** `assets/addon-gift-box-pricing.js`, `snippets/gift-box-tier-variant-map.liquid`, `snippets/addon-gift-box.liquid`, `assets/cart.js`, `sections/main-cart-items.liquid`, `snippets/cart-drawer.liquid`.

**Admin c?n:** Product `vertical-gift-box-2` gi� **$8.99**, `vertical-gift-box-5` gi� **$17.99**, v.v. Qty >5: d�ng variant box 5 (m?c k?).

**Push live `#183186358588`:** variant bundle tier checkout (2026-06-13).

### Fix cart qty hi?n th? 2 thay v� 1 (bundle line)

**V?n ??:** Ch?n gift box qty 2 tr�n PDP ? cart hi?n s? l??ng **2** (?ang d�ng `_gift_box_units` l�m value input).

**Fix:** Input cart = `item.quantity` (**1** bundle). Tier units l?u `data-gift-box-units` + property `_gift_box_units`. `cart.js` +/- ??i tier (swap variant), reset input v? 1; gi� tier t? `data-gift-box-units`.

**Files:** `sections/main-cart-items.liquid`, `snippets/cart-drawer.liquid`, `assets/cart.js`, `assets/cart-gift-box.js`.

### Gift box qty > 5: t�ch bundle $17.99 + ph?n d?

**Quy t?c:**
- Qty **1?5**: 1 d�ng cart, qty **1**, variant tier t??ng ?ng ($4.99?$17.99)
- Qty **> 5**: `floor(qty/5)` ? d�ng **vertical-gift-box-5** cart qty = k?t qu? ($17.99/bundle); `qty % 5` ? n?u > 0 th�m 1 d�ng tier 1?4 qty **1**

**V� d?:** qty 7 ? 1� tier-5 (cart qty 1) + 1� tier-2 ($8.99); qty 10 ? tier-5 cart qty **2**; qty 11 ? tier-5 qty 2 + tier-1 qty 1.

**Files:** `assets/addon-gift-box-pricing.js` (`decomposeGiftBoxUnits`), `assets/cart.js`, `assets/cart-gift-box.js`, liquid (`data-gift-box-bulk`, property `_gift_box_bulk`).

**Push live `#183186358588`:** gift box qty split + cart qty display fix (2026-06-13).

### Fix ?nh gift box trong cart (tier variant image sai)

**V?n ??:** D�ng `_addon_gift_box` d�ng ?nh product tier (`vertical-gift-box-3/5`) ? Admin upload ?nh l?i (overlay gi�, ?nh s?n ph?m kh�c).

**Fix (ch? UI cart):** Snippet `gift-box-cart-image-source.liquid` + `gift-box-cart-image.liquid` ? gift box lines d�ng ?nh `add-on-gift-box-service` (fallback `vertical-gift-box-1`). Kh�ng ??ng JS/pricing.

**Revert:** `.revert-backup/gift-box-cart-image-2026-06-13/` + `scripts/revert-gift-box-cart-image.ps1`

**Push live `#183186358588`:** gift box cart image fix (2026-06-13).

### Cart reminder: return visit 15s + pending flag

**Flow:** Add cart ? set `localStorage cart-reminder-popup-pending`. User tho�t tr??c khi popup hi?n ? l?n sau v�o site (pending) ? delay **15s** (`return_delay`) ? show. Sau khi show/?�ng ? `markShown()` frequency cap **12h**; clear pending.

**Kh�ng c�n** auto `page-load` m?i trang khi c� gi? ? ch? schedule delay khi pending ho?c `cart-update` c�ng session.

**Files:** `overlay-cart-reminder-popup.js`, `overlay-group.json` (`return_delay: 15`).

**Push live `#183186358588`:** cart reminder ? exit intent `<20px`, pending return 15s, frequency 12h (2026-06-13).

### Cart reminder: fast scroll xu?ng (2026-06-13)
- Trang kh�ng ph?i `/cart` / `/checkout`: scroll **xu?ng nhanh** ?**250px** trong **300ms** ? popup
- Mobile + desktop; cooldown 8s; c�c trigger kh�c gi? nguy�n
- File: `overlay-cart-reminder-popup.js`
- **Push live `#183186358588`** (myprintsy-3) ?

### Cart reminder mobile: fast scroll trigger (Option A) ? **?� g?** (2026-06-13)
- X�a `bindMobileFastScrollListenersOnce`, `handleFastScroll`, source `fast-scroll` trong `overlay-cart-reminder-popup.js`

### Cart reminder: inactivity + scroll depth (2026-06-13)
- **B?:** inactive 30/60s show popup ngay (kh�ng c?n scroll)
- **M?i:** m?i trang (tr? `/cart`, `/checkout`) ? **scroll ?70%** trang **+** inactive **20s** ? show popup
- `SCROLL_DEPTH_THRESHOLD = 0.7`, `inactivity_time: 20` trong `overlay-group.json`
- Scroll c?ng reset timer inactivity
- Files: `overlay-cart-reminder-popup.js`, `overlay-group.json`, section schema desktop + mobile

### Cart reminder: b? pending + return_delay 15s (2026-06-13)
- G? `localStorage pending`, trigger `return-visit`, `cart-update` schedule 15s
- `cartUpdate` event ch? c�n sync cart count + arm inactivity timer
- Popup ch? c�n: inactivity (20s + scroll 70%), mobile bottom tap, exit intent desktop
- **Push live `#183186358588`** (myprintsy-3) ?

### Cart reminder: 2 timer song song (2026-06-13)
- **Inactivity (gi?):** idle **20s** + scroll **?70%** ? popup; reset khi scroll/click/touch
- **Browse auto-show (m?i):** c� SP trong gi? ? **60s** k? c? ?ang active ? popup
- Reset browse timer: add cart, v�o `/cart` / `/checkout`
- Settings: `inactivity_time: 20`, `browse_auto_show_time: 60`
- Gi?: bottom tap mobile, exit intent desktop
- Files: `overlay-cart-reminder-popup.js`, `overlay-group.json`, section liquid desktop + mobile
- **Push live `#183186358588`** (myprintsy-3) ? ? dual timer + bottom tap h??ng 2

### Cart reminder: t�ch delay add cart 120s / session m?i 60s (2026-06-13)
- **Add to cart** (c�ng tab): `browse_auto_show_after_cart_time: 60`
- **Tab/session m?i** (gi? c�n t? cookie): `browse_auto_show_time: 60`
- Flag `sessionStorage` sau add cart; t?t tab = m?t flag ? 60s
- V�o `/cart` / `/checkout` ? clear flag, reset browse 60s
- Files: `overlay-cart-reminder-popup.js`, `overlay-group.json`, section liquid

### Cart reminder: tab m?i b? frequency cap (2026-06-13)
- `once_per_session: true` ? b? qua frequency cap 12h (`localStorage`)
- **Push live `#183186358588`** (myprintsy-3) ?

### Cart reminder: browse auto-show 60s (2026-06-13) ? superseded by dual timer above
- **Mobile only:** `touchstart` trong v�ng ?�y **80px** ? show popup (delay 0), cooldown 8s
- H??ng 2: trong v�ng 80px v?n trigger khi ch?m gift box, sticky bar, button? (ch? skip `.cart-reminder-popup`, `cart-drawer`)
- G? `isBottomTapOnInteractiveTarget()` ? kh�ng c�n exclude `a`, `button`, label, ATC?
- Source: `mobile-bottom-tap` ? desktop kh�ng ??i
- File: `overlay-cart-reminder-popup.js`
- **Push live `#183186358588`** (myprintsy-3) ? ? bottom tap h??ng 2
- Dev `#185931399484` kh�ng c�n tr�n store (CLI: theme not found); `sqj5k3-d1` list theme = `myprintsy-3` ? live push ?? cho c? hai domain

### Cart reminder ? push inactivity + bottom tap (2026-06-13)
- **Push live `#183186358588`** (myprintsy-3) ? ? inactivity+scroll 70%, bottom tap, b? fast scroll

### Cart reminder ? th? t? item (2026-06-13)
- S?n ph?m ch�nh l�n tr�n, Add-On Gift Box xu?ng d??i (mobile + desktop popup)
- Ch? scope trong cart reminder popup (`cart-reminder-popup-items`, `refreshCartItems`); kh�ng ??ng cart drawer / cart page
- Files: `cart-reminder-popup-items.liquid`, `cart-reminder-popup-item-row.liquid`, `overlay-cart-reminder-popup.js`
- **Push live `#183186358588`** (myprintsy-3) ?

## 2026-07-08 ? Success opt-in: Checkout now auto-apply discount
- CTA ? `/discount/{promo}?redirect=/checkout` (Shopify discount URL), promo t? heading fields (MP15)
- Desktop + mobile d�ng chung `overlay-success-opt-in.js`; `data-promo-code` tr�n c? 2 section liquid
- **Push live `#183186358588`:** `overlay-success-opt-in.js`, 2 section liquid, `overlay-group.json` ?

## 2026-07-08 ? Success opt-in: Checkout now ? /checkout
- Popup MP15: `button_link` `/cart` ? `/checkout` (desktop + mobile trong `overlay-group.json`)
- Default fallback trong `overlay-success-opt-in.js` + liquid sections

## 2026-07-08 ? Pull live v? local (l?n 2)
- User b?t + Save Cart reminder desktop trong Theme Editor
- `shopify theme pull --force` `#183186358588`

## 2026-07-08 ? Pull live v? local
- `shopify theme pull --force` theme live `#183186358588` (Shopify Dawm Copy - Test)

- Form ID `Yy9PSK` ? `<div class="klaviyo-form-Yy9PSK"></div>`
- `sections/newsletter.liquid` (homepage UNLOCK 10% OFF) + `sections/footer.liquid` (khi b?t newsletter)
- Snippet: `newsletter-klaviyo-embed.liquid`
- `templates/index.json` ? `klaviyo_form_id: Yy9PSK`
- **2026-06-13:** Ch?a push tr??c ?� ? `theme pull --force` live `#183186358588` ? re-apply ? `theme push --allow-live` 5 files ?
- **2026-06-13 fix Submitted=0:** Newsletter ch? c� bare `<div class="klaviyo-form-Yy9PSK">` ? thi?u `refreshForms` + poll nh? cart reminder. Homepage full-page cache v?n serve form Shopify c? (`NewsletterForm`) ? submit kh�ng v�o Klaviyo. Th�m `assets/newsletter-klaviyo-embed.js` (`_klOnsite.refreshForms`, IntersectionObserver cu?i trang).

- `shopify theme pull --theme 183186358588 --store myprintsy-3.myshopify.com --force`
- Local = live m?i nh?t

## 2026-06-13 ? Pull live v? local
- `shopify theme pull --theme 183186358588 --store myprintsy-3.myshopify.com --force`
- Sync local = live tr??c khi push ti?p (tr�nh conflict)

### REVERT variant bundle (live)

**Backup tr??c push:** `.revert-backup/gift-box-variant-bundle-2026-06-13/`

**1 l?nh revert:**
```powershell
cd "d:\Shoppify\theme_export__www-myprintsy-com-shopify-dawm-copy-test__29MAY2026-1041am"
.\scripts\revert-gift-box-variant-bundle.ps1
```

**Ho?c push tay file backup:**
```powershell
shopify theme push --theme 183186358588 --store myprintsy-3.myshopify.com --allow-live `
  --only assets/addon-gift-box-pricing.js `
  --only assets/cart.js `
  --only snippets/addon-gift-box.liquid `
  --only sections/main-cart-items.liquid `
  --only snippets/cart-drawer.liquid
```
(copy t? `.revert-backup/gift-box-variant-bundle-2026-06-13/` v�o root tr??c)

**Sau revert:** checkout gift box = qty � $4.99 (c?). Snippet `gift-box-tier-variant-map.liquid` orphan ? kh�ng ?nh h??ng.

| File | Revert |
|------|--------|
| `assets/addon-gift-box-pricing.js` | ? backup |
| `assets/cart.js` | ? backup |
| `snippets/addon-gift-box.liquid` | ? backup |
| `sections/main-cart-items.liquid` | ? backup |
| `snippets/cart-drawer.liquid` | ? backup |
| `snippets/gift-box-tier-variant-map.liquid` | X�a ho?c b? qua (m?i, kh�ng render sau revert) |

## 2026-06-27 ? Image marquee: t�ch config kh?i Theme Editor

**Hi?n tr?ng:** Section `image-marquee` ? 10 image blocks trong `templates/index.json` (?nh + caption @name + link + row top/bottom). Data n?m trong theme JSON ? ai s?a theme d? ??ng nh?m.

**H??ng ?? xu?t (?u ti�n Metaobjects ? store ?� d�ng `metaobjects.upsell_box`):**
1. Metaobject `marquee_item` (image, caption, link, row) ? s?a ? Admin > Content, kh�ng qua Theme Editor
2. Shop metafield JSON ? 1 blob, ??n gi?n h?n
3. File `assets/image-marquee-config.json` ? t�ch kh?i editor nh?ng v?n c?n push theme ?? ??i
4. Collection mode (?� c� s?n) ? m?t caption/row t�y ch?nh

Ch?a implement ? ch? user ch?n h??ng.

## 2026-07-09 ? Cart reminder: b? dismiss_label tr�ng MAYBE LATER

**Y�u c?u:** X�a d�ng "I'll miss the deal this time, remind me later." ? tr�ng ch?c n?ng v?i n�t **MAYBE LATER** (Klaviyo embed), c? hai ??u ?�ng popup.

**Thay ??i:** `sections/overlay-group.json` ? `dismiss_label: ""` cho `overlay_cart_reminder_popup` (desktop) v� `overlay_cart_reminder_popup_mobile`. Liquid ?� c� `if dismiss_label != blank` n�n kh�ng render n�t theme. Klaviyo MAYBE LATER v?n ho?t ??ng qua `bindKlaviyoEmbedDismiss()` trong JS.

**Kh�ng ??i:** Success opt-in popup v?n gi? `dismiss_label` ri�ng.

**Push live:** `shopify theme push --theme 183186358588 --only sections/overlay-group.json --allow-live` ?

## 2026-07-09 ? Cart reminder: n�t X ?�ng n?i b?t h?n

**Y�u c?u:** D?u X g�c tr�n kh� nh�n (tr?ng tr�n ?nh).

**Thay ??i:** `overlay-cart-reminder-popup.css` + `overlay-cart-reminder-popup-mobile.css` ? n�t close d?ng v�ng tr�n n?n ?en m?, icon tr?ng, vi?n tr?ng, shadow; hover ??m h?n + scale nh?.

**Push live:** `shopify theme push --theme 183186358588 --only assets/overlay-cart-reminder-popup.css assets/overlay-cart-reminder-popup-mobile.css --allow-live` ?

## 2026-07-11 ? Pull live v? local

- `shopify theme pull --theme 183186358588 --store myprintsy-3.myshopify.com --force`
- Local = live m?i nh?t (theme **Shopify Dawm Copy - Test**)

## 2026-07-11 ? Cart reminder: auto-show sau 60s tr�n `/cart`

- `overlay-cart-reminder-popup.js`: timer c? ??nh 60s khi `cart.item_count > 0` + ?ang ? `/cart`
- Kh�ng reset khi user active/inactive (kh�c inactivity timer)
- `tryOpen(..., { allowOnCart: true })` ? ch? m? tr�n cart, checkout v?n ch?n
- Liquid desktop + mobile: `data-cart-page-auto-show-time="60"`

## 2026-07-12 ? Cart reminder `/cart`: 60s ? 120s

- `data-cart-page-auto-show-time="120"` (desktop + mobile liquid)
- JS fallback `?? 120`
- Push DEV `#186878558524` + LIVE `#183186358588`

## 2026-07-12 ? Mobile sticky CHECKOUT full-width + expiry countdown

- Sticky button: b? `max-width: 36rem` (Dawn), `width/max-width` force full khung
- `cart-expiry-banner.js`: query timer m?i tick + re-start sau cart AJAX (tr�nh stuck 10:00)

## 2026-07-12 ? Checkout #1773b0 + ?n Inbox chat tr�n /cart mobile

- N�t CHECK OUT: `#1773b0` (hover `#135f92`)
- ?n Shopify Inbox (`#shopify-chat`, `#ShopifyChat`, dummy iframe) khi c� sticky checkout, mobile only
- File: `component-cart-macorner.css`

## 2026-07-12 ? Checkout button bo g�c ki?u Pay now

- `border-radius: 1.4rem` (b? 0.25rem vu�ng)

## 2026-07-13 ? Cart expiry: refresh ? reset 10:00

- B? `sessionStorage` persistence
- Full page load: lu�n `reset: true` v? ?? ph�t (default 10:00)
- Cart AJAX qty update: gi? countdown ?ang ch?y (kh�ng nh?y l?i 10:00)
- File: `assets/cart-expiry-banner.js`

## 2026-07-13 ? Cart mobile: k�o Subtotal l�n

- B? border/padding/margin d??i item cu?i + `cart__items` border-bottom
- Subtotal s�t list items h?n (kh�ng c�n k? + kho?ng tr?ng th?a)
- File: `component-cart-macorner.css`

## 2026-07-11 ? Cart reminder: b?t bu?c ?� v�o `/cart` tr??c

- `localStorage` key `{storageKey}-visited-cart` ? set khi load `/cart` + gi? c� h�ng
- `canShow()` ch?n m?i trigger n?u ch?a t?ng v�o cart (add to cart drawer/modal kh�ng ??)
- Reset flag khi `cart.item_count === 0`
- Sau khi ?� v�o cart 1 l?n: add th�m SP m� kh�ng v�o l?i cart v?n ???c ph�p hi?n reminder

**Push live `#183186358588`:** `overlay-cart-reminder-popup.js` + 2 section liquid ?

## 2026-07-11 ? T?o theme DEV

- `shopify theme duplicate` t? live `#183186358588`
- **DEV theme:** `DEV - MyPrintsy Overlays` ? `#186878558524` (unpublished)
- Store: `myprintsy-3.myshopify.com`
- Preview: `https://myprintsy-3.myshopify.com/?preview_theme_id=186878558524`
- Dev server: `shopify theme dev --theme 186878558524 --store myprintsy-3.myshopify.com`
- **Live** `#183186358588` ? kh�ng ??i; ch? push live khi user confirm

## 2026-07-11 ? Cart page layout ki?u Macorner (DEV only)

- 2 c?t desktop: items tr�i + sidebar checkout ph?i (sticky)
- Banner countdown urgency (sessionStorage, default 10 ph�t)
- Sidebar: Subtotal cam, n�t CHECKOUT xanh, payment icons, Buyer Protection, Keep Shopping
- Section `cart-page-recommendations` ? related products d??i cart
- Files: `component-cart-macorner.css`, `cart-expiry-banner.js`, `cart-macorner-sidebar-extras.liquid`
- **Push dev `#186878558524` only** ? ch?a l�n live

---

## 2026-07-11 ? Gift box tier: ??i map variant sang add-on-gift-box-service-copy-*

**Y�u c?u:** Thay `vertical-gift-box-1..5` b?ng handles m?i; max tier **6**; qty > 6 t�ch bundle 6 + ph?n d?.

**Map tier ? product handle:**
| Box | Handle |
|-----|--------|
| 1 | `add-on-gift-box-service-copy-6` |
| 2 | `add-on-gift-box-service-copy-7` |
| 3 | `add-on-gift-box-service-copy-8` |
| 4 | `add-on-gift-box-service-6` |
| 5 | `add-on-gift-box-service-copy-9` |
| 6 | `add-on-gift-box-service-copy-10` |

**Decompose:** 7 = tier 6 + tier 1; 9 = tier 6 + tier 3; bulk line `isBulk` khi qty > 6.

**Gi� tier 6 (UI):** $19.99 (1999�) ? c?n kh?p gi� product `add-on-gift-box-service-copy-10` tr�n Admin.

**Files:** `assets/addon-gift-box-pricing.js`, `snippets/gift-box-tier-variant-map.liquid`, `snippets/addon-gift-box.liquid`, `snippets/gift-box-cart-image-source.liquid`, `snippets/gift-box-cart-image.liquid`.

**Ch?a push** ? ch? user confirm handles Admin (??c bi?t tier 4).

### Push selective ? logic l�n LIVE, GUI gi? DEV

**Live `#183186358588`** ? ch? push gift box logic:
- `assets/addon-gift-box-pricing.js`
- `snippets/gift-box-tier-variant-map.liquid`
- `snippets/addon-gift-box.liquid`
- `snippets/gift-box-cart-image-source.liquid`
- `snippets/gift-box-cart-image.liquid`

**Kh�ng push l�n live** (v?n ch? dev `#186878558524`):
- `assets/component-cart-macorner.css`
- `assets/cart-expiry-banner.js`
- `sections/main-cart-items.liquid` (l?n Macorner GUI)
- `sections/main-cart-footer.liquid`
- `sections/cart-page-recommendations.liquid`
- `snippets/cart-macorner-sidebar-extras.liquid`
- `templates/cart.json`

### Fix multi-product gift box ? kh�ng ghi ?�

**V?n ??:** `upsertGiftBoxInCart` g?i `removeAllGiftBoxItems` ? x�a h?t gift box c? khi add s?n ph?m m?i.

**Fix (isolated):**
- `removeGiftBoxItemsForParent` ? ch? x�a gift box c�ng parent key
- PDP truy?n **variant ID** (Pack 2 ? Pack 6 c�ng product) v�o `_addon_for_product_id`
- `adjustGiftBoxTotalUnits` scope theo parent, kh�ng c?ng to�n cart
- **Kh�ng ??i:** tier map, decompose, cart UI, `cart.js`

**Files:** `assets/addon-gift-box-pricing.js`, `snippets/addon-gift-box.liquid`

### Fix cart kh�ng hi?n gift box cho t?i khi F5

**Nguy�n nh�n:** Main product add xong ? cart render ngay; gift box add **async sau** (remove+add). V�o `/cart` s?m ? HTML c?, kh�ng c� gift box.

**Fix:**
- `gift-box-upsert-inflight` (sessionStorage) trong l�c upsert
- `notifyGiftBoxCartChange()` sau m?i upsert ? trigger `cartUpdate`
- `cart.js` `syncCartAfterPendingGiftBox()` ? refresh section khi mount + poll ~5s n?u upsert c�n ch?y

**Files th�m:** `assets/cart.js`

**Ch?a push live** (c�ng batch fix multi-product).

### Push LIVE `#183186358588` ? gift box multi-product + cart sync (2026-07-11)

- `assets/addon-gift-box-pricing.js`
- `snippets/addon-gift-box.liquid`
- `assets/cart.js`

### Push DEV `#186878558524` ? cart Macorner GUI (2026-07-11)

- ?nh SP to ~32% c?t + Preview link + payment icons curated
- Files: `component-cart-macorner.css`, `cart-expiry-banner.js`, `main-cart-items.liquid`, `main-cart-footer.liquid`, `cart-page-recommendations.liquid`, `cart-macorner-sidebar-extras.liquid`, `templates/cart.json`
- Preview: `https://myprintsy-3.myshopify.com/cart?preview_theme_id=186878558524`
- **Ch?a l�n LIVE**

---

## 2026-07-12 ? Gift box dual logic theo metafield `gift-boxs`

| Metafield product | Mode | Map | Max tier |
|---|---|---|---|
| ID `10424613732668` | `v2` | copy-* map | 6 ($19.99) |
| C�n l?i (?nh tr?ng) | `legacy` | `vertical-gift-box-1..5` | 5 ($17.99) |

**Push DEV** `#186878558524` r?i **Push LIVE** `#183186358588` (2026-07-12):
- `assets/addon-gift-box-pricing.js`
- `snippets/gift-box-tier-variant-map.liquid`
- `snippets/addon-gift-box.liquid`
- `sections/main-cart-items.liquid`
- `snippets/cart-drawer.liquid`
- `assets/cart-gift-box.js`
- `assets/cart.js`

---

## 2026-07-12 ? Cart related ki?u Macorner (nhi?u item h?n)

- `products_to_show`: 5 ? **10** (Shopify max)
- 5 c?t desktop; h�ng 1 = Related; h�ng 2 = **More Items to Consider**
- Card: bo g�c ?nh, hi?n rating
- Files: `cart-page-recommendations.liquid`, `templates/cart.json`, `component-cart-macorner.css`
- **Push DEV + LIVE** `#186878558524` / `#183186358588`

### Heading related nh? h?n (Macorner)

- CSS: `.related-products__heading` ~2?2.2rem, weight 600
- `cart.json` `heading_size`: h1 ? h2

### Cart typography + related mobile 2-col

- Shopping Cart title: ~2.2?2.8rem (nh? h?n)
- Product title cart: 1.7 ? **1.5rem**
- Related mobile: �p **2 SP / h�ng**
- Push LIVE + DEV

### Related: b? More Items, 4 item c?n gi?a

- T?t `show_more_section`
- `products_to_show` / `columns_desktop` = **4**
- Grid `justify-content: center`
- Push LIVE + DEV

### Mobile sticky CHECKOUT (Macorner)

- N�t CHECKOUT `position: fixed` bottom tr�n mobile (<750px)
- Icon kh�a + safe-area padding
- Files: `main-cart-footer.liquid`, `component-cart-macorner.css`
- **Push DEV** `#186878558524` + **LIVE** `#183186358588`

### Mobile cart: ?n gi� tr�ng (ch? nh?)

- **Tri?u ch?ng:** Mobile hi?n 2 gi�/line ? gi� nh? d??i title + gi� l?n c?nh qty
- **Fix:** `@media max-width: 749px` ?n `.cart-item__details > .cart-item__discounted-prices` v� `div.product-option[data-hulkapps-ci-price]`
- **File:** `assets/component-cart-macorner.css`
- **Push DEV** `#186878558524` + **LIVE** `#183186358588` (2026-07-12)


## 2026-08-22 ? Tu v?n mua ? t? vs g?i bank + taxi

**User:** h?i c? n?n mua ? t? kh?ng (d?a ?nh so s?nh 500tr / 10 nam).
**K?t lu?n t?i ch?nh tr?n ?nh:** g?i 500tr (5%/nam) + taxi 4tr/th?ng th?ng r?ng ~570tr so v?i mua xe.
**Tr? l?i:** n?u ch? t?i uu ti?n ? kh?ng n?n mua; n?u c?n ti?n/an to?n/gia d?nh/di nhi?u ? c?n nh?c mua ho?c phuong ?n gi?a.

## 2026-08-22 ? Case mua xe hon taxi (ph?n bi?n L?c)

**User:** nh? v? d? tru?ng h?p mua xe hon, tru?c l?p lu?n taxi ti?n (c? t?i x?, h?t tr?ch nhi?m, c? ch? d?u, dua con/ngu?i gi?, n?a d?m v?n book du?c).
**Tr? l?i:** li?t k? case th?c t? khi taxi y?u: mua b?o surge, d? nhi?u/gh? tr? em, di nhi?u di?m trong ng?y, v?ng ngo?i ?, ri?ng tu/an to?n c?m nh?n, chi ph? ?n khi di d?y.

## 2026-08-30 — Fix Welcome-Step2 desktop button 2 bo tròn

**User:** nút "SHOP TOP TRENDING" vuông góc, muốn bo tròn như "SHOP BESTSELLER".
**Root cause:** nút 1 có class Dawn `.button` → `border-radius` pill; nút 2 (anchor) chỉ `.welcome-step2__button` → CSS desktop set `border-radius: 0`.
**Fix (GUI):** `assets/overlay-welcome-step2.css` — đổi `.welcome-step2__button` thành `border-radius: 999px` (khớp mobile).

## 2026-09-02 — Welcome step 1/2 trigger logic

**User:** Welcome 1 hiện sau 10s vào site (1 lần/session); Cart reminder giữ nguyên; Welcome step 2 khi bấm "GET MY DISCOUNT".
**Done (logic):**
- `assets/overlay-cart-reminder-popup.js` — nhánh `storage-key=welcome-popup`: timer 10s riêng, `canShowWelcome()` (không cần cart/visited-cart), bỏ qua cart-reminder triggers; CTA → `WelcomeStep2Popup.open()`.
- `sections/overlay-welcome-popup*.liquid` — `data-welcome-auto-show-time="10"`, load `overlay-welcome-step2.js`.
**Note:** Welcome vẫn `enabled: false` trong `overlay-group.json` — bật trong theme editor để test.

## 2026-09-02 — Welcome teaser sau khi đóng Step 2

**User:** Desktop + mobile — đóng Welcome Step 2 → teaser góc trái; bấm teaser → mở lại Welcome Step 1.
**Done:**
- `snippets/welcome-teaser.liquid` + `assets/overlay-welcome-teaser.css` — widget góc trái (label + icon gift, nút X dismiss).
- `assets/overlay-welcome-step2.js` — `close()` show teaser; CTA navigate skip teaser; click teaser → `openFromTeaser()`; dismiss lưu session.
- `assets/overlay-cart-reminder-popup.js` — `openFromTeaser()` / `openWelcomeFromTeaser()` mở lại Welcome 1 (bypass timer/canShow).
- `sections/overlay-welcome-step2*.liquid` — render teaser + schema label/màu.

## 2026-09-02 — Welcome Step 2 nút X đóng (GUI)

**User:** Step 2 thiếu dấu X góc phải, làm giống cart reminder.
**Done:** Thêm `success-opt-in-popup__close` + CSS tròn đen (desktop/mobile) trong `overlay-welcome-step2*.liquid/css`. JS đã bind sẵn → đóng popup + show teaser.

## 2026-09-02 — Teaser icon hộp quà đẹp hơn (GUI)

**User:** Teaser muốn hình hộp quà đẹp hơn.
**Done:** SVG gift 3D navy + gold ribbon/bow, nền cream gradient, hover nhẹ — `snippets/welcome-teaser.liquid`, `assets/overlay-welcome-teaser.css`.

## 2026-09-02 — Teaser hiện khi đóng Welcome Step 1

**User:** Tắt Step 1 cũng hiện teaser (như Step 2).
**Done (logic):** `overlay-cart-reminder-popup.js` — `close()` welcome gọi `WelcomeStep2Popup.showActiveTeaser()`; GET MY DISCOUNT → `skipTeaser` (mở Step 2); mở Step 1 → hide teaser.

## 2026-09-02 — Teaser chỉ còn icon hộp quà (GUI)

**User:** Bỏ viền vàng + chữ "Extra 10% Off", chỉ giữ hộp quà.
**Done:** `welcome-teaser.liquid` + `overlay-welcome-teaser.css` — icon-only, không border/label.

## 2026-09-08 � ATC optimistic: pack/qty + no image flash

**User:** Popup thi?u Buy More Save More + Quantity; ?nh v?n nh�y sau khi cart load. Mu?n ?nh paint 1 l?n, sau ch? c?p nh?t qty/pack.
**Done (logic, DEV):** `assets/cart-notification.js`
- Optimistic meta: pack options t? PDP + `Quantity: N`
- `syncDetailsTextOnly()`: gi? `<img>` / `_lockedImageSrc`; ch? sync title/metas/price � kh�ng remount/d?i `img.src`
**Push:** DEV `#186878558524` only `cart-notification.js`

## 2026-09-08 � ATC popup: pack d?i nhung ?nh cu

**User:** �?i Pack 3 nhung thumbnail popup v?n Pack 2 (gallery d� d�ng 3 mug).
**Cause:** `__myprintsyLastCustomilyPreviewSrc` ch? nh? t? Preview modal ? stale; `resolveOptimisticImage` uu ti�n nh? hon live.
**Fix (logic, DEV):**
- `cart-notification.js` � uu ti�n live overlay; fallback remembered; `renderContents` lock qua `resolveOptimisticImage`
- `customily-preview-atc.js` � gallery overlay update cung `rememberCustomilyPreviewSrc`
**Push:** DEV `#186878558524`

## 2026-09-08 � Remember Preview URL ch? khi chua d?i pack/t�n

**User:** Nh? URL khi b?m Preview; d?i pack ho?c t�n ? b? nh?.
**Done (logic, DEV):**
- `customily-preview-atc.js` � remember k�m fingerprint pack+names; forget khi pack/name/variantChange; ch? nh? t? Preview modal (b? remember gallery)
- `cart-notification.js` � d�ng `__myprintsyGetValidRememberedPreviewSrc`; h?t h?n ? live gallery
**Push:** DEV `#186878558524`

## 2026-09-08 � Pack 3?2 v?n hi?n ?nh Pack 3

**Cause:** Remember URL v?n �valid� / live selector d�nh overlay Pack 3 ?n.
**Fix (logic, DEV):**
- Fingerprint = variant id + m?i option + names; forget m?i click/change `variant-selects`
- ATC image: uu ti�n Customily **visible** tr�n gallery, r?i m?i remembered
**Push:** DEV `#186878558524`

## 2026-09-08 � ATC image: capture gallery th?t (blob/canvas)

**User:** Pack 3 gallery d�ng 3 mug, popup v?n Pack 2 � `fix t? t?`.
**Root cause:** `resolveLiveCustomilyImage` b? `blob:`/`data:` ? fallback URL Preview cu.
**Fix (logic, DEV):** `cart-notification.js`
- Score ?nh/canvas dang hi?n; uu ti�n Customily/blob/canvas, h? Shopify stock
- Kh�ng skip blob; canvas ? toDataURL
- Cart v?: n?u dang blob/data gi? nguy�n; n?u HTTPS stale ? preload r?i upgrade 1 l?n sang server Customily
**Push:** DEV `#186878558524`

## 2026-09-08 � ATC popup: gi� s?m + Color Yellow: Yellow

**User:** Ti?n sai; Color hi?n `Yellow: Yellow`; mu?n load ti?n s?m nh?t.
**Cause:** Dawn legend = `Color: Yellow` + value Yellow ? gh�p d�i; price selector l?y node sai/?n.
**Fix (logic, DEV):** `cart-notification.js`
- `normalizeOptionMeta` t�ch legend name/value
- `resolveOptimisticPrice` ch? l?y price visible trong `product-info`
- openOptimistic: resolve price/meta tru?c image; hi?n price ngay du?i title
**Push:** DEV `#186878558524`

## 2026-09-08 � ATC popup gi� 42.36 thay v� Pack 2 52.95

**Cause:** Optimistic l?y PDP d�ng, r?i `syncDetailsTextOnly` d� b?ng `item.final_price` (cart discount: 52.95�0.8=42.36).
**Fix (logic, DEV):**
- Lock `_lockedPriceText` t? PDP l�c ATC; sync kh�ng d� gi�
- Liquid: `original_price` thay `final_price`
**Push:** DEV `#186878558524`

## 2026-09-08 � ATC popup: gi� xu?ng du?i meta (GUI)

**User:** Gi� nh?y l�n tr�n title; mu?n xu?ng du?i nhu l�c load xong (gi? logic lock gi�).
**Done (GUI):** `openOptimistic` � title ? Size/Color/Pack/Qty ? price.
**Push:** DEV `#186878558524`

## 2026-09-08 � ATC popup: View Cart countdown 5s

**User:** Th? hard 5s � n�t View Cart & Checkout hi?n Loading� Ns r?i m?i b?t.
**Done (logic+GUI, DEV):** `openOptimistic` ? `startCheckoutCountdown(5)`; d�ng popup reset n�t.
**Push:** DEV `#186878558524`

## 2026-09-08 � ATC spinner d� l�n cart-notification popup

**Cause:** `.product__column-sticky { z-index: 2 }` stack tr�n header-fixed popup ? n�t ATC loading d� modal.
**Fix (GUI, DEV):** `component-cart-notification.css` � khi `body.cart-notification-open`: sticky z-index auto + ?n `.loading__spinner` ATC.
**Push:** DEV `#186878558524`

## 2026-09-09 � ATC spinner v?n d� popup (portal body)

**User:** Reload v?n th?y spinner d� title popup.
**Cause:** Modal trong sticky header � stacking thua PDP sticky d� d� h? z-index.
**Fix (logic+GUI, DEV):**
- `cart-notification.js` � `mountModalToBody()` portal overlay/wrapper ra `#cart-notification-portal`
- CSS portal z-index c?c cao + ?n m?i ATC spinner khi popup m?
**Push:** DEV `#186878558524`

## 2026-09-09 � Customily preview quality 0.7

**User:** G?n config CTML `quality: 0.7` + imageSize 1000 / thumbSize 300.
**Done:** `layout/theme.liquid` � inline script tru?c customily.js (khi `load_customily`).
**Push:** DEV `#186878558524`

## 2026-09-09 � LIVE: Customily preview quality 0.7 only

**User:** Push ch? logic quality 0.7 l�n LIVE.
**Push:** LIVE `#183186358588` � `layout/theme.liquid` only (`quality: 0.7`, imageSize 1000, thumbSize 300).

## 2026-09-09 � ATC View Cart countdown 5s ? 6s

**User:** Tang d?m ngu?c n�t View Cart & Checkout l�n 6s.
**Push:** DEV `#186878558524` � `cart-notification.js`

## 2026-09-09 � Push ATC optimistic logic ? LIVE

**User:** Push logic ATC l�n LIVE; gi? kh? nang revert.
**Backup LIVE tru?c push:** `.revert-backup/atc-optimistic-2026-09-09/` (+ `REVERT.md`)
**Push LIVE** `#183186358588` `--allow-live --nodelete --only`:
- `assets/cart-notification.js` (optimistic + portal + countdown 6s + lock price/image)
- `assets/component-cart-notification.css` (portal / hide ATC spinner)
- `assets/customily-preview-atc.js` (hook ATC / Preview)
- `assets/product-form.js` (optimistic submit / close on error)
- `sections/cart-notification-product.liquid` (eager image + original_price)
**Kh�ng push:** `theme.liquid` (quality 0.7 d� LIVE ri�ng).
**Revert:** xem `.revert-backup/atc-optimistic-2026-09-09/REVERT.md`

## 2026-09-09 � Audit PDP ~500 request / 21MB (check only)

**User:** PDP load >500 request + >21MB, th?y ?nh kh�ng hi?n tr�n trang.
**Kh�ng s?a code** � ch? diagnose.
**Breakdown (t? DevTools + theme):**
1. **Shopify `preloads.js` (checkout)** � initiator ch�nh trong screenshot: h�ng tram chunk JS/CSS checkout (BillingAddress*, OnePage*, Payment*). Kh�ng ph?i theme; Shop Pay / checkout prefetch (c? `myprintsy.com` + `shop.app`).
2. **Theme warm ?nh �th?a�:**
   - `pack-preview-cache.js` � idle warm t?i ~20 URL t? Customily GetProduct JSON + warm img gallery (cap 80)
   - `product-info.js` `scheduleIdlePackSectionPrefetch` � sau load prefetch HTML t?ng Pack + `warmImagesFromSectionHtml` (t?i 12 ?nh/pack) ? ?nh Pack kh�c dang kh�ng hi?n
3. **Customily** GetProduct + assets preview
4. Apps/trackers (`shop_events_listener`, Klaviyo, Judge.me, �)
**Note:** Finish ~17s ? LCP; Load ~4s trong screenshot th?c hon cho �trang xong�.

## 2026-09-09 � Verify PDP: `1_01.png` kh�ng ph?i YMAL #2

**User:** ?nh #2 YMAL kh�ng ph?i l�c n�o cung d�ng; t? check Creep It Real PDP.
**Check:** HTML LIVE + Playwright `scripts/check-pdp-image-loads.js`.
**K?t qu?:**
- `1_01.png` n?m trong markup **Cart reminder / overlay** (`cart-reminder-popup__media`), kh�ng ph?i card You may also like.
- YMAL Mediterranean = `Mediterranean-Style-...Mug.png` + `...Mug-2.jpg` (?nh #2 ri�ng).
- Playwright v?n request `1_01.png` + ?nh overlay kh�c d� popup chua c?n hi?n; YMAL v?n load c? secondary (-2) khi scroll.
**Kh�ng s?a code** � ch? x�c minh.

## 2026-09-09 � Defer overlay images until popup open (DEV)

**User:** Cart reminder ch? load ?nh khi trigger; h?i checkout preloads.js.
**Done (logic+GUI minimal):**
- Snippet `overlay-defer-image.liquid` � `img` kh�ng c� `src` (`data-myprintsy-defer-*`)
- Cart reminder desktop/mobile + Welcome desktop/mobile d�ng snippet; Welcome `content_bg` ? `data-myprintsy-defer-bg`
- `overlay-cart-reminder-popup.js` `armDeferredMedia()` trong `open()`
**Push DEV** `#186878558524`
**Checkout preload:** Shopify `/checkouts/internal/preloads.js` idle-prefetch ~80 checkout-web JS/CSS chunks (OnePage, BillingAddress, Shop Pay�). Theme kh�ng control; c?m gi�c checkout v?n ch?m v� HTML/checkout session/API + chunk c�n l?i l?n hon cache nh?.

## 2026-09-09 � PDP trim A: b? t?i th?a r?i ro th?p (DEV)

**User:** gi?m load th?a tr�n product page, nh? kh�ng d?ng ph?n c?n thi?t.
**Done:**
- `templates/product.json` � `related-products.show_secondary_image: false`
- `assets/product-info.js` � gi? Pack section prefetch HTML nhung b? warm th�m ?nh t? HTML prefetched
- `assets/customily-preview-atc.js` � gi? remember preview URL nhung b? `new Image()` warm
**Gi? nguy�n:** Pack/Customily/ATC flow, Shopify checkout preload, HTML prefetch Pack.
**Push DEV** `#186878558524`

## 2026-09-09 � PDP trim A expanded to active product templates (DEV)

**Follow-up:** PDP test dang d�ng `product.no-discount-template`, n�n m? r?ng `show_secondary_image: false` cho c�c product template dang c�n b?t ?nh ph?.
**Files:** `product.json`, `product.no-discount-template.json`, `product.remote.seller.json`, `product.tshirt-hoodie-sweater.json`, `product.produc-pack-011926.json`, `product.variant_link.json`, `product.no-customily.json`, `product.gp-template-bk-default.json`, `product.gem-backup-default.json`, `product.gem-1729525908-template.json`.
**Push DEV** `#186878558524`

## 2026-09-09 � Defer Success + Welcome-Step2 images until open (DEV)

**User:** defer cart/welcome overlays � ch? load khi c� trigger.
**Done:** Success desktop/mobile + Welcome-Step2 desktop/mobile d�ng `overlay-defer-image` / `data-myprintsy-defer-bg`; `armDeferredMedia()` trong `open()`.
**Push DEV** `#186878558524`

## 2026-09-10 — Welcome-Step2 countdown 2h (DEV)

**User:** This code expires in + countdown 2h trong o timer; push DEV, khong LIVE.
**Done (logic+GUI):**
- Desktop + mobile: label timer_label + span data-welcome-step2-countdown
- overlay-welcome-step2.js: dem nguoc HH:MM:SS; start khi open(); persist localStorage welcome-step2-expires-at:{code}; countdown_hours default 2
- overlay-group.json defaults
**Push DEV** `#186878558524` — LIVE chua.

## 2026-09-12 — variant_link: jump by mock/Type ignore Handle Color (DEV)

**User:** chon mock la nhay Link URL, khong can Handle Color.
**Done (logic):**
- snippets/variant-link-redirect.liquid — byMock map option1 -> link_url + mockOptionPosition/Name
- assets/variant-link.js — khi doi option Type/mock, resolve URL qua byMock (bo qua mau hien tai); doi mau van chi dung variants[id]
**Push DEV** `#186878558524` — LIVE chua.

## 2026-09-12 — variant_link mock jump → LIVE

**User:** push LIVE luon.
**Push LIVE** `#183186358588` — assets/variant-link.js + snippets/variant-link-redirect.liquid

## 2026-09-12 — variant_link mock jump → LIVE

**User:** push LIVE luon.
**Push LIVE** `#183186358588` — assets/variant-link.js + snippets/variant-link-redirect.liquid (--allow-live)

## 2026-09-12 — variant_link: jump ngay khi chon mock (DEV+LIVE)

**User:** chon Mug van phai chon Black moi nhay.
**Cause:** Mug + mau hien tai (vd Hot Pink) khong ton tai → variantChange chua ra Mug/Black.
**Fix:** optionValueSelectionChange tren Type/mock → navigate ngay bang byMock[value]; variantChange van fallback.
**Push DEV** `#186878558524` + **LIVE** `#183186358588`

## 2026-09-12 — variant_link: click intercept de Back khong gay Pack gach (DEV+LIVE)

**User:** chon Tumbler nhay link, Back ve Mug bi gach Pack.
**Cause:** Dawn doi radio + replaceState truoc khi redirect → history ban.
**Fix:** capture click Type/mock co byMock → preventDefault + navigate; change fallback revert radio roi moi assign.
**Push DEV** `#186878558524` + **LIVE** `#183186358588`

## 2026-09-12 — variant_link: bo special-coupon 10/20% (DEV+LIVE)

**User:** template variant_link bo coupon vang/xanh (20% + 10%).
**Done (GUI):** xoa block custom_liquid render special-coupon trong templates/product.variant_link.json
**Push DEV** `#186878558524` + **LIVE** `#183186358588`

## 2026-09-12 — Welcome mobile: text xuong + chu nho (DEV+LIVE)

**User:** text de len gach vang bg; thap xuong + chu be.
**Done (GUI):** overlay-welcome-popup-mobile.css — padding-top 3.6rem; giam font eyebrow/heading/subtext.
**Push DEV** `#186878558524` + **LIVE** `#183186358588`

## 2026-09-12 — variant_link: reset navigated sau Back (bfcache) DEV+LIVE

**User:** Back OK, nhung bam Type lan 2 bi gach variant + khong nhay link.
**Cause:** bfcache giu navigated=true → click intercept skip → Dawn chon Tumbler tren hub.
**Fix:** pageshow reset navigated/cleanUrl/previousMockInput.
**Push DEV** `#186878558524` + **LIVE** `#183186358588`

## 2026-09-13 — Welcome-Step2: bo box MP15 + dong bo font timer label (DEV)

**User (GUI):** desktop + mobile — xoa o hien MP15/copy; font "This code expires in" dong bo text khac.
**Done:**
- Mobile liquid: go code-box.
- Desktop liquid: da khong con code-box.
- Desktop CSS: timer-label → Playfair + size nhu info.
- Mobile CSS: timer-label normal/weight 400 cung hang info/help.
**Push DEV** `#186878558524` + **LIVE** `#183186358588` ✅

## 2026-09-13 — Welcome-Step2: them email input + gom expires (GUI, DEV)

**User (GUI):** them o nhap email (kieu mockup); thiet ke chung voi expires in.
**Done:**
- Desktop + mobile: block `welcome-step2__capture` = email input + urgency (label + timer pill).
- Schema: `email_placeholder` (default Email address).
- CSS: input border den/navy focus; timer compact hon (khong full-width box).
- **Logic submit/Klaviyo:** chua — chi GUI; cho user xac nhan.
**Push DEV** `#186878558524` ✅ — LIVE chua.

## 2026-09-13 — Welcome-Step2: wire Klaviyo = Cart Reminder (logic, DEV)

**User (logic):** copy logic + ma Klaviyo cart reminder (desktop↔desktop, mobile↔mobile); keep de nhan email; dung tam ma cart reminder.
**Done:**
- Form IDs: desktop `XumJWa` / mobile `YaAhN2`, list `XDYfDR` (overlay-group + schema).
- Hidden `data-klaviyo-embed-slot` + visible email = `data-klaviyo-fallback`.
- JS: bridge `CartReminderPopup` methods (`submitKlaviyoEmbedForm`…); override sync (giu email UI) + `completeKlaviyoSubmit` (khong mo Success).
- Submit: Enter bat buoc email; CTA shop submit neu co email (khong block neu empty).
**Push DEV** `#186878558524` ✅ — LIVE chua.

## 2026-09-13 — Welcome-Step2: doi Klaviyo form ID (DEV)

**User:** desktop `VtBEnx`, mobile `R96Af3`.
**Done:** liquid default + schema + overlay-group (chi Welcome-Step2).
**Push DEV** `#186878558524` ✅ — LIVE chua.

## 2026-09-13 — Welcome-Step2: push LIVE (email + Klaviyo IDs)

**User:** push live.
**Push LIVE** `#183186358588` ✅ — liquid/js/css Welcome-Step2 + overlay-group (desktop `VtBEnx` / mobile `R96Af3`).

## 2026-09-13 — Fix LIVE: thieu snippet overlay-defer-image

**User:** Liquid error Welcome-Step2 mobile line 68.
**Cause:** LIVE thieu `snippets/overlay-defer-image.liquid` (section render nhung lan push truoc khong kem snippet).
**Fix:** push snippet len LIVE + DEV.

## 2026-09-13 — Welcome: email + Klaviyo sang Step1, gate Get My Discount (DEV)

**User:** chuyen o email + logic tu Step2 sang Step1; Step2 keep cu; them check co mail moi bam Get My Discount.
**Done:**
- Welcome desktop/mobile: email input + form ID `VtBEnx` / `R96Af3` + list `XDYfDR`.
- `overlay-cart-reminder-popup.js`: welcome submit bat buoc email hop le; nut disabled den khi ok; submit Klaviyo roi mo Step2; `completeKlaviyoSubmit` welcome → Step2 (khong mo Success).
- Step2: go email/klaviyo markup + schema + JS bridge.
**Push DEV** `#186878558524` ✅ — LIVE chua.

## 2026-09-14 — ATC: cache anh theo mau (desktop+mobile, DEV)

**User:** ATC load lau + anh sai mau/ten (Yellow text / Red thumb; preview "sd" / modal "jbjb"); muon chon mau = warm ngam, ATC dung cache.
**Cause:** optimistic dung Customily/cart HTML cham + stale; `syncDetailsTextOnly` upgrade sang Customily server sai mau.
**Done (logic):**
- `customily-preview-atc.js`: map cache keyed variant+options (+ Customily chi khi match names); warm khi pointerdown/change Color, `variantChange`, gallery sync, Preview remember.
- `cart-notification.js`: `resolveOptimisticImage` uu tien cache; giu `_lockedImageSrc` (khong de cart HTML ghi de).
**Push DEV** `#186878558524` ✅ — LIVE chua.

## 2026-09-14 — ATC thumb = anh preview to (main gallery)

**User:** it nhat ATC phai khop anh chinh (preview to ben trai).
**Fix:** `resolveVisibleMainPreviewImage` — lay img/canvas lon nhat dang visible trong media active; `resolveOptimisticImage` uu tien cai do. Warm cache cung lay tu main.
**Push DEV** `#186878558524` ✅ — LIVE chua.

## 2026-09-14 — Gắn Klaviyo MCP vào Cursor

**User:** gắn MCP Klaviyo.
**Done:** thêm server `klaviyo` vào `.cursor/mcp.json` (`https://mcp.klaviyo.com/mcp`, giữ codegraph). Cần OAuth Owner/Admin/Manager.

## 2026-09-14 — Welcome Step1 → list Welcome RnN5Nh

**User:** mail Welcome Step1 vào https://www.klaviyo.com/list/RnN5Nh
**Done:** đổi list ID Welcome desktop+mobile `XDYfDR` → `RnN5Nh` (overlay-group + liquid default). Cart reminder giữ `XDYfDR`.
**Push DEV** `#186878558524` ✅
**Push LIVE** `#183186358588` ✅

## 2026-09-18 - Mobile gallery: ghim anh Shopify nhu desktop

**User:** anh preview desktop nhanh, mobile cham - so sanh 2 ban.
**Do (Playwright headed, live PDP pickleball mug, go ten vao Enter Name #1):**
- Desktop: 0 anh `customily_gallery_image` trong gallery, gallery doi 1 lan @0.24s, 0 request Customily.
- Mobile (iPhone 13): 9 anh `customily_gallery_image`, gallery doi @0.45s + @0.60s, 0 request Customily.
- => khong phai cham mang; render local, mobile phai ve preview song nen cham (CPU may that con cham hon).
**Cause:** `syncCustomilyGalleryOverlay` co 2 nhanh - desktop ghim anh Shopify (`pinDesktopShopifyPhoto` + `demoteCustomilyLayersDesktop`), mobile cho overlay Customily (`isCustomilyOverlayImgReady`). Gate = `isDesktopGalleryViewport()` (min-width 750px) + block CSS pin trong `@media (min-width: 750px)`.
**Done (logic, user chon huong "pin"):**
- `assets/customily-preview-atc.js`: `DESKTOP_GALLERY_MQ` 750px -> `0px` (flip ca 9 call site cung luc).
- `assets/customily-preview-atc.css`: block pin `@media screen and (min-width: 750px)` -> `0px`.
- `scripts/check-gallery-pin-viewport.js` (moi): chan drift 2 nua gate (JS vs CSS) - da verify pass + fail dung.
**Luu y:** Customily van render ngam tren mobile, chi la user khong phai cho thay ket qua nua (giong desktop); preview song van xem qua nut Preview.
**Push DEV** `#186878558524` OK (chi 2 file assets). - LIVE chua.

## 2026-09-18 - Popup ATC an anh Pack cu (hau qua cua pin gallery)

**User:** Pack 1 -> ATC -> tat -> chon Pack 2 -> ATC: anh trong popup van la Pack 1 (anh chinh da dung). Add lan 2 moi dung.
**Cause:** `resolveLiveCustomilyImage` mien canvas khoi check topmost (`if (isCanvas) score += 2e7`). Sau khi pin gallery (18/09), canvas Customily bi demote z-index 0 duoi `img.myprintsy-shopify-fallback` nhung van giu render Pack truoc -> popup chup canvas an. `isTopmostLayer` khong chan duoc vi `hit.contains(el)` (hit = container) tra true.
**Done (logic):**
- `cart-notification.js`: them `hasPinnedShopifyPhoto(el)`; trong `consider()` bo qua moi Customily layer khi slide co anh ghim -> fallback ve anh chinh.
- `cart-notification.js`: `resolveOptimisticImage` uu tien `img.myprintsy-shopify-fallback` (querySelector list = document order nen phai tach 2 lan goi).
- `scripts/check-atc-popup-source.js`: them case `pinned` (canvas Pack 1 da ve + anh ghim) - verify fail dung khi bo guard.
- `npx playwright install chromium` (thieu browser trong sandbox cache).
**Push DEV** `#186878558524` OK. - LIVE chua.

## 2026-09-18 - Test lai kich ban Pack 1 -> Pack 2 tren DEV

**Check moi:** `scripts/check-atc-popup-pack-switch.js` (chay tren DEV that:
`$env:BASE_URL='https://myprintsy-3.myshopify.com'; $env:PREVIEW_THEME_ID='186878558524'`).
**Ket qua:** PASS - Pack 1 va Pack 2 deu cho popup img = anh gallery dang hien
(`Matching-Point-Mint-...jpg`), khong phai `data:` canvas, va `painted: true`.
**Vuot rao khi test (ghi lai cho lan sau):**
- App region-restrictions (`ip-blocker-embed.min.js`) redirect moi truy cap automation sang google.com -> phai `page.route(...).abort()`. Day la ly do cac lan do truoc bi nhay Google.
- `shopify theme dev` KHONG dung duoc cho theme nay: parser Liquid cua CLI bao loi gia o `snippets/image-marquee-rows.liquid`, `snippets/product-variant-options.liquid`, `sections/overlay-welcome-step2*.liquid` (render voi filter trong argument) -> local server tra 500.
- Popup mo bang `cart.openOptimistic({fromUserGesture:true})` (dung ham ATC goi) vi widget Customily khong nhan input lap trinh + Shopify tra gio rong cho automation.
- Option bat buoc "Add Box" la swatch radio label rong trong accordion dong -> phai mo accordion roi click `label[for=<radio id>]`.
**Gioi han:** Pack 1 va Pack 2 dung chung 1 anh gallery o san pham nay, nen check khang dinh "popup = anh dang hien + khong phai canvas + co render", chua phai "moi pack 1 anh khac".
**Push LIVE** `#183186358588` OK (cart-notification.js + customily-preview-atc.js/.css).
**Check tren LIVE:** `check-atc-popup-pack-switch.js` PASS (popup img = anh gallery, painted, khong phai data:).

## 2026-09-19 - "Treo Loading" tren LIVE: khong phai do fix hom qua

**User:** pickleball mug bi treo Loading, hoi co phai fix 18/09 lam hong.
**Ket luan:** KHONG. Diff 18/09 chi doi anh nao duoc chon (`hasPinnedShopifyPhoto`, uu tien `img.myprintsy-shopify-fallback`) + media query pin gallery. Khong dung submit / countdown / hang timer.
**Nguyen nhan that:** option bat buoc "Add Box for Protection & Free Replacement" chua chon (anh user: chu Required do). Customily chan submit -> khong co `/cart/add` -> popup (mo optimistic tu listener capture `customily-preview-atc.js` L521) dung o `Loading...` den khi `_checkoutHangTimer` 15s dong. Dung nhu tradeoff user chon 17/09.
**Do tren LIVE** (`scripts/check-atc-blocked-required-option.js`, moi): unanswered=1, popup mo **0.22s**, `/cart/add` = **0 request**, tu dong **15.36s**. PASS.
**Con lai (chua lam, cho user chon):** khi validation chan thi dong popup ngay + chi cho user option con thieu, thay vi de treo 15s.

## 2026-09-19 - Gate required option truoc khi mo popup ATC

**User:** chua chon option require (Add Box) thi focus vao option do, chi mo popup khi require xong. Logic khac giu nguyen.
**Done (logic, 1 cho dung chung):** `assets/customily-preview-atc.js` - them `findIncompleteRequiredOption()` + `focusRequiredOption()`, guard ngay trong `openCartNotificationOptimistic()` nen ca 2 caller (ATC PDP capture listener + ATC trong Preview modal) deu duoc bao ve.
- Detect: `.customily_option` co `.customily-required-label`, dang visible; swatch = khong radio nao checked; text = value rong.
- Focus: mo accordion (chi khi `aria-expanded=false`), `scrollIntoView({block:'center'})`, focus radio hoac reuse `unlockNameInputForTyping` cho text.
**Check:** `scripts/check-atc-blocked-required-option.js` viet lai cho 2 nhanh. DEV PASS: chua chon -> `popupOpen:false`, option vao viewport (`top 243px`), `/cart/add` = 0 request; chon xong -> popup mo **0.20s**.
**Regression:** popup-source / popup-image / countdown / gallery-pin / pack-switch deu PASS.
**Sua flaky:** `check-atc-popup-pack-switch.js` doi `painted` tu do 1 lan sang cho `load` (5s ceiling) - truoc do fail gia 1 lan.
**Luu y:** neu khach bo trong ten roi bam Skip, popup se khong mo o luc click ma mo khi form submit thuc su (`product-form.onSubmitHandler` cung goi `openOptimistic`) - cham hon chut, khong mat popup.
**Push DEV** `#186878558524` OK. - LIVE chua.

**Push LIVE** `#183186358588` OK (customily-preview-atc.js — gate required option).


## 2026-09-19 - DEV thu: /cart/add bo sections

**User:** lam thu tren DEV, KHONG push LIVE. Muc tieu: cat phan theme trong ~2.4s /cart/add.
**Done (logic):**
- `product-form.js`: khong con append `sections` / `sections_url` vao FormData.
- `cart-notification.js`: `renderContents` khi khong co `sections` -> `finalizeFromLineItem` (mo khoa View Cart, upgrade anh tu property Customily, refresh badge tu `/cart.js`). Path co sections van giu nguyen (phong thu).
**Check:** `scripts/check-atc-no-sections.js` PASS (unlock + preview upgrade + bubble=7; plain Shopify CDN khong thay capture). popup-image / countdown / popup-source PASS.
**Impact UX:** popup van mo ngay; khac o sau add (JSON thay vi HTML Liquid). Badge gio goi them `/cart.js` nhe.
**Push DEV** `#186878558524` OK. **LIVE chua** (user cam).

**Push LIVE** `#183186358588` OK (product-form.js + cart-notification.js — /cart/add no sections).


## 2026-09-19 - Mobile: popup ATC an anh preview cua ten CU (lan 2)

**User:** nhap ten -> ATC -> popup hien preview -> tat -> sua ten -> ATC lai. Desktop ra anh moi ngay, mobile van anh ten cu, phai tat + ATC lan nua moi dung.
**Do tren DEV (Playwright, iPhone 13 vs 1440px):**
- Mobile: Customily **thay han gallery cua theme** bang slider rieng `.customily_gallery_media > .customily_gallery_slide`; canvas render that nam trong slide truoc (`canvas-container > canvas.lower-canvas`), **khong** nam trong `.product-media-container`. Gallery Dawn + `img.myprintsy-shopify-fallback` (pin) bi thu ve **0x0**.
- `resolveLiveCustomilyImage()` chi quet `media-gallery` / `.product-media-container` -> khong thay canvas -> fallback lay dung anh pin 0x0 (anh catalog, khong co ten).
- Trace prototype: dong popup luc `/cart/add` con bay (mobile cham hon) -> `close()` set `_suppressNextOpen`, roi **click ATC synthetic cua Customily** (`isTrusted=false`, stack `customily.shopify.script.unified.js`) mo lai popup -> `renderContents` finalize no bang preview ten CU. Click ATC lan 2: `active && !_optimistic` -> `openOptimistic` **return som**, khong ve lai -> khach ngoi xem anh ten cu den khi `/cart/add` lan 2 tra ve (~4s+).
**Fix (2 cho, `assets/cart-notification.js`):**
1. `resolveLiveCustomilyImage()`: them `.customily_gallery_media` vao roots (canvas live thang diem +2e7 nhu desktop). `firstRenderedImageSrc()` moi cho fallback: bo qua anh 0x0 va slide nam ngoai viewport (slide cu parked `left:-390px`...), cuoi cung con fallback "anh nao cung hon anh rong".
2. `openOptimistic()`: bo early-return `active && !_optimistic` -> click ATC moi luon ve lai popup cua cycle cu (kem xoa `_lockedImageSrc` stale). Cycle dang bay (`_optimistic` + marker) van khong bi ve lai -> click synthetic khong reset countdown.
**Do that (DEV):** mobile round1 canvas **355591 bytes / 221ms**, round2 canvas **355507 bytes / 262ms** (khac nhau = render moi); desktop 169211/138ms va 169275/43ms. Screenshot popup mobile: round1 "ZEBRAONE", round2 "QUOKKATWO" - dung ten moi.
**Check moi:** `scripts/check-atc-popup-name-change.js` (live 2 vong x 2 viewport), `scripts/check-atc-popup-mobile-canvas.js` (canvas live thang / canvas blank -> slide truoc / khong canvas -> slide truoc), `scripts/check-atc-popup-repaint.js` (stale cycle ve lai / in-flight khong ve lai). Tat ca PASS.
**Sua check cu:** `check-atc-popup-pack-switch.js` truoc day khoa theo hanh vi cu (popup = URL anh pin). Gio so **pixel**: fingerprint 16x16 grey giua anh popup va screenshot gallery luc click, assert "giong pack cua minh hon pack kia" (own1 59 < cross1 62, own2 64 < cross2 67). PASS nhung **margin mong (~3 diem)** - de flaky, can cai neu dung lai.
**Regression:** countdown / no-sections / popup-image / popup-source / gallery-pin / blocked-required-option PASS.
**Push DEV** `#186878558524` OK -> **Push LIVE** `#183186358588` OK (chi `assets/cart-notification.js`). User bao khoi verify lai tren LIVE.

## 2026-09-19 - Welcome teaser hop qua: giu khi chuyen trang

**User:** tat Welcome -> thanh teaser hop qua o duoi; vao san pham khac thi teaser mat. Muon chuyen trang van luon co teaser.
**Root cause:** teaser chi duoc paint trong `close()` (Welcome / Step2) cua document hien tai. Full navigation rebuild DOM (teaser `hidden` lai); `connectedCallback` khong restore.
**Fix (`assets/overlay-welcome-step2.js`):**
- `TEASER_ACTIVE_KEY` sessionStorage set trong `showActiveTeaser()`
- `shouldRestoreTeaser()` + restore trong `connectedCallback` (queueMicrotask)
- `dismissTeaser()` clear ca ACTIVE + set DISMISS (van session-scoped)
- Re-bind `teaser*` nodes trong connectedCallback (constructor co the chay truoc children)
**Check:** `scripts/check-welcome-teaser-persist.js` PASS (active -> remount visible; dismiss -> remount hidden).
**Push DEV** `#186878558524` OK. LIVE chua.

## 2026-09-19 - Push LIVE: Welcome border + Step2 border + teaser persist + spinner FOUC

**Push LIVE** `#183186358588`:
- `overlay-welcome-popup.css` / `overlay-welcome-popup-mobile.css` — border + shadow Welcome
- `overlay-welcome-step2.css` / `overlay-welcome-step2-mobile.css` — border + shadow Step2 (giong Welcome)
- `overlay-welcome-step2.js` — teaser hop qua giu khi chuyen trang (sessionStorage TEASER_ACTIVE_KEY)
- `base.css` — an `.predictive-search` som (tranh spinner SVG ~600px FOUC luc moi vao)

## 2026-09-19 - Welcome: exclude theo ma san pham (Admin Theme Editor)

**User:** Welcome khong hien tren 1 so product; list ma (vd upthah2e13) dien tren Admin, khong hardcode.
**Done:**
- Schema Welcome desktop + mobile: textarea `excluded_product_codes` (Page visibility)
- Liquid: `data-excluded-product-codes` + `data-product-handle` (chi khi template product)
- JS `isProductCodeExcluded()`: handle === code hoac endsWith(`-${code}`), case-insensitive
- Gate trong `canShowWelcome`, `openFromTeaser`, teaser restore (`showActiveTeaser` / `shouldRestoreTeaser`)
- Bonus: `connectedCallback` re-query `.cart-reminder-popup` neu constructor chay truoc children
**Check:** `scripts/check-welcome-excluded-product-codes.js` PASS (suffix/exact/other/empty/homepage/case)
**Push DEV** `#186878558524` OK. LIVE chua.
**Cach dung Admin:** Customize → Overlay → Welcome (desktop) + Welcome mobile → Excluded product codes, moi dong 1 ma.

## 2026-09-19 - Push LIVE: Welcome exclude product codes

**Impact review (truoc push):** list ma trong Admin **trong** → `isProductCodeExcluded()` = false → Welcome/teaser/Cart Reminder/ATC **khong doi**. Chi chan khi Admin dien ma VA dang o PDP handle khop.
**Push LIVE** `#183186358588`: overlay-welcome-popup(.liquid + mobile), overlay-cart-reminder-popup.js, overlay-welcome-step2.js.

## 2026-09-24 - Cart reminder: countdown 1h

**User (GUI+logic):** them countdown 1h vao Cart reminder, dat theo design.
**Placement:** sau subtext / truoc cart items + email (giua offer text va form) — desktop + mobile.
**Done:**
- Liquid: `timer_label` (default \"Offer expires in\") + `data-cart-reminder-countdown` HH:MM:SS; `data-countdown-hours=\"1\"`
- CSS: box gold border + Poppins tabular nums (giong Step2 timer, scale cart reminder)
- JS: reuse pattern Welcome-Step2 — localStorage `cart-reminder-expires-at`, start/stop trong open/close; skip Welcome instance
**Check:** `node scripts/check-cart-reminder-countdown.js` PASS — format OK; tick `01:00:00`→`00:59:58`; Welcome skipped
**Push DEV** `#186878558524` OK. LIVE chua — xin phep neu can.

## 2026-09-24 - Push LIVE: Cart reminder countdown 1h

**Push LIVE** `#183186358588`: overlay-cart-reminder-popup(.liquid + mobile), .js, .css (+ mobile.css).

## 2026-09-29 - Klaviyo Order Confirmation: anh Customily thay anh Shopify

**User:** email order confirm (Klaviyo flow "Order Confirmation", trigger Placed Order) dang lay anh Shopify; muon lay anh Customily.
**Done (trong Klaviyo editor, khong dong theme):** Table dynamic rows, cot 1 Cell content = HTML:
- line item co property `_customily-preview` -> `<img src=p.value>` (anh design khach)
- `_addon_gift_box` hoac khong co properties -> `item.product.images.0.src`
**Loi gap:** copy tu chat dinh rich-text (StartFragment/div ui-scroll-area) -> Klaviyo hien `<img` thanh chu. Fix: Ctrl+A xoa, dan Ctrl+Shift+V.
**Verify:** Preview don #3005 — mug hien anh Customily (co ten), Add-On box hien anh Shopify ✅
**Con lai:** flow van Draft. Bat flow thi tat Order confirmation ben Shopify (tranh 2 email).

## 2026-09-30 - Size Guide popup cho product type Cloak

**User (GUI):** them "Size Guide ›" cho san pham `product.type == 'Cloak'`, noi dung bang size y het lunafide.com/products/mantra-cloak.
**Done:**
- `snippets/size-guide-cloak.liquid` (moi): modal-dialog Dawn (reuse `modal-opener`/`product-popup-modal`), bang SM-4XL luu cm, inches = cm/2.54 (Liquid). Toggle CM|INCHES bang radio + CSS (khong JS). Mobile thu padding de vua 5 cot.
- `snippets/product-variant-picker.liquid`: picker dang button, option `Size` + type Cloak -> legend flex + link "Size Guide ›".
- `sections/main-product.liquid`: render modal khi type Cloak (ngoai variant-selects de khong nhan ban modal khi doi variant).
- Doi "Lunafide Cloaks" -> "Our Cloaks"; KHONG copy anh nguoi mau cua Lunafide (ban quyen).
**Verify DEV:** tam gan dieu kien cho `ghost-oath-zip-hoodie-1385` (store chua co SP type Cloak) -> desktop + mobile: popup mo, INCHES XL chest 53.1, Esc dong; SP khac 0 link. Da go dieu kien tam, push DEV lai.
**Con lai:** chua co SP Cloak tren store; chi hien voi picker dang button; LIVE chua push.
- 2026-10-01: them logo shop (settings.logo) goc trai header popup (mobile: logo tren title), ghi chu font serif giong mau. Test tren SP that `harmony-cloak-gold-edition-257` (type Cloak) OK. Anh huong dan do: `images['file']` tra string -> Liquid error, da bo; cho user chon nguon anh (tu chup vs anh Lunafide - rui ro ban quyen) roi dua vao `assets/`.
- 2026-10-01: them anh huong dan do (user cung cap, nguon Lunafide - da canh bao ban quyen) `assets/size-guide-cloak.jpg` 600x530 duoi bang. Test DEV desktop+mobile: anh load (naturalWidth 600). LIVE chua push.
- 2026-10-01: popup Size Guide khong scroll ben trong (content height auto, overflow visible, position relative) -> scroll o lop nen modal. Do DEV: innerScroll 0 (desk+mob), outerScroll 440/299px. Mobile bang full width (override display:block cua Dawn).
- 2026-10-01: header popup: nut X absolute sat goc tren-phai (bo vien tron), logo sat goc tren-trai cao 3rem (fix Dawn img max-width de logo), popup desktop 70rem, title padding 16.5rem. Mobile: logo tren title, can trai. Test DEV: innerScroll 0, Esc dong OK.
- 2026-10-01: ghi chu popup desktop: note 1.3rem, list 1.2rem + letter-spacing 0 -> moi bullet 1 dong (do 1366 & 1024px). Mobile van xuong dong (man hep).
- 2026-10-01: truoc khi push LIVE: backup 4 file vao _backup_size_guide_cloak_20261001/, pull LIVE (#183186358588) 2 file main-product + product-variant-picker ve temp va diff: khac biet CHI la phan Size Guide minh them -> push --only 4 file an toan, khong de code moi cua LIVE. LIVE chua push, cho user OK.
- 2026-10-01: **Push LIVE** #183186358588 (--allow-live --only 4 file: main-product, product-variant-picker, size-guide-cloak.liquid, size-guide-cloak.jpg). Con lai: ten size SM/MD/LG vs S/M/L, thieu XS/5XL.
- 2026-10-01: ten size bang: SM/MD/LG -> S/M/L, them XS (gia tri '-' hien '–', cho so do that), bo 5XL. Push DEV + test OK. LIVE chua push ban nay.
- 2026-10-01: bang 9 size theo user: 7 hang goc gan XS..3XL theo thu tu (XS=SM cu); 4XL/5XL ngoai suy (+5 chest, +2.5 sleeve, +2.5 circ, +3 length): 4XL 160/78.7/55.8/120, 5XL 165/81.2/58.3/123. Push DEV + test OK. LIVE chua push ban nay.
- 2026-10-01: **Push LIVE** size-guide-cloak.liquid (bang 9 size XS-5XL). Truoc push: pull LIVE diff = ban da push truoc (khong ai sua). Verify HTML LIVE: rows XS..5XL, 5XL chest 165.

- 2026-10-02: Truoc khi lam: backup assets/config/layout/locales/sections/snippets/templates vao _backup_before_live_pull_20261002/, pull LIVE #183186358588. Khac biet: header-group.json, overlay-group.json (settings LIVE), snippets/addon-gift-box.liquid MAT 1 dong local chua tung push LIVE (`if (window.__myprintsyPdpUpdating || window.__myprintsyEddPlacing) return;` trong packObserver) - con trong backup.
- 2026-10-02: Size Guide (bang cloak) mo rong theo product_type (downcase): cloak, ultra cloak, hoodie(s), jogger(s), bomber jacket(s), zip hoodie(s). Sua main-product.liquid + product-variant-picker.liquid. Push DEV. Check `scripts/check-size-guide-types.js` PASS: Ultra Cloak/Jogger/Bomber/Zip Hoodie modal mo 65-227ms, 9 rows, Esc dong; Mug/T-Shirt/Wearable Blanket Hoodie 0 opener. Store chua co SP type "Hoodie" thuan. LIVE chua push.
- 2026-10-02: Them type `hoodie 3d` (6 SP, vd siren-hoodie-1420) vao danh sach Size Guide. Push DEV, check PASS (siren-hoodie-1420 modal 187ms, 9 rows). LIVE chua push.
- 2026-10-02: Size guide Zip Hoodie dung bang rieng (SIZE/LENGTH/CHEST, S..5XL theo bang NCC SM/MD/LG -> S/M/L, khop 8 size SP ban). Cac type khac giu bang cloak 4 cot. size-guide-cloak.liquid: sgc_cols + loop (1..sgc_cols.size). Push DEV, check PASS (zip 8 rows dung so cm). LIVE chua push.
- 2026-10-02: Hoodie 3D dung chung bang Zip Hoodie (SIZE/LENGTH/CHEST S..5XL; 6 SP hoodie 3d deu ban S..5XL). Push DEV, check PASS (siren-hoodie-1420 8 rows dung so cm). LIVE chua push.
- 2026-10-02: Bomber Jacket bang rieng LENGTH/CHEST/WAIST S..3XL (SP chi ban S..3XL, bo 4XL NCC). Jogger bang rieng WAIST(range a~b)/INSEAM/RISE/OUTSEAM XS..5XL; NCC chi SM..2XL -> suy XS,3XL,4XL,5XL theo quy luat inch (waist +2in, inseam/outseam +1in, rise 10/10/11/11/11 -> XS 10, 3-5XL 12). Push DEV, check PASS. LIVE chua push.
- 2026-10-02: Ultra Cloak bang rieng CHEST/FULL SLEEVE/SLEEVE CUFFED/LENGTH XS..5XL; NCC SM..5XL -> suy XS theo inch (chest -1in=55.9, sleeve -0.5in=74.9, cuffed -0.5in=67.3, length -1in=99.1). Cloak (type cu) van bang cloak cu. Push DEV, check PASS. LIVE chua push.
- 2026-10-02: **Push LIVE** #183186358588 (--allow-live --only main-product, product-variant-picker, size-guide-cloak). Truoc push: pull LIVE 3 file -> khong doi tu luc pull. Check LIVE PASS (5 type mo modal 87-125ms, dung so; 3 type khac 0 opener). Git: copy theme + scripts(.js) + docs + .cursor/rules + shopify-gift-box-discount (bo node_modules) vao D:\Shoppify\myprintsy_github_shopify, branch main, commit 0aa8ab2. Chua co remote GitHub.
- 2026-10-02: Gan remote origin https://github.com/KieuLoc/Myprintsy_Shopify.git (repo PUBLIC) cho D:\Shoppify\myprintsy_github_shopify, push main (7b3d20e). Tu gio lam viec trong repo nay.
- 2026-10-03: Anh huong dan do rieng tung type (user cung cap): size-guide-zip-hoodie/hoodie-3d/ultra-cloak/bomber-jacket/jogger.jpg (resize <=800px JPG 37-80KB). size-guide-cloak.liquid: case sgc_type chon sgc_img/w/h/alt; Cloak cu giu size-guide-cloak.jpg. Sua trong repo D:\Shoppify\myprintsy_github_shopify (sync sang thu muc cu). Push DEV, check PASS (moi type dung anh, naturalWidth>0). LIVE chua push.
- 2026-10-03: **Push LIVE** #183186358588: size-guide-cloak.liquid + 5 anh size guide. Truoc push: snippet LIVE == commit truoc. Check LIVE PASS (5 type dung anh, modal 96-157ms).
