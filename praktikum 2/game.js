// ==========================================
// GALAXIAN - CLASSIC ARCADE
// GAME ENGINE
// ==========================================

'use strict';

// ==========================================
// GET HTML ELEMENTS
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreDisplay =
    document.getElementById('score-display');

const waveDisplay =
    document.getElementById('wave-display');

const hiDisplay =
    document.getElementById('hi-display');

const livesDisplay =
    document.getElementById('lives-display');

const overlay =
    document.getElementById('overlay');

const overlayTitle =
    document.getElementById('overlay-title');

const overlaySubtitle =
    document.getElementById('overlay-subtitle');

const overlayText =
    document.getElementById('overlay-text');

const startBtn =
    document.getElementById('start-btn');

const btnLeft =
    document.getElementById('btn-left');

const btnRight =
    document.getElementById('btn-right');

const btnFire =
    document.getElementById('btn-fire');

// ==========================================
// CHECK ELEMENTS
// ==========================================

if (
    !canvas ||
    !ctx ||
    !scoreDisplay ||
    !waveDisplay ||
    !hiDisplay ||
    !livesDisplay ||
    !overlay ||
    !startBtn
) {
    throw new Error(
        'GALAXIAN: Elemen HTML tidak lengkap.'
    );
}

console.log(
    'GALAXIAN: game.js berhasil dimuat!'
);

// ==========================================
// CANVAS
// ==========================================

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// ==========================================
// GAME STATE
// ==========================================

let score = 0;

let hiScore =
    Number(
        localStorage.getItem(
            'galaxianHiScore'
        )
    ) || 0;

let wave = 1;

let lives = 3;

let gameRunning = false;

let animationId = null;

let lastTime = 0;

let enemyShootTimer = 0;

let invincibleTimer = 0;

// ==========================================
// PLAYER
// ==========================================

const player = {

    width: 36,

    height: 28,

    x: WIDTH / 2 - 18,

    y: HEIGHT - 52,

    speed: 280,

    movingLeft: false,

    movingRight: false,

    color: '#00e5ff'

};

// ==========================================
// BULLETS
// ==========================================

let bullets = [];

let enemyBullets = [];

const bulletSpeed = 500;

const enemyBulletSpeed = 190;

const fireCooldown = 250;

let canFire = true;

// ==========================================
// ENEMIES
// ==========================================

let enemies = [];

const ENEMY_ROWS = 4;

const ENEMY_COLS = 8;

const ENEMY_WIDTH = 30;

const ENEMY_HEIGHT = 24;

const ENEMY_PADDING = 14;

const ENEMY_OFFSET_TOP = 55;

let enemyDirection = 1;

let enemySpeed = 45;

let enemyDropDistance = 16;

// ==========================================
// STARS
// ==========================================

const stars = [];

for (let i = 0; i < 80; i++) {

    stars.push({

        x: Math.random() * WIDTH,

        y: Math.random() * HEIGHT,

        size: Math.random() < 0.8 ? 1 : 2,

        speed: 10 + Math.random() * 30,

        alpha: 0.25 + Math.random() * 0.75

    });
}

// ==========================================
// CREATE ENEMIES
// ==========================================

function createEnemies() {

    enemies = [];

    const totalWidth =
        ENEMY_COLS *
        (ENEMY_WIDTH + ENEMY_PADDING) -
        ENEMY_PADDING;

    const offsetX =
        (WIDTH - totalWidth) / 2;

    const colors = [

        '#ff4d6d',

        '#ffb703',

        '#8338ec',

        '#3a86ff'

    ];

    for (
        let row = 0;
        row < ENEMY_ROWS;
        row++
    ) {

        for (
            let col = 0;
            col < ENEMY_COLS;
            col++
        ) {

            enemies.push({

                x:
                    offsetX +
                    col *
                    (ENEMY_WIDTH + ENEMY_PADDING),

                y:
                    ENEMY_OFFSET_TOP +
                    row *
                    (ENEMY_HEIGHT + ENEMY_PADDING),

                width: ENEMY_WIDTH,

                height: ENEMY_HEIGHT,

                alive: true,

                color:
                    colors[
                        row % colors.length
                    ],

                points:
                    (ENEMY_ROWS - row) * 100

            });

        }

    }

    enemyDirection = 1;

    enemySpeed =
        45 +
        (wave - 1) * 12;

    enemyShootTimer = 0;
}

