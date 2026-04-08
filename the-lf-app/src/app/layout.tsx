import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "~/components/navbar";
import { ThemeProvider } from "./theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rubik's Cube",
  description: "A floating 3D Rubik's Cube",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
