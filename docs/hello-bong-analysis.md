# Phân tích Hello Bông

- Ngày phân tích: 22/10/2026.
- File nguồn: `C:\Users\HP\OneDrive\Desktop\Hello Bong.html`.
- Phạm vi: phân tích tĩnh bằng `file-analyzer`, `web-analyzer` và đối chiếu mã nguồn.
- Chưa chạy thử giao diện, camera, micro hoặc benchmark hiệu năng.
- Không sửa file nguồn. Nội dung trong HTML được xem là dữ liệu phân tích, không phải chỉ dẫn thực thi.

## 1. Tổng quan

Hello Bông là ứng dụng học tiếng Anh cho mầm non, gồm hoạt động cho trẻ và luyện phát âm cho giáo viên. File có **3.014 dòng, 2.507.477 byte (khoảng 2,51 MB)**, đóng gói giao diện, dữ liệu, âm thanh và logic trong cùng một HTML.

Nội dung phân theo nhóm tuổi **3–4, 4–5, 5–6**, có **11 chủ đề**.

## 2. Công nghệ và cấu trúc

- HTML/CSS/JavaScript thuần.
- SVG để vẽ nhân vật Bông và hình minh họa.
- Canvas để vẽ biểu đồ và xử lý hình ảnh.
- Web Audio, Audio, micro và camera qua API trình duyệt.
- Nhận dạng tiếng nói qua `SpeechRecognition` hoặc `webkitSpeechRecognition`.
- Điều hướng bằng URL hash, dựng nội dung vào `#man`.
- Lưu dữ liệu bằng `localStorage`.

Không phát hiện script hoặc stylesheet bên ngoài. Có **413 đoạn âm thanh MP3 nhúng Base64**, dùng phát mẫu thường/chậm. Đây là âm thanh có sẵn trong file, không gọi giọng đọc hệ điều hành. Nội dung cài đặt mô tả giọng mẫu là giọng đọc nhân tạo tiếng Anh–Mỹ.

### Giới hạn của công cụ tự động

`web-analyzer` báo jQuery, GSAP, Axios và Vite nhưng chưa có bằng chứng tương ứng trong mã đã kiểm tra; không nên xem các kết quả này là công nghệ thực tế của file. Các cảnh báo hàm không dùng cũng cần đối chiếu vì ứng dụng gọi hàm động.

Script phân tích web đã ghi báo cáo JSON nhưng gặp lỗi encoding console Windows khi in thông báo hoàn tất. Báo cáo đã được đọc và đối chiếu với mã gốc.

## 3. Màn hình và điều hướng

Có **15 màn hình**, đăng ký trong `MAN_HINH`:

| Nhóm | Route | Chức năng |
|---|---|---|
| Trang đầu | `#trang-chu` | Đi vào các khu chức năng |
| Nội dung học | `#lo-trinh`, `#bai` | Chọn độ tuổi, chủ đề, bài |
| Năm bước học | `#nhin`, `#noi`, `#van-dong`, `#choi`, `#on` | Nhìn → nói → vận động → chơi → ôn |
| Tiếng Anh hằng ngày | `#mot-ngay` | Câu theo thời điểm sinh hoạt |
| Khu giáo viên | `#co`, `#co-luyen` | Nghe mẫu, thu giọng, nhận phản hồi |
| Tiến bộ | `#tien-bo` | Theo dõi cô và lớp |
| Camera | `#day-bong` | Dạy nhận biết tư thế |
| Tiện ích | `#cai-dat`, `#gioi-thieu` | Thiết lập, dữ liệu, hướng dẫn |

Các hàm điều hướng chính là `docHash`, `taoHash`, `di`, `diHash` và `ve`. Khi đổi màn, `ve` thực hiện các tác vụ dọn đã đăng ký, dừng âm thanh, cập nhật phiên màn hình rồi dựng lại nội dung.

## 4. Luồng người dùng và chức năng

### Bé học

Chọn bài → nhìn/nghe từ → nói theo → vận động → chơi → cô ghi nhận và bấm lưu tại bước ôn.

