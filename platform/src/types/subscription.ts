export enum PaymentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  REFUNDED = "REFUNDED",
  CANCELED = "CANCELED",
}

export interface Subscription {
  id: string;
  subscriberId: string;
  suspendedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  payments: {
    id: string;
    amount: number;
    discount: number;
    status: PaymentStatus;
    subscriptionId: string;
    startsAt: Date;
    endsAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }[];
}
