import { useState, useEffect } from "react";
import { Check, X, Eye, ChevronDown, ChevronUp, Home, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Shelter {
  id: string;
  shelter_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  location: string;
  city: string | null;
  website: string | null;
  description: string | null;
  dogs_in_care: string | null;
  years_operating: string | null;
  dogs_helped_count: number;
  verification_status: "pending" | "approved" | "rejected";
  created_at: string;
  verified_at: string | null;
}

const ShelterManager = () => {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedShelter, setExpandedShelter] = useState<string | null>(null);
  const [editingDogsHelped, setEditingDogsHelped] = useState<string | null>(null);
  const [dogsHelpedValue, setDogsHelpedValue] = useState<number>(0);

  useEffect(() => {
    fetchShelters();
  }, []);

  const fetchShelters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("shelters")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setShelters(data || []);
    } catch (error) {
      console.error("Error fetching shelters:", error);
      toast.error("Failed to load shelters");
    } finally {
      setLoading(false);
    }
  };

  const updateShelterStatus = async (shelterId: string, status: "approved" | "rejected") => {
    try {
      const updateData: { verification_status: "approved" | "rejected" | "pending"; verified_at?: string } = {
        verification_status: status,
      };

      if (status === "approved") {
        updateData.verified_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("shelters")
        .update(updateData)
        .eq("id", shelterId);

      if (error) throw error;

      toast.success(`Shelter ${status}!`);
      fetchShelters();
    } catch (error: any) {
      console.error("Error updating shelter:", error);
      toast.error(error.message || "Failed to update shelter");
    }
  };

  const updateDogsHelped = async (shelterId: string) => {
    try {
      const { error } = await supabase
        .from("shelters")
        .update({ dogs_helped_count: dogsHelpedValue })
        .eq("id", shelterId);

      if (error) throw error;

      toast.success("Dogs helped count updated!");
      setEditingDogsHelped(null);
      fetchShelters();
    } catch (error: any) {
      console.error("Error updating dogs helped:", error);
      toast.error(error.message || "Failed to update");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Pending</Badge>;
    }
  };

  const pendingShelters = shelters.filter(s => s.verification_status === "pending");
  const approvedShelters = shelters.filter(s => s.verification_status === "approved");
  const rejectedShelters = shelters.filter(s => s.verification_status === "rejected");

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading shelters...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <span className="text-yellow-600 font-bold">{pendingShelters.length}</span>
              </div>
              <div>
                <p className="text-lg font-bold">{pendingShelters.length}</p>
                <p className="text-muted-foreground text-sm">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold">{approvedShelters.length}</p>
                <p className="text-muted-foreground text-sm">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Home className="w-8 h-8 text-rose-500" />
              <div>
                <p className="text-lg font-bold">{shelters.length}</p>
                <p className="text-muted-foreground text-sm">Total Shelters</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Shelters */}
      {pendingShelters.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-4 text-yellow-600">Pending Applications ({pendingShelters.length})</h3>
          <div className="space-y-4">
            {pendingShelters.map((shelter) => (
              <Card key={shelter.id} className="border-yellow-200 bg-yellow-50/50">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                          <Home className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{shelter.shelter_name}</h3>
                          <p className="text-muted-foreground text-sm">{shelter.location}</p>
                        </div>
                        {getStatusBadge(shelter.verification_status)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                        <p><span className="text-muted-foreground">Contact:</span> {shelter.contact_name}</p>
                        <p><span className="text-muted-foreground">Email:</span> {shelter.email}</p>
                        <p><span className="text-muted-foreground">Dogs in Care:</span> {shelter.dogs_in_care || "N/A"}</p>
                        <p><span className="text-muted-foreground">Years Operating:</span> {shelter.years_operating || "N/A"}</p>
                      </div>
                      {shelter.description && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{shelter.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Applied: {new Date(shelter.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {shelter.website && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(shelter.website!, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Website
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateShelterStatus(shelter.id, "rejected")}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateShelterStatus(shelter.id, "approved")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Shelters */}
      <div>
        <h3 className="font-semibold text-lg mb-4">All Shelters ({shelters.length})</h3>
        {shelters.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No shelter applications yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {shelters.map((shelter) => (
              <Card key={shelter.id} className="border-border/50">
                <CardContent className="p-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedShelter(expandedShelter === shelter.id ? null : shelter.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                        <Home className="w-5 h-5 text-rose-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{shelter.shelter_name}</h3>
                        <p className="text-muted-foreground text-sm">{shelter.location}</p>
                      </div>
                      {getStatusBadge(shelter.verification_status)}
                    </div>
                    {expandedShelter === shelter.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  {expandedShelter === shelter.id && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <p><span className="text-muted-foreground">Contact:</span> {shelter.contact_name}</p>
                        <p><span className="text-muted-foreground">Email:</span> {shelter.email}</p>
                        <p><span className="text-muted-foreground">Phone:</span> {shelter.phone || "Not provided"}</p>
                        <p><span className="text-muted-foreground">Website:</span> {shelter.website || "Not provided"}</p>
                        <p><span className="text-muted-foreground">Dogs in Care:</span> {shelter.dogs_in_care || "N/A"}</p>
                        <p><span className="text-muted-foreground">Years Operating:</span> {shelter.years_operating || "N/A"}</p>
                      </div>
                      {shelter.description && (
                        <p className="text-sm"><span className="text-muted-foreground">Description:</span> {shelter.description}</p>
                      )}
                      
                      {/* Dogs Helped Editor */}
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center gap-4">
                          <Label className="text-sm font-medium">Dogs Helped Count:</Label>
                          {editingDogsHelped === shelter.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={dogsHelpedValue}
                                onChange={(e) => setDogsHelpedValue(parseInt(e.target.value) || 0)}
                                className="w-24 h-8"
                              />
                              <Button size="sm" onClick={() => updateDogsHelped(shelter.id)}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingDogsHelped(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-rose-500">{shelter.dogs_helped_count}</span>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setEditingDogsHelped(shelter.id);
                                  setDogsHelpedValue(shelter.dogs_helped_count);
                                }}
                              >
                                Edit
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        {shelter.verification_status !== "approved" && (
                          <Button
                            size="sm"
                            onClick={() => updateShelterStatus(shelter.id, "approved")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        {shelter.verification_status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateShelterStatus(shelter.id, "rejected")}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        )}
                        {shelter.website && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(shelter.website!, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Website
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShelterManager;