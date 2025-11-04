import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { OrganizationProvider } from "@/contexts/organization-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Resume Shortlist Assistant",
  description: "AI-powered resume screening and shortlisting tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <OrganizationProvider>
          {children}
        </OrganizationProvider>
      </body>
    </html>
  );
}
