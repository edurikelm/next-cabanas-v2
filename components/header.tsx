// components/header.tsx
"use client"

import { Home } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"
import { MobileNav } from "./mobile-nav"

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/60">
      <div className="flex h-16 items-center justify-between px-4">
        <span className="md:hidden">
          <MobileNav />
        </span>
        {/* Logo */}
        <Link href="/" className="hidden md:flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <Home className="h-4 w-4 text-white" />
          </div>
        </Link>

        {/* Toggle de tema */}
        <ThemeToggle />
      </div>
    </header>
  )
}