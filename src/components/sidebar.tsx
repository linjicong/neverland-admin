"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Gamepad2,
  Zap,
  Database,
  ScrollText,
  BarChart3,
  Trophy,
  Wheat,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "农场状态", icon: LayoutDashboard },
  { href: "/autorun", label: "一键操作", icon: Zap },
  { href: "/operations", label: "游戏操作", icon: Gamepad2 },
  { href: "/data", label: "数据中心", icon: Database },
  { href: "/stats", label: "数据统计", icon: BarChart3 },
  { href: "/logs", label: "操作日志", icon: ScrollText },
  { href: "/leaderboard", label: "排行榜", icon: Trophy },
];

function NavContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-3 space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/10"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            )}
          >
            <item.icon className="w-4.5 h-4.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
        <Wheat className="w-5 h-5 text-white" />
      </div>
      <div>
        <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
          NeverLand
        </h1>
        <p className="text-xs text-slate-500">Farm Admin</p>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="p-4 border-t border-slate-800">
      <div className="text-xs text-slate-600 text-center">
        NeverLand Farm v1.0
      </div>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 flex-col">
        <div className="p-6 border-b border-slate-800">
          <Logo />
        </div>
        <NavContent />
        <Footer />
      </aside>

      {/* Mobile header bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 flex items-center px-4 z-40 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-lg hover:bg-slate-800/60 transition-colors"
          aria-label="打开菜单"
        >
          <Menu className="w-5 h-5 text-slate-300" />
        </button>
        <span className="ml-3 text-sm font-bold bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
          NeverLand
        </span>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex flex-col z-50 md:hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <Logo />
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 -mr-2 rounded-lg hover:bg-slate-800/60 transition-colors"
                aria-label="关闭菜单"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <NavContent onItemClick={() => setMobileOpen(false)} />
            <Footer />
          </aside>
        </>
      )}
    </>
  );
}
