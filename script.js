// ==============================
// DOM Elements
// ==============================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('game-container');
const startScreen = document.getElementById('start-screen');
const roundIntroScreen = document.getElementById('round-intro-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const feedbackEl = document.getElementById('feedback-message');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const scoreDisplay = document.getElementById('score-display');
const categoryDisplay = document.getElementById('category-display');
const roundTimerDisplay = document.getElementById('round-timer');
const roundDisplay = document.getElementById('round-display');
const topBar = document.getElementById('top-bar');
const playerBadge = document.getElementById('player-badge');
const playerNameBadge = document.getElementById('player-name-badge');
const nameInput = document.getElementById('player-name-input');

// ==============================
// Sprite Loading
// ==============================
const RIGHT_SPRITE_FILES = [
    'gorseller/_35E7C4CE-21C0-4991-838E-106E228D3366_-removebg-preview.png',
    'gorseller/_37E6F08C-0C29-4455-BE1D-934B27361E0E_-removebg-preview.png',
    'gorseller/_527507CF-A7E9-4959-A48A-1BF045BAB7AE_-removebg-preview.png',
    'gorseller/_5B820116-8ABE-4282-870D-5B38E17939FC_-removebg-preview.png',
    'gorseller/_6CB5004D-3D07-4F8B-B111-FBC5D47E6EC4_-removebg-preview.png',
    'gorseller/_84A28444-7D02-4054-B38B-BDE1E31BBA7E_-removebg-preview.png',
    'gorseller/_B6653431-5CB6-47EA-97B9-27190054E108_-removebg-preview.png',
    'gorseller/_D869C6E5-9F5A-41CB-9B29-BA039510CF49_-removebg-preview.png'
];
const LEFT_SPRITE_FILES = [
    'gorseller/_761D93ED-9847-4A9B-9FFD-02EBA2894A5E_-removebg-preview.png',
    'gorseller/_DCEEF3E2-C1F0-4412-9414-D748CEF8DE56_-removebg-preview (1).png',
    'gorseller/_DCEEF3E2-C1F0-4412-9414-D748CEF8DE56_-removebg-preview.png'
];
const rightSprites = [];
const leftSprites = [];
let spritesLoaded = false;

function loadAllSprites() {
    const total = RIGHT_SPRITE_FILES.length + LEFT_SPRITE_FILES.length;
    let loaded = 0;
    return new Promise((resolve) => {
        function onLoad() { if (++loaded >= total) { spritesLoaded = true; resolve(); } }
        RIGHT_SPRITE_FILES.forEach(src => { const img = new Image(); img.src = src; img.onload = img.onerror = onLoad; rightSprites.push(img); });
        LEFT_SPRITE_FILES.forEach(src => { const img = new Image(); img.src = src; img.onload = img.onerror = onLoad; leftSprites.push(img); });
    });
}

// ==============================
// Sprite Animation
// ==============================
const spriteAnim = { frameIndex: 0, frameTimer: 0, frameDuration: 120, direction: 'right', isMoving: false };

function getCurrentSprite() {
    const sprites = spriteAnim.direction === 'right' ? rightSprites : leftSprites;
    if (!sprites.length) return null;
    return sprites[spriteAnim.frameIndex % sprites.length];
}

function updateSpriteAnimation(dtMs) {
    if (!spriteAnim.isMoving) { spriteAnim.frameIndex = 0; spriteAnim.frameTimer = 0; return; }
    spriteAnim.frameTimer += dtMs;
    if (spriteAnim.frameTimer >= spriteAnim.frameDuration) {
        spriteAnim.frameTimer -= spriteAnim.frameDuration;
        const sprites = spriteAnim.direction === 'right' ? rightSprites : leftSprites;
        spriteAnim.frameIndex = (spriteAnim.frameIndex + 1) % sprites.length;
    }
}

// ==============================
// Celebration Particles
// ==============================
const particles = [];

function triggerCelebration() {
    const cx = player.x + player.width / 2;
    const cy = player.y;
    for (let i = 0; i < 14; i++) {
        particles.push({
            x: cx, y: cy,
            vx: (Math.random() - 0.5) * 280, vy: -120 - Math.random() * 180,
            gravity: 350, life: 1.0, decay: 0.7 + Math.random() * 0.5,
            size: 4 + Math.random() * 9, rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 6,
            color: ['#FFD700','#FF6B6B','#4ECC71','#FF69B4','#87CEEB','#FFA500'][Math.floor(Math.random()*6)]
        });
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.gravity * dt;
        p.life -= p.decay * dt; p.rotation += p.rotSpeed * dt;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawStar(cx, cy, outerR, innerR) {
    const spikes = 5; let rot = -Math.PI / 2; const step = Math.PI / spikes;
    ctx.beginPath();
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR); rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR); rot += step;
    }
    ctx.closePath(); ctx.fill();
}

