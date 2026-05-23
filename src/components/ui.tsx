import { cn } from "@/lib/utils";

interface CardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  color?: "green" | "blue" | "amber" | "purple" | "red" | "cyan";
  className?: string;
}

const colorMap = {
  green: "from-emerald-500/20 to-green-500/10 text-emerald-400 border-emerald-500/20",
  blue: "from-blue-500/20 to-cyan-500/10 text-blue-400 border-blue-500/20",
  amber: "from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/20",
  purple: "from-purple-500/20 to-violet-500/10 text-purple-400 border-purple-500/20",
  red: "from-red-500/20 to-rose-500/10 text-red-400 border-red-500/20",
  cyan: "from-cyan-500/20 to-teal-500/10 text-cyan-400 border-cyan-500/20",
};

export function StatCard({ title, value, icon, subtitle, color = "green", className }: CardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 backdrop-blur-sm",
        colorMap[color],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {icon && <div className="opacity-60">{icon}</div>}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  label: string;
  current: number;
  max: number;
  color?: string;
}

export function ProgressBar({ label, current, max, color = "bg-emerald-500" }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-mono">
          {current} / {max}
        </span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
