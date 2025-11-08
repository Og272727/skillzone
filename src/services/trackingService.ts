import { PlayerPerformance, MatchResult } from "@/types";

const CODAPI_BASE_URL =
  process.env.NEXT_PUBLIC_CODAPI_BASE_URL || "https://api.codapi.dev";

export class TrackingService {
  async getPlayerMatches(activisionId: string, platform: string) {
    const response = await fetch(
      `${CODAPI_BASE_URL}/matches/${platform}/${activisionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch player matches");
    }

    return response.json();
  }

  async getMatchDetails(matchId: string) {
    const response = await fetch(`${CODAPI_BASE_URL}/match/${matchId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch match details");
    }

    return response.json();
  }

  calculatePlacementPoints(placement: number): number {
    const placementPoints = {
      1: 10,
      2: 6,
      3: 5,
      4: 4,
      5: 3,
      6: 2,
      7: 2,
      8: 2,
      9: 2,
      10: 2,
      11: 1,
      12: 1,
      13: 1,
      14: 1,
      15: 1,
    };

    return placementPoints[placement as keyof typeof placementPoints] || 0;
  }

  calculateScore(performance: PlayerPerformance): number {
    const placementPoints = this.calculatePlacementPoints(
      performance.placement
    );
    const killPoints = performance.kills * 1; // 1 point per kill
    return placementPoints + killPoints;
  }

  async trackTournamentMatch(
    tournamentId: string,
    matchId: string
  ): Promise<{
    matchResult: MatchResult;
    performances: PlayerPerformance[];
  }> {
    // Get match details from COD API
    const matchData = await this.getMatchDetails(matchId);

    // Process match data and create performance records
    // This is a simplified implementation - in reality, you'd parse the COD API response
    const matchResult: MatchResult = {
      id: crypto.randomUUID(),
      tournament_id: tournamentId,
      match_id: matchId,
      match_data: matchData,
      start_time: matchData.startTime,
      end_time: matchData.endTime,
      map_name: matchData.map,
      mode: matchData.mode,
      created_at: new Date().toISOString(),
    };

    // Mock performances - in reality, extract from match data
    const performances: PlayerPerformance[] = [];

    return { matchResult, performances };
  }
}

export const trackingService = new TrackingService();
