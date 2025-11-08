"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { paystackService } from "@/services/paystack";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">(
    "verifying"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get("reference");
      const trxref = searchParams.get("trxref");

      if (!reference) {
        setStatus("failed");
        setMessage("Payment reference not found");
        return;
      }

      try {
        // Verify payment with Paystack
        const verificationResult = await paystackService.verifyTransaction(
          reference
        );

        if (
          verificationResult.status &&
          verificationResult.data.status === "success"
        ) {
          // Payment successful, update transaction and user balance
          const amount = verificationResult.data.amount / 100; // Convert from kobo

          // Update transaction status
          const { error: transactionError } = await supabase
            .from("transactions")
            .update({
              status: "completed",
            })
            .eq("paystack_reference", reference);

          if (transactionError) throw transactionError;

          // Get user ID from transaction
          const { data: transaction } = await supabase
            .from("transactions")
            .select("user_id")
            .eq("paystack_reference", reference)
            .single();

          if (transaction) {
            // Update user balance
            const { data: profile } = await supabase
              .from("profiles")
              .select("wallet_balance")
              .eq("id", transaction.user_id)
              .single();

            if (profile) {
              const newBalance = (profile.wallet_balance || 0) + amount;

              const { error: balanceError } = await supabase
                .from("profiles")
                .update({
                  wallet_balance: newBalance,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", transaction.user_id);

              if (balanceError) throw balanceError;
            }
          }

          setStatus("success");
          setMessage(
            `Payment successful! GH₵ ${amount.toFixed(
              2
            )} has been added to your wallet.`
          );

          // Redirect to wallet after 3 seconds
          setTimeout(() => {
            router.push("/wallet");
          }, 3000);
        } else {
          // Payment failed
          const { error: transactionError } = await supabase
            .from("transactions")
            .update({
              status: "failed",
            })
            .eq("paystack_reference", reference);

          setStatus("failed");
          setMessage(
            "Payment verification failed. Please contact support if money was debited from your account."
          );
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("failed");
        setMessage(
          "An error occurred while verifying payment. Please contact support."
        );
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        {status === "verifying" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Payment
            </h1>
            <p className="text-gray-600">
              Please wait while we verify your payment...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              Redirecting to your wallet...
            </p>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Failed
            </h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => router.push("/wallet")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Wallet
            </button>
          </>
        )}
      </div>
    </div>
  );
}
