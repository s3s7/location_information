import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "location_information Spot Explorer",
  description: "位置情報探索アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
