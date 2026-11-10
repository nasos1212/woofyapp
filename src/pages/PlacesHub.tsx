import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DIRECTORY_CITIES } from "@/data/cityDirectory";

const PlacesHub = () => {
  const title = "Cyprus Pet Directory: Pet Shops, Vets & Dog-Friendly Places | Wooffy";
  const desc = "Find pet shops, vets, groomers and dog-friendly cafés, restaurants and beaches in Limassol, Nicosia, Larnaca, Paphos and Famagusta.";
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href="https://wooffy.app/places" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content="https://wooffy.app/places" />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 pt-28 pb-16 max-w-4xl">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Cyprus Pet Directory</h1>
        <p className="text-muted-foreground text-lg mb-8">{desc}</p>
        <ul className="grid gap-4 sm:grid-cols-2">
          {DIRECTORY_CITIES.map((c) => (
            <li key={c.slug}>
              <Link to={`/places/${c.slug}`} className="block rounded-xl border border-border bg-card p-5 hover:border-primary transition-colors">
                <h2 className="font-display text-xl font-semibold flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" />Pet places in {c.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">Pet shops, vets, groomers and dog-friendly spots</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
};

export default PlacesHub;
