import { prisma } from "../src/lib/prisma";
import { indexKnowledgeEntry } from "../src/lib/ai/semantic-search";

const CLEAN_ENTRIES = [
  {
    categoryId: "cat-products",
    title: "Bảng giá dịch vụ Cắt tóc & Gội đầu cơ bản",
    content: `BẢNG GIÁ DỊCH VỤ CẮT TÓC & GỘI ĐẦU CƠ BẢN

1. CẮT TÓC THEO CẤP ĐỘ STYLIST:
- Cắt tóc Nữ (Women's Hair Cut):
  + Top Stylist (Thợ chính, kinh nghiệm lâu năm): 350.000đ
  + Senior Stylist (Thợ chính cao cấp): 290.000đ
  + Junior Stylist (Tài năng mới): 200.000đ
- Cắt tóc Nam (Men's Hair Cut):
  + Top Stylist: 200.000đ
  + Senior/Junior Stylist: 150.000đ
- Cắt tóc Mái (Bangs):
  + Top Stylist: 70.000đ
  + Senior/Junior Stylist: 50.000đ
- Cắt tóc Trẻ em (Kid's Cut):
  + Top Stylist: 250.000đ
  + Senior Stylist: 200.000đ
  + Junior Stylist: 150.000đ
- Cắt tỉa chỉnh sửa (Restyle Haircut):
  + Top Stylist: 250.000đ
  + Senior Stylist: 200.000đ
  + Junior Stylist: 150.000đ

*Ghi chú: Giá cắt đã bao gồm: tư vấn cắt, xả tóc, tạo kiểu sau khi cắt. Miễn phí kiểm tra da đầu, gội xả sạch 5-10 phút trước khi cắt.

2. CẮT TÓC BY FOUNDER / TECHNICAL DIRECTOR:
- Cắt tóc Nữ:
  + Minh Hy (Hair Creative Director Founder): 450.000đ
  + Quecavali (Technical Director): 350.000đ
- Cắt tóc Nam:
  + Minh Hy: 300.000đ
  + Quecavali: 200.000đ
- Cắt tóc Mái:
  + Minh Hy: 150.000đ
  + Quecavali: 100.000đ
- Cắt tóc Trẻ em:
  + Minh Hy: 350.000đ
  + Quecavali: 250.000đ

3. GỘI & TẠO KIỂU CƠ BẢN:
- Gội màu (Khử vàng cho tóc tẩy) - Purple Shampoo: 299.000đ
- Tạo kiểu (Sấy chải / uốn đơn / kẹp thẳng): 150.000đ - 200.000đ
- Gội nhanh (Làm sạch tóc) - Quick Shampoo: 85.000đ
- Bới tóc đi tiệc / Tết tóc: 300.000đ - 500.000đ`
  },
  {
    categoryId: "cat-products",
    title: "Dịch vụ Gội đầu thư giãn & Skincare",
    content: `DỊCH VỤ GỘI ĐẦU THƯ GIÃN & CHĂM SÓC DA MẶT (WASH & SKINCARE)

1. GỘI ĐẦU THƯ GIÃN & COMBO:
- Gội Đầu Thư Giãn | Wash (40 phút):
  + Sử dụng Dầu gội dưỡng tóc: 160.000đ
  + Sử dụng Dầu gội phục hồi: 210.000đ
  *Quy trình: Gội sạch 2 lần + Massage cổ, vai, tay + Sấy khô.
- Combo Thư Giãn | Relax (50 phút): 320.000đ
  *Quy trình: Gội sạch 2 lần + Rửa mặt, Đắp mặt nạ + Massage cổ, vai, tay + Sấy khô.
- Combo Chăm sóc | Care (65 phút): 420.000đ
  *Quy trình: Gội sạch 2 lần + Rửa mặt, Đắp mặt nạ, Tẩy da chết + Massage cổ, vai, tay + Sấy khô.
- Combo VIP | VIP (90 phút): 900.000đ
  *Quy trình: Gội sạch 2 lần + Rửa mặt, Đắp mặt nạ, Tẩy da chết + Massage cổ, vai, tay + Hấp dưỡng tóc + Sấy khô.
- Liệu Trình Thanh Lọc Da Đầu | Exfoliates the scalp (50 phút): 750.000đ
  *Quy trình: Gội sạch 2 lần + Tẩy tế bào chết da đầu + Dưỡng chất cho da đầu + Massage cổ, vai, tay + Sấy khô.

2. DỊCH VỤ FACE & WAX:
- FACE – Combo Làm Sạch + Dưỡng | Combo Skincare: 385.000đ
- Tẩy Tế Bào Da Chết Mặt | Facial Exfoliate: 230.000đ
- Đắp mặt nạ cho mặt | Gel Mask: 180.000đ
- Cạo Râu – Cạo Lông Mặt – Lấy Ráy Tai: 120.000đ (bao gồm cạo lông mặt, tỉa lông mày, cạo râu bằng dao lam riêng biệt)
- Wax Nách (2 bên): 150.000đ`
  },
  {
    categoryId: "cat-products",
    title: "Bảng giá Uốn & Duỗi Nữ theo Size",
    content: `BẢNG GIÁ DỊCH VỤ UỐN & DUỖI TÓC NỮ (WOMEN'S PERMING & STRAIGHTENING)

Dịch vụ được tính theo độ dài tóc tiêu chuẩn (S / M / L / XL):
- Size S: Tóc ngắn – tóc tém – pixie
- Size M: Độ dài tóc từ chạm tai trở xuống đến chạm xương vai
- Size L: Độ dài tóc qua vai đến chạm đỉnh ngực
- Size XL: Độ dài tóc qua đỉnh ngực

1. UỐN / DUỖI CƠ BẢN (Perm | Straightening Basic):
- Size S: 1.050.000đ
- Size M: 1.350.000đ
- Size L: 1.450.000đ
- Size XL: 1.550.000đ

2. UỐN / DUỖI CAO CẤP (Special Perm | Straight Collagen):
- Size S: 1.350.000đ
- Size M: 1.650.000đ
- Size L: 1.850.000đ
- Size XL: 2.050.000đ

3. UỐN / DUỖI CAO CẤP KÈM ĐIỀU TRỊ BẢO VỆ TÓC (Sử dụng dòng sản phẩm High-End / Vegan):
- Size S: 2.500.000đ
- Size M: 2.900.000đ
- Size L: 3.400.000đ
- Size XL: 3.600.000đ

4. CÁC DỊCH VỤ KHÁC:
- Uốn xoăn Hippie (Hippie Curls Perm): Phụ thu thêm +200.000đ vào giá dịch vụ uốn tương ứng.
- Làm phồng chân tóc | Duỗi thẳng chân tóc (Root Lift | Root Rebonding): 300.000đ - 500.000đ (ON TOP làm phồng đỉnh đầu: 400.000đ)
- Phá ngôi / Uốn & Duỗi mái / Xả bấm:
  + Phá ngôi mái: 100.000đ
  + Uốn & duỗi mái: 100.000đ
  + Xả bấm: 100.000đ
- Duỗi chân tóc (Root Straightening): 500.000đ - 700.000đ`
  },
  {
    categoryId: "cat-products",
    title: "Bảng giá chi tiết dịch vụ Nhuộm tóc theo Size",
    content: `BẢNG GIÁ DỊCH VỤ NHUỘM TÓC (HAIR COLORING)

Dịch vụ nhuộm được tính theo độ dài tóc tiêu chuẩn (S / M / L / XL):
- Size S: Tóc ngắn – tóc tém – pixie
- Size M: Độ dài tóc từ chạm tai trở xuống đến chạm xương vai
- Size L: Độ dài tóc qua vai đến chạm đỉnh ngực
- Size XL: Độ dài tóc qua đỉnh ngực

| Dịch vụ Nhuộm & Kỹ thuật | Size S | Size M | Size L | Size XL |
| :--- | :---: | :---: | :---: | :---: |
| Nhuộm cơ bản (Hair Coloring Basic) | 1.050.000đ | 1.350.000đ | 1.450.000đ | 1.550.000đ |
| Nhuộm cao cấp (Professional Hair Coloring) | 1.350.000đ | 1.650.000đ | 1.850.000đ | 2.050.000đ |
| Nhuộm cao cấp – kèm điều trị bảo vệ tóc (High-End / Vegan) | 2.600.000đ | 2.900.000đ | 3.400.000đ | 3.600.000đ |
| Nâng tone không tẩy (High-lift Color) | 400.000đ | 500.000đ | 700.000đ | 800.000đ |
| Tẩy tóc (Bleaching) | 900.000đ | 1.100.000đ | 1.400.000đ | 1.600.000đ |
| Phủ bóng (Hair gloss) | 1.200.000đ | 1.600.000đ | 2.000.000đ | 2.200.000đ |
| Khử màu đen & đỏ (Color Removal) | 1.100.000đ | 1.300.000đ | 1.500.000đ | 1.600.000đ |

*Các dịch vụ kỹ thuật khác (không tính theo size):*
- Khử màu | Tạo sắc tố màu cho tóc (Toner): 500.000đ – 600.000đ
- Tẩy chân tóc (Root Bleach): 900.000đ/lần
- Nhuộm chân (Root Touch-Up):
  + Độ dài từ 1 - 3cm: 400.000đ
  + Độ dài từ 4 - 7cm: 600.000đ
  *(Lưu ý: Giá nhuộm chân có thể cao hơn tùy lượng tóc thực tế)*`
  },
  {
    categoryId: "cat-products",
    title: "Bảng giá Tẩy tóc & Hiệu ứng màu Nữ theo Size",
    content: `BẢNG GIÁ DỊCH VỤ TẨY TÓC & NHUỘM HIỆU ỨNG NỮ (BLEACHING & EFFECT COLOR)

Dịch vụ được tính theo độ dài tóc tiêu chuẩn (S / M / L / XL):
- Size S: Tóc ngắn – tóc tém – pixie
- Size M: Độ dài tóc từ chạm tai trở xuống đến chạm xương vai
- Size L: Độ dài tóc qua vai đến chạm đỉnh ngực
- Size XL: Độ dài tóc qua đỉnh ngực

1. HIGHLIGHT FULL (Tẩy + nhuộm Highlight):
- Size S: 2.200.000đ
- Size M: 2.500.000đ
- Size L: 2.800.000đ
- Size XL: 3.100.000đ

2. HIDDEN LIGHT & CÁC KIỂU NHUỘM ĐẶC BIỆT KHÁC:
- Size S: 1.900.000đ
- Size M: 2.300.000đ
- Size L: 2.600.000đ
- Size XL: 2.800.000đ

3. BALAYAGE/OMBRE:
- Size M – L: 4.000.000đ - 5.000.000đ
- Size XL: 5.000.000đ - 6.000.000đ
*Thông tin tham khảo: Thời gian thực hiện từ 6h - 10h. Độ bền hiệu ứng: 6 tháng - 1 năm.

4. BLEACHING FULL HEAD (Tẩy cả đầu):
- Cấp độ Level 7.5 (Gam màu nâu khói -> 1 lần tẩy):
  + Size S: 900.000đ
  + Size M: 1.200.000đ
  + Size L: 1.500.000đ
- Cấp độ Level 8.5 (Gam màu khói -> 2 lần tẩy):
  + Size S: 1.700.000đ
  + Size M: 2.300.000đ
  + Size L: 2.900.000đ
- Cấp độ Level 9.5 (Gam màu bạc -> 3 lần tẩy):
  + Size S: 2.500.000đ
  + Size M: 2.800.000đ
  + Size L: 3.600.000đ

5. NHUỘM MÀU SAU KHI TẨY NỀN (Dyeing After Bleaching):
- Size S: 1.200.000đ
- Size M: 1.700.000đ
- Size L: 1.900.000đ
- Size XL: 2.200.000đ

6. HIGHLIGHT MẢNG HOẶC LIGHT SỢI:
- Nhuộm highlight dạng sợi (Light sợi):
  + 5 sợi: 500.000đ | 10 sợi: 800.000đ | 15 sợi: 1.100.000đ
  + 20 sợi: 1.400.000đ | 30 sợi: 2.100.000đ | 50 sợi: 3.500.000đ
- Nhuộm highlight dạng mảng:
  + 1 mảng: 400.000đ | 2 mảng: 600.000đ | 3 mảng: 900.000đ
  + 4 mảng: 1.100.000đ | 5 mảng: 1.300.000đ | 6 mảng: 1.500.000đ

7. TẨY CHÂN TÓC (Root Bleaching):
- Độ dài chân tóc 2 cm:
  + 1 lần tẩy (Tóc mảnh): 900.000đ
  + 2 lần tẩy (Tóc trung bình): 1.700.000đ
  + 3 lần tẩy (Tóc to/dày): 2.000.000đ
- Độ dài chân tóc 4 cm:
  + 1 lần tẩy: 1.300.000đ
  + 2 lần tẩy: 2.500.000đ
  + 3 lần tẩy: 2.800.000đ
- Độ dài chân tóc 6 cm:
  + 1 lần tẩy: 1.300.000đ
  + 2 lần tẩy: 2.800.000đ
  + 3 lần tẩy: 3.100.000đ`
  },
  {
    categoryId: "cat-products",
    title: "Bảng giá Chăm sóc & Phục hồi tóc",
    content: `BẢNG GIÁ DỊCH VỤ CHĂM SÓC & PHỤC HỒI TÓC (ADVANCED HAIR TREATMENT)

Dịch vụ được tính theo độ dài tóc tiêu chuẩn (S / M / L / XL):
- Size S: Tóc ngắn – tóc tém – pixie
- Size M: Độ dài tóc từ chạm tai trở xuống đến chạm xương vai
- Size L: Độ dài tóc qua vai đến chạm đỉnh ngực
- Size XL: Độ dài tóc qua đỉnh ngực

1. CÁC LIỆU TRÌNH PHỤC HỒI CHUYÊN SÂU:
- Serum dưỡng chất (Bảo vệ tóc trước khi làm dịch vụ):
  + Size S: 400.000đ | Size M: 600.000đ
- Olaplex (Phục hồi các liên kết lưu huỳnh bị đứt gãy):
  + Size S: 600.000đ | Size M: 800.000đ | Size L: 1.000.000đ
- Metal Detox (Phục hồi giảm gãy rụng, giúp lên màu nhuộm chuẩn):
  + Size S: 600.000đ | Size M: 800.000đ | Size L: 1.000.000đ
- Phục Hồi Cấp Phân Tử (Tái tạo x3 độ chắc khỏe lõi tóc):
  + Size S: 750.000đ | Size M: 1.050.000đ | Size L: 1.250.000đ
- Phục Hồi Siêu Chữa Trị KERATIN:
  + Size S: 1.400.000đ | Size M: 1.700.000đ | Size L: 2.300.000đ | Size XL: 2.600.000đ

2. CHĂM SÓC CHUYÊN BIỆT L'ORÉAL PROFESSIONNEL (Absolut Repair / Pro Longer / Vitamino):
- Ưu đãi giá chỉ từ 850.000đ.
- Phù hợp cho các nhu cầu phục hồi hư tổn, giữ màu nhuộm bền lâu đến 8 tuần, làm dày ngọn tóc.

3. LIỆU TRÌNH ĐIỀU TRỊ DA ĐẦU (Kérastase / Scalp Advanced):
- Ưu đãi giá chỉ từ 999.000đ.
- Chuyên trị các tình trạng da đầu gàu, dầu nhờn, rụng tóc (Serioxyl Advanced), da đầu nhạy cảm.`
  },
  {
    categoryId: "cat-products",
    title: "Bảng giá Nối tóc Nữ theo Size",
    content: `BẢNG GIÁ DỊCH VỤ NỐI TÓC NỮ (WOMEN'S HAIR EXTENSIONS)

1. NỐI THƯỜNG / FIBERGLASS (Trung bình cần 2 - 3 chùm/đầu. 100 gram tóc tương đương 1 chùm):
- Nối Tóc Đen (Black Hair):
  + Độ dài 50cm: 1.900.000đ/chùm
  + Độ dài 60cm: 2.300.000đ/chùm
  + Độ dài 70cm: 2.500.000đ/chùm
- Nối Tóc Tẩy (Bleached Hair):
  + Độ dài 50cm: 2.200.000đ/chùm
  + Độ dài 60cm: 2.500.000đ/chùm
  + Độ dài 70cm: 2.700.000đ/chùm
- Nâng Mối Nối (Lifting Connector): 600.000đ/chùm
- Nhuộm / Uốn Tóc Nối (Dye/Perm Extension): 1.100.000đ - 1.600.000đ
- Tháo Mối Nối (Disassembly): 500.000đ

2. NỐI LÔNG VŨ (Trung bình cần 150 - 200 tép/đầu. Giá tính theo mỗi tép tóc):
- Lông Vũ Đen L2 (Black Feathers L2):
  + 50cm: 30.000đ/tép | 60cm: 40.000đ/tép | 70cm: 45.000đ/tép
- Lông Vũ Đen VIP:
  + 50cm: 45.000đ/tép | 60cm: 55.000đ/tép | 70cm: 60.000đ/tép
- Lông Vũ Tẩy L2:
  + 50cm: 40.000đ/tép | 60cm: 50.000đ/tép | 70cm: 55.000đ/tép
- Lông Vũ Tẩy VIP:
  + 50cm: 50.000đ/tép | 60cm: 60.000đ/tép | 70cm: 65.000đ/tép
- Nâng Mối Nối Lông Vũ: 11.000đ/tép
- Nhuộm / Uốn Tóc Nối: 1.100.000đ - 1.600.000đ
- Tháo Mối Nối Lông Vũ: 500.000đ

3. NỐI LIGHTS (Nối highlight):
- Số lượng 10 sợi: 85.000đ/tép
- Số lượng 20 - 30 sợi: 75.000đ/tép`
  },
  {
    categoryId: "cat-products",
    title: "Bảng giá Dịch vụ dành cho Nam",
    content: `BẢNG GIÁ DỊCH VỤ CHO NAM (MEN'S SERVICES)

Quy trình: Cắt tỉa → Gội sạch → Sấy → Tạo kiểu → Vuốt wax & Hoàn thành.

1. CẮT TÓC & TẠO KIỂU:
- Cắt tóc Nam (Người lớn): 200.000đ
- Cắt tóc Nam (Trẻ em): 150.000đ
- Tạo kiểu tóc Nam (Hair Styling): 100.000đ - 150.000đ

2. UỐN, DUỖI & ÉP SIDE:
- Uốn / Duỗi Basic (Basic Perm / Straightening): 600.000đ - 800.000đ
- Uốn / Duỗi Phục Hồi (Treatment Perm / Straightening): 1.200.000đ - 1.400.000đ
- Ép Side (Side Down Perm): 300.000đ - 500.000đ

3. NHUỘM & TẨY TÓC:
- Nhuộm thường (Hair Color): 600.000đ - 800.000đ
- Nhuộm Phục Hồi (Treatment Color): 900.000đ - 1.300.000đ
- Nhuộm Cao Cấp (High-End / Vegan): 1.000.000đ - 1.400.000đ
- Nâng Tone (High-lift Color): 250.000đ - 350.000đ
- Tẩy tóc Nam (Bleaching): 600.000đ - 700.000đ
- Tẩy chân tóc Nam (Root Bleach): 700.000đ

4. DỊCH VỤ THƯ GIÃN KHÁC:
- Lấy Ráy Tai (Ear Cleaning): 100.000đ
- Cạo Râu nóng (Hot Shave): 120.000đ
- Cạo Râu thường (Regular Shave): 30.000đ`
  },
  {
    categoryId: "cat-products",
    title: "Thẻ thành viên trả trước & Thẻ quà tặng",
    content: `THẺ DỊCH VỤ THÀNH VIÊN TRẢ TRƯỚC & THẺ QUÀ TẶNG (MEMBERSHIP CARDS)

1. THẺ THÀNH VIÊN TRẢ TRƯỚC:
- THẺ BẠC (Silver Card): Mua thẻ 5.000.000đ. Quyền lợi: Giảm 10% mỗi hóa đơn dịch vụ. Áp dụng cho chủ thẻ, hạn sử dụng 12 tháng.
- THẺ VÀNG (Gold Card): Mua thẻ 10.000.000đ. Quyền lợi: Giảm 12% mỗi hóa đơn dịch vụ. Áp dụng cho chủ thẻ, hạn sử dụng 12 tháng.
- THẺ BẠCH KIM (Platinum Card): Mua thẻ 20.000.000đ. Quyền lợi: Giảm 15% mỗi hóa đơn dịch vụ. Áp dụng cho chủ thẻ, hạn sử dụng 12 tháng.
- THẺ KIM CƯƠNG (Diamond Card): Mua thẻ 50.000.000đ. Quyền lợi: Giảm 20% mỗi hóa đơn dịch vụ. Áp dụng cho chủ thẻ & gia đình, không giới hạn thời gian sử dụng.
- THẺ VIP: Mua thẻ 100.000.000đ. Quyền lợi: Giảm 25% mỗi hóa đơn dịch vụ. Áp dụng cho chủ thẻ & gia đình, không giới hạn thời gian sử dụng.
*Lưu ý: Thẻ áp dụng cho tất cả bill dịch vụ (không áp dụng mua sản phẩm), không áp dụng kèm khuyến mãi khác và không quy đổi thành tiền mặt.

2. THẺ QUÀ TẶNG DỊCH VỤ (Mua gói tặng buổi - Ưu đãi 5 tặng 1, 10 tặng 3, 30 tặng 10):
- Liệu trình Gội đầu thư giãn Standard (45 phút):
  + Gói 10.000.000đ | 6.720.000đ | 3.250.000đ | 2.320.000đ | 1.500.000đ | 1.134.000đ
- Liệu trình Gội đầu thư giãn Kérastase 6 bước (60 phút):
  + Gói 18.000.000đ | 11.350.000đ | 5.850.000đ | 4.500.000đ | 2.700.000đ | 2.250.000đ
- Liệu trình Chăm sóc tóc & da đầu toàn diện Kérastase Signature 16 bước (120 phút):
  + Gói 88.000.000đ | 66.000.000đ | 28.000.000đ | 22.000.000đ | 13.200.000đ | 11.000.000đ
- Phục hồi Collagen 3 bước (Size M):
  + Gói 52.000.000đ | 39.000.000đ | 16.900.000đ | 13.000.000đ | 7.800.000đ | 6.500.000đ`
  },
  {
    categoryId: "cat-policies",
    title: "Chính sách bảo hành dịch vụ làm tóc",
    content: `CHÍNH SÁCH BẢO HÀNH DỊCH VỤ TẠI MINH HY HAIR

Cam kết đồng hành cùng bạn sau mỗi lần làm tóc. Mọi yêu cầu bảo hành/chỉnh sửa sẽ được áp dụng khi đáp ứng thời hạn và điều kiện:

1. THỜI GIAN VÀ NỘI DUNG BẢO HÀNH THEO DỊCH VỤ:
- DỊCH VỤ UỐN / DUỖI: Bảo hành trong vòng 30 ngày.
  + Áp dụng khi: Tóc bị mất nếp uốn/duỗi, xoăn không đều, uốn không như yêu cầu ban đầu, hoặc tóc phồng ít / phồng quá nhiều / mối phồng bị lộ.
- DỊCH VỤ LÀM PHỒNG CHÂN TÓC: Bảo hành trong vòng 15 ngày.
- DỊCH VỤ NHUỘM KHÔNG TẨY: Bảo hành trong vòng 20 ngày.
  + Áp dụng khi: Màu nhuộm không như tư vấn ban đầu, màu không đều (bị sáng chân & tối ngọn), hoặc khách có mong muốn giảm bớt độ sáng / ánh sắc của màu.
- DỊCH VỤ NHUỘM CÓ TẨY: Bảo hành trong vòng 15 ngày.
  + Áp dụng khi: Màu nhuộm không như tư vấn ban đầu, hoặc khách muốn giảm bớt độ sáng / ánh sắc của màu.
- DỊCH VỤ CẮT TÓC: Bảo hành trong vòng 7 ngày.
  + Áp dụng khi: Cắt ra không đúng yêu cầu ban đầu, thợ tư vấn cắt không phù hợp làm khách không hài lòng, hoặc khách mong muốn cắt tỉa lại form khác.

2. CÁC TRƯỜNG HỢP KHÔNG ÁP DỤNG BẢO HÀNH (TỪ CHỐI BẢO HÀNH):
- Khách hàng không còn ở Việt Nam trong thời gian bảo hành.
- Tóc đã bị can thiệp bên ngoài sau khi rời salon (như uốn, duỗi, nhuộm, cắt, chỉnh sửa tại salon khác hoặc tự làm tại nhà).
- Không bảo hành màu nhuộm trong trường hợp khách sử dụng dịch vụ Uốn / Duỗi / Làm phồng tại salon khác sau khi nhuộm.
- Đối với nhuộm có tẩy: Không bảo hành màu nếu khách tự ý gội dầu Clear hoặc sử dụng các sản phẩm trị rụng tóc có tính chất tẩy rửa mạnh tại nhà.`
  },
  {
    categoryId: "cat-faq",
    title: "Thông tin liên hệ, Địa chỉ và Thời gian thực hiện dịch vụ",
    content: `THÔNG TIN LIÊN HỆ, ĐỊA CHỈ VÀ THỜI GIAN THỰC HIỆN DỊCH VỤ

1. THÔNG TIN LIÊN HỆ & ĐẶT LỊCH:
- Hotline: 098 882 91 59
- Website: minhhyhair.com
- Socials (Mạng xã hội): Facebook, Instagram (@minhhyhair), TikTok
- Các chi nhánh (CS):
  + CS1: 348 Lý Thái Tổ, Phường 1, Quận 3, TP. Hồ Chí Minh
  + CS2: 3 Nguyễn Thị Thập, Phường Tân Hưng, Quận 7, TP. Hồ Chí Minh

2. THỜI GIAN THỰC HIỆN DỊCH VỤ (Mang tính chất tham khảo, chênh lệch ± 1-2 tiếng tùy tình trạng tóc):
- Cắt tóc: 45 – 60 phút
- Gội đầu: 45 phút
- Tạo kiểu: 30 – 45 phút
- Uốn/Duỗi thường: 3 – 4 tiếng
- Uốn/Duỗi mái: 90 phút – 2 tiếng
- Uốn/Duỗi chân tóc: 2 – 3 tiếng
- Nhuộm cơ bản: ~ 2 tiếng
- Nhuộm nâng tone: ~ 4 tiếng
- Nhuộm tẩy: 5 – 6 tiếng
- Tẩy nối: 6 – 10 tiếng
- Highlight / Balayage: 6 – 8 tiếng
- Phục hồi / tẩy loại: 60 – 120 phút`
  },
  {
    categoryId: "cat-faq",
    title: "Các câu hỏi thường gặp FAQ",
    content: `FAQ CÁC CÂU HỎI THƯỜNG GẶP KHÁCH HÀNG

1. FAQ VỀ GỘI & COMBO:
- Hỏi: Gội đầu 40 phút giá bao nhiêu?
  + Trả lời: Dạ gội đầu thư giãn 40 phút bên em có giá 160.000đ - 210.000đ tùy dòng dầu gội (dòng dưỡng 160k, dòng phục hồi 210k) ạ.
- Hỏi: Combo thư giãn giá bao nhiêu? / Combo 50 phút bao nhiêu tiền?
  + Trả lời: Dạ combo thư giãn 50 phút bên em có giá 320.000đ ạ.
- Hỏi: Combo chăm sóc tóc giá bao nhiêu?
  + Trả lời: Dạ combo chăm sóc 65 phút bên em có giá 420.000đ ạ.
- Hỏi: Combo VIP bao nhiêu tiền?
  + Trả lời: Dạ combo VIP 90 phút bên em có giá 900.000đ ạ.

2. FAQ VỀ NHUỘM TÓC:
- Hỏi: Nhuộm tóc giá bao nhiêu?
  + Trả lời: Dạ nhuộm tóc bên em từ 1.050.000đ - 1.550.000đ tùy độ dài tóc (S, M, L, XL) ạ. Mình cho em xin độ dài tóc để em báo giá chính xác hơn nha.
- Hỏi: Tóc ngang vai nhuộm bao nhiêu?
  + Trả lời: Dạ với tóc ngang vai (size M), giá nhuộm bên em là khoảng 1.350.000đ ạ.
- Hỏi: Nhuộm cao cấp giá bao nhiêu?
  + Trả lời: Dạ nhuộm cao cấp bên em từ 1.350.000đ - 2.050.000đ tùy độ dài tóc ạ.
- Hỏi: Tẩy tóc giá bao nhiêu?
  + Trả lời: Dạ giá tẩy tóc bên em từ 900.000đ - 1.600.000đ tùy độ dài tóc và số lần tẩy ạ.

3. FAQ HIGHLIGHT / BALAYAGE / UỐN:
- Hỏi: Highlight giá bao nhiêu? / Nhuộm highlight bao nhiêu tiền?
  + Trả lời: Dạ highlight full (tẩy + nhuộm) bên em từ 2.200.000đ - 3.100.000đ tùy độ dài tóc ạ.
- Hỏi: Highlight sợi bao nhiêu tiền?
  + Trả lời: Dạ highlight sợi bên em từ 500.000đ đến 3.500.000đ tùy số lượng sợi ạ.
- Hỏi: Balayage giá bao nhiêu?
  + Trả lời: Dạ balayage bên em có giá khoảng 4.000.000đ - 6.000.000đ tùy độ dài tóc và kỹ thuật ạ. Dịch vụ này cần tư vấn kỹ lưỡng trực tiếp.
- Hỏi: Uốn tóc giá bao nhiêu?
  + Trả lời: Dạ uốn tóc bên em từ 1.050.000đ - 1.550.000đ tùy độ dài tóc ạ.
- Hỏi: Uốn cao cấp giá bao nhiêu?
  + Trả lời: Dạ uốn cao cấp bên em từ 1.350.000đ - 2.050.000đ tùy độ dài tóc ạ.

4. FAQ VỀ KỸ THUẬT & SẢN PHẨM:
- Hỏi: Có nên uốn và nhuộm cùng lúc không?
  + Trả lời: Để đảm bảo độ bền của sóng uốn và màu nhuộm, salon khuyến nghị thực hiện cách nhau tối thiểu 5-7 ngày theo trình tự Uốn trước - Nhuộm sau (hoặc tùy thuộc vào màu tóc).
- Hỏi: Stylist có tư vấn trước khi làm tóc không?
  + Trả lời: Có! Mỗi dịch vụ tại Minh Hy Hair đều bắt đầu bằng bước kiểm tra và tư vấn kỹ lưỡng về kiểu dáng, màu sắc, độ dài... và chỉ làm khi có sự đồng thuận.
- Hỏi: Salon sử dụng sản phẩm gì?
  + Trả lời: Minh Hy Hair cam kết sử dụng 100% sản phẩm chính hãng, rõ nguồn gốc bao gồm L'Oréal Professionnel, Milbon, Schwarzkopf, Goodwell ATS, Olaplex...`
  },
  {
    categoryId: "cat-descriptions",
    title: "Mô tả dịch vụ Nhuộm tóc",
    content: `MÔ TẢ CHI TIẾT DỊCH VỤ NHUỘM TÓC

- Nhuộm cơ bản: Sử dụng các dòng thuốc chính hãng như Luminux, novel, RG,… Phù hợp cho nhuộm màu thời trang, màu nền, màu tự nhiên.
- Nhuộm cao cấp: Sử dụng các dòng thuốc chính hãng như L’Oreal Majirel, Milbon, Schwarzkopf,… Phù hợp cho nhuộm màu thời trang, màu nền, màu tự nhiên.
- Nhuộm Vegan: Sử dụng L’Oreal INOA / dòng High-end-vegan, ưu tiên độ an toàn, giảm mùi, giảm kích ứng và cho màu sắc mềm-bền-bóng đẹp.
- Nâng tone: Dành cho nền tóc cần sáng nhẹ trước khi lên màu, hạn chế tiếp xâm lấn tóc.
- Tẩy tóc / bóc màu: Áp dụng cho các trường hợp cần xử lý nền tóc cũ, màu tối, màu tích tụ.
- Tẩy chân tóc: Là dịch vụ kỹ thuật cao, gồm nhiều công đoạn để đảm bảo màu đều từ chân ra ngọn, chưa phải giá hoàn thiện.`
  },
  {
    categoryId: "cat-descriptions",
    title: "Mô tả dịch vụ Uốn & Duỗi tóc",
    content: `MÔ TẢ CHI TIẾT DỊCH VỤ UỐN & DUỖI TÓC

- Duỗi thẳng: Tóc thẳng mịn từ chân đến ngọn, độ ôm sát cao. Phù hợp với khách thích tóc thẳng rõ form, gọn gàng.
- Duỗi tự nhiên: Tóc thẳng vừa phải, ngọn tóc có độ ôm nhẹ, mềm mại.
- Lựa chọn kỹ thuật: Tùy tình trạng tóc, Stylist sẽ lựa chọn công nghệ phù hợp: Duỗi hơi nước Steampod hoặc duỗi thường để đảm bảo tóc đẹp và an toàn nhất.`
  },
  {
    categoryId: "cat-descriptions",
    title: "Mô tả dịch vụ Cắt tóc & Gội đầu",
    content: `MÔ TẢ CHI TIẾT DỊCH VỤ CẮT TÓC & GỘI ĐẦU

- Cắt tóc: Giá cắt đã bao gồm tư vấn dáng tóc phù hợp, xả tóc sạch trước khi cắt, cắt tạo form và sấy tạo kiểu hoàn thiện. Khách hàng được miễn phí kiểm tra da đầu và gội xả sạch từ 5 - 10 phút.
- Gội đầu thư giãn: Quy trình thực hiện bao gồm gội sạch 2 lần bằng dòng dầu gội chuyên dụng, kết hợp massage chuyên sâu vùng cổ, vai, tay và sấy khô tóc.`
  }
];

