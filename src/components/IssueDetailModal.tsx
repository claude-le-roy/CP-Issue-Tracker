import { useState, useEffect } from "react";
import { useIssue, useUpdateIssue } from "@/hooks/useIssues";
import { useAttachments, useUploadAttachment, useDeleteAttachment, useDownloadAttachment } from "@/hooks/useAttachments";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, Download, X, Clock, FileText, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

const COMPONENTS = [
  "Acc_noc", "Rams", "M3", "Traffic IIT", "Traffic IOT", "Traffic Offnet", 
  "Netsys", "Sim Reg", "EIRS & CEIR", "Anti-Fraud", "Preventive Maintenance", "All Components"
];

const OPERATORS = [
  "ACC_NOC", "Afriwave", "AirtelTigo", "All Operators", "Comsys", "MTN", "Telecel"
];

const DEPARTMENTS = [
  "Afriwave", "AT", "Comsys", "CP team", "MTN", "Support", "Technical team", "Telecel", "VDF", "Vodafone"
];

const STATUSES = ["pending", "open", "in_progress", "resolved", "closed"];
const PRIORITIES = ["low", "medium", "high", "critical"];

interface IssueDetailModalProps {
  issueId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const IssueDetailModal = ({ issueId, open, onOpenChange }: IssueDetailModalProps) => {
  const { data: issue, isLoading } = useIssue(issueId!);
  const { data: attachments = [] } = useAttachments(issueId!);
  const { data: activityLogs = [] } = useActivityLogs(issueId!);
  const updateIssueMutation = useUpdateIssue();
  const uploadMutation = useUploadAttachment();
  const deleteAttachmentMutation = useDeleteAttachment();
  const downloadMutation = useDownloadAttachment();
  
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [editedIssue, setEditedIssue] = useState({
    component: "",
    operator: "",
    responsible_department: "",
    issue_logger: "",
    resolution_steps: "",
    technical_team_notified: false,
    status: "",
    priority: "",
  });

  useEffect(() => {
    if (issueId) {
      fetchComments();
      getCurrentUser();
    }
  }, [issueId]);

  useEffect(() => {
    if (issue) {
      setEditedIssue({
        component: issue.component || "",
        operator: issue.operator || "",
        responsible_department: issue.responsible_department || "",
        issue_logger: issue.issue_logger || "",
        resolution_steps: issue.resolution_steps || "",
        technical_team_notified: issue.technical_team_notified || false,
        status: issue.status || "",
        priority: issue.priority || "",
      });
    }
  }, [issue]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select(`*, profiles (full_name)`)
      .eq("issue_id", issueId)
      .order("created_at", { ascending: true });
    
    if (data) setComments(data);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const { error } = await supabase.from("comments").insert({
      issue_id: issueId,
      user_id: userId,
      content: newComment.trim(),
    });

    if (!error) {
      setNewComment("");
      fetchComments();
      toast.success("Comment added");
    }
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
      { issueId: issueId!, file },
      { onSettled: () => setUploadingFile(false) }
    );
  };

