import React, { useState } from "react";
import PeopleSelect from "./PeopleSelect"; // 引入共用元件

export default function Navbar() {
  const [people, setPeople] = useState(1);

  return (
    <nav className="bg-[#f0ddbf] shadow-md fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* LOGO */}
        <span className="text-[#b22a2a] font-bold text-2xl">Resrv</span>

        {/* 搜尋區 */}
        <div className="flex flex-wrap gap-2 items-center border border-[#b22a2a] rounded-full px-4 py-2 shadow-sm">
          <input
            type="date"
            className="px-3 py-2 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#b22a2a]"
          />
          <input
            type="time"
            className="px-3 py-2 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#b22a2a]"
          />

          {/* 使用共用元件 */}
          <PeopleSelect
            maxPeople={20}
            value={people}
            onChange={(e) => setPeople(e.target.value)}
          />

          <input
            type="text"
            placeholder="地點、餐廳或料理"
            className="px-3 py-2 rounded-full border border-gray-300 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-[#b22a2a]"
          />
          <button className="bg-[#b22a2a] text-white px-4 py-2 rounded-full hover:bg-[#e4b326] transition">
            開始搜尋
          </button>
        </div>

        {/* 加入獎勵與登入 */}
        <div className="flex items-center gap-3">
          <button className="text-sm text-[#b22a2a] hover:text-[#e4b326]">
            加入獎勵
          </button>
          <button className="bg-[#e4b326] px-3 py-1 rounded-md text-sm text-white hover:bg-[#b22a2a] transition">
            登入
          </button>
        </div>
      </div>
    </nav>
  );
}

