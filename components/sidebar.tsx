// components/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Home, BarChart3, Cog, UserRound  } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export const nav = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/calendario', label: 'Calendario', icon: CalendarDays },
  { href: '/arriendos', label: 'Arriendos', icon: Home },
  { href: '/estadisticas', label: 'Estadísticas', icon: BarChart3 },
  { href: '/arrendatarios', label: 'Arrendatarios', icon: UserRound },
  { href: '/configuraciones', label: 'Configuraciones', icon: Cog },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-[calc(100vh-4rem)] w-60 border-r bg-sidebar backdrop-blur sticky top-16 hidden md:flex md:flex-col">
      <nav className="p-4 space-y-2">
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-4 text-xs text-sidebar-foreground/70">
        <p>© {new Date().getFullYear()} Cabañas</p>
      </div>
    </aside>
  );
}
