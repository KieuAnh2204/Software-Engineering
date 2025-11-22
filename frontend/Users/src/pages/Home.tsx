import axios from "axios";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { RestaurantCard } from "@/components/RestaurantCard";
import { Link } from "wouter";

type Restaurant = {
  _id: string;
  name: string;
  logo_url?: string;
};

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    axios
      .get<{ success: boolean; data: Restaurant[] }>(
        "http://localhost:3003/api/restaurants",
      )
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setRestaurants(res.data.data);
        }
      })
      .catch((err) => console.error("Failed to load restaurants", err));
  }, []);

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
            <Link key={restaurant._id} href={`/restaurant/${restaurant._id}`}>
              <RestaurantCard
                id={restaurant._id}
                name={restaurant.name}
                image={restaurant.logo_url}
                rating={4.5}
                deliveryTime="20-30 min"
              />
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