function drawParticles() {
    for (const p of particles) {
        ctx.save(); ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
        drawStar(0, 0, p.size, p.size * 0.4); ctx.restore();
    }
}

// ==============================
// Background (sky + clouds + ground)
// ==============================
const clouds = [];

function initClouds() {
    clouds.length = 0;
    for (let i = 0; i < 6; i++) {
        clouds.push({ x: Math.random() * canvas.width, y: 70 + Math.random() * (canvas.height * 0.35),
            scale: 0.6 + Math.random() * 0.8, speed: 8 + Math.random() * 12, opacity: 0.25 + Math.random() * 0.3 });
    }
}

function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#4FACFE'); grad.addColorStop(0.5, '#87CEEB');
    grad.addColorStop(0.85, '#B8E4F9'); grad.addColorStop(1, '#C8F0C0');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function updateClouds(dt) {
    for (const c of clouds) { c.x += c.speed * dt; if (c.x > canvas.width + 80 * c.scale) { c.x = -80 * c.scale; c.y = 70 + Math.random() * (canvas.height * 0.35); } }
}

function drawClouds() {
    for (const c of clouds) {
        ctx.save(); ctx.globalAlpha = c.opacity; ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.ellipse(c.x, c.y, 32*c.scale, 18*c.scale, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(c.x-22*c.scale, c.y+4*c.scale, 20*c.scale, 14*c.scale, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(c.x+24*c.scale, c.y+4*c.scale, 22*c.scale, 15*c.scale, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(c.x+8*c.scale, c.y-12*c.scale, 18*c.scale, 14*c.scale, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }
}

function drawGround() {
    const h = 18;
    const grad = ctx.createLinearGradient(0, canvas.height - h, 0, canvas.height);
    grad.addColorStop(0, '#7EC850'); grad.addColorStop(1, '#5DA038');
    ctx.fillStyle = grad; ctx.fillRect(0, canvas.height - h, canvas.width, h);
}

// ==============================
// Feedback Messages
// ==============================
const FEEDBACK_MESSAGES = ['Excellent! 🎉','Great! 👏','Awesome! 🌟','Harikasın! 💪','Well Done! ✨','Perfect! 🏆','Super! 🚀','Bravo! 🎊'];
let feedbackTimeout = null;

function showFeedback() {
    feedbackEl.innerText = FEEDBACK_MESSAGES[Math.floor(Math.random() * FEEDBACK_MESSAGES.length)];
    if (feedbackTimeout) clearTimeout(feedbackTimeout);
    feedbackEl.classList.remove('show','fade-out','hidden');
    void feedbackEl.offsetWidth;
    feedbackEl.classList.add('show');
    feedbackTimeout = setTimeout(() => {
        feedbackEl.classList.remove('show'); feedbackEl.classList.add('fade-out');
        setTimeout(() => { feedbackEl.classList.remove('fade-out'); feedbackEl.classList.add('hidden'); }, 500);
    }, 1200);
}

// ==============================
// Game Config
// ==============================
const CATEGORIES = {
    Animals: ['Dog','Cat','Lion','Tiger','Bear','Elephant','Monkey','Zebra','Rabbit','Fox'],
    Fruits: ['Apple','Banana','Orange','Grape','Mango','Peach','Cherry','Pear','Melon','Plum'],
    Colors: ['Red','Blue','Green','Yellow','Pink','Purple','Orange','Black','White','Brown'],
    Verbs: ['Run','Jump','Eat','Drink','Sleep','Read','Write','Swim','Dance','Sing']
};
const CATEGORY_EMOJIS = { Animals:'🐾', Fruits:'🍎', Colors:'🎨', Verbs:'💪' };

const ROUNDS = [
    { name: 'Animals', duration: 30 },
    { name: 'Fruits', duration: 30 },
    { name: 'Colors', duration: 30 },
    { name: 'Verbs', duration: 30 }
];

// ==============================
// Jump Physics Config
// ==============================
const GRAVITY = 1100;       // px/s²
const JUMP_VELOCITY = -480; // px/s (negative = up)

// ==============================
// Game State
// ==============================
let gameState = 'start'; // 'start' | 'round-intro' | 'playing' | 'game-over'
let playerName = 'Player';
let score = 0;
let correctCount = 0;
let wrongCount = 0;
let missedCount = 0;
let currentRound = 0;
let currentCategory = '';
let roundTimeLeft = 30;
let words = [];
let wordSpawnTimer = 0;
let wordSpawnRate = 1800;
let lastTime = 0;
let animationId;
let timerInterval;

// ==============================
// Canvas Resize
// ==============================
function resizeCanvas() { canvas.width = gameContainer.clientWidth; canvas.height = gameContainer.clientHeight; }
window.addEventListener('resize', () => { resizeCanvas(); if (!clouds.length) initClouds(); });
resizeCanvas();

// ==============================
// Player Object
// ==============================
const player = {
    width: 80, height: 100,
    x: 0, y: 0,
    speed: 340,
    movingLeft: false, movingRight: false,
    vy: 0, grounded: true
};

function getGroundY() { return canvas.height - player.height - 22; }

// ==============================
// Input Handling
// ==============================
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') player.movingLeft = true;
    if (e.key === 'ArrowRight') player.movingRight = true;
    if ((e.key === ' ' || e.code === 'Space') && gameState === 'playing') {
        e.preventDefault();
        if (player.grounded) { player.vy = JUMP_VELOCITY; player.grounded = false; }
    }
});
window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') player.movingLeft = false;
    if (e.key === 'ArrowRight') player.movingRight = false;
});

