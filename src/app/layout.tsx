import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import { Providers } from "@/components/providers";
import { ThemeInit } from "@/components/theme-init";
import "./globals.css";

const inter = Quicksand({
  variable: "--font-geist-sans",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "LinhKienLed1000 - Trợ lý CSKH AI",
  description: "Nền tảng hỗ trợ khách hàng bằng AI cho doanh nghiệp",
  icons: {
    icon: "/linhkienled1000-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="h-full">
          <Providers>
            <ThemeInit />
            {children}
          </Providers>
        </body>
    </html>
  );
}
