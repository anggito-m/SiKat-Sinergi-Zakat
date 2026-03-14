import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import AppShell from "@/components/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SiKat - Sinergi Zakat Desa",
  description: "Sinergi Zakat, Bersihkan Hati, Tumbuhkan Desa.",
  icons: {
    icon: "/favicon-dark.ico", // Default to dark as per initial state
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.classList.add(theme);
                
                // Set initial favicon
                const link = document.createElement('link');
                link.rel = 'icon';
                link.href = '/favicon-' + theme + '.ico';
                document.head.appendChild(link);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen antialiased overflow-x-hidden transition-colors duration-300`}>
        <ThemeProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
