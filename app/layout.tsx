import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Internal Tool",
  description: "Project tracker (local preview)"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