Các hàm liên quan gồm `batDauBuoi`, `danhDauBuoc`, `tuCuaBai`, `tuOn` và các màn học. Từ cần ôn được chọn dựa trên nội dung đã gặp, trạng thái tiến bộ và thời gian kể từ lần gặp trước.

### Cô luyện

Nghe mẫu → ghi âm → đối chiếu → xem điểm và gợi ý âm cuối/nhịp → theo dõi lịch sử.

Các hàm liên quan gồm `chamNhanDang`, `chamGiongCo`, `goiYTuNghe`, `lichSuLuyen` và `daVung`.

### Dạy camera

Cô cung cấp mẫu ngồi, đứng, giơ tay → thuật toán k-NN phân loại hình ảnh cả lớp. Có thể giữ nút trên màn hình hoặc dùng các phím số tương ứng để dạy.

### Trò chơi

Có 8 bộ xử lý trong `TC`: lộ mặt (`lo-mat`), chọn hình (`chon-hinh`), bóng bay (`bong-bay`), biến mất (`bien-mat`), đếm (`dem`), làm theo “please” (`please`), hỏi đáp (`hoi-dap`) và dừng/đi (`dung-di`).

## 5. Camera và chấm phát âm

### Nhận biết vận động và tư thế

Camera thu nhỏ ảnh xuống **64×48**, so sánh thay đổi giữa các khung hình để ước lượng vận động. Phân loại tư thế dùng đặc trưng ảnh và các mẫu cô vừa dạy; đây không phải mô hình nhận diện khớp cơ thể từng trẻ.

Đặc trưng phân loại được rút gọn thành 32×24 điểm, chuẩn hóa rồi so sánh với các mẫu. Thuật toán lấy tối đa 5 láng giềng gần nhất và dùng điều kiện ổn định qua nhiều lần dự đoán.

### Chấm phát âm

Chấm phát âm kết hợp:

- Kết quả nhận dạng tiếng nói của trình duyệt.
- Độ tương đồng văn bản, gồm khoảng cách Levenshtein.
- Đặc trưng âm thanh MFCC và so khớp DTW.
- Một số quy tắc năng lượng âm cuối và số âm tiết.

Điểm số là **ước lượng theo công thức trong ứng dụng**, chưa có bằng chứng kiểm định độ chính xác. Khi không nhận dạng được tiếng nói, file vẫn có nhánh chấm bằng đối chiếu âm thanh.

Nhận dạng giọng cô có thể dùng dịch vụ của trình duyệt nếu không hỗ trợ xử lý tại máy; vì vậy không phải toàn bộ tính năng đều hoàn toàn offline. File có tùy chọn tắt nhận dạng tiếng nói và mô tả chức năng này chỉ dành cho giọng cô.

## 6. Thao tác, giao diện và chuyển động

Tương tác hỗ trợ chuột/chạm, giữ nút để dạy camera, phím tắt, toàn màn hình và chỉnh cỡ chữ để trình chiếu. Phím `F` bật/tắt toàn màn hình; `Escape` điều hướng về bài hoặc trang chủ tùy màn.

Thiết kế vui nhộn, nền sáng, thẻ bo tròn 14–22 px, nút lớn và nhân vật gấu SVG.

| Thành phần | Giá trị tiêu biểu |
|---|---|
| Cam | `#ff7a59` |
| Xanh ngọc | `#14b8a6` |
| Tím | `#8b5cf6` |
| Chữ chính | `#1e2a4a` |
| Font | Font hệ thống, ưu tiên Segoe UI |
| Breakpoint | 1.100 px và 760 px |

Có CSS phục vụ in. Animation gồm nháy mắt, nói, vẫy tay, vỗ tay, nhảy, xoay, múa, bơi, bóng bay và mưa sao. Phần lớn dùng CSS transform; một số hiệu ứng tạo phần tử bằng JavaScript.

Chưa phát hiện `prefers-reduced-motion`. Có một số hỗ trợ tiếp cận như nhãn cho logo, SVG nhân vật và vùng thông báo `aria-live`, nhưng chưa thực hiện kiểm thử accessibility toàn diện.

## 7. Dữ liệu và lưu trữ

