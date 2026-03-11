(function () {
  "use strict";

  const STATUS = {
    OPEN: 0,  // 未対応
    WIP: 1,   // 作業済み
    DONE: 2,  // 確認済み
  };

  function getTaskData() {
    const appEl = document.getElementById("app");
    if (!appEl || !appEl.dataset.page) return null;

    try {
      const pageData = JSON.parse(appEl.dataset.page);
      const visinst = pageData?.props?.visinst;
      if (!visinst || !visinst.visinst_pages) return null;

      const comments = visinst.visinst_pages.flatMap(
        (p) => p.visinst_comments || []
      );

      const total = comments.length;
      const open = comments.filter((c) => c.status === STATUS.OPEN).length;
      const wip = comments.filter((c) => c.status === STATUS.WIP).length;
      const done = comments.filter((c) => c.status === STATUS.DONE).length;

      return { total, open, wip, done, title: visinst.title || "" };
    } catch (e) {
      console.error("[AUN Task Counter]", e);
      return null;
    }
  }

  function createOverlay(data) {
    const el = document.createElement("div");
    el.id = "aun-task-overlay";
    el.classList.add("collapsed");
    el.innerHTML = `
      <div id="aun-overlay-header">
        <span class="title">AUN Tasks</span>
        <button class="toggle-btn" title="展開">&#x25B2;</button>
      </div>
      <div id="aun-overlay-body">
        <div class="aun-stat-row">
          <span class="aun-stat-label">
            <span class="aun-stat-dot open"></span> 未対応
          </span>
          <span class="aun-stat-count" id="aun-count-open">0</span>
        </div>
        <div class="aun-stat-row">
          <span class="aun-stat-label">
            <span class="aun-stat-dot wip"></span> 作業済み
          </span>
          <span class="aun-stat-count" id="aun-count-wip">0</span>
        </div>
        <div class="aun-stat-row">
          <span class="aun-stat-label">
            <span class="aun-stat-dot done"></span> 確認済み
          </span>
          <span class="aun-stat-count" id="aun-count-done">0</span>
        </div>
        <div id="aun-overlay-progress">
          <div class="bar-done"></div>
          <div class="bar-wip"></div>
        </div>
        <div id="aun-overlay-total-row">
          <span id="aun-overlay-total"></span>
          <button id="aun-copy-btn" title="コピー">&#x1F4CB;</button>
        </div>
      </div>
    `;
    document.body.appendChild(el);

    // 折りたたみ
    const toggleBtn = el.querySelector(".toggle-btn");
    toggleBtn.addEventListener("click", () => {
      el.classList.toggle("collapsed");
      toggleBtn.innerHTML = el.classList.contains("collapsed")
        ? "&#x25B2;"
        : "&#x25BC;";
    });

    // コピーボタン
    el.querySelector("#aun-copy-btn").addEventListener("click", () => {
      const pct = el.querySelector("#aun-overlay-total").dataset.pct;
      navigator.clipboard.writeText(pct + "%").then(() => {
        const btn = el.querySelector("#aun-copy-btn");
        btn.textContent = "\u2705";
        setTimeout(() => { btn.innerHTML = "&#x1F4CB;"; }, 1000);
      });
    });

    // ドラッグ移動
    makeDraggable(el, el.querySelector("#aun-overlay-header"));

    return el;
  }

  function updateOverlay(el, data) {
    if (!data) return;

    el.querySelector("#aun-count-open").textContent = data.open;
    el.querySelector("#aun-count-wip").textContent = data.wip;
    el.querySelector("#aun-count-done").textContent = data.done;

    const total = data.total || 1;
    const donePct = (data.done / total) * 100;
    const wipPct = (data.wip / total) * 100;

    el.querySelector(".bar-done").style.width = donePct + "%";
    el.querySelector(".bar-wip").style.width = wipPct + "%";

    const pctText = Math.round(donePct);
    const totalEl = el.querySelector("#aun-overlay-total");
    totalEl.textContent =
      `全 ${data.total} 件中 ${data.done + data.wip} 件対応済み（${pctText}% 完了）`;
    totalEl.dataset.pct = pctText;
  }

  function makeDraggable(el, handle) {
    let offsetX, offsetY, dragging = false;

    handle.addEventListener("mousedown", (e) => {
      if (e.target.tagName === "BUTTON") return;
      dragging = true;
      offsetX = e.clientX - el.getBoundingClientRect().left;
      offsetY = e.clientY - el.getBoundingClientRect().top;
      el.style.transition = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      el.style.left = (e.clientX - offsetX) + "px";
      el.style.top = (e.clientY - offsetY) + "px";
      el.style.right = "auto";
      el.style.bottom = "auto";
    });

    document.addEventListener("mouseup", () => {
      dragging = false;
      el.style.transition = "";
    });
  }

  // --- 初期化 & 監視 ---

  function init() {
    const data = getTaskData();
    if (!data) return;

    let overlay = document.getElementById("aun-task-overlay");
    if (!overlay) {
      overlay = createOverlay(data);
    }
    updateOverlay(overlay, data);
  }

  // Inertia.jsはSPAなのでdata-page属性の変更を監視
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "attributes" && m.attributeName === "data-page") {
        init();
      }
    }
  });

  const appEl = document.getElementById("app");
  if (appEl) {
    observer.observe(appEl, { attributes: true });
  }

  // 初回実行
  init();
})();
