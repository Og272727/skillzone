import { supabase } from "@/lib/supabase";

export class LeaderboardService {
  async updateLeaderboard(tournamentId: string) {
    try {
      // Get aggregated data using raw SQL
      const { data: aggregates, error: aggError } = await supabase.rpc(
        "get_leaderboard_aggregates",
        { tournament_id_param: tournamentId }
      );

      if (aggError) {
        console.error("Error getting aggregates:", aggError);
        // Fallback to manual aggregation
        await this.manualLeaderboardUpdate(tournamentId);
        return;
      }

      // Update leaderboard with aggregated data
      for (const entry of aggregates || []) {
        await supabase.from("leaderboard").upsert({
          tournament_id: tournamentId,
          user_id: entry.user_id,
          total_score: entry.total_score,
          total_kills: entry.total_kills,
          avg_placement: entry.avg_placement,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error updating leaderboard:", error);
      // Fallback to manual aggregation
      await this.manualLeaderboardUpdate(tournamentId);
    }
  }

  private async manualLeaderboardUpdate(tournamentId: string) {
    try {
      // Get all performances for this tournament
      const { data: performances, error } = await supabase
        .from("player_performance")
        .select("user_id, score, kills, placement")
        .eq("tournament_id", tournamentId);

      if (error) throw error;

      // Manual aggregation
      const userStats: {
        [key: string]: {
          total_score: number;
          total_kills: number;
          placements: number[];
          count: number;
        };
      } = {};

      for (const perf of performances || []) {
        if (!userStats[perf.user_id]) {
          userStats[perf.user_id] = {
            total_score: 0,
            total_kills: 0,
            placements: [],
            count: 0,
          };
        }
        userStats[perf.user_id].total_score += perf.score;
        userStats[perf.user_id].total_kills += perf.kills;
        userStats[perf.user_id].placements.push(perf.placement);
        userStats[perf.user_id].count += 1;
      }

      // Update leaderboard
      for (const [userId, stats] of Object.entries(userStats)) {
        const avgPlacement =
          stats.placements.reduce((a, b) => a + b, 0) / stats.placements.length;

        await supabase.from("leaderboard").upsert({
          tournament_id: tournamentId,
          user_id: userId,
          total_score: stats.total_score,
          total_kills: stats.total_kills,
          avg_placement: avgPlacement,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error in manual leaderboard update:", error);
    }
  }
}

export const leaderboardService = new LeaderboardService();
