import { Clock, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

interface RestaurantCardProps {
  id: string;
  name: string;
  image?: string;
  rating?: number;
  deliveryTime?: string;
}

export function RestaurantCard({
  id,
  name,
  image,
  rating = 4.8,
  deliveryTime = "20-30 min",
}: RestaurantCardProps) {
  return (
    <Link href={`/restaurant/${id}`}>
    <Card
      className="overflow-hidden cursor-pointer hover-elevate active-elevate-2 transition-transform duration-200"
      data-testid={`card-restaurant-${id}`}
    >
      <div className="aspect-video w-full overflow-hidden">
        <img
          src={image ? image : "/attached_assets/no_image.png"}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg">{name}</h3>
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{rating.toFixed(1)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{deliveryTime}</span>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}
