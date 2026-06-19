# 📝 QuizMaster Pro - Ứng dụng Luyện Đề Trắc Nghiệm

Dự án nhỏ giúp parse các file câu hỏi thô và hiển thị giao diện làm bài trắc nghiệm tối giản, hiện đại, chạy trực tiếp trên trình duyệt.

## 🚀 Hướng dẫn sử dụng nhanh

### Bước 1: Parse dữ liệu câu hỏi
Nếu bạn thay đổi hoặc cập nhật thêm các file đề thi trong thư mục `input/`, hãy chạy lệnh sau trong terminal để cập nhật dữ liệu vào `questions/`:
```bash
node parse.js
```

### Bước 2: Chạy ứng dụng web
Do ứng dụng sử dụng phương thức `fetch()` để đọc các file JSON cục bộ từ thư mục `questions/`, bạn cần mở trang web qua một **Local Web Server** để tránh lỗi bảo mật CORS của trình duyệt (Lỗi không cho phép đọc file cục bộ):

* **Cách đơn giản nhất (Sử dụng VS Code Live Server):**
  1. Mở thư mục dự án bằng VS Code.
  2. Cài đặt Extension **Live Server**.
  3. Click chuột phải vào file `main.html` và chọn **Open with Live Server**.

* **Hoặc sử dụng Python (Nếu đã cài đặt Python):**
  Chạy lệnh sau tại thư mục dự án:
  ```bash
  python -m http.server 8000
  ```
  Sau đó truy cập: `http://localhost:8000/main.html` trên trình duyệt.

* **Hoặc sử dụng Node.js (npx):**
  Chạy lệnh sau tại thư mục dự án:
  ```bash
  npx serve
  ```
  Sau đó truy cập địa chỉ localhost được cung cấp trên màn hình console.
