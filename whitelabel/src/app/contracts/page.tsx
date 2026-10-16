import { Metadata } from "next";
import { ContractsContent } from "./contracts-content";

export const metadata: Metadata = {
  title: "Rights & Split Contracts | WhiteLabel Backstage",
  description: "Manage artist contracts, royalty split hierarchy, and payee accounts.",
};

export default function ContractsPage() {
  return <ContractsContent />;
}
