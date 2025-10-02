import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Issue } from "@/hooks/useIssues";
import { format } from "date-fns";

interface ReportData {
  issues: Issue[];
  statusData: { name: string; count: number }[];
  priorityData: { name: string; count: number }[];
  departmentData: { name: string; count: number }[];
  componentData: { name: string; count: number }[];
  managerComments?: string;
}

export const generatePDFReport = (data: ReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Issues Management Report", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  // Date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${format(new Date(), "PPP")}`, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  // Executive Summary
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", 14, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const totalIssues = data.issues.length;
  const openIssues = data.issues.filter(i => i.status === "open" || i.status === "pending").length;
  const inProgressIssues = data.issues.filter(i => i.status === "in_progress").length;
  const resolvedIssues = data.issues.filter(i => i.status === "resolved" || i.status === "closed").length;
  const criticalIssues = data.issues.filter(i => i.priority === "critical").length;
  
  const summaryText = `This report provides an overview of the current issue management status. As of today, there are ${totalIssues} total issues tracked in the system. ${openIssues} issues are currently open and awaiting attention, ${inProgressIssues} are actively being worked on, and ${resolvedIssues} have been successfully resolved. ${criticalIssues > 0 ? `Notably, ${criticalIssues} critical issues require immediate attention.` : 'No critical issues are currently pending.'} The distribution across departments and components is detailed in the charts and tables below.`;
  
  const splitText = doc.splitTextToSize(summaryText, pageWidth - 28);
  doc.text(splitText, 14, yPosition);
  yPosition += splitText.length * 5 + 10;

  // KPIs
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Key Performance Indicators", 14, yPosition);
  yPosition += 10;

  const kpiData = [
    ["Metric", "Value"],
    ["Total Issues", totalIssues.toString()],
    ["Open Issues", openIssues.toString()],
    ["In Progress", inProgressIssues.toString()],
    ["Resolved Issues", resolvedIssues.toString()],
    ["Critical Issues", criticalIssues.toString()],
    ["Resolution Rate", `${totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0}%`],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [kpiData[0]],
    body: kpiData.slice(1),
    theme: "striped",
    headStyles: { fillColor: [36, 44, 125] },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Status Distribution
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Issues by Status", 14, yPosition);
  yPosition += 10;

  const statusTableData = [
    ["Status", "Count"],
    ...data.statusData.map(s => [s.name, s.count.toString()])
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [statusTableData[0]],
    body: statusTableData.slice(1),
    theme: "striped",
    headStyles: { fillColor: [44, 93, 133] },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Priority Distribution
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Issues by Priority", 14, yPosition);
  yPosition += 10;

  const priorityTableData = [
    ["Priority", "Count"],
    ...data.priorityData.map(p => [p.name, p.count.toString()])
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [priorityTableData[0]],
    body: priorityTableData.slice(1),
    theme: "striped",
    headStyles: { fillColor: [44, 93, 133] },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Issues Table
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Issues List", 14, yPosition);
  yPosition += 10;

  const issuesTableData = data.issues.map(issue => [
    issue.title.substring(0, 30) + (issue.title.length > 30 ? "..." : ""),
    issue.status.replace("_", " "),
    issue.priority,
    issue.component || "N/A",
    issue.responsible_department || "N/A",
    format(new Date(issue.created_at), "MM/dd/yyyy"),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Title", "Status", "Priority", "Component", "Department", "Created"]],
    body: issuesTableData,
    theme: "striped",
    headStyles: { fillColor: [36, 44, 125] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 25 },
      2: { cellWidth: 20 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
      5: { cellWidth: 25 },
    },
  });

  // Manager Comments
  if (data.managerComments) {
    yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Manager Comments", 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const commentText = doc.splitTextToSize(data.managerComments, pageWidth - 28);
    doc.text(commentText, 14, yPosition);
  }

  // Save PDF
  doc.save(`Issues_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
};

export const generateExcelReport = (data: ReportData) => {
  const workbook = XLSX.utils.book_new();

  // Overview Sheet
  const overviewData = [
    ["Issues Management Report"],
    [`Generated: ${format(new Date(), "PPP")}`],
    [],
    ["Key Performance Indicators"],
    ["Metric", "Value"],
    ["Total Issues", data.issues.length],
    ["Open Issues", data.issues.filter(i => i.status === "open" || i.status === "pending").length],
    ["In Progress", data.issues.filter(i => i.status === "in_progress").length],
    ["Resolved Issues", data.issues.filter(i => i.status === "resolved" || i.status === "closed").length],
    ["Critical Issues", data.issues.filter(i => i.priority === "critical").length],
    [],
    ["Status Distribution"],
    ["Status", "Count"],
    ...data.statusData.map(s => [s.name, s.count]),
    [],
    ["Priority Distribution"],
    ["Priority", "Count"],
    ...data.priorityData.map(p => [p.name, p.count]),
  ];

  if (data.managerComments) {
    overviewData.push([]);
    overviewData.push(["Manager Comments"]);
    overviewData.push([data.managerComments]);
  }

  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(workbook, overviewSheet, "Overview");

  // Issues Sheet
  const issuesData = [
    ["ID", "Title", "Description", "Status", "Priority", "Component", "Operator", "Department", "Logger", "Created", "Updated", "Resolved At", "Time to Resolve"],
    ...data.issues.map(issue => [
      issue.id,
      issue.title,
      issue.description,
      issue.status,
      issue.priority,
      issue.component || "",
      issue.operator || "",
      issue.responsible_department || "",
      issue.issue_logger || "",
      format(new Date(issue.created_at), "yyyy-MM-dd HH:mm:ss"),
      format(new Date(issue.updated_at), "yyyy-MM-dd HH:mm:ss"),
      issue.resolved_at ? format(new Date(issue.resolved_at), "yyyy-MM-dd HH:mm:ss") : "",
      issue.time_to_resolve || "",
    ]),
  ];

  const issuesSheet = XLSX.utils.aoa_to_sheet(issuesData);
  XLSX.utils.book_append_sheet(workbook, issuesSheet, "Issues");

  // Analytics Data Sheet
  const analyticsData = [
    ["Status Distribution"],
    ["Status", "Count"],
    ...data.statusData.map(s => [s.name, s.count]),
    [],
    ["Priority Distribution"],
    ["Priority", "Count"],
    ...data.priorityData.map(p => [p.name, p.count]),
    [],
    ["Department Distribution"],
    ["Department", "Count"],
    ...data.departmentData.map(d => [d.name, d.count]),
    [],
    ["Component Distribution"],
    ["Component", "Count"],
    ...data.componentData.map(c => [c.name, c.count]),
  ];

  const analyticsSheet = XLSX.utils.aoa_to_sheet(analyticsData);
  XLSX.utils.book_append_sheet(workbook, analyticsSheet, "AnalyticsData");

  // Save Excel
  XLSX.writeFile(workbook, `Issues_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
};
