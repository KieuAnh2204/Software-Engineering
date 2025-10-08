import { CartSheet } from "../CartSheet";
import { Button } from "@/components/ui/button";
import burgerImage from "@assets/generated_images/Gourmet_burger_meal_380ed3c8.png";
import pizzaImage from "@assets/generated_images/Margherita_pizza_2e01d893.png";

export default function CartSheetExample() {
  const mockItems = [
    {
      id: "1",
      name: "Classic Burger",
      price: 12.99,
      quantity: 2,
      image: burgerImage,
    },
    {
      id: "2",
      name: "Margherita Pizza",
      price: 14.99,
      quantity: 1,
      image: pizzaImage,
    },
  ];

  return (
    <div className="p-8">
      <CartSheet
        items={mockItems}
        trigger={<Button>Open Cart</Button>}
      />
    </div>
  );
}
