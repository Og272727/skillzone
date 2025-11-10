export interface PUBGPlayer {
  id: string;
  name: string;
  platform: string;
}

export interface PUBGMatch {
  id: string;
  map: string;
  mode: string;
  duration: number;
  players: PUBGPlayerStats[];
}

export interface PUBGPlayerStats {
  playerId: string;
  playerName: string;
  placement: number;
  kills: number;
  damage: number;
  survivalTime: number;
  rank: string;
}

const PUBG_INSPECTOR_BASE = "https://api.pubginspector.com/v1";
const PUBG_LOOKUP_BASE = "https://api.pubglookup.com/v1";

export class PUBGService {
  private getInspectorHeaders() {
    return {
      Authorization: `Bearer ${process.env.PUBG_INSPECTOR_API_KEY}`,
      "Content-Type": "application/json",
    };
  }

  private getLookupHeaders() {
    return {
      Authorization: `Bearer ${process.env.PUBG_LOOKUP_API_KEY}`,
      "Content-Type": "application/json",
    };
  }

  // Track PUBG matches for tournament
  async trackPUBGMatches(
    tournamentId: string,
    playerIds: string[]
  ): Promise<PUBGMatch[]> {
    const matches: PUBGMatch[] = [];

    for (const playerId of playerIds) {
      try {
        const playerMatches = await this.getPlayerMatches(playerId);
        const tournamentMatches = this.filterTournamentMatches(
          playerMatches,
          tournamentId
        );
        matches.push(...tournamentMatches);
      } catch (error) {
        console.error(`Error tracking matches for player ${playerId}:`, error);
      }
    }

    return this.processPUBGResults(matches);
  }

  // Get player matches from PUBG Inspector
  async getPlayerMatches(playerId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${PUBG_INSPECTOR_BASE}/players/${playerId}/matches?limit=20`,
        {
          method: "GET",
          headers: this.getInspectorHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`PUBG Inspector API error: ${response.status}`);
      }

      const data = await response.json();
      return data.matches || [];
    } catch (error) {
      console.error("PUBG Inspector error:", error);
      return [];
    }
  }

  // Get detailed match data from PUBG Lookup
  async getMatchDetails(matchId: string): Promise<any> {
    try {
      const response = await fetch(`${PUBG_LOOKUP_BASE}/matches/${matchId}`, {
        method: "GET",
        headers: this.getLookupHeaders(),
      });

      if (!response.ok) {
        throw new Error(`PUBG Lookup API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("PUBG Lookup error:", error);
      return null;
    }
  }

  // Filter matches for specific tournament timeframe
  private filterTournamentMatches(matches: any[], tournamentId: string): any[] {
    // This would need tournament start/end times from database
    // For now, return recent matches
    return matches.slice(0, 5); // Last 5 matches
  }

  // Process PUBG match results
  private processPUBGResults(matches: any[]): PUBGMatch[] {
    return matches.map((match) => ({
      id: match.id,
      map: match.map || "Unknown",
      mode: match.mode || "Unknown",
      duration: match.duration || 0,
      players:
        match.players?.map((player: any) => ({
          playerId: player.id,
          playerName: player.name,
          placement: player.placement || 0,
          kills: player.kills || 0,
          damage: player.damage || 0,
          survivalTime: player.survivalTime || 0,
          rank: player.rank || "Unknown",
        })) || [],
    }));
  }

  // Verify PUBG player account
  async verifyPlayerAccount(
    playerName: string,
    platform: string = "steam"
  ): Promise<PUBGPlayer | null> {
    try {
      const response = await fetch(
        `${PUBG_INSPECTOR_BASE}/players?filter[playerNames]=${encodeURIComponent(
          playerName
        )}&filter[platform]=${platform}`,
        {
          method: "GET",
          headers: this.getInspectorHeaders(),
        }
      );

      if (!response.ok) {
        console.error(`PUBG verification failed: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const player = data.data[0];
        return {
          id: player.id,
          name: player.attributes?.name || playerName,
          platform: platform,
        };
      }

      return null;
    } catch (error) {
      console.error("PUBG account verification error:", error);
      return null;
    }
  }

  // Calculate PUBG points (same system as Warzone)
  calculatePUBGPoints(playerStats: PUBGPlayerStats): number {
    let points = 0;

    // Placement points
    const placementPoints: { [key: number]: number } = {
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

    points += placementPoints[playerStats.placement] || 0;

    // Kill points (1 point per kill)
    points += playerStats.kills * 1;

    return points;
  }
}

export const pubgService = new PUBGService();
