import { StarIcon } from "lucide-react";

import { DietaryMark } from "@/components/menus/dietary-mark";
import type { DietaryType } from "@/lib/menus/constants";
import { cn } from "@/lib/utils";

type SampleItem = {
  name: string;
  price: string;
  dietary: DietaryType;
  description?: string;
  featured?: boolean;
  soldOut?: boolean;
  swatch?: string;
};

const SAMPLE: { section: string; items: SampleItem[] }[] = [
  {
    section: "Hot coffee",
    items: [
      {
        name: "Flat white",
        price: "$4.50",
        dietary: "veg",
        description: "Double ristretto, silky steamed milk.",
        featured: true,
        swatch: "from-amber-200 to-amber-700",
      },
      { name: "Cortado", price: "$4.00", dietary: "veg" },
    ],
  },
  {
    section: "Brunch",
    items: [
      {
        name: "Avocado toast",
        price: "$11.00",
        dietary: "vegan",
        description: "Sourdough, chilli, lime, seeds.",
        swatch: "from-lime-200 to-emerald-600",
      },
      { name: "Eggs Benedict", price: "$13.50", dietary: "egg", soldOut: true },
    ],
  },
];

/** A static mock of the public menu page, framed as a phone. Decorative only. */
export function PhoneMenuPreview({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative w-[17rem] rounded-[2.5rem] border-[10px] border-zinc-900 bg-zinc-900 shadow-2xl shadow-zinc-900/20 select-none dark:border-zinc-700 dark:bg-zinc-700",
        className,
      )}
    >
      <div className="absolute top-2 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-zinc-900 dark:bg-zinc-700" />
      <div className="overflow-hidden rounded-[1.9rem] bg-background">
        <div className="px-4 pt-9 pb-3">
          <p className="text-[10px] font-medium text-muted-foreground">The Corner Café</p>
          <p className="text-lg font-semibold tracking-tight">All-day menu</p>
        </div>
        <div className="flex gap-1 border-y px-3 py-1.5 text-[10px] font-medium">
          <span className="rounded-full bg-muted px-2 py-0.5">Coffee</span>
          <span className="px-2 py-0.5 text-muted-foreground">Brunch</span>
          <span className="px-2 py-0.5 text-muted-foreground">Bakes</span>
        </div>
        <div className="flex flex-col gap-3 px-4 py-3">
          {SAMPLE.map((group) => (
            <div key={group.section}>
              <p className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">{group.section}</p>
              <ul className="divide-y">
                {group.items.map((item) => (
                  <li key={item.name} className={cn("flex gap-2 py-2", item.soldOut && "opacity-55")}>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <DietaryMark dietary={item.dietary} />
                        <span className="text-xs font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="font-semibold tabular-nums">{item.price}</span>
                        {item.featured && (
                          <span className="inline-flex items-center gap-0.5 font-medium text-amber-600 dark:text-amber-400">
                            <StarIcon className="size-2.5 fill-current" />
                            Chef&apos;s pick
                          </span>
                        )}
                        {item.soldOut && (
                          <span className="rounded-full border px-1.5 text-[9px] text-muted-foreground">Sold out</span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-[10px] leading-snug text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                    {item.swatch && (
                      <div className={cn("size-12 shrink-0 rounded-lg bg-gradient-to-br", item.swatch)} />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