// Touch: direction + double-tap jump
let lastTapTime = 0;
gameContainer.addEventListener('touchstart', (e) => {
    if (gameState !== 'playing') return;
    const now = Date.now();
    if (now - lastTapTime < 300 && player.grounded) { player.vy = JUMP_VELOCITY; player.grounded = false; }
    lastTapTime = now;
    handleTouchMove(e);
}, { passive: true });
gameContainer.addEventListener('touchmove', handleTouchMove, { passive: true });
gameContainer.addEventListener('touchend', () => { player.movingLeft = false; player.movingRight = false; }, { passive: true });

function handleTouchMove(e) {
    if (gameState !== 'playing') return;
    const touchX = e.touches[0].clientX - gameContainer.getBoundingClientRect().left;
    if (touchX < canvas.width / 2) { player.movingLeft = true; player.movingRight = false; }
    else { player.movingRight = true; player.movingLeft = false; }
}

// ==============================
// Round System
// ==============================
function startGame() {
    playerName = nameInput.value.trim() || 'Player';
    playerNameBadge.innerText = playerName;
    score = 0; correctCount = 0; wrongCount = 0; missedCount = 0;
    currentRound = 0; words = []; particles.length = 0;
    wordSpawnRate = 1800;

    resizeCanvas(); initClouds();
    player.x = canvas.width / 2 - player.width / 2;
    player.y = getGroundY(); player.vy = 0; player.grounded = true;
    spriteAnim.frameIndex = 0; spriteAnim.frameTimer = 0;
    spriteAnim.direction = 'right'; spriteAnim.isMoving = false;

    scoreDisplay.innerText = '0';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    // Start animation loop
    lastTime = performance.now();
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(gameLoop);

    showRoundIntro();
}

