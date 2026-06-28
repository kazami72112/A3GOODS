// =======================
// Google Sheet JSON
// =======================
const url = "https://opensheet.elk.sh/15jS8UB4upC_BCItFGRnozbDJepu_3NDi6L-E6df7KqM/1";

let allItems = [];

let currentSeries = "all";
let currentType = "all";
let currentSubtype = "all";
let currentFilters = [];
let currentKeyword = "";

// ===== 載入資料 =====
fetch(url)
  .then(res => res.json())
  .then(data => {
    allItems = data;

    // ⭐ 還原狀態
    loadState();

    populateSeries();
    generateTypeButtons();

    closeAllSubmenus();
    displayItems();

    // ⭐ 還原下拉選單 & 搜尋框
    document.getElementById("seriesSelect").value = currentSeries;
    document.getElementById("tagSearch").value = currentKeyword;

    // ⭐ 還原滾動位置
    setTimeout(() => {
      window.scrollTo(0, localStorage.getItem("scrollY") || 0);
    }, 100);
  });

// =======================
// 儲存狀態
// =======================
function saveState() {
  localStorage.setItem("series", currentSeries || "all");
  localStorage.setItem("type", currentType || "all");
  localStorage.setItem("subtype", currentSubtype || "all");

  localStorage.setItem(
    "filters",
    JSON.stringify(Array.isArray(currentFilters) ? currentFilters : [])
  );

  localStorage.setItem("keyword", currentKeyword || "");
  localStorage.setItem("scrollY", window.scrollY || 0);
}

// =======================
// 還原狀態
// =======================
function loadState() {
  currentSeries = localStorage.getItem("series") || "all";
  currentType = localStorage.getItem("type") || "all";
  currentSubtype = localStorage.getItem("subtype") || "all";

  try {
    const f = JSON.parse(localStorage.getItem("filters"));
    currentFilters = Array.isArray(f) ? f : [];
  } catch {
    currentFilters = [];
  }

  currentKeyword = localStorage.getItem("keyword") || "";
}

