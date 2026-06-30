import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Votre métier d'encadreur — 5 questions",
  description:
    "Ancien encadreur reconverti développeur. Je construis un outil pour les ateliers d'encadrement et vos réponses m'aident à le rendre vraiment utile.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
