import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GeoQuest｜世界地理探險隊",
  description: "用遊戲認識七大洲、世界各國位置與國旗。",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
