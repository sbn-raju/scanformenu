import {
  Building2Icon,
  ChefHatIcon,
  CoffeeIcon,
  CroissantIcon,
  HotelIcon,
  StoreIcon,
  TreePalmIcon,
  UtensilsCrossedIcon,
  WineIcon,
  type LucideIcon,
} from "lucide-react";

import type { PropertyType } from "@/lib/properties/constants";

export const PROPERTY_TYPE_ICONS: Record<PropertyType, LucideIcon> = {
  restaurant: UtensilsCrossedIcon,
  cafe: CoffeeIcon,
  bar: WineIcon,
  hotel: HotelIcon,
  resort: TreePalmIcon,
  bakery: CroissantIcon,
  cloud_kitchen: ChefHatIcon,
  food_court: StoreIcon,
  other: Building2Icon,
};
