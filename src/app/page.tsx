"use client";

import { useAuth } from "@/context/AuthContext";
import LoginView from "@/components/auth/LoginView";
import FeedView from "@/components/feed/FeedView";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-bounce text-4xl">🐾</div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return <FeedView />;
}
