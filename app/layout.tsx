// app/layout.tsx
import type { Metadata } from 'next';
import '@/app/globals.css';
import { Sidebar } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';
import Header from '@/components/header';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'Dashboard de Arriendos',
  description: 'Gestión de arriendos de cabañas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {/* Header principal */}
          <Header />
          
          {/* Topbar móvil para navegación */}
          <div className="md:hidden sticky top-16 z-40 border-b bg-sidebar/70 backdrop-blur">
            <div className="flex items-center gap-3 p-3">
              <MobileNav />
              <div>
                <h1 className="text-base font-semibold leading-none text-sidebar-foreground">
                  Arriendos
                </h1>
                <p className="text-xs text-sidebar-foreground/70">
                  Cabañas dashboard
                </p>
              </div>
            </div>
          </div>

          <div className="flex">
            {/* Sidebar sólo en md+ */}
            <Sidebar />
            <main className="flex-1 min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-[1600px] w-full mx-auto">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
