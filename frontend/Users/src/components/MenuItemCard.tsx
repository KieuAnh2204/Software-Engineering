import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MenuItemCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  onAddToCart?: () => void;
}

export function MenuItemCard({
  name,
  description,
  price,
  image,
  onAddToCart,
}: MenuItemCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate active-elevate-2">
      <div className="aspect-square w-full overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-base mb-1">{name}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">${price.toFixed(2)}</span>
          <Button
            size="icon"
            data-testid={`button-add-${name.toLowerCase().replace(/\s+/g, "-")}`}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.();
              console.log(`Added ${name} to cart`);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
