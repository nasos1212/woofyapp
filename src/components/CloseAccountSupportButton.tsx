import { useState } from "react";
import { Button } from "@/components/ui/button";
import SupportDialog from "./SupportDialog";

interface Props {
  label: string;
  subject: string;
}

/** Opens the in-app support messenger with a prefilled subject (no external email app). */
const CloseAccountSupportButton = ({ label, subject }: Props) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <SupportDialog open={open} onOpenChange={setOpen} initialSubject={subject} />
    </>
  );
};

export default CloseAccountSupportButton;
