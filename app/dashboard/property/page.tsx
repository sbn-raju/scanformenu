import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/page-header";
import { PropertyForm } from "@/components/property/property-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireWorkspace } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Property details" };

export default async function PropertyPage() {
  const { activeProperty: property } = await requireWorkspace();
  const canEdit = property.role === "owner" || property.role === "manager";

  return (
    <>
      <PageHeader
        title="Property details"
        description="Your property's profile, ownership, size and contact information."
      />
      {!canEdit && (
        <Alert>
          <AlertDescription>
            You have view-only access. Ask the property owner or a manager to make changes.
          </AlertDescription>
        </Alert>
      )}
      {/* key: remount with fresh defaults when switching property */}
      <PropertyForm key={property.id} mode="edit" defaults={property} readOnly={!canEdit} />
    </>
  );
}
