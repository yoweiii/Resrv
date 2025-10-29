import React from "react";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      {/* 導覽列高度約 96px，padding-top 保留空間 */}
      <div className="pt-24">
        <HomePage />
      </div>
    </div>
  );
}
