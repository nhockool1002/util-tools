/**
 * Tiêu đề & mô tả meta (tiếng Việt) cho từng công cụ — tối ưu tìm kiếm & chia sẻ.
 */
export const toolsSeo: Record<
  string,
  { title: string; description: string }
> = {
  "/tools/bitmap-encoder": {
    title: "ISO 8583 Bitmap Encoder / Decoder",
    description:
      "Mã hóa và giải mã bitmap trường ISO 8583 trực tuyến. Hỗ trợ kiểm tra bit, nhập hex, phân tích cấu trúc thông điệp thanh toán.",
  },
  "/tools/tlv-decoder": {
    title: "EMV TLV Decoder",
    description:
      "Giải mã cấu trúc TLV (Tag-Length-Value) chuẩn EMV/IC chip. Dán hex, xem tag, độ dài và giá trị theo từng cấp.",
  },
  "/tools/kcv-calculator": {
    title: "KCV Calculator – Key Check Value",
    description:
      "Tính KCV (Key Check Value) cho khóa mã hóa. Kiểm tra khóa DES/AES, hỗ trợ làm việc với banking và HSM.",
  },
  "/tools/base64": {
    title: "Base64 Encode / Decode",
    description:
      "Mã hóa và giải mã Base64 nhanh, an toàn trên trình duyệt. Hữu ích cho API, JWT và dữ liệu nhị phân dạng text.",
  },
  "/tools/color-palettes": {
    title: "Color Palettes – Bảng màu",
    description:
      "Tạo và khám phá bảng màu cho UI/UX. Sao chép mã hex, RGB; hỗ trợ thiết kế giao diện và chủ đề Dark/Light.",
  },
  "/tools/convert-case": {
    title: "Convert Case – Đổi kiểu chữ",
    description:
      "Đổi chữ hoa, chữ thường, Title Case, camelCase, snake_case và nhiều định dạng khác cho văn bản và mã nguồn.",
  },
  "/tools/font-converter": {
    title: "Font Converter – Đổi định dạng font",
    description:
      "Chuyển đổi font giữa các định dạng phổ biến trực tuyến. Tiện cho thiết kế và nhúng web.",
  },
  "/tools/hash-generator": {
    title: "Hash Generator – MD5, SHA",
    description:
      "Tạo hash MD5, SHA-1, SHA-256, SHA-512 từ văn bản hoặc file. Công cụ cho developer và kiểm tra toàn vẹn dữ liệu.",
  },
  "/tools/jwt-decoder": {
    title: "JWT Decoder",
    description:
      "Giải mã JWT (JSON Web Token): header, payload và chữ ký. Không gửi token lên server — xử lý local trên trình duyệt.",
  },
  "/tools/qr-code": {
    title: "QR Code Generator",
    description:
      "Tạo mã QR từ URL, văn bản hoặc dữ liệu tùy chỉnh. Tải ảnh QR chất lượng cao cho in ấn và marketing.",
  },
  "/tools/regex-tester": {
    title: "Regex Tester",
    description:
      "Kiểm tra biểu thức chính quy (Regular Expression) với văn bản mẫu, highlight khớp và cờ (flags) tùy chọn.",
  },
  "/tools/responsive-test": {
    title: "Responsive Test – Xem trước đa kích thước",
    description:
      "Kiểm tra giao diện responsive: nhập URL và xem trước trên nhiều kích thước màn hình (mobile, tablet, desktop).",
  },
  "/tools/compare-file": {
    title: "Compare File – So sánh file",
    description:
      "So sánh hai file văn bản: diff trực quan, thêm/xóa/dòng thay đổi. Hữu ích cho code review và kiểm chứng nội dung.",
  },
  "/tools/find-in-file": {
    title: "Find in File – Tìm trong file",
    description:
      "Tìm nhiều từ khóa trong file hoặc văn bản dán vào; highlight kết quả, xem trước nhanh không cần cài phần mềm.",
  },
  "/tools/screen-recorder": {
    title: "Screen Recorder – Ghi màn hình",
    description:
      "Ghi màn hình, tab hoặc cửa sổ trực tiếp trên trình duyệt. Tải video, hỗ trợ demo và tài liệu hướng dẫn.",
  },
};
