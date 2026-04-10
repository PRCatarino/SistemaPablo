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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${manrope.variable} ${inter.variable} min-h-screen font-body`}
      >
        <AppProviders session={session}>{children}</AppProviders>
      </body>
    </html>
  );
}
