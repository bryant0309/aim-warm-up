// Get DOM elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const sensitivityInput = document.getElementById('sensitivity');
const sensitivityValue = document.getElementById('sensitivity-value');
const crosshairSizeInput = document.getElementById('crosshair-size');
const crosshairColorInput = document.getElementById('crosshair-color');
const crosshairStyleInput = document.getElementById('crosshair-style');
const startBtn = document.getElementById('start-btn');
const scoreDisplay = document.getElementById('score');
const hitsDisplay = document.getElementById('hits');
const shootSound = document.getElementById('shoot-sound');
const hitSound = document.getElementById('hit-sound');

// Set canvas dimensions (match CSS container)
canvas.width = 900;
canvas.height = 600;

// Game state variables
let sensitivity = 1;
let crosshair = { x: canvas.width / 2, y: canvas.height / 2, size: 10, color: '#00ff00', style: 'cross' };
let targets = [];
let score = 0;
let hits = 0;
let gameRunning = false;

// Load saved settings from localStorage
function loadSettings() {
    sensitivity = parseFloat(localStorage.getItem('sensitivity') || 1);
    crosshair.size = parseInt(localStorage.getItem('crosshairSize') || 10);
    crosshair.color = localStorage.getItem('crosshairColor') || '#00ff00';
    crosshair.style = localStorage.getItem('crosshairStyle') || 'cross';
    sensitivityInput.value = sensitivity;
    sensitivityValue.textContent = sensitivity;
    crosshairSizeInput.value = crosshair.size;
    crosshairColorInput.value = crosshair.color;
    crosshairStyleInput.value = crosshair.style;
}
loadSettings();

// Spawn a new target
function spawnTarget() {
    targets.push({
        x: Math.random() * (canvas.width - 60) + 30,
        y: Math.random() * (canvas.height - 60) + 30,
        radius: 20,
        color: '#ff4444'
    });
}

// Draw the game elements
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw targets
    targets.forEach(target => {
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        ctx.fillStyle = target.color;
        ctx.fill();
        ctx.closePath();
    });

    // Draw crosshair
    ctx.strokeStyle = crosshair.color;
    ctx.lineWidth = 2;
    if (crosshair.style === 'cross') {
        ctx.beginPath();
        ctx.moveTo(crosshair.x - crosshair.size, crosshair.y);
        ctx.lineTo(crosshair.x + crosshair.size, crosshair.y);
        ctx.moveTo(crosshair.x, crosshair.y - crosshair.size);
        ctx.lineTo(crosshair.x, crosshair.y + crosshair.size);
        ctx.stroke();
    } else if (crosshair.style === 'dot') {
        ctx.beginPath();
        ctx.arc(crosshair.x, crosshair.y, crosshair.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = crosshair.color;
        ctx.fill();
    }
}

// Start the game
function startGame() {
    score = 0;
    hits = 0;
    targets = [];
    for (let i = 0; i < 5; i++) spawnTarget();
    updateStats();
    gameRunning = true;
    gameLoop();
}

// Update score and hits display
function updateStats() {
    scoreDisplay.textContent = score;
    hitsDisplay.textContent = hits;
}

// Game loop for continuous rendering
function gameLoop() {
    if (gameRunning) {
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// Start game with pointer lock
startBtn.addEventListener('click', () => {
    canvas.requestPointerLock();
});

// Handle pointer lock state changes
document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
        gameRunning = true;
        canvas.addEventListener('mousemove', updateCrosshair);
        startGame();
    } else {
        gameRunning = false;
        canvas.removeEventListener('mousemove', updateCrosshair);
    }
});

// Update crosshair position based on mouse movement
function updateCrosshair(event) {
    crosshair.x += event.movementX * sensitivity;
    crosshair.y += event.movementY * sensitivity;
    crosshair.x = Math.max(0, Math.min(canvas.width, crosshair.x));
    crosshair.y = Math.max(0, Math.min(canvas.height, crosshair.y));
}

// Handle shooting
canvas.addEventListener('click', () => {
    if (gameRunning) {
        shootSound.play().catch(() => console.log("Shoot sound not loaded yet"));
        checkHit();
    }
});

// Check for target hits
function checkHit() {
    let hitIndices = [];
    targets.forEach((target, index) => {
        const dx = crosshair.x - target.x;
        const dy = crosshair.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < target.radius) {
            hitIndices.push(index);
        }
    });
    if (hitIndices.length > 0) {
        hitSound.play().catch(() => console.log("Hit sound not loaded yet"));
        hitIndices.forEach(index => {
            targets.splice(index, 1);
            hits++;
            score += 10;
            spawnTarget();
        });
        updateStats();
    }
}

// Update settings dynamically
sensitivityInput.addEventListener('input', () => {
    sensitivity = parseFloat(sensitivityInput.value);
    sensitivityValue.textContent = sensitivity;
    localStorage.setItem('sensitivity', sensitivity);
});

crosshairSizeInput.addEventListener('input', () => {
    crosshair.size = parseInt(crosshairSizeInput.value);
    localStorage.setItem('crosshairSize', crosshair.size);
});

crosshairColorInput.addEventListener('input', () => {
    crosshair.color = crosshairColorInput.value;
    localStorage.setItem('crosshairColor', crosshair.color);
});

crosshairStyleInput.addEventListener('change', () => {
    crosshair.style = crosshairStyleInput.value;
    localStorage.setItem('crosshairStyle', crosshair.style);
});