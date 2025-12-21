import React, { useEffect, useMemo, useRef, useState } from "react";
import { chatApi } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import restaurants from "../data/restaurants";

function normalize(s) {
  return (s ?? "").toString().trim().toLowerCase();
}

function norm(s) {
  return (s ?? "").toString().trim().toLowerCase();
}

function includesLoose(hay, needle) {
  const h = norm(hay);
  const n = norm(needle);
  if (!n) return true;
  return h.includes(n) || n.includes(h);
}

function matchInList(list, keyword) {
  if (!keyword) return true;
  const arr = Array.isArray(list) ? list : [];
  // 只要 list 裡任何一個 tag 跟 keyword 「互相包含」就算中
  return arr.some((x) => includesLoose(x, keyword));
}

function matchBudget(price, budget) {
  if (!budget) return true;
  if (typeof price !== "number") return true;
  // 允許稍微浮動，避免太嚴格
  return price <= budget + 100;
}

function matchPeople(maxPeople, people) {
  if (!people) return true;
  if (typeof maxPeople !== "number") return true;
  return maxPeople >= people;
}

function scoreRestaurant(r, filters) {
  let score = 0;
  if (filters?.area && matchInList(r.areas, filters.area)) score += 3;
  if (filters?.cuisine && matchInList(r.cuisines, filters.cuisine)) score += 3;
  if (filters?.occasion && matchInList(r.occasions, filters.occasion)) score += 2;
  if (filters?.budget && matchBudget(r.price, filters.budget)) score += 1;
  if (filters?.people && matchPeople(r.maxPeople, filters.people)) score += 1;
  if (typeof r.rating === "number") score += r.rating * 0.1;
  return score;
}

/**
 * 你要的規則：
 * 1) 「符合條件的餐廳」：只顯示「地區 + 類型」嚴格符合
 * 2) 若嚴格 0 間：顯示「沒有符合條件的餐廳」
 * 3) 並在下方顯示「其他推薦（同類型）」：只用同類型去找（不會出現完全不相關的咖啡/酒吧）
 *    - 同類型判斷：優先用 filters.cuisine 去比 r.cuisines（list）與 r.cuisine（單欄位）
 *    - 若 filters.cuisine 太短/像亂碼（例如「力」「2」），就用群組推定（hotpot/bbq/cafe/bar）
 * 4) 「其他推薦」欄位在 matched=0 時一定會出現（就算找不到也會顯示提示）
 */
function getRecommendBuckets(list, filters) {
  if (!filters) return { matched: list, others: [], mode: "strict" };

  const hasArea = !!filters.area;
  const hasCuisine = !!filters.cuisine;

  // 1) 嚴格符合：area + cuisine（有填才要求）
  const matched = list.filter((r) => {
    const okArea = !hasArea || matchInList(r.areas, filters.area);
    const okCuisine = !hasCuisine || matchInList(r.cuisines, filters.cuisine);
    return okArea && okCuisine;
  });

  // 有嚴格符合 → 只顯示 matched（其他推薦不顯示）
  if (matched.length > 0) {
    return {
      matched: matched
        .slice()
        .sort((a, b) => scoreRestaurant(b, filters) - scoreRestaurant(a, filters)),
      others: [],
      mode: "strict",
    };
  }

  // ===== 2) 其他推薦（同類型） =====
  const CUISINE_GROUPS = {
    hotpot: ["火鍋", "麻辣鍋", "麻辣", "涮涮鍋", "鍋物", "泰式火鍋", "日式火鍋"],
    bbq: ["燒肉", "燒烤", "串燒", "居酒屋"],
    cafe: ["咖啡", "咖啡廳", "甜點", "早午餐"],
    bar: ["酒吧", "調酒"],
  };

  function pickCuisineGroup(keyword) {
    const k = (keyword ?? "").toString().trim();
    if (!k) return null;

    // 太短或全數字的 keyword 視為無效（避免「力」「2」）
    if (k.length < 2) return null;
    if (/^\d+$/.test(k)) return null;

    for (const groupKey of Object.keys(CUISINE_GROUPS)) {
      const tags = CUISINE_GROUPS[groupKey];
      if (tags.some((t) => includesLoose(t, k) || includesLoose(k, t))) return groupKey;
    }
    return null;
  }

  const cuisineKey = (filters.cuisine ?? "").toString().trim();
  let othersPool = [];

  if (cuisineKey) {
    // 先用「直接同類型」：比對 cuisines(list) + cuisine(單欄位)
    othersPool = list.filter((r) => {
      return (
        matchInList(r.cuisines, cuisineKey) ||
        includesLoose(r.cuisine, cuisineKey) ||
        includesLoose(cuisineKey, r.cuisine)
      );
    });

    // 如果直接找不到 → 用群組推定再找一次
    if (othersPool.length === 0) {
      const g = pickCuisineGroup(cuisineKey);
      if (g) {
        const tags = CUISINE_GROUPS[g];
        othersPool = list.filter((r) =>
          tags.some((t) => matchInList(r.cuisines, t) || includesLoose(r.cuisine, t))
        );
      }
    }
  } else {
    // 沒有類型 → 其他推薦就空（但 UI 仍會顯示提示）
    othersPool = [];
  }

  // 去重（保險）
  const matchedIds = new Set(matched.map((x) => x.id));
  const others = othersPool
    .filter((r) => !matchedIds.has(r.id))
    .slice()
    .sort((a, b) => scoreRestaurant(b, filters) - scoreRestaurant(a, filters));

  return { matched: [], others, mode: "fallback" };
}

