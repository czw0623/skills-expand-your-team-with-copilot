// Git 分支線條背景動畫
// 在頁面背景顯示緩慢向上捲動的 Git 風格分支圖形

function initGitAnimation() {
  const canvas = document.getElementById("git-animation");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // 虛擬高度：設為 3600 像素，確保在大部分螢幕解析度下都有足夠的循環空間（約 2-3 個螢幕高度）
  const VIRTUAL_H = 3600;
  // 提交點之間的垂直間距：80 像素可提供清晰的視覺區隔，不會過於密集或稀疏
  const COMMIT_SPACING = 80;
  // 捲動速度：每幀 0.5 像素（約 30fps 下為 15px/秒），緩慢不干擾閱讀
  const SPEED = 0.5;
  // 分支線條數量
  const N_LANES = 5;

  // 石灰綠色系配色 [R, G, B, Alpha]
  const LANE_COLORS = [
    [76, 175, 80, 0.35],
    [139, 195, 74, 0.3],
    [56, 142, 60, 0.3],
    [129, 199, 132, 0.25],
    [104, 159, 56, 0.3],
  ];

  // 將顏色陣列轉換為 rgba 字串
  function rgba(c, alphaOverride) {
    const a = alphaOverride !== undefined ? alphaOverride : c[3];
    return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
  }

  let W, H;

  // 設定畫布尺寸為視窗大小
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", resize);
  resize();

  // 計算每條分支線的 X 座標（均勻分布）
  function laneX(i) {
    return ((i + 1) * W) / (N_LANES + 1);
  }

  // 各種圖形元素的儲存陣列
  const lines = [];   // 垂直連接線
  const dots = [];    // 提交點
  const curves = [];  // 分支/合併曲線

  // 建立整個 Git 圖形結構
  function buildGraph() {
    lines.length = 0;
    dots.length = 0;
    curves.length = 0;

    // 為每條分支建立垂直線段和提交點
    for (let y = 0; y < VIRTUAL_H; y += COMMIT_SPACING) {
      for (let lane = 0; lane < N_LANES; lane++) {
        const color = LANE_COLORS[lane];
        // 垂直線段（從 y 到 y + COMMIT_SPACING）
        lines.push({ lane, y1: y, y2: y + COMMIT_SPACING, color });
        // 提交點
        dots.push({ lane, y, color });
      }
    }

    // 預定義的分支/合併連接點（fromLane 到 toLane，在 y 處）
    const branchPoints = [
      { fromLane: 0, toLane: 1, y: 160 },
      { fromLane: 2, toLane: 1, y: 320 },
      { fromLane: 4, toLane: 3, y: 400 },
      { fromLane: 1, toLane: 2, y: 560 },
      { fromLane: 3, toLane: 2, y: 640 },
      { fromLane: 0, toLane: 1, y: 800 },
      { fromLane: 4, toLane: 3, y: 880 },
      { fromLane: 2, toLane: 3, y: 960 },
      { fromLane: 1, toLane: 0, y: 1120 },
      { fromLane: 3, toLane: 4, y: 1200 },
      { fromLane: 0, toLane: 1, y: 1360 },
      { fromLane: 2, toLane: 1, y: 1440 },
      { fromLane: 4, toLane: 3, y: 1520 },
      { fromLane: 1, toLane: 2, y: 1680 },
      { fromLane: 3, toLane: 2, y: 1760 },
      { fromLane: 0, toLane: 1, y: 1920 },
      { fromLane: 4, toLane: 3, y: 2000 },
      { fromLane: 2, toLane: 1, y: 2160 },
      { fromLane: 1, toLane: 0, y: 2320 },
      { fromLane: 3, toLane: 4, y: 2400 },
      { fromLane: 0, toLane: 1, y: 2560 },
      { fromLane: 2, toLane: 3, y: 2640 },
      { fromLane: 4, toLane: 3, y: 2720 },
      { fromLane: 1, toLane: 2, y: 2880 },
      { fromLane: 3, toLane: 2, y: 2960 },
      { fromLane: 0, toLane: 1, y: 3120 },
      { fromLane: 4, toLane: 3, y: 3200 },
      { fromLane: 2, toLane: 1, y: 3360 },
    ];

    // 將每個分支連接點轉換為貝茲曲線資料
    for (const bp of branchPoints) {
      curves.push({
        fromLane: bp.fromLane,
        toLane: bp.toLane,
        y1: bp.y,
        y2: bp.y - COMMIT_SPACING,
        color: LANE_COLORS[bp.fromLane],
      });
    }
  }

  buildGraph();
  // 視窗大小改變時重建圖形
  window.addEventListener("resize", buildGraph);

  let scrollY = 0;

  // 對每個虛擬複本（上/中/下）呼叫回調函式，處理循環捲動
  function forEachCopy(virtualY, dy, callback) {
    for (let copy = -1; copy <= 1; copy++) {
      const sy1 = virtualY - scrollY + copy * VIRTUAL_H;
      const sy2 = sy1 + dy;
      callback(sy1, sy2);
    }
  }

  // 動畫主循環
  function animate() {
    ctx.clearRect(0, 0, W, H);

    // 更新捲動偏移（循環）
    scrollY = (scrollY + SPEED) % VIRTUAL_H;

    ctx.lineWidth = 2;

    // 繪製垂直連接線
    for (const line of lines) {
      const x = laneX(line.lane);
      const dy = line.y2 - line.y1;
      forEachCopy(line.y1, dy, (sy1, sy2) => {
        if (sy1 > H + 5 || sy2 < -5) return;
        ctx.strokeStyle = rgba(line.color);
        ctx.beginPath();
        ctx.moveTo(x, sy1);
        ctx.lineTo(x, sy2);
        ctx.stroke();
      });
    }

    // 繪製分支/合併貝茲曲線
    for (const curve of curves) {
      const x1 = laneX(curve.fromLane);
      const x2 = laneX(curve.toLane);
      const dy = curve.y2 - curve.y1;
      forEachCopy(curve.y1, dy, (sy1, sy2) => {
        if (Math.min(sy1, sy2) > H + 5 || Math.max(sy1, sy2) < -5) return;
        ctx.strokeStyle = rgba(curve.color);
        ctx.beginPath();
        ctx.moveTo(x1, sy1);
        // 使用貝茲曲線讓分支連線看起來自然
        ctx.bezierCurveTo(
          x1, (sy1 + sy2) / 2,
          x2, (sy1 + sy2) / 2,
          x2, sy2
        );
        ctx.stroke();
      });
    }

    // 繪製提交點（小圓點）
    for (const dot of dots) {
      const x = laneX(dot.lane);
      forEachCopy(dot.y, 0, (sy) => {
        if (sy < -10 || sy > H + 10) return;
        // 提交點顏色稍微深一些，更明顯
        ctx.fillStyle = rgba(dot.color, Math.min(1, dot.color[3] + 0.35));
        ctx.beginPath();
        ctx.arc(x, sy, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    requestAnimationFrame(animate);
  }

  animate();
}

// DOM 載入完成後啟動動畫
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGitAnimation);
} else {
  initGitAnimation();
}
