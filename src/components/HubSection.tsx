import { Calendar, MessageSquare, MapPin, Bell } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const HubSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const hubFeatures = [
    { icon: Calendar, title: t("hubSection.features.events.title"), description: t("hubSection.features.events.desc"), image: "📅" },
    { icon: MessageSquare, title: t("hubSection.features.forum.title"), description: t("hubSection.features.forum.desc"), image: "💬" },
    { icon: MapPin, title: t("hubSection.features.directory.title"), description: t("hubSection.features.directory.desc"), image: "🗺️" },
    { icon: Bell, title: t("hubSection.features.reminders.title"), description: t("hubSection.features.reminders.desc"), image: "🔔" },
  ];

  const handleJoinWaitlist = () => {
    navigate("/auth");
  };

  return (
    <section id="hub" className="py-20 lg:py-32 bg-gradient-warm">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
            {t("hubSection.title")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("hubSection.description")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {hubFeatures.map((feature) => (
            <div
              key={feature.title}
              className="group bg-card rounded-2xl p-6 shadow-card border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{feature.image}</div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="hero" size="xl" onClick={handleJoinWaitlist}>
            {t("hubSection.cta")}
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            {t("hubSection.ctaHelp")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default HubSection;
