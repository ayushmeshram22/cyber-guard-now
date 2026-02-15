import { useMemo } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { BarChart3, PieChart as PieIcon, TrendingUp } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Complaint = Database["public"]["Tables"]["complaints"]["Row"];

interface AnalyticsChartsProps {
  complaints: Complaint[];
}

const CHART_COLORS = [
  "hsl(160, 100%, 45%)",
  "hsl(175, 80%, 40%)",
  "hsl(45, 95%, 55%)",
  "hsl(0, 75%, 55%)",
  "hsl(200, 80%, 50%)",
  "hsl(280, 60%, 55%)",
  "hsl(30, 90%, 50%)",
];

const formatLabel = (str: string) =>
  str.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const AnalyticsCharts = ({ complaints }: AnalyticsChartsProps) => {
  const byType = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach((c) => {
      counts[c.issue_type] = (counts[c.issue_type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: formatLabel(name), value }));
  }, [complaints]);

  const byPriority = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach((c) => {
      counts[c.priority] = (counts[c.priority] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: name.toUpperCase(), value }));
  }, [complaints]);

  const overTime = useMemo(() => {
    const grouped: Record<string, number> = {};
    complaints.forEach((c) => {
      const date = new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .slice(-14); // Last 14 days
  }, [complaints]);

  const priorityColors: Record<string, string> = {
    HIGH: "hsl(0, 75%, 55%)",
    MEDIUM: "hsl(45, 95%, 55%)",
    LOW: "hsl(160, 100%, 45%)",
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-semibold text-foreground">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Incidents by Type - Bar Chart */}
      <div className="bg-card rounded-xl cyber-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold font-mono text-foreground">By Category</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byType} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(220, 10%, 55%)" }} angle={-30} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(220, 10%, 55%)" }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Incidents" radius={[4, 4, 0, 0]}>
              {byType.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Incidents by Priority - Pie Chart */}
      <div className="bg-card rounded-xl cyber-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <PieIcon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold font-mono text-foreground">By Priority</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={byPriority} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
              {byPriority.map((entry) => (
                <Cell key={entry.name} fill={priorityColors[entry.name] || CHART_COLORS[0]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Incidents Over Time - Line Chart */}
      <div className="bg-card rounded-xl cyber-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold font-mono text-foreground">Over Time</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={overTime} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(220, 10%, 55%)" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(220, 10%, 55%)" }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="count" name="Incidents" stroke="hsl(160, 100%, 45%)" strokeWidth={2} dot={{ fill: "hsl(160, 100%, 45%)", r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