  const handleSaveChanges = async () => {
    const updates: any = { ...editedIssue };
    
    if (editedIssue.status === "closed" && issue?.status !== "closed") {
      updates.closing_date = new Date().toISOString();
    }

    updateIssueMutation.mutate(
      { id: issueId!, data: updates },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast.success("Issue updated successfully");
        },
      }
    );
  };

  if (!issueId || !open) return null;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!issue) return null;

  const canEdit = userId === issue.reported_by;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                ID: {issue.id.slice(0, 8)}
              </span>
              <span className="text-sm text-muted-foreground">
                Logged: {format(new Date(issue.date || issue.created_at), "MMM dd, yyyy HH:mm")}
              </span>
            </div>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isEditing ? "View Mode" : "Edit Mode"}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-xl mb-2">{issue.title}</h3>
            <div className="flex gap-2 flex-wrap mb-4">
              <Badge variant={editedIssue.priority === "critical" ? "destructive" : "outline"}>
                {isEditing ? (
                  <Select value={editedIssue.priority} onValueChange={(v) => setEditedIssue({...editedIssue, priority: v})}>
                    <SelectTrigger className="h-6 border-0 p-0 bg-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : editedIssue.priority}
              </Badge>
              <Badge variant="outline">
                {isEditing ? (
                  <Select value={editedIssue.status} onValueChange={(v) => setEditedIssue({...editedIssue, status: v})}>
                    <SelectTrigger className="h-6 border-0 p-0 bg-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : editedIssue.status.replace("_", " ")}
              </Badge>
              {issue.notify_flag && <Badge variant="default">Notifications On</Badge>}
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <p className="text-muted-foreground whitespace-pre-wrap mt-1">{issue.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Component</Label>
              {isEditing ? (
                <Select value={editedIssue.component} onValueChange={(v) => setEditedIssue({...editedIssue, component: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select component" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPONENTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-muted-foreground mt-1">{editedIssue.component || "N/A"}</p>
              )}
            </div>

            <div>
              <Label>MNO / Operator</Label>
              {isEditing ? (
                <Select value={editedIssue.operator} onValueChange={(v) => setEditedIssue({...editedIssue, operator: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-muted-foreground mt-1">{editedIssue.operator || "N/A"}</p>
              )}
            </div>

            <div>
              <Label>Responsible Department</Label>
              {isEditing ? (
                <Select value={editedIssue.responsible_department} onValueChange={(v) => setEditedIssue({...editedIssue, responsible_department: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-muted-foreground mt-1">{editedIssue.responsible_department || "N/A"}</p>
              )}
            </div>

            <div>
              <Label>Issue Logger</Label>
              {isEditing ? (
                <Input value={editedIssue.issue_logger} onChange={(e) => setEditedIssue({...editedIssue, issue_logger: e.target.value})} />
              ) : (
                <p className="text-muted-foreground mt-1">{editedIssue.issue_logger || "N/A"}</p>
              )}
            </div>

            <div>
              <Label>Technical Team Notified</Label>
              {isEditing ? (
                <RadioGroup value={editedIssue.technical_team_notified ? "yes" : "no"} onValueChange={(v) => setEditedIssue({...editedIssue, technical_team_notified: v === "yes"})}>
                  <div className="flex gap-4 mt-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="yes" />
                      <Label htmlFor="yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="no" />
                      <Label htmlFor="no">No</Label>
                    </div>
                  </div>
                </RadioGroup>
              ) : (
                <p className="text-muted-foreground mt-1">{editedIssue.technical_team_notified ? "Yes" : "No"}</p>
              )}
            </div>

            {issue.profiles && (
              <div>
                <Label>Reported By</Label>
                <p className="text-muted-foreground mt-1">{issue.profiles.full_name}</p>
              </div>
            )}
          </div>

          <div>
            <Label>Resolution Steps</Label>
            {isEditing ? (
              <Textarea 
                value={editedIssue.resolution_steps} 
                onChange={(e) => setEditedIssue({...editedIssue, resolution_steps: e.target.value})}
                rows={3}
              />
            ) : (
              <p className="text-muted-foreground whitespace-pre-wrap mt-1">{editedIssue.resolution_steps || "N/A"}</p>
            )}
          </div>

          {issue.closing_date && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Closing Date</Label>
                <p className="text-muted-foreground mt-1">{format(new Date(issue.closing_date), "PPP")}</p>
              </div>
              {issue.time_to_resolve && (
                <div>
                  <Label>Time to Resolve</Label>
                  <p className="text-muted-foreground mt-1">{issue.time_to_resolve}</p>
                </div>
              )}
            </div>
          )}

          {isEditing && (
            <Button onClick={handleSaveChanges} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          )}

          {/* Attachments */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Attachments ({attachments.length})
              </h3>
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
            {attachments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attachments yet</p>
            ) : (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
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
                              issueId: issueId!,
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
          </div>

          {/* Issue Updates Timeline */}
          <div className="border-t pt-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5" />
              Issue Updates ({issue.issue_updates?.length || 0})
            </h3>
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
          </div>

          {/* Activity Log */}
          <div className="border-t pt-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5" />
              Activity Log ({activityLogs.length})
            </h3>
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
          </div>

          {/* Comments */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Comments ({comments.length})</h3>
            <div className="space-y-4">
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

              <div className="space-y-2">
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
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
