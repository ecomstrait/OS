export type Stat = {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
};

export const platformStats: Stat[] = [
  { value: 1200, suffix: "+", label: "Verified Suppliers" },
  { value: 3500, suffix: "+", label: "Stores Launched" },
  { value: 240, suffix: "K", label: "Products Published" },
  { value: 18, label: "Countries Served" },
  { value: 99, suffix: "%", label: "Uptime" },
  { value: 4.9, label: "Avg. Customer Rating" },
];

export const heroStats: Stat[] = [
  { value: 48, suffix: "h", label: "Avg. store launch time" },
  { value: 92, suffix: "%", label: "Tasks automated by AI" },
  { value: 12, prefix: "$", suffix: "M+", label: "Merchant revenue powered" },
];
