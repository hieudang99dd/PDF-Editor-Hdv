# Backend API cho PDF Hub (FastAPI + PyMuPDF)

Đây là Backend xử lý nén PDF sử dụng thuật toán hiện đại (PyMuPDF - thuật toán dọn dẹp rác, nén stream và tối ưu hóa hình ảnh). 

Vì Github Pages chỉ hỗ trợ chạy các tệp tĩnh (HTML/CSS/JS) ở trình duyệt (Frontend), nên để thực hiện được thao tác xử lý tệp phức tạp bằng thuật toán tiên tiến, bạn cần chạy Backend này trên máy chủ của mình (hoặc Localhost).

## Yêu cầu
- Python 3.8 trở lên.

## Cách cài đặt và chạy (Localhost)

**1. Mở Terminal (Command Prompt / PowerShell) và trỏ vào thư mục `backend` này.**

**2. Cài đặt các thư viện yêu cầu:**
```bash
pip install -r requirements.txt
```

**3. Khởi động Backend Server:**
```bash
uvicorn main:app --reload --port 8000
```

**4. Sử dụng:**
Quay lại trang `index.html` của bạn, chọn chức năng **Nén PDF**. 
Lúc này, giao diện frontend sẽ tự động gửi file PDF qua cổng `http://localhost:8000/compress` để Backend sử dụng AI/Thuật toán nén lại và trả về file nhỏ hơn với chất lượng giữ nguyên.
