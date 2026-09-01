"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axis = { fontSize: 11, fill: "#94a3b8" };

export function RequestsTrend({ data }: { data: { date: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id="reqFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} tick={axis} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} width={32} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e5e9f2", fontSize: 12 }}
          labelFormatter={(d) => `Date: ${d}`}
        />
        <Area type="monotone" dataKey="count" name="Requests" stroke="#10b981" strokeWidth={2} fill="url(#reqFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RevenueTrend({ data }: { data: { date: string; amount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} tick={axis} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={(v: number) => `$${v}`} tick={axis} tickLine={false} axisLine={false} width={44} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e5e9f2", fontSize: 12 }}
          formatter={(v) => [`$${Number(v).toFixed(2)}`, "Revenue"]}
          labelFormatter={(d) => `Date: ${d}`}
        />
        <Area type="monotone" dataKey="amount" name="Revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TopProductsBar({ data }: { data: { name: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(140, data.length * 42)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
        <XAxis type="number" tickFormatter={(v: number) => `$${v}`} hide />
        <YAxis type="category" dataKey="name" width={110} tick={axis} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: "#f4f6fb" }}
          contentStyle={{ borderRadius: 12, border: "1px solid #e5e9f2", fontSize: 12 }}
          formatter={(v) => [`$${Number(v).toFixed(2)}`, "Revenue"]}
        />
        <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[0, 6, 6, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryBar({ data }: { data: { category: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(140, data.length * 42)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
        <XAxis type="number" allowDecimals={false} hide />
        <YAxis type="category" dataKey="category" width={110} tick={axis} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: "#f4f6fb" }}
          contentStyle={{ borderRadius: 12, border: "1px solid #e5e9f2", fontSize: 12 }}
        />
        <Bar dataKey="count" name="Products" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
