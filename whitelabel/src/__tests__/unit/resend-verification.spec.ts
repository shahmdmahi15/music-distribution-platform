import { describe, it, expect, vi, beforeEach } from "vitest";
import { resendVerificationSchema } from "@/schemas/auth.schema";
import { resendVerificationAction } from "@/actions/auth/resend-verification.action";
import { api } from "@/lib/api";

// Mock the axios api client
vi.mock("@/lib/api", () => ({
  api: {
    post: vi.fn(),
  },
}));

describe("Email Verification Resending System Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Schema Validation (resendVerificationSchema)", () => {
    it("accepts valid email addresses", () => {
      const validEmails = [
        "artist@label.com",
        "producer.beats+vip@music.io",
        "mgmt_team@records.co.uk",
      ];

      for (const email of validEmails) {
        const result = resendVerificationSchema.safeParse({ email });
        expect(result.success).toBe(true);
      }
    });

    it("rejects empty or whitespace-only email", () => {
      const emptyResult = resendVerificationSchema.safeParse({ email: "" });
      expect(emptyResult.success).toBe(false);
      if (!emptyResult.success) {
        expect(emptyResult.error.issues[0]?.message).toMatch(/required|email/i);
      }
    });

    it("rejects malformed email addresses", () => {
      const invalidEmails = [
        "notanemail",
        "@domain.com",
        "artist@",
        "spaces in@domain.com",
      ];

      for (const email of invalidEmails) {
        const result = resendVerificationSchema.safeParse({ email });
        expect(result.success).toBe(false);
      }
    });
  });

  describe("Server Action Execution (resendVerificationAction)", () => {
    it("returns validation failure immediately for invalid email string without API call", async () => {
      const result = await resendVerificationAction("invalid-email-address");

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/valid email/i);
      expect(api.post).not.toHaveBeenCalled();
    });

    it("returns validation failure immediately for empty object without API call", async () => {
      const result = await resendVerificationAction({ email: "" });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/required|valid email/i);
      expect(api.post).not.toHaveBeenCalled();
    });

    it("successfully calls /whitelabel/auth/resend-verification with normalized email", async () => {
      (api.post as any).mockResolvedValueOnce({
        data: {
          success: true,
          message: "If the email is registered, a verification link has been sent.",
        },
      });

      const result = await resendVerificationAction("Artist@Label.COM  ");

      expect(result.success).toBe(true);
      expect(result.message).toBe("If the email is registered, a verification link has been sent.");
      expect(api.post).toHaveBeenCalledWith("/whitelabel/auth/resend-verification", {
        email: "artist@label.com",
      });
    });

    it("handles backend error responses gracefully", async () => {
      (api.post as any).mockResolvedValueOnce({
        data: {
          success: false,
          error: true,
          message: "Too many verification requests. Please wait a moment.",
        },
      });

      const result = await resendVerificationAction("artist@label.com");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Too many verification requests. Please wait a moment.");
    });
  });
});
