import React from "react";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  comparisonPeriod?: string;
  icon: React.ReactNode;
  iconBg?: string;
  onClick?: () => void;
  subValue?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  change,
  trend = "up",
  comparisonPeriod = "vs last month",
  icon,
  iconBg = "bg-blue-50 text-blue-600 border-blue-100",
  onClick,
  subValue,
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl bg-white border border-slate-200 p-5 shadow-sm transition-all duration-200 group ${
        onClick ? "cursor-pointer hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {title}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className="text-2xl font-semibold text-slate-900 tracking-tight font-sans">
              {value}
            </h3>
            {subValue && (
              <span className="text-xs font-medium text-slate-500">{subValue}</span>
            )}
          </div>
        </div>
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center border ${iconBg}`}
        >
          {icon}
        </div>
      </div>

      {(change || comparisonPeriod) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            {change && (
              <span
                className={`inline-flex items-center gap-0.5 font-medium ${
                  trend === "up"
                    ? "text-emerald-600"
                    : trend === "down"
                    ? "text-rose-600"
                    : "text-slate-500"
                }`}
              >
                {trend === "up" ? (
                  <TrendingUp size={13} />
                ) : trend === "down" ? (
                  <TrendingDown size={13} />
                ) : null}
                {change}
              </span>
            )}
            <span className="text-slate-500">{comparisonPeriod}</span>
          </div>
          {onClick && (
            <ArrowRight
              size={14}
              className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all"
            />
          )}
        </div>
      )}
    </div>
  );
};