// ==========================================
// RESET PLAYER
// ==========================================

function resetPlayer() {

    player.x =
        WIDTH / 2 -
        player.width / 2;

    player.movingLeft = false;

    player.movingRight = false;

    invincibleTimer = 1200;
}

// ==========================================
// DRAW BACKGROUND
// ==========================================

function drawBackground(deltaTime) {

    ctx.fillStyle = '#02030a';

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    // Stars

    for (const star of stars) {

        star.y +=
            star.speed *
            deltaTime;

        if (star.y > HEIGHT) {
            star.y = 0;
            star.x = Math.random() * WIDTH;
        }

        ctx.globalAlpha =
            star.alpha;

        ctx.fillStyle = '#ffffff';

        ctx.fillRect(
            Math.floor(star.x),
            Math.floor(star.y),
            star.size,
            star.size
        );
    }

    ctx.globalAlpha = 1;

    // Ground glow

    const gradient =
        ctx.createLinearGradient(
            0,
            HEIGHT - 100,
            0,
            HEIGHT
        );

    gradient.addColorStop(
        0,
        'rgba(0,229,255,0)'
    );

    gradient.addColorStop(
        1,
        'rgba(0,229,255,0.08)'
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        HEIGHT - 100,
        WIDTH,
        100
    );
}

// ==========================================
// DRAW PLAYER
// ==========================================

function drawPlayer() {

    if (
        invincibleTimer > 0 &&
        Math.floor(invincibleTimer / 100) % 2 === 0
    ) {
        return;
    }

    const x = player.x;
    const y = player.y;

    // Glow

    ctx.shadowColor = '#00e5ff';

    ctx.shadowBlur = 12;

    ctx.fillStyle = '#00e5ff';

    // Main ship

    ctx.beginPath();

    ctx.moveTo(
        x + player.width / 2,
        y
    );

    ctx.lineTo(
        x + 5,
        y + player.height
    );

    ctx.lineTo(
        x + 13,
        y + player.height - 6
    );

    ctx.lineTo(
        x + player.width / 2,
        y + player.height - 10
    );

    ctx.lineTo(
        x + player.width - 13,
        y + player.height - 6
    );

    ctx.lineTo(
        x + player.width - 5,
        y + player.height
    );

    ctx.closePath();

    ctx.fill();

    ctx.shadowBlur = 0;

    // Cockpit

    ctx.fillStyle = '#ffffff';

    ctx.fillRect(
        x + player.width / 2 - 3,
        y + 9,
        6,
        6
    );

    // Engine

    ctx.fillStyle = '#ffb703';

    ctx.fillRect(
        x + 14,
        y + player.height - 3,
        8,
        3
    );
}

// ==========================================
// DRAW ENEMIES
// ==========================================

function drawEnemies() {

    for (const enemy of enemies) {

        if (!enemy.alive) continue;

        const x = enemy.x;
        const y = enemy.y;

        // Glow

        ctx.shadowColor =
            enemy.color;

        ctx.shadowBlur = 8;

        ctx.fillStyle =
            enemy.color;

        // Alien body

        ctx.fillRect(
            x + 4,
            y + 4,
            enemy.width - 8,
            enemy.height - 8
        );

        ctx.fillRect(
            x + 9,
            y,
            enemy.width - 18,
            enemy.height
        );

        ctx.fillRect(
            x,
            y + 8,
            7,
            8
        );

        ctx.fillRect(
            x + enemy.width - 7,
            y + 8,
            7,
            8
        );

        ctx.shadowBlur = 0;

        // Eyes

        ctx.fillStyle = '#000';

        ctx.fillRect(
            x + 7,
            y + 8,
            5,
            5
        );

        ctx.fillRect(
            x + enemy.width - 12,
            y + 8,
            5,
            5
        );
    }
}

