"use client";

import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";

import { UserAvatar, type SessionUser } from "@/components/account/user-avatar";
import { isActivePath, NAV_GROUPS } from "@/components/dashboard/nav-config";
import { UserIdentity, UserMenuItems } from "@/components/dashboard/user-menu";
import { PROPERTY_TYPE_ICONS } from "@/components/property/property-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { switchPropertyAction } from "@/lib/properties/actions";
import { MEMBER_ROLE_LABELS, PROPERTY_TYPE_LABELS, type MemberRole, type PropertyType } from "@/lib/properties/constants";
import { routes } from "@/lib/routes";

export type SidebarProperty = { id: string; name: string; type: PropertyType; role: MemberRole };

function PropertyBadgeIcon({ type, className }: { type: PropertyType; className?: string }) {
  const Icon = PROPERTY_TYPE_ICONS[type];
  return (
    <span className={className}>
      <Icon />
    </span>
  );
}

function PropertySwitcher({
  properties,
  activePropertyId,
}: {
  properties: SidebarProperty[];
  activePropertyId: string;
}) {
  const { isMobile } = useSidebar();
  const [pending, startTransition] = useTransition();
  const active = properties.find((p) => p.id === activePropertyId) ?? properties[0];

  function switchTo(propertyId: string) {
    if (propertyId === active.id) return;
    startTransition(async () => {
      try {
        await switchPropertyAction(propertyId);
      } catch {
        toast.add({ title: "Couldn't switch property", type: "error" });
      }
    });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
            <PropertyBadgeIcon
              type={active.type}
              className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
            />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{active.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {PROPERTY_TYPE_LABELS[active.type]} · {MEMBER_ROLE_LABELS[active.role]}
              </span>
            </div>
            {pending ? <Spinner className="ml-auto" /> : <ChevronsUpDownIcon className="ml-auto" />}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-60"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>Properties</DropdownMenuLabel>
              {properties.map((property) => (
                <DropdownMenuItem key={property.id} onClick={() => switchTo(property.id)}>
                  <PropertyBadgeIcon
                    type={property.type}
                    className="flex size-6 items-center justify-center rounded-md border"
                  />
                  <span className="truncate">{property.name}</span>
                  {property.id === active.id && <CheckIcon className="ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href={routes.onboarding} />}>
                <span className="flex size-6 items-center justify-center rounded-md border">
                  <PlusIcon />
                </span>
                Add property
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function NavMain() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return NAV_GROUPS.map((group) => (
    <SidebarGroup key={group.label}>
      <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
      <SidebarMenu>
        {group.items.map((item) => (
          <SidebarMenuItem key={item.title}>
            {item.href ? (
              <SidebarMenuButton
                render={<Link href={item.href} onClick={() => setOpenMobile(false)} />}
                isActive={isActivePath(pathname, item.href)}
                tooltip={item.title}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            ) : (
              <>
                <SidebarMenuButton aria-disabled tooltip={`${item.title} (coming soon)`}>
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
                <SidebarMenuBadge>Soon</SidebarMenuBadge>
              </>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  ));
}

function NavUser({ user }: { user: SessionUser }) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
            <UserAvatar user={user} className="size-8 rounded-lg" />
            <UserIdentity user={user} />
            <ChevronsUpDownIcon className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-60"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <UserMenuItems user={user} />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar({
  user,
  properties,
  activePropertyId,
}: {
  user: SessionUser;
  properties: SidebarProperty[];
  activePropertyId: string;
}) {
  return (
    // "inset" + "icon": the sidebar takes its own column and pushes the page over;
    // collapsing shrinks it to an icon rail instead of sliding over the content.
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <PropertySwitcher properties={properties} activePropertyId={activePropertyId} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
