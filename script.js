// === CONFIGURATION DES DESSINS ===
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


// === VARIABLES GLOBALES ===
const canvas = document.getElementById("colorCanvas");
const ctx = canvas.getContext("2d");

const drawingSelect = document.getElementById("drawingSelect");
const reloadBtn = document.getElementById("reloadBtn");
const toolButtons = document.getElementById("toolButtons");
const sizeRange = document.getElementById("sizeRange");
const sizeLabel = document.getElementById("sizeLabel");
const colorPalette = document.getElementById("colorPalette");
const customColor = document.getElementById("customColor");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn");

let currentTool = "pencil";
let currentColor = "#000000";
let painting = false;
let backgroundImage = null;


// === OUTILS ===
const TOOLS = {
  pencil: { baseSizeMultiplier: 0.4, alpha: 0.9 },
  brush:  { baseSizeMultiplier: 1.0, alpha: 1.0 },
  marker: { baseSizeMultiplier: 1.4, alpha: 0.5 },
  bucket: {},
  eraser: {},
};


// === PALETTE ===
const PALETTE = [
  "#000000","#444444","#888888","#ffffff",
  "#ff0000","#ff7f00","#ffff00","#bfff00",
  "#00ff00","#00ffff","#0080ff","#0000ff",
  "#7f00ff","#ff00ff","#ff0080","#ffb6c1",
  "#8b4513","#ffd700","#90ee90","#add8e6"
];

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

  customColor.addEventListener("input", () => currentColor = customColor.value);
}


// === CHARGEMENT DESSIN ===
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

    let w = img.width;
    let h = img.height;
    const ratio = Math.min(900/w, 900/h, 1);
    w = Math.floor(w * ratio);
    h = Math.floor(h * ratio);

    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0,0,w,h);
    ctx.drawImage(img,0,0,w,h);
  };
}

function reloadCurrentDrawing() {
  loadDrawing(drawingSelect.value);
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


// === POSITION CURSEUR ===
function getPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const x = (evt.clientX - rect.left) * (canvas.width/rect.width);
  const y = (evt.clientY - rect.top) * (canvas.height/rect.height);
  return { x, y };
}


// === DESSIN LIBRE ===
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
  let w = parseInt(sizeRange.value);

  if (currentTool === "eraser") {
    ctx.strokeStyle = "#ffffff";
    ctx.globalAlpha = 1;
  } else {
    ctx.strokeStyle = currentColor;
    ctx.globalAlpha = TOOLS[currentTool].alpha ?? 1;
    w = Math.round(w * (TOOLS[currentTool].baseSizeMultiplier ?? 1));
  }

  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}


// === 🌈 POT DE PEINTURE VERSION COLORIAGE PRO ===
function floodFillColor(startX, startY, fillHex) {

  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0,0,w,h);
  const data = imageData.data;

  const stack = [];
  const visited = new Uint8Array(w*h);

  const targetIdx = (Math.floor(startY)*w + Math.floor(startX)) * 4;

  const target = [
    data[targetIdx],
    data[targetIdx+1],
    data[targetIdx+2]
  ];

  const fill = hexToRgb(fillHex);

  const tolerance = 85; // clé du succès

  stack.push([Math.floor(startX), Math.floor(startY)]);

  while(stack.length) {
    const [x,y] = stack.pop();

    if (x<0 || y<0 || x>=w || y>=h) continue;

    const idx = y*w + x;
    if (visited[idx]) continue;
    visited[idx] = 1;

    const i4 = idx*4;
    const r = data[i4], g=data[i4+1], b=data[i4+2];

    // détecte zones blanches/grises --> même zone
    if (Math.abs(r-target[0])>tolerance ||
        Math.abs(g-target[1])>tolerance ||
        Math.abs(b-target[2])>tolerance) continue;

    // évite de remplir les contours trop foncés
    const lum = (r+g+b)/3;
    if (lum < 50) continue;

    data[i4] = fill.r;
    data[i4+1] = fill.g;
    data[i4+2] = fill.b;
    data[i4+3] = 255;

    // voisins
    stack.push([x+1,y]);
    stack.push([x-1,y]);
    stack.push([x,y+1]);
    stack.push([x,y-1]);
  }

  ctx.putImageData(imageData,0,0);
}


// === UTILITIES ===
function hexToRgb(hex) {
  hex = hex.replace("#","");
  if (hex.length===3) {
    hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  }
  return {
    r:parseInt(hex.substr(0,2),16),
    g:parseInt(hex.substr(2,2),16),
    b:parseInt(hex.substr(4,2),16)
  };
}


// === ACTIONS ===
function initActions() {
  clearBtn.addEventListener("click", () => {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if (backgroundImage) ctx.drawImage(backgroundImage,0,0,canvas.width,canvas.height);
  });

  saveBtn.addEventListener("click", () => {
    const a = document.createElement("a");
    a.download = "coloriage.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  });

  reloadBtn.addEventListener("click", reloadCurrentDrawing);
  drawingSelect.addEventListener("change", reloadCurrentDrawing);
}


// === INIT ===
function initCanvasEvents() {
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseleave", stopDrawing);
}

function init() {
  createColorButtons();
  populateDrawingSelect();
  initTools();
  initActions();
  initCanvasEvents();

  sizeLabel.textContent = sizeRange.value + " px";

  drawingSelect.value = drawings[0].id;
  reloadCurrentDrawing();
}

init();
