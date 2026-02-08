import { useState, useEffect } from "react";
import { Flag, Loader2, Eye, CheckCircle, XCircle, ExternalLink } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
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

  const updateReportStatus = async (reportId: string, newStatus: string) => {
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

    toast({
      title: "Report updated",
      description: `Report marked as ${newStatus}`,
    });

    fetchReports();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Pending</Badge>;
      case "reviewing":
        return <Badge variant="secondary" className="bg-blue-500 text-white">Reviewing</Badge>;
      case "resolved":
        return <Badge variant="secondary" className="bg-green-500 text-white">Resolved</Badge>;
      case "dismissed":
        return <Badge variant="secondary" className="bg-gray-500 text-white">Dismissed</Badge>;
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
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
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
                      <div className="flex items-center justify-end gap-1">
                        {report.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateReportStatus(report.id, "reviewing")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => updateReportStatus(report.id, "resolved")}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => updateReportStatus(report.id, "dismissed")}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {report.status === "reviewing" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => updateReportStatus(report.id, "resolved")}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => updateReportStatus(report.id, "dismissed")}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommunityReportsManager;
