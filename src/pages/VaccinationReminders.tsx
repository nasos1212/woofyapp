import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Bell, BellRing, Calendar, Syringe, AlertTriangle, CheckCircle, Clock, Plus } from "lucide-react";
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
}

interface UpcomingVaccination {
  record: HealthRecord;
  pet: Pet;
  daysUntilDue: number;
  status: 'overdue' | 'due-today' | 'due-soon' | 'upcoming';
}

const VaccinationReminders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pets, setPets] = useState<Pet[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [upcomingVaccinations, setUpcomingVaccinations] = useState<UpcomingVaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<string>("");
  const [vaccineName, setVaccineName] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
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
      });

      if (error) throw error;

      toast({
        title: "Vaccination reminder added",
        description: "You'll be reminded when it's due",
      });

      setAddDialogOpen(false);
      setSelectedPet("");
      setVaccineName("");
      setNextDueDate("");
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

  const markAsCompleted = async (recordId: string, petName: string) => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const nextYear = format(addDays(new Date(), 365), "yyyy-MM-dd");

      const { error } = await supabase
        .from("pet_health_records")
        .update({
          date_administered: today,
          next_due_date: nextYear,
        })
        .eq("id", recordId);

      if (error) throw error;

      toast({
        title: "Marked as completed!",
        description: `${petName}'s vaccination has been recorded. Next due in 1 year.`,
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
        <title>Vaccination Reminders | Wooffy</title>
        <meta name="description" content="Keep track of your pet's vaccination schedule and never miss a due date." />
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
                Vaccination Reminders
              </h1>
              <p className="text-muted-foreground mt-2">
                Never miss a vaccination date for your pets
              </p>
            </div>
            <Button onClick={() => setAddDialogOpen(true)} disabled={pets.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Add Reminder
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
                <Button onClick={() => navigate("/member/family")}>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsCompleted(item.record.id, item.pet.pet_name)}
                        className="shrink-0"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark Done
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Add Vaccination Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vaccination Reminder</DialogTitle>
            <DialogDescription>
              Add a vaccination due date to get reminders when it's time.
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
            <div className="space-y-2">
              <Label htmlFor="vaccine">Vaccination Name</Label>
              <Input
                id="vaccine"
                placeholder="e.g., Rabies, DHPP, Bordetella"
                value={vaccineName}
                onChange={(e) => setVaccineName(e.target.value)}
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
    </>
  );
};

export default VaccinationReminders;
