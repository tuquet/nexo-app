instructionI. Kiến trúc và Phân tách Logic (Core Logic)
Tách Agent Core khỏi UI: Logic đọc, phân tích, và đánh giá quy định phải là các Module/Service độc lập (ví dụ: đặt trong folder core/services), không dính vào Component React.

Custom Hooks: Đóng gói việc truy cập dữ liệu và thực thi quy tắc vào các Custom Hooks (ví dụ: useRegulations, useRuleEvaluator) để tái sử dụng trong các Component.

Quản lý Trạng thái: Sử dụng thư viện quản lý trạng thái (Redux/Zustand) để lưu trữ Rule Definitions và Evaluation Results làm nguồn dữ liệu đáng tin cậy.

II. Xử lý Dữ liệu và Cấu hình
TypeScript Model: Định nghĩa các TypeScript Interfaces/Types rõ ràng cho cấu trúc quy định (IRule, IEvaluationResult).

Abstraction Nguồn Dữ liệu: Tách biệt logic lấy dữ liệu (API, JSON file) bằng cách sử dụng Service Layer hoặc Interface để dễ dàng thay đổi nguồn dữ liệu.

Configuration over Hardcoding: Các ngưỡng giá trị, danh sách loại trừ và tham số quy tắc phải được đặt trong file cấu hình (JSON/YAML), không code cứng trong logic.

III. Khả năng Mở rộng (Extensibility)
Strategy Pattern: Sử dụng Strategy Pattern trong Rule Evaluator để dễ dàng thêm các loại quy tắc kiểm tra mới mà không thay đổi lõi.

Component Composition: Thiết kế các Component hiển thị kết quả đánh giá cho phép children hoặc props tùy chỉnh để người dùng có thể mở rộng UI.

Tuân thủ SOLID: Đặc biệt chú trọng Single Responsibility (SRP) và Open/Closed Principle (OCP).

IV. Chất lượng Code
TypeScript Bắt buộc: Sử dụng TypeScript nhất quán.

V. Ứng Dụng Dành Cho Người Việt Nam