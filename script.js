// === CONFIGURATION DES DESSINS (même logique que ton ancien script) ===
const drawings = [
  { id: "cheval1", label: "Cheval garçon", src: "assets/cheval.png" },
  { id: "nadir1", label: "Nadir 222", src: "assets/nadir222.png" },
  { id: "nadir2", label: "Nadir 333", src: "assets/nadir333.png" },
  { id: "nadir3", label: "Nadir 444", src: "assets/nadir444.png" },
  { id: "nadir4", label: "Nadir 555", src: "assets/nadir555.png" },
  { id: "nadir5", label: "Nadir 666", src: "assets/nadir666.png" },
  { id: "nadir6", label: "Nadir 777", src: "assets/nadir777.png" },
  { id: "nadir7", label: "Nadir 888", src: "assets/nadir888.png" },
  { id: "nadir8", label: "Nadir 999", src: "assets/nadir999.png" },
  { id: "nadir9", label: "Nadir 1000", src: "assets/nadir1000.png" },
];

// === ELEMENTS DOM ===
const homeView        = document.getElementById("homeView");
const studioView      = document.getElementById("studioView");
const drawingList     = document.getElementById("drawingList");
const backHomeBtn     = document.getElementById("backHomeBtn");
const toggleDrawerBtn = document.getElementById("toggleDrawerBtn");
const toolDrawer      = document.getElementById("toolDrawer");
const drawerOverlay   = document.getElementById("drawerOverlay");

const canvas          = document.getElementById("colorCanvas");
const ctx             = canvas.getContext("2d");
const currentLabelEl  = document.getElementById("currentDrawingLabel");

const drawingSelect   = document.getElementById("drawingSelect");
const reloadBtn       = document.getElementById("reloadBtn");
const toolButtons     = document.getElementById("toolButtons");
const sizeRange       = document.getElementById("sizeRange");
const sizeLabel       = document.getElementById("sizeLabel");
const colorPalette    = document.getElementById("colorPalette");
const customColor     = document.getElementById("customColor");
const clearBtn        = document.getElementById("clearBtn");
const saveBtn         = document.getElementById("saveBtn");

// === ETAT DESSIN ===
let currentTool  = "pencil";
let currentColor = "#000000";
let painting     = false;
let backgroundImage = null;

const TOOLS = {
  pencil: { baseSizeMultiplier: 0.4, alpha: 0.9 },
  brush:  { baseSizeMultiplier: 1.0, alpha: 1.0 },
  marker: { baseSizeMultiplier: 1.4, alpha: 0.5 },
  bucket: {},
  eraser: {},
};

const PALETTE = [
  "#000000","#444444","#888888","#ffffff",
  "#ff0000","#ff7f00","#ffff00","#bfff00",
  "#00ff00","#00ffff","#0080ff","#0000ff",
  "#7f00ff","#ff00ff","#ff0080","#ffb6c1",
  "#8b4513","#ffd700","#90ee90","#add8e6"
];

// === VUE : ACCUEIL (LISTE DES DESSINS) ===
function renderDrawingList() {
  drawingList.innerHTML = "";
  drawings.forEach(d => {
    const card = document.createElement("div");
    card.className = "drawing-card";

    const thumb = document.createElement("div");
    thumb.className = "drawing-thumb";
    const img = document.createElement("img");
    img.src = d.src;
    img.alt = d.label;
    thumb.appendChild(img);

    const info = document.createElement("div");
    info.className = "drawing-info";
    const h3 = document.createElement("h3");
    h3.textContent = d.label;
    const p = document.createElement("p");
    p.textContent = "Appuie pour commencer à colorier.";
    info.appendChild(h3);
    info.appendChild(p);

    card.appendChild(thumb);
    card.appendChild(info);

    card.addEventListener("click", () => {
      openStudio(d.id);
    });

    drawingList.appendChild(card);
  });
}

function openStudio(drawingId) {
  homeView.classList.remove("active");
  studioView.classList.add("active");

  // mets à jour le select du volet
  drawingSelect.value = drawingId;
  const d = drawings.find(x => x.id === drawingId);
  currentLabelEl.textContent = d ? d.label : "Coloriage";

  loadDrawing(drawingId);
}

function backToHome() {
  studioView.classList.remove("active");
  homeView.classList.add("active");
}

// === VOLET OUTILS ===
function openDrawer() {
  toolDrawer.classList.add("open");
  drawerOverlay.classList.add("visible");
}

function closeDrawer() {
  toolDrawer.classList.remove("open");
  drawerOverlay.classList.remove("visible");
}

// === PALETTE COULEURS ===
function createColorButtons() {
  PALETTE.forEach((color, index) => {
    const btn = document.createElement("button");
    btn.className = "color-btn";
    btn.style.backgroundColor = color;
    if (index === 0) btn.classList.add("active");
    btn.addEventListener("click", () => {
      currentColor = color;
      document.querySelectorAll(".color-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
    colorPalette.appendChild(btn);
  });

  customColor.addEventListener("input", () => {
    currentColor = customColor.value;
    document.querySelectorAll(".color-btn").forEach(b => b.classList.remove("active"));
  });
}

// === DESSINS (pour le SELECT dans le volet) ===
function populateDrawingSelect() {
  drawingSelect.innerHTML = "";
  drawings.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.label;
    drawingSelect.appendChild(opt);
  });
}

function loadDrawing(id) {
  const drawing = drawings.find(d => d.id === id);
  if (!drawing) return;

  const img = new Image();
  img.src = drawing.src;

  img.onload = () => {
    backgroundImage = img;

    const maxWidth  = 900;
    const maxHeight = 900;
    let w = img.width;
    let h = img.height;

    const ratio = Math.min(maxWidth / w, maxHeight / h, 1);
    w = Math.floor(w * ratio);
    h = Math.floor(h * ratio);

    canvas.width  = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
  };
}

// === OUTILS ===
function initTools() {
  toolButtons.querySelectorAll(".tool-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      toolButtons.querySelectorAll(".tool-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTool = btn.dataset.tool;
    });
  });

  sizeRange.addEventListener("input", () => {
    sizeLabel.textContent = sizeRange.value + " px";
  });
}

