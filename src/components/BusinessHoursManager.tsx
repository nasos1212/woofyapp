import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BusinessHour {
  id?: string;
  day_of_week: number;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
}

interface BusinessHoursManagerProps {
  businessId: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const TIME_OPTIONS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
  "22:00", "22:30", "23:00", "23:30", "00:00",
];

const formatTime = (time: string | null): string => {
  if (!time) return "";
  // Handle both "HH:MM" and "HH:MM:SS" formats
  const parts = time.split(":");
  return `${parts[0]}:${parts[1]}`;
};

export function BusinessHoursManager({ businessId }: BusinessHoursManagerProps) {
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHours();
  }, [businessId]);

  const fetchHours = async () => {
    try {
      const { data, error } = await supabase
        .from("business_hours")
        .select("*")
        .eq("business_id", businessId)
        .order("day_of_week", { ascending: true });

      if (error) throw error;

      // Initialize with all days, merging existing data
      const allDays: BusinessHour[] = DAYS_OF_WEEK.map((day) => {
        const existing = data?.find((h) => h.day_of_week === day.value);
        return existing
          ? {
              id: existing.id,
              day_of_week: existing.day_of_week,
              is_closed: existing.is_closed,
              open_time: existing.open_time,
              close_time: existing.close_time,
            }
          : {
              day_of_week: day.value,
              is_closed: false,
              open_time: "09:00",
              close_time: "18:00",
            };
      });

      setHours(allDays);
    } catch (error) {
      console.error("Error fetching hours:", error);
      toast.error("Failed to load business hours");
    } finally {
      setIsLoading(false);
    }
  };

  const updateHour = (dayOfWeek: number, updates: Partial<BusinessHour>) => {
    setHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayOfWeek ? { ...h, ...updates } : h
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Upsert all hours
      for (const hour of hours) {
        const hourData = {
          business_id: businessId,
          day_of_week: hour.day_of_week,
          is_closed: hour.is_closed,
          open_time: hour.is_closed ? null : hour.open_time,
          close_time: hour.is_closed ? null : hour.close_time,
        };

        if (hour.id) {
          const { error } = await supabase
            .from("business_hours")
            .update(hourData)
            .eq("id", hour.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("business_hours")
            .insert(hourData);
          if (error) throw error;
        }
      }

      toast.success("Business hours saved!");
      fetchHours(); // Refresh to get new IDs
    } catch (error: any) {
      console.error("Error saving hours:", error);
      toast.error(error.message || "Failed to save business hours");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-4">
        <Clock className="w-4 h-4" />
        <span className="text-sm">Set your opening hours for each day</span>
      </div>

      <div className="space-y-3">
        {hours.map((hour) => {
          const dayLabel = DAYS_OF_WEEK.find((d) => d.value === hour.day_of_week)?.label;

          return (
            <div
              key={hour.day_of_week}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
            >
              <div className="w-24 font-medium text-foreground text-sm">
                {dayLabel}
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={!hour.is_closed}
                  onCheckedChange={(checked) =>
                    updateHour(hour.day_of_week, { is_closed: !checked })
                  }
                />
                <Label className="text-xs text-muted-foreground">
                  {hour.is_closed ? "Closed" : "Open"}
                </Label>
              </div>

              {!hour.is_closed && (
                <div className="flex items-center gap-2 flex-1">
                  <Select
                    value={formatTime(hour.open_time)}
                    onValueChange={(value) =>
                      updateHour(hour.day_of_week, { open_time: value })
                    }
                  >
                    <SelectTrigger className="w-24 h-9">
                      <SelectValue placeholder="Open" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={`open-${time}`} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-muted-foreground text-sm">to</span>

                  <Select
                    value={formatTime(hour.close_time)}
                    onValueChange={(value) =>
                      updateHour(hour.day_of_week, { close_time: value })
                    }
                  >
                    <SelectTrigger className="w-24 h-9">
                      <SelectValue placeholder="Close" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={`close-${time}`} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="w-full mt-4">
        {isSaving ? "Saving..." : "Save Business Hours"}
      </Button>
    </div>
  );
}
