# Recipe Crawler 🍳

Hệ thống Web Scraper chuyên dụng để thu thập dữ liệu công thức nấu ăn từ các trang web ẩm thực lớn (như Cookpad, Cooky, Beptruong...), phục vụ cho việc xây dựng Vector Database và tính năng tìm kiếm công thức cho dự án game.

## ✨ Tính năng nổi bật

- **Kiến trúc Modular (OOP):** Dễ dàng mở rộng và thêm các trang web mới chỉ bằng cách override các CSS Selectors.
- **Cơ chế Anti-Ban mạnh mẽ:** 
  - Sử dụng `puppeteer-extra-plugin-stealth` để vượt qua Cloudflare/Bot Detection.
  - Tự động xoay vòng trình duyệt (Batch Rotation) sau mỗi X sản phẩm để làm sạch cache/cookies.
  - Giả lập hành vi người dùng (cuộn trang ngẫu nhiên, thời gian nghỉ ngẫu nhiên).
- **Tối ưu hiệu năng:** Chặn tải hình ảnh, font, stylesheet để tiết kiệm băng thông và tăng tốc độ cào.
- **Cơ chế Resume (Quét tiếp tục):** Tự động nhận diện các URL đã cào để bỏ qua, giúp tiết kiệm thời gian và tài nguyên khi chạy lại.
- **Quản lý dữ liệu JSON:** Lưu trữ cấu trúc theo từng trang web tại thư mục `data/[site_name]`.

## 🏗️ Cấu trúc thư mục

```text
crawler-recipes/
├── src/
│   ├── core/           # Nhân cốt lõi (Browser management, Base classes, Utils)
│   ├── sites/          # Các module scraper cho từng trang web cụ thể
│   └── config/         # Quản lý biến môi trường
├── data/               # Nơi lưu trữ file JSON kết quả (all_urls.json, raw_recipes.json)
├── index.js            # Entry point của ứng dụng
├── .env                # File cấu hình (Limits, Delays, Proxy)
└── package.json        # Danh sách dependencies
```

## 🚀 Cài đặt

1. **Clone repository:**
   ```bash
   git clone https://github.com/thinkfirstailater/crawler-recipes.git
   cd crawler-recipes
   ```

2. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

3. **Cấu hình môi trường:**
   Tạo file `.env` từ mẫu `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Điều chỉnh các thông số `PAGINATION_LIMIT`, `SCRAPE_LIMIT`, `BATCH_SIZE` cho phù hợp với nhu cầu.*

## 🛠️ Sử dụng

Để chạy tool cào dữ liệu cho một trang web cụ thể (mặc định là `cookpad`):

```bash
# Chạy mặc định
node index.js

# Chạy cho một site cụ thể
node index.js --site=cookpad
```

## 📝 Quy trình hoạt động

Hệ thống hoạt động theo 2 Phase:

1. **Phase 1 (Get Links):** Truy cập các trang danh sách (Pagination) để thu thập tất cả URL công thức và lưu vào `all_urls.json`.
2. **Phase 2 (Scrape Detail):** Đọc từ `all_urls.json`, kiểm tra xem món nào chưa có trong `raw_recipes.json` thì tiến hành cào chi tiết.

## ⚠️ Lưu ý

- File dữ liệu công thức (`data/`) và file `.env` đã được cấu hình trong `.gitignore` để tránh đẩy dữ liệu rác lên server.
- Nên sử dụng `PROXY_URL` trong file `.env` nếu bạn dự định cào số lượng lớn (> 5000 món) để tránh bị khóa IP tạm thời.

## 🤝 Đóng góp

Nếu bạn muốn thêm một trang web mới:
1. Tạo file mới trong `src/sites/` (ví dụ: `CookyScraper.js`).
2. Kế thừa từ `BaseScraper`.
3. Override hàm `getLinksOnPage` và `getRecipeDetails`.
4. Đăng ký module trong `index.js`.

