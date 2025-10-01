import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useIssue, useDeleteIssue } from "@/hooks/useIssues";
import { useAttachments, useUploadAttachment, useDeleteAttachment, useDownloadAttachment } from "@/hooks/useAttachments";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit, Trash2, MessageSquare, Upload, Download, X, Clock, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: issue, isLoading } = useIssue(id!);
  const { data: attachments = [] } = useAttachments(id!);
  const { data: activityLogs = [] } = useActivityLogs(id!);
  const deleteIssueMutation = useDeleteIssue();
  const uploadMutation = useUploadAttachment();
  const deleteAttachmentMutation = useDeleteAttachment();
  const downloadMutation = useDownloadAttachment();
  
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [uploadingFile, setUploadingFile] = useState(false);

  useState(() => {
    fetchComments();
    getCurrentUser();
  });

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select(`*, profiles (full_name)`)
      .eq("issue_id", id)
      .order("created_at", { ascending: true });
    
    if (data) setComments(data);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const { error } = await supabase.from("comments").insert({
      issue_id: id,
      user_id: userId,
      content: newComment.trim(),
    });

    if (!error) {
      setNewComment("");
      fetchComments();
      toast.success("Comment added");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this issue?")) return;
    deleteIssueMutation.mutate(id!, {
      onSuccess: () => navigate("/issues"),
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploadingFile(true);
    uploadMutation.mutate(
      { issueId: id!, file },
      { onSettled: () => setUploadingFile(false) }
    );
  };

  if (isLoading) {
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
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                  ID: {issue.id.slice(0, 8)}
                </span>
                <span className="text-sm text-muted-foreground">
                  Logged: {format(new Date(issue.date || issue.created_at), "MMM dd, yyyy HH:mm")}
                </span>
              </div>
              <CardTitle className="text-2xl">{issue.title}</CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Badge variant={issue.priority === "critical" ? "destructive" : "outline"}>
                  {issue.priority}
                </Badge>
                <Badge variant="outline">{issue.status.replace("_", " ")}</Badge>
                {issue.notify_flag && (
                  <Badge variant="info">Notifications On</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{issue.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <h4 className="font-medium text-sm mb-1">Created Date</h4>
              <p className="text-muted-foreground">
                {format(new Date(issue.created_at), "PPP")}
              </p>
            </div>
            {issue.component && (
              <div>
                <h4 className="font-medium text-sm mb-1">Component</h4>
                <p className="text-muted-foreground">{issue.component}</p>
              </div>
            )}
            {issue.operator && (
              <div>
                <h4 className="font-medium text-sm mb-1">MNO / Operator</h4>
                <p className="text-muted-foreground">{issue.operator}</p>
              </div>
            )}
            {issue.responsible_department && (
              <div>
                <h4 className="font-medium text-sm mb-1">Responsible Department</h4>
                <p className="text-muted-foreground">{issue.responsible_department}</p>
              </div>
            )}
            {issue.issue_logger && (
              <div>
                <h4 className="font-medium text-sm mb-1">Issue Logger</h4>
                <p className="text-muted-foreground">{issue.issue_logger}</p>
              </div>
            )}
            {issue.profiles && (
              <div>
                <h4 className="font-medium text-sm mb-1">Reported By</h4>
                <p className="text-muted-foreground">{issue.profiles.full_name}</p>
              </div>
            )}
            <div>
              <h4 className="font-medium text-sm mb-1">Technical Team Notified</h4>
              <p className="text-muted-foreground">
                {issue.technical_team_notified ? "Yes" : "No"}
              </p>
            </div>
            {issue.status === "closed" && issue.closing_date && (
              <>
                <div>
                  <h4 className="font-medium text-sm mb-1">Closing Date</h4>
                  <p className="text-muted-foreground">
                    {format(new Date(issue.closing_date), "PPP")}
                  </p>
                </div>
                {issue.time_to_resolve && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Time to Resolve</h4>
                    <p className="text-muted-foreground">{issue.time_to_resolve}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {issue.resolution_steps && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Resolution Steps</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{issue.resolution_steps}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Attachments ({attachments.length})
            </CardTitle>
            <label>
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploadingFile}
              />
              <Button variant="outline" size="sm" disabled={uploadingFile} asChild>
                <span className="gap-2 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  {uploadingFile ? "Uploading..." : "Upload"}
                </span>
              </Button>
            </label>
          </div>
        </CardHeader>
        <CardContent>
          {attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attachments yet</p>
          ) : (
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{attachment.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(attachment.file_size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadMutation.mutate(attachment.file_path)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {userId === attachment.uploaded_by && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          deleteAttachmentMutation.mutate({
                            id: attachment.id,
                            filePath: attachment.file_path,
                            issueId: id!,
                          })
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue Updates Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Issue Updates ({issue.issue_updates?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!issue.issue_updates || issue.issue_updates.length === 0) ? (
            <p className="text-sm text-muted-foreground">No updates yet</p>
          ) : (
            <div className="space-y-3">
              {issue.issue_updates.map((update, index) => (
                <div key={index} className="border-l-2 border-primary/20 pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">
                      {update.updated_by_name || "System"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(update.update_date), "PPp")}
                    </span>
                  </div>
                  <p className="text-muted-foreground whitespace-pre-wrap">{update.update_text}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Log ({activityLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet</p>
          ) : (
            <div className="space-y-3">
              {activityLogs.map((log) => (
                <div key={log.id} className="border-l-2 border-primary/20 pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">
                      {log.profiles?.full_name || "System"} {log.action} this issue
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), "PPp")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments */}
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
