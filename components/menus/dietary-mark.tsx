import { DIETARY_LABELS, type DietaryType } from "@/lib/menus/constants";
import { cn } from "@/lib/utils";

const DIETARY_DOT: Record<DietaryType, string> = {
  veg: "border-green-600 after:bg-green-600",
  vegan: "border-emerald-600 after:bg-emerald-600",
  egg: "border-amber-500 after:bg-amber-500",
  non_veg: "border-red-600 after:bg-red-600",
};

/** The square-and-dot diet marker used on Indian menus, colored by diet. */
export function DietaryMark({ dietary }: { dietary: DietaryType | null }) {
  if (!dietary) return null;
  return (
    <span
      role="img"
      aria-label={DIETARY_LABELS[dietary]}
      title={DIETARY_LABELS[dietary]}
      className={cn(
        "relative inline-flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] after:size-1.5 after:rounded-full",
        DIETARY_DOT[dietary],
      )}
    />
  );
}