// ==========================================
// DRAW BULLETS
// ==========================================

function drawBullets() {

    // Player bullets

    ctx.shadowColor = '#ffffff';

    ctx.shadowBlur = 8;

    ctx.fillStyle = '#ffffff';

    for (const bullet of bullets) {

        ctx.fillRect(
            bullet.x,
            bullet.y,
            bullet.width,
            bullet.height
        );
    }

    // Enemy bullets

    ctx.shadowColor = '#ff1744';

    ctx.shadowBlur = 8;

    ctx.fillStyle = '#ff1744';

    for (const bullet of enemyBullets) {

        ctx.fillRect(
            bullet.x,
            bullet.y,
            bullet.width,
            bullet.height
        );
    }

    ctx.shadowBlur = 0;
}

// ==========================================
// UPDATE PLAYER
// ==========================================

function updatePlayer(deltaTime) {

    if (player.movingLeft) {

        player.x -=
            player.speed *
            deltaTime;

    }

    if (player.movingRight) {

        player.x +=
            player.speed *
            deltaTime;

    }

    // Boundaries

    if (player.x < 0) {

        player.x = 0;

    }

    if (
        player.x +
        player.width >
        WIDTH
    ) {

        player.x =
            WIDTH -
            player.width;

    }

    if (invincibleTimer > 0) {

        invincibleTimer -=
            deltaTime * 1000;

    }
}

// ==========================================
// UPDATE BULLETS
// ==========================================

function updateBullets(deltaTime) {

    for (const bullet of bullets) {

        bullet.y -=
            bulletSpeed *
            deltaTime;

    }

    bullets =
        bullets.filter(
            bullet =>
                bullet.y >
                -30
        );

    for (const bullet of enemyBullets) {

        bullet.y +=
            enemyBulletSpeed *
            deltaTime;

    }

    enemyBullets =
        enemyBullets.filter(
            bullet =>
                bullet.y <
                HEIGHT + 30
        );
}

// ==========================================
// UPDATE ENEMIES
// ==========================================

function updateEnemies(deltaTime) {

    const aliveEnemies =
        enemies.filter(
            enemy => enemy.alive
        );

    if (aliveEnemies.length === 0) {
        return;
    }

    let hitEdge = false;

    for (const enemy of aliveEnemies) {

        enemy.x +=
            enemySpeed *
            enemyDirection *
            deltaTime;

        if (
            enemy.x <= 0 ||
            enemy.x + enemy.width >= WIDTH
        ) {

            hitEdge = true;

        }

    }

    if (hitEdge) {

        enemyDirection *= -1;

        for (const enemy of aliveEnemies) {

            enemy.y +=
                enemyDropDistance;

        }

    }

    // Enemy shooting

    enemyShootTimer +=
        deltaTime * 1000;

    const shootInterval =
        Math.max(
            350,
            1000 -
            (wave - 1) * 60
        );

    if (
        enemyShootTimer >=
        shootInterval
    ) {

        enemyShootTimer = 0;

        if (
            Math.random() <
            0.75
        ) {

            // Choose bottom enemy
            // from a random column

            const columns = [];

            for (
                let col = 0;
                col < ENEMY_COLS;
                col++
            ) {

                const columnEnemies =
                    aliveEnemies.filter(
                        enemy =>
                            Math.round(
                                (
                                    enemy.x -
                                    aliveEnemies[0].x
                                ) /
                                (
                                    ENEMY_WIDTH +
                                    ENEMY_PADDING
                                )
                            ) === col
                    );

                if (
                    columnEnemies.length
                ) {

                    columns.push(
                        columnEnemies
                    );

                }

            }

            let shooter;

            if (columns.length) {

                const column =
                    columns[
                        Math.floor(
                            Math.random() *
                            columns.length
                        )
                    ];

                shooter =
                    column[
                        column.length - 1
                    ];

            } else {

                shooter =
                    aliveEnemies[
                        Math.floor(
                            Math.random() *
                            aliveEnemies.length
                        )
                    ];

            }

            enemyBullets.push({

                x:
                    shooter.x +
                    shooter.width / 2 -
                    2,

                y:
                    shooter.y +
                    shooter.height,

                width: 4,

                height: 12

            });

        }

    }

    // Enemy reached player

    const reached =
        aliveEnemies.some(
            enemy =>
                enemy.y +
                enemy.height >=
                player.y
        );

    if (reached) {

        loseLife();

        if (gameRunning) {

            resetEnemyWave();

        }

    }
}

