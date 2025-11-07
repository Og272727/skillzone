"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    username?: string;
  };
  created_at: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      }
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 border border-white/10 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">
            Please sign in to access your dashboard.
          </p>
          <Link
            href="/auth/login"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Navigation */}
      <nav className="bg-gray-800/50 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-white">
              SkillZone
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">
                Welcome, {user.user_metadata?.username || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Profile</h2>
            <div className="space-y-2">
              <p className="text-gray-300">
                <span className="font-semibold">Email:</span> {user.email}
              </p>
              <p className="text-gray-300">
                <span className="font-semibold">Username:</span>{" "}
                {user.user_metadata?.username || "Not set"}
              </p>
              <p className="text-gray-300">
                <span className="font-semibold">Joined:</span>{" "}
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Tournaments Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">
              My Tournaments
            </h2>
            <p className="text-gray-300 mb-4">
              View and manage your tournament participations.
            </p>
            <Link
              href="/tournaments"
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors inline-block"
            >
              View Tournaments
            </Link>
          </div>

          {/* Wallet Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Wallet</h2>
            <p className="text-gray-300 mb-4">
              Manage your GH₵ balance and transactions.
            </p>
            <Link
              href="/wallet"
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors inline-block"
            >
              View Wallet
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/tournaments/create"
              className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors text-center"
            >
              Create Tournament
            </Link>
            <Link
              href="/tournaments/join"
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors text-center"
            >
              Join Tournament
            </Link>
            <Link
              href="/leaderboard"
              className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors text-center"
            >
              View Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
