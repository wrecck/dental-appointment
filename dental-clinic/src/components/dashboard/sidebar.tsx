"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SquaresFour,
  UsersThree,
  CalendarBlank,
  Tooth,
  CurrencyCircleDollar,
  Receipt,
  Pill,
  ChatText,
  Code,
  GearSix,
  SignOut,
  CaretDown,
  Buildings,
} from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: SquaresFour },
  { name: "Patients", href: "/dashboard/patients", icon: UsersThree },
  { name: "Appointments", href: "/dashboard/appointments", icon: CalendarBlank },
  { name: "Dental Charts", href: "/dashboard/charts", icon: Tooth },
  { name: "Payments", href: "/dashboard/payments", icon: CurrencyCircleDollar },
  { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
  { name: "Prescriptions", href: "/dashboard/prescriptions", icon: Pill },
  { name: "SMS", href: "/dashboard/sms", icon: ChatText },
  { name: "Booking Embed", href: "/dashboard/booking-embed", icon: Code },
  { name: "Settings", href: "/dashboard/settings", icon: GearSix },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-full w-64 flex-col bg-[oklch(0.22_0.03_220)] text-white">
      <div className="flex h-16 items-center gap-3 px-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-teal-400/20 ring-1 ring-teal-300/30 flex items-center justify-center">
          <Tooth weight="duotone" className="h-5 w-5 text-teal-300" />
        </div>
        <div className="min-w-0">
          <p className="font-heading text-lg leading-none tracking-tight">Dental</p>
          <p className="text-[11px] text-white/50 truncate mt-0.5">Clinic OS</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-0.5">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-teal-400/15 text-teal-100 ring-1 ring-teal-300/20"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon
                  weight={isActive ? "duotone" : "regular"}
                  className="h-[18px] w-[18px]"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-white/10 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center justify-start gap-3 px-3 py-3 text-white hover:bg-white/5 rounded-xl">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-teal-400/20 text-teal-100 text-xs">
                {session?.user?.name ? getInitials(session.user.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium truncate">{session?.user?.name}</p>
              <p className="text-xs text-white/45 truncate">{session?.user?.clinicName}</p>
            </div>
            <CaretDown className="h-4 w-4 text-white/45" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <Link href="/dashboard/settings">
              <DropdownMenuItem className="cursor-pointer">
                <Buildings className="mr-2 h-4 w-4" />
                Clinic Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="cursor-pointer text-red-600"
            >
              <SignOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
