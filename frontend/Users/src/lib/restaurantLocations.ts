export type FixedRestaurantLocation = {
  name: string;
  lat: number;
  lng: number;
};

export const FIXED_RESTAURANT_LOCATIONS: FixedRestaurantLocation[] = [
  { name: "District 1", lat: 10.7769, lng: 106.7009 },
  { name: "District 3", lat: 10.7798, lng: 106.6966 },
  { name: "Thu Duc", lat: 10.8702, lng: 106.8031 },
  { name: "Binh Thanh", lat: 10.803, lng: 106.713 },
  { name: "Phu Nhuan", lat: 10.7992, lng: 106.68 },
];

export const getFixedRestaurantLocation = (restaurantId?: string): FixedRestaurantLocation => {
  if (!restaurantId) return FIXED_RESTAURANT_LOCATIONS[0];
  const hash = Array.from(restaurantId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const idx = hash % FIXED_RESTAURANT_LOCATIONS.length;
  return FIXED_RESTAURANT_LOCATIONS[idx];
};
