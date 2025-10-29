// src/pages/HomePage.jsx
import React from "react";
import CarouselSection from "../components/CarouselSection";
import RestaurantCard from "../components/RestaurantCard";
import restaurants from "../data/restaurants";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* 第一個區塊：必訪餐廳 */}
      <CarouselSection title="必訪餐廳" restaurants={restaurants.slice(0, 5)} />

      {/* 第二個區塊：現在可訂位的熱門餐廳 */}
      <h2 className="text-2xl font-bold my-6">現在可訂位的熱門餐廳</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {restaurants.map((item, idx) => (
          <RestaurantCard key={idx} {...item} />
        ))}
      </div>
    </div>
  );
}