async function main() {
  const settings = await prisma.settings.findFirst({ select: { aiApiKey: true } });
  if (!settings?.aiApiKey) {
    console.error("❌ No AI API Key found in settings database.");
    return;
  }
  const key = settings.aiApiKey;

  // 1. Delete all existing fragmented imports
  console.log("🧹 Clearing old fragmented knowledge entries...");
  const deleteCount = await prisma.knowledgeEntry.deleteMany({
    where: {
      OR: [
        { categoryId: "ec22cec4-48c6-43e1-9710-41978ceefc36" }, // Main Category
        { categoryId: "7951ae48-3944-4022-afce-62aa0a79d0e9" }, // Old Bảng giá & Dịch vụ
        { title: "Mô tả chi tiết các dịch vụ làm tóc" }         // Old single entry
      ]
    }
  });
  console.log(`🧹 Deleted ${deleteCount.count} old fragmented entries.`);

  // 2. Insert clean entries
  console.log("💾 Inserting clean structured knowledge base...");
  let count = 0;
  for (const entryData of CLEAN_ENTRIES) {
    console.log(`💾 Inserting: ${entryData.title}`);
    
    // Check if category exists
    let cat = await prisma.category.findUnique({ where: { id: entryData.categoryId } });
    if (!cat) {
      // Create category if it doesn't exist (fallback)
      cat = await prisma.category.create({
        data: {
          id: entryData.categoryId,
          name: entryData.categoryId === "cat-products" ? "Bảng giá dịch vụ" :
                entryData.categoryId === "cat-faq" ? "FAQ" :
                entryData.categoryId === "cat-descriptions" ? "Mô tả dịch vụ" : "Chính sách",
          description: entryData.categoryId === "cat-descriptions" ? "Mô tả chi tiết các dịch vụ tại salon" : "Tự động tạo",
          icon: entryData.categoryId === "cat-descriptions" ? "book-open" : "folder",
          color: entryData.categoryId === "cat-descriptions" ? "#8E44AD" : "#4A7C9B"
        }
      });
    }

    // Check if an entry with the same title already exists in the target category to avoid duplicates
    const existing = await prisma.knowledgeEntry.findFirst({
      where: { title: entryData.title, categoryId: cat.id }
    });

    let entry;
    if (existing) {
      entry = await prisma.knowledgeEntry.update({
        where: { id: existing.id },
        data: {
          content: entryData.content,
          isActive: true
        }
      });
      console.log(`🔄 Updated existing: ${entry.title}`);
    } else {
      entry = await prisma.knowledgeEntry.create({
        data: {
          categoryId: cat.id,
          title: entryData.title,
          content: entryData.content,
          priority: 200,
          isActive: true,
          version: 1,
          metadata: {}
        }
      });
      console.log(`✅ Created: ${entry.title}`);
    }

    // Index embedding
    console.log(`⏳ Generating embedding for: ${entry.title}...`);
    try {
      await indexKnowledgeEntry(entry.id, key);
      console.log(`✨ Indexed embedding successfully.`);
    } catch (e: any) {
      console.error(`❌ Failed to index embedding for ${entry.title}:`, e.message);
    }
    
    count++;
    // Small delay to prevent rate limits
    await new Promise(resolve => setTimeout(resolve, 4000));
  }

  console.log(`\n🎉 Completed! Inserted and indexed ${count} clean entries.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
