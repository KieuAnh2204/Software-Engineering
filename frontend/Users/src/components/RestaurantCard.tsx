import { Clock, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RestaurantCardProps {
  id: string;
  name: string;
  image: string;
  cuisine: string[];
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  onClick?: () => void;
}

export function RestaurantCard({
  name,
  image,
  cuisine,
  rating,
  deliveryTime,
  deliveryFee,
  onClick,
}: RestaurantCardProps) {
  return (
    <Card
      className="overflow-hidden cursor-pointer hover-elevate active-elevate-2 transition-transform duration-200"
      onClick={onClick}
      data-testid={`card-restaurant-${name.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="aspect-video w-full overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg">{name}</h3>
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{rating}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {cuisine.map((c) => (
            <Badge key={c} variant="secondary" className="text-xs">
              {c}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{deliveryTime}</span>
          </div>
          <span className="font-medium">
            {deliveryFee === 0 ? "Free delivery" : `$${deliveryFee.toFixed(2)} delivery`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
