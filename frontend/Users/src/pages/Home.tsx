import { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { RestaurantCard } from "@/components/RestaurantCard";
import { Link } from "wouter";
import italianRestaurant from "@assets/generated_images/Italian_restaurant_exterior_b7a0fbc1.png";
import asianRestaurant from "@assets/generated_images/Asian_restaurant_interior_4c64ebbb.png";

export default function Home() {
  const [, setLocation] = useState<string>("");

  const restaurants = [
    {
      id: "1",
      name: "Bella Italia",
      image: italianRestaurant,
      cuisine: ["Italian", "Pizza", "Pasta"],
      rating: 4.8,
      deliveryTime: "25-35 min",
      deliveryFee: 2.99,
    },
    {
      id: "2",
      name: "Tokyo Fusion",
      image: asianRestaurant,
      cuisine: ["Japanese", "Sushi", "Asian"],
      rating: 4.6,
      deliveryTime: "30-40 min",
      deliveryFee: 0,
    },
    {
      id: "3",
      name: "Burger House",
      image: italianRestaurant,
      cuisine: ["American", "Burgers", "Fast Food"],
      rating: 4.5,
      deliveryTime: "20-30 min",
      deliveryFee: 1.99,
    },
    {
      id: "4",
      name: "Spice Garden",
      image: asianRestaurant,
      cuisine: ["Indian", "Curry", "Vegetarian"],
      rating: 4.7,
      deliveryTime: "35-45 min",
      deliveryFee: 2.49,
    },
    {
      id: "5",
      name: "Pizza Palace",
      image: italianRestaurant,
      cuisine: ["Italian", "Pizza"],
      rating: 4.4,
      deliveryTime: "25-35 min",
      deliveryFee: 0,
    },
    {
      id: "6",
      name: "Sushi Express",
      image: asianRestaurant,
      cuisine: ["Japanese", "Sushi"],
      rating: 4.9,
      deliveryTime: "30-40 min",
      deliveryFee: 3.99,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Popular Restaurants</h2>
          <p className="text-muted-foreground">Discover the best restaurants near you</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <Link key={restaurant.id} href={`/restaurant/${restaurant.id}`}>
              <RestaurantCard
                {...restaurant}
                onClick={() => setLocation(`/restaurant/${restaurant.id}`)}
              />
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
