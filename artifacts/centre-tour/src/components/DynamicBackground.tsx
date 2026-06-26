import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Bubble {
  id: number;
  size: number;
  left: string;
  delay: string;
  duration: string;
  type: "primary" | "accent" | "secondary";
  shape: "circle" | "ring" | "square";
}

export function DynamicBackground() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const { theme, mode } = useTheme();

  useEffect(() => {
    // Generate randomized bubbles once on mount
    const generated: Bubble[] = Array.from({ length: 15 }).map((_, i) => {
      const size = Math.floor(Math.random() * 50) + 15; // 15px to 65px
      const left = `${Math.random() * 100}%`;
      const delay = `${Math.random() * 12}s`;
      const duration = `${Math.random() * 15 + 20}s`; // 20s to 35s
      const type = i % 3 === 0 ? "primary" : i % 3 === 1 ? "accent" : "secondary";
      const shape = i % 4 === 0 ? "ring" : i % 4 === 1 ? "square" : "circle";
      return { id: i, size, left, delay, duration, type, shape };
    });
    setBubbles(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-20">
      {bubbles.map((b) => {
        let colorClass = "bg-primary/5 dark:bg-primary/10";
        if (b.type === "accent") {
          colorClass = "bg-accent/5 dark:bg-accent/10";
        } else if (b.type === "secondary") {
          colorClass = "bg-secondary/5 dark:bg-secondary/10";
        }

        if (b.shape === "ring") {
          colorClass = b.type === "accent" 
            ? "border border-accent/10 dark:border-accent/15 bg-transparent" 
            : b.type === "secondary" 
            ? "border border-secondary/10 dark:border-secondary/15 bg-transparent"
            : "border border-primary/10 dark:border-primary/15 bg-transparent";
        }

        const borderRadiusClass = b.shape === "circle" || b.shape === "ring" ? "rounded-full" : "rounded-xl rotate-45";

        return (
          <div
            key={b.id}
            className={`absolute bottom-0 animate-float ${colorClass} ${borderRadiusClass}`}
            style={{
              width: `${b.size}px`,
              height: `${b.size}px`,
              left: b.left,
              animationDelay: b.delay,
              animationDuration: b.duration,
              animationIterationCount: "infinite",
              animationTimingFunction: "linear",
            }}
          />
        );
      })}
    </div>
  );
}
