# 🌠 Gacha Hub

A completely private, client-side web application for tracking and visualizing gacha pull history for **Honkai: Star Rail** and **Arknights: Endfield**.

---

## ✨ Features

* **🛡️ 100% Client-Side & Private:** Built entirely with vanilla HTML, modern CSS, and JavaScript. Zero external servers, zero backend databases, zero telemetry, and zero tracking pixels. Your JSON data is parsed in memory and saved strictly in your browser's private `localStorage`.
* **🌌 Cosmic Astral Express Aesthetic:** Refined dark-space glassmorphic UI with glowing accents, dynamic progress bars, and soft-pity tick markers.
* **📂 Strict Two-Level Organization (Zero Pity Mixing):**
  * **Level 1 (Accounts):** Switch between player UIDs with dedicated account tabs. Accounts never bleed into each other.
  * **Level 2 (Banner Sub-Tabs):** Each account is sub-sectioned into isolated views for **Character Event**, **Light Cone Event**, **Stellar Warp (Standard)**, and **Departure Warp**.
  * **Zero Cross-Banner Pity Mixing:** Current pity, average pity, 50/50 win rates, and streaks are strictly computed from that specific banner pool only.
  * **📊 All-Accounts Summary Tab:** Sits at the back of the accounts row alongside Backup and Clear buttons. Provides the exact same banner sub-tab dashboard (Character Event, Light Cone, Standard, Departure) combining all accounts into one view.
* **📈 Native SVG Visual Analytics Suite (100% Offline & Lightweight):**
  * **Two-Sided Pity Bracket Distribution:** Mirrored bar chart showing **Featured Wins** on the top side (green) and **50/50 Losses** on the underside (red) across pity brackets:
    * *86+ (Hard Pity)*
    * *74-85 (Soft Pity)*
    * *41-73 (Early)*
    * *11-40 (Lucky)*
    * *1-10 (Top 1%)*
  * **50/50 & 75/25 Donut Charts:** Clean visual breakdown of event wins vs standard loss pool drops.
  * **Monthly Pull Volume:** Tracks warp frequency across months.
* **🔍 Deep Filter & Sort Toolbar:**
  * Filter pills for Rarity: `All`, `5★`, `4★`.
  * Filter pills for Outcome: `All`, `Wins Only`, `Losses Only`.
  * Instant search by character or Light Cone name.
  * Sort dropdown: `Newest Date`, `Oldest Date`, `Highest Pity`, `Lowest Pity`.
* **🤖 AI-Ready Data Guide & Prompt:** Includes a dedicated **Tutorial & AI Guide** tab with a ready-to-use prompt template for ChatGPT, Claude, Gemini, or DeepSeek to convert raw warp logs or screenshot text into valid JSON.
* **📋 Direct JSON Paste & Demo Mode:**
  * **1-Click Demo:** Instantly load realistic sample HSR warp data to preview all dashboard features and charts.
  * **Direct Paste Importer:** Paste JSON directly from your clipboard without having to save a file to disk.
* **💾 Multi-Account Support & Export:** Manage multiple player UIDs, export individual account files (`hsr_UID.json`), or download a full multi-account backup.

---

## 🚀 Getting Started

### 1. View the Webpage
Simply open `index.html` directly in any web browser, or host it on **GitHub Pages**. No Node.js build step or web server required!

### 2. Adding Your Warp Data
You can load your history in any of three convenient ways:
* **Drag & Drop:** Drop your `hsr_UID.json`, `endfield_characters.json`, or `endfield_weapons.json` directly onto the drop zone.
* **Direct Paste:** Click **"📋 Paste JSON Directly"** and paste your JSON array.
* **Demo Mode:** Click **"✨ Load Sample Demo Data"** to immediately preview the dashboard with sample pulls.

---

## 📋 Data Schema

### Honkai: Star Rail (`hsr_UID.json`)
```json
[
  {
    "gacha_type": "11",
    "id": "1711530000000000001",
    "name": "Acheron",
    "item_type": "Character",
    "rank_type": "5",
    "time": "2024-03-27 12:30:00",
    "uid": "800123456"
  }
]
```

#### Banner Pool Codes (`gacha_type`):
* `11`: Character Event Warp
* `12`: Light Cone Event Warp
* `1`: Stellar Warp (Standard Permanent)
* `2`: Departure Warp (Beginner 50-pull discount)
* `21`: Collab Character Warp
* `22`: Collab Light Cone Warp

---

## 🔒 Privacy & Transparent Local Data Extraction

### Why Gacha Hub is 100% Secure
* **Zero Network Requests:** Open your browser's Developer Tools (F12) -> **Network** tab. You will see **zero** outgoing requests when uploading or viewing your data.
* **No Account Credentials:** Gacha Hub never asks for your email, Hoyoverse password, or third-party login.

### How Official Hoyoverse Warp Extraction Works
When you open the Warp Records page in Honkai: Star Rail on PC, the game client caches a temporary URL with an `authkey` in:
```
%USERPROFILE%\AppData\LocalLow\Cognosphere\StarRail\webCaches\<version>\Cache\Cache_Data\data_2
```
* The `authkey` is a **temporary, read-only session query token** created solely to view gacha records.
* It **cannot** be used to log in, alter your password, delete items, or spend Stellar Jades.
* It automatically **expires within 24 hours**.

A local Python or PowerShell script can read this local cache file and query Hoyoverse's official API (`https://api-os-takumi.mihoyo.com/...`) directly from your machine to generate your local `hsr_UID.json` file with complete transparency and zero third-party intermediaries. Check the **Tutorial & AI Guide** tab in Gacha Hub for full code blueprints!
