import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah M.",
    pet: "Owner of Luna",
    avatar: "🐕‍🦺",
    rating: 5,
    text: "Woofy has saved me over €500 in just 3 months! The discounts at my local pet shop alone made it worth it.",
  },
  {
    name: "Michael K.",
    pet: "Owner of Max & Bella",
    avatar: "🐕",
    rating: 5,
    text: "The community events are amazing. My dogs have made so many friends, and so have I! Best €59 I've ever spent.",
  },
  {
    name: "Emma L.",
    pet: "Owner of Charlie",
    avatar: "🦮",
    rating: 5,
    text: "Free monthly training sessions? Yes please! The trainers are fantastic and Charlie has learned so much.",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
            What Our Members Say
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of happy pet parents who are saving money and building community.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-6 shadow-card border border-border hover:shadow-lg transition-shadow duration-300"
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-woofy-soft rounded-full flex items-center justify-center text-2xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-display font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.pet}</p>
                </div>
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Text */}
              <p className="text-foreground/80 italic">"{testimonial.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;