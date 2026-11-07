export const routes = {
  home: "/",
  signIn: "/sign-in",
  signUp: "/sign-up",
  /** Collects fields Clerk still needs after a social sign-up (e.g. username). */
  signUpContinue: "/sign-up/continue",
  /** Where Google (OAuth) redirects back to. */
  ssoCallback: "/sso-callback",
  /** Create a property (first-run, or adding another one). */
  onboarding: "/onboarding",
  dashboard: "/dashboard",
  property: "/dashboard/property",
  media: "/dashboard/media",
  menus: "/dashboard/menus",
  menu: (menuId: string) => `/dashboard/menus/${menuId}`,
  qrCodes: "/dashboard/qr-codes",
  /** Public, guest-facing menu page. */
  publicMenu: (slug: string) => `/m/${slug}`,
  team: "/dashboard/team",
  account: "/dashboard/account",
  settings: "/dashboard/settings",
} as const;

/** Where users land after signing in or signing up. */
export const AFTER_AUTH_URL = routes.dashboard;
