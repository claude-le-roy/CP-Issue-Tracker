import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useIssue, useCreateIssue, useUpdateIssue } from "@/hooks/useIssues";

const COMPONENTS = [
  "Acc_noc",
  "Rams",
  "M3",
  "Traffic IIT",
  "Traffic IOT",
  "Traffic Offnet",
  "Netsys",
  "Sim Reg",
  "EIRS & CEIR",
  "Anti-Fraud",
  "Preventive Maintenance",
  "All Components",
];

const OPERATORS = [
  "ACC_NOC",
  "Afriwave",
  "AirtelTigo",
  "All Operators",
  "Comsys",
  "MTN",
  "Telecel",
];

const DEPARTMENTS = [
  "Afriwave",
  "AT",
  "Comsys",
  "CP team",
  "MTN",
  "Support",
  "Technical team",
  "Telecel",
  "VDF",
  "Vodafone",
];

const IssueForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const { data: existingIssue } = useIssue(id || "");
  const createIssue = useCreateIssue();
  const updateIssue = useUpdateIssue();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "pending",
    component: "",
    operator: "",
    responsible_department: "",
    issue_logger: "",
    resolution_steps: "",
    technical_team_notified: false,
    closing_date: null as Date | null,
  });

  useEffect(() => {
    if (existingIssue) {
      setFormData({
        title: existingIssue.title || "",
        description: existingIssue.description || "",
        priority: existingIssue.priority || "medium",
        status: existingIssue.status || "pending",
        component: existingIssue.component || "",
        operator: existingIssue.operator || "",
        responsible_department: existingIssue.responsible_department || "",
        issue_logger: existingIssue.issue_logger || "",
        resolution_steps: existingIssue.resolution_steps || "",
        technical_team_notified: existingIssue.technical_team_notified || false,
        closing_date: existingIssue.closing_date ? new Date(existingIssue.closing_date) : null,
      });
    }
  }, [existingIssue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const issueData = {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      status: formData.status,
      component: formData.component,
      operator: formData.operator,
      responsible_department: formData.responsible_department,
      issue_logger: formData.issue_logger,
      resolution_steps: formData.resolution_steps,
      technical_team_notified: formData.technical_team_notified,
      closing_date: formData.closing_date?.toISOString(),
    };

    if (isEdit) {
      updateIssue.mutate(
        { id: id!, data: issueData },
        {
          onSuccess: () => {
            navigate(`/issues/${id}`);
          },
        }
      );
    } else {
      createIssue.mutate(issueData, {
        onSuccess: (data) => {
          navigate(`/issues/${data.id}`);
        },
      });
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Issue" : "Create New Issue"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Issue Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Issue Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue_logger">Issue Logger</Label>
            <Input
              id="issue_logger"
              value={formData.issue_logger}
              onChange={(e) => setFormData({ ...formData, issue_logger: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="component">Component</Label>
              <Select
                value={formData.component}
                onValueChange={(value) => setFormData({ ...formData, component: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select component" />
                </SelectTrigger>
                <SelectContent>
                  {COMPONENTS.map((comp) => (
                    <SelectItem key={comp} value={comp}>
                      {comp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operator">MNO / Provider / Operator</Label>
              <Select
                value={formData.operator}
                onValueChange={(value) => setFormData({ ...formData, operator: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map((op) => (
                    <SelectItem key={op} value={op}>
                      {op}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible_department">Responsible Department / Entity</Label>
              <Select
                value={formData.responsible_department}
                onValueChange={(value) => setFormData({ ...formData, responsible_department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
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
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution_steps">Resolution Steps</Label>
            <Textarea
              id="resolution_steps"
              value={formData.resolution_steps}
              onChange={(e) => setFormData({ ...formData, resolution_steps: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Technical Team Notified</Label>
            <RadioGroup
              value={formData.technical_team_notified ? "yes" : "no"}
              onValueChange={(value) => 
                setFormData({ ...formData, technical_team_notified: value === "yes" })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="notified-yes" />
                <Label htmlFor="notified-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="notified-no" />
                <Label htmlFor="notified-no">No</Label>
              </div>
            </RadioGroup>
          </div>

          {formData.status === "closed" && (
            <div className="space-y-2">
              <Label>Issue Closing Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.closing_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.closing_date ? (
                      format(formData.closing_date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.closing_date || undefined}
                    onSelect={(date) => setFormData({ ...formData, closing_date: date || null })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={createIssue.isPending || updateIssue.isPending}>
              {isEdit ? "Update Issue" : "Create Issue"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/issues")}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default IssueForm;
