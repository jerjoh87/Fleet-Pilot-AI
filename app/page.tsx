import { redirect } from "next/navigation";

/**
 * The public front page is the LuxeDrive marketplace storefront (Turo-style),
 * not a separate marketing landing page. Send visitors straight to it.
 */
export default function Home() {
  redirect("/luxedrive");
}
