"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface PaystackResponse {
  reference: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        first_name: string;
        last_name: string;
        ref: string;
        callback: (response: PaystackResponse) => void;
        onClose: () => void;
      }) => {
        openIframe: () => void;
      };
    };
  }
}

export default function DepositPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    firstName: "",
    lastName: "",
    email: user?.email || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Initialize Paystack payment
      const response = await initializePaystackPayment();

      if ((response as { success: boolean }).success) {
        // Update user balance in database
        await updateUserBalance(parseFloat(formData.amount));

        // Show success and redirect
        alert(
          `Payment Successful! GHS ${parseFloat(
            formData.amount
          ).toLocaleString()} added to your account`
        );
        router.push("/wallet");
      }
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const initializePaystackPayment = async () => {
    return new Promise((resolve) => {
      const handler = window.PaystackPop.setup({
        key: "pk_live_125e185626fab5ba16eb9f1a7f8634230097ac09",
        email: formData.email,
        amount: parseFloat(formData.amount) * 100, // Convert to pesewas
        currency: "GHS",
        first_name: formData.firstName,
        last_name: formData.lastName,
        ref: "SKZ" + Date.now(), // Unique reference
        callback: function (response: PaystackResponse) {
          console.log("Payment successful:", response);
          resolve({ success: true, reference: response.reference });
        },
        onClose: function () {
          alert("Payment window closed.");
          resolve({ success: false });
        },
      });

      handler.openIframe();
    });
  };

  const updateUserBalance = async (amount: number) => {
    // Get current balance
    const { data: userData } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", user!.id)
      .single();

    const newBalance = (userData?.wallet_balance || 0) + amount;

    // Update balance
    await supabase
      .from("profiles")
      .update({ wallet_balance: newBalance })
      .eq("id", user!.id);

    // Record transaction
    await supabase.from("transactions").insert({
      user_id: user!.id,
      type: "deposit",
      amount: amount,
      status: "completed",
      paystack_reference: "PSK" + Date.now(),
      currency: "GHS",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">You must be logged in to deposit funds.</p>
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
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-2">Add Funds</h1>
        <p className="text-gray-400 mb-6">
          Deposit money to your SkillZone wallet
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Field */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Amount (GHS)
            </label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              placeholder="50.00"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
            />
            <p className="text-sm text-gray-400 mt-1">Minimum deposit: GHS 1</p>
          </div>

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium mb-2">First Name</label>
            <input
              type="text"
              required
              placeholder="John"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Last Name</label>
            <input
              type="text"
              required
              placeholder="Doe"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
            />
          </div>

          {/* Pay Now Button */}
          <button
            type="submit"
            disabled={loading || !formData.amount}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Processing..."
              : `Pay GHS ${
                  formData.amount
                    ? parseFloat(formData.amount).toLocaleString()
                    : "0"
                }`}
          </button>
        </form>

        {/* Payment Methods Info */}
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h3 className="font-semibold mb-2">Accepted Payment Methods</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
            <span>💳 Card</span>
            <span>🏦 Bank Transfer</span>
            <span>📱 Mobile Money</span>
            <span>🔢 USSD</span>
          </div>
        </div>

        {/* Ghana Mobile Money Support */}
        <div className="mt-4 p-4 bg-blue-900 rounded-lg">
          <h3 className="font-semibold mb-2 text-blue-300">
            🇬🇭 Ghana Mobile Money
          </h3>
          <p className="text-sm text-blue-200">
            Support for MTN Mobile Money, Vodafone Cash, and AirtelTigo Money
          </p>
        </div>
      </div>
    </div>
  );
}
