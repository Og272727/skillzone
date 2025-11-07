"use client";

import { useState, useEffect } from "react";
import { Leaderboard } from "@/types";
import { supabase } from "@/lib/supabase";

interface LiveLeaderboardProps {
  tournamentId: string;
}

export default function LiveLeaderboard({
  tournamentId,
}: LiveLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<Leaderboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("leaderboard_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leaderboard",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        (payload) => {
          console.log("Leaderboard update:", payload);
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("leaderboard")
        .select(
          `
          *,
          teams (
            team_name
          )
        `
        )
        .eq("tournament_id", tournamentId)
        .order("total_points", { ascending: false })
        .limit(20);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          Live Leaderboard
        </h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-4">
        Live Leaderboard
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-700">
            <tr>
              <th className="px-4 py-2">Rank</th>
              <th className="px-4 py-2">Team</th>
              <th className="px-4 py-2">Points</th>
              <th className="px-4 py-2">Matches</th>
              <th className="px-4 py-2">Wins</th>
              <th className="px-4 py-2">Kills</th>
              <th className="px-4 py-2">Avg Place</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <tr
                key={entry.id}
                className="border-b border-gray-700 hover:bg-gray-700"
              >
                <td className="px-4 py-2 font-medium text-white">
                  {index + 1}
                  {index < 3 && (
                    <span
                      className={`ml-2 text-xs ${
                        index === 0
                          ? "text-yellow-400"
                          : index === 1
                          ? "text-gray-400"
                          : "text-orange-400"
                      }`}
                    >
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {(entry as { teams?: { team_name: string } }).teams
                    ?.team_name || "Unknown Team"}
                </td>
                <td className="px-4 py-2 font-semibold text-blue-400">
                  {entry.total_points}
                </td>
                <td className="px-4 py-2">{entry.matches_played}</td>
                <td className="px-4 py-2">{entry.wins}</td>
                <td className="px-4 py-2">{entry.total_kills}</td>
                <td className="px-4 py-2">
                  {entry.average_placement.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {leaderboard.length === 0 && (
        <p className="text-gray-400 text-center py-4">
          No teams in leaderboard yet
        </p>
      )}
    </div>
  );
}
