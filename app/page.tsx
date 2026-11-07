import {
  BarChart3Icon,
  ChevronDownIcon,
  ImageIcon,
  LayersIcon,
  LinkIcon,
  type LucideIcon,
  PrinterIcon,
  RefreshCwIcon,
  ScanLineIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  StoreIcon,
  UsersIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { AuthActions } from "@/components/landing/auth-actions";
import { PhoneMenuPreview } from "@/components/landing/phone-menu-preview";
import { QrArt } from "@/components/landing/qr-art";
import { DietaryMark } from "@/components/menus/dietary-mark";
import { DIETARY_LABELS, DIETARY_TYPES, QR_COLORS } from "@/lib/menus/constants";
import { PROPERTY_TYPE_LABELS, PROPERTY_TYPES } from "@/lib/properties/constants";
import { routes } from "@/lib/routes";

/** What the example QR codes encode, so scanning them opens this site. */
const SAMPLE_QR_VALUE = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://scanformenu.com";

const DESCRIPTION =
  "Build a digital menu, print a QR code for every table, and update prices or sold-out dishes in seconds. For restaurants, cafés, bars and hotels.";

export const metadata: Metadata = {
  title: { absolute: "ScanForMenu · QR code menus for restaurants, cafés and hotels" },
  description: DESCRIPTION,
  openGraph: {
    title: "ScanForMenu · QR code menus that stay up to date",
    description: DESCRIPTION,
    type: "website",
    siteName: "ScanForMenu",
  },
};

const NAV = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#faq", label: "FAQ" },
];

const STEPS = [
  {
    icon: StoreIcon,
    title: "Add your venue",
    body: "Sign up and create your property. Set your currency and time zone once, and every price shows in it.",
  },
  {
    icon: LayersIcon,
    title: "Build your menu",
    body: "Add categories, sections and items with prices, photos and diet markers. Drag to reorder anything.",
  },
  {
    icon: PrinterIcon,
    title: "Print and place",
    body: "Create a QR code for each table, the entrance or a flyer. Download it as SVG or PNG and print it.",
  },
] satisfies { icon: LucideIcon; title: string; body: string }[];

const FEATURES = [
  {
    icon: RefreshCwIcon,
    title: "Changes show on the next scan",
    body: "Mark a dish sold out, change a price or feature a chef's pick. Guests see it the next time they scan.",
  },
  {
    icon: LinkIcon,
    title: "Printed codes keep working",
    body: "Codes point to a short link, not the menu, so you never reprint because the menu changed.",
  },
  {
    icon: SmartphoneIcon,
    title: "Fast on any phone",
    body: "A clean, mobile-first menu that opens in the browser. Guests don't install an app or sign up.",
  },
  {
    icon: ImageIcon,
    title: "Photos that load quickly",
    body: "Upload dish photos once. They're resized and optimized automatically for every screen.",
  },
  {
    icon: BarChart3Icon,
    title: "See when guests scan",
    body: "Each QR code counts its scans and records the last one, so you can tell which tables and flyers get used.",
  },
  {
    icon: UsersIcon,
    title: "Built for your team",
    body: "Invite managers to edit menus and staff to view them. Run several venues from one account.",
  },
] satisfies { icon: LucideIcon; title: string; body: string }[];

