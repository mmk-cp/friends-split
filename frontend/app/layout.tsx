import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "هم‌حساب",
  description: "تقسیم هوشمند هزینه‌ها بین دوستان",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
