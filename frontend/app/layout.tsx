import "./globals.css";
import Providers from "./providers";
import { Vazirmatn, Markazi_Text } from "next/font/google";

const bodyFont = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
});

const displayFont = Markazi_Text({
  subsets: ["arabic"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Friends Split",
  description: "Manage shared expenses",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={`${bodyFont.variable} ${displayFont.variable}`} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
