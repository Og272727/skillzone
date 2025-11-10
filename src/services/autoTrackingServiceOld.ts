import { supabase } from "@/lib/supabase";
import { pubgService } from "./pubgService";

export class AutoTrackingService {
  async trackTournamentMatches(tournamentId: string) {
    const tournament = await this.getTournament(tournamentId);

    if (tournament.game_type === "Warzone") {
      await this.trackWarzoneMatches(tournament);
    } else if (tournament.game_type === "PUBG Mobile") {
      await this.trackPUBGMatches(tournament);
    }
  }

  async trackPUBGMatches(tournament: any) {
    try {
      const participants = await this.getTournamentParticipants(tournament.id);
      const pubgPlayerIds = participants
        .map((p: any) => p.pubg_player_id)
        .filter(Boolean);

      if (pubgPlayerIds.length > 0) {
        const matchResults = await pubgService.trackPUBGMatches(
          tournament.id,
          pubgPlayerIds
        );
        await this.processPUBGResults(tournament, matchResults);
      }
    } catch (error) {
      console.error("Error tracking PUBG matches:", error);
    }
  }

  async processPUBGResults(tournament: any, matchResults: any[]) {
    for (const match of matchResults) {
      for (const player of match.players) {
        const points = pubgService.calculatePUBGPoints(player);

        try {
          await supabase.from("player_performance").upsert({
            tournament_id: tournament.id,
            user_id: await this.getUserIdByPUBGId(player.playerId),
            match_id: match.id,
            placement: player.placement,
            kills: player.kills,
            damage_done: player.damage,
            score: points,
            survival_time: player.survivalTime,
          });
        } catch (error) {
          console.error("Error saving PUBG performance:", error);
        }
      }
    }

    await this.updateLeaderboard(tournament.id);
  }

  async trackWarzoneMatches(tournament: any) {
    // Existing Warzone tracking logic
    console.log("Tracking Warzone matches for tournament:", tournament.id);
  }

  private async getTournament(tournamentId: string) {
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", tournamentId)
      .single();

    if (error) throw error;
    return data;
  }

  private async getTournamentParticipants(tournamentId: string) {
    const { data, error } = await supabase
      .from("tournament_participants")
      .select(
        `
        *,
        user_pubg_accounts(*)
      `
      )
      .eq("tournament_id", tournamentId);

    if (error) throw error;
    return data;
  }

  private async getUserIdByPUBGId(pubgPlayerId: string) {
    const { data, error } = await supabase
      .from("user_pubg_accounts")
      .select("user_id")
      .eq("pubg_player_id", pubgPlayerId)
      .single();

    if (error) throw error;
    return data.user_id;
  }

  private async updateLeaderboard(tournamentId: string) {
    // Aggregate scores and update leaderboard
    const { data, error } = await supabase
      .from("player_performance")
      .select(
        `
        user_id,
        SUM(score) as total_score,
        SUM(kills) as total_kills,
        AVG(placement) as avg_placement
      `
      )
      .eq("tournament_id", tournamentId)
      .group("user_id");

    if (error) {
      console.error("Error updating leaderboard:", error);
      return;
    }

    // Update or insert leaderboard entries
    for (const entry of data || []) {
      await supabase.from("leaderboard").upsert({
        tournament_id: tournamentId,
        user_id: entry.user_id,
        total_score: entry.total_score,
        total_kills: entry.total_kills,
        avg_placement: entry.avg_placement,
        updated_at: new Date().toISOString(),
      });
    }
  }
}

export const autoTrackingService = new AutoTrackingService();
