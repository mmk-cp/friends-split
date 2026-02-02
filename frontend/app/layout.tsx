import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Friends Split",
  description: "Manage shared expenses",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
