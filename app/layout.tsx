import type { Metadata } from "next";
import { Rajdhani } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { getCurrentUser } from "@/app/actions/auth";

const rajdhani = Rajdhani({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-rajdhani",
});

export const metadata: Metadata = {
  title: "SafeGuard - Gestion de Coffres-Forts",
  description: "Application de gestion de coffres-forts avec comptage de billets",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null
  try {
    user = await getCurrentUser()
  } catch (error) {
    // Si la base de données n'est pas initialisée, on continue sans utilisateur
    // L'application redirigera vers /setup si nécessaire
    console.error('Erreur lors de la récupération de l\'utilisateur:', error)
  }
  
  return (
    <html lang="fr" className={rajdhani.variable}>
      <body className="font-sans">
        <Navigation user={user} />
        {children}
      </body>
    </html>
  );
}

