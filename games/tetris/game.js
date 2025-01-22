// 游戏常量
const ROWS = 20;
const COLS = 12;
const BLOCK_SIZE = 20;
const SHAPES = [
    [[1,1,1,1]], // I
    [[1,1,1],[0,1,0]], // T
    [[1,1,1],[1,0,0]], // L
    [[1,1,1],[0,0,1]], // J
    [[1,1],[1,1]], // O
    [[1,1,0],[0,1,1]], // Z
    [[0,1,1],[1,1,0]] // S
];
const COLORS = [
    '#FF3B30', // 红色
    '#FF9500', // 橙色
    '#FFCC00', // 黄色
    '#4CD964', // 绿色
    '#5856D6', // 紫色
    '#007AFF', // 蓝色
    '#5AC8FA'  // 浅蓝色
];
const LOCK_DELAY = 500; // 锁定延迟时间（毫秒）
const DIFFICULTY_SPEEDS = {
    1: { baseSpeed: 1, name: "简单" },    // 基础速度1
    2: { baseSpeed: 2, name: "中等" },    // 基础速度2
    3: { baseSpeed: 3, name: "困难" }     // 基础速度3
};

// 添加音频对象
const AUDIO = {
    bgm: new Audio('audio/bgm.mp3'),
    clear: new Audio('audio/clear.mp3'),
    drop: new Audio('audio/drop.mp3'),
    rotate: new Audio('audio/rotate.mp3'),
    gameover: new Audio('audio/gameover.mp3')
};

// 设置背景音乐循环
AUDIO.bgm.loop = true;

// 游戏状态变量
let isPaused = false;
let gameStarted = false;
let nextPiece = null;
let currentColor = '';
let nextColor = '';
let highScore = localStorage.getItem('tetrisHighScore') || 0;
let lockDelay = null; // 锁定延迟计时器
let touchingBottom = false; // 是否接触底部
let currentDifficulty = 1; // 默认难度为简单
let baseSpeed = DIFFICULTY_SPEEDS[1].baseSpeed;

// 游戏变量
let canvas = document.getElementById('tetris');
let ctx = canvas.getContext('2d');
let previewCanvas = document.getElementById('preview');
let previewCtx = previewCanvas.getContext('2d');
let score = 0;
let level = 1;
let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let currentPiece = null;
let currentX = 0;
let currentY = 0;

// 初始化事件监听器
document.addEventListener('DOMContentLoaded', () => {
    // 难度选择按钮事件
    document.querySelectorAll('.diff-btn').forEach(button => {
        button.addEventListener('click', function() {
            // 移除其他按钮的active类
            document.querySelectorAll('.diff-btn').forEach(btn => 
                btn.classList.remove('active'));
            // 添加当前按钮的active类
            this.classList.add('active');
            // 设置当前难度
            currentDifficulty = parseInt(this.dataset.level);
            baseSpeed = DIFFICULTY_SPEEDS[currentDifficulty].baseSpeed;
            // 更新难度显示
            document.getElementById('difficulty').textContent = 
                DIFFICULTY_SPEEDS[currentDifficulty].name;
        });
    });

    // 开始游戏按钮事件
    document.getElementById('startBtn').addEventListener('click', () => {
        // 检查是否已选择难度
        if (!document.querySelector('.diff-btn.active')) {
            alert('请先选择难度！');
            return;
        }
        
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        gameStarted = true;
        
        // 重置游戏状态
        score = 0;
        level = 1;
        board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        baseSpeed = DIFFICULTY_SPEEDS[currentDifficulty].baseSpeed;
        
        // 更新显示
        updateScore();
        updateDifficultyDisplay();
        document.getElementById('highScore').textContent = highScore;
        
        // 初始化游戏
        createNewPiece();
        update();
        AUDIO.bgm.play();
    });

    // 暂停按钮事件
    document.getElementById('pauseBtn').addEventListener('click', () => {
        isPaused = !isPaused;
        document.getElementById('pauseBtn').textContent = isPaused ? '继续' : '暂停';
        if (isPaused) {
            AUDIO.bgm.pause();
        } else {
            AUDIO.bgm.play();
        }
    });

    // 音频控制
    document.getElementById('bgmToggle').addEventListener('change', (e) => {
        if (e.target.checked) {
            AUDIO.bgm.play();
        } else {
            AUDIO.bgm.pause();
        }
    });

    document.getElementById('sfxToggle').addEventListener('change', (e) => {
        const sfxEnabled = e.target.checked;
        Object.keys(AUDIO).forEach(key => {
            if (key !== 'bgm') {
                AUDIO[key].volume = sfxEnabled ? 1 : 0;
            }
        });
    });

    // 键盘控制
    document.addEventListener('keydown', function(e) {
        if (!gameStarted || isPaused) return;
        
        switch(e.keyCode) {
            case 37: moveLeft(); break;  // 左箭头
            case 39: moveRight(); break; // 右箭头
            case 40: moveDown(); break;  // 下箭头
            case 38: rotate(); break;    // 上箭头
        }
        draw();
    });
});

