import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface AlertPhotoCarouselProps {
  alertId: string;
  mainPhotoUrl: string | null;
  petName: string;
  badge?: {
    text: string;
    className: string;
  };
}

interface AlertPhoto {
  id: string;
  photo_url: string;
  display_order: number | null;
  photo_position: number | null;
}

const AlertPhotoCarousel = ({ alertId, mainPhotoUrl, petName, badge }: AlertPhotoCarouselProps) => {
  const [photos, setPhotos] = useState<{ url: string; position: number }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const { data, error } = await supabase
          .from("lost_pet_alert_photos")
          .select("id, photo_url, display_order, photo_position")
          .eq("alert_id", alertId)
          .order("display_order", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setPhotos(data.map((p: AlertPhoto) => ({
            url: p.photo_url,
            position: p.photo_position ?? 50
          })));
        } else if (mainPhotoUrl) {
          // Fallback to main photo if no photos in the table
          setPhotos([{ url: mainPhotoUrl, position: 50 }]);
        }
      } catch (error) {
        console.error("Error fetching alert photos:", error);
        // Fallback to main photo on error
        if (mainPhotoUrl) {
          setPhotos([{ url: mainPhotoUrl, position: 50 }]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhotos();
  }, [alertId, mainPhotoUrl]);

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  if (isLoading) {
    return (
      <div className="w-full h-48 bg-muted animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading...</span>
      </div>
    );
  }

  if (photos.length === 0) {
    return null;
  }

  const currentPhoto = photos[currentIndex];

  return (
    <div className="w-full aspect-[4/3] bg-muted relative group overflow-hidden">
      <img
        src={currentPhoto.url}
        alt={`${petName} - Photo ${currentIndex + 1}`}
        className="w-full h-full object-cover"
        style={{ objectPosition: `center ${currentPhoto.position}%` }}
      />

      {/* Badge */}
      {badge && (
        <Badge className={`absolute top-2 left-2 z-10 ${badge.className}`}>
          {badge.text}
        </Badge>
      )}

      {/* Navigation arrows - only show if more than 1 photo */}
      {photos.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={goToNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Dot indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={(e) => goToSlide(index, e)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-white w-4"
                    : "bg-white/60 hover:bg-white/80"
                }`}
              />
            ))}
          </div>

          {/* Photo counter */}
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full z-10">
            {currentIndex + 1}/{photos.length}
          </div>
        </>
      )}
    </div>
  );
};

export default AlertPhotoCarousel;
