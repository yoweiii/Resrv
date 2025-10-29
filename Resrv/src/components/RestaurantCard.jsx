import React from "react";

export default function RestaurantCard({
  name,
  image,
  location,
  cuisine,
  rating,
  reviews,
  times,
  onClick,
}) {
  const stars = Array.from({ length: 5 }, (_, i) => (
    <span
      key={i}
      className={i < Math.round(rating) ? "text-[#e4b326]" : "text-gray-300"} // 金黃星星
    >
      ★
    </span>
  ));

  return (
    <div
      className="bg-white rounded-lg shadow hover:shadow-lg transition transform hover:scale-105 cursor-pointer"
      onClick={onClick}
    >
      <img
        src={image}
        alt={name}
        className="w-full h-40 object-cover rounded-t-lg"
      />
      <div className="p-4">
        <h4 className="font-bold text-base mb-1 truncate text-[#b22a2a]">
          {name}
        </h4>
        <p className="text-xs text-gray-500 mb-2">
          {cuisine} · {location}
        </p>
        <div className="flex items-center text-xs mb-3">
          {stars}
          <span className="ml-1 text-gray-700">{rating.toFixed(1)} 分</span>
          <span className="ml-1 text-gray-500">({reviews} 則評論)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {times.map((t, idx) => (
            <button
              key={idx}
              className="border border-[#b22a2a] text-[#b22a2a] px-2 py-1 text-xs rounded hover:bg-[#e4b326] hover:text-white transition"
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