// 游戏功能函数
function createNewPiece() {
    if (nextPiece === null) {
        currentPiece = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        currentColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    } else {
        currentPiece = nextPiece;
        currentColor = nextColor;
    }
    
    nextPiece = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    nextColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    currentX = Math.floor(COLS / 2) - Math.floor(currentPiece[0].length / 2);
    currentY = 0;
    
    drawPreview();
}

function drawPreview() {
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    const blockSize = 20;
    const offsetX = (previewCanvas.width - nextPiece[0].length * blockSize) / 2;
    const offsetY = (previewCanvas.height - nextPiece.length * blockSize) / 2;
    
    for(let y = 0; y < nextPiece.length; y++) {
        for(let x = 0; x < nextPiece[y].length; x++) {
            if(nextPiece[y][x]) {
                previewCtx.fillStyle = nextColor;
                previewCtx.fillRect(
                    offsetX + x * blockSize,
                    offsetY + y * blockSize,
                    blockSize - 1,
                    blockSize - 1
                );
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制已固定的方块
    for(let y = 0; y < ROWS; y++) {
        for(let x = 0; x < COLS; x++) {
            if(board[y][x]) {
                drawBlock(x, y);
            }
        }
    }
    
    // 绘制当前方块
    if(currentPiece) {
        for(let y = 0; y < currentPiece.length; y++) {
            for(let x = 0; x < currentPiece[y].length; x++) {
                if(currentPiece[y][x]) {
                    drawBlock(currentX + x, currentY + y);
                }
            }
        }
    }
}

function drawBlock(x, y, color = currentColor) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE-1, BLOCK_SIZE-1);
}

function update() {
    if (!gameStarted || isPaused) {
        requestAnimationFrame(update);
        return;
    }
    
    moveDown();
    draw();
    const speed = 1000 / (baseSpeed * level);
    requestAnimationFrame(() => setTimeout(update, speed));
}

function moveLeft() {
    if(isValidMove(currentX - 1, currentY)) {
        currentX--;
        if (touchingBottom) {
            resetLockDelay();
        }
    }
}

function moveRight() {
    if(isValidMove(currentX + 1, currentY)) {
        currentX++;
        if (touchingBottom) {
            resetLockDelay();
        }
    }
}

function moveDown() {
    if(isValidMove(currentX, currentY + 1)) {
        currentY++;
        if (touchingBottom) {
            touchingBottom = false;
            if (lockDelay) {
                clearTimeout(lockDelay);
                lockDelay = null;
            }
        }
    } else {
        if (!touchingBottom) {
            touchingBottom = true;
            lockDelay = setTimeout(() => {
                freezePiece();
                clearLines();
                createNewPiece();
                if(!isValidMove(currentX, currentY)) {
                    AUDIO.gameover.play();
                    alert('游戏结束！得分：' + score);
                    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
                    score = 0;
                    level = 1;
                    updateScore();
                }
                touchingBottom = false;
                lockDelay = null;
            }, LOCK_DELAY);
        }
    }
}

function rotate() {
    let newPiece = currentPiece[0].map((val, index) => 
        currentPiece.map(row => row[index]).reverse()
    );
    
    if(isValidMove(currentX, currentY, newPiece)) {
        currentPiece = newPiece;
        if (touchingBottom) {
            resetLockDelay();
        }
    }
}

function isValidMove(newX, newY, piece = currentPiece) {
    for(let y = 0; y < piece.length; y++) {
        for(let x = 0; x < piece[y].length; x++) {
            if(piece[y][x]) {
                let nextX = newX + x;
                let nextY = newY + y;
                
                if(nextX < 0 || nextX >= COLS || nextY >= ROWS) return false;
                if(nextY >= 0 && board[nextY][nextX]) return false;
            }
        }
    }
    return true;
}

function freezePiece() {
    for(let y = 0; y < currentPiece.length; y++) {
        for(let x = 0; x < currentPiece[y].length; x++) {
            if(currentPiece[y][x]) {
                board[currentY + y][currentX + x] = 1;
            }
        }
    }
    AUDIO.drop.play();
}

function clearLines() {
    let linesCleared = 0;
    for(let y = ROWS - 1; y >= 0; y--) {
        if(board[y].every(cell => cell)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            score += 100;
            linesCleared++;
            if(score % 1000 === 0) level++;
            updateScore();
        }
    }
    
    if (linesCleared > 0) {
        AUDIO.clear.play();
    }
}

function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('tetrisHighScore', highScore);
        document.getElementById('highScore').textContent = highScore;
    }
}

function updateDifficultyDisplay() {
    document.getElementById('difficulty').textContent = 
        DIFFICULTY_SPEEDS[currentDifficulty].name;
}

function resetLockDelay() {
    if (lockDelay) {
        clearTimeout(lockDelay);
        lockDelay = setTimeout(() => {
            freezePiece();
            clearLines();
            createNewPiece();
            if(!isValidMove(currentX, currentY)) {
                AUDIO.gameover.play();
                alert('游戏结束！得分：' + score);
                board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
                score = 0;
                level = 1;
                updateScore();
            }
            touchingBottom = false;
            lockDelay = null;
        }, LOCK_DELAY);
    }
} 