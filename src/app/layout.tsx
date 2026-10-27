import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Authenticator Hub | 2FA OTP Multi-User",
  description:
    "Aplikasi verifikasi 2 langkah (2FA OTP) modern berbasis Next.js dengan dukungan RFC 6238 TOTP untuk penggunaan bersama tim.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${jakartaSans.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="theme-color" content="#121316" />
      </head>
      <body>{children}</body>
    </html>
  );
}
