"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Tournament } from "@/types";

export default function TournamentsPage() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "open" | "in_progress" | "completed"
  >("all");

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      let query = supabase
        .from("tournaments")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        const statusMap = {
          open: "Open",
          in_progress: "In Progress",
          completed: "Completed",
        };
        query = query.eq("status", statusMap[filter]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Tournaments
            </h1>
            <p className="text-xl text-gray-300">Loading tournaments...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Tournaments
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Join competitive Warzone tournaments and compete for prizes
          </p>

          {/* Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[
              { key: "all", label: "All Tournaments" },
              { key: "open", label: "Open" },
              { key: "in_progress", label: "In Progress" },
              { key: "completed", label: "Completed" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() =>
                  setFilter(key as "all" | "open" | "in_progress" | "completed")
                }
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  filter === key
                    ? "bg-blue-600 text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Create Tournament Button */}
          {user && (
            <Link
              href="/tournaments/create"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105"
            >
              Create Tournament
            </Link>
          )}
        </div>

        {/* Tournaments Grid */}
        {tournaments.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              No tournaments found
            </h2>
            <p className="text-gray-300 mb-8">
              {filter === "all"
                ? "Be the first to create a tournament!"
                : `No ${filter.replace("_", " ")} tournaments available.`}
            </p>
            {user && (
              <Link
                href="/tournaments/create"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 inline-block"
              >
                Create First Tournament
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/tournaments/${tournament.id}`}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10 hover:border-white/20 transition-all hover:transform hover:scale-105 block"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-white">
                    {tournament.name}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                      tournament.status
                    )}`}
                  >
                    {tournament.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Game:</span>
                    <span className="text-white">{tournament.game_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entry Fee:</span>
                    <span className="text-white">
                      GH₵ {tournament.entry_fee}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prize Pool:</span>
                    <span className="text-white">
                      GH₵ {tournament.prize_pool.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Teams:</span>
                    <span className="text-white">{tournament.max_teams}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Schedule:</span>
                    <span className="text-white">
                      {new Date(tournament.schedule).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-gray-400">
                    Created{" "}
                    {new Date(tournament.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
