import React from "react";
import { getPriorityBadgeColor } from "../../utils/formatters";
import { AlertCircle, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";

interface PriorityBadgeProps {
  priority: string;
  size?: "sm" | "md";
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = "md" }) => {
  const colorClass = getPriorityBadgeColor(priority);
  const sizeClass = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-0.5";

  const renderIcon = () => {
    switch (priority) {
      case "Critical":
        return <AlertCircle size={12} />;
      case "High":
        return <AlertTriangle size={12} />;
      case "Medium":
        return <ArrowUp size={12} />;
      case "Low":
        return <ArrowDown size={12} />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-md border tracking-wide whitespace-nowrap ${colorClass} ${sizeClass}`}
    >
      {renderIcon()}
      {priority}
    </span>
  );
};
