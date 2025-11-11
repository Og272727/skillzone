"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User, Tournament } from "@/types";
import { useAuth } from "@/hooks/useAuth";

export default function UserDashboard() {
  const { user, signOut } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchActiveTournaments();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setUserData({
          id: data.id,
          email: data.email || "",
          nickname: data.nickname || "",
          wallet_balance: data.wallet_balance || 0,
          created_at: data.created_at,
          game_accounts: data.game_accounts || {},
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchActiveTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("status", "Open")
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setActiveTournaments(data || []);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-white">
                SkillZone
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white">
                GH₵ {userData.wallet_balance?.toFixed(2) || "0.00"}
              </span>
              <Link
                href="/dashboard"
                className="text-white hover:text-blue-400 transition-colors"
              >
                {userData.nickname || userData.email}
              </Link>
              <Link
                href="/wallet"
                className="text-white hover:text-blue-400 transition-colors"
              >
                Wallet
              </Link>
              <button
                onClick={signOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Welcome Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Welcome back,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
              {userData.nickname || "Gamer"}!
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Ready to dominate the leaderboards?
          </p>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 max-w-md mx-auto mb-8">
            <div className="text-3xl font-bold text-green-400 mb-2">
              GH₵ {userData.wallet_balance?.toFixed(2) || "0.00"}
            </div>
            <p className="text-gray-300">Available Balance</p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              href="/tournaments/create"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-6 rounded-lg text-center transition-all transform hover:scale-105"
            >
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold mb-2">Create Tournament</h3>
              <p className="text-blue-100">Host your own tournament</p>
            </Link>

            <Link
              href="/tournaments"
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white p-6 rounded-lg text-center transition-all transform hover:scale-105"
            >
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Join Tournament</h3>
              <p className="text-green-100">Find and join active tournaments</p>
            </Link>

            <Link
              href="/deposit"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-6 rounded-lg text-center transition-all transform hover:scale-105"
            >
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">Deposit Funds</h3>
              <p className="text-purple-100">Add money to your wallet</p>
            </Link>

            <Link
              href="/profile"
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white p-6 rounded-lg text-center transition-all transform hover:scale-105"
            >
              <div className="text-4xl mb-4">👤</div>
              <h3 className="text-xl font-semibold mb-2">My Profile</h3>
              <p className="text-orange-100">Manage your account settings</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Active Tournaments */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Active Tournaments
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-gray-800/50 rounded-lg p-6 animate-pulse"
                >
                  <div className="h-4 bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10 hover:border-white/20 transition-all hover:transform hover:scale-105"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-white">
                      {tournament.name}
                    </h3>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-600 text-white">
                      {tournament.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-gray-300">
                      <span className="font-medium">Game:</span>{" "}
                      {tournament.game_type}
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium">Entry Fee:</span> GH₵
                      {tournament.entry_fee}
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium">Prize Pool:</span> GH₵
                      {tournament.prize_pool.toLocaleString()}
                    </p>
                  </div>

                  <Link
                    href={`/tournaments/${tournament.id}`}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-center transition-colors block"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}

          {activeTournaments.length === 0 && !loading && (
            <div className="text-center">
              <p className="text-gray-400 mb-4">No active tournaments yet.</p>
              <Link
                href="/tournaments/create"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Create the First Tournament
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Recent Activity
          </h2>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
            <div className="text-center text-gray-400">
              <p>No recent activity yet.</p>
              <p className="text-sm mt-2">
                Start by joining a tournament or creating your own!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 backdrop-blur-sm border-t border-white/10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">
            © 2024 SkillZone. Built for competitive Warzone gaming.
          </p>
        </div>
      </footer>
    </div>
  );
}
