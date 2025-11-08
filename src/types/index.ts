export interface User {
  id: string;
  email: string;
  nickname: string;
  wallet_balance: number;
  created_at: string;
  game_accounts: {
    activision_id?: string;
    platform?: "battle" | "psn" | "xbl" | "acti";
  };
}

export interface Tournament {
  id: string;
  name: string;
  game_type: string;
  entry_fee: number;
  prize_pool: number;
  max_teams: number;
  status: "Open" | "Closed" | "In Progress" | "Completed";
  schedule: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  tournament_id: string;
  team_name: string;
  leader_id: string;
  payment_status: "pending" | "paid" | "refunded";
  invite_code: string;
  created_at: string;
  team_members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  joined_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type:
    | "deposit"
    | "withdrawal"
    | "tournament_entry"
    | "prize"
    | "platform_fee";
  amount: number;
  status: "pending" | "completed" | "failed";
  tournament_id?: string;
  paystack_reference?: string;
  created_at: string;
}

export interface MatchResult {
  id: string;
  tournament_id: string;
  match_id: string;
  match_data: Record<string, unknown>;
  start_time: string;
  end_time: string;
  map_name: string;
  mode: string;
  created_at: string;
}

export interface PlayerPerformance {
  id: string;
  tournament_id: string;
  user_id: string;
  match_id: string;
  team_id: string;
  placement: number;
  kills: number;
  deaths: number;
  damage_done: number;
  score: number;
  cash: number;
  created_at: string;
}

export interface Leaderboard {
  id: string;
  tournament_id: string;
  team_id: string;
  total_points: number;
  matches_played: number;
  wins: number;
  total_kills: number;
  average_placement: number;
  last_updated: string;
}

export interface LobbySubmission {
  id: string;
  tournament_id: string;
  submitted_by: string;
  lobby_link: string;
  lobby_password?: string;
  platform: "battle" | "psn" | "xbl" | "acti";
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  approved_at?: string;
}
