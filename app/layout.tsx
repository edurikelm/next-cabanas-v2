// app/layout.tsx
import type { Metadata } from "next";
import "@/app/globals.css";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";

export const metadata: Metadata = {
  title: "Dashboard de Arriendos",
  description: "Gestión de arriendos de cabañas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900">
          {/* Topbar móvil */}
          <div className="md:hidden sticky top-0 z-40 border-b bg-white/70 backdrop-blur">
            <div className="flex items-center gap-3 p-3">
              <MobileNav />
              <div>
                <h1 className="text-base font-semibold leading-none">Arriendos</h1>
                <p className="text-xs text-muted-foreground">Cabañas dashboard</p>
              </div>
            </div>
          </div>

          <div className="flex">
            {/* Sidebar sólo en md+ */}
            <Sidebar />
            <main className="flex-1 min-h-screen p-4 md:p-8 max-w-[1600px] w-full mx-auto">
              {children}
            </main>
          </div>
      </body>
    </html>
  );
}