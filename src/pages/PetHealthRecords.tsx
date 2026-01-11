import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Syringe, Stethoscope, Pill, AlertCircle, Plus, Calendar, Trash2, FileText, CheckCircle, Clock, Bell, BellRing, Pencil, Upload, X, ExternalLink, File, Download, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import { format, isPast, addDays, differenceInDays, isToday } from "date-fns";
import DogLoader from "@/components/DogLoader";
import { validateDocumentFile, MAX_DOCUMENT_SIZE, VALID_DOCUMENT_EXTENSIONS } from "@/lib/fileValidation";

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
  document_url: string | null;
  reminder_interval_type: string | null;
  reminder_interval_days: number | null;
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

const INTERVAL_OPTIONS = [
  { value: 'once', label: 'One-time only', days: 0 },
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
  recordType: string;
}

const TREATMENT_PRESETS: TreatmentPreset[] = [
  // Prevention treatments (monthly)
  { id: 'flea-tick', name: 'Flea & Tick Prevention', category: 'prevention', intervalType: 'monthly', intervalDays: 30, description: 'Monthly topical or oral flea and tick prevention', recordType: 'medication' },
  { id: 'heartworm', name: 'Heartworm Prevention', category: 'prevention', intervalType: 'monthly', intervalDays: 30, description: 'Monthly heartworm preventative medication', recordType: 'medication' },
  
  // Quarterly treatments
  { id: 'deworming', name: 'Deworming Treatment', category: 'medication', intervalType: 'quarterly', intervalDays: 90, description: 'Intestinal parasite prevention', recordType: 'medication' },
  
  // Biannual treatments
  { id: 'bordetella', name: 'Bordetella (Kennel Cough)', category: 'vaccine', intervalType: 'biannually', intervalDays: 180, description: 'Kennel cough vaccine, often required for boarding', recordType: 'vaccination' },
  
  // Annual vaccines
  { id: 'rabies', name: 'Rabies Vaccine', category: 'vaccine', intervalType: 'yearly', intervalDays: 365, description: 'Required by law in most areas', recordType: 'vaccination' },
  { id: 'dhpp', name: 'DHPP/DAPP (Core Vaccine)', category: 'vaccine', intervalType: 'yearly', intervalDays: 365, description: 'Distemper, Hepatitis, Parvo, Parainfluenza', recordType: 'vaccination' },
  { id: 'leptospirosis', name: 'Leptospirosis Vaccine', category: 'vaccine', intervalType: 'yearly', intervalDays: 365, description: 'Bacterial infection vaccine', recordType: 'vaccination' },
  { id: 'lyme', name: 'Lyme Disease Vaccine', category: 'vaccine', intervalType: 'yearly', intervalDays: 365, description: 'Tick-borne disease prevention', recordType: 'vaccination' },
  { id: 'canine-influenza', name: 'Canine Influenza (Dog Flu)', category: 'vaccine', intervalType: 'yearly', intervalDays: 365, description: 'H3N2 and H3N8 strains', recordType: 'vaccination' },
  
  // Cat vaccines
  { id: 'fvrcp', name: 'FVRCP (Cat Core Vaccine)', category: 'vaccine', intervalType: 'yearly', intervalDays: 365, description: 'Feline viral rhinotracheitis, calicivirus, panleukopenia', recordType: 'vaccination' },
  { id: 'feline-leukemia', name: 'Feline Leukemia (FeLV)', category: 'vaccine', intervalType: 'yearly', intervalDays: 365, description: 'Recommended for outdoor cats', recordType: 'vaccination' },
];

