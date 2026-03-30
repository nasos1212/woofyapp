import { useState, useEffect } from "react";
import { Users, MapPin, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface MembersNearYouProps {
  city: string | null;
  onSetCity?: () => void;
}

const MembersNearYou = ({ city, onSetCity }: MembersNearYouProps) => {
  const navigate = useNavigate();
  const [memberCount, setMemberCount] = useState(0);
  const [petCount, setPetCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city) return;

    const fetchCounts = async () => {
      setLoading(true);
      try {
        const [membersRes, petsRes] = await Promise.all([
          supabase
            .from("profiles_limited")
            .select("user_id", { count: "exact", head: true })
            .eq("preferred_city", city),
          supabase
            .from("profiles_limited")
            .select("user_id")
            .eq("preferred_city", city),
        ]);

        const members = membersRes.count || 0;
        setMemberCount(members);

        // Get pet count for members in this city
        if (petsRes.data && petsRes.data.length > 0) {
          const userIds = petsRes.data.map((p) => p.user_id);
          const { count } = await supabase
            .from("pets")
            .select("id", { count: "exact", head: true })
            .in("owner_user_id", userIds);
          setPetCount(count || 0);
        } else {
          setPetCount(0);
        }
      } catch (error) {
        console.error("Error fetching nearby counts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [city]);

  if (!city) {
    return (
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-4 sm:p-5 border border-primary/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">Discover pet owners near you!</p>
            <p className="text-xs text-muted-foreground">Set your city to see how many members and pets are in your area</p>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={onSetCity}
            className="shrink-0 gap-1"
          >
            Set City
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-4 sm:p-5 border border-primary/10 animate-pulse">
        <div className="h-12" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-4 sm:p-5 border border-primary/10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            {city}
          </p>
          <p className="text-xs text-muted-foreground">
            🐾 <span className="font-medium text-foreground">{memberCount}</span> {memberCount === 1 ? "member" : "members"} & <span className="font-medium text-foreground">{petCount}</span> {petCount === 1 ? "pet" : "pets"} in your area
          </p>
        </div>
      </div>
    </div>
  );
};

export default MembersNearYou;
