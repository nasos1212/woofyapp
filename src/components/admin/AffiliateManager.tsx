import { useState, useEffect } from "react";
import { Users, Loader2, Clock, Mail, Phone, Eye, Trash2 } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";

interface AffiliateInquiry {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  audience: string;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const audienceLabels: Record<string, string> = {
  friends_family: "Friends & Family",
  social_media: "Social Media Followers",
  pet_community: "Pet Community / Groups",
  workplace: "Colleagues / Workplace",
  clients: "My Clients / Customers",
  other: "Other",
};

const AffiliateManager = () => {
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<AffiliateInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<AffiliateInquiry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchInquiries();

    const channel = supabase
      .channel("admin-affiliate-inquiries")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "affiliate_inquiries",
        },
        () => {
          fetchInquiries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  const fetchInquiries = async () => {
    setLoading(true);
    
    let query = supabase
      .from("affiliate_inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching affiliate inquiries:", error);
      setLoading(false);
      return;
    }

    setInquiries(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("affiliate_inquiries")
      .update({ status })
      .eq("id", id);

    if (!error) {
      toast({
        title: "Status updated",
        description: `Inquiry marked as ${status}`,
      });
      fetchInquiries();
      if (selectedInquiry?.id === id) {
        setSelectedInquiry({ ...selectedInquiry, status });
      }
    }
  };

  const deleteInquiry = async () => {
    if (!inquiryToDelete) return;

    const { error } = await supabase
      .from("affiliate_inquiries")
      .delete()
      .eq("id", inquiryToDelete);

    if (!error) {
      toast({
        title: "Inquiry deleted",
        description: "The affiliate inquiry has been removed.",
      });
      setDeleteDialogOpen(false);
      setInquiryToDelete(null);
      if (selectedInquiry?.id === inquiryToDelete) {
        setDialogOpen(false);
        setSelectedInquiry(null);
      }
      fetchInquiries();
    } else {
      toast({
        title: "Error",
        description: "Failed to delete inquiry.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "accepted":
        return "bg-green-500";
      case "denied":
        return "bg-red-500";
      default:
        return "bg-muted";
    }
  };

  const openInquiry = (inquiry: AffiliateInquiry) => {
    setSelectedInquiry(inquiry);
    setDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Affiliate Inquiries
              {inquiries.length > 0 && (
                <Badge variant="secondary">{inquiries.length}</Badge>
              )}
            </CardTitle>
          </div>
          <div className="flex gap-2 mt-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : inquiries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No affiliate inquiries yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {inquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className="p-4 rounded-lg border transition-colors hover:bg-accent"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => openInquiry(inquiry)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{inquiry.full_name}</span>
                        <Badge
                          variant="secondary"
                          className={`${getStatusColor(inquiry.status)} text-white text-xs`}
                        >
                          {inquiry.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {inquiry.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {inquiry.phone}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Audience: {audienceLabels[inquiry.audience] || inquiry.audience}
                      </p>
                    </button>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openInquiry(inquiry)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setInquiryToDelete(inquiry.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          {selectedInquiry && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Affiliate Inquiry
                </DialogTitle>
                <DialogDescription>
                  Submitted {format(new Date(selectedInquiry.created_at), "PPp")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedInquiry.full_name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <a 
                      href={`mailto:${selectedInquiry.email}`}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Mail className="h-4 w-4" />
                      {selectedInquiry.email}
                    </a>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <a 
                      href={`tel:${selectedInquiry.phone}`}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Phone className="h-4 w-4" />
                      {selectedInquiry.phone}
                    </a>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Target Audience</p>
                    <p>{audienceLabels[selectedInquiry.audience] || selectedInquiry.audience}</p>
                  </div>
                  
                  {selectedInquiry.message && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Message</p>
                      <p className="text-sm">{selectedInquiry.message}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t">
                  <p className="text-sm font-medium">Status:</p>
                  <Select
                    value={selectedInquiry.status}
                    onValueChange={(status) => updateStatus(selectedInquiry.id, status)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="denied">Denied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inquiry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this affiliate inquiry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteInquiry} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AffiliateManager;
