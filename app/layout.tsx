import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sprite Tester",
  description: "2D sprite and tilemap editor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
