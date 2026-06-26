import { Link } from "wouter";
import { CalendarDays, Home, LayoutDashboard, Calendar as CalendarIcon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            FC
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground hidden sm:inline-block">
            Intellitots
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/admin" className="hover:text-primary transition-colors flex items-center gap-1">
              <LayoutDashboard className="w-4 h-4" /> Admin
            </Link>
            <Link href="/calendar" className="hover:text-primary transition-colors flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" /> Calendar
            </Link>
          </div>
          
          <Link href="/book">
            <Button className="rounded-full shadow-sm" size="sm">
              <CalendarDays className="w-4 h-4 mr-2" />
              Book a Tour
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
