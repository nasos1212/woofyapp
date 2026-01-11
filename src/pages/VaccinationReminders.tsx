import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Bell, BellRing, Calendar, Syringe, AlertTriangle, CheckCircle, Clock, Plus, Pencil, Trash2 } from "lucide-react";
import { format, differenceInDays, isPast, isToday, addDays } from "date-fns";
import DogLoader from "@/components/DogLoader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Pet {
  id: string;
  pet_name: string;
  pet_breed: string | null;
}

interface HealthRecord {
  id: string;
  pet_id: string;
  title: string;
  record_type: string;
  date_administered: string | null;
  next_due_date: string | null;
  description: string | null;
  veterinarian_name: string | null;
  clinic_name: string | null;
  reminder_interval_type: string | null;
  reminder_interval_days: number | null;
}

interface UpcomingVaccination {
  record: HealthRecord;
  pet: Pet;
  daysUntilDue: number;
  status: 'overdue' | 'due-today' | 'due-soon' | 'upcoming';
}

const INTERVAL_OPTIONS = [
  { value: 'monthly', label: 'Monthly (30 days)', days: 30 },
  { value: 'quarterly', label: 'Every 3 months (90 days)', days: 90 },
  { value: 'biannually', label: 'Every 6 months (180 days)', days: 180 },
  { value: 'yearly', label: 'Yearly (365 days)', days: 365 },
  { value: 'custom', label: 'Custom interval', days: 0 },
] as const;

interface TreatmentPreset {
  id: string;
  name: string;
  category: 'prevention' | 'vaccine' | 'medication';
  intervalType: string;
  intervalDays: number;
  description: string;
}

const TREATMENT_PRESETS: TreatmentPreset[] = [
  // Prevention treatments (monthly)
  { id: 'flea-tick', name: 'Flea & Tick Prevention', category: 'prevention', intervalType: 'monthly', intervalDays: 30, description: 'Monthly topical or oral flea and tick prevention' },
  { id: 'heartworm', name: 'Heartworm Prevention', category: 'prevention', intervalType: 'monthly', intervalDays: 30, description: 'Monthly heartworm preventative medication' },
  
  // Quarterly treatments
  { id: 'deworming', name: 'Deworming Treatment', category: 'medication', intervalType: 'quarterly', intervalDays: 90, description: 'Intestinal parasite prevention' },
  
  // Biannual treatments
  { id: 'bordetella', name: 'Bordetella (Kennel Cough)', category: 'vaccine', intervalType: 'biannually', intervalDays: 180, description: 'Kennel cough vaccine, often required for boarding' },
  { id: 'leptospirosis', name: 'Leptospirosis Vaccine', category: 'vaccine', intervalType: 'yearly', intervalDays: 365, description: 'Bacterial infection vaccine' },
  
  // Annual vaccines
  { id: 'rabies', name: 'Rabies Vaccine', category: 'vaccine', intervalType: 'yearly', intervalDays: 365, description: 'Required by law in most areas' },
  { id: 'dhpp', name: 'DHPP/DAPP (Core Vaccine)', category: 'vaccine', intervalType: 'yearly', intervalDays: 365, description: 'Distemper, Hepatitis, Parvo, Parainfluenza' },
  { id: 'lyme', name: 'Lyme Disease Vaccine', category: 'vaccine', intervalType: 'yearly', intervalDays: 365, description: 'Tick-borne disease prevention' },
  { id: 'canine-influenza', name: 'Canine Influenza (Dog Flu)', category: 'vaccine', intervalType: 'yearly', intervalDays: 365, description: 'H3N2 and H3N8 strains' },
  
  // Cat vaccines (yearly)
  { id: 'fvrcp', name: 'FVRCP (Cat Core Vaccine)', category: 'vaccine', intervalType: 'yearly', intervalDays: 365, description: 'Feline viral rhinotracheitis, calicivirus, panleukopenia' },
  { id: 'feline-leukemia', name: 'Feline Leukemia (FeLV)', category: 'vaccine', intervalType: 'yearly', intervalDays: 365, description: 'Recommended for outdoor cats' },
];

