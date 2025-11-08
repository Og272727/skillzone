"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { trackingService } from "@/services/trackingService";
import { Tournament, Team, MatchResult, PlayerPerformance } from "@/types";
import LiveLeaderboard from "@/components/LiveLeaderboard";

export default function MatchTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matchId, setMatchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [recentMatches, setRecentMatches] = useState<MatchResult[]>([]);

  useEffect(() => {
    if (params.id) {
      fetchTournamentData();
      fetchRecentMatches();
    }
  }, [params.id]);

  const fetchTournamentData = async () => {
    try {
      // Fetch tournament
      const { data: tournamentData, error: tournamentError } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", params.id)
        .single();

      if (tournamentError) throw tournamentError;
      setTournament(tournamentData);

      // Fetch teams for this tournament
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select(
          `
          *,
          team_members!inner (
            id,
            user_id,
            profiles!inner (
              nickname,
              activision_id,
              game_accounts
            )
          )
        `
        )
        .eq("tournament_id", params.id)
        .eq("payment_status", "paid");

      if (teamsError) throw teamsError;
      setTeams(teamsData || []);
    } catch (error) {
      console.error("Error fetching tournament data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentMatches = async () => {
    try {
      const { data, error } = await supabase
        .from("match_results")
        .select("*")
        .eq("tournament_id", params.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentMatches(data || []);
    } catch (error) {
      console.error("Error fetching recent matches:", error);
    }
  };

  const trackMatch = async () => {
    if (!matchId.trim() || !tournament) return;

    setTracking(true);
    try {
      // Track the match using the tracking service
      const { matchResult, performances } =
        await trackingService.trackTournamentMatch(
          tournament.id,
          matchId.trim()
        );

      // Save match result to database
      const { error: matchError } = await supabase
        .from("match_results")
        .insert([matchResult]);

      if (matchError) throw matchError;

      // Save player performances
      if (performances.length > 0) {
        const { error: performanceError } = await supabase
          .from("player_performances")
          .insert(performances);

        if (performanceError) throw performanceError;

        // Update leaderboard
        await updateLeaderboard(performances);
      }

      alert("Match tracked successfully!");
      setMatchId("");
      fetchRecentMatches();
    } catch (error) {
      console.error("Error tracking match:", error);
      alert("Failed to track match. Please check the match ID and try again.");
    } finally {
      setTracking(false);
    }
  };

  const updateLeaderboard = async (performances: PlayerPerformance[]) => {
    try {
      // Group performances by team
      const teamPerformances = performances.reduce((acc, perf) => {
        if (!acc[perf.team_id]) {
          acc[perf.team_id] = [];
        }
        acc[perf.team_id].push(perf);
        return acc;
      }, {} as Record<string, PlayerPerformance[]>);

      // Update leaderboard for each team
      for (const [teamId, teamPerfs] of Object.entries(teamPerformances)) {
        const totalPoints = teamPerfs.reduce(
          (sum, perf) => sum + trackingService.calculateScore(perf),
          0
        );
        const matchesPlayed = teamPerfs.length;
        const wins = teamPerfs.filter((perf) => perf.placement === 1).length;
        const totalKills = teamPerfs.reduce((sum, perf) => sum + perf.kills, 0);
        const averagePlacement =
          teamPerfs.reduce((sum, perf) => sum + perf.placement, 0) /
          matchesPlayed;

        // Check if leaderboard entry exists
        const { data: existingEntry } = await supabase
          .from("leaderboard")
          .select("*")
          .eq("tournament_id", tournament!.id)
          .eq("team_id", teamId)
          .single();

        if (existingEntry) {
          // Update existing entry
          const { error } = await supabase
            .from("leaderboard")
            .update({
              total_points: existingEntry.total_points + totalPoints,
              matches_played: existingEntry.matches_played + matchesPlayed,
              wins: existingEntry.wins + wins,
              total_kills: existingEntry.total_kills + totalKills,
              average_placement:
                (existingEntry.average_placement *
                  existingEntry.matches_played +
                  averagePlacement * matchesPlayed) /
                (existingEntry.matches_played + matchesPlayed),
              last_updated: new Date().toISOString(),
            })
            .eq("id", existingEntry.id);

          if (error) throw error;
        } else {
          // Create new entry
          const { error } = await supabase.from("leaderboard").insert([
            {
              tournament_id: tournament!.id,
              team_id: teamId,
              total_points: totalPoints,
              matches_played: matchesPlayed,
              wins: wins,
              total_kills: totalKills,
              average_placement: averagePlacement,
              last_updated: new Date().toISOString(),
            },
          ]);

          if (error) throw error;
        }
      }
    } catch (error) {
      console.error("Error updating leaderboard:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tournament Not Found</h1>
          <p className="mb-4">
            The tournament you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Match Tracking - {tournament.name}
              </h1>
              <p className="text-gray-600 mt-2">
                Track tournament matches and update live leaderboards
              </p>
            </div>
            <button
              onClick={() => router.push(`/tournaments/${tournament.id}`)}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Back to Tournament
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Match Tracking Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Track New Match
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Match ID
                  </label>
                  <input
                    type="text"
                    value={matchId}
                    onChange={(e) => setMatchId(e.target.value)}
                    placeholder="Enter Call of Duty match ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={trackMatch}
                  disabled={tracking || !matchId.trim()}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tracking ? "Tracking Match..." : "Track Match"}
                </button>
              </div>

              {/* Registered Teams */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Registered Teams ({teams.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {teams.map((team) => (
                    <div key={team.id} className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">
                        {team.team_name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {team.team_members?.length || 0} members
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard and Recent Matches */}
          <div className="lg:col-span-2 space-y-8">
            {/* Live Leaderboard */}
            <LiveLeaderboard tournamentId={tournament.id} />

            {/* Recent Matches */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Recent Matches
              </h2>

              {recentMatches.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No matches tracked yet
                </p>
              ) : (
                <div className="space-y-4">
                  {recentMatches.map((match) => (
                    <div
                      key={match.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            Match {match.match_id}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {match.map_name} - {match.mode}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(match.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Duration:{" "}
                        {Math.floor(
                          (new Date(match.end_time).getTime() -
                            new Date(match.start_time).getTime()) /
                            60000
                        )}{" "}
                        minutes
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
