"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { paystackService } from "@/services/paystack";
import { useAuth } from "@/hooks/useAuth";
import { Transaction } from "@/types";

export default function WalletPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositAccount, setDepositAccount] = useState({
    mobileNumber: "",
    network: "",
  });
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalAccount, setWithdrawalAccount] = useState({
    mobileNumber: "",
    network: "",
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!user || !depositAmount || parseFloat(depositAmount) < 1) {
      alert("Minimum deposit amount is GH₵ 1.00");
      return;
    }

    if (!depositAccount.mobileNumber || !depositAccount.network) {
      alert("Please provide your mobile number and select network provider");
      return;
    }

    // Validate Ghanaian mobile number format
    const phoneRegex = /^0[2356789]\d{8}$/;
    if (!phoneRegex.test(depositAccount.mobileNumber)) {
      alert("Please enter a valid Ghanaian mobile number (e.g., 0241234567)");
      return;
    }

    setProcessing(true);

    try {
      const amount = parseFloat(depositAmount);
      const reference = `dep_${Date.now()}_${user.id}`;

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert([
          {
            user_id: user.id,
            type: "deposit",
            amount: amount,
            status: "pending",
            paystack_reference: reference,
          },
        ])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Initialize Paystack payment
      const paymentData = await paystackService.initializeTransaction(
        user.email,
        amount,
        reference
      );

      if (paymentData.status && paymentData.data.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = paymentData.data.authorization_url;
      } else {
        throw new Error("Failed to initialize payment");
      }
    } catch (error) {
      console.error("Deposit error:", error);
      alert("Failed to initiate deposit. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!user || !withdrawalAmount || parseFloat(withdrawalAmount) < 5) {
      alert("Minimum withdrawal amount is GH₵ 5.00");
      return;
    }

    if (user.wallet_balance < parseFloat(withdrawalAmount)) {
      alert("Insufficient balance");
      return;
    }

    if (!withdrawalAccount.mobileNumber || !withdrawalAccount.network) {
      alert("Please provide your mobile number and select network provider");
      return;
    }

    // Validate Ghanaian mobile number format
    const phoneRegex = /^0[2356789]\d{8}$/;
    if (!phoneRegex.test(withdrawalAccount.mobileNumber)) {
      alert("Please enter a valid Ghanaian mobile number (e.g., 0241234567)");
      return;
    }

    setProcessing(true);

    try {
      const amount = parseFloat(withdrawalAmount);

      // For mobile money withdrawal, we'll use Paystack's mobile money transfer
      // This requires setting up mobile money recipients
      const recipientData = await paystackService.createMobileMoneyRecipient(
        withdrawalAccount.mobileNumber,
        withdrawalAccount.network,
        user.nickname || user.email
      );

      if (!recipientData.status) {
        throw new Error("Failed to create mobile money recipient");
      }

      // Initiate transfer to mobile money
      const transferData = await paystackService.initiateMobileMoneyTransfer(
        amount,
        recipientData.data.recipient_code,
        `Withdrawal from SkillZone wallet - ${user.nickname || user.email}`
      );

      if (transferData.status) {
        // Create transaction record
        const { error: transactionError } = await supabase
          .from("transactions")
          .insert([
            {
              user_id: user.id,
              type: "withdrawal",
              amount: -amount,
              status: "completed",
              paystack_reference: transferData.data.reference,
            },
          ]);

        if (transactionError) throw transactionError;

        // Update user balance
        const { error: balanceError } = await supabase
          .from("profiles")
          .update({
            wallet_balance: user.wallet_balance - amount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (balanceError) throw balanceError;

        alert("Withdrawal to mobile money initiated successfully!");
        setWithdrawalAmount("");
        setWithdrawalAccount({ mobileNumber: "", network: "" });
        fetchTransactions();
      } else {
        throw new Error("Failed to initiate mobile money transfer");
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      alert("Failed to process withdrawal. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">You must be logged in to access your wallet.</p>
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wallet</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Current Balance
              </h2>
              <p className="text-4xl font-bold text-green-600">
                GH₵ {user.wallet_balance?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Deposit Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Deposit Funds
            </h2>
            <div className="mb-4">
              <button
                onClick={() => router.push("/deposit")}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 font-semibold"
              >
                Add Funds via Paystack
              </button>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Secure payments with cards, mobile money, and bank transfers
              </p>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Quick Deposit
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={depositAccount.mobileNumber}
                  onChange={(e) =>
                    setDepositAccount((prev) => ({
                      ...prev,
                      mobileNumber: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter mobile number (e.g., 0241234567)"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter your Ghanaian mobile number
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Network Provider
                </label>
                <select
                  value={depositAccount.network}
                  onChange={(e) =>
                    setDepositAccount((prev) => ({
                      ...prev,
                      network: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select network</option>
                  <option value="MTN">MTN</option>
                  <option value="Vodafone">Vodafone</option>
                  <option value="AirtelTigo">AirtelTigo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (GH₵)
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="1"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter amount"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Minimum deposit: GH₵ 1.00
                </p>
              </div>
              <button
                onClick={handleDeposit}
                disabled={
                  processing ||
                  !depositAmount ||
                  !depositAccount.mobileNumber ||
                  !depositAccount.network
                }
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Processing..." : "Deposit via Mobile Money"}
              </button>
            </div>
          </div>

          {/* Withdrawal Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Withdraw Funds
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (GH₵)
                </label>
                <input
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  min="5"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter amount"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Minimum withdrawal: GH₵ 5.00
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={withdrawalAccount.mobileNumber}
                  onChange={(e) =>
                    setWithdrawalAccount((prev) => ({
                      ...prev,
                      mobileNumber: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter mobile number (e.g., 0241234567)"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter your Ghanaian mobile number
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Network Provider
                </label>
                <select
                  value={withdrawalAccount.network}
                  onChange={(e) =>
                    setWithdrawalAccount((prev) => ({
                      ...prev,
                      network: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select network</option>
                  <option value="MTN">MTN</option>
                  <option value="Vodafone">Vodafone</option>
                  <option value="AirtelTigo">AirtelTigo</option>
                </select>
              </div>

              <button
                onClick={handleWithdrawal}
                disabled={
                  processing ||
                  !withdrawalAmount ||
                  !withdrawalAccount.mobileNumber ||
                  !withdrawalAccount.network
                }
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Processing..." : "Withdraw to Mobile Money"}
              </button>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Transaction History
            </h2>
          </div>

          {loading ? (
            <div className="p-6">
              <div className="animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded mb-4"></div>
                ))}
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No transactions yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.type === "deposit"
                              ? "bg-green-100 text-green-800"
                              : transaction.type === "withdrawal"
                              ? "bg-red-100 text-red-800"
                              : transaction.type === "tournament_entry"
                              ? "bg-blue-100 text-blue-800"
                              : transaction.type === "prize"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {transaction.type.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`font-medium ${
                            transaction.amount > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.amount > 0 ? "+" : ""}
                          GH₵ {Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : transaction.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {transaction.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
