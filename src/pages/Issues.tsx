import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIssues } from "@/hooks/useIssues";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FileDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const Issues = () => {
  const navigate = useNavigate();
  const { data: issues = [], isLoading } = useIssues();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

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

  // Sort issues: active issues first, closed last
  const sortedFilteredIssues = filteredIssues.sort((a, b) => {
    if (a.status === "closed" && b.status !== "closed") return 1;
    if (a.status !== "closed" && b.status === "closed") return -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "warning";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "warning";
      case "in_progress": return "info";
      case "resolved": return "success";
      case "closed": return "secondary";
      default: return "default";
    }
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
                <SelectItem value="pending">Pending</SelectItem>
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

      {/* Issues List - 3 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedFilteredIssues.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No issues found</p>
            </CardContent>
          </Card>
        ) : (
          sortedFilteredIssues.map((issue) => (
            <Card
              key={issue.id}
              className="cursor-pointer hover:border-primary/50 transition-colors flex flex-col"
              onClick={() => navigate(`/issues/${issue.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      ID: {issue.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(issue.date || issue.created_at), "MMM dd, yyyy")}
                    </span>
                  </div>
                  <CardTitle className="text-base line-clamp-2">{issue.title}</CardTitle>
                  <div className="flex gap-1 flex-wrap">
                    <Badge variant={getPriorityColor(issue.priority)} className="text-xs">
                      {issue.priority}
                    </Badge>
                    <Badge variant={getStatusColor(issue.status)} className="text-xs">
                      {issue.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {issue.description}
                </p>
                <div className="space-y-1 text-xs">
                  {issue.component && (
                    <div><span className="font-medium">Component:</span> {issue.component}</div>
                  )}
                  {issue.operator && (
                    <div><span className="font-medium">Operator:</span> {issue.operator}</div>
                  )}
                  {issue.responsible_department && (
                    <div><span className="font-medium">Responsible:</span> {issue.responsible_department}</div>
                  )}
                  {issue.issue_logger && (
                    <div><span className="font-medium">Logger:</span> {issue.issue_logger}</div>
                  )}
                  {issue.resolution_steps && (
                    <div className="pt-1">
                      <span className="font-medium">Resolution:</span>
                      <p className="line-clamp-2 text-muted-foreground">{issue.resolution_steps}</p>
                    </div>
                  )}
                  {issue.issue_updates && issue.issue_updates.length > 0 && (
                    <div><span className="font-medium">Updates:</span> {issue.issue_updates.length}</div>
                  )}
                  {issue.closing_date && (
                    <div><span className="font-medium">Closed:</span> {format(new Date(issue.closing_date), "MMM dd, yyyy")}</div>
                  )}
                  {issue.time_to_resolve && (
                    <div className="text-muted-foreground">
                      <span className="font-medium">Resolution Time:</span> {issue.time_to_resolve}
                    </div>
                  )}
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
