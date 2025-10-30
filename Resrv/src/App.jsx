import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext.jsx";
import LoginRegisterModal from "./components/LoginRegisterModal.jsx";
import HomePage from "./pages/HomePage";
import RestaurantDetail from "./pages/RestaurantDetail";
import MyBookings from "./pages/MyBookings";

export default function App() {
  return (
    <AuthProvider> 
      <div className="bg-gray-50 min-h-screen">
        <Navbar />
        {/* 導覽列高度約 96px，padding-top 保留空間 */}
        <div className="pt-24">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/restaurant/:id" element={<RestaurantDetail />} />
            <Route path="/bookings" element={<MyBookings />} />
          </Routes>
        </div>
      </div>
      <LoginRegisterModal /> 
    </AuthProvider>
  );
}
