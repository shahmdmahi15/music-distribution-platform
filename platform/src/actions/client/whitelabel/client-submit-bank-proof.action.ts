"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const bankTransferProofSchema = z.object({
  bankName: z.string().min(2, "Bank name is required"),
  branchName: z.string().optional(),
  transactionReference: z
    .string()
    .min(3, "Transaction reference or voucher number is required"),
  depositAmount: z.number().positive("Deposit amount must be greater than zero"),
  depositCurrency: z.enum(["BDT", "USD"]),
  paymentDate: z.string().min(4, "Payment date is required"),
  remarks: z.string().optional(),
});

export type BankTransferProofInput = z.infer<typeof bankTransferProofSchema>;

export async function clientSubmitBankTransferProofAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return {
      success: false,
      message: "Authentication session missing. Please log in.",
    };
  }

  const file = formData.get("file") as File | null;
  const bankName = (formData.get("bankName") as string)?.trim();
  const branchName = (formData.get("branchName") as string)?.trim() || "";
  const transactionReference = (
    formData.get("transactionReference") as string
  )?.trim();
  const depositAmountStr = formData.get("depositAmount") as string;
  const depositCurrency = (formData.get("depositCurrency") as string) || "BDT";
  const paymentDate = (formData.get("paymentDate") as string)?.trim();
  const remarks = (formData.get("remarks") as string)?.trim();

  if (!file) {
    return {
      success: false,
      message: "Please attach a deposit slip, wire confirmation, or bank receipt.",
    };
  }

  if (!bankName || !transactionReference || !depositAmountStr || !paymentDate) {
    return {
      success: false,
      message: "Please fill out all mandatory payment fields.",
    };
  }

  const depositAmount = parseFloat(depositAmountStr);
  if (isNaN(depositAmount) || depositAmount <= 0) {
    return {
      success: false,
      message: "Deposit amount must be a valid positive number.",
    };
  }

  // Build document payload for the platform backend
  const documentTitle = `Bank Wire Receipt - ${bankName}${
    branchName ? ` (${branchName})` : ""
  } - Ref: ${transactionReference} (${depositAmount.toLocaleString()} ${depositCurrency}, ${paymentDate})`;

  const uploadPayload = new FormData();
  uploadPayload.append("file", file);
  uploadPayload.append("name", documentTitle);
  uploadPayload.append("type", "BANK_TRANSFER_RECEIPT");

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/documents`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
        body: uploadPayload,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message:
          data.message ||
          "Failed to upload bank deposit receipt to document vault.",
      };
    }

    revalidatePath("/");
    revalidatePath("/whitelabel");
    revalidatePath("/admin/whitelabels");

    return {
      success: true,
      message:
        "Bank transfer proof uploaded successfully! Platform administrators have been notified for payment verification.",
      document: data.document,
    };
  } catch (error) {
    console.error(
      "[Action.Client.WhiteLabel.SubmitBankTransferProof] Error:",
      error,
    );
    return {
      success: false,
      message:
        "An unexpected error occurred while submitting bank transfer proof.",
    };
  }
}