export default function ChatRecommendPanel({ onPickRestaurant }) {
  const { user, openAuth } = useAuth();
  const [sessionId, setSessionId] = useState(
    () => localStorage.getItem("chat_session_id") ?? ""
  );

  const [messages, setMessages] = useState(() => {
    const raw = localStorage.getItem("chat_messages");
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  });

  const chatBoxRef = useRef(null);
  const [stage, setStage] = useState("collecting"); // collecting | recommend
  const [filters, setFilters] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const el = chatBoxRef.current;
    if (!el) return;

    // 只有內容高度超過容器高度時才捲
    if (el.scrollHeight > el.clientHeight) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length]);

  // persist messages
  useEffect(() => {
    localStorage.setItem("chat_messages", JSON.stringify(messages));
  }, [messages]);

  // persist session id
  useEffect(() => {
    if (sessionId) localStorage.setItem("chat_session_id", sessionId);
  }, [sessionId]);

  const recommendResult = useMemo(
    () => getRecommendBuckets(restaurants, filters),
    [filters]
  );

  const matched = recommendResult.matched;
  const others = recommendResult.others;

  async function start() {
    if (!user) {
      openAuth("login");
      return;
    }

    setErr("");
    setLoading(true);
    try {
      const data = await chatApi.start(); // {session_id, reply, stage}
      setSessionId(data.session_id);
      setStage(data.stage ?? "collecting");
      setFilters(null);
      setMessages([{ role: "bot", content: data.reply }]);
    } catch (e) {
      setErr(e?.message || "start failed");
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text) return;
    if (!user) {
      openAuth("login");
      return;
    }
    if (!sessionId) {
      await start();
      return;
    }

    setErr("");
    setLoading(true);
    setInput("");

    // optimistic add user msg
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const data = await chatApi.message(sessionId, text);
      // {reply, stage, filters?}
      setStage(data.stage ?? "collecting");
      if (data.stage === "recommend" && data.filters) {
        setFilters(data.filters);
      }
      setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
    } catch (e) {
      setErr(e?.message || "message failed");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    localStorage.removeItem("chat_session_id");
    localStorage.removeItem("chat_messages");
    setSessionId("");
    setMessages([]);
    setStage("collecting");
    setFilters(null);
    setInput("");
    setErr("");
  }

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="font-semibold">餐廳推薦小助手</div>

        <div className="flex gap-2">
        <button
          onClick={start}
          disabled={loading}
          className="
            px-4 py-1.5 rounded-full text-sm
            bg-[#F2E4CC] text-gray-800
            border border-[#E6D5B8]
            hover:bg-[#EAD9BC]
            active:bg-[#E0CBAA]
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          開始
        </button>
          <button
            onClick={reset}
            className="px-3 py-1 rounded-full border border-gray-300 text-sm hover:bg-gray-50"
          >
            清除
          </button>
        </div>
      </div>

    <div className="px-4 py-3">
      {!user ? (
        <div className="text-sm text-red-600">
          需要先登入才能使用餐廳推薦小助手
        </div>
      ) : sessionId ? (
        <div className="text-sm text-gray-600">
          💬 聊天進行中
        </div>
      ) : (
        <div className="text-sm text-gray-600">
          點擊「開始」來啟動聊天
        </div>
      )}
    </div>


      <div ref={chatBoxRef} className="h-72 overflow-auto px-4 pb-3">
        {messages.length === 0 ? (
          <div className="text-sm text-gray-500">
            想不到吃什麼嗎？按「開始」後我會問你幾個問題，收集完成後會推薦適合你的餐廳喔！
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pb-3">
        {err ? (
          <div className="text-sm text-red-600 break-words mb-2">{err}</div>
        ) : null}

        {stage === "recommend" && filters ? (
          <div className="text-sm text-gray-700 mb-2">
            已整理條件：
            <span className="ml-2 text-gray-900">
              {filters.area ? `地區： ${filters.area} ` : ""}
              {filters.cuisine ? `類型： ${filters.cuisine} ` : ""}
              {filters.budget ? `預算： ${filters.budget} ` : ""}
              {filters.people ? `人數： ${filters.people} ` : ""}
              {filters.occasion ? `場合： ${filters.occasion}` : ""}
            </span>
          </div>
        ) : null}

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="輸入回覆"
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <button
            onClick={send}
            disabled={loading}
            className="px-4 py-2 rounded-full bg-gray-900 text-white text-sm hover:opacity-90 disabled:opacity-50"
          >
            送出
          </button>
        </div>
      </div>

      {stage === "recommend" ? (
        <div className="border-t border-gray-100 px-4 py-4 bg-gray-50">
          {/* 區塊 1：符合條件的餐廳（只放嚴格符合） */}
          <div className="font-semibold mb-3">符合條件的餐廳</div>

          {matched.length === 0 ? (
            <div className="text-sm text-gray-600 mb-4">
              沒有符合條件的餐廳
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {matched.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onPickRestaurant?.(r)}
                  className="text-left rounded-xl bg-white border border-gray-200 p-3 hover:shadow-sm"
                >
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {r.location} · {r.cuisine} · ⭐ {r.rating}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 區塊 2：其他推薦（同類型）— matched=0 時一定顯示 */}
          {matched.length === 0 ? (
            <>
              <div className="font-semibold mb-3">其他推薦</div>

              {others.length === 0 ? (
                <div className="text-sm text-gray-600">
                  找不到同類型的其他推薦
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {others.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onPickRestaurant?.(r)}
                      className="text-left rounded-xl bg-white border border-gray-200 p-3 hover:shadow-sm"
                    >
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {r.location} · {r.cuisine} · ⭐ {r.rating}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
