import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useIssue, useCreateIssue, useUpdateIssue } from "@/hooks/useIssues";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

const IssueForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const { data: existingIssue } = useIssue(id!);
  const createMutation = useCreateIssue();
  const updateMutation = useUpdateIssue();
  
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    status: "open" | "in_progress" | "resolved" | "closed";
    priority: "low" | "medium" | "high" | "critical";
    department: string;
    location: string;
    component: string;
    operator: string;
    notify_flag: boolean;
    date: string;
  }>({
    title: "",
    description: "",
    status: "open",
    priority: "medium",
    department: "",
    location: "",
    component: "",
    operator: "",
    notify_flag: false,
    date: format(new Date(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    if (existingIssue) {
      setFormData({
        title: existingIssue.title,
        description: existingIssue.description,
        status: existingIssue.status as any,
        priority: existingIssue.priority as any,
        department: existingIssue.department || "",
        location: existingIssue.location || "",
        component: existingIssue.component || "",
        operator: existingIssue.operator || "",
        notify_flag: existingIssue.notify_flag || false,
        date: existingIssue.date
          ? format(new Date(existingIssue.date), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"),
      });
    }
  }, [existingIssue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit) {
      updateMutation.mutate(
        { id: id!, data: formData },
        { onSuccess: () => navigate(`/issues/${id}`) }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => navigate("/issues"),
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/issues")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Issues
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Issue" : "Report New Issue"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the issue"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the issue"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="component">Component</Label>
                <Input
                  id="component"
                  placeholder="e.g., Machine A, System B"
                  value={formData.component}
                  onChange={(e) =>
                    setFormData({ ...formData, component: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="operator">Operator</Label>
                <Input
                  id="operator"
                  placeholder="Operator name"
                  value={formData.operator}
                  onChange={(e) =>
                    setFormData({ ...formData, operator: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value as any })
                  }
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as any })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="e.g., IT, HR, Facilities"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Building A, Floor 3"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notify"
                    checked={formData.notify_flag}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, notify_flag: checked })
                    }
                  />
                  <Label htmlFor="notify" className="cursor-pointer">
                    Enable email notifications for updates
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : isEdit ? "Update Issue" : "Create Issue"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/issues")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default IssueForm;
