import type { Metadata } from "next";
import { Rajdhani } from "next/font/google";
import "./globals.css";

const rajdhani = Rajdhani({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-rajdhani",
});

export const metadata: Metadata = {
  title: "SafeGuard - Gestion de Coffres-Forts",
  description: "Application de gestion de coffres-forts avec comptage de billets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={rajdhani.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}

