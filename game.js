document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('game-container');
    const crosshairCanvas = document.getElementById('crosshair-canvas');
    const ctx = crosshairCanvas.getContext('2d');
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
    const gameSelect = document.getElementById('game-select');
    const gameSensInput = document.getElementById('game-sens');
    const applySensBtn = document.getElementById('apply-sens');

    // Set canvas dimensions
    crosshairCanvas.width = 900;
    crosshairCanvas.height = 540;

    let sensitivity = 1;
    let score = 0;
    let hits = 0;
    let gameRunning = false;

    // Three.js setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333);
    const camera = new THREE.PerspectiveCamera(75, 900 / 540, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(900, 540);
    container.appendChild(renderer.domElement);
    camera.position.z = 50;

    const crosshair = { size: 10, color: '#00ff00', style: 'cross' };
    let targets = [];

    // Sensitivity conversion factors
    const sensitivityFactors = {
        'csgo': 3.18,
        'valorant': 1,
        'fortnite': 0.314,
        'apex': 3.18
    };

    // Load settings from localStorage
    function loadSettings() {
        sensitivity = parseFloat(localStorage.getItem('sensitivity') || 1);
        crosshair.size = parseInt(localStorage.getItem('crosshairSize') || 10);
        crosshair.color = localStorage.getItem('crosshairColor') || '#00ff00';
        crosshair.style = localStorage.getItem('crosshairStyle') || 'cross';
        sensitivityInput.value = sensitivity;
        sensitivityValue.textContent = sensitivity.toFixed(2);
        crosshairSizeInput.value = crosshair.size;
        crosshairColorInput.value = crosshair.color;
        crosshairStyleInput.value = crosshair.style;
    }

    // Apply game-specific sensitivity
    function applyGameSensitivity() {
        const selectedGame = gameSelect.value;
        const gameSens = parseFloat(gameSensInput.value);
        const factor = sensitivityFactors[selectedGame];
        sensitivity = gameSens / factor;
        sensitivityInput.value = sensitivity;
        sensitivityValue.textContent = sensitivity.toFixed(2);
        localStorage.setItem('sensitivity', sensitivity);
    }

    // Spawn moving targets
    function spawnTarget() {
        const geometry = new THREE.SphereGeometry(2, 32, 32);
        const material = new THREE.MeshPhongMaterial({ color: 0xff4444 });
        const target = new THREE.Mesh(geometry, material);
        target.position.set(
            (Math.random() - 0.5) * 80,
            (Math.random() - 0.5) * 60,
            -20
        );
        target.dx = (Math.random() - 0.5) * 0.2;
        target.dy = (Math.random() - 0.5) * 0.2;
        scene.add(target);
        targets.push(target);
    }

    function updateTargets() {
        targets.forEach(target => {
            target.position.x += target.dx;
            target.position.y += target.dy;
            if (target.position.x < -40 || target.position.x > 40) target.dx = -target.dx;
            if (target.position.y < -30 || target.position.y > 30) target.dy = -target.dy;
    }

    // Draw crosshair
    function drawCrosshair() {
        ctx.clearRect(0, 0, crosshairCanvas.width, crosshairCanvas.height);
        ctx.strokeStyle = crosshair.color;
        ctx.lineWidth = 2;
        const centerX = crosshairCanvas.width / 2;
        const centerY = crosshairCanvas.height / 2;
        if (crosshair.style === 'cross') {
            ctx.beginPath();
            ctx.moveTo(centerX - crosshair.size, centerY);
            ctx.lineTo(centerX + crosshair.size, centerY);
            ctx.moveTo(centerX, centerY - crosshair.size);
            ctx.lineTo(centerX, centerY + crosshair.size);
            ctx.stroke();
        } else if (crosshair.style === 'dot') {
            ctx.beginPath();
            ctx.arc(centerX, centerY, crosshair.size / 2, 0, Math.PI * 2);
            ctx.fillStyle = crosshair.color;
            ctx.fill();
        }
    }

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(0, 0, 50);
    scene.add(pointLight);

    // Start game
    function startGame() {
        score = 0;
        hits = 0;
        targets = [];
        for (let i = 0; i < 5; i++) spawnTarget();
        updateStats();
        gameRunning = true;
        gameLoop();
    }

    function updateStats() {
        scoreDisplay.textContent = score;
        hitsDisplay.textContent = hits;
    }

    // Game loop
    function gameLoop() {
        if (gameRunning) {
            updateTargets();
            renderer.render(scene, camera);
            drawCrosshair();
            requestAnimationFrame(gameLoop);
        }
    }

    // Event listeners
    startBtn.addEventListener('click', () => {
        container.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === container) {
            gameRunning = true;
            container.addEventListener('mousemove', updateCamera);
            startGame();
        } else {
            gameRunning = false;
            container.removeEventListener('mousemove', updateCamera);
        }
    });

    function updateCamera(event) {
        camera.rotation.y -= event.movementX * sensitivity * 0.002;
        camera.rotation.x -= event.movementY * sensitivity * 0.002;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }

    container.addEventListener('click', () => {
        if (gameRunning) {
            shootSound.play().catch(() => console.log("Shoot sound not loaded"));
            checkHit();
        }
    });

    function checkHit() {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(targets);
        if (intersects.length > 0) {
            hitSound.play().catch(() => console.log("Hit sound not loaded"));
            const hitTarget = intersects[0].object;
            scene.remove(hitTarget);
            targets = targets.filter(t => t !== hitTarget);
            hits++;
            score += 10;
            spawnTarget();
            updateStats();
        }
    }

    sensitivityInput.addEventListener('input', () => {
        sensitivity = parseFloat(sensitivityInput.value);
        sensitivityValue.textContent = sensitivity.toFixed(2);
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

    applySensBtn.addEventListener('click', applyGameSensitivity);

    // Initial load
    loadSettings();
});