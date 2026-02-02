import { useState } from "react";
import { Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import SupportDialog from "@/components/SupportDialog";

interface ContactPopoverProps {
  triggerText?: string;
  triggerVariant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  triggerSize?: "default" | "sm" | "lg" | "icon";
  triggerClassName?: string;
  showIcon?: boolean;
  asLink?: boolean;
}

const ContactPopover = ({
  triggerText = "Contact us",
  triggerVariant = "outline",
  triggerSize = "sm",
  triggerClassName = "",
  showIcon = true,
  asLink = false,
}: ContactPopoverProps) => {
  const { toast } = useToast();
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleEmailClick = () => {
    navigator.clipboard.writeText("hello@wooffy.app");
    window.location.href = "mailto:hello@wooffy.app";
    toast({
      title: "Email address copied!",
      description: "hello@wooffy.app has been copied to your clipboard. Your email app should open - if not, paste the address manually.",
    });
    setPopoverOpen(false);
  };

  const handleMessageClick = () => {
    setPopoverOpen(false);
    setShowSupportDialog(true);
  };

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          {asLink ? (
            <button className={`text-primary hover:underline ${triggerClassName}`}>
              {triggerText}
            </button>
          ) : (
            <Button variant={triggerVariant} size={triggerSize} className={`gap-2 ${triggerClassName}`}>
              {showIcon && <MessageSquare className="w-4 h-4" />}
              {triggerText}
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="center">
          <p className="text-sm font-medium mb-3 text-center">How would you like to reach us?</p>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={handleEmailClick}
            >
              <Mail className="w-4 h-4" />
              Send an Email
            </Button>
            <Button
              variant="default"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={handleMessageClick}
            >
              <MessageSquare className="w-4 h-4" />
              Message Us
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">hello@wooffy.app</p>
        </PopoverContent>
      </Popover>

      <SupportDialog open={showSupportDialog} onOpenChange={setShowSupportDialog} />
    </>
  );
};

export default ContactPopover;
