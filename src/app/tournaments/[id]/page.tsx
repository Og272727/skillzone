"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Tournament, Team, TeamMember } from "@/types";

export default function TournamentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [joiningTeam, setJoiningTeam] = useState(false);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    if (params.id) {
      fetchTournamentDetails();
    }
  }, [params.id, user]);

  const fetchTournamentDetails = async () => {
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
            joined_at,
            profiles!inner (
              nickname,
              email
            )
          )
        `
        )
        .eq("tournament_id", params.id);

      if (teamsError) throw teamsError;
      setTeams(teamsData || []);

      // Check if user is already in a team for this tournament
      if (user) {
        const userTeamData = teamsData?.find((team) =>
          team.team_members?.some((member: any) => member.user_id === user.id)
        );
        setUserTeam(userTeamData || null);
      }
    } catch (error) {
      console.error("Error fetching tournament details:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async () => {
    if (!user || !teamName.trim()) return;

    setCreatingTeam(true);
    try {
      // Generate unique invite code
      const inviteCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

      // Create team
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .insert([
          {
            tournament_id: params.id,
            team_name: teamName.trim(),
            leader_id: user.id,
            invite_code: inviteCode,
            payment_status: "pending",
          },
        ])
        .select()
        .single();

      if (teamError) throw teamError;

      // Add team leader as first member
      const { error: memberError } = await supabase
        .from("team_members")
        .insert([
          {
            team_id: teamData.id,
            user_id: user.id,
          },
        ]);

      if (memberError) throw memberError;

      alert(
        `Team "${teamName}" created successfully! Share this invite code: ${inviteCode}`
      );
      setTeamName("");
      fetchTournamentDetails();
    } catch (error) {
      console.error("Error creating team:", error);
      alert("Failed to create team. Please try again.");
    } finally {
      setCreatingTeam(false);
    }
  };

  const joinTeam = async () => {
    if (!user || !inviteCode.trim()) return;

    setJoiningTeam(true);
    try {
      // Find team by invite code
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("tournament_id", params.id)
        .eq("invite_code", inviteCode.trim().toUpperCase())
        .single();

      if (teamError || !teamData) {
        alert("Invalid invite code. Please check and try again.");
        return;
      }

      // Check if team is full (assuming 4 players max for now)
      const { data: membersData } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamData.id);

      if (membersData && membersData.length >= 4) {
        alert("This team is already full.");
        return;
      }

      // Check if user is already in another team for this tournament
      if (userTeam) {
        alert("You are already in a team for this tournament.");
        return;
      }

      // Add user to team
      const { error: memberError } = await supabase
        .from("team_members")
        .insert([
          {
            team_id: teamData.id,
            user_id: user.id,
          },
        ]);

      if (memberError) throw memberError;

      alert(`Successfully joined team "${teamData.team_name}"!`);
      setInviteCode("");
      fetchTournamentDetails();
    } catch (error) {
      console.error("Error joining team:", error);
      alert("Failed to join team. Please try again.");
    } finally {
      setJoiningTeam(false);
    }
  };

  const handlePayment = async (teamId: string) => {
    if (!user || !tournament) return;

    try {
      const team = teams.find((t) => t.id === teamId);
      if (!team) return;

      // Check if user has enough balance
      if (user.wallet_balance < tournament.entry_fee) {
        alert(
          "Insufficient balance. Please deposit funds to your wallet first."
        );
        router.push("/wallet");
        return;
      }

      // Check if user is the team leader
      if (team.leader_id !== user.id) {
        alert("Only the team leader can make payments for the team.");
        return;
      }

      // Check if team is ready (has minimum members - let's say 2 for now)
      const teamMembers = team.team_members || [];
      if (teamMembers.length < 2) {
        alert("Your team needs at least 2 members before you can register.");
        return;
      }

      // Calculate platform fee (10%)
      const platformFee = tournament.entry_fee * 0.1;
      const totalDeduction = tournament.entry_fee + platformFee;

      // Check if user has enough for entry fee + platform fee
      if (user.wallet_balance < totalDeduction) {
        alert(
          `Insufficient balance. You need GH₵ ${totalDeduction.toFixed(
            2
          )} (entry fee + platform fee).`
        );
        router.push("/wallet");
        return;
      }

      // Process payment
      const reference = `tournament_${
        tournament.id
      }_team_${teamId}_${Date.now()}`;

      // Create tournament entry transaction
      const { error: entryError } = await supabase.from("transactions").insert([
        {
          user_id: user.id,
          type: "tournament_entry",
          amount: -tournament.entry_fee,
          status: "completed",
          tournament_id: tournament.id,
          paystack_reference: reference,
        },
      ]);

      if (entryError) throw entryError;

      // Create platform fee transaction
      const { error: feeError } = await supabase.from("transactions").insert([
        {
          user_id: user.id,
          type: "platform_fee",
          amount: -platformFee,
          status: "completed",
          tournament_id: tournament.id,
          paystack_reference: `fee_${reference}`,
        },
      ]);

      if (feeError) throw feeError;

      // Update team payment status
      const { error: teamError } = await supabase
        .from("teams")
        .update({ payment_status: "paid" })
        .eq("id", teamId);

      if (teamError) throw teamError;

      // Update user balance
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({
          wallet_balance: user.wallet_balance - totalDeduction,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (balanceError) throw balanceError;

      alert(
        "Payment successful! Your team is now registered for the tournament."
      );
      fetchTournamentDetails();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tournament Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {tournament.name}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Game: {tournament.game_type}</span>
                <span>Entry Fee: GH₵ {tournament.entry_fee}</span>
                <span>
                  Prize Pool: GH₵ {tournament.prize_pool.toLocaleString()}
                </span>
                <span>Max Teams: {tournament.max_teams}</span>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                tournament.status === "Open"
                  ? "bg-green-100 text-green-800"
                  : tournament.status === "In Progress"
                  ? "bg-blue-100 text-blue-800"
                  : tournament.status === "Completed"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {tournament.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Schedule</h3>
              <p className="text-gray-600">
                {new Date(tournament.schedule).toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Host</h3>
              <p className="text-gray-600">
                {tournament.created_by === user?.id ? "You" : "Tournament Host"}
              </p>
            </div>
          </div>

          {/* Match Tracking Button for In Progress Tournaments */}
          {tournament.status === "In Progress" && (
            <div className="mt-4">
              <button
                onClick={() =>
                  router.push(`/tournaments/${tournament.id}/match-tracking`)
                }
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Track Matches
              </button>
            </div>
          )}
        </div>

        {/* Team Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create/Join Team */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {userTeam ? "Your Team" : "Join or Create a Team"}
            </h2>

            {userTeam ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    {userTeam.team_name}
                  </h3>
                  <p className="text-sm text-blue-700 mb-2">
                    Invite Code:{" "}
                    <span className="font-mono font-bold">
                      {userTeam.invite_code}
                    </span>
                  </p>
                  <p className="text-sm text-blue-700">
                    Status:{" "}
                    {userTeam.payment_status === "paid"
                      ? "✅ Registered"
                      : "⏳ Payment Pending"}
                  </p>
                </div>

                {/* Team Members */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Team Members
                  </h4>
                  <div className="space-y-2">
                    {userTeam.team_members?.map((member: any) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm">
                          {member.profiles?.nickname ||
                            member.profiles?.email ||
                            "Unknown"}
                          {member.user_id === userTeam.leader_id && " (Leader)"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(member.joined_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Button */}
                {userTeam.leader_id === user?.id &&
                  userTeam.payment_status === "pending" && (
                    <button
                      onClick={() => handlePayment(userTeam.id)}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Pay Entry Fee (GH₵ {tournament.entry_fee})
                    </button>
                  )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Create Team */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    Create New Team
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter team name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={createTeam}
                      disabled={creatingTeam || !teamName.trim()}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creatingTeam ? "Creating..." : "Create Team"}
                    </button>
                  </div>
                </div>

                {/* Join Team */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    Join Existing Team
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) =>
                        setInviteCode(e.target.value.toUpperCase())
                      }
                      placeholder="Enter invite code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={joinTeam}
                      disabled={joiningTeam || !inviteCode.trim()}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {joiningTeam ? "Joining..." : "Join Team"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Teams List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Registered Teams ({teams.length}/{tournament.max_teams})
            </h2>

            {teams.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No teams registered yet. Be the first to create one!
              </p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900">
                        {team.team_name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          team.payment_status === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {team.payment_status === "paid" ? "Paid" : "Pending"}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      Members: {team.team_members?.length || 0}/4
                    </div>

                    <div className="space-y-1">
                      {team.team_members?.map((member: any) => (
                        <div
                          key={member.id}
                          className="text-sm text-gray-700 flex items-center"
                        >
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          {member.profiles?.nickname ||
                            member.profiles?.email ||
                            "Unknown"}
                          {member.user_id === team.leader_id && (
                            <span className="ml-1 text-xs text-blue-600 font-medium">
                              (Leader)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
