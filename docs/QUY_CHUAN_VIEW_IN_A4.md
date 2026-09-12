# QUY CHUẨN VIEW IN A4 — CV HTML

> Source of Truth của dự án: quy chuẩn thiết kế layout CV khổ A4 + cơ chế preview
> tờ A4 kèm số trang + in PDF. Mục tiêu: **view trên web = bản in thật**.
> File này là tài liệu duy nhất — mọi thay đổi layout/in phải tuân theo đây.

---

# PHẦN A — THIẾT KẾ LAYOUT A4

## A1. Nguyên tắc cốt lõi

| # | Nguyên tắc | Chi tiết |
|---|---|---|
| 1 | **View = Print** | Cái thấy trên màn hình phải y hệt cái in ra (A4 dọc). Không có trạng thái "chỉ trên màn hình" — ngoại lệ duy nhất: nút Tải PDF (ẩn khi in). |
| 2 | **Toàn vẹn dữ liệu** | Không cắt xén, không ẩn, không `text-overflow: ellipsis`. Nội dung dài → tăng số trang, không ép vừa 1 trang. |
| 3 | **Luồng tài liệu tự nhiên** | Grid/Flex/flow. Tuyệt đối không `position: absolute` cho dữ liệu động. |
| 4 | **Đồng nhất** | Dùng chung CSS variables (`--sp-*`, `--fs-*`, `--lh-*`). Không ghi đè cục bộ bằng số tự do. |
| 5 | **Đơn vị in chuẩn** | mm cho layout/spacing, pt cho font. Tránh px (boot script trang trí preview được dùng px). |
| 6 | **Mục tiêu in** | Chrome print to PDF: A4 dọc, scale 100%, tắt header/footer trình duyệt. |

## A2. Page setup & vùng in

```css
@page {
    size: A4 portrait;
    margin: 0;
}

.page {
    width: 210mm;
    padding: 12mm;          /* lề 4 cạnh */
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
}
```

| Thông số | Giá trị |
|---|---|
| Khổ giấy | A4 (210mm × 297mm) dọc |
| Lề trang | **12mm** (4 cạnh) |
| Vùng nội dung | **186mm × 273mm** |

Vì sao `@page margin: 0` + padding ở `.page`:
- Paged.js đọc `@page` để chia trang; margin 0 cho `.page` điền kín tờ, tự lo lề bằng padding.
- `box-decoration-break: clone` + boot script bù padding giúp lề lặp lại đúng ở trang bị tách.

## A3. Typography

```css
:root {
    --fs-name: 20pt;      /* họ tên */
    --fs-section: 11pt;   /* tiêu đề section (uppercase + accent) */
    --fs-entry: 10.5pt;   /* tiêu đề entry (chức danh, tên dự án) */
    --fs-base: 10pt;      /* body, bullet */
    --fs-meta: 8.5pt;     /* ngày tháng, phụ chú, số trang */
    --lh-tight: 1.15;     /* họ tên */
    --lh-normal: 1.3;     /* tiêu đề */
    --lh-body: 1.4;       /* body */
}
```

- Không xuống dưới **9pt** cho nội dung, dưới **8pt** cho meta.
- Nếu tràn trang: làm theo thứ tự B3 (dưới) trước khi nghĩ đến giảm font.

## A4. Spacing

```css
:root {
    --sp-1: 0.5mm;   /* giữa các dòng cùng nhóm */
    --sp-2: 1mm;     /* label → giá trị */
    --sp-3: 2mm;     /* giữa các mục nhỏ */
    --sp-4: 3mm;     /* tiêu đề section → body */
    --sp-6: 4.5mm;   /* giữa các entry */
    --sp-8: 6mm;     /* giữa các section */
}
```

1. **Chỉ `margin-bottom`** (kèm `:last-child` reset nếu cần). Không `margin-top` — tránh cộng dồn ở điểm cắt trang.
2. **Không số tự do**: cấm `margin: 7px`, `<br>` đệm, padding đệm.

## A5. Layout

| Layout | Khi nào dùng |
|---|---|
| **Grid** | Chia cột cấu trúc (skills 2 cột, meta-grid): `repeat(2, minmax(0, 1fr))` |
| **Flex** | Nhóm cùng dòng: entry-head (tiêu đề + thời gian), contact line. `align-items: flex-start` |
| **Normal flow** | Đoạn văn, bullet list |

Cấm: margin âm, dấu cách căn cột, `<br>` đệm, `position: absolute` cho block động.
Text dài: `overflow-wrap: anywhere; min-width: 0` cho flex con.

## A6. Phân trang (fragmentation)

| Mục đích | Class | CSS |
|---|---|---|
| Khối không được tách (entry, header) | `.section--atomic` | `break-inside: avoid-page` |
| Nội dung dài cho phép tách | `.section--flow` | `break-inside: auto; orphans: 3; widows: 3` |
| Tiêu đề không mồ côi cuối trang | `.section-opening` | `break-after: avoid-page` |
| Ép sang trang mới | `.break-page` (div rỗng) | `break-before: page` |

Quy tắc:
1. **Không gắn `.section--atomic` cho khối lớn hơn 1 trang** — engine bỏ qua `avoid`, mất kiểm soát.
2. Entry (1 công ty / 1 dự án) là đơn vị atomic. Section chứa nhiều entry thì cho tách **giữa** các entry.
3. Paged.js strip padding tại điểm tách → boot script bù `12mm !important` (xem B2).

## A7. Dữ liệu

- Toàn bộ nội dung CV nằm ở `src/_data/resume.js` — sửa file này, không đụng template.
- **Section rỗng tự ẩn**: data bỏ trống (`[]` / `""`) → template không render section đó.
- Tuyệt đối không render: `null`, `undefined`, `NaN`. Không dùng `overflow: hidden` che dữ liệu.

