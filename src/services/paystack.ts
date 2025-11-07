import { Transaction } from "@/types";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY!;

export class PaystackService {
  private baseUrl = "https://api.paystack.co";

  async initializeTransaction(
    email: string,
    amount: number,
    reference: string
  ) {
    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Convert to kobo
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to initialize transaction");
    }

    return response.json();
  }

  async verifyTransaction(reference: string) {
    const response = await fetch(
      `${this.baseUrl}/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to verify transaction");
    }

    return response.json();
  }

  async createTransferRecipient(
    accountNumber: string,
    bankCode: string,
    name: string
  ) {
    const response = await fetch(`${this.baseUrl}/transferrecipient`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "nuban",
        name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create transfer recipient");
    }

    return response.json();
  }

  async initiateTransfer(
    amount: number,
    recipientCode: string,
    reason: string
  ) {
    const response = await fetch(`${this.baseUrl}/transfer`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount: amount * 100, // Convert to kobo
        recipient: recipientCode,
        reason,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to initiate transfer");
    }

    return response.json();
  }

  getPublicKey() {
    return PAYSTACK_PUBLIC_KEY;
  }
}

export const paystackService = new PaystackService();
