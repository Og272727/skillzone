"use client";

import { useAuth } from "@/hooks/useAuth";
import PublicLanding from "@/components/PublicLanding";
import UserDashboard from "@/components/UserDashboard";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <PublicLanding />;
  }

  return <UserDashboard />;
}
