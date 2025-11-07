"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Tournament {
  id: string;
  name: string;
  game_type: string;
  entry_fee: number;
  prize_pool: number;
  max_teams: number;
  status: string;
  schedule: string;
}

export default function Home() {
  // Sample tournament data - will be replaced with real data from Supabase
  const sampleTournaments: Tournament[] = [
    {
      id: "1",
      name: "Warzone Championship 2024",
      game_type: "Warzone",
      entry_fee: 500,
      prize_pool: 25000,
      max_teams: 50,
      status: "Open",
      schedule: "2024-01-20 20:00",
    },
    {
      id: "2",
      name: "Battle Royale Masters",
      game_type: "Warzone",
      entry_fee: 300,
      prize_pool: 15000,
      max_teams: 30,
      status: "Open",
      schedule: "2024-01-22 18:00",
    },
    {
      id: "3",
      name: "Weekend Warriors",
      game_type: "Warzone",
      entry_fee: 200,
      prize_pool: 10000,
      max_teams: 25,
      status: "Open",
      schedule: "2024-01-27 15:00",
    },
  ];

  const [tournaments, setTournaments] =
    useState<Tournament[]>(sampleTournaments);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">SkillZone</h1>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/auth/login"
                className="text-white hover:text-blue-400 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Welcome to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
              SkillZone
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            The ultimate Warzone tournament platform. Compete, win prizes, and
            climb the leaderboards in the most competitive gaming environment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tournaments/create"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105"
            >
              Create Tournament
            </Link>
            <Link
              href="/tournaments"
              className="border-2 border-white/20 hover:border-white/40 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all"
            >
              Browse Tournaments
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming Tournaments */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Upcoming Tournaments
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-gray-800/50 rounded-lg p-6 animate-pulse"
                >
                  <div className="h-4 bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10 hover:border-white/20 transition-all hover:transform hover:scale-105"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-white">
                      {tournament.name}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        tournament.status === "Open"
                          ? "bg-green-600 text-white"
                          : "bg-gray-600 text-white"
                      }`}
                    >
                      {tournament.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-gray-300">
                      <span className="font-medium">Game:</span>{" "}
                      {tournament.game_type}
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium">Entry Fee:</span> GH₵
                      {tournament.entry_fee}
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium">Prize Pool:</span> GH₵
                      {tournament.prize_pool.toLocaleString()}
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium">Max Teams:</span>{" "}
                      {tournament.max_teams}
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium">Schedule:</span>{" "}
                      {new Date(tournament.schedule).toLocaleString()}
                    </p>
                  </div>

                  <Link
                    href={`/tournaments/${tournament.id}`}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-center transition-colors block"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Why Choose SkillZone?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Competitive Tournaments
              </h3>
              <p className="text-gray-300">
                Join high-stakes tournaments with real prizes and professional
                gameplay.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Secure Payments
              </h3>
              <p className="text-gray-300">
                Safe and instant payments through Paystack with escrow
                protection.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Live Tracking
              </h3>
              <p className="text-gray-300">
                Real-time match tracking and automated scoring with COD API
                integration.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Team Management
              </h3>
              <p className="text-gray-300">
                Easy team formation with invite links and automatic payment
                handling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 backdrop-blur-sm border-t border-white/10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">
            © 2024 SkillZone. Built for competitive Warzone gaming.
          </p>
        </div>
      </footer>
    </div>
  );
}
