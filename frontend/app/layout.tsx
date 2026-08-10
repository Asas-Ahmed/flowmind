import type { Metadata, Viewport } from "next";
import { Inter, Orbitron } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { PwaRegister } from "@/components/pwa/pwa-register";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-logo",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "FlowMind | Focus. Flow. Achieve.",
    template: "%s | FlowMind",
  },
  description:
    "FlowMind helps students and professionals manage tasks, habits, focus sessions, schedules, and productivity insights in one intelligent workspace.",
  applicationName: "FlowMind",
  keywords: [
    "FlowMind",
    "productivity",
    "tasks",
    "habits",
    "focus",
    "AI productivity",
    "student productivity",
    "smart scheduling",
  ],
  authors: [{ name: "Asas Ahmed" }],
  creator: "Asas Ahmed",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "FlowMind",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/brand/favicon.ico",
    shortcut: "/brand/favicon.ico",
    apple: "/brand/flowmind-icon-180.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#050816" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${orbitron.variable} min-h-screen bg-slate-50 font-sans text-slate-950 antialiased transition-colors duration-300 dark:bg-[#050816] dark:text-slate-50`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <NotificationProvider>{children}</NotificationProvider>
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
