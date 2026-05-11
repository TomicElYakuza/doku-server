import "./globals.css";
import MainLayout from "../components/layout/MainLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  );
}