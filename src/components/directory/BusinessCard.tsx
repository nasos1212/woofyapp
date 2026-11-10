import { Link } from "react-router-dom";
import { MapPin, PawPrint, Phone, Globe, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "@/components/SocialIcons";
import { useAuth } from "@/hooks/useAuth";
import { businessCategories } from "@/data/businessCategories";

export interface DirectoryBusiness { id: string; business_name: string; category: string; categories?: string[] | null; city: string; logo_url: string | null; description: string | null; address: string | null; phone: string | null; website: string | null; google_maps_url: string | null; facebook_url: string | null; instagram_url: string | null; tiktok_url: string | null }

const webUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);
const linkCls = "text-sm text-primary hover:underline inline-flex items-center gap-1";
const catLabel = (v: string) => businessCategories.find((c) => c.value === v)?.label ?? v;

const BusinessCard = ({ b, cityName }: { b: DirectoryBusiness; cityName: string }) => {
  const { user } = useAuth();
  return (
    <li className="rounded-xl border border-border bg-card p-4 flex gap-3">
      {b.logo_url ? <img src={b.logo_url} alt={`${b.business_name} logo`} loading="lazy" className="w-12 h-12 shrink-0 rounded-lg object-contain bg-background" /> : <div className="w-12 h-12 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center"><PawPrint className="w-6 h-6 text-primary" /></div>}
      <div className="min-w-0">
        <h3 className="font-semibold text-foreground">{b.business_name}</h3>
        <p className="text-sm text-primary">{catLabel(b.category)} · {cityName}</p>
        {b.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{b.description}</p>}
        {b.address && <p className="text-sm text-muted-foreground mt-1">{b.address}</p>}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {b.phone && <a href={`tel:${b.phone.replace(/\s/g, "")}`} className={linkCls}><Phone className="w-3.5 h-3.5" />{b.phone}</a>}
          {b.website && <a href={webUrl(b.website)} target="_blank" rel="noopener noreferrer" className={linkCls}><Globe className="w-3.5 h-3.5" />Website</a>}
          {b.google_maps_url && <a href={b.google_maps_url} target="_blank" rel="noopener noreferrer" className={linkCls}><MapPin className="w-3.5 h-3.5" />Directions</a>}
        </div>
        {(b.facebook_url || b.instagram_url || b.tiktok_url) && (
          <div className="flex gap-2 mt-2">
            {b.facebook_url && <a href={webUrl(b.facebook_url)} target="_blank" rel="noopener noreferrer" aria-label={`${b.business_name} on Facebook`}><FacebookIcon className="w-5 h-5" /></a>}
            {b.instagram_url && <a href={webUrl(b.instagram_url)} target="_blank" rel="noopener noreferrer" aria-label={`${b.business_name} on Instagram`}><InstagramIcon className="w-5 h-5" /></a>}
            {b.tiktok_url && <a href={webUrl(b.tiktok_url)} target="_blank" rel="noopener noreferrer" aria-label={`${b.business_name} on TikTok`}><TikTokIcon className="w-5 h-5" /></a>}
          </div>
        )}
        <Button asChild size="sm" className="mt-3"><Link to={user ? `/business/${b.id}` : "/auth"}><Gift className="w-4 h-4 mr-1" />View member offers</Link></Button>
      </div>
    </li>
  );
};

export default BusinessCard;
