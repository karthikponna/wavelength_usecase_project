import type { IconType } from "react-icons";
import {
  SiAirtable,
  SiDatadog,
  SiFigma,
  SiHubspot,
  SiLinear,
  SiNotion,
  SiOkta,
  SiShopify,
  SiStripe,
  SiVercel,
} from "react-icons/si";

export type Account = {
  id: string;
  name: string;
  domain: string;
  logo: IconType;
  logoColor: string;
  health: number;
  arr: number;
  renewalInDays: number;
  segments: string[];
  owner: string;
  usageChange: number;
  openTickets: number;
  seatUtilization: number;
};

export const OWNERS = [
  "Marcus Chen",
  "Sofia Rodriguez",
  "James Nakamura",
  "Emma Zhu",
  "Raj Patel",
  "Claire Dubois",
] as const;

export const SEGMENTS = [
  "SaaS",
  "Fintech",
  "Security",
  "AI",
  "Dev Tools",
  "Productivity",
  "Design",
  "E-commerce",
] as const;

export const ACCOUNTS: Account[] = [
  { id: "datadog", name: "Datadog", domain: "datadoghq.com", logo: SiDatadog, logoColor: "#632CA6", health: 38, arr: 186_000, renewalInDays: 18, segments: ["SaaS", "Security", "AI"], owner: "James Nakamura", usageChange: -31, openTickets: 6, seatUtilization: 0.62 },
  { id: "notion", name: "Notion", domain: "notion.so", logo: SiNotion, logoColor: "#111111", health: 82, arr: 92_000, renewalInDays: 105, segments: ["SaaS", "Productivity"], owner: "Emma Zhu", usageChange: 18, openTickets: 1, seatUtilization: 0.97 },
  { id: "stripe", name: "Stripe", domain: "stripe.com", logo: SiStripe, logoColor: "#635BFF", health: 74, arr: 240_000, renewalInDays: 26, segments: ["SaaS", "Fintech"], owner: "Sofia Rodriguez", usageChange: 4, openTickets: 2, seatUtilization: 0.81 },
  { id: "figma", name: "Figma", domain: "figma.com", logo: SiFigma, logoColor: "#F24E1E", health: 55, arr: 128_000, renewalInDays: 59, segments: ["SaaS", "Design"], owner: "Marcus Chen", usageChange: -12, openTickets: 4, seatUtilization: 0.7 },
  { id: "linear", name: "Linear", domain: "linear.app", logo: SiLinear, logoColor: "#5E6AD2", health: 91, arr: 48_000, renewalInDays: 151, segments: ["SaaS", "Dev Tools"], owner: "Raj Patel", usageChange: 27, openTickets: 0, seatUtilization: 0.98 },
  { id: "vercel", name: "Vercel", domain: "vercel.com", logo: SiVercel, logoColor: "#000000", health: 68, arr: 156_000, renewalInDays: 10, segments: ["SaaS", "Dev Tools", "AI"], owner: "Claire Dubois", usageChange: 2, openTickets: 3, seatUtilization: 0.74 },
  { id: "airtable", name: "Airtable", domain: "airtable.com", logo: SiAirtable, logoColor: "#18BFFF", health: 47, arr: 66_000, renewalInDays: 34, segments: ["SaaS", "Productivity"], owner: "Raj Patel", usageChange: -18, openTickets: 3, seatUtilization: 0.58 },
  { id: "hubspot", name: "HubSpot", domain: "hubspot.com", logo: SiHubspot, logoColor: "#FF7A59", health: 77, arr: 112_000, renewalInDays: 132, segments: ["SaaS", "AI"], owner: "Sofia Rodriguez", usageChange: 9, openTickets: 1, seatUtilization: 0.88 },
  { id: "okta", name: "Okta", domain: "okta.com", logo: SiOkta, logoColor: "#007DC1", health: 41, arr: 210_000, renewalInDays: 67, segments: ["Security"], owner: "James Nakamura", usageChange: -22, openTickets: 7, seatUtilization: 0.66 },
  { id: "shopify", name: "Shopify", domain: "shopify.com", logo: SiShopify, logoColor: "#7AB55C", health: 63, arr: 74_000, renewalInDays: 28, segments: ["E-commerce", "AI"], owner: "Emma Zhu", usageChange: -8, openTickets: 2, seatUtilization: 0.79 },
];

export type HealthBand = "healthy" | "watch" | "risk";

export function healthBand(score: number): HealthBand {
  if (score >= 70) return "healthy";
  if (score >= 50) return "watch";
  return "risk";
}

export const HEALTH_LABEL: Record<HealthBand, string> = {
  healthy: "Healthy",
  watch: "Watch",
  risk: "At risk",
};

export type SignalScore = { score: number; reasons: string[] };

export function signalScore(a: Account): SignalScore {
  const reasons: string[] = [];
  let score = (100 - a.health) * 0.6;
  if (a.health < 50) reasons.push(`Health Pulse ${a.health}`);
  if (a.usageChange < 0) {
    score += -a.usageChange * 1.2;
    if (a.usageChange <= -10) reasons.push(`usage down ${-a.usageChange}%`);
  }
  if (a.renewalInDays <= 45) {
    score += (45 - a.renewalInDays) * 1.1;
    if (a.renewalInDays <= 30) reasons.push(`renews in ${a.renewalInDays} days`);
  }
  score += a.openTickets * 3;
  if (a.openTickets >= 4) reasons.push(`${a.openTickets} open tickets`);
  if (a.seatUtilization >= 0.95) {
    score += 25;
    reasons.push(`expansion: ${Math.round(a.seatUtilization * 100)}% of seats used`);
  }
  return { score: Math.round(score), reasons };
}

export function renewalDate(days: number, from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

export const formatDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const formatArr = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${Math.round(n / 1000)}k`;
