import { Heart } from "lucide-react";
import founderImage from "@/assets/founder-klodiana.jpg";

const FounderSection = () => {
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft border border-border mb-6">
            <Heart className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-medium text-muted-foreground">The Heart Behind Wooffy</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground">
            A Message From Our Founder
          </h2>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-10 items-center">
          {/* Photo */}
          <div className="md:col-span-2 flex justify-center">
            <div className="relative">
              <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-card border-4 border-primary/20 rotate-2 hover:rotate-0 transition-transform duration-500">
                <img
                  src={founderImage}
                  alt="Klodiana Koutsouki, founder of Wooffy, with her dog Kobe"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-card rounded-2xl px-4 py-2 shadow-card border border-border">
                <p className="font-display font-bold text-sm text-foreground">Klodiana & Kobe</p>
                <p className="text-xs text-muted-foreground">Founder of Wooffy</p>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="md:col-span-3 space-y-5">
            <p className="text-lg text-foreground font-medium">
              Hello animal lovers 🐾!
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Although I am a pharmacist with a Master's degree in Pharmaceutical Chemistry, my heart has always been devoted to helping animals in need.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              My journey began through volunteering in Greece and Cyprus, where I adopted my dog Kobe and later became a volunteer at the non-profit UANA Foundation, helping dogs in municipal pounds find loving homes. Through these experiences, I saw both the incredible dedication of the animal welfare community and the everyday challenges pet owners face, including the growing cost of caring for their pets.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Wooffy App was created to bring pet lovers and pet businesses together in one supportive community, helping pet owners save money on pet expenses while also supporting animal shelters.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Built with love and purpose, Wooffy aims to make pet care easier, more connected, and more compassionate for everyone.
            </p>
            <p className="text-lg text-foreground font-medium">
              Will see you inside the app ❤️
            </p>
            <p className="font-display font-semibold text-primary">
              — Klodiana Koutsouki
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FounderSection;