function showRoundIntro() {
    gameState = 'round-intro';
    words = [];
    const round = ROUNDS[currentRound];
    currentCategory = round.name;
    roundTimeLeft = round.duration;

    // Update HUD
    topBar.classList.remove('hidden');
    playerBadge.classList.remove('hidden');
    categoryDisplay.innerText = currentCategory;
    roundTimerDisplay.innerText = roundTimeLeft;
    roundDisplay.innerText = currentRound + 1;

    // Populate round intro screen
    document.getElementById('round-badge').innerText = 'Round ' + (currentRound + 1);
    document.getElementById('round-category-title').innerText = (CATEGORY_EMOJIS[currentCategory] || '') + ' ' + currentCategory;
    const preview = CATEGORIES[currentCategory].slice(0, 6).join(', ') + '...';
    document.getElementById('round-word-preview').innerText = preview;

    roundIntroScreen.classList.remove('hidden');

    // After 3 seconds, start round
    setTimeout(() => {
        if (gameState !== 'round-intro') return;
        roundIntroScreen.classList.add('hidden');
        startRound();
    }, 3000);
}

function startRound() {
    gameState = 'playing';
    wordSpawnTimer = 0;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (gameState !== 'playing') return;
        roundTimeLeft--;
        roundTimerDisplay.innerText = roundTimeLeft;
        if (roundTimeLeft <= 0) { endRound(); }
    }, 1000);
}

function endRound() {
    clearInterval(timerInterval);
    currentRound++;
    if (currentRound >= ROUNDS.length) { endGame(); }
    else { showRoundIntro(); }
}

function endGame() {
    gameState = 'game-over';
    clearInterval(timerInterval);
    document.getElementById('final-score').innerText = score;
    document.getElementById('correct-count').innerText = correctCount;
    document.getElementById('wrong-count').innerText = wrongCount;
    document.getElementById('player-final-name').innerText = '👤 ' + playerName;
    topBar.classList.add('hidden');
    playerBadge.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
}

// ==============================
// Word Spawning
// ==============================
function spawnWord() {
    const isTarget = Math.random() < 0.5;
    let category = currentCategory;
    if (!isTarget) {
        const others = Object.keys(CATEGORIES).filter(c => c !== currentCategory);
        category = others[Math.floor(Math.random() * others.length)];
    }
    const wordList = CATEGORIES[category];
    const wordText = wordList[Math.floor(Math.random() * wordList.length)];
    ctx.font = 'bold 22px Nunito';
    const tw = ctx.measureText(wordText).width;
    const w = tw + 44, h = 42;
    words.push({ text: wordText, category: category, x: Math.random() * (canvas.width - w), y: -55, width: w, height: h, speed: 65 + Math.random() * 55 });
}

// ==============================
// Helpers
// ==============================
function showFloatingText(text, x, y, type) {
    const el = document.createElement('div');
    el.className = 'floating-text ' + type; el.innerText = text;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    gameContainer.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1000);
}

// roundRect polyfill
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r) {
        if(w<2*r)r=w/2; if(h<2*r)r=h/2;
        this.beginPath(); this.moveTo(x+r,y);
        this.arcTo(x+w,y,x+w,y+h,r); this.arcTo(x+w,y+h,x,y+h,r);
        this.arcTo(x,y+h,x,y,r); this.arcTo(x,y,x+w,y,r);
        this.closePath(); return this;
    };
}

// ==============================
// Game Loop
// ==============================
function gameLoop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    updateClouds(dt);

    if (gameState === 'playing') { update(dt); }

    draw();
    animationId = requestAnimationFrame(gameLoop);
}

