import { RestaurantCard } from "../RestaurantCard";
import italianRestaurant from "@assets/generated_images/Italian_restaurant_exterior_b7a0fbc1.png";

export default function RestaurantCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <RestaurantCard
        id="1"
        name="Bella Italia"
        image={italianRestaurant}
        cuisine={["Italian", "Pizza", "Pasta"]}
        rating={4.8}
        deliveryTime="25-35 min"
        deliveryFee={2.99}
        onClick={() => console.log("Restaurant clicked")}
      />
    </div>
  );
}
