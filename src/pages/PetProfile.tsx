import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Dog, ArrowLeft, Cake, Heart, Calendar, Edit2, Save, X, Users, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Breadcrumbs from "@/components/Breadcrumbs";
import DogLoader from "@/components/DogLoader";
import { format, differenceInYears, differenceInMonths } from "date-fns";

interface Pet {
  id: string;
  pet_name: string;
  pet_breed: string | null;
  birthday: string | null;
  notes: string | null;
  created_at: string;
  owner_user_id: string;
  membership_id: string;
}

interface FamilyMember {
  id: string;
  full_name: string | null;
  email: string;
  isOwner: boolean;
}

const PetProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [pet, setPet] = useState<Pet | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [editedName, setEditedName] = useState("");
  const [editedBreed, setEditedBreed] = useState("");
  const [editedBirthday, setEditedBirthday] = useState("");

  useEffect(() => {
    const fetchPetAndFamily = async () => {
      if (!user || !id) return;

      try {
        // Fetch pet
        const { data: petData, error: petError } = await supabase
          .from("pets")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (petError) throw petError;

        if (petData) {
          setPet(petData);
          setEditedNotes(petData.notes || "");
          setEditedName(petData.pet_name);
          setEditedBreed(petData.pet_breed || "");
          setEditedBirthday(petData.birthday || "");

          // Fetch membership to get owner
          const { data: membership } = await supabase
            .from("memberships")
            .select("user_id")
            .eq("id", petData.membership_id)
            .maybeSingle();

          if (membership) {
            const members: FamilyMember[] = [];

            // Get owner profile
            const { data: ownerProfile } = await supabase
              .from("profiles")
              .select("full_name, email, user_id")
              .eq("user_id", membership.user_id)
              .maybeSingle();

            if (ownerProfile) {
              members.push({
                id: ownerProfile.user_id,
                full_name: ownerProfile.full_name,
                email: ownerProfile.email,
                isOwner: true,
              });
            }

            // Get shared members
            const { data: shares } = await supabase
              .from("membership_shares")
              .select("shared_with_user_id")
              .eq("membership_id", petData.membership_id);

            if (shares) {
              for (const share of shares) {
                const { data: memberProfile } = await supabase
                  .from("profiles")
                  .select("full_name, email, user_id")
                  .eq("user_id", share.shared_with_user_id)
                  .maybeSingle();

                if (memberProfile) {
                  members.push({
                    id: memberProfile.user_id,
                    full_name: memberProfile.full_name,
                    email: memberProfile.email,
                    isOwner: false,
                  });
                }
              }
            }

            setFamilyMembers(members);
          }
        }
      } catch (error) {
        console.error("Error fetching pet:", error);
        toast.error("Failed to load pet profile");
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchPetAndFamily();
    }
  }, [user, id, authLoading]);

  const handleSave = async () => {
    if (!pet) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("pets")
        .update({
          pet_name: editedName.trim(),
          pet_breed: editedBreed.trim() || null,
          birthday: editedBirthday || null,
          notes: editedNotes.trim() || null,
        })
        .eq("id", pet.id);

      if (error) throw error;

      setPet({
        ...pet,
        pet_name: editedName.trim(),
        pet_breed: editedBreed.trim() || null,
        birthday: editedBirthday || null,
        notes: editedNotes.trim() || null,
      });
      setIsEditing(false);
      toast.success("Pet profile updated!");
    } catch (error) {
      console.error("Error updating pet:", error);
      toast.error("Failed to update pet profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (pet) {
      setEditedNotes(pet.notes || "");
      setEditedName(pet.pet_name);
      setEditedBreed(pet.pet_breed || "");
      setEditedBirthday(pet.birthday || "");
    }
    setIsEditing(false);
  };

  const calculateAge = (birthday: string) => {
    const birthDate = new Date(birthday);
    const years = differenceInYears(new Date(), birthDate);
    const months = differenceInMonths(new Date(), birthDate) % 12;
    
    if (years === 0) {
      return `${months} month${months !== 1 ? "s" : ""} old`;
    } else if (months === 0) {
      return `${years} year${years !== 1 ? "s" : ""} old`;
    }
    return `${years} year${years !== 1 ? "s" : ""}, ${months} month${months !== 1 ? "s" : ""} old`;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-paw-cream to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Dog className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pet Not Found</h2>
            <p className="text-muted-foreground mb-4">This pet profile doesn't exist or you don't have access to it.</p>
            <Button onClick={() => navigate("/member/family")}>
              Back to Family
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{pet.pet_name}'s Profile | PawPass</title>
        <meta name="description" content={`View and manage ${pet.pet_name}'s profile and notes.`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-paw-cream to-background">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumbs
              items={[
                { label: "Family", href: "/member/family" },
                { label: pet.pet_name },
              ]}
            />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/member/family")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Family
          </Button>

          {/* Pet Header Card */}
          <Card className="mb-6 overflow-hidden">
            <div className="bg-gradient-hero p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <Dog className="w-10 h-10" />
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-2xl font-display font-bold bg-white/20 border-white/30 text-white placeholder:text-white/50 mb-2"
                    />
                  ) : (
                    <h1 className="text-2xl font-display font-bold">{pet.pet_name}</h1>
                  )}
                  {isEditing ? (
                    <Input
                      value={editedBreed}
                      onChange={(e) => setEditedBreed(e.target.value)}
                      placeholder="Breed"
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                    />
                  ) : (
                    <p className="text-white/80">{pet.pet_breed || "Breed not specified"}</p>
                  )}
                </div>
                {!isEditing && (
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setIsEditing(true)}
                    className="bg-white/20 hover:bg-white/30 text-white"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <Cake className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Birthday</p>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editedBirthday}
                        onChange={(e) => setEditedBirthday(e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-medium">
                        {pet.birthday ? format(new Date(pet.birthday), "MMM d, yyyy") : "Not set"}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Heart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">
                      {pet.birthday ? calculateAge(pet.birthday) : "Unknown"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">
                    {format(new Date(pet.created_at), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Family Members with Access */}
          {familyMembers.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Family Members with Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {familyMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
                    >
                      <div className="w-10 h-10 bg-gradient-hero rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {(member.full_name || member.email)?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground flex items-center gap-2">
                          {member.full_name || member.email}
                          {member.isOwner && (
                            <span className="text-xs bg-paw-gold/20 text-paw-gold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              Owner
                            </span>
                          )}
                        </p>
                        {member.full_name && (
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  All family members can view and manage {pet.pet_name}'s profile.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-primary" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Add notes about your pet... (medical info, preferences, quirks, etc.)"
                    className="min-h-[150px]"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                      {isSaving ? <DogLoader size="sm" /> : <Save className="w-4 h-4" />}
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancel} className="gap-2">
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  {pet.notes ? (
                    <p className="whitespace-pre-wrap text-foreground">{pet.notes}</p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No notes yet. Click the edit button above to add notes about {pet.pet_name}.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/member/health-records")}
              className="gap-2"
            >
              View Health Records
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/member/vaccinations")}
              className="gap-2"
            >
              Vaccination Reminders
            </Button>
          </div>
        </main>
      </div>
    </>
  );
};

export default PetProfile;