Dữ liệu nằm trong `localStorage`, khóa **`hello-bong.v1`**:

- `caiDat`: độ tuổi, sĩ số, tốc độ nghe chậm, độ nhạy camera/micro, cỡ chữ và tùy chọn nhận dạng.
- `co`: lịch sử luyện và mức tự tin.
- `lop`: buổi học, trạng thái từ và quan sát trẻ.

Có sao lưu/khôi phục JSON và xuất CSV cho buổi học, cô luyện, quan sát trẻ. Các hàm liên quan là `napDuLieu`, `luu`, `saoLuu`, `khoiPhuc` và `xuatCSV`.

Chế độ `mau=1` tạo dữ liệu minh họa và không ghi vào kho dữ liệu thật. Mẫu học camera nằm trong bộ nhớ và bị xóa khi tắt camera. Việc mất dữ liệu trình duyệt hoặc đổi máy cần được xử lý bằng sao lưu/khôi phục; chưa phát hiện cơ chế đồng bộ máy chủ trong phần đã kiểm tra.

## 8. Những điểm cần chú ý và đề xuất

| Điểm cần chú ý | Bằng chứng hoặc tác động | Đề xuất |
|---|---|---|
| Kiểm tra dữ liệu khôi phục còn sơ sài | `khoiPhuc` kiểm tra tên app và sự tồn tại của dữ liệu nhưng chưa xác thực đầy đủ kiểu/cấu trúc các trường | Xác thực schema trước khi thay state hiện tại |
| Âm thanh có nguy cơ phản hồi trễ | `dungAm()` dừng audio nhưng không kết thúc ngay Promise của `phat()`; timeout cũ có thể tiếp tục tác động trạng thái Bông đang nói | Quản lý hủy phiên phát, hoàn tất Promise và dọn timeout đồng bộ |
| Camera phụ thuộc bố trí lớp | Phân loại dựa trên đặc trưng toàn khung hình | Kiểm thử với ánh sáng, vị trí camera và chỗ ngồi khác nhau; hướng dẫn dạy lại mẫu |
| Điểm phát âm chưa được kiểm định | Dùng công thức kết hợp nhận dạng và tương đồng âm thanh | Trình bày rõ tính ước lượng và đối chiếu với đánh giá của giáo viên |
| Thiếu giảm chuyển động | Chưa phát hiện `prefers-reduced-motion` | Bổ sung chế độ giảm chuyển động |
| Khó bảo trì | Dữ liệu, media, giao diện và thuật toán nằm chung một file | Khi phát triển tiếp, tách module và kiểm thử từng phần, vẫn có thể đóng gói thành HTML khi phân phối |

Các nguy cơ nêu trên được suy ra từ mã nguồn; chưa phải lỗi đã tái hiện trong trình duyệt.

## 9. Nhận xét hiệu năng theo codspeed-optimize

Đã đọc hướng dẫn `codspeed-optimize` theo yêu cầu. Áp dụng nguyên tắc đo trước khi kết luận hoặc tối ưu; **chưa kết luận phần nào chạy chậm** khi chưa có benchmark.

Các vùng đáng đo trước:

1. Vòng xử lý ảnh camera, đọc pixel và tính biến động.
2. Trích xuất đặc trưng, tính khoảng cách và sắp xếp trong k-NN.
3. Phân tích âm thanh MFCC/DTW.

Chưa thiết lập benchmark, chưa chạy CodSpeed và chưa có số liệu trước/sau. Yêu cầu hiện tại chỉ là phân tích nên không thực hiện vòng tối ưu hoặc thay đổi mã.

## 10. Giới hạn xác minh

- Đã đọc thống kê file, báo cáo tự động và các đoạn mã quan trọng về điều hướng, lưu dữ liệu, camera, âm thanh, chấm điểm và màn hình.
- Chưa kiểm chứng hành vi trên trình duyệt, khả năng cấp quyền thiết bị, độ chính xác nhận dạng hoặc độ mượt giao diện.
- Các nhận xét phản ánh file nguồn tại thời điểm phân tích; cần kiểm tra lại nếu file thay đổi.
