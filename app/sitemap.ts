import type { MetadataRoute } from "next";

import { routes } from "@/lib/routes";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}${routes.home}`, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}${routes.signUp}`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${siteUrl}${routes.signIn}`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
