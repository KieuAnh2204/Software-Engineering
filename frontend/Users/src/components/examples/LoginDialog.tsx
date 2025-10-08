import { LoginDialog } from "../LoginDialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function LoginDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-8">
      <Button onClick={() => setOpen(true)}>Open Login Dialog</Button>
      <LoginDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