// ==========================================
// COLLISION
// ==========================================

function isColliding(a, b) {

    return (

        a.x <
        b.x + b.width &&

        a.x + a.width >
        b.x &&

        a.y <
        b.y + b.height &&

        a.y + a.height >
        b.y

    );
}

// ==========================================
// CHECK COLLISIONS
// ==========================================

function checkCollisions() {

    // Player bullet -> enemy

    for (const bullet of bullets) {

        if (bullet.hit) continue;

        for (const enemy of enemies) {

            if (!enemy.alive) continue;

            if (
                isColliding(
                    bullet,
                    enemy
                )
            ) {

                enemy.alive = false;

                bullet.hit = true;

                score += enemy.points;

                updateScoreDisplay();

                break;
            }
        }
    }

    bullets =
        bullets.filter(
            bullet => !bullet.hit
        );

    // Enemy bullet -> player

    if (invincibleTimer <= 0) {

        for (const bullet of enemyBullets) {

            if (
                isColliding(
                    bullet,
                    player
                )
            ) {

                bullet.hit = true;

                loseLife();

                break;
            }
        }

        enemyBullets =
            enemyBullets.filter(
                bullet => !bullet.hit
            );
    }
}

// ==========================================
// CHECK WAVE COMPLETE
// ==========================================

function checkWaveComplete() {

    if (!gameRunning) return;

    const aliveCount =
        enemies.filter(
            enemy => enemy.alive
        ).length;

    if (aliveCount === 0) {

        wave += 1;

        updateWaveDisplay();

        createEnemies();

        resetPlayer();

    }
}

// ==========================================
// RESET ENEMY WAVE (setelah nyawa hilang)
// ==========================================

function resetEnemyWave() {

    createEnemies();

    resetPlayer();
}

// ==========================================
// LOSE LIFE
// ==========================================

function loseLife() {

    if (invincibleTimer > 0) return;

    lives -= 1;

    updateLivesDisplay();

    if (lives <= 0) {

        gameOver();

    } else {

        resetPlayer();

    }
}

// ==========================================
// SHOOT
// ==========================================

function shootBullet() {

    if (!gameRunning || !canFire) return;

    bullets.push({

        x:
            player.x +
            player.width / 2 -
            2,

        y: player.y,

        width: 4,

        height: 12,

        hit: false

    });

    canFire = false;

    setTimeout(() => {

        canFire = true;

    }, fireCooldown);
}

// ==========================================
// UPDATE HUD DISPLAYS
// ==========================================

function updateScoreDisplay() {

    scoreDisplay.textContent =
        'SCORE: ' +
        String(score).padStart(4, '0');
}

function updateWaveDisplay() {

    waveDisplay.textContent =
        'WAVE: ' + wave;
}

function updateHiDisplay() {

    hiDisplay.textContent =
        'HI: ' +
        String(hiScore).padStart(4, '0');
}

function updateLivesDisplay() {

    livesDisplay.textContent =
        '♥ ' + Math.max(lives, 0);
}

// ==========================================
// GAME OVER
// ==========================================

