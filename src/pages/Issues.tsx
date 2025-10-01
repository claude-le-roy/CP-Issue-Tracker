import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FileDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  department: string;
  created_at: string;
  reported_by: string;
  profiles?: {
    full_name: string;
  };
}

const Issues = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const { data, error } = await supabase
        .from("issues")
        .select(`
          *,
          profiles!issues_reported_by_fkey (
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error("Error fetching issues:", error);
      toast.error("Failed to load issues");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    toast.info("Export functionality coming soon!");
  };

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || issue.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "destructive";
      case "high":
        return "warning";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "warning";
      case "in_progress":
        return "info";
      case "resolved":
        return "success";
      case "closed":
        return "secondary";
      default:
        return "default";
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Issues</h1>
          <p className="text-muted-foreground">Manage and track workplace issues</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <FileDown className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => navigate("/issues/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            New Issue
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      <div className="grid gap-4">
        {filteredIssues.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No issues found</p>
            </CardContent>
          </Card>
        ) : (
          filteredIssues.map((issue) => (
            <Card
              key={issue.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/issues/${issue.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{issue.title}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {issue.description}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Badge variant={getPriorityColor(issue.priority)}>
                      {issue.priority}
                    </Badge>
                    <Badge variant={getStatusColor(issue.status)}>
                      {issue.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    {issue.department && (
                      <span>Department: {issue.department}</span>
                    )}
                    {issue.profiles?.full_name && (
                      <span>Reported by: {issue.profiles.full_name}</span>
                    )}
                  </div>
                  <span>{format(new Date(issue.created_at), "MMM dd, yyyy")}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Issues;
