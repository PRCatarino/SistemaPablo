import type { Metadata } from "next";
import { auth } from "@/auth";
import { AppProviders } from "@/components/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanban de artes — confecção",
  description: "Fluxo de criação de artes para camisas",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <AppProviders session={session}>{children}</AppProviders>
      </body>
    </html>
  );
}
