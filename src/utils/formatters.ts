export function formatCurrency(amount: number, currency = "INR", symbol = "₹"): string {
  if (isNaN(amount) || amount === null || amount === undefined) return `${symbol}0`;

  if (currency === "INR") {
    if (amount >= 10000000) {
      return `${symbol}${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `${symbol}${(amount / 100000).toFixed(2)} L`;
    }
    return `${symbol}${amount.toLocaleString("en-IN")}`;
  }

  // USD / EUR / Generic
  if (amount >= 1000000) {
    return `${symbol}${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(1)}k`;
  }
  return `${symbol}${amount.toLocaleString()}`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function getHealthBadgeColor(health: string) {
  switch (health) {
    case "Healthy":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Watch":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "At Risk":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case "Critical":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}

export function getPriorityBadgeColor(priority: string) {
  switch (priority) {
    case "Critical":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "High":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Medium":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Low":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export function getStatusBadgeColor(status: string) {
  switch (status) {
    case "Closed Won":
    case "Completed":
    case "Done":
    case "Active":
    case "Present":
    case "Approved":
    case "Joined":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "In Progress":
    case "Proposal":
    case "Negotiation":
    case "Qualified":
    case "Interview":
    case "Technical":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Review":
    case "Pending":
    case "Discovery":
    case "Contacted":
    case "Probation":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "Planning":
    case "To Do":
    case "Backlog":
    case "New":
    case "Applied":
    case "Screening":
      return "bg-slate-100 text-slate-600 border-slate-200";
    case "On Hold":
    case "Watch":
    case "Half Day":
    case "Late":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "At Risk":
    case "Critical":
    case "Blocked":
    case "Closed Lost":
    case "Rejected":
    case "Cancelled":
    case "Absent":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}
