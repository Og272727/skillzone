"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { pubgService } from "@/services/pubgService";

interface PUBGAccountLinkProps {
  userId: string;
}

export default function PUBGAccountLink({ userId }: PUBGAccountLinkProps) {
  const [pubgPlayerName, setPubgPlayerName] = useState("");
  const [platform, setPlatform] = useState("steam");
  const [verifying, setVerifying] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);

  const linkPUBGAccount = async () => {
    if (!pubgPlayerName.trim()) {
      alert("Please enter a PUBG player name");
      return;
    }

    setVerifying(true);

    try {
      const playerData = await pubgService.verifyPlayerAccount(
        pubgPlayerName,
        platform
      );

      if (playerData) {
        const { error } = await supabase.from("user_pubg_accounts").upsert({
          user_id: userId,
          pubg_player_id: playerData.id,
          pubg_player_name: pubgPlayerName,
          platform: platform,
          verified: true,
        });

        if (error) throw error;

        alert("PUBG account linked successfully!");
        setPubgPlayerName("");
        loadLinkedAccounts(); // Refresh the list
      } else {
        alert(
          "Could not verify PUBG account. Please check the player name and platform."
        );
      }
    } catch (error) {
      console.error("Error linking PUBG account:", error);
      alert("Error linking PUBG account. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const loadLinkedAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("user_pubg_accounts")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      setLinkedAccounts(data || []);
    } catch (error) {
      console.error("Error loading linked accounts:", error);
    }
  };

  const unlinkAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("user_pubg_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;

      alert("PUBG account unlinked successfully!");
      loadLinkedAccounts(); // Refresh the list
    } catch (error) {
      console.error("Error unlinking account:", error);
      alert("Error unlinking account. Please try again.");
    }
  };

  // Load linked accounts on component mount
  useState(() => {
    loadLinkedAccounts();
  });

  return (
    <div className="pubg-account-link bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">
        Link Your PUBG Mobile Account
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="steam">Steam</option>
              <option value="xbox">Xbox</option>
              <option value="playstation">PlayStation</option>
              <option value="kakao">Kakao</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PUBG Player Name
            </label>
            <input
              type="text"
              value={pubgPlayerName}
              onChange={(e) => setPubgPlayerName(e.target.value)}
              placeholder="Your PUBG player name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={linkPUBGAccount}
          disabled={verifying || !pubgPlayerName.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verifying ? "Verifying..." : "Link PUBG Account"}
        </button>
      </div>

      {linkedAccounts.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-medium mb-3">Linked Accounts</h4>
          <div className="space-y-2">
            {linkedAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <span className="font-medium">
                    {account.pubg_player_name}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({account.platform})
                  </span>
                  {account.verified && (
                    <span className="ml-2 text-green-600 text-sm">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <button
                  onClick={() => unlinkAccount(account.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Unlink
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
