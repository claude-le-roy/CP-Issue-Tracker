import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const IssueForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    status: "open" | "in_progress" | "resolved" | "closed";
    priority: "low" | "medium" | "high" | "critical";
    department: string;
    location: string;
  }>({
    title: "",
    description: "",
    status: "open",
    priority: "medium",
    department: "",
    location: "",
  });

  useEffect(() => {
    if (isEdit) {
      fetchIssue();
    }
  }, [id]);

  const fetchIssue = async () => {
    try {
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title,
        description: data.description,
        status: data.status as "open" | "in_progress" | "resolved" | "closed",
        priority: data.priority as "low" | "medium" | "high" | "critical",
        department: data.department || "",
        location: data.location || "",
      });
    } catch (error) {
      console.error("Error fetching issue:", error);
      toast.error("Failed to load issue");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (isEdit) {
        const { error } = await supabase
          .from("issues")
          .update(formData)
          .eq("id", id);

        if (error) throw error;
        toast.success("Issue updated successfully");
      } else {
        const { error } = await supabase.from("issues").insert({
          ...formData,
          reported_by: user.id,
        });

        if (error) throw error;
        toast.success("Issue created successfully");
      }

      navigate("/issues");
    } catch (error: any) {
      console.error("Error saving issue:", error);
      toast.error(error.message || "Failed to save issue");
    } finally {
      setLoading(false);
    }
  };

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
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Brief description of the issue"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value as "low" | "medium" | "high" | "critical" })
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
                    setFormData({ ...formData, status: value as "open" | "in_progress" | "resolved" | "closed" })
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : isEdit ? "Update Issue" : "Create Issue"}
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
