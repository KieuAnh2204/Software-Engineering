import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

interface AddressConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  itemName?: string;
  required?: boolean;
}

export function AddressConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  itemName,
  required = false,
}: AddressConfirmationDialogProps) {
  const { user, updateProfile } = useAuth();
  const [address, setAddress] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user?.address) {
      setAddress(user.address);
      setIsEditing(false);
    } else {
      setAddress("");
      setIsEditing(true);
    }
  }, [user?.address, open]);

  const handleConfirm = () => {
    if (address.trim()) {
      updateProfile({ address: address.trim() });
      onConfirm();
      if (onOpenChange) {
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={required ? undefined : onOpenChange}>
      <DialogContent 
        className="sm:max-w-md" 
        data-testid="dialog-address-confirmation"
        onInteractOutside={required ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={required ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {required ? "Set Your Delivery Address" : "Confirm Delivery Address"}
          </DialogTitle>
          <DialogDescription>
            {required 
              ? "Please set your delivery address to continue using the app."
              : itemName 
                ? `Before adding "${itemName}" to your cart, please confirm your delivery address.`
                : "Please confirm your delivery address before adding items to cart."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="address">Delivery Address</Label>
            {isEditing ? (
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your delivery address"
                data-testid="input-address"
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-2">
                <div 
                  className="flex-1 p-3 rounded-md bg-muted text-sm"
                  data-testid="text-current-address"
                >
                  {address}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  data-testid="button-edit-address"
                >
                  Edit
                </Button>
              </div>
            )}
          </div>
          
          {!user?.address && (
            <p className="text-sm text-muted-foreground">
              This address will be saved to your profile for future orders.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {!required && (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            disabled={!address.trim()}
            data-testid="button-confirm-address"
          >
            {required ? "Save Address" : "Confirm & Add to Cart"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
