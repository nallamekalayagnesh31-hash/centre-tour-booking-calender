import { useTheme, ThemeName } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette, Sun, Moon, Check } from "lucide-react";

interface ThemeOption {
  id: ThemeName;
  name: string;
  primaryColor: string; // hex for preview dot
  accentColor: string;  // hex for preview dot
}

const THEME_OPTIONS: ThemeOption[] = [
  { id: "intellitots", name: "Intellitots Play", primaryColor: "#0ab087", accentColor: "#f97316" },
  { id: "cosmic", name: "Cosmic Nebula", primaryColor: "#8b5cf6", accentColor: "#06b6d4" },
  { id: "forest", name: "Enchanted Forest", primaryColor: "#10b981", accentColor: "#eab308" },
  { id: "candy", name: "Candy Kingdom", primaryColor: "#ec4899", accentColor: "#a855f7" },
  { id: "ocean", name: "Ocean Breeze", primaryColor: "#0ea5e9", accentColor: "#1d4ed8" },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full hover:bg-muted/50" title="Change color theme">
          <Palette className="h-[1.2rem] w-[1.2rem] text-foreground" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 p-1">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Color Themes
        </div>
        {THEME_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.id}
            onClick={() => setTheme(opt.id)}
            className="flex items-center justify-between px-2 py-1.5 cursor-pointer rounded-md focus:bg-accent focus:text-accent-foreground"
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center -space-x-1">
                <span
                  className="w-3 h-3 rounded-full border border-background shadow-sm"
                  style={{ backgroundColor: opt.primaryColor }}
                />
                <span
                  className="w-3 h-3 rounded-full border border-background shadow-sm"
                  style={{ backgroundColor: opt.accentColor }}
                />
              </div>
              <span className="text-sm font-medium">{opt.name}</span>
            </div>
            {theme === opt.id && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ModeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-9 w-9 p-0 rounded-full hover:bg-muted/50"
      onClick={() => setMode(mode === "light" ? "dark" : "light")}
      title={mode === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
    >
      {mode === "light" ? (
        <Sun className="h-[1.2rem] w-[1.2rem] text-orange-500 animate-in spin-in-45 duration-300" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] text-blue-400 animate-in spin-in-45 duration-300" />
      )}
      <span className="sr-only">Toggle mode</span>
    </Button>
  );
}

export function ThemeControls() {
  return (
    <div className="flex items-center gap-1">
      <ThemeSelector />
      <ModeToggle />
    </div>
  );
}
