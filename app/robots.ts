import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private workspace, auth plumbing and QR redirects (crawling them would inflate scan counts).
      disallow: ["/dashboard", "/onboarding", "/api/", "/q/", "/sso-callback", "/sign-up/continue"],
    },
    ...(siteUrl && { sitemap: `${siteUrl}/sitemap.xml` }),
  };
}
