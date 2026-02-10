import { Heart, MapPin, Globe, Euro, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ensureHttps } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Shelter {
  id: string;
  shelter_name: string;
  location: string;
  city: string | null;
  description: string | null;
  mission_statement: string | null;
  logo_url: string | null;
  cover_photo_url: string | null;
  cover_photo_position: number | null;
  website: string | null;
  donation_link: string | null;
  dogs_in_care: string | null;
}

interface ShelterDetailDialogProps {
  shelter: Shelter | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShelterDetailDialog = ({ shelter, open, onOpenChange }: ShelterDetailDialogProps) => {
  if (!shelter) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        {/* Cover */}
        <div className="-mx-6 -mt-6 h-40 bg-gradient-to-br from-rose-100 to-pink-100 relative overflow-hidden rounded-t-lg">
          {shelter.cover_photo_url ? (
            <img
              src={shelter.cover_photo_url}
              alt={shelter.shelter_name}
              className="w-full h-[200%] object-cover absolute left-0"
              style={{ top: `${-(shelter.cover_photo_position ?? 50)}%` }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Heart className="w-16 h-16 text-rose-300" />
            </div>
          )}
          {shelter.logo_url && (
            <div className="absolute bottom-3 left-4 w-16 h-16 bg-white rounded-xl shadow-md overflow-hidden border-2 border-white">
              <img src={shelter.logo_url} alt={`${shelter.shelter_name} logo`} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <DialogHeader className="pt-2">
          <DialogTitle className="text-xl">{shelter.shelter_name}</DialogTitle>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span>{shelter.city || shelter.location}</span>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {shelter.dogs_in_care && (
            <div className="flex items-center gap-2 text-sm">
              <Heart className="w-4 h-4 text-primary" />
              <span><span className="font-semibold text-primary">{shelter.dogs_in_care}</span> dogs in care</span>
            </div>
          )}

          {shelter.description && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">About</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{shelter.description}</p>
            </div>
          )}

          {shelter.mission_statement && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">Mission</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{shelter.mission_statement}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {shelter.website && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => window.open(ensureHttps(shelter.website!), "_blank")}
              >
                <Globe className="w-3.5 h-3.5" />
                Website
              </Button>
            )}
            {shelter.donation_link && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={() => window.open(ensureHttps(shelter.donation_link!), "_blank")}
              >
                <Euro className="w-3.5 h-3.5" />
                Donate
              </Button>
            )}
            <Link to={`/shelter/${shelter.id}`} onClick={() => onOpenChange(false)}>
              <Button variant="default" size="sm" className="gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                View Full Profile
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShelterDetailDialog;
