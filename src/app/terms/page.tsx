import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Điều khoản dịch vụ - SalonDesk",
  description: "Điều khoản dịch vụ của ứng dụng SalonDesk.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-owly-bg px-6 py-12 text-owly-text">
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3 border-b border-owly-border pb-6">
          <p className="text-sm font-medium text-owly-text-light">
            Cập nhật lần cuối: 31/05/2026
          </p>
          <h1 className="text-3xl font-semibold">Điều khoản dịch vụ</h1>
          <p className="text-base leading-7 text-owly-text-light">
            Các điều khoản này áp dụng cho việc sử dụng SalonDesk, hệ thống CRM
            và chatbot hỗ trợ chăm sóc khách hàng cho salon.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Phạm vi dịch vụ</h2>
          <p className="leading-7">
            SalonDesk là hệ thống CRM/chatbot hỗ trợ chăm sóc khách hàng và tư
            vấn dịch vụ salon qua nhiều kênh liên hệ.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Thông tin tư vấn</h2>
          <p className="leading-7">
            Nội dung tư vấn do bot cung cấp chỉ mang tính hỗ trợ và tham khảo.
            Thông tin về giá, dịch vụ, tình trạng tóc hoặc lịch hẹn có thể cần
            nhân viên salon xác nhận lại trước khi thực hiện.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Trách nhiệm của người dùng</h2>
          <p className="leading-7">
            Người dùng không nên gửi thông tin nhạy cảm như mật khẩu, mã OTP,
            thông tin ngân hàng hoặc dữ liệu cá nhân không cần thiết qua hệ
            thống chat.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Lưu trữ hội thoại</h2>
          <p className="leading-7">
            Hệ thống có thể lưu lại hội thoại để hỗ trợ chăm sóc khách hàng,
            theo dõi lịch sử tư vấn và cải thiện chất lượng dịch vụ.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Liên hệ</h2>
          <p className="leading-7">
            Nếu có câu hỏi về điều khoản dịch vụ, vui lòng liên hệ{" "}
            <a className="text-owly-primary underline" href="mailto:nhuutri1311@gmail.com">
              nhuutri1311@gmail.com
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}

