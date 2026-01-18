import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Phone, MessageSquare, Clock, CheckCircle, XCircle, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AdoptionInquiry {
  id: string;
  pet_id: string;
  inquirer_name: string;
  inquirer_email: string;
  inquirer_phone: string | null;
  message: string;
  status: string;
  created_at: string;
  shelter_adoptable_pets: {
    name: string;
    pet_type: string;
  } | null;
}

interface ShelterAdoptionInquiriesProps {
  shelterId: string;
}

const ShelterAdoptionInquiries = ({ shelterId }: ShelterAdoptionInquiriesProps) => {
  const queryClient = useQueryClient();

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ['adoption-inquiries', shelterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('adoption_inquiries')
        .select(`
          *,
          shelter_adoptable_pets (
            name,
            pet_type
          )
        `)
        .eq('shelter_id', shelterId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AdoptionInquiry[];
    },
    enabled: !!shelterId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('adoption_inquiries')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adoption-inquiries'] });
      toast.success("Status updated!");
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error("Failed to update status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('adoption_inquiries')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adoption-inquiries'] });
      toast.success("Inquiry deleted");
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error("Failed to delete inquiry");
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'contacted':
        return <Badge className="bg-blue-100 text-blue-700"><Clock className="h-3 w-3 mr-1" />Contacted</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'declined':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Declined</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700"><Inbox className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-muted animate-pulse rounded-lg" />
        <div className="h-24 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  const pendingCount = inquiries?.filter(i => i.status === 'pending').length || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            Adoption Inquiries
            {pendingCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {pendingCount} new
              </Badge>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage inquiries from potential adopters
          </p>
        </div>
      </div>

      {inquiries && inquiries.length > 0 ? (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <Card key={inquiry.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{inquiry.inquirer_name}</h4>
                        {getStatusBadge(inquiry.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Interested in: <span className="font-medium text-foreground">{inquiry.shelter_adoptable_pets?.name || 'Unknown Pet'}</span>
                        <span className="capitalize"> ({inquiry.shelter_adoptable_pets?.pet_type})</span>
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm">
                    <a 
                      href={`mailto:${inquiry.inquirer_email}`}
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      {inquiry.inquirer_email}
                    </a>
                    {inquiry.inquirer_phone && (
                      <a 
                        href={`tel:${inquiry.inquirer_phone}`}
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Phone className="h-4 w-4" />
                        {inquiry.inquirer_phone}
                      </a>
                    )}
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{inquiry.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Select
                        value={inquiry.status}
                        onValueChange={(value) => updateStatusMutation.mutate({ id: inquiry.id, status: value })}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Delete this inquiry?")) {
                          deleteMutation.mutate(inquiry.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h4 className="font-medium mb-1">No inquiries yet</h4>
            <p className="text-sm text-muted-foreground">
              When visitors inquire about your pets, they'll appear here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShelterAdoptionInquiries;