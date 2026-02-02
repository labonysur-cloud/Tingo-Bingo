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
  title: "TingoBingo - The Pet Super App",
  description: "Social network, shop, and utility for pet lovers",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.ico",
    apple: "/logo.png",
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
