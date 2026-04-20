import { Outlet, Link, useLocation } from "react-router-dom";
import { Target, LayoutDashboard, Users, Shield, Calendar, Trophy, Menu, X, CalendarDays, ExternalLink, FileText, Settings } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/divisions", label: "Divisions", icon: Shield },
  { path: "/admin/teams", label: "Teams", icon: Users },
  { path: "/admin/fixtures", label: "Fixtures", icon: Calendar },
  { path: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { path: "/admin/standings", label: "Results & Standings", icon: Trophy },
  { path: "/admin/documents", label: "League Documents", icon: FileText },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border fixed inset-y-0 z-30">
        <SidebarContent currentPath={location.pathname} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar - Mobile */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-sidebar border-r border-sidebar-border z-50 transform transition-transform duration-300 lg:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-end p-4">
          <button onClick={() => setMobileOpen(false)} className="text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent currentPath={location.pathname} onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-border bg-card sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-secondary" />
            <span className="font-heading font-semibold text-sm tracking-wide uppercase">EDDL</span>
          </div>
        </div>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function SidebarContent({ currentPath, onNavigate }) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-2">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all border border-sidebar-border mb-3"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Public Dashboard
        </a>
        <div className="flex items-center gap-3">
          <img src="https://media.base44.com/images/public/69d802d487fdb2f65d24198e/2add1838e_ceb4cd67-33f4-4f7d-af3a-4d884fa9f231.jpeg" alt="EDDL Logo" className="h-10 w-10 rounded-full object-cover" />
          <div>
            <h1 className="font-heading text-sm font-bold tracking-widest uppercase text-sidebar-foreground">Eynsham</h1>
            <p className="text-xs text-sidebar-foreground/60 font-heading tracking-wider uppercase">District Darts League</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPath === item.path || (item.path !== "/admin" && currentPath.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/40 text-center font-heading tracking-wider uppercase">
          Season 2025/26
        </p>
      </div>
    </div>
  );
}