import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import LoginRegisterModal from "./components/LoginRegisterModal.jsx";
import HomePage from "./pages/HomePage.jsx";
import RestaurantDetail from "./pages/RestaurantDetail.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import { ToastProvider } from "./context/ToastContext";

// ✅ 你的聊天室面板（請確認路徑正確）
import ChatRecommendPanel from "./components/ChatRecommendPanel.jsx";

export default function App() {
  const [openChat, setOpenChat] = useState(false);
  const navigate = useNavigate();

  // ESC 關閉 popup
  useEffect(() => {
    if (!openChat) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpenChat(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openChat]);

  // ✅ 點餐廳卡片：跳轉 + 關 popup
  const handlePickRestaurant = (r) => {
    const id = r?.id;
    if (id === undefined || id === null) return;
    setOpenChat(false);
    navigate(`/restaurant/${id}`);
  };

  return (
    <ToastProvider>
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

          {/* ✅ 右下角固定聊天室按鈕（全站共用） */}
          <button
            onClick={() => setOpenChat(true)}
            className="
              fixed bottom-6 right-6 z-40
              w-14 h-14 rounded-full
              bg-gray-900 text-white
              flex items-center justify-center
              shadow-lg hover:opacity-90
            "
            aria-label="Open chat"
            title="聊天推薦"
          >
            💬
          </button>

          {/* ✅ Popup 聊天室 */}
          {openChat && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
              {/* 背景遮罩（點擊關閉） */}
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setOpenChat(false)}
              />

              {/* 視窗本體 */}
              <div
                className="
                  relative z-10
                  w-[92vw] sm:w-[560px] md:w-[640px]
                  h-[86vh] sm:h-[720px]
                  rounded-2xl
                  overflow-hidden
                  flex flex-col
                "
              >
                {/* Popup Header：只放關閉鈕 */}
                <div className="h-12 shrink-0 flex items-center justify-end px-3 ">
                  <button
                    onClick={() => setOpenChat(false)}
                    className="
                      w-9 h-9 rounded-full
                      bg-white border border-gray-200
                      text-gray-700 hover:bg-gray-50
                      flex items-center justify-center
                    "
                    aria-label="Close chat"
                    title="關閉"
                  >
                    ✕
                  </button>
                </div>

                {/* 內容區：讓 ChatRecommendPanel 撐滿 */}
                <div className="flex-1 min-h-0">
                  <ChatRecommendPanel onPickRestaurant={handlePickRestaurant} />
                </div>
              </div>
            </div>
          )}
        </div>

        <LoginRegisterModal />
      </AuthProvider>
    </ToastProvider>
  );
}
