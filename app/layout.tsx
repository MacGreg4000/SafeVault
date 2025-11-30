import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

