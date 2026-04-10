import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { auth } from "@/auth";
import { AppProviders } from "@/components/AppProviders";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ArtFlow — Gestão de artes para confecção",
  description:
    "Sistema de gestão de artes para confecção — fluxo Kanban industrial.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="pt-BR" className="light">
      <body
        className={`${manrope.variable} ${inter.variable} min-h-screen font-body`}
      >
        <AppProviders session={session}>{children}</AppProviders>
      </body>
    </html>
  );
}
