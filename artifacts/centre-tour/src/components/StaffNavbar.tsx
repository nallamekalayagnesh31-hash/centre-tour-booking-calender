import { Link, useLocation } from "wouter";
import { LayoutDashboard, CalendarIcon, LogOut, ChevronDown, Users, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ThemeControls } from "@/components/ThemeSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function StaffNavbar() {
  const { staff, logout } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) =>
    location === path || location.startsWith(path + "/");

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/staff/dashboard" className="flex items-center gap-2 text-primary">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            FC
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-bold text-base text-foreground">Intellitots</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Staff Portal</span>
          </div>
        </Link>

        <div className="flex items-center gap-1 md:gap-2">
          <Link href="/staff/dashboard">
            <Button
              variant={isActive("/staff/dashboard") ? "secondary" : "ghost"}
              size="sm"
              className="hidden md:flex gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/staff/calendar">
            <Button
              variant={isActive("/staff/calendar") ? "secondary" : "ghost"}
              size="sm"
              className="hidden md:flex gap-2"
            >
              <CalendarIcon className="w-4 h-4" />
              Calendar
            </Button>
          </Link>
          <Link href="/staff/accounts">
            <Button
              variant={isActive("/staff/accounts") ? "secondary" : "ghost"}
              size="sm"
              className="hidden md:flex gap-2"
            >
              <Users className="w-4 h-4" />
              Staff
            </Button>
          </Link>
          <Link href="/staff/referrals">
            <Button
              variant={isActive("/staff/referrals") ? "secondary" : "ghost"}
              size="sm"
              className="hidden md:flex gap-2"
            >
              <Gift className="w-4 h-4" />
              Referrals
            </Button>
          </Link>

          <div className="w-px h-6 bg-border mx-1 hidden md:block" />

          <ThemeControls />

          <div className="w-px h-6 bg-border mx-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">
                  {staff?.name?.charAt(0).toUpperCase() ?? "S"}
                </div>
                <span className="hidden md:inline text-sm font-medium">{staff?.name}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2">
                <p className="font-medium text-sm">{staff?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{staff?.role?.replace("_", " ")}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="md:hidden" asChild>
                <Link href="/staff/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="md:hidden" asChild>
                <Link href="/staff/calendar">Calendar</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="md:hidden" asChild>
                <Link href="/staff/accounts">Staff Accounts</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="md:hidden" asChild>
                <Link href="/staff/referrals">Referrals</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="md:hidden" />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
