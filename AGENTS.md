# AGENTS.md — CV cá nhân (ndanhkhoi.github.io)

## Dự án

CV cá nhân dạng **HTML print-first khổ A4**, build tĩnh bằng **Eleventy** (SSG).

- Branch `main` = code nguồn.
- GitHub Actions build → push `_site` sang branch `gh-pages` (orphan, chỉ chứa HTML build).
- GitHub Pages phục vụ từ `gh-pages`, thư mục gốc `/`.

## Cấu trúc

- `src/_data/resume.js` — **TOÀN BỘ dữ liệu CV** (sửa thông tin cá nhân ở file này, không đụng layout; section trống tự ẩn)
- `src/index.njk` — template CV + boot script Paged.js (preview A4 + số trang + nút Tải PDF)
- `src/css/resume.css` — toàn bộ style tài liệu (theo quy chuẩn A4 bên dưới)
- `docs/QUY_CHUAN_VIEW_IN_A4.md` — **quy chuẩn duy nhất** của dự án (source of truth):
  Phần A = thiết kế layout A4 (token `--sp-*/--fs-*/--lh-*`, phân trang
  `.section--atomic`/`.section-opening`/`.break-page`, chỉ `margin-bottom`, cấm
  `position: absolute` cho dữ liệu động, đơn vị mm/pt); Phần B = cơ chế preview
  A4 + số trang + các bẫy paged.js
- `.github/workflows/deploy.yml` — build & deploy tự động

## Quy ước kỹ thuật quan trọng

- **Paged.js self-host**: dependency npm `pagedjs`, build hook trong `eleventy.config.js`
  copy `paged.polyfill.js` → `_site/vendor/`. KHÔNG dùng CDN.
- **KHÔNG đặt `@media screen/print` trong `resume.css`** — bẫy paged.js flatten
  `@media` thành rule toàn cục (quy chuẩn Phần B, bẫy B4.1). Toàn bộ CSS trang trí
  preview nằm trong boot script `src/index.njk`, tiêm SAU khi phân trang xong.
- Padding `.page` (12mm) phải khớp `PAGE_PADDING_MM` trong boot script — đổi lề thì đổi cả hai.
- Output phải là HTML tĩnh thuần — không thêm client JS render nội dung (print tinh khiết).
- Chỉnh sửa nội dung: chỉ đụng `src/_data/resume.js`, không sửa template cho từng lần cập nhật.

## Lệnh hữu ích

- Dev: `npm run dev` → http://localhost:8080
- Build: `npm run build` → `_site/`
- Deploy: commit + push vào `main`, Actions tự build sang `gh-pages`.
- In PDF: mở trang web → Ctrl/Cmd+P → A4, scale 100%, tắt header/footer trình duyệt.
