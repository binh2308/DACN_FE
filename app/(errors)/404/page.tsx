import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Không tìm thấy trang",
  description:
    "Trang bạn đang tìm không tồn tại hoặc có thể đã được chuyển. Vui lòng quay lại trang chủ.",
};

export default function Error() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-xl text-center">
        <p className="text-sm font-semibold text-gray-500 tracking-widest uppercase">
          Lỗi 404
        </p>

        <h1 className="mt-3 text-4xl sm:text-5xl font-bold text-gray-900">
          Ôi! Không tìm thấy trang.
        </h1>

        <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed">
          Trang bạn yêu cầu không được tìm thấy. Có thể trang đã bị xoá, đổi tên
          hoặc chưa từng tồn tại.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition"
          >
            ← Về trang chủ
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition"
          >
            Liên hệ hỗ trợ
          </Link>
        </div>
      </div>
    </main>
  );
}