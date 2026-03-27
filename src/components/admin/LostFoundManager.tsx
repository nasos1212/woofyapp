import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Search, Dog, Cat, HelpCircle, MapPin, Clock, Phone, Mail, Award, Cpu, Eye, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import AlertPhotoCarousel from "@/components/AlertPhotoCarousel";

interface LostFoundAlert {
  id: string;
  pet_name: string;
  pet_description: string;
  pet_breed: string | null;
  pet_photo_url: string | null;
  pet_type: string | null;
  alert_type: string;
  last_seen_location: string;
  last_seen_date: string;
  contact_phone: string | null;
  contact_email: string | null;
  reward_offered: string | null;
  microchip_status: string;
  status: string;
  created_at: string;
  updated_at: string;
  owner_user_id: string;
  additional_info: string | null;
}

interface AlertPhoto {
  id: string;
  photo_url: string;
  display_order: number | null;
}

const LostFoundManager = () => {
  const [alerts, setAlerts] = useState<LostFoundAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedAlert, setSelectedAlert] = useState<LostFoundAlert | null>(null);
  const [ownerInfo, setOwnerInfo] = useState<{ full_name: string | null; email: string } | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lost_pet_alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (alert: LostFoundAlert) => {
    setSelectedAlert(alert);
    setAlertPhotos([]);
    setOwnerInfo(null);

    const [photosRes, profileRes] = await Promise.all([
      supabase
        .from("lost_pet_alert_photos")
        .select("*")
        .eq("alert_id", alert.id)
        .order("display_order"),
      supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", alert.owner_user_id)
        .single(),
    ]);

    setAlertPhotos(photosRes.data || []);
    if (profileRes.data) setOwnerInfo(profileRes.data);
  };

  const petIcon = (type: string | null) => {
    if (type === "dog") return <Dog className="w-4 h-4" />;
    if (type === "cat") return <Cat className="w-4 h-4" />;
    return <HelpCircle className="w-4 h-4" />;
  };

  const statusBadge = (status: string) => {
    if (status === "active") return <Badge className="bg-orange-500/10 text-orange-600 border-orange-200">Active</Badge>;
    if (status === "resolved" || status === "found") return <Badge className="bg-green-500/10 text-green-600 border-green-200">Resolved</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  const typeBadge = (type: string) => {
    if (type === "lost") return <Badge variant="destructive">Lost</Badge>;
    return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Found</Badge>;
  };

  const microchipBadge = (status: string) => {
    if (status === "yes") return <Badge className="bg-green-500/10 text-green-600 border-green-200">Microchipped</Badge>;
    if (status === "no") return <Badge className="bg-red-500/10 text-red-600 border-red-200">No Microchip</Badge>;
    return <Badge variant="secondary">Chip Unknown</Badge>;
  };

  const filtered = alerts.filter((a) => {
    const matchesSearch = a.pet_name.toLowerCase().includes(search.toLowerCase()) ||
      a.last_seen_location.toLowerCase().includes(search.toLowerCase()) ||
      (a.pet_breed && a.pet_breed.toLowerCase().includes(search.toLowerCase()));
    const matchesType = filterType === "all" || a.alert_type === filterType;
    const matchesStatus = filterStatus === "all" || a.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Loading lost & found alerts...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, breed, location..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
            <SelectItem value="found">Found</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchAlerts}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} alert{filtered.length !== 1 ? "s" : ""} found</p>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No alerts match your filters</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((alert) => (
            <Card key={alert.id} className="border-border/50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(alert)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {alert.pet_photo_url ? (
                    <img src={alert.pet_photo_url} alt={alert.pet_name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      {petIcon(alert.pet_type)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">{alert.pet_name}</span>
                      {typeBadge(alert.alert_type)}
                      {statusBadge(alert.status)}
                      {microchipBadge(alert.microchip_status)}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {alert.pet_breed && <span className="flex items-center gap-1">{petIcon(alert.pet_type)} {alert.pet_breed}</span>}
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {alert.last_seen_location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0"><Eye className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedAlert && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {petIcon(selectedAlert.pet_type)}
                  {selectedAlert.pet_name}
                  {typeBadge(selectedAlert.alert_type)}
                  {statusBadge(selectedAlert.status)}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Photos */}
                {(selectedAlert.pet_photo_url || alertPhotos.length > 0) && (
                  <div className="rounded-lg overflow-hidden">
                    <AlertPhotoCarousel
                      alertId={selectedAlert.id}
                      mainPhotoUrl={selectedAlert.pet_photo_url}
                      petName={selectedAlert.pet_name}
                    />
                  </div>
                )}

                {/* Pet Details */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Pet Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Type:</span> <span className="capitalize">{selectedAlert.pet_type || "Unknown"}</span></div>
                    <div><span className="text-muted-foreground">Breed:</span> {selectedAlert.pet_breed || "Unknown"}</div>
                    <div className="col-span-2 flex items-center gap-2"><Cpu className="w-3.5 h-3.5 text-muted-foreground" /> {microchipBadge(selectedAlert.microchip_status)}</div>
                  </div>
                  <p className="text-sm">{selectedAlert.pet_description}</p>
                </div>

                {/* Location & Date */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">{selectedAlert.alert_type === "lost" ? "Last Seen" : "Found At"}</h4>
                  <div className="text-sm space-y-1">
                    <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-muted-foreground" /> {selectedAlert.last_seen_location}</p>
                    <p className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-muted-foreground" /> {format(new Date(selectedAlert.last_seen_date), "PPP")}</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Contact Information</h4>
                  <div className="text-sm space-y-1">
                    {selectedAlert.contact_phone && (
                      <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-muted-foreground" /> {selectedAlert.contact_phone}</p>
                    )}
                    {selectedAlert.contact_email && (
                      <p className="flex items-center gap-2 min-w-0"><Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> <span className="truncate">{selectedAlert.contact_email}</span></p>
                    )}
                  </div>
                </div>

                {/* Owner info */}
                {ownerInfo && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Submitted By</h4>
                    <div className="text-sm space-y-1">
                      <p>{ownerInfo.full_name || "Unknown"}</p>
                      <p className="text-muted-foreground">{ownerInfo.email}</p>
                    </div>
                  </div>
                )}

                {/* Reward */}
                {selectedAlert.reward_offered && (
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-medium">Reward: {selectedAlert.reward_offered}</span>
                  </div>
                )}

                {/* Additional info */}
                {selectedAlert.additional_info && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Additional Info</h4>
                    <p className="text-sm text-muted-foreground">{selectedAlert.additional_info}</p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground space-y-0.5">
                  <p>Created: {format(new Date(selectedAlert.created_at), "PPP p")}</p>
                  <p>Updated: {format(new Date(selectedAlert.updated_at), "PPP p")}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LostFoundManager;
