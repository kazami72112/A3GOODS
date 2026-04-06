// Google Sheet JSON
const url = "https://opensheet.elk.sh/15jS8UB4upC_BCItFGRnozbDJepu_3NDi6L-E6df7KqM/1";

let allItems = [];
let currentSeries = "all";
let currentType = "all";
let currentSubtype = "all";
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

// ===== 儲存狀態 =====
function saveState() {
  localStorage.setItem("series", currentSeries);
  localStorage.setItem("type", currentType);
  localStorage.setItem("subtype", currentSubtype);
  localStorage.setItem("keyword", currentKeyword);
  localStorage.setItem("scrollY", window.scrollY);
}

// ===== 還原狀態 =====
function loadState() {
  currentSeries = localStorage.getItem("series") || "all";
  currentType = localStorage.getItem("type") || "all";
  currentSubtype = localStorage.getItem("subtype") || "all";
  currentKeyword = localStorage.getItem("keyword") || "";
}

// ===== 顯示商品 =====
function displayItems() {
  const container = document.getElementById("item-list");
  container.innerHTML = "";

  const filtered = allItems.filter(item => {
    return (
      (currentSeries === "all" || item.series === currentSeries) &&
      (currentType === "all" || item.type === currentType) &&
      (currentSubtype === "all" || item.subtype === currentSubtype) &&
      (currentKeyword === "" || (item.tags && item.tags.toLowerCase().includes(currentKeyword.toLowerCase())))
    );
  });

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${item.image || 'https://via.placeholder.com/150'}">
      <p>${item.name || '未命名'}</p>
    `;

    card.onclick = () => showDetail(item);
    container.appendChild(card);
  });
}

// ===== 系列 =====
function populateSeries() {
  const set = new Set(allItems.map(i => i.series).filter(Boolean));
  const select = document.getElementById("seriesSelect");

  set.forEach(s => {
    const op = document.createElement("option");
    op.value = s;
    op.innerText = s;
    select.appendChild(op);
  });
}

function filterSeries(s) {
  currentSeries = s;
  saveState(); // ⭐ 新增
  displayItems();
}

// ===== 種類按鈕 =====
function generateTypeButtons() {
  const container = document.getElementById("typeButtons");
  container.innerHTML = "";

  const map = {};
  const orderMap = {};

  allItems.forEach(i => {
    if (!i.type) return;
    if (!map[i.type]) map[i.type] = new Set();
    if (i.subtype) map[i.type].add(i.subtype);
  });

  // 資料驗證順序
  orderMap["徽章"] = ["小徽章","大徽章","其他"];
  orderMap["吊飾"] = ["短吊飾","長吊飾"];

  // 全部按鈕
  const allBtn = document.createElement("button");
  allBtn.innerText = "全部";
  allBtn.onclick = () => {
    currentType = "all";
    currentSubtype = "all";
    saveState(); // ⭐ 新增
    displayItems();
    closeAllSubmenus();
  };
  container.appendChild(allBtn);

  // 主分類
  Object.keys(map).forEach(type => {
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
      saveState(); // ⭐ 新增
      displayItems();
      closeAllSubmenus();
      submenu.style.display =
        submenu.style.display === "block" ? "none" : "block";
    };

    let orderedSubtypes;

    if (orderMap[type]) {
      const existing = Array.from(map[type]);
      const ordered = orderMap[type].filter(sub => existing.includes(sub));
      const rest = existing.filter(sub => !orderMap[type].includes(sub));
      orderedSubtypes = [...ordered, ...rest];
    } else {
      orderedSubtypes = Array.from(map[type]);
    }

    orderedSubtypes.forEach(sub => {
      const subBtn = document.createElement("button");
      subBtn.innerText = sub;

      subBtn.onclick = (e) => {
        e.stopPropagation();
        currentSubtype = sub;
        currentType = type;
        saveState(); // ⭐ 新增
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

// ===== 關閉子選單 =====
function closeAllSubmenus() {
  document.querySelectorAll(".submenu").forEach(m => {
    m.style.display = "none";
  });
}

document.addEventListener("click", () => {
  closeAllSubmenus();
});

// ===== 標籤搜尋 =====
function searchTagKeyword(k) {
  currentKeyword = k.trim();
  saveState(); // ⭐ 新增
  displayItems();
}

// ===== 滾動記錄 =====
window.addEventListener("scroll", () => {
  localStorage.setItem("scrollY", window.scrollY);
});

// ===== 商品 Modal =====
function showDetail(item) {
  const detail = document.getElementById("detail");
  const overlay = document.getElementById("detailOverlay");

  detail.innerHTML = `
    <span class="close-btn" onclick="closeDetail()">❌</span>
    <h2>${item.name}</h2>
    <img src="${item.image || ''}" onclick="showLightbox('${item.image}')">
    <p>系列：${item.series || ''}</p>
    <p>種類：${item.type || ''}</p>
    <p>子分類：${item.subtype || ''}</p>
    <p>標籤：${item.tags || ''}</p>
    <a href="${item.link || '#'}" target="_blank">原網址</a>
  `;

  detail.style.display = "block";
  overlay.style.display = "block";
}

function closeDetail() {
  document.getElementById("detail").style.display = "none";
  document.getElementById("detailOverlay").style.display = "none";
}

// 前言
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
      網站目前以方便為主，有空才會進行美化。
    </p>
  `;

  detail.style.display = "block";
  overlay.style.display = "block";
}

// Lightbox
function showLightbox(src) {
  document.getElementById("lightboxImage").src = src;
  document.getElementById("lightboxOverlay").style.display = "flex";
}

function closeLightbox() {
  document.getElementById("lightboxOverlay").style.display = "none";
}