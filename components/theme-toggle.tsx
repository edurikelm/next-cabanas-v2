// components/theme-toggle.tsx
"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evitar hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center space-x-2">
        <Sun className="h-4 w-4" />
        <Switch disabled />
        <Moon className="h-4 w-4" />
      </div>
    )
  }

  const isDark = theme === "dark"

  return (
    <div className="flex items-center space-x-2">
      <Sun className={`h-4 w-4 transition-colors ${isDark ? 'text-gray-400' : 'text-yellow-500'}`} />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle theme"
      />
      <Moon className={`h-4 w-4 transition-colors ${isDark ? 'text-blue-400' : 'text-gray-400'}`} />
    </div>
  )
}
