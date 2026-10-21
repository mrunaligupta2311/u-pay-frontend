export const formatMoney = (amount) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2
}).format(Number(amount) || 0);

export const formatDate = (value) => new Intl.DateTimeFormat("en-IN", {
  day: "2-digit", month: "short", year: "numeric"
}).format(new Date(value));

export const formatDateTime = (value) => new Intl.DateTimeFormat("en-IN", {
  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
}).format(new Date(value));

export const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
