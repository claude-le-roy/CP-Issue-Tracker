import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Edit, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  department: string;
  location: string;
  created_at: string;
  updated_at: string;
  reported_by: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    fetchIssue();
    fetchComments();
    getCurrentUser();
  }, [id]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  const fetchIssue = async () => {
    try {
      const { data, error } = await supabase
        .from("issues")
        .select(`
          *,
          profiles!issues_reported_by_fkey (
            full_name,
            email
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setIssue(data);
    } catch (error) {
      console.error("Error fetching issue:", error);
      toast.error("Failed to load issue");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles:user_id (
            full_name
          )
        `)
        .eq("issue_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { error } = await supabase.from("comments").insert({
        issue_id: id,
        user_id: userId,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      fetchComments();
      toast.success("Comment added");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this issue?")) return;

    try {
      const { error } = await supabase.from("issues").delete().eq("id", id);

      if (error) throw error;

      toast.success("Issue deleted");
      navigate("/issues");
    } catch (error) {
      console.error("Error deleting issue:", error);
      toast.error("Failed to delete issue");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Issue not found</p>
      </div>
    );
  }

  const canEdit = userId === issue.reported_by;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/issues")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Issues
        </Button>
        {canEdit && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/issues/${id}/edit`)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{issue.title}</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">{issue.priority}</Badge>
                <Badge variant="outline">{issue.status.replace("_", " ")}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{issue.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {issue.department && (
              <div>
                <h4 className="font-medium text-sm mb-1">Department</h4>
                <p className="text-muted-foreground">{issue.department}</p>
              </div>
            )}
            {issue.location && (
              <div>
                <h4 className="font-medium text-sm mb-1">Location</h4>
                <p className="text-muted-foreground">{issue.location}</p>
              </div>
            )}
            {issue.profiles && (
              <div>
                <h4 className="font-medium text-sm mb-1">Reported By</h4>
                <p className="text-muted-foreground">{issue.profiles.full_name}</p>
              </div>
            )}
            <div>
              <h4 className="font-medium text-sm mb-1">Created</h4>
              <p className="text-muted-foreground">
                {format(new Date(issue.created_at), "PPpp")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border-l-2 border-muted pl-4 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">
                  {comment.profiles?.full_name || "Unknown User"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(comment.created_at), "PPp")}
                </span>
              </div>
              <p className="text-muted-foreground">{comment.content}</p>
            </div>
          ))}

          <div className="space-y-2 pt-4 border-t">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <Button onClick={handleAddComment} disabled={!newComment.trim()}>
              Add Comment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IssueDetail;
