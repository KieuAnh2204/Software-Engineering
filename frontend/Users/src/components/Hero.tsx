import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import heroImage from "@assets/generated_images/Hero_food_spread_image_0a8e7b93.png";

export function Hero() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="relative h-96 lg:h-[500px] max-h-[600px] w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
      
      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
          Hungry? Order Now!
        </h1>
        <p className="text-lg lg:text-xl text-white/90 mb-8 max-w-2xl">
          Discover restaurants near you and get your favorite food delivered fast
        </p>
        
        <div className="w-full max-w-2xl flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for restaurants or cuisines..."
              className="pl-10 h-12 text-base bg-white dark:bg-card"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <Button
            size="lg"
            className="h-12 px-8"
            data-testid="button-search"
            onClick={() => console.log("Search:", searchQuery)}
          >
            Search
          </Button>
        </div>
      </div>
    </div>
  );
}
