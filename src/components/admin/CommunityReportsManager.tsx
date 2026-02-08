import { useState, useEffect } from "react";
import { Flag, Loader2, Eye, XCircle, ExternalLink, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { Link } from "react-router-dom";

interface Report {
  id: string;
  question_id: string;
  reporter_user_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  question_title?: string;
  reporter_name?: string;
}

const CommunityReportsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openReportDetail = (report: Report) => {
    setSelectedReport(report);
    setDetailDialogOpen(true);
  };

  const closeDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedReport(null);
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    setLoading(true);
    
    let query = supabase
      .from("community_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching reports:", error);
      setLoading(false);
      return;
    }

    // Enrich with question titles and reporter names
    const enrichedReports = await Promise.all(
      (data || []).map(async (report) => {
        const [questionResult, profileResult] = await Promise.all([
          supabase
            .from("community_questions")
            .select("title")
            .eq("id", report.question_id)
            .single(),
          supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", report.reporter_user_id)
            .single(),
        ]);

        return {
          ...report,
          question_title: questionResult.data?.title || "Unknown Question",
          reporter_name: profileResult.data?.full_name || "Unknown User",
        };
      })
    );

    setReports(enrichedReports);
    setLoading(false);
  };

  const updateReportStatus = async (reportId: string, newStatus: string, showToast = true) => {
    if (!user) return;

    const updateData: { status: string; resolved_at?: string; resolved_by?: string } = {
      status: newStatus,
    };

    if (newStatus === "resolved" || newStatus === "dismissed") {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = user.id;
    }

    const { error } = await supabase
      .from("community_reports")
      .update(updateData)
      .eq("id", reportId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update report status",
        variant: "destructive",
      });
      return;
    }

    if (showToast) {
      toast({
        title: "Report updated",
        description: `Report marked as ${newStatus}`,
      });
    }

    // Update selected report if open
    if (selectedReport?.id === reportId) {
      setSelectedReport({ ...selectedReport, status: newStatus });
    }

    fetchReports();
  };

  const deleteQuestion = async () => {
    if (!selectedReport || !user) return;

    setDeleting(true);
    try {
      // First mark the report as deleted (before cascade removes it)
      await supabase
        .from("community_reports")
        .update({
          status: "deleted",
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        })
        .eq("id", selectedReport.id);

      // Delete the question (this will cascade delete related data)
      const { error } = await supabase
        .from("community_questions")
        .delete()
        .eq("id", selectedReport.question_id);

      if (error) throw error;

      toast({
        title: "Question deleted",
        description: "The reported question has been removed",
      });

      setDeleteDialogOpen(false);
      closeDetailDialog();
      fetchReports();
    } catch (error) {
      console.error("Error deleting question:", error);
      toast({
        title: "Error",
        description: "Failed to delete the question",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Pending</Badge>;
      case "deleted":
        return <Badge variant="secondary" className="bg-red-500 text-white">Deleted</Badge>;
      case "dismissed":
        return <Badge variant="secondary" className="bg-muted text-muted-foreground">Dismissed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getReasonLabel = (reason: string) => {
    const reasons: Record<string, string> = {
      spam: "Spam or misleading",
      harassment: "Harassment or abuse",
      inappropriate: "Inappropriate content",
      misinformation: "Dangerous misinformation",
      other: "Other",
    };
    return reasons[reason] || reason;
  };

  const pendingCount = reports.filter(r => r.status === "pending").length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Community Reports
            {pendingCount > 0 && statusFilter === "all" && (
              <Badge variant="destructive">{pendingCount}</Badge>
            )}
          </CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reports</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Flag className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No reports found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="max-w-[200px]">
                      <Link
                        to={`/community/question/${report.question_id}`}
                        className="text-primary hover:underline flex items-center gap-1 line-clamp-2"
                        target="_blank"
                      >
                        {report.question_title}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getReasonLabel(report.reason)}</p>
                        {report.details && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {report.details}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{report.reporter_name}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openReportDetail(report)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Report Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={(open) => !open && closeDetailDialog()}>
        <DialogContent className="max-w-lg">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-destructive" />
                  Report Details
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reported Question</p>
                  <Link
                    to={`/community/question/${selectedReport.question_id}`}
                    className="text-primary hover:underline flex items-center gap-1 mt-1"
                    target="_blank"
                  >
                    {selectedReport.question_title}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reason</p>
                  <p className="mt-1 font-medium">{getReasonLabel(selectedReport.reason)}</p>
                </div>

                {selectedReport.details && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Additional Details</p>
                    <p className="mt-1 text-sm bg-muted p-3 rounded-md">{selectedReport.details}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reporter</p>
                    <p className="mt-1">{selectedReport.reporter_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reported</p>
                  <p className="mt-1 text-sm">
                    {format(new Date(selectedReport.created_at), "PPp")}
                  </p>
                </div>
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                {selectedReport.status === "pending" && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Post
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        updateReportStatus(selectedReport.id, "dismissed");
                        closeDetailDialog();
                      }}
                      className="w-full sm:w-auto"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Dismiss
                    </Button>
                  </>
                )}
                {(selectedReport.status === "deleted" || selectedReport.status === "dismissed") && (
                  <Button variant="outline" onClick={closeDetailDialog}>
                    Close
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the question "{selectedReport?.question_title}" and all its answers. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteQuestion}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default CommunityReportsManager;
