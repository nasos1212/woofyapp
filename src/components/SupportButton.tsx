import { useState } from "react";
import { MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import SupportDialog from "./SupportDialog";
import { useAuth } from "@/hooks/useAuth";

const SupportButton = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:bottom-6"
        size="icon"
        aria-label="Get support"
      >
        <MessageCircleQuestion className="h-6 w-6" />
      </Button>
      <SupportDialog open={open} onOpenChange={setOpen} />
    </>
  );
};

export default SupportButton;
