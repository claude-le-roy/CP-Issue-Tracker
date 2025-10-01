import { useIssues } from "@/hooks/useIssues";
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
} from "recharts";

const Analytics = () => {
  const { data: issues = [], isLoading } = useIssues();

  // By Status
  const statusCounts = issues.reduce((acc: any, issue) => {
    acc[issue.status] = (acc[issue.status] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(statusCounts).map(([name, count]) => ({
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
  const priorityCounts = issues.reduce((acc: any, issue) => {
    acc[issue.priority] = (acc[issue.priority] || 0) + 1;
    return acc;
  }, {});

  const priorityData = Object.entries(priorityCounts).map(
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

  // By Responsible Department
  const departmentCounts = issues
    .filter((i) => i.responsible_department)
    .reduce((acc: any, issue) => {
      acc[issue.responsible_department] = (acc[issue.responsible_department] || 0) + 1;
      return acc;
    }, {});

  const departmentData = Object.entries(departmentCounts).map(
    ([name, count]) => ({
      name,
      count: count as number,
    })
  );

  // By Component
  const componentCounts = issues
    .filter((i) => i.component)
    .reduce((acc: any, issue) => {
      acc[issue.component] = (acc[issue.component] || 0) + 1;
      return acc;
    }, {});

  const componentData = Object.entries(componentCounts).map(
    ([name, count]) => ({
      name,
      count: count as number,
    })
  );

  const handleExport = () => {
    toast.info("Export functionality will be implemented with PDF/Excel generation");
  };

  if (isLoading) {
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
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {statusData.map((entry, index) => (
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
                  data={priorityData}
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
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Responsible Department Distribution */}
        {departmentData.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Issues by Responsible Department</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData}>
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

        {/* Component Distribution */}
        {componentData.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Issues by Component</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={componentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--secondary))"
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
