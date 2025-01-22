const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const scoreElement = document.getElementById('scoreValue');
const pauseBtn = document.getElementById('pauseBtn');
const highScoreElement = document.getElementById('highScoreValue');

// 音效
const eatSound = new Audio('sounds/eat.mp3');
const gameOverSound = new Audio('sounds/gameover.mp3');

// 游戏配置
const CONFIG = {
    EASY: { speed: 150, speedIncrease: 2, points: 10 },
    NORMAL: { speed: 120, speedIncrease: 3, points: 15 },
    HARD: { speed: 100, speedIncrease: 5, points: 20 }
};

// 游戏状态
const GAME_STATE = {
    WAITING: 'waiting',    // 等待第一次按键
    PLAYING: 'playing',    // 游戏进行中
    PAUSED: 'paused',     // 暂停
    ENDED: 'ended'        // 游戏结束
};

// 游戏变量
let gameState = GAME_STATE.ENDED;
let difficulty = 'NORMAL';
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gridSize = 20;
let tileCount = canvas.width / gridSize;
let snake = [];
let food = {};
let specialFood = null;
let dx = 0;
let dy = 0;
let score = 0;
let gameInterval;
let gameSpeed;
let hasStartedMoving = false;

// 获取遮罩层元素
const gameOverlay = document.getElementById('gameOverlay');

highScoreElement.textContent = highScore;

// 初始化游戏
function initGame() {
    snake = [{x: Math.floor(tileCount/2), y: Math.floor(tileCount/2)}];
    generateFood();
    score = 0;
    dx = 0;
    dy = 0;
    hasStartedMoving = false;
    gameSpeed = CONFIG[difficulty].speed;
    scoreElement.textContent = score;
    gameState = GAME_STATE.WAITING;
    
    // 清空并绘制初始状态
    clearCanvas();
    drawGrid();
    drawFood();
    drawSnake();
    
    // 显示遮罩层
    if (gameOverlay) {
        gameOverlay.style.display = 'flex';
    }
}

// 绘制网格背景
function drawGrid() {
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
}

// 清空画布
function clearCanvas() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// 绘制蛇
function drawSnake() {
    ctx.fillStyle = '#4CD964';
    snake.forEach((segment, index) => {
        // 蛇头绘制为不同颜色
        if (index === 0) {
            ctx.fillStyle = '#34C759';
        }
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
        ctx.fillStyle = '#4CD964';
    });
}