function update(dt) {
    // --- Sprite direction (FIX: reset frame on direction change) ---
    const prevDir = spriteAnim.direction;
    spriteAnim.isMoving = player.movingLeft || player.movingRight;

    if (player.movingLeft && prevDir !== 'left') {
        spriteAnim.direction = 'left'; spriteAnim.frameIndex = 0; spriteAnim.frameTimer = 0;
    } else if (player.movingRight && prevDir !== 'right') {
        spriteAnim.direction = 'right'; spriteAnim.frameIndex = 0; spriteAnim.frameTimer = 0;
    }
    updateSpriteAnimation(dt * 1000);

    // --- Player horizontal movement ---
    if (player.movingLeft) player.x -= player.speed * dt;
    if (player.movingRight) player.x += player.speed * dt;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // --- Jump physics ---
    const groundY = getGroundY();
    if (!player.grounded) {
        player.vy += GRAVITY * dt;
        player.y += player.vy * dt;
        if (player.y >= groundY) { player.y = groundY; player.vy = 0; player.grounded = true; }
    } else {
        player.y = groundY;
    }

    // --- Particles ---
    updateParticles(dt);

    // --- Word spawning ---
    wordSpawnTimer += dt * 1000;
    if (wordSpawnTimer >= wordSpawnRate) {
        wordSpawnTimer = 0; spawnWord();
        if (wordSpawnRate > 1000) wordSpawnRate -= 5;
    }

    // --- Word update + collision ---
    for (let i = words.length - 1; i >= 0; i--) {
        const w = words[i];
        w.y += w.speed * dt;

        // AABB collision
        if (w.x < player.x + player.width && w.x + w.width > player.x &&
            w.y < player.y + player.height && w.y + w.height > player.y) {
            if (w.category === currentCategory) {
                score += 10; correctCount++;
                scoreDisplay.innerText = score;
                showFloatingText('+10', player.x + 10, player.y - 40, 'score-plus');
                showFeedback(); triggerCelebration();
            } else {
                score -= 5; wrongCount++;
                scoreDisplay.innerText = score;
                showFloatingText('-5', player.x + 10, player.y - 40, 'score-minus');
            }
            words.splice(i, 1); continue;
        }

        // Off screen
        if (w.y > canvas.height) {
            if (w.category === currentCategory) {
                score -= 3; missedCount++;
                scoreDisplay.innerText = score;
                showFloatingText('-3', w.x, canvas.height - 60, 'score-minus');
            }
            words.splice(i, 1);
        }
    }
}

// ==============================
// Drawing
// ==============================
function draw() {
    drawBackground(); drawClouds(); drawGround();

    // Words
    for (const w of words) {
        ctx.shadowColor = 'rgba(0,0,0,.08)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
        ctx.fillStyle = w.category === currentCategory ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.82)';
        ctx.beginPath(); ctx.roundRect(w.x, w.y, w.width, w.height, 21); ctx.fill();
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        ctx.lineWidth = 2.5; ctx.strokeStyle = '#b0d4f1'; ctx.stroke();
        ctx.fillStyle = '#333'; ctx.font = 'bold 20px Nunito';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(w.text, w.x + w.width / 2, w.y + w.height / 2);
    }

    // Player
    const sprite = getCurrentSprite();
    if (spritesLoaded && sprite && sprite.complete && sprite.naturalHeight) {
        ctx.drawImage(sprite, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = '#4a90e2'; ctx.beginPath();
        ctx.roundRect(player.x, player.y, player.width, player.height, 15); ctx.fill();
    }

    // Particles
    drawParticles();
}

// ==============================
// Init
// ==============================
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
});

// Enter key on name input starts game
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') startGame(); });

loadAllSprites().then(() => {
    resizeCanvas(); initClouds();
    player.x = canvas.width / 2 - player.width / 2;
    player.y = getGroundY();
    // Draw static scene behind start screen
    drawBackground(); drawClouds(); drawGround();
    const s = getCurrentSprite();
    if (s && s.complete) ctx.drawImage(s, player.x, player.y, player.width, player.height);
});
