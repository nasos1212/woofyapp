import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Syringe, Stethoscope, Pill, AlertCircle, Plus, Calendar, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Breadcrumbs from "@/components/Breadcrumbs";
import { format, isPast, addDays, isBefore } from "date-fns";
import DogLoader from "@/components/DogLoader";

interface HealthRecord {
  id: string;
  pet_id: string;
  record_type: string;
  title: string;
  description: string | null;
  date_administered: string | null;
  next_due_date: string | null;
  veterinarian_name: string | null;
  clinic_name: string | null;
  notes: string | null;
  created_at: string;
}

interface Pet {
  id: string;
  pet_name: string;
  pet_breed: string | null;
}

const recordTypeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  vaccination: { icon: <Syringe className="w-4 h-4" />, label: "Vaccination", color: "bg-blue-100 text-blue-700" },
  vet_visit: { icon: <Stethoscope className="w-4 h-4" />, label: "Vet Visit", color: "bg-green-100 text-green-700" },
  medication: { icon: <Pill className="w-4 h-4" />, label: "Medication", color: "bg-purple-100 text-purple-700" },
  allergy: { icon: <AlertCircle className="w-4 h-4" />, label: "Allergy", color: "bg-red-100 text-red-700" },
  surgery: { icon: <FileText className="w-4 h-4" />, label: "Surgery", color: "bg-orange-100 text-orange-700" },
  other: { icon: <FileText className="w-4 h-4" />, label: "Other", color: "bg-gray-100 text-gray-700" },
};

