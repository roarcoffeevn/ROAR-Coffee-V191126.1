# ROAR COFFEE® — Bilingual E-Commerce, B2B Green Coffee Portal & CMS

Nền tảng thương mại điện tử song ngữ (Tiếng Việt / English), ma trận cà phê nhân xanh B2B 27 cấu hình, bản đồ vệ tinh 10 vùng nguyên liệu cà phê Việt Nam, và hệ quản trị CMS (WordPress + WooCommerce + Shopee Seller Center).

---

## Bảo toàn 100% dữ liệu khi đẩy lên GitHub / Tải ZIP / Giải nén (100% Portable Data)

Toàn bộ dữ liệu (35+ sản phẩm, 27 cấu hình nhân xanh, Espresso & Espresso Gold tách biệt, 10 vùng trồng, 7 linh vật cá tính, 12 trang con, bài viết tạp chí, khuyến mãi, ảnh thư viện và cài đặt website) được đồng bộ theo 3 lớp:

1. **`data/roar_coffee.db` (Chế độ Single-File `DELETE`):** Không dùng WAL tách file (`-wal`/`-shm`), mọi thay đổi ghi thẳng vào tệp SQLite duy nhất.
2. **`data/roar-cms-snapshot.json` (Auto-Sync & Auto-Restore):** Mọi chỉnh sửa trong CMS Admin đều tự động ghi ra tệp JSON này. Khi khởi động lại ở bất kỳ máy mới nào sau khi clone/giải nén, nếu CSDL trống hoặc thiếu bảng, hệ thống tự động khôi phục 100% dữ liệu từ snapshot.
3. **`public/roar-snapshot.json` (Static Preview Fallback):** Tự động đi kèm trong thư mục `dist/` khi build, giúp storefront vẫn hiển thị đầy đủ sản phẩm, vùng trồng, bài viết và trang con ngay cả khi chạy chế độ tĩnh không có Node.js backend.

---

## Cài đặt & Chạy trên máy cá nhân (Local Setup)

Yêu cầu: **Node.js 20+**

```bash
# 1. Cài đặt thư viện
npm install

# 2. Chạy chế độ phát triển (Fullstack Express + Vite + SQLite trên cổng 3000)
npm run dev

# Hoặc chạy chế độ Production (tự động build dist/ trước khi khởi chạy)
npm start
```

Truy cập:
- Storefront: `http://localhost:3000`
- Quản trị CMS: `http://localhost:3000/admin`
- Tài khoản quản trị mặc định (môi trường demo):
  - Super Admin (12/12 quyền): `admin@roarcoffee.vn` / `RoarAdmin!2026`
  - Biên tập viên (Nội dung & Trang con): `editor@roarcoffee.vn` / `RoarEditor!2026`
