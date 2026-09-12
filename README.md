# CV - ndanhkhoi.github.io

CV cá nhân dạng **HTML print-first khổ A4**: preview trên web hiển thị đúng từng tờ
A4 kèm số trang, in ra PDF 1:1 với preview.

- **SSG**: [Eleventy](https://www.11ty.dev/) - build HTML tĩnh, không client JS render nội dung
- **Preview A4 + số trang**: [Paged.js](https://pagedjs.org/) (tiêm sẵn trong template)
- **Deploy**: GitHub Actions build → branch `gh-pages` → GitHub Pages

## Cấu trúc

| File | Vai trò |
|---|---|
| `src/_data/resume.js` | **Toàn bộ dữ liệu CV** - sửa thông tin ở đây |
| `src/index.njk` | Template CV + boot script preview A4 (số trang, nút PDF dropdown Tải/In) |
| `src/css/resume.css` | Style tài liệu theo quy chuẩn view-in A4 |
| `docs/QUY_CHUAN_VIEW_IN_A4.md` | Quy chuẩn duy nhất: thiết kế A4 + preview Paged.js + bẫy |

## Cập nhật CV

1. Sửa `src/_data/resume.js` (section bỏ trống sẽ tự ẩn khỏi trang).
2. Commit + push vào `main` → Actions tự build và deploy.

## Chạy local

```bash
npm install
npm run dev   # http://localhost:8080
```

## In / Tải PDF

Nhấn nút **PDF** góc phải-dưới: **Tải PDF** tải thẳng file `cv.pdf` (sinh tự động
mỗi lần deploy) về máy, **In PDF** mở hộp thoại in. Hoặc Ctrl/Cmd+P → A4, scale
**100%**, tắt header/footer trình duyệt. Số trang in ra y hệt preview.
