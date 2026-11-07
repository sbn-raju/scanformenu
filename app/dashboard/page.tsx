import { CircleCheckIcon, CircleIcon, MapPinIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { PROPERTY_TYPE_ICONS } from "@/components/property/property-icon";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireWorkspace } from "@/lib/auth/session";
import type { Property } from "@/lib/db/schema";
import { listMenusForProperty } from "@/lib/menus/service";
import {
  LODGING_TYPES,
  MEMBER_ROLE_LABELS,
  PROPERTY_SCALE_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/properties/constants";
import { listQrCodesForProperty } from "@/lib/qr/service";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Overview" };

const PROFILE_FIELDS = [
  "description",
  "legalName",
  "taxId",
  "establishedOn",
  "seatingCapacity",
  "staffCount",
  "email",
  "phone",
  "website",
] as const satisfies readonly (keyof Property)[];

function formatAddress(p: Property): string {
  return [p.addressLine1, p.addressLine2, p.city, p.state, p.postalCode, p.country]
    .filter(Boolean)
    .join(", ");
}

function formatNumber(value: number | null, unit: string): string | null {
  return value == null ? null : `${value.toLocaleString()} ${unit}`;
}

export default async function DashboardPage() {
  const { user, activeProperty: property } = await requireWorkspace();
  const Icon = PROPERTY_TYPE_ICONS[property.type];
  const [menus, qrCodes] = await Promise.all([
    listMenusForProperty(property.id),
    listQrCodesForProperty(property.id),
  ]);
  const stats = [
    { label: "Menus", value: menus.length, detail: `${menus.filter((m) => m.isActive).length} live`, href: routes.menus },
    { label: "Menu items", value: menus.reduce((sum, m) => sum + m.itemCount, 0), href: routes.menus },
    { label: "QR codes", value: qrCodes.length, href: routes.qrCodes },
    { label: "Total scans", value: qrCodes.reduce((sum, q) => sum + q.scanCount, 0), href: routes.qrCodes },
  ];

  const filled = PROFILE_FIELDS.filter((field) => property[field] != null).length;
  const profileComplete = filled >= PROFILE_FIELDS.length - 2;

  const checklist = [
    { label: "Create your property", done: true },
    {
      label: "Complete your property profile",
      detail: `${filled} of ${PROFILE_FIELDS.length} optional details added`,
      done: profileComplete,
      href: routes.property,
    },
    { label: "Add contact details for guests", done: Boolean(property.email || property.phone), href: routes.property },
    { label: "Build your first menu", done: menus.some((m) => m.itemCount > 0), href: routes.menus },
    { label: "Print table QR codes", done: qrCodes.length > 0, href: routes.qrCodes },
  ];

  const capacity = [
    formatNumber(property.seatingCapacity, "seats"),
    LODGING_TYPES.includes(property.type) ? formatNumber(property.roomCount, "rooms") : null,
    formatNumber(property.floorCount, property.floorCount === 1 ? "floor" : "floors"),
    formatNumber(property.staffCount, "staff"),
    formatNumber(property.areaSqFt, "sq ft"),
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        title={`Welcome back${user.firstName ? `, ${user.firstName}` : ""}`}
        description={`Here's what's happening at ${property.name}.`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="flex flex-col gap-1 rounded-xl border bg-card p-4 outline-none transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="text-sm text-muted-foreground">{stat.label}</span>
            <span className="text-2xl font-semibold tabular-nums">{stat.value.toLocaleString()}</span>
            {stat.detail && <span className="text-xs text-muted-foreground">{stat.detail}</span>}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon className="size-4 text-muted-foreground" />
              {property.name}
            </CardTitle>
            <CardDescription className="flex flex-wrap gap-1.5 pt-1">
              <Badge variant="secondary">{PROPERTY_TYPE_LABELS[property.type]}</Badge>
              <Badge variant="outline">{MEMBER_ROLE_LABELS[property.role]}</Badge>
            </CardDescription>
            <CardAction>
              <Link href={routes.property} className={buttonVariants({ variant: "outline", size: "sm" })}>
                Edit
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="text-muted-foreground">Owner</dt>
              <dd>{property.ownerName}</dd>
              <dt className="text-muted-foreground">Address</dt>
              <dd className="flex gap-1.5">
                <MapPinIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                {formatAddress(property)}
              </dd>
              <dt className="text-muted-foreground">Size</dt>
              <dd>{PROPERTY_SCALE_LABELS[property.scale]}</dd>
              {capacity.length > 0 && (
                <>
                  <dt className="text-muted-foreground">Capacity</dt>
                  <dd>{capacity.join(" · ")}</dd>
                </>
              )}
              {property.establishedOn && (
                <>
                  <dt className="text-muted-foreground">Operating since</dt>
                  <dd>
                    {new Date(`${property.establishedOn}T00:00:00`).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                    })}
                  </dd>
                </>
              )}
              <dt className="text-muted-foreground">Currency · Time zone</dt>
              <dd>
                {property.currency} · {property.timezone.replaceAll("_", " ")}
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Getting started</CardTitle>
            <CardDescription>A few steps to get your digital menu live.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3 text-sm">
              {checklist.map((step) => (
                <li key={step.label} className="flex items-start gap-2.5">
                  {step.done ? (
                    <CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                  ) : (
                    <CircleIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-2">
                      {step.href && !step.done ? (
                        <Link href={step.href} className="font-medium underline-offset-4 hover:underline">
                          {step.label}
                        </Link>
                      ) : (
                        <span className={step.done ? "text-muted-foreground line-through" : "font-medium"}>
                          {step.label}
                        </span>
                      )}
                    </span>
                    {step.detail && !step.done && (
                      <span className="text-xs text-muted-foreground">{step.detail}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
