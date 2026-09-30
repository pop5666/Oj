const CATEGORIES = [
    {
        name: "สัตว์โลกน่ารัก",
        themes: ['#2d5a27', '#8b5a2b', '#1e3d59', '#3b6978', '#204051', '#4b6584']
    },
    {
        name: "สถานที่ท่องเที่ยว",
        themes: ['#2c3e50', '#d35400', '#2980b9', '#8e44ad', '#16a085', '#7f8c8d']
    },
    {
        name: "ร้านอาหาร & เมนูอร่อย",
        themes: ['#c0392b', '#d35400', '#f39c12', '#27ae60', '#e67e22', '#6d214f']
    }
];

let state = {
    catIndex: 0,
    levelIndex: 0,
    lives: 3,
    timeLeft: 90,
    foundCount: 0,
    hintsLeft: 3,
    differences: [],
    timer: null
};

// DOM Elements
const screens = {
    home: document.getElementById('screen-home'),
    map: document.getElementById('screen-map'),
    game: document.getElementById('screen-game')
};

const canvasLeft = document.getElementById('canvas-left');
const canvasRight = document.getElementById('canvas-right');
const ctxLeft = canvasLeft.getContext('2d');
const ctxRight = canvasRight.getContext('2d');

function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

// เลือกหมวดหมู่
document.querySelectorAll('.btn-cat').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-cat').forEach(b => b.classList.remove('active'));
        const target = e.currentTarget;
        target.classList.add('active');
        state.catIndex = parseInt(target.dataset.cat);
    });
});

document.getElementById('btn-play').addEventListener('click', () => {
    renderLevelGrid();
    switchScreen('map');
});

document.getElementById('map-back').addEventListener('click', () => switchScreen('home'));

// สร้างตาราง 20 ด่าน
function renderLevelGrid() {
    const grid = document.getElementById('level-grid');
    grid.innerHTML = '';
    
    document.getElementById('map-title').textContent = CATEGORIES[state.catIndex].name;

    for (let i = 0; i < 20; i++) {
        const card = document.createElement('div');
        card.className = 'lvl-card';
        card.innerHTML = `
            <div class="lvl-num">${i + 1}</div>
            <div class="lvl-stars">
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
            </div>
        `;
        card.addEventListener('click', () => startLevel(i));
        grid.appendChild(card);
    }
}

function startLevel(lvlIdx) {
    state.levelIndex = lvlIdx;
    state.lives = 3;
    state.timeLeft = 90;
    state.foundCount = 0;
    state.hintsLeft = 3;
    updateHUD();

    switchScreen('game');
    generateDetailedScene();
    startTimer();
}

function updateHUD() {
    document.getElementById('time-left').textContent = state.timeLeft;
    document.getElementById('found-count').textContent = state.foundCount;
    document.getElementById('hint-count').textContent = state.hintsLeft;
    
    const hearts = document.querySelectorAll('#hearts-container i');
    hearts.forEach((h, i) => {
        if (i < state.lives) h.classList.add('active');
        else h.classList.remove('active');
    });
}

// วาดฉากความละเอียดสูงลง Canvas โดยตรง (แก้ปัญหาบล็อกภาพ)
function generateDetailedScene() {
    const width = 800;
    const height = 600;

    canvasLeft.width = width;
    canvasLeft.height = height;
    canvasRight.width = width;
    canvasRight.height = height;

    const themeColors = CATEGORIES[state.catIndex].themes;
    const baseColor = themeColors[state.levelIndex % themeColors.length];

    // วาดพื้นหลังฉากเบื้องต้น
    [ctxLeft, ctxRight].forEach(ctx => {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, baseColor);
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // วาดรายละเอียดฉากความละเอียดสูง
        for (let i = 0; i < 40; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.03 + (i % 5) * 0.02})`;
            ctx.beginPath();
            ctx.arc((i * 97) % width, (i * 53) % height, (i * 13) % 80 + 10, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // สร้างจุดต่างแบบเนียนเนตร 3 จุด
    state.differences = [];
    for (let i = 0; i < 3; i++) {
        const cx = Math.floor(150 + Math.random() * 500);
        const cy = Math.floor(120 + Math.random() * 360);
        const r = 25;

        // วาดวัตถุพิเศษลงฝั่งซ้าย
        ctxLeft.fillStyle = '#f59e0b';
        ctxLeft.beginPath();
        ctxLeft.arc(cx, cy, r, 0, Math.PI * 2);
        ctxLeft.fill();

        // ลบหรือกลบเนียนวัตถุบนฝั่งขวา
        const bgData = ctxLeft.getImageData(cx - r * 2, cy - r * 2, 10, 10);
        ctxRight.fillStyle = baseColor;
        ctxRight.beginPath();
        ctxRight.arc(cx, cy, r + 2, 0, Math.PI * 2);
        ctxRight.fill();

        state.differences.push({ x: cx, y: cy, r: r, found: false });
    }
}

function startTimer() {
    clearInterval(state.timer);
    state.timer = setInterval(() => {
        state.timeLeft--;
        document.getElementById('time-left').textContent = state.timeLeft;
        if (state.timeLeft <= 0) {
            clearInterval(state.timer);
            showModal("หมดเวลา!", "เวลาหมดแล้ว ลองใหม่อีกครั้งครับ", [{ text: "ลองใหม่", action: () => startLevel(state.levelIndex) }]);
        }
    }, 1000);
}

// ตรวจจับการคลิกบน Canvas
[canvasLeft, canvasRight].forEach(canvas => {
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        checkClick(clickX, clickY);
    });
});

function checkClick(x, y) {
    let hit = false;
    state.differences.forEach(diff => {
        if (!diff.found) {
            const dist = Math.hypot(diff.x - x, diff.y - y);
            if (dist <= diff.r * 1.8) {
                diff.found = true;
                hit = true;
                state.foundCount++;
                drawFoundCircle(diff.x, diff.y, diff.r);
                updateHUD();

                if (state.foundCount >= 3) {
                    clearInterval(state.timer);
                    showModal("ชนะแล้ว!", "คุณพบจุดต่างครบถ้วน!", [
                        { text: "ด่านถัดไป", action: () => startLevel((state.levelIndex + 1) % 20) }
                    ]);
                }
            }
        }
    });

    if (!hit) {
        state.lives--;
        updateHUD();
        if (state.lives <= 0) {
            clearInterval(state.timer);
            showModal("เกมโอเวอร์", "หัวใจของคุณหมดแล้ว", [{ text: "ลองใหม่", action: () => startLevel(state.levelIndex) }]);
        }
    }
}

function drawFoundCircle(x, y, r) {
    [ctxLeft, ctxRight].forEach(ctx => {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, r + 5, 0, Math.PI * 2);
        ctx.stroke();
    });
}

function showModal(title, body, actions) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').textContent = body;
    const actContainer = document.getElementById('modal-actions');
    actContainer.innerHTML = '';
    
    actions.forEach(act => {
        const btn = document.createElement('button');
        btn.className = 'btn-primary-large';
        btn.textContent = act.text;
        btn.onclick = () => {
            document.getElementById('modal-overlay').classList.remove('active');
            act.action();
        };
        actContainer.appendChild(btn);
    });

    document.getElementById('modal-overlay').classList.add('active');
}
