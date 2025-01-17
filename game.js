// 修改开始游戏按钮事件
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

// 修改难度选择按钮事件，添加初始难度显示
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

// 修改初始化函数（虽然现在不直接使用它了）
function init() {
    // 重置游戏状态
    score = 0;
    level = 1;
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    baseSpeed = DIFFICULTY_SPEEDS[currentDifficulty].baseSpeed;
    
    // 更新显示
    updateScore();
    updateDifficultyDisplay();
    
    createNewPiece();
    update();
} 