// =======================
// 商品顯示
// =======================
function displayItems() {
  const container = document.getElementById("item-list");
  container.innerHTML = "";

  const filtered = allItems.filter(item => {
    const types = (item.type || "")
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    const filters = (item.filter || "")
      .split(",")
      .map(f => f.trim())
      .filter(Boolean);

    const subtype = item.subtype || "";

    const passFilters =
      !currentFilters.length ||
      currentFilters.every(f => filters.includes(f));

    const keywordMatch =
      !currentKeyword ||
      (item.name || "")
        .toLowerCase()
        .includes(currentKeyword.toLowerCase());

    return (
      (currentSeries === "all" || item.series === currentSeries) &&
      (currentType === "all" || types.includes(currentType)) &&
      (currentSubtype === "all" || subtype.includes(currentSubtype)) &&
      passFilters &&
      keywordMatch
    );
  });

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${item.image || "https://via.placeholder.com/150"}">
      <p>${item.name || "未命名"}</p>
    `;

    card.onclick = () => showDetail(item);
    container.appendChild(card);
  });
}

// =======================
// 系列
// =======================
function populateSeries() {
  const select = document.getElementById("seriesSelect");
  select.innerHTML = `<option value="all">全部</option>`;

  const set = new Set(allItems.map(i => i.series).filter(Boolean));

  set.forEach(s => {
    const op = document.createElement("option");
    op.value = s;
    op.innerText = s;
    select.appendChild(op);
  });

  select.value = currentSeries;
}

function filterSeries(s) {
  currentSeries = s || "all";
  saveState();
  displayItems();
}

// =======================
// 種類按鈕
// =======================
function generateTypeButtons() {
  const container = document.getElementById("typeButtons");
  container.innerHTML = `<span class="filter-title">種類：</span>`;

  const map = {};
  const orderMap = {
    "徽章": ["小徽章", "大徽章", "其他"],
    "吊飾": ["短吊飾", "長吊飾"]
  };

  allItems.forEach(i => {
    if (!i.type) return;

    const types = (i.type || "")
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    const subtype = (i.subtype || "").trim();

    types.forEach(type => {
      if (!map[type]) map[type] = new Set();
      if (subtype) map[type].add(subtype);
    });
  });

  // 全部
  const allBtn = document.createElement("button");
  allBtn.innerText = "全部";

  allBtn.onclick = () => {
    currentType = "all";
    currentSubtype = "all";
    saveState();
    displayItems();
    closeAllSubmenus();
  };

  container.appendChild(allBtn);

  Object.keys(map).sort().forEach(type => {
    const group = document.createElement("div");
    group.className = "type-group";

    const btn = document.createElement("button");
    btn.innerText = type;

    const submenu = document.createElement("div");
    submenu.className = "submenu";

    btn.onclick = (e) => {
      e.stopPropagation();

      currentType = type;
      currentSubtype = "all";

      saveState();
      displayItems();

      closeAllSubmenus();
      submenu.style.display =
        submenu.style.display === "block" ? "none" : "block";
    };

    const existing = Array.from(map[type]);

    let orderedSubtypes = orderMap[type]
      ? [
          ...orderMap[type].filter(s => existing.includes(s)),
          ...existing.filter(s => !orderMap[type].includes(s))
        ]
      : existing.sort();

    orderedSubtypes.forEach(sub => {
      const subBtn = document.createElement("button");
      subBtn.innerText = sub;

      subBtn.onclick = (e) => {
        e.stopPropagation();

        currentType = type;
        currentSubtype = sub;

        saveState();
        displayItems();
        closeAllSubmenus();
      };

      submenu.appendChild(subBtn);
    });

    group.appendChild(btn);
    group.appendChild(submenu);
    container.appendChild(group);
  });
}

// =======================
// 關閉 submenu
// =======================
function closeAllSubmenus() {
  document.querySelectorAll(".submenu").forEach(m => {
    m.style.display = "none";
  });
}

document.addEventListener("click", closeAllSubmenus);

// =======================
// 搜尋（名稱搜尋）
// =======================
function searchTagKeyword(k) {
  currentKeyword = (k || "").trim();
  saveState();
  displayItems();
}

// =======================
// scroll
// =======================
window.addEventListener("scroll", () => {
  localStorage.setItem("scrollY", window.scrollY);
});

// =======================
// Modal
// =======================
function showDetail(item) {
  const detail = document.getElementById("detail");
  const overlay = document.getElementById("detailOverlay");

  detail.innerHTML = `
    <span class="close-btn" onclick="closeDetail()">❌</span>
    <h2>${item.name}</h2>
    <img src="${item.image || ""}" onclick="showLightbox('${item.image}')">
    <p>系列：${item.series || ""}</p>
    <p>種類：${item.type || ""}</p>
    <p>子分類：${item.subtype || ""}</p>
    <p>標籤：${item.tags || ""}</p>
    <a href="${item.link || "#"}" target="_blank">原網址</a>
  `;

  detail.style.display = "block";
  overlay.style.display = "block";
}

function closeDetail() {
  document.getElementById("detail").style.display = "none";
  document.getElementById("detailOverlay").style.display = "none";
}

// =======================
// intro
// =======================
function showIntro() {
  const detail = document.getElementById("detail");
  const overlay = document.getElementById("detailOverlay");

  detail.innerHTML = `
    <span class="close-btn" onclick="closeDetail()">❌</span>
    <h2>一些免責聲明(?)</h2>
    <p>
      單人施工，進度極慢，純方便查找用。<br>
    部分周邊缺少新人組，請見諒。<br>
    會以全員皆有的周邊為主，其餘非全員系列有空才會補。<br><br>

    網址跳轉不到代表網路上查無圖源。<br>
    部分網站圖片無法鑲嵌所以會沒有附圖。<br>
    網站目前以方便為主，有空才會進行美化。<br>
    </p>
  `;

  detail.style.display = "block";
  overlay.style.display = "block";
}

// =======================
// lightbox
// =======================
function showLightbox(src) {
  document.getElementById("lightboxImage").src = src;
  document.getElementById("lightboxOverlay").style.display = "flex";
}

function closeLightbox() {
  document.getElementById("lightboxOverlay").style.display = "none";
}