import { Image } from "@imagekit/next";
import { GlobeIcon, MapPinIcon, PhoneIcon, StarIcon, UtensilsCrossedIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DietaryMark } from "@/components/menus/dietary-mark";
import { Skeleton } from "@/components/ui/skeleton";
import { DIETARY_LABELS, DIETARY_TYPES, formatPrice } from "@/lib/menus/constants";
import { getPublicMenu, type MenuItemWithImage } from "@/lib/menus/service";
import { cn } from "@/lib/utils";

/** Always reflects the latest edits and availability. */
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/m/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicMenu(slug);
  if (!data) return { title: "Menu not available" };
  return {
    title: `${data.menu.name} · ${data.property.name}`,
    description: data.menu.description ?? data.property.description ?? undefined,
  };
}

function ItemCard({
  item,
  currency,
  urlEndpoint,
}: {
  item: MenuItemWithImage;
  currency: string;
  urlEndpoint: string | undefined;
}) {
  return (
    <li className={cn("flex gap-3 py-4", !item.isAvailable && "opacity-55")}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <DietaryMark dietary={item.dietary} />
          <h4 className="font-medium leading-snug">{item.name}</h4>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold tabular-nums">{formatPrice(item.price, currency)}</span>
          {item.isFeatured && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <StarIcon className="size-3 fill-current" />
              Chef&apos;s pick
            </span>
          )}
          {!item.isAvailable && (
            <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">Sold out</span>
          )}
        </div>
        {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
      </div>
      {item.image && urlEndpoint && (
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-28">
          <Image
            urlEndpoint={urlEndpoint}
            src={item.image.filePath}
            alt={item.image.title}
            fill
            sizes="112px"
            className="object-cover"
          />
        </div>
      )}
    </li>
  );
}

async function PublicMenu({ params }: { params: PageProps<"/m/[slug]">["params"] }) {
  const { slug } = await params;
  const data = await getPublicMenu(slug);
  if (!data) notFound();

  const { menu, property, categories } = data;
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  const visible = categories.filter((c) => c.subcategories.some((s) => s.items.length > 0));
  const usedDiets = new Set(
    visible.flatMap((c) => c.subcategories.flatMap((s) => s.items.map((i) => i.dietary))),
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <header className="flex flex-col gap-2 px-4 pt-8 pb-5">
        <p className="text-sm font-medium text-muted-foreground">{property.name}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{menu.name}</h1>
        {menu.description && <p className="text-muted-foreground">{menu.description}</p>}
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPinIcon className="size-3" />
            {property.city}, {property.country}
          </span>
          {property.phone && (
            <a href={`tel:${property.phone}`} className="inline-flex items-center gap-1 hover:text-foreground">
              <PhoneIcon className="size-3" />
              {property.phone}
            </a>
          )}
          {property.website && (
            <a
              href={property.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <GlobeIcon className="size-3" />
              Website
            </a>
          )}
        </div>
      </header>

      {visible.length > 1 && (
        <nav
          aria-label="Menu sections"
          className="sticky top-0 z-10 border-y bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80"
        >
          <ul className="flex gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
            {visible.map((category) => (
              <li key={category.id} className="shrink-0">
                <a
                  href={`#c-${category.id}`}
                  className="block rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {category.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <main className="flex flex-col gap-10 px-4 py-6">
        {visible.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <UtensilsCrossedIcon className="size-8" />
            <p>This menu is being prepared. Please check back soon.</p>
          </div>
        )}

        {visible.map((category) => (
          <section key={category.id} id={`c-${category.id}`} className="scroll-mt-16">
            <h2 className="text-xl font-semibold tracking-tight">{category.name}</h2>
            {category.description && <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>}
            <div className="mt-4 flex flex-col gap-6">
              {category.subcategories
                .filter((sub) => sub.items.length > 0)
                .map((sub) => (
                  <div key={sub.id}>
                    <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      {sub.name}
                    </h3>
                    {sub.description && <p className="mt-1 text-sm text-muted-foreground">{sub.description}</p>}
                    <ul className="divide-y">
                      {sub.items.map((item) => (
                        <ItemCard key={item.id} item={item} currency={property.currency} urlEndpoint={urlEndpoint} />
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </section>
        ))}
      </main>

      {usedDiets.size > 0 && (
        <footer className="flex flex-wrap gap-x-4 gap-y-2 border-t px-4 py-6 text-xs text-muted-foreground">
          {DIETARY_TYPES.filter((d) => usedDiets.has(d)).map((d) => (
            <span key={d} className="inline-flex items-center gap-1.5">
              <DietaryMark dietary={d} />
              {DIETARY_LABELS[d]}
            </span>
          ))}
        </footer>
      )}
    </div>
  );
}

function PublicMenuSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-8" aria-busy="true" aria-label="Loading menu">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-4 w-full" />
      <div className="mt-6 flex flex-col gap-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function PublicMenuPage({ params }: PageProps<"/m/[slug]">) {
  return (
    <div className="min-h-svh bg-background">
      <Suspense fallback={<PublicMenuSkeleton />}>
        <PublicMenu params={params} />
      </Suspense>
    </div>
  );
}