const PetHealthRecords = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState("reminders");
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [removeExistingDocument, setRemoveExistingDocument] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{ url: string; title: string; type: string } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Form state
  const [recordType, setRecordType] = useState("vaccination");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateAdministered, setDateAdministered] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [vetName, setVetName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [notes, setNotes] = useState("");
  const [intervalType, setIntervalType] = useState("yearly");
  const [customDays, setCustomDays] = useState("365");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching records:", error);
    } else {
      setRecords(data || []);
    }
  };

  const getIntervalDays = () => {
    if (intervalType === 'custom') {
      return parseInt(customDays) || 30;
    }
    if (intervalType === 'once') {
      return 0;
    }
    const option = INTERVAL_OPTIONS.find(o => o.value === intervalType);
    return option?.days || 365;
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    
    if (presetId === "custom") {
      setTitle("");
      setIntervalType("yearly");
      setCustomDays("365");
      return;
    }

    const preset = TREATMENT_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setTitle(preset.name);
      setRecordType(preset.recordType);
      setIntervalType(preset.intervalType);
      setCustomDays(String(preset.intervalDays));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setDocumentFile(file);
  };

  const uploadDocument = async (file: File, recordId: string): Promise<string | null> => {
    if (!user) return null;
    
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const filePath = `${user.id}/${recordId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('health-documents')
      .upload(filePath, file);
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload document');
    }
    
    // Store just the file path, not the full URL (bucket is private)
    return filePath;
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPet) return;

    if (!title) {
      toast.error("Please enter a title");
      return;
    }

    // For vaccinations/medications, auto-calculate next_due_date from date_administered + interval
    let calculatedNextDueDate: string | null = null;
    const hasInterval = recordType === 'vaccination' || recordType === 'medication';
    
    if (hasInterval && dateAdministered && intervalType !== 'once') {
      const intervalDays = getIntervalDays();
      calculatedNextDueDate = format(addDays(new Date(dateAdministered), intervalDays), "yyyy-MM-dd");
    } else if (!hasInterval) {
      // For other record types, use the manually entered next due date
      calculatedNextDueDate = nextDueDate || null;
    }

    setIsAdding(true);
    try {
      // First, insert the record to get an ID
      const { data: newRecord, error } = await supabase.from("pet_health_records").insert({
        pet_id: selectedPet.id,
        owner_user_id: user.id,
        record_type: recordType,
        title,
        description: description || null,
        date_administered: dateAdministered || null,
        next_due_date: calculatedNextDueDate,
        veterinarian_name: vetName || null,
        clinic_name: clinicName || null,
        notes: notes || null,
        reminder_interval_type: hasInterval ? intervalType : null,
        reminder_interval_days: hasInterval ? getIntervalDays() : null,
      }).select().single();

      if (error) throw error;

      // If there's a document to upload, upload it and update the record
      if (documentFile && newRecord) {
        setIsUploading(true);
        try {
          const documentUrl = await uploadDocument(documentFile, newRecord.id);
          if (documentUrl) {
            await supabase.from("pet_health_records")
              .update({ document_url: documentUrl })
              .eq("id", newRecord.id);
          }
        } catch (uploadErr) {
          console.error("Document upload failed:", uploadErr);
          toast.error("Record saved but document upload failed");
        } finally {
          setIsUploading(false);
        }
      }

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

  const handleViewDocument = async (record: HealthRecord) => {
    if (!record.document_url) return;
    
    setIsLoadingPreview(true);
    
    try {
      // document_url can be a full URL (legacy) or just a path (new)
      let filePath = record.document_url;
      
      // If it's a full URL, extract the path
      const pathMatch = record.document_url.match(/health-documents\/(.+)$/);
      if (pathMatch) {
        filePath = pathMatch[1];
      }
      
      const { data, error } = await supabase.storage
        .from('health-documents')
        .createSignedUrl(filePath, 3600);
      
      if (error) throw error;
      
      // Determine file type from path
      const extension = filePath.split('.').pop()?.toLowerCase() || '';
      const fileType = ['pdf'].includes(extension) ? 'pdf' 
        : ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension) ? 'image' 
        : 'other';
      
      setPreviewDocument({
        url: data.signedUrl,
        title: record.title,
        type: fileType
      });
    } catch (err) {
      console.error("Error accessing document:", err);
      toast.error("Failed to access document");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const markAsCompleted = async (record: HealthRecord) => {
    if (!selectedPet) return;
    
    try {
      const today = new Date();
      const isOneTime = record.reminder_interval_type === 'once';
      const intervalDays = record.reminder_interval_days || 365;
      
      const nextDue = isOneTime ? null : format(addDays(today, intervalDays), "yyyy-MM-dd");

      const { error } = await supabase
        .from("pet_health_records")
        .update({
          date_administered: format(today, "yyyy-MM-dd"),
          next_due_date: nextDue,
        })
        .eq("id", record.id);

      if (error) throw error;

      if (isOneTime) {
        toast.success(`${selectedPet.pet_name}'s one-time treatment completed!`);
      } else {
        const intervalLabel = record.reminder_interval_type === 'monthly' ? '1 month' :
          record.reminder_interval_type === 'quarterly' ? '3 months' :
          record.reminder_interval_type === 'biannually' ? '6 months' :
          record.reminder_interval_type === 'yearly' ? '1 year' :
          `${intervalDays} days`;
        toast.success(`Marked as done! Next due in ${intervalLabel}.`);
      }

      fetchRecords();
    } catch (error) {
      console.error("Error updating record:", error);
      toast.error("Failed to update record");
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
    setIntervalType("yearly");
    setCustomDays("365");
    setSelectedPreset("");
    setDocumentFile(null);
    setEditingRecord(null);
    setRemoveExistingDocument(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openEditDialog = (record: HealthRecord) => {
    setEditingRecord(record);
    setRecordType(record.record_type);
    setTitle(record.title);
    setDescription(record.description || "");
    setDateAdministered(record.date_administered || "");
    setNextDueDate(record.next_due_date || "");
    setVetName(record.veterinarian_name || "");
    setClinicName(record.clinic_name || "");
    setNotes(record.notes || "");
    setIntervalType(record.reminder_interval_type || "yearly");
    setCustomDays(String(record.reminder_interval_days || 365));
    setSelectedPreset("");
    setDocumentFile(null);
    setRemoveExistingDocument(false);
    setShowAddDialog(true);
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingRecord) return;

    if (!title) {
      toast.error("Please enter a title");
      return;
    }

    // For vaccinations/medications, auto-calculate next_due_date
    let calculatedNextDueDate: string | null = null;
    const hasInterval = recordType === 'vaccination' || recordType === 'medication';
    
    if (hasInterval && dateAdministered && intervalType !== 'once') {
      const intervalDays = getIntervalDays();
      calculatedNextDueDate = format(addDays(new Date(dateAdministered), intervalDays), "yyyy-MM-dd");
    } else if (!hasInterval) {
      calculatedNextDueDate = nextDueDate || null;
    }

    setIsAdding(true);
    try {
      let documentUrl = editingRecord.document_url;

      // Handle document changes
      if (removeExistingDocument && editingRecord.document_url) {
        // Delete the old document from storage
        const pathMatch = editingRecord.document_url.match(/health-documents\/(.+)$/);
        if (pathMatch) {
          await supabase.storage.from('health-documents').remove([pathMatch[1]]);
        }
        documentUrl = null;
      }

      // Upload new document if provided
      if (documentFile) {
        setIsUploading(true);
        try {
          // Delete old document first if exists
          if (editingRecord.document_url) {
            const pathMatch = editingRecord.document_url.match(/health-documents\/(.+)$/);
            if (pathMatch) {
              await supabase.storage.from('health-documents').remove([pathMatch[1]]);
            }
          }
          documentUrl = await uploadDocument(documentFile, editingRecord.id);
        } catch (uploadErr) {
          console.error("Document upload failed:", uploadErr);
          toast.error("Failed to upload new document");
        } finally {
          setIsUploading(false);
        }
      }

      const { error } = await supabase.from("pet_health_records")
        .update({
          record_type: recordType,
          title,
          description: description || null,
          date_administered: dateAdministered || null,
          next_due_date: calculatedNextDueDate,
          veterinarian_name: vetName || null,
          clinic_name: clinicName || null,
          notes: notes || null,
          document_url: documentUrl,
          reminder_interval_type: hasInterval ? intervalType : null,
          reminder_interval_days: hasInterval ? getIntervalDays() : null,
        })
        .eq("id", editingRecord.id);

      if (error) throw error;

      toast.success("Health record updated!");
      setShowAddDialog(false);
      resetForm();
      fetchRecords();
    } catch (error) {
      console.error("Error updating record:", error);
      toast.error("Failed to update record");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (editingRecord) {
      handleUpdateRecord(e);
    } else {
      handleAddRecord(e);
    }
  };

  // Get reminders with status
  const getRemindersWithStatus = () => {
    const now = new Date();
    return records
      .filter(r => r.next_due_date)
      .map(r => {
        const dueDate = new Date(r.next_due_date!);
        const daysUntil = differenceInDays(dueDate, now);
        let status: 'overdue' | 'due-today' | 'due-soon' | 'upcoming';
        
        if (isPast(dueDate) && !isToday(dueDate)) {
          status = 'overdue';
        } else if (isToday(dueDate)) {
          status = 'due-today';
        } else if (daysUntil <= 7) {
          status = 'due-soon';
        } else {
          status = 'upcoming';
        }
        
        return { ...r, daysUntil, status };
      })
      .sort((a, b) => {
        const statusOrder = { 'overdue': 0, 'due-today': 1, 'due-soon': 2, 'upcoming': 3 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        return a.daysUntil - b.daysUntil;
      });
  };

  const reminders = getRemindersWithStatus();
  const overdueCount = reminders.filter(r => r.status === 'overdue').length;
  const dueSoonCount = reminders.filter(r => r.status === 'due-today' || r.status === 'due-soon').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" />Overdue</Badge>;
      case 'due-today':
        return <Badge className="gap-1 bg-amber-500"><BellRing className="w-3 h-3" />Due Today</Badge>;
      case 'due-soon':
        return <Badge className="gap-1 bg-orange-500"><Clock className="w-3 h-3" />Due Soon</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><Calendar className="w-3 h-3" />Upcoming</Badge>;
    }
  };

  const getIntervalLabel = (type: string | null, days: number | null) => {
    if (type === 'once') return 'One-time';
    if (type === 'monthly') return 'Monthly';
    if (type === 'quarterly') return 'Every 3 mo';
    if (type === 'biannually') return 'Every 6 mo';
    if (type === 'yearly') return 'Yearly';
    if (type === 'custom' && days) return `Every ${days} days`;
    return '';
  };

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
        <meta name="description" content="Track vaccinations, medications, vet visits, and health reminders for your pets." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-paw-cream to-background">
        <Header />

        <main className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/member")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                Health Records 💊
              </h1>
              <p className="text-muted-foreground">
                Track vaccinations, medications, and vet visits
              </p>
            </div>

            <Dialog open={showAddDialog} onOpenChange={(open) => {
              setShowAddDialog(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2" disabled={!selectedPet} onClick={() => resetForm()}>
                  <Plus className="w-4 h-4" />
                  Add Record
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingRecord ? "Edit Health Record" : "Add Health Record"}</DialogTitle>
                  <DialogDescription>
                    {editingRecord 
                      ? "Update this health record's details and attached document."
                      : "Add a vaccination, medication, or other health record for your pet."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Record Type</Label>
                    <Select value={recordType} onValueChange={(v) => {
                      setRecordType(v);
                      setSelectedPreset("");
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(recordTypeConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-2">
                              {config.icon} {config.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Show presets for vaccinations and medications */}
                  {(recordType === 'vaccination' || recordType === 'medication') && (
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
                  )}

                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (selectedPreset && selectedPreset !== 'custom') {
                          setSelectedPreset('custom');
                        }
                      }}
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

                  {/* For vaccinations/medications: just show date administered, next due is auto-calculated */}
                  {(recordType === 'vaccination' || recordType === 'medication') ? (
                    <div className="space-y-2">
                      <Label>Date Given</Label>
                      <Input
                        type="date"
                        value={dateAdministered}
                        onChange={(e) => setDateAdministered(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Next due date will be auto-calculated based on the interval below
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={dateAdministered}
                          onChange={(e) => setDateAdministered(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Next Due Date (Optional)</Label>
                        <Input
                          type="date"
                          value={nextDueDate}
                          onChange={(e) => setNextDueDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Interval options for vaccinations and medications */}
                  {(recordType === 'vaccination' || recordType === 'medication') && (
                    <>
                      <div className="space-y-2">
                        <Label>Reminder Interval</Label>
                        <Select value={intervalType} onValueChange={setIntervalType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INTERVAL_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {intervalType !== 'once' && (
                          <p className="text-xs text-primary">
                            ✓ This will appear in your Reminders tab
                          </p>
                        )}
                      </div>
                      {intervalType === 'custom' && (
                        <div className="space-y-2">
                          <Label>Custom Interval (days)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="730"
                            value={customDays}
                            onChange={(e) => setCustomDays(e.target.value)}
                            placeholder="Enter number of days"
                          />
                        </div>
                      )}
                    </>
                  )}

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

                  {/* Document Upload */}
                  <div className="space-y-2">
                    <Label>Attach Document (Optional)</Label>
                    
                    {/* Show existing document when editing */}
                    {editingRecord?.document_url && !removeExistingDocument && !documentFile && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <File className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm flex-1">Current document attached</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleViewDocument(editingRecord)}
                        >
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs text-destructive hover:text-destructive"
                          onClick={() => setRemoveExistingDocument(true)}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                    
                    {removeExistingDocument && !documentFile && (
                      <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg">
                        <span className="text-sm text-destructive flex-1">Document will be removed</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => setRemoveExistingDocument(false)}
                        >
                          Undo
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="document-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {documentFile ? "Change File" : editingRecord?.document_url ? "Replace File" : "Upload File"}
                      </Button>
                      {documentFile && (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-sm text-muted-foreground truncate">{documentFile.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => {
                              setDocumentFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PDF, images, or Word docs up to 10MB. Great for vet receipts & certificates.
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={isAdding || isUploading}>
                    {isAdding || isUploading 
                      ? (isUploading ? "Uploading..." : "Saving...") 
                      : (editingRecord ? "Update Record" : "Add Record")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Pet Selector */}
          {pets.length > 0 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {pets.map((pet) => (
                <button
                  key={pet.id}
                  onClick={() => setSelectedPet(pet)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
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
              <Button onClick={() => navigate("/member")}>Add Pet</Button>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className={`bg-white rounded-xl p-4 shadow-soft ${overdueCount > 0 ? 'ring-2 ring-destructive' : ''}`}>
                  <div className="flex items-center gap-3">
                    <AlertCircle className={`h-6 w-6 ${overdueCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
                    <div>
                      <p className="text-xl font-bold">{overdueCount}</p>
                      <p className="text-xs text-muted-foreground">Overdue</p>
                    </div>
                  </div>
                </div>
                <div className={`bg-white rounded-xl p-4 shadow-soft ${dueSoonCount > 0 ? 'ring-2 ring-amber-500' : ''}`}>
                  <div className="flex items-center gap-3">
                    <Bell className={`h-6 w-6 ${dueSoonCount > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
                    <div>
                      <p className="text-xl font-bold">{dueSoonCount}</p>
                      <p className="text-xs text-muted-foreground">Due Soon</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-soft">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="text-xl font-bold">{records.length}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4 w-full flex h-auto gap-1 p-1">
                  <TabsTrigger value="reminders" className="flex-1 text-xs sm:text-sm gap-1">
                    <Bell className="w-3 h-3" /> Reminders
                    {reminders.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">{reminders.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="all" className="flex-1 text-xs sm:text-sm">All Records</TabsTrigger>
                  <TabsTrigger value="vaccination" className="flex-1 text-xs sm:text-sm">Vaccines</TabsTrigger>
                  <TabsTrigger value="medication" className="flex-1 text-xs sm:text-sm">Meds</TabsTrigger>
                </TabsList>

                {/* Reminders Tab */}
                <TabsContent value="reminders">
                  {reminders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">All caught up!</h3>
                      <p className="text-muted-foreground mb-4">No upcoming reminders for {selectedPet?.pet_name}</p>
                      <Button onClick={() => setShowAddDialog(true)}>Add Treatment</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reminders.map((reminder) => (
                        <div
                          key={reminder.id}
                          className={`bg-white rounded-xl p-4 shadow-soft ${
                            reminder.status === 'overdue' ? 'ring-2 ring-destructive/50' :
                            reminder.status === 'due-today' ? 'ring-2 ring-amber-500/50' :
                            reminder.status === 'due-soon' ? 'ring-2 ring-orange-500/50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${recordTypeConfig[reminder.record_type]?.color}`}>
                              {recordTypeConfig[reminder.record_type]?.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="font-semibold text-foreground">{reminder.title}</h4>
                                {getStatusBadge(reminder.status)}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span>Due: {format(new Date(reminder.next_due_date!), "MMM d, yyyy")}</span>
                                {reminder.reminder_interval_type && (
                                  <span className="text-xs">
                                    ({getIntervalLabel(reminder.reminder_interval_type, reminder.reminder_interval_days)})
                                  </span>
                                )}
                              </div>
                              {reminder.status === 'overdue' && (
                                <p className="text-destructive text-sm mt-1">
                                  {Math.abs(reminder.daysUntil)} days overdue
                                </p>
                              )}
                              {reminder.document_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-1 gap-1 h-7 text-xs px-2"
                                  onClick={() => handleViewDocument(reminder)}
                                >
                                  <File className="w-3 h-3" />
                                  Document
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-primary"
                                onClick={() => openEditDialog(reminder)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => deleteRecord(reminder.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markAsCompleted(reminder)}
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Done
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* All Records Tab */}
                <TabsContent value="all">
                  {records.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">No health records yet</h3>
                      <p className="text-muted-foreground mb-4">Start tracking {selectedPet?.pet_name}'s health history</p>
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
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-primary"
                                  onClick={() => openEditDialog(record)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-red-500"
                                  onClick={() => deleteRecord(record.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                              {record.date_administered && (
                                <span>Date: {format(new Date(record.date_administered), "MMM d, yyyy")}</span>
                              )}
                              {record.next_due_date && (
                                <span>Next: {format(new Date(record.next_due_date), "MMM d, yyyy")}</span>
                              )}
                              {record.veterinarian_name && <span>Vet: {record.veterinarian_name}</span>}
                              {record.clinic_name && <span>Clinic: {record.clinic_name}</span>}
                            </div>
                            {record.document_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 gap-2"
                                onClick={() => handleViewDocument(record)}
                              >
                                <File className="w-4 h-4" />
                                View Document
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Vaccination Tab */}
                <TabsContent value="vaccination">
                  {records.filter(r => r.record_type === 'vaccination').length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl">
                      <Syringe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">No vaccinations recorded</h3>
                      <p className="text-muted-foreground mb-4">Track your pet's vaccine history</p>
                      <Button onClick={() => { setRecordType('vaccination'); setShowAddDialog(true); }}>
                        Add Vaccination
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {records.filter(r => r.record_type === 'vaccination').map((record) => (
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
                                {record.reminder_interval_type && (
                                  <span className="text-xs text-muted-foreground">
                                    {getIntervalLabel(record.reminder_interval_type, record.reminder_interval_days)}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1">
                                {record.next_due_date && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => markAsCompleted(record)}
                                  >
                                    <CheckCircle className="mr-1 h-4 w-4" />
                                    Done
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-primary"
                                  onClick={() => openEditDialog(record)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-red-500"
                                  onClick={() => deleteRecord(record.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                              {record.date_administered && (
                                <span>Last: {format(new Date(record.date_administered), "MMM d, yyyy")}</span>
                              )}
                              {record.next_due_date && (
                                <span>Next: {format(new Date(record.next_due_date), "MMM d, yyyy")}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Medication Tab */}
                <TabsContent value="medication">
                  {records.filter(r => r.record_type === 'medication').length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl">
                      <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">No medications recorded</h3>
                      <p className="text-muted-foreground mb-4">Track flea/tick, heartworm, and other medications</p>
                      <Button onClick={() => { setRecordType('medication'); setShowAddDialog(true); }}>
                        Add Medication
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {records.filter(r => r.record_type === 'medication').map((record) => (
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
                                {record.reminder_interval_type && (
                                  <span className="text-xs text-muted-foreground">
                                    {getIntervalLabel(record.reminder_interval_type, record.reminder_interval_days)}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1">
                                {record.next_due_date && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => markAsCompleted(record)}
                                  >
                                    <CheckCircle className="mr-1 h-4 w-4" />
                                    Done
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-primary"
                                  onClick={() => openEditDialog(record)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-red-500"
                                  onClick={() => deleteRecord(record.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                              {record.date_administered && (
                                <span>Last: {format(new Date(record.date_administered), "MMM d, yyyy")}</span>
                              )}
                              {record.next_due_date && (
                                <span>Next: {format(new Date(record.next_due_date), "MMM d, yyyy")}</span>
                              )}
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

        {/* Document Preview Modal */}
        <Dialog open={!!previewDocument} onOpenChange={(open) => !open && setPreviewDocument(null)}>
          <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
              <div className="flex items-center justify-between pr-8">
                <DialogTitle className="text-lg font-semibold truncate">
                  {previewDocument?.title} - Document
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => previewDocument && window.open(previewDocument.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in New Tab
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    asChild
                  >
                    <a href={previewDocument?.url} download>
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-hidden bg-muted/30">
              {isLoadingPreview ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : previewDocument?.type === 'pdf' ? (
                <iframe
                  src={previewDocument.url}
                  className="w-full h-full border-0"
                  title="Document Preview"
                />
              ) : previewDocument?.type === 'image' ? (
                <div className="h-full flex items-center justify-center p-4 overflow-auto">
                  <img
                    src={previewDocument.url}
                    alt="Document"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
                  <File className="w-16 h-16 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Preview not available</p>
                    <p className="text-sm text-muted-foreground">
                      This file type cannot be previewed. Download the file to view it.
                    </p>
                  </div>
                  <Button asChild>
                    <a href={previewDocument?.url} download className="gap-2">
                      <Download className="w-4 h-4" />
                      Download File
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default PetHealthRecords;