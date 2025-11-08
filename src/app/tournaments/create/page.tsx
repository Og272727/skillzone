"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function CreateTournamentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    game_type: "Warzone",
    entry_fee: "",
    prize_pool: "",
    max_teams: "",
    schedule: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const gameTypes = [
    "Warzone",
    "Call of Duty: Modern Warfare",
    "Fortnite",
    "Apex Legends",
    "Valorant",
    "CS:GO",
    "Rocket League",
    "Other",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tournament name is required";
    }

    if (!formData.entry_fee || parseFloat(formData.entry_fee) < 0) {
      newErrors.entry_fee = "Valid entry fee is required";
    }

    if (!formData.prize_pool || parseFloat(formData.prize_pool) < 0) {
      newErrors.prize_pool = "Valid prize pool is required";
    }

    if (!formData.max_teams || parseInt(formData.max_teams) < 1) {
      newErrors.max_teams = "Valid maximum teams is required";
    }

    if (!formData.schedule) {
      newErrors.schedule = "Tournament schedule is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("You must be logged in to create a tournament");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const tournamentData = {
        name: formData.name.trim(),
        game_type: formData.game_type,
        entry_fee: parseFloat(formData.entry_fee),
        prize_pool: parseFloat(formData.prize_pool),
        max_teams: parseInt(formData.max_teams),
        schedule: new Date(formData.schedule).toISOString(),
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from("tournaments")
        .insert([tournamentData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      alert("Tournament created successfully!");
      router.push("/"); // Redirect to home page
    } catch (error) {
      console.error("Error creating tournament:", error);
      alert("Failed to create tournament. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">You must be logged in to create a tournament.</p>
          <button
            onClick={() => router.push("/auth/login")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Create Tournament
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Tournament Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter tournament name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="game_type"
                className="block text-sm font-medium text-gray-700"
              >
                Game Type *
              </label>
              <select
                id="game_type"
                name="game_type"
                value={formData.game_type}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {gameTypes.map((game) => (
                  <option key={game} value={game}>
                    {game}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="entry_fee"
                  className="block text-sm font-medium text-gray-700"
                >
                  Entry Fee (₦) *
                </label>
                <input
                  type="number"
                  id="entry_fee"
                  name="entry_fee"
                  value={formData.entry_fee}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.entry_fee ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0.00"
                />
                {errors.entry_fee && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.entry_fee}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="prize_pool"
                  className="block text-sm font-medium text-gray-700"
                >
                  Prize Pool (₦) *
                </label>
                <input
                  type="number"
                  id="prize_pool"
                  name="prize_pool"
                  value={formData.prize_pool}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.prize_pool ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0.00"
                />
                {errors.prize_pool && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.prize_pool}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="max_teams"
                className="block text-sm font-medium text-gray-700"
              >
                Maximum Teams *
              </label>
              <input
                type="number"
                id="max_teams"
                name="max_teams"
                value={formData.max_teams}
                onChange={handleInputChange}
                min="1"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.max_teams ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter maximum number of teams"
              />
              {errors.max_teams && (
                <p className="mt-1 text-sm text-red-600">{errors.max_teams}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="schedule"
                className="block text-sm font-medium text-gray-700"
              >
                Tournament Schedule *
              </label>
              <input
                type="datetime-local"
                id="schedule"
                name="schedule"
                value={formData.schedule}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.schedule ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.schedule && (
                <p className="mt-1 text-sm text-red-600">{errors.schedule}</p>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Tournament"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
