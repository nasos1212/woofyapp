import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { scrollToTop } from "@/lib/scroll";
import { Link, Navigate, useParams } from "react-router-dom";
import { MapPin, Store, ExternalLink, Phone, Globe } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { DIRECTORY_CITIES, getDirectoryCity } from "@/data/cityDirectory";
import { businessCategories } from "@/data/businessCategories";
import { getGooglePlacePageUrl } from "@/lib/maps";
import BusinessCard, { type DirectoryBusiness as Biz } from "@/components/directory/BusinessCard";
import { CITY_SERVICES } from "@/data/cityServices";
import { useTranslation } from "react-i18next";

interface Place { id: string; name: string; place_type: string; area: string | null; address: string | null; phone: string | null; website: string | null; description: string | null; google_maps_url: string | null; latitude: number; longitude: number; city: string | null }

const SITE = "https://wooffy.app";
const webUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);
const linkCls = "text-sm text-primary hover:underline inline-flex items-center gap-1";

const CityDirectory = () => {
  const { t } = useTranslation();
  const { city: slug } = useParams();
  useEffect(() => { scrollToTop(); }, [slug]);
  const city = getDirectoryCity(slug);
  const [businesses, setBusinesses] = useState<Biz[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!city) return;
    setLoading(true);
    Promise.all([
      supabase.rpc("public_city_directory_businesses"),
      supabase.from("pet_friendly_places").select("id,name,place_type,area,address,phone,website,description,google_maps_url,latitude,longitude,city")
        .eq("verified", true).neq("place_type", "vet").eq("city", city.name).order("name"),
    ]).then(([b, p]) => {
      const all = ((b.data as Biz[] | null) ?? []).filter((x) => x.city === city.name);
      setBusinesses(all.sort((a, z) => a.business_name.localeCompare(z.business_name)));
      setPlaces((p.data as Place[] | null) ?? []);
      setLoading(false);
    });
  }, [city]);

  const placeTypes = useMemo(() => Array.from(new Set(places.map((p) => p.place_type))).sort(), [places]);
  if (!city) return <Navigate to="/places" replace />;

  const url = `${SITE}/places/${city.slug}`;
  const title = t("directory.cityTitle", { city: city.name });
  const desc = places.length
    ? t("directory.cityDesc", { city: city.name, count: places.length })
    : t("directory.cityDescLocal", { city: city.name });
  const placeLabel = (type: string) => t(`directory.placeTypes.${type}`, { defaultValue: type });
  const shownPlaces = filter === "all" ? places : places.filter((p) => p.place_type === filter);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Wooffy", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "Cyprus Pet Directory", item: SITE + "/places" },
        { "@type": "ListItem", position: 3, name: city.name, item: url },
      ] },
      { "@type": "ItemList", name: `Dog-friendly places in ${city.name}`, itemListElement: places.slice(0, 50).map((p, i) => ({
        "@type": "ListItem", position: i + 1,
        item: { "@type": "LocalBusiness", name: p.name, address: { "@type": "PostalAddress", addressLocality: city.name, addressCountry: "CY" }, geo: { "@type": "GeoCoordinates", latitude: p.latitude, longitude: p.longitude } },
      })) },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={url} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 pt-28 pb-16 max-w-5xl">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary">Wooffy</Link> / <Link to="/places" className="hover:text-primary">{t("directory.breadcrumb")}</Link> / <span>{city.name}</span>
        </nav>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">{t("directory.cityHeading", { city: city.name })}</h1>
        <p className="text-muted-foreground text-lg mb-6">{t(`directory.cities.${city.slug}`, { defaultValue: city.intro })}</p>
        <div className="flex flex-wrap gap-2 mb-10">
          {DIRECTORY_CITIES.map((c) => (
            <Link key={c.slug} to={`/places/${c.slug}`}>
              <Badge variant={c.slug === city.slug ? "default" : "outline"} className="px-3 py-1 text-sm">{c.name}</Badge>
            </Link>
          ))}
        </div>

        <nav aria-label="Services" className="mb-10">
          <h2 className="font-display text-lg font-semibold mb-3">{t("directory.browseByService", { city: city.name })}</h2>
          <div className="flex flex-wrap gap-2">
            {CITY_SERVICES.map((sv) => (
              <Link key={sv.slug} to={`/places/${city.slug}/${sv.slug}`} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-primary hover:text-primary">{t("directory.serviceInCity", { service: t(`directory.services.${sv.slug}.label`, { defaultValue: sv.label }), city: city.name })}</Link>
            ))}
          </div>
        </nav>

        <section className="mb-12">
          <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2"><Store className="w-6 h-6 text-primary" />{t("directory.petBusinessesIn", { city: city.name })}</h2>
          {loading ? <p className="text-muted-foreground">{t("directory.loading")}</p> : businesses.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="text-muted-foreground mb-4">{t("directory.noBusinesses", { city: city.name })}</p>
              <Button asChild><Link to="/partner-register">{t("directory.listYourBusiness")}</Link></Button>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {businesses.map((b) => (
                <BusinessCard key={b.id} b={b} cityName={city.name} />
              ))}
            </ul>
          )}
        </section>

        <section className="mb-12">
          <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2"><MapPin className="w-6 h-6 text-primary" />{t("directory.dogFriendlyPlacesIn", { city: city.name })}</h2>
          {placeTypes.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {["all", ...placeTypes].map((t2) => (
                <Button key={t2} size="sm" variant={filter === t2 ? "default" : "outline"} aria-pressed={filter === t2} onClick={() => setFilter(t2)}>
                  {t2 === "all" ? t("directory.all") : placeLabel(t2)}
                </Button>
              ))}
            </div>
          )}
          {loading ? <p className="text-muted-foreground">{t("directory.loading")}</p> : shownPlaces.length === 0 ? <p className="text-muted-foreground">{t("directory.noPlaces")}</p> : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {shownPlaces.map((p) => (
                <li key={p.id} className="rounded-xl border border-border bg-card p-4">
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  <p className="text-sm text-primary">{placeLabel(p.place_type)}{p.area ? ` · ${p.area}` : ""}</p>
                  {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
                  {p.address && <p className="text-sm text-muted-foreground mt-1">{p.address}</p>}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    {p.phone && <a href={`tel:${p.phone.replace(/\s/g, "")}`} className={linkCls}><Phone className="w-3.5 h-3.5" />{p.phone}</a>}
                    {p.website && <a href={webUrl(p.website)} target="_blank" rel="noopener noreferrer" className={linkCls}><Globe className="w-3.5 h-3.5" />{t("directory.website")}</a>}
                  </div>
                  <a href={p.google_maps_url || getGooglePlacePageUrl(p)} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline mt-2 inline-flex items-center gap-1">
                    {t("directory.openInGoogleMaps")} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-primary/10 border border-primary/20 p-6 text-center">
          <h2 className="font-display text-xl font-semibold mb-2">{t("directory.ctaTitle", { city: city.name })}</h2>
          <p className="text-muted-foreground mb-4">{t("directory.ctaBody")}</p>
          <Button asChild size="lg"><Link to="/auth">{t("directory.joinFree")}</Link></Button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CityDirectory;
