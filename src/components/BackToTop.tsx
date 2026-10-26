import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addScrollListener, getScrollTop, scrollToTop as scrollContainerToTop } from "@/lib/scroll";

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 300px
      if (getScrollTop() > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    return addScrollListener(toggleVisibility);
  }, []);

  const scrollToTop = () => {
    scrollContainerToTop("smooth");
  };

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg bg-primary hover:bg-primary/90 animate-fade-in"
      aria-label="Back to top"
    >
      <ArrowUp className="w-5 h-5" />
    </Button>
  );
};

export default BackToTop;
