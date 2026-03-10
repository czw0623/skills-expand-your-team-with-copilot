// Git 分支動畫背景 - 在頁面背景繪製緩慢移動的 Git 風格分支線條
(function initGitBackground() {
  const canvas = document.getElementById('git-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height;

  // 調整畫布大小以符合視窗
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // 動畫常數
  const SPEED = 0.4;              // 滾動速度（像素/幀）
  const COMMIT_R = 4;             // 提交節點半徑（像素）
  const LANE_GAP = 55;            // 分支間的垂直間距（像素）
  const BASE_COMMIT_SPACING = 70; // 提交節點的基礎間距（像素）
  const SPACING_VARIATION = 45;   // 各分支間距的最大變化量（像素）
  const SPACING_MULTIPLIER = 17;  // 用於產生各分支不同間距的乘數
  const PHASE_MULTIPLIER = 43;    // 用於產生各分支不同初始相位的乘數
  const PHASE_RANGE = 100;        // 初始相位的範圍（像素）
  const CONN_PERIOD = 350;        // 連接點在水平方向的重複週期（像素）

  // 萊姆綠色調調色板（與學校代表色搭配）
  const COLORS = [
    [77, 153, 0],
    [109, 187, 0],
    [45, 110, 0],
    [140, 200, 50],
    [60, 150, 0],
    [90, 170, 0],
    [55, 130, 0],
  ];

  // 將 RGB 陣列與透明度轉換為 CSS 顏色字串
  function rgba(color, alpha) {
    return `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
  }

  // 根據目前視窗高度建立分支配置
  function buildLanes() {
    const count = Math.max(3, Math.floor((height - 80) / LANE_GAP));
    return Array.from({ length: count }, function (_, i) {
      return {
        color: COLORS[i % COLORS.length],
        // 各分支的提交間距略有不同，產生自然感
        commitSpacing: BASE_COMMIT_SPACING + (i * SPACING_MULTIPLIER) % SPACING_VARIATION,
        // 各分支的起始相位偏移，避免所有節點對齊
        phaseOffset: (i * PHASE_MULTIPLIER) % PHASE_RANGE,
      };
    });
  }

  // 建立分支之間的連接點（分叉與合併）
  function buildConnections(lanes) {
    const connections = [];
    // 在相鄰分支之間建立連接，每個週期有 2 個連接點
    for (let i = 0; i < lanes.length - 1; i++) {
      connections.push({ fromLane: i, toLane: i + 1, xInPeriod: CONN_PERIOD * 0.25 + i * 30 });
      connections.push({ fromLane: i + 1, toLane: i, xInPeriod: CONN_PERIOD * 0.70 + i * 25 });
    }
    return connections;
  }

  let lanes = buildLanes();
  let connections = buildConnections(lanes);
  let scroll = 0;

  // 視窗調整時重建分支配置
  window.addEventListener('resize', function () {
    lanes = buildLanes();
    connections = buildConnections(lanes);
  });

  function draw() {
    ctx.clearRect(0, 0, width, height);
    scroll += SPEED;

    const startY = 35; // 第一條分支的起始 Y 座標（像素）

    // 繪製連接線（分叉與合併的斜線）
    for (const conn of connections) {
      if (conn.fromLane >= lanes.length || conn.toLane >= lanes.length) continue;
      const fromLane = lanes[conn.fromLane];
      const y1 = startY + conn.fromLane * LANE_GAP;
      const y2 = startY + conn.toLane * LANE_GAP;
      if (y1 > height + COMMIT_R || y2 > height + COMMIT_R) continue;

      // 重複繪製連接線，產生無限滾動效果
      const baseX = conn.xInPeriod - (scroll % CONN_PERIOD);
      for (let rep = -1; rep <= Math.ceil(width / CONN_PERIOD) + 1; rep++) {
        const cx = baseX + rep * CONN_PERIOD;
        if (cx < -40 || cx > width + 40) continue;

        ctx.strokeStyle = rgba(fromLane.color, 0.28);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 22, y1);
        ctx.lineTo(cx + 22, y2);
        ctx.stroke();

        // 在連接點繪製提交節點
        ctx.fillStyle = rgba(fromLane.color, 0.45);
        ctx.beginPath();
        ctx.arc(cx - 22, y1, COMMIT_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 22, y2, COMMIT_R, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 繪製各分支的水平線與提交節點
    for (let li = 0; li < lanes.length; li++) {
      const lane = lanes[li];
      const y = startY + li * LANE_GAP;
      if (y > height + COMMIT_R) break;

      // 水平分支線
      ctx.strokeStyle = rgba(lane.color, 0.18);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // 提交節點（小圓點），隨時間向左滾動
      const spacing = lane.commitSpacing;
      const phase = (scroll + lane.phaseOffset) % spacing;
      for (let cx = -phase; cx <= width + COMMIT_R; cx += spacing) {
        ctx.fillStyle = rgba(lane.color, 0.48);
        ctx.beginPath();
        ctx.arc(cx, y, COMMIT_R, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
})();

