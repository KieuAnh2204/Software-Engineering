import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import burgerImage from "@assets/generated_images/Gourmet_burger_meal_380ed3c8.png";
import pizzaImage from "@assets/generated_images/Margherita_pizza_2e01d893.png";
import sushiImage from "@assets/generated_images/Sushi_platter_c5d624ec.png";

export default function Cart() {
  const cartItems = [
    {
      id: "1",
      name: "Classic Burger",
      restaurant: "Burger House",
      price: 12.99,
      quantity: 2,
      image: burgerImage,
    },
    {
      id: "2",
      name: "Margherita Pizza",
      restaurant: "Bella Italia",
      price: 14.99,
      quantity: 1,
      image: pizzaImage,
    },
    {
      id: "3",
      name: "Sushi Platter",
      restaurant: "Tokyo Fusion",
      price: 18.99,
      quantity: 1,
      image: sushiImage,
    },
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 2.99;
  const serviceFee = 1.50;
  const total = subtotal + deliveryFee + serviceFee;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Your Cart</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 rounded-md object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.restaurant}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">
                          ${item.price.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              data-testid={`button-decrease-${item.id}`}
                              onClick={() => console.log(`Decrease ${item.name}`)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              data-testid={`button-increase-${item.id}`}
                              onClick={() => console.log(`Increase ${item.name}`)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            data-testid={`button-remove-${item.id}`}
                            onClick={() => console.log(`Remove ${item.name}`)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-bold">Order Summary</h2>
                <Separator />
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery fee</span>
                    <span className="font-medium">${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service fee</span>
                    <span className="font-medium">${serviceFee.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-primary">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Link href="/checkout">
                  <Button
                    className="w-full"
                    size="lg"
                    data-testid="button-proceed-checkout"
                  >
                    Proceed to Checkout
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
