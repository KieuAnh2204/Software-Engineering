import { MenuItemCard } from "../MenuItemCard";
import burgerImage from "@assets/generated_images/Gourmet_burger_meal_380ed3c8.png";

export default function MenuItemCardExample() {
  return (
    <div className="p-8 max-w-xs">
      <MenuItemCard
        id="1"
        name="Classic Burger"
        description="Juicy beef patty with fresh lettuce, tomatoes, and our special sauce"
        price={12.99}
        image={burgerImage}
        onAddToCart={() => console.log("Added to cart")}
      />
    </div>
  );
}
