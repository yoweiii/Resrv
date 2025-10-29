import React from "react";

export default function PeopleSelect({ maxPeople = 10, value, onChange }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="px-3 py-2 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#b22a2a]"
    >
      {Array.from({ length: maxPeople }, (_, i) => (
        <option key={i + 1} value={i + 1}>
          {i + 1} 位
        </option>
      ))}
      <option value={`${maxPeople}+`}>{maxPeople} 位以上</option>
    </select>
  );
}
