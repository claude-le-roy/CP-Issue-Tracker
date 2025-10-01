import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface AnalyticsData {
  byStatus: Array<{ name: string; count: number; color: string }>;
  byPriority: Array<{ name: string; count: number; color: string }>;
  byDepartment: Array<{ name: string; count: number }>;
  trend: Array<{ date: string; open: number; resolved: number }>;
}

const Analytics = () => {
  const [data, setData] = useState<AnalyticsData>({
    byStatus: [],
    byPriority: [],
    byDepartment: [],
    trend: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: issues, error } = await supabase
        .from("issues")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // By Status
      const statusCounts = issues?.reduce((acc: any, issue) => {
        acc[issue.status] = (acc[issue.status] || 0) + 1;
        return acc;
      }, {});

      const statusData = Object.entries(statusCounts || {}).map(([name, count]) => ({
        name: name.replace("_", " "),
        count: count as number,
        color:
          name === "open"
            ? "#f59e0b"
            : name === "in_progress"
            ? "#3b82f6"
            : name === "resolved"
            ? "#10b981"
            : "#6b7280",
      }));

      // By Priority
      const priorityCounts = issues?.reduce((acc: any, issue) => {
        acc[issue.priority] = (acc[issue.priority] || 0) + 1;
        return acc;
      }, {});

      const priorityData = Object.entries(priorityCounts || {}).map(
        ([name, count]) => ({
          name,
          count: count as number,
          color:
            name === "critical"
              ? "#ef4444"
              : name === "high"
              ? "#f59e0b"
              : name === "medium"
              ? "#3b82f6"
              : "#10b981",
        })
      );

      // By Department
      const departmentCounts = issues
        ?.filter((i) => i.department)
        .reduce((acc: any, issue) => {
          acc[issue.department] = (acc[issue.department] || 0) + 1;
          return acc;
        }, {});

      const departmentData = Object.entries(departmentCounts || {}).map(
        ([name, count]) => ({
          name,
          count: count as number,
        })
      );

      setData({
        byStatus: statusData,
        byPriority: priorityData,
        byDepartment: departmentData,
        trend: [],
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    toast.info("Export functionality will be implemented with PDF/Excel generation");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Insights and trends for workplace issues
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <FileDown className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Issues by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.byStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {data.byStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Issues by Priority</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.byPriority}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.byPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        {data.byDepartment.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Issues by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.byDepartment}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Analytics;
