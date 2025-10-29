# Resrv
React + Tailwind 練習餐廳預訂網站

## 📋 專案簡介
一個功能完整的餐廳預訂系統，包含餐廳搜尋、收藏、評論、訂位管理等功能。

## 🚀 如何開始

### 1. 克隆專案
```bash
git clone https://github.com/yoweiii/Resrv.git
cd Resrv/Resrv
```

### 2. 安裝依賴
```bash
npm install
```

### 3. 啟動開發伺服器
```bash
npm run dev
```

瀏覽器會自動打開 `http://localhost:5173`，你就可以看到網站了！

## 📁 專案結構
```
Resrv/
├── src/
│   ├── components/      # 可重用組件
│   │   ├── Navbar.jsx          # 導航欄
│   │   ├── RestaurantCard.jsx  # 餐廳卡片
│   │   ├── SearchBar.jsx       # 搜尋欄
│   │   ├── TimeSlots.jsx       # 時間選擇器
│   │   └── ...
│   ├── pages/           # 頁面組件
│   │   ├── HomePage.jsx        # 首頁
│   │   ├── RestaurantDetail.jsx # 餐廳詳細頁
│   │   └── MyBookings.jsx      # 我的訂位頁
│   ├── context/         # Context API
│   │   └── AppState.jsx        # 全局狀態管理
│   ├── data/           # 數據文件
│   │   └── restaurants.js      # 餐廳資料
│   └── utils/          # 工具函數
│       └── base64Images.js     # 圖片資源
├── package.json        # 項目配置
└── README.md          # 說明文件
```

## ✨ 主要功能
- 🏠 **首頁**: 顯示收藏的餐廳和所有餐廳列表
- 🔍 **搜尋**: 即時搜尋餐廳名稱
- ❤️ **收藏**: 收藏喜歡的餐廳
- ⭐ **評論**: 為餐廳評分和留下評論
- 📅 **訂位**: 選擇日期、時間和人數進行訂位
- 📝 **訂位管理**: 查看、編輯和取消訂位

## 🛠️ 技術棧
- **React 18** - UI框架
- **React Router** - 路由管理
- **Tailwind CSS** - 樣式框架
- **Vite** - 建構工具

## 📝 修改說明
如果你想修改這個專案：
1. Fork 或 Clone 這個倉庫
2. 創建一個新分支：`git checkout -b your-feature-branch`
3. 進行修改後提交：`git commit -m "描述你的修改"`
4. 推送到 GitHub：`git push origin your-feature-branch`
5. 發起 Pull Request

## 📄 License
MIT License

## 👥 貢獻者
歡迎提交 Issue 或 Pull Request！