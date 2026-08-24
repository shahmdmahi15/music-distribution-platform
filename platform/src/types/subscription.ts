import { WhiteLabel } from "./whitelabel";

export enum PaymentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  REFUNDED = "REFUNDED",
  CANCELED = "CANCELED",
}

export interface SubscriptionPayment {
  id: string;
  code?: string;
  amount: number;
  discount: number;
  status: PaymentStatus;
  subscriptionId: string;
  startsAt: string | Date;
  endsAt: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Subscription {
  id: string;
  code?: string;
  subscriberId: string;
  suspendedAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  payments: SubscriptionPayment[];
  whiteLabel?: WhiteLabel | null;
}
