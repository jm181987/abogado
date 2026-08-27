import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { ProfessionalContacts } from "@/components/ProfessionalContacts";
import { HomeLanguageSync } from "@/components/HomeLanguageSync";

/**
 * The homepage already has complete local copy and useSiteContent() merges the
 * published Supabase data when it arrives. Do not block first paint on a
 * network round-trip: render immediately and hydrate the editable content in
 * the background.
 */
export function SiteContentGateFast({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname !== "/") return <>{children}</>;

  return (
    <>
      <HomeLanguageSync />
      <ProfessionalContacts />
      {children}
    </>
  );
}