// === POSITION CURSEUR (souris + touch) ===
function getPos(evt) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;

  if (evt.touches && evt.touches[0]) {
    clientX = evt.touches[0].clientX;
    clientY = evt.touches[0].clientY;
  } else {
    clientX = evt.clientX;
    clientY = evt.clientY;
  }

  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height)
  };
}

// === DESSIN A MAIN LEVÉE ===
function startDrawing(evt) {
  evt.preventDefault();
  const pos = getPos(evt);

  if (currentTool === "bucket") {
    floodFillColor(pos.x, pos.y, currentColor);
    return;
  }

  painting = true;
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function stopDrawing(evt) {
  painting = false;
  ctx.beginPath();
}

function draw(evt) {
  if (!painting) return;
  evt.preventDefault();

  const pos = getPos(evt);

  let lineWidth = parseInt(sizeRange.value, 10);
  let alpha = 1.0;

  if (currentTool === "pencil" || currentTool === "brush" || currentTool === "marker") {
    const toolConfig = TOOLS[currentTool];
    lineWidth = Math.max(1, Math.round(lineWidth * (toolConfig.baseSizeMultiplier || 1)));
    alpha = toolConfig.alpha ?? 1.0;
  } else if (currentTool === "eraser") {
    alpha = 1.0;
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = lineWidth;

  if (currentTool === "eraser") {
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = "#ffffff";
  } else {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = currentColor;
  }

  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.globalAlpha = 1.0;
}

// === POT DE PEINTURE : flood fill spécial coloriage ===
function floodFillColor(startX, startY, fillHex) {
  const w = canvas.width;
  const h = canvas.height;

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const stack   = [];
  const visited = new Uint8Array(w * h);

  const startXi = Math.floor(startX);
  const startYi = Math.floor(startY);
  const startIndex = (startYi * w + startXi) * 4;

  const target = [
    data[startIndex],
    data[startIndex + 1],
    data[startIndex + 2]
  ];

  const fill = hexToRgb(fillHex);
  const tolerance = 85;

  stack.push([startXi, startYi]);

  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;

    const idx = y * w + x;
    if (visited[idx]) continue;
    visited[idx] = 1;

    const i4 = idx * 4;
    const r = data[i4];
    const g = data[i4 + 1];
    const b = data[i4 + 2];

    // pixel assez proche de la couleur d'origine ?
    if (Math.abs(r - target[0]) > tolerance ||
        Math.abs(g - target[1]) > tolerance ||
        Math.abs(b - target[2]) > tolerance) continue;

    // éviter de colorier les traits trop foncés
    const lum = (r + g + b) / 3;
    if (lum < 50) continue;

    data[i4]     = fill.r;
    data[i4 + 1] = fill.g;
    data[i4 + 2] = fill.b;
    data[i4 + 3] = 255;

    stack.push([x + 1, y]);
    stack.push([x - 1, y]);
    stack.push([x, y + 1]);
    stack.push([x, y - 1]);
  }

  ctx.putImageData(imageData, 0, 0);
}

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  return {
    r: parseInt(hex.substr(0, 2), 16),
    g: parseInt(hex.substr(2, 2), 16),
    b: parseInt(hex.substr(4, 2), 16),
  };
}

// === ACTIONS ===
function initActions() {
  clearBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }
  });

  saveBtn.addEventListener("click", () => {
    const a = document.createElement("a");
    a.download = "coloriage.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  });

  reloadBtn.addEventListener("click", () => {
    loadDrawing(drawingSelect.value);
  });

  drawingSelect.addEventListener("change", () => {
    const d = drawings.find(x => x.id === drawingSelect.value);
    currentLabelEl.textContent = d ? d.label : "Coloriage";
    loadDrawing(drawingSelect.value);
  });
}

// === EVENEMENTS CANVAS ===
function initCanvasEvents() {
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseleave", stopDrawing);

  canvas.addEventListener("touchstart", e => { startDrawing(e); }, { passive: false });
  canvas.addEventListener("touchmove",  e => { draw(e); },         { passive: false });
  canvas.addEventListener("touchend",   e => { stopDrawing(e); },  { passive: false });
  canvas.addEventListener("touchcancel",e => { stopDrawing(e); },  { passive: false });
}

// === INIT ===
function init() {
  renderDrawingList();
  createColorButtons();
  populateDrawingSelect();
  initTools();
  initActions();
  initCanvasEvents();

  sizeLabel.textContent = sizeRange.value + " px";

  // Nav
  backHomeBtn.addEventListener("click", backToHome);
  toggleDrawerBtn.addEventListener("click", () => {
    if (toolDrawer.classList.contains("open")) closeDrawer();
    else openDrawer();
  });
  drawerOverlay.addEventListener("click", closeDrawer);
}

init();