## A8. Thứ tự xử lý khi tràn trang

1. Kiểm tra dữ liệu bất thường (quá dài, sai format).
2. Bỏ `margin-top` dư → chuyển `margin-bottom`.
3. Đưa `line-height` về token chuẩn.
4. Bỏ `.section--atomic` trên khối quá lớn.
5. Cho phép tách tự nhiên giữa các entry.
6. Tách section bằng `.break-page` (chủ động).
7. Giảm font — chỉ khi đang lớn hơn chuẩn.
8. **Không bao giờ cắt/ẩn dữ liệu.**

## A9. Naming convention

Class semantic bắt buộc:

```text
.cv-header  .cv-name  .cv-job-title  .cv-contact
.cv-section  .cv-section-title
.entry  .entry-head  .entry-title  .entry-sub  .entry-period  .entry-highlights
.skills-grid  .skill-group  .meta-grid  .cert-list
.section--atomic  .section--flow  .section-opening  .break-page  .text-meta
```

Class cấm: theo tọa độ/giá trị (`.ml-10`, `.left-20`, `.block-1`…).

---

# PHẦN B — PREVIEW A4 & SỐ TRANG (PAGED.JS)

## B1. Nguyên lý & cách nối vào dự án

Paged.js (`paged.polyfill.js`) đọc rule `@page` (size, margin) của chính trang để
tự chia nội dung thành các hộp `.pagedjs_page` đúng khổ vật lý. Mỗi hộp map 1:1
sang 1 tờ giấy khi in. Số trang là **DOM thật** nên được in theo — preview và
bản in không lệch nhau.

**Self-host, không CDN**: `pagedjs` là dependency trong `package.json`.
Build hook trong `eleventy.config.js` (event `eleventy.after`) copy
`node_modules/pagedjs/dist/paged.polyfill.js` → `_site/vendor/`.
Template load `/vendor/paged.polyfill.js` + boot script inline (cuối `src/index.njk`).

Nâng cấp version: `npm install pagedjs@<version>` → phải test lại phân trang + số trang.

## B2. Boot script làm gì

| # | Việc | Chi tiết |
|---|---|---|
| 1 | Poll `.pagedjs_page` mỗi 150ms | Chờ phân trang **ổn định** (3 lần liên tiếp không đổi số trang) rồi mới stamp — tự re-stamp nếu nội dung đổi |
| 2 | Gắn CSS preview **SAU** khi phân trang xong | Nền xám, tờ trắng + shadow, margin giữa các tờ. Bắt buộc tiêm sau (bẫy B4.1) |
| 3 | Stamp số trang | `.preview-page-number` vào mỗi tờ, nhãn `1 / n` — đổi ở hàm `pageLabel` |
| 4 | Bù padding điểm tách trang | `[data-split-from]` / `[data-split-to]` được bù `12mm !important` (khớp padding `.page` — đổi lề thì đổi cả hai) |
| 5 | Floating button **Tải PDF** | `position: fixed` góc phải-dưới, chỉ hiển thị màn hình (`@media print` ẩn), gọi `window.print()`. Phải append **sau** khi phân trang xong — element nằm ngoài body trước đó sẽ bị paged.js cuốn vào nội dung |
| 6 | Fallback self-host hỏng (file vendor thiếu) | Sau 4s không có `.pagedjs_page` và không có `window.Paged` → gắn CSS giả lập tờ A4 cho `.page` + vẫn có nút Tải PDF, trang vẫn xem được |

## B3. In PDF

Nhấn nút **Tải PDF** (hoặc Ctrl/Cmd+P) → A4, scale **100%**, tắt header/footer
trình duyệt. Mỗi `.pagedjs_page` = 1 tờ; số trang in ra y hệt màn hình.

## B4. Bẫy đã gặp (quan trọng)

1. **Paged.js "bóc" `@media print`**: polisher làm phẳng khối `@media` thành rule
   toàn cục nếu CSS có mặt lúc nó chạy → **cấm đặt `@media screen/print` trong
   `resume.css`**. Toàn bộ CSS trang trí preview nằm trong boot script, tiêm sau
   khi phân trang xong.
2. **Padding bị strip ở điểm tách trang**: paged.js set `padding-top: unset` cho
   fragment — ngược với `box-decoration-break: clone`. Boot script bù `12mm !important`
   cho cả hai đầu.
3. **Thứ tự script**: script động mặc định async. Nếu thêm script phải chạy
   trước/sau paged.js → set `async = false`.
4. **Vị trí số trang `bottom: 4mm`**: an toàn vì dải lề 12mm dưới trang luôn
   trống. Đổi padding `.page` thì chỉnh theo.

---

# CHECKLIST KIỂM THỬ

- [ ] Section rỗng → ẩn hoàn toàn, không tiêu đề mồ côi.
- [ ] Dữ liệu cực dài (bullet nhiều dòng, tên dài) → tự xuống dòng, không vỡ cột.
- [ ] Entry nằm đúng cuối trang → nguyên khối sang trang sau.
- [ ] Trang bị tách giữa section → lề 12mm lặp lại đúng (padding bù).
- [ ] Preview (paged.js) và Print to PDF đồng nhất, số trang y hệt.
- [ ] In: A4, scale 100%, tắt header/footer.
- [ ] Nút Tải PDF: hiển thị trên màn hình, ẩn hoàn toàn khi in.
- [ ] Không có `@media` block nào trong `resume.css` (bẫy B4.1).
- [ ] Không px trong `resume.css` (px chỉ nằm ở boot script preview), không inline style, không `<br>` đệm.
