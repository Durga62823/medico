import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun, MonitorCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function ThemeToggle() {
  const { theme, effectiveTheme, setLight, setDark, setSystem } = useTheme();

  const Icon = theme === "system" ? MonitorCog : effectiveTheme === "dark" ? Sun : Moon;
  const label = theme === "system" ? "System" : effectiveTheme === "dark" ? "Light" : "Dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Icon className="h-4 w-4" />
          {theme === "system" ? "System" : effectiveTheme === "dark" ? "Dark" : "Light"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={setLight}>
          <Moon className="mr-2 h-4 w-4" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={setDark}>
          <Sun className="mr-2 h-4 w-4" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={setSystem}>
          <MonitorCog className="mr-2 h-4 w-4" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}