const FAQ = [
  {
    q: "Do my guests need to download an app?",
    a: "No. Guests point their phone camera at the code and the menu opens in their browser. There's nothing to install and no sign-up.",
  },
  {
    q: "What happens to my printed codes if I change the menu?",
    a: "Nothing, and that's the point. Each code points to a short link that we redirect to your menu, so printed codes keep working while you edit dishes, prices and sections. If you switch a menu off, guests see a friendly \"unavailable\" message instead of an error.",
  },
  {
    q: "Can I use one account for more than one venue?",
    a: "Yes. One account can manage several properties, each with its own menus, QR codes, photos and team, and you switch between them from the sidebar.",
  },
  {
    q: "Can my staff help manage the menu?",
    a: "Yes. Add people by email and give each one a role. Owners have full access, managers edit menus, photos and QR codes, and staff can view everything without making changes.",
  },
  {
    q: "Which currencies are supported?",
    a: "You choose your property's currency when you set it up, and every price on your public menu is shown in it.",
  },
  {
    q: "Can I print codes in my brand colors?",
    a: `Codes come in ${QR_COLORS.length} print-safe colors (${QR_COLORS.map((c) => c.label.toLowerCase()).join(", ")}), all dark on light so they scan reliably. Download them as SVG for print shops or as a 1024 px PNG.`,
  },
];

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">{eyebrow}</p>
      <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {body && <p className="text-pretty text-muted-foreground sm:text-lg">{body}</p>}
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </a>
          ))}
        </nav>
        <AuthActions />
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[36rem] bg-[radial-gradient(ellipse_at_top,var(--color-amber-100),transparent_65%)] dark:bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--color-amber-500)_14%,transparent),transparent_65%)]"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-24 lg:pb-28">
        <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <ScanLineIcon className="size-3.5 text-amber-600 dark:text-amber-400" />
            Digital menus for restaurants, cafés, bars and hotels
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Your menu, one scan away. Always up to date.
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted-foreground">
            Build a beautiful digital menu, print a QR code for every table, and change prices or mark dishes sold out
            in seconds. No reprinting, and no app for your guests.
          </p>
          <AuthActions size="lg" showSignIn={false} className="flex-wrap justify-center lg:justify-start" />
          <p className="text-sm text-muted-foreground">Set up your first menu in minutes.</p>
        </div>

        <div className="relative mx-auto flex items-center justify-center">
          <PhoneMenuPreview className="rotate-2" />
          <div className="absolute -bottom-6 -left-10 flex flex-col items-center gap-2 rounded-2xl border bg-card p-3 shadow-xl sm:-left-16">
            <div className="rounded-lg bg-white p-2">
              <QrArt value={SAMPLE_QR_VALUE} className="size-20" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">Table 4</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 border-t bg-muted/40 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="How it works"
          title="From paper menu to QR code in three steps"
          body="No designers, no printers on standby. You stay in control of every dish and price."
        />
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative flex flex-col gap-4 rounded-2xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <step.icon className="size-5" />
                </span>
                <span className="font-mono text-sm text-muted-foreground">0{i + 1}</span>
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="scroll-mt-16 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Features"
          title="Everything a busy floor needs"
          body="Made for the moment a dish runs out halfway through service."
        />
        <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="flex flex-col gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl border bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                <feature.icon className="size-5" />
              </span>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Showcase() {
  return (
    <section className="border-t bg-muted/40 py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6 rounded-2xl border bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-semibold tracking-tight">Clear diet markers</h3>
            <p className="text-muted-foreground">
              Tag each item so guests can find what they can eat at a glance.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-3">
            {DIETARY_TYPES.map((d) => (
              <li key={d} className="flex items-center gap-2.5 rounded-xl border bg-background px-3 py-2.5 text-sm">
                <DietaryMark dietary={d} />
                {DIETARY_LABELS[d]}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-6 rounded-2xl border bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-semibold tracking-tight">QR codes that match your space</h3>
            <p className="text-muted-foreground">
              Label one code per table, choose a print-safe color, and download it ready for print.
            </p>
          </div>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6">
            {QR_COLORS.map((c) => (
              <li key={c.value} className="flex flex-col items-center gap-2">
                <div className="w-full rounded-xl border bg-white p-2.5">
                  <QrArt value={SAMPLE_QR_VALUE} color={c.value} className="aspect-square w-full" />
                </div>
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Venues() {
  const venues = PROPERTY_TYPES.filter((t) => t !== "other");
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Made for hospitality"
          title="Fits the way your venue works"
          body="From a single café counter to a hotel with several outlets and a team behind it."
        />
        <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2.5">
          {venues.map((t) => (
            <li key={t} className="rounded-full border bg-card px-4 py-2 text-sm font-medium">
              {PROPERTY_TYPE_LABELS[t]}
            </li>
          ))}
        </ul>
        <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-4 rounded-2xl border bg-card p-6 text-center sm:flex-row sm:text-left">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <ShieldCheckIcon className="size-5" />
          </span>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Your data stays yours.</span> Every venue&apos;s menus,
            photos and team are kept separate, QR links can&apos;t be guessed, and permissions are checked on our
            servers every time.
          </p>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 border-t bg-muted/40 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <div className="mt-12 divide-y rounded-2xl border bg-card">
          {FAQ.map((item) => (
            <details key={item.q} className="group px-5 py-1 sm:px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-5 text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24">
      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 overflow-hidden rounded-3xl bg-zinc-900 px-6 py-16 text-center text-white dark:bg-zinc-800">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklch,var(--color-amber-500)_30%,transparent),transparent_60%)]"
        />
        <h2 className="relative max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Put your menu on every table today
        </h2>
        <p className="relative max-w-xl text-pretty text-zinc-300">
          Create your account, add your first dishes and print your first QR code before the next service.
        </p>
        <div className="dark relative">
          <AuthActions size="lg" showSignIn={false} />
        </div>
      </div>
    </section>
  );
}

/** Cached so the footer stays in the static shell (Cache Components forbids bare `new Date()`). */
async function CopyrightYear() {
  "use cache";
  return new Date().getFullYear();
}

function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <Logo />
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-foreground">
              {item.label}
            </a>
          ))}
          <Link href={routes.signIn} className="hover:text-foreground">
            Sign in
          </Link>
        </nav>
        <p>
          © <CopyrightYear /> ScanForMenu
        </p>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Features />
        <Showcase />
        <Venues />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