// 绘制食物
function drawFood() {
    ctx.fillStyle = '#FF3B30';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
    
    // 绘制特殊食物
    if (specialFood) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(
            (specialFood.x * gridSize) + gridSize/2,
            (specialFood.y * gridSize) + gridSize/2,
            gridSize/2 - 1,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

// 生成食物
function generateFood() {
    do {
        food.x = Math.floor(Math.random() * tileCount);
        food.y = Math.floor(Math.random() * tileCount);
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
    
    // 10%概率生成特殊食物
    if (Math.random() < 0.1) {
        generateSpecialFood();
    }
}

// 生成特殊食物
function generateSpecialFood() {
    do {
        specialFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount),
            expires: Date.now() + 5000 // 5秒后消失
        };
    } while (
        snake.some(segment => segment.x === specialFood.x && segment.y === specialFood.y) ||
        (food.x === specialFood.x && food.y === specialFood.y)
    );
}

// 游戏主循环
function gameLoop() {
    if (gameState !== GAME_STATE.PLAYING) return;
    
    // 等待第一次按键
    if (!hasStartedMoving && (dx === 0 && dy === 0)) {
        clearCanvas();
        drawGrid();
        drawFood();
        drawSnake();
        return;
    }

    const newHead = {
        x: snake[0].x + dx,
        y: snake[0].y + dy
    };

    // 检查碰撞
    if (checkCollision(newHead)) {
        gameOver();
        return;
    }

    snake.unshift(newHead);

    // 检查是否吃到食物
    let ate = false;
    if (newHead.x === food.x && newHead.y === food.y) {
        eatSound.play();
        score += CONFIG[difficulty].points;
        scoreElement.textContent = score;
        generateFood();
        ate = true;
        
        // 加快游戏速度
        if (gameSpeed > 50) {
            gameSpeed -= CONFIG[difficulty].speedIncrease;
            resetGameInterval();
        }
    } else if (specialFood && newHead.x === specialFood.x && newHead.y === specialFood.y) {
        eatSound.play();
        score += CONFIG[difficulty].points * 2;
        scoreElement.textContent = score;
        specialFood = null;
        ate = true;
    }

    if (!ate) {
        snake.pop();
    }

    // 检查特殊食物是否过期
    if (specialFood && Date.now() > specialFood.expires) {
        specialFood = null;
    }

    // 更新画面
    clearCanvas();
    drawGrid();
    drawFood();
    drawSnake();
}

// 检查碰撞
function checkCollision(head) {
    return (
        head.x < 0 || 
        head.x >= tileCount || 
        head.y < 0 || 
        head.y >= tileCount ||
        snake.some(segment => segment.x === head.x && segment.y === head.y)
    );
}

// 重置游戏间隔
function resetGameInterval() {
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
}

// 游戏结束
function gameOver() {
    gameOverSound.play();
    gameState = GAME_STATE.ENDED;
    clearInterval(gameInterval);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    alert(`游戏结束！\n当前得分：${score}\n最高分：${highScore}`);
    startBtn.textContent = '重新开始';
    
    // 显示遮罩层
    gameOverlay.style.display = 'flex';
}

// 开始游戏
function startGame() {
    if (gameState === GAME_STATE.PLAYING) return;
    
    initGame();
    gameState = GAME_STATE.PLAYING;
    startBtn.textContent = '游戏中';
    pauseBtn.textContent = '暂停';
    
    // 隐藏遮罩层
    gameOverlay.style.display = 'none';
    
    resetGameInterval();
}

// 处理方向键输入
function handleDirectionChange(newDx, newDy) {
    if (gameState !== GAME_STATE.PLAYING) return;
    
    // 防止反向移动
    if (!hasStartedMoving || 
        (dx === 0 && dy === 0) || 
        (Math.abs(newDx) !== Math.abs(dx) || Math.abs(newDy) !== Math.abs(dy))) {
        dx = newDx;
        dy = newDy;
        hasStartedMoving = true;
    }
}

// 事件监听器
pauseBtn.addEventListener('click', () => {
    if (gameState === GAME_STATE.ENDED) return;
    
    if (gameState === GAME_STATE.PLAYING) {
        gameState = GAME_STATE.PAUSED;
        pauseBtn.textContent = '继续';
    } else if (gameState === GAME_STATE.PAUSED) {
        gameState = GAME_STATE.PLAYING;
        pauseBtn.textContent = '暂停';
    }
});

// 键盘控制
document.addEventListener('keydown', (e) => {
    // 阻止方向键和空格键的默认行为
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
    
    switch(e.key) {
        case 'ArrowUp':
            handleDirectionChange(0, -1);
            break;
        case 'ArrowDown':
            handleDirectionChange(0, 1);
            break;
        case 'ArrowLeft':
            handleDirectionChange(-1, 0);
            break;
        case 'ArrowRight':
            handleDirectionChange(1, 0);
            break;
        case ' ':  // 空格键暂停
            pauseBtn.click();
            break;
    }
});

// 移动端控制
document.querySelectorAll('.mobile-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        switch(btn.classList[1]) {
            case 'up':
                handleDirectionChange(0, -1);
                break;
            case 'down':
                handleDirectionChange(0, 1);
                break;
            case 'left':
                handleDirectionChange(-1, 0);
                break;
            case 'right':
                handleDirectionChange(1, 0);
                break;
        }
    });
});

// 触摸控制
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        handleDirectionChange(deltaX > 0 ? 1 : -1, 0);
    } else {
        handleDirectionChange(0, deltaY > 0 ? 1 : -1);
    }
});

startBtn.addEventListener('click', startGame);

// 修改难度选择按钮的创建和处理
const difficultyContainer = document.createElement('div');
difficultyContainer.className = 'difficulty-container';

// 移除旧的难度选择按钮
document.querySelectorAll('.difficulty-btn').forEach(btn => btn.remove());

// 创建新的难度选择按钮
['EASY', 'NORMAL', 'HARD'].forEach(diff => {
    const btn = document.createElement('button');
    btn.className = `btn difficulty-btn ${diff === difficulty ? 'active' : ''}`;
    btn.textContent = ['简单', '普通', '困难'][['EASY', 'NORMAL', 'HARD'].indexOf(diff)];
    btn.setAttribute('data-difficulty', diff);
    
    // 修改点击事件处理
    btn.addEventListener('click', () => {
        // 移除所有按钮的active类
        document.querySelectorAll('.difficulty-btn').forEach(b => 
            b.classList.remove('active'));
        
        // 添加active类到当前按钮
        btn.classList.add('active');
        
        // 更新难度
        difficulty = diff;
        
        // 如果游戏正在进行，更新游戏速度
        if (gameState === GAME_STATE.PLAYING) {
            gameSpeed = CONFIG[difficulty].speed;
            resetGameInterval();
        }
    });
    
    difficultyContainer.appendChild(btn);
});

// 将难度选择按钮添加到控制面板
const controlsPanel = document.querySelector('.controls-panel');
if (controlsPanel) {
    // 如果使用新的HTML结构
    controlsPanel.insertBefore(difficultyContainer, controlsPanel.firstChild);
} else {
    // 如果使用旧的HTML结构
    document.querySelector('.controls').insertBefore(difficultyContainer, startBtn);
}

// 确保页面加载完成后显示遮罩层
document.addEventListener('DOMContentLoaded', () => {
    if (gameOverlay) {
        gameOverlay.style.display = 'flex';
    }
    
    // 初始化游戏状态
    gameState = GAME_STATE.ENDED;
    initGame();
});