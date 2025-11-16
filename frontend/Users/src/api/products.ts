import { productClient } from "./client";

export const getRestaurants = () => productClient.get("/restaurants");

export const getRestaurant = (id: string) =>
  productClient.get(`/restaurants/${id}`);

export const getDishesByRestaurant = (id: string) =>
  productClient.get(`/restaurants/${id}/dishes`);
