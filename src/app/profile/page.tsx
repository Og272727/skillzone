"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@/types";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nickname: "",
    activision_id: "",
    platform: "battle" as "battle" | "psn" | "xbl" | "acti",
  });

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Fetch additional user profile data from the profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          setUser({
            id: user.id,
            email: user.email || "",
            nickname: profile.nickname || user.user_metadata?.username || "",
            wallet_balance: profile.wallet_balance || 0,
            created_at: user.created_at,
            game_accounts: profile.game_accounts || {},
          });
          setFormData({
            nickname: profile.nickname || user.user_metadata?.username || "",
            activision_id: profile.game_accounts?.activision_id || "",
            platform: profile.game_accounts?.platform || "battle",
          });
        }
      }
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Fetch profile data when user signs in
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            nickname:
              profile.nickname || session.user.user_metadata?.username || "",
            wallet_balance: profile.wallet_balance || 0,
            created_at: session.user.created_at,
            game_accounts: profile.game_accounts || {},
          });
          setFormData({
            nickname:
              profile.nickname || session.user.user_metadata?.username || "",
            activision_id: profile.game_accounts?.activision_id || "",
            platform: profile.game_accounts?.platform || "battle",
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nickname: formData.nickname,
          game_accounts: {
            activision_id: formData.activision_id,
            platform: formData.platform,
          },
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update local state
      setUser({
        ...user,
        nickname: formData.nickname,
        game_accounts: {
          activision_id: formData.activision_id,
          platform: formData.platform,
        },
      });

      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        nickname: user.nickname || "",
        activision_id: user.game_accounts?.activision_id || "",
        platform: user.game_accounts?.platform || "battle",
      });
    }
    setEditing(false);
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
            Please sign in to access your profile.
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
              <Link
                href="/dashboard"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <span className="text-gray-300">
                Welcome, {user.nickname || user.email}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 border border-white/10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">My Profile</h1>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Profile Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Account Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <p className="text-white bg-gray-700/50 rounded-lg px-3 py-2">
                  {user.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nickname
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) =>
                      setFormData({ ...formData, nickname: e.target.value })
                    }
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your nickname"
                  />
                ) : (
                  <p className="text-white bg-gray-700/50 rounded-lg px-3 py-2">
                    {user.nickname || "Not set"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Member Since
                </label>
                <p className="text-white bg-gray-700/50 rounded-lg px-3 py-2">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Wallet Balance
                </label>
                <p className="text-white bg-gray-700/50 rounded-lg px-3 py-2">
                  GH₵ {user.wallet_balance?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>

            {/* Game Accounts */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Game Accounts
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Platform
                </label>
                {editing ? (
                  <select
                    value={formData.platform}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        platform: e.target.value as
                          | "battle"
                          | "psn"
                          | "xbl"
                          | "acti",
                      })
                    }
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="battle">Battle.net</option>
                    <option value="psn">PlayStation Network</option>
                    <option value="xbl">Xbox Live</option>
                    <option value="acti">Activision</option>
                  </select>
                ) : (
                  <p className="text-white bg-gray-700/50 rounded-lg px-3 py-2">
                    {user.game_accounts?.platform
                      ? user.game_accounts.platform.toUpperCase()
                      : "Not set"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Activision ID
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.activision_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        activision_id: e.target.value,
                      })
                    }
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your Activision ID"
                  />
                ) : (
                  <p className="text-white bg-gray-700/50 rounded-lg px-3 py-2">
                    {user.game_accounts?.activision_id || "Not set"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Edit Actions */}
          {editing && (
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-600">
              <button
                onClick={handleCancel}
                className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