const VaccinationReminders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pets, setPets] = useState<Pet[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [upcomingVaccinations, setUpcomingVaccinations] = useState<UpcomingVaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [selectedPet, setSelectedPet] = useState<string>("");
  const [vaccineName, setVaccineName] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [intervalType, setIntervalType] = useState<string>("yearly");
  const [customDays, setCustomDays] = useState<string>("365");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch pets
      const { data: petsData, error: petsError } = await supabase
        .from("pets")
        .select("id, pet_name, pet_breed")
        .eq("owner_user_id", user!.id);

      if (petsError) throw petsError;
      setPets(petsData || []);

      // Fetch health records (vaccinations with next_due_date)
      const { data: recordsData, error: recordsError } = await supabase
        .from("pet_health_records")
        .select("*")
        .eq("owner_user_id", user!.id)
        .eq("record_type", "vaccination")
        .not("next_due_date", "is", null)
        .order("next_due_date", { ascending: true });

      if (recordsError) throw recordsError;
      setHealthRecords(recordsData || []);

      // Process upcoming vaccinations
      const upcoming: UpcomingVaccination[] = [];
      for (const record of recordsData || []) {
        const pet = petsData?.find(p => p.id === record.pet_id);
        if (!pet || !record.next_due_date) continue;

        const dueDate = new Date(record.next_due_date);
        const daysUntilDue = differenceInDays(dueDate, new Date());

        let status: UpcomingVaccination['status'];
        if (isPast(dueDate) && !isToday(dueDate)) {
          status = 'overdue';
        } else if (isToday(dueDate)) {
          status = 'due-today';
        } else if (daysUntilDue <= 7) {
          status = 'due-soon';
        } else {
          status = 'upcoming';
        }

        upcoming.push({
          record,
          pet,
          daysUntilDue,
          status
        });
      }

      // Sort: overdue first, then by days until due
      upcoming.sort((a, b) => {
        const statusOrder = { 'overdue': 0, 'due-today': 1, 'due-soon': 2, 'upcoming': 3 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        return a.daysUntilDue - b.daysUntilDue;
      });

      setUpcomingVaccinations(upcoming);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load vaccination data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getIntervalDays = () => {
    if (intervalType === 'custom') {
      return parseInt(customDays) || 30;
    }
    const option = INTERVAL_OPTIONS.find(o => o.value === intervalType);
    return option?.days || 365;
  };

  const handleAddVaccination = async () => {
    if (!selectedPet || !vaccineName || !nextDueDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("pet_health_records").insert({
        pet_id: selectedPet,
        owner_user_id: user!.id,
        title: vaccineName,
        record_type: "vaccination",
        next_due_date: nextDueDate,
        reminder_interval_type: intervalType,
        reminder_interval_days: getIntervalDays(),
      });

      if (error) throw error;

      toast({
        title: "Vaccination reminder added",
        description: "You'll be reminded when it's due",
      });

      setAddDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add vaccination reminder",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const markAsCompleted = async (record: HealthRecord, petName: string) => {
    try {
      const today = new Date();
      const intervalDays = record.reminder_interval_days || 365;
      const nextDue = format(addDays(today, intervalDays), "yyyy-MM-dd");

      const { error } = await supabase
        .from("pet_health_records")
        .update({
          date_administered: format(today, "yyyy-MM-dd"),
          next_due_date: nextDue,
        })
        .eq("id", record.id);

      if (error) throw error;

      const intervalLabel = record.reminder_interval_type === 'monthly' ? '1 month' :
        record.reminder_interval_type === 'quarterly' ? '3 months' :
        record.reminder_interval_type === 'biannually' ? '6 months' :
        record.reminder_interval_type === 'yearly' ? '1 year' :
        `${intervalDays} days`;

      toast({
        title: "Marked as completed!",
        description: `${petName}'s treatment has been recorded. Next due in ${intervalLabel}.`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update record",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (record: HealthRecord) => {
    setEditingRecord(record);
    setSelectedPet(record.pet_id);
    setVaccineName(record.title);
    setNextDueDate(record.next_due_date || "");
    setIntervalType(record.reminder_interval_type || "yearly");
    setCustomDays(String(record.reminder_interval_days || 365));
    setEditDialogOpen(true);
  };

  const handleEditVaccination = async () => {
    if (!editingRecord || !selectedPet || !vaccineName || !nextDueDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("pet_health_records")
        .update({
          pet_id: selectedPet,
          title: vaccineName,
          next_due_date: nextDueDate,
          reminder_interval_type: intervalType,
          reminder_interval_days: getIntervalDays(),
        })
        .eq("id", editingRecord.id);

      if (error) throw error;

      toast({
        title: "Vaccination updated",
        description: "Your vaccination reminder has been updated",
      });

      setEditDialogOpen(false);
      setEditingRecord(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update vaccination reminder",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVaccination = async (recordId: string, title: string) => {
    try {
      const { error } = await supabase
        .from("pet_health_records")
        .delete()
        .eq("id", recordId);

      if (error) throw error;

      toast({
        title: "Vaccination deleted",
        description: `${title} reminder has been removed`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete vaccination reminder",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedPet("");
    setVaccineName("");
    setNextDueDate("");
    setIntervalType("yearly");
    setCustomDays("365");
    setSelectedPreset("");
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    
    if (presetId === "custom") {
      // User wants to enter custom treatment
      setVaccineName("");
      setIntervalType("yearly");
      setCustomDays("365");
      return;
    }

    const preset = TREATMENT_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setVaccineName(preset.name);
      setIntervalType(preset.intervalType);
      setCustomDays(String(preset.intervalDays));
    }
  };

  const getStatusBadge = (status: UpcomingVaccination['status']) => {
    switch (status) {
      case 'overdue':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" />Overdue</Badge>;
      case 'due-today':
        return <Badge className="gap-1 bg-amber-500"><BellRing className="w-3 h-3" />Due Today</Badge>;
      case 'due-soon':
        return <Badge className="gap-1 bg-orange-500"><Clock className="w-3 h-3" />Due Soon</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><Calendar className="w-3 h-3" />Upcoming</Badge>;
    }
  };

  const getStatusColor = (status: UpcomingVaccination['status']) => {
    switch (status) {
      case 'overdue':
        return 'border-destructive/50 bg-destructive/5';
      case 'due-today':
        return 'border-amber-500/50 bg-amber-500/5';
      case 'due-soon':
        return 'border-orange-500/50 bg-orange-500/5';
      default:
        return '';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  const overdueCount = upcomingVaccinations.filter(v => v.status === 'overdue').length;
  const dueSoonCount = upcomingVaccinations.filter(v => v.status === 'due-today' || v.status === 'due-soon').length;

  return (
    <>
      <Helmet>
        <title>Pet Health Reminders | Wooffy</title>
        <meta name="description" content="Track vaccinations, medications, and treatments for your pets. Never miss a due date." />
      </Helmet>

      <Header />
      
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/member")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Syringe className="h-8 w-8 text-primary" />
                Health Reminders
              </h1>
              <p className="text-muted-foreground mt-2">
                Track vaccinations, medications & treatments for your pets
              </p>
            </div>
            <Button onClick={() => setAddDialogOpen(true)} disabled={pets.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Add Treatment
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className={overdueCount > 0 ? "border-destructive" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`h-8 w-8 ${overdueCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
                  <div>
                    <p className="text-2xl font-bold">{overdueCount}</p>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={dueSoonCount > 0 ? "border-amber-500" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Bell className={`h-8 w-8 ${dueSoonCount > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
                  <div>
                    <p className="text-2xl font-bold">{dueSoonCount}</p>
                    <p className="text-sm text-muted-foreground">Due Soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{upcomingVaccinations.length}</p>
                    <p className="text-sm text-muted-foreground">Total Tracked</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vaccination List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : pets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Syringe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No pets registered</h3>
                <p className="text-muted-foreground mb-4">
                  Add a pet to your membership to start tracking vaccinations.
                </p>
                <Button onClick={() => navigate("/member")}>
                  Manage Pets
                </Button>
              </CardContent>
            </Card>
          ) : upcomingVaccinations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No vaccination reminders</h3>
                <p className="text-muted-foreground mb-4">
                  Add vaccination records to track when they're due.
                </p>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Reminder
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingVaccinations.map((item) => (
                <Card key={item.record.id} className={`transition-colors ${getStatusColor(item.status)}`}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{item.record.title}</h3>
                          {getStatusBadge(item.status)}
                        </div>
                        <p className="text-muted-foreground mb-1">
                          <span className="font-medium">{item.pet.pet_name}</span>
                          {item.pet.pet_breed && ` • ${item.pet.pet_breed}`}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {format(new Date(item.record.next_due_date!), "MMM d, yyyy")}
                          </span>
                          <span className="text-xs">
                            ({item.record.reminder_interval_type === 'monthly' ? 'Monthly' :
                              item.record.reminder_interval_type === 'quarterly' ? 'Every 3 mo' :
                              item.record.reminder_interval_type === 'biannually' ? 'Every 6 mo' :
                              item.record.reminder_interval_type === 'yearly' ? 'Yearly' :
                              item.record.reminder_interval_type === 'custom' ? `Every ${item.record.reminder_interval_days} days` :
                              'Yearly'})
                          </span>
                          {item.record.clinic_name && (
                            <span>Clinic: {item.record.clinic_name}</span>
                          )}
                        </div>
                        {item.status === 'overdue' && (
                          <p className="text-destructive text-sm mt-2">
                            {Math.abs(item.daysUntilDue)} days overdue
                          </p>
                        )}
                        {item.status === 'due-soon' && (
                          <p className="text-orange-600 text-sm mt-2">
                            Due in {item.daysUntilDue} days
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(item.record)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVaccination(item.record.id, item.record.title)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsCompleted(item.record, item.pet.pet_name)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark Done
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Treatment Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => {
        setAddDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Health Reminder</DialogTitle>
            <DialogDescription>
              Add a vaccination, medication, or treatment reminder for your pet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pet">Pet</Label>
              <Select value={selectedPet} onValueChange={setSelectedPet}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a pet" />
                </SelectTrigger>
                <SelectContent>
                  {pets.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.pet_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Treatment Presets */}
            <div className="space-y-2">
              <Label>Quick Select (Optional)</Label>
              <Select value={selectedPreset} onValueChange={handlePresetSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a common treatment..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">✏️ Enter Custom Treatment</SelectItem>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Prevention (Monthly)</div>
                  {TREATMENT_PRESETS.filter(p => p.category === 'prevention').map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      💊 {preset.name}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Medications</div>
                  {TREATMENT_PRESETS.filter(p => p.category === 'medication').map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      💉 {preset.name}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Vaccines</div>
                  {TREATMENT_PRESETS.filter(p => p.category === 'vaccine').map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      🛡️ {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPreset && selectedPreset !== 'custom' && (
                <p className="text-xs text-muted-foreground">
                  {TREATMENT_PRESETS.find(p => p.id === selectedPreset)?.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vaccine">Treatment Name</Label>
              <Input
                id="vaccine"
                placeholder="e.g., Rabies, DHPP, Flea & Tick"
                value={vaccineName}
                onChange={(e) => {
                  setVaccineName(e.target.value);
                  if (selectedPreset && selectedPreset !== 'custom') {
                    setSelectedPreset('custom');
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interval">Reminder Interval</Label>
              <Select value={intervalType} onValueChange={setIntervalType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  {INTERVAL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How often this treatment needs to be repeated
              </p>
            </div>
            {intervalType === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="customDays">Custom Interval (days)</Label>
                <Input
                  id="customDays"
                  type="number"
                  min="1"
                  max="730"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="Enter number of days"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVaccination} disabled={saving}>
              {saving ? "Adding..." : "Add Reminder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vaccination Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setEditingRecord(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vaccination Reminder</DialogTitle>
            <DialogDescription>
              Update the vaccination details or due date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-pet">Pet</Label>
              <Select value={selectedPet} onValueChange={setSelectedPet}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a pet" />
                </SelectTrigger>
                <SelectContent>
                  {pets.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.pet_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-vaccine">Vaccination Name</Label>
              <Input
                id="edit-vaccine"
                placeholder="e.g., Rabies, DHPP, Bordetella"
                value={vaccineName}
                onChange={(e) => setVaccineName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dueDate">Due Date</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-interval">Reminder Interval</Label>
              <Select value={intervalType} onValueChange={setIntervalType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  {INTERVAL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How often this treatment needs to be repeated
              </p>
            </div>
            {intervalType === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="edit-customDays">Custom Interval (days)</Label>
                <Input
                  id="edit-customDays"
                  type="number"
                  min="1"
                  max="730"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="Enter number of days"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditVaccination} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VaccinationReminders;