function gameOver() {

    gameRunning = false;

    if (animationId) {

        cancelAnimationFrame(animationId);

        animationId = null;
    }

    if (score > hiScore) {

        hiScore = score;

        localStorage.setItem(
            'galaxianHiScore',
            hiScore
        );

        updateHiDisplay();
    }

    overlayTitle.textContent = 'GAME OVER';

    overlaySubtitle.textContent =
        'SCORE AKHIR: ' + score;

    overlayText.textContent =
        'Tekan tombol di bawah untuk bermain lagi.';

    startBtn.textContent = 'MAIN LAGI';

    overlay.style.display = 'flex';
}

// ==========================================
// START GAME
// ==========================================

function startGame() {

    score = 0;

    wave = 1;

    lives = 3;

    bullets = [];

    enemyBullets = [];

    canFire = true;

    updateScoreDisplay();

    updateWaveDisplay();

    updateHiDisplay();

    updateLivesDisplay();

    createEnemies();

    resetPlayer();

    overlay.style.display = 'none';

    gameRunning = true;

    lastTime = performance.now();

    if (animationId) {

        cancelAnimationFrame(animationId);
    }

    animationId = requestAnimationFrame(gameLoop);
}

// ==========================================
// GAME LOOP
// ==========================================

function gameLoop(timestamp) {

    if (!gameRunning) return;

    let deltaTime =
        (timestamp - lastTime) / 1000;

    lastTime = timestamp;

    // Jaga-jaga jika tab sempat tidak aktif
    // (deltaTime jangan sampai terlalu besar)

    if (deltaTime > 0.05) {

        deltaTime = 0.05;
    }

    drawBackground(deltaTime);

    updatePlayer(deltaTime);

    updateBullets(deltaTime);

    updateEnemies(deltaTime);

    checkCollisions();

    checkWaveComplete();

    drawEnemies();

    drawPlayer();

    drawBullets();

    animationId = requestAnimationFrame(gameLoop);
}

// ==========================================
// EVENT LISTENERS - START BUTTON
// ==========================================

startBtn.addEventListener(
    'click',
    startGame
);

// ==========================================
// EVENT LISTENERS - KEYBOARD
// ==========================================

window.addEventListener('keydown', (e) => {

    if (
        e.code === 'ArrowLeft' ||
        e.code === 'KeyA'
    ) {

        player.movingLeft = true;
    }

    if (
        e.code === 'ArrowRight' ||
        e.code === 'KeyD'
    ) {

        player.movingRight = true;
    }

    if (e.code === 'Space') {

        e.preventDefault();

        shootBullet();
    }

});

window.addEventListener('keyup', (e) => {

    if (
        e.code === 'ArrowLeft' ||
        e.code === 'KeyA'
    ) {

        player.movingLeft = false;
    }

    if (
        e.code === 'ArrowRight' ||
        e.code === 'KeyD'
    ) {

        player.movingRight = false;
    }

});

// ==========================================
// EVENT LISTENERS - TOUCH / MOUSE CONTROLS
// ==========================================

function bindHoldButton(button, onDown, onUp) {

    if (!button) return;

    button.addEventListener('mousedown', (e) => {
        e.preventDefault();
        onDown();
    });

    button.addEventListener('mouseup', (e) => {
        e.preventDefault();
        onUp();
    });

    button.addEventListener('mouseleave', () => {
        onUp();
    });

    button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        onDown();
    }, { passive: false });

    button.addEventListener('touchend', (e) => {
        e.preventDefault();
        onUp();
    }, { passive: false });

    button.addEventListener('touchcancel', () => {
        onUp();
    });
}

bindHoldButton(
    btnLeft,
    () => { player.movingLeft = true; },
    () => { player.movingLeft = false; }
);

bindHoldButton(
    btnRight,
    () => { player.movingRight = true; },
    () => { player.movingRight = false; }
);

if (btnFire) {

    btnFire.addEventListener('click', (e) => {
        e.preventDefault();
        shootBullet();
    });

    btnFire.addEventListener('touchstart', (e) => {
        e.preventDefault();
        shootBullet();
    }, { passive: false });
}

// ==========================================
// INIT - TAMPILKAN LAYAR AWAL
// ==========================================

updateHiDisplay();

updateScoreDisplay();

updateWaveDisplay();

updateLivesDisplay();