import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { DIRECTORY_CITIES, getDirectoryCity } from "@/data/cityDirectory";
import { CITY_SERVICES, businessMatchesService, getCityService } from "@/data/cityServices";
import BusinessCard, { type DirectoryBusiness } from "@/components/directory/BusinessCard";

const SITE = "https://wooffy.app";

const CityServiceDirectory = () => {
  const { city: citySlug, service: serviceSlug } = useParams();
  const city = getDirectoryCity(citySlug);
  const service = getCityService(serviceSlug);
  const [items, setItems] = useState<DirectoryBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city || !service) return;
    setLoading(true);
    supabase.rpc("public_city_directory_businesses").then(({ data }) => {
      const list = ((data as DirectoryBusiness[] | null) ?? [])
        .filter((b) => b.city === city.name && businessMatchesService(b, service))
        .sort((a, z) => a.business_name.localeCompare(z.business_name));
      setItems(list);
      setLoading(false);
    });
  }, [city, service]);

  if (!city) return <Navigate to="/places" replace />;
  if (!service) return <Navigate to={`/places/${city.slug}`} replace />;

  const url = `${SITE}/places/${city.slug}/${service.slug}`;
  const title = `${service.label} in ${city.name}, Cyprus | Wooffy`;
  const desc = `Find ${service.blurb} in ${city.name}, Cyprus. Phone numbers, websites and directions, plus exclusive Wooffy member offers.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Wooffy", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "Cyprus Pet Directory", item: SITE + "/places" },
        { "@type": "ListItem", position: 3, name: city.name, item: `${SITE}/places/${city.slug}` },
        { "@type": "ListItem", position: 4, name: service.label, item: url },
      ] },
      { "@type": "ItemList", name: `${service.label} in ${city.name}`, itemListElement: items.map((b, i) => ({
        "@type": "ListItem", position: i + 1,
        item: { "@type": "LocalBusiness", name: b.business_name, ...(b.phone ? { telephone: b.phone } : {}), ...(b.website ? { url: b.website } : {}),
          address: { "@type": "PostalAddress", ...(b.address ? { streetAddress: b.address } : {}), addressLocality: city.name, addressCountry: "CY" } },
      })) },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={url} />
        {!loading && items.length === 0 && <meta name="robots" content="noindex, follow" />}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={url} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 pt-28 pb-16 max-w-5xl">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary">Wooffy</Link> / <Link to="/places" className="hover:text-primary">Cyprus Pet Directory</Link> / <Link to={`/places/${city.slug}`} className="hover:text-primary">{city.name}</Link> / <span>{service.label}</span>
        </nav>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">{service.label} in {city.name}</h1>
        <p className="text-muted-foreground text-lg mb-6">Find {service.blurb} in {city.name}, Cyprus, listed on Wooffy. Call, visit their website or get directions, and sign in to see exclusive member offers.</p>

        <section className="mb-10">
          {loading ? <p className="text-muted-foreground">Loading…</p> : items.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="text-muted-foreground mb-4">No {service.label.toLowerCase()} in {city.name} are listed on Wooffy yet. Run one here?</p>
              <Button asChild><Link to="/partner-register">List your pet business</Link></Button>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {items.map((b) => <BusinessCard key={b.id} b={b} cityName={city.name} />)}
            </ul>
          )}
        </section>

        <nav aria-label="Other services" className="mb-6">
          <h2 className="font-display text-lg font-semibold mb-3">More pet services in {city.name}</h2>
          <div className="flex flex-wrap gap-2">
            {CITY_SERVICES.filter((s) => s.slug !== service.slug).map((s) => (
              <Link key={s.slug} to={`/places/${city.slug}/${s.slug}`} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-primary hover:text-primary">{s.label}</Link>
            ))}
            <Link to={`/places/${city.slug}`} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-primary hover:text-primary">Dog-friendly places</Link>
          </div>
        </nav>
        <nav aria-label="Other cities" className="mb-10">
          <h2 className="font-display text-lg font-semibold mb-3">{service.label} in other cities</h2>
          <div className="flex flex-wrap gap-2">
            {DIRECTORY_CITIES.filter((c) => c.slug !== city.slug).map((c) => (
              <Link key={c.slug} to={`/places/${c.slug}/${service.slug}`} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-primary hover:text-primary">{service.label} in {c.name}</Link>
            ))}
          </div>
        </nav>

        <section className="rounded-2xl bg-primary/10 border border-primary/20 p-6 text-center">
          <h2 className="font-display text-xl font-semibold mb-2">Dog or cat owner in {city.name}?</h2>
          <p className="text-muted-foreground mb-4">Join Wooffy free for partner discounts, pet health reminders and lost & found alerts.</p>
          <Button asChild size="lg"><Link to="/auth">Join Wooffy free</Link></Button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CityServiceDirectory;
