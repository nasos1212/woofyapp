import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Heart, MapPin, Globe, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import DogLoader from "@/components/DogLoader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ensureHttps } from "@/lib/utils";

interface Shelter {
  id: string;
  shelter_name: string;
  location: string;
  city: string | null;
  description: string | null;
  mission_statement: string | null;
  logo_url: string | null;
  cover_photo_url: string | null;
  website: string | null;
  donation_link: string | null;
  dogs_helped_count: number | null;
  dogs_in_care: string | null;
}

const MemberShelters = () => {
  const { user, loading: authLoading } = useAuth();
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchShelters = async () => {
      try {
        const { data, error } = await supabase
          .from("shelters")
          .select("id, shelter_name, location, city, description, mission_statement, logo_url, cover_photo_url, website, donation_link, dogs_helped_count, dogs_in_care")
          .eq("verification_status", "approved")
          .order("shelter_name");

        if (error) throw error;
        setShelters(data || []);
      } catch (error) {
        console.error("Error fetching shelters:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShelters();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Pet Shelters | Wooffy</title>
        <meta name="description" content="Support local pet shelters in Cyprus. 10% of every Wooffy membership goes to helping shelters care for dogs in need." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-background to-background">
        <Header />

        <main className="container mx-auto px-4 py-8 pt-24">
          {/* Back Button */}
          <Link to="/member" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>

          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  Pet Shelters
                </h1>
                <p className="text-muted-foreground">
                  10% of your membership supports these amazing shelters
                </p>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-primary to-teal-600 border-0 text-white">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Partner Shelters</p>
                  <p className="text-2xl md:text-3xl font-bold">{shelters.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-teal-500 to-cyan-600 border-0 text-white">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Euro className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Donated So Far</p>
                  <p className="text-2xl md:text-3xl font-bold">€1,250+</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shelters Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <DogLoader size="md" />
            </div>
          ) : shelters.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Heart className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No shelters available yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shelters.map((shelter) => (
                <Link key={shelter.id} to={`/shelter/${shelter.id}`}>
                  <Card className="h-full hover:shadow-lg transition-all overflow-hidden group">
                    {/* Cover Image */}
                    <div className="h-32 bg-gradient-to-br from-rose-100 to-pink-100 relative overflow-hidden">
                      {shelter.cover_photo_url ? (
                        <img 
                          src={shelter.cover_photo_url} 
                          alt={shelter.shelter_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Heart className="w-12 h-12 text-rose-300" />
                        </div>
                      )}
                      {/* Logo overlay */}
                      {shelter.logo_url && (
                        <div className="absolute bottom-2 left-4 w-14 h-14 bg-white rounded-xl shadow-md overflow-hidden">
                          <img 
                            src={shelter.logo_url} 
                            alt={`${shelter.shelter_name} logo`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {shelter.shelter_name}
                      </h3>
                      
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{shelter.city || shelter.location}</span>
                      </div>

                      {shelter.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {shelter.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t">
                        {shelter.dogs_in_care && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium text-primary">{shelter.dogs_in_care}</span> dogs in care
                          </div>
                        )}
                        {shelter.website && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(ensureHttps(shelter.website!), "_blank");
                            }}
                          >
                            <Globe className="w-3 h-3" />
                            Website
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* CTA for non-members */}
          <Card className="mt-8 bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200/50">
            <CardContent className="p-6 text-center">
              <Heart className="w-10 h-10 mx-auto text-rose-500 mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Want to help even more?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Visit any shelter's page to find their donation link and support them directly.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default MemberShelters;
