import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/shared/ui/sonner";

const vazir = localFont({
  src: "../fonts/Vazirmatn[wght].ttf",
  variable: "--font-vazir",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "سامانه پرونده بیماران",
    template: "%s | سامانه پرونده بیماران",
  },
  description: "مدیریت پرونده دیجیتال بیماران کلینیک چشم‌پزشکی",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className={`${vazir.variable} min-h-dvh font-sans antialiased`}>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
