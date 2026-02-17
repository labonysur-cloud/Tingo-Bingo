import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocialProvider } from "@/context/SocialContext";
import { ChatProvider } from "@/context/ChatContext";
import { NotificationProvider } from "@/context/NotificationContext";
import BottomNav from "@/components/layout/BottomNav";
import { Toaster } from "@/components/ui/Toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TingoBingo",
  description: "Social network, shop, and utility for pet lovers",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.ico",
    apple: "/logo.png",
  },
  verification: {
    google: "bI2y6XKt4h6rbKn7ZQisbN908sIoerFqipjARbL8-h4",
  },
  keywords: ["TingoBingo", "Labony Sur", "Pet Social Network", "Pet Shop", "Bingo", "Tingo"],
  authors: [{ name: "Labony Sur" }],
  openGraph: {
    title: "TingoBingo",
    description: "Social network, shop, and utility for pet lovers",
    url: "https://tingo-bingo.vercel.app/",
    siteName: "TingoBingo",
    images: [
      {
        url: "https://tingo-bingo.vercel.app/logo.png",
        width: 800,
        height: 600,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6B35",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Mobile app feel
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased pb-16`} suppressHydrationWarning={true} // pb-16 for BottomNav space
      >
        <AuthProvider>
          <SocialProvider>
            <ChatProvider>
              <NotificationProvider>
                {children}
                <BottomNav />
                <Toaster />
              </NotificationProvider>
            </ChatProvider>
          </SocialProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
