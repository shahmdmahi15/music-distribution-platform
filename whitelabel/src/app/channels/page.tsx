import { PortalLayoutWrapper } from "@/components/portal-layout-wrapper";
import { ChannelsContent } from "./channels-content";

export const metadata = {
  title: "VEVO Channels | Artist Management",
  description: "Request and manage official VEVO YouTube channels for your roster artists.",
};

export default async function ChannelsPage() {
  return (
    <PortalLayoutWrapper>
      <ChannelsContent />
    </PortalLayoutWrapper>
  );
}
