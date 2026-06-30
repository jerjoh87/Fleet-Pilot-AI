import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { INSURANCE_BUCKET } from "@/app/api/public/insurance-upload/route";

/**
 * Serve a private insurance document via a short-lived signed URL. Access is
 * restricted to (a) a member of the organization that owns the upload — the
 * host — or (b) the signed-in customer whose email matches the upload's
 * customer. Returns a 302 redirect to the signed URL on success.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isDatabaseConfigured() || !isSupabaseAdminConfigured()) {
    return new Response("Document downloads are not available in this environment.", { status: 503 });
  }

  const user = await getAuthenticatedUser();
  if (!user) return new Response("Sign in to view this document.", { status: 401 });

  const doc = await prisma.insuranceDocument.findUnique({ where: { id } });
  if (!doc?.uploadId) return new Response("Document not found.", { status: 404 });

  const upload = await prisma.customerInsuranceUpload.findUnique({ where: { id: doc.uploadId } });
  if (!upload) return new Response("Document not found.", { status: 404 });

  // Host access: an active membership in the owning organization.
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, organizationId: upload.organizationId },
    select: { id: true }
  });

  // Customer access: the upload's customer email matches the signed-in email.
  let isOwningCustomer = false;
  if (!membership && user.email && upload.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: upload.customerId },
      select: { email: true }
    });
    isOwningCustomer = customer?.email.toLowerCase() === user.email.toLowerCase();
  }

  if (!membership && !isOwningCustomer) {
    return new Response("You don't have access to this document.", { status: 403 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(INSURANCE_BUCKET)
    .createSignedUrl(doc.storagePath, 60, { download: doc.fileName ?? undefined });

  if (error || !data?.signedUrl) {
    console.error("[insurance-docs] signed url error:", error?.message);
    return new Response("Could not generate a download link.", { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