const PetHealthRecords = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [recordType, setRecordType] = useState("vaccination");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateAdministered, setDateAdministered] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [vetName, setVetName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?type=member");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPets();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPet) {
      fetchRecords();
    }
  }, [selectedPet]);

  const fetchPets = async () => {
    if (!user) return;

    const { data: membership } = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership) {
      const { data: petsData } = await supabase
        .from("pets")
        .select("id, pet_name, pet_breed")
        .eq("membership_id", membership.id);

      if (petsData && petsData.length > 0) {
        setPets(petsData);
        setSelectedPet(petsData[0]);
      }
    }
    setIsLoading(false);
  };

  const fetchRecords = async () => {
    if (!selectedPet) return;

    const { data, error } = await supabase
      .from("pet_health_records")
      .select("*")
      .eq("pet_id", selectedPet.id)
      .order("date_administered", { ascending: false });

    if (error) {
      console.error("Error fetching records:", error);
    } else {
      setRecords(data || []);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPet) return;

    if (!title) {
      toast.error("Please enter a title");
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase.from("pet_health_records").insert({
        pet_id: selectedPet.id,
        owner_user_id: user.id,
        record_type: recordType,
        title,
        description: description || null,
        date_administered: dateAdministered || null,
        next_due_date: nextDueDate || null,
        veterinarian_name: vetName || null,
        clinic_name: clinicName || null,
        notes: notes || null,
      });

      if (error) throw error;

      toast.success("Health record added!");
      setShowAddDialog(false);
      resetForm();
      fetchRecords();
    } catch (error) {
      console.error("Error adding record:", error);
      toast.error("Failed to add record");
    } finally {
      setIsAdding(false);
    }
  };

  const deleteRecord = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from("pet_health_records")
        .delete()
        .eq("id", recordId);

      if (error) throw error;
      toast.success("Record deleted");
      fetchRecords();
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    }
  };

  const resetForm = () => {
    setRecordType("vaccination");
    setTitle("");
    setDescription("");
    setDateAdministered("");
    setNextDueDate("");
    setVetName("");
    setClinicName("");
    setNotes("");
  };

  const upcomingReminders = records.filter(
    (r) => r.next_due_date && !isPast(new Date(r.next_due_date))
  ).sort((a, b) => 
    new Date(a.next_due_date!).getTime() - new Date(b.next_due_date!).getTime()
  );

  const overdueReminders = records.filter(
    (r) => r.next_due_date && isPast(new Date(r.next_due_date))
  );

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Pet Health Records | Wooffy</title>
        <meta name="description" content="Keep track of your pet's vaccinations, vet visits, and health records." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-paw-cream to-background">
        <header className="bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumbs
              items={[
                { label: "Dashboard", href: "/member" },
                { label: "Health Records" },
              ]}
            />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                Health Records 💊
              </h1>
              <p className="text-muted-foreground">
                Track vaccinations, vet visits, and medications
              </p>
            </div>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2" disabled={!selectedPet}>
                  <Plus className="w-4 h-4" />
                  Add Record
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Health Record</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddRecord} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Record Type</Label>
                    <select
                      value={recordType}
                      onChange={(e) => setRecordType(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {Object.entries(recordTypeConfig).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Rabies Vaccine"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Additional details..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date Administered</Label>
                      <Input
                        type="date"
                        value={dateAdministered}
                        onChange={(e) => setDateAdministered(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Next Due Date</Label>
                      <Input
                        type="date"
                        value={nextDueDate}
                        onChange={(e) => setNextDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Veterinarian</Label>
                      <Input
                        value={vetName}
                        onChange={(e) => setVetName(e.target.value)}
                        placeholder="Dr. Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Clinic</Label>
                      <Input
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                        placeholder="Wooffy Vet Clinic"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional notes..."
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isAdding}>
                    {isAdding ? "Adding..." : "Add Record"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Pet Selector */}
          {pets.length > 0 && (
            <div className="flex gap-2 mb-6">
              {pets.map((pet) => (
                <button
                  key={pet.id}
                  onClick={() => setSelectedPet(pet)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedPet?.id === pet.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {pet.pet_name}
                </button>
              ))}
            </div>
          )}

          {pets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No pets found</h3>
              <p className="text-muted-foreground mb-4">Add a pet to your membership first</p>
              <Button onClick={() => navigate("/member/family")}>Add Pet</Button>
            </div>
          ) : (
            <>
              {/* Reminders Section */}
              {(overdueReminders.length > 0 || upcomingReminders.length > 0) && (
                <div className="mb-8 space-y-4">
                  {overdueReminders.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                      <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Overdue ({overdueReminders.length})
                      </h3>
                      <div className="space-y-2">
                        {overdueReminders.map((r) => (
                          <div key={r.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                            <div>
                              <p className="font-medium text-foreground">{r.title}</p>
                              <p className="text-sm text-red-600">
                                Due: {format(new Date(r.next_due_date!), "MMM d, yyyy")}
                              </p>
                            </div>
                            <Badge className={recordTypeConfig[r.record_type]?.color}>
                              {recordTypeConfig[r.record_type]?.label}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {upcomingReminders.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                      <h3 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Upcoming Reminders
                      </h3>
                      <div className="space-y-2">
                        {upcomingReminders.slice(0, 3).map((r) => (
                          <div key={r.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                            <div>
                              <p className="font-medium text-foreground">{r.title}</p>
                              <p className="text-sm text-blue-600">
                                Due: {format(new Date(r.next_due_date!), "MMM d, yyyy")}
                              </p>
                            </div>
                            <Badge className={recordTypeConfig[r.record_type]?.color}>
                              {recordTypeConfig[r.record_type]?.label}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* All Records */}
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Records</TabsTrigger>
                  <TabsTrigger value="vaccination">Vaccinations</TabsTrigger>
                  <TabsTrigger value="vet_visit">Vet Visits</TabsTrigger>
                  <TabsTrigger value="medication">Medications</TabsTrigger>
                </TabsList>

                {Object.keys(recordTypeConfig).map((type) => (
                  <TabsContent key={type} value={type === "all" ? "all" : type}>
                    {(type === "all" ? records : records.filter((r) => r.record_type === type)).length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-2xl">
                        <p className="text-muted-foreground">No records found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(type === "all" ? records : records.filter((r) => r.record_type === type)).map((record) => (
                          <div
                            key={record.id}
                            className="bg-white rounded-xl p-4 shadow-soft flex items-start gap-4"
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${recordTypeConfig[record.record_type]?.color}`}>
                              {recordTypeConfig[record.record_type]?.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-semibold text-foreground">{record.title}</h4>
                                  {record.description && (
                                    <p className="text-sm text-muted-foreground">{record.description}</p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-red-500"
                                  onClick={() => deleteRecord(record.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                                {record.date_administered && (
                                  <span>Date: {format(new Date(record.date_administered), "MMM d, yyyy")}</span>
                                )}
                                {record.veterinarian_name && <span>Vet: {record.veterinarian_name}</span>}
                                {record.clinic_name && <span>Clinic: {record.clinic_name}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}

                <TabsContent value="all">
                  {records.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">No health records yet</h3>
                      <p className="text-muted-foreground mb-4">Start tracking your pet's health history</p>
                      <Button onClick={() => setShowAddDialog(true)}>Add First Record</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {records.map((record) => (
                        <div
                          key={record.id}
                          className="bg-white rounded-xl p-4 shadow-soft flex items-start gap-4"
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${recordTypeConfig[record.record_type]?.color}`}>
                            {recordTypeConfig[record.record_type]?.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-foreground">{record.title}</h4>
                                {record.description && (
                                  <p className="text-sm text-muted-foreground">{record.description}</p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-red-500"
                                onClick={() => deleteRecord(record.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                              {record.date_administered && (
                                <span>Date: {format(new Date(record.date_administered), "MMM d, yyyy")}</span>
                              )}
                              {record.veterinarian_name && <span>Vet: {record.veterinarian_name}</span>}
                              {record.clinic_name && <span>Clinic: {record.clinic_name}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default PetHealthRecords;
