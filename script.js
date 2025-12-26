let score = 0, correctCount = 0, timeLeft = 30;
let timerInterval, currentAnswer = "", currentHint = "", isProcessing = false;
let currentDifficulty = 'easy';
let currentUser = "Гость";
let usedLogicTasks = [];

const inputEl = document.getElementById('answer-input');
const feedbackEl = document.getElementById('feedback');
const timerBar = document.getElementById('timer-bar');
const timerText = document.getElementById('timer-text');
const categoryEl = document.getElementById('category');

const diffSettings = {
    easy: { time: 40, range: 15, ops: ['+', '-'], bonus: 10 },
    medium: { time: 30, range: 40, ops: ['+', '-', '*'], bonus: 20 },
    hard: { time: 15, range: 100, ops: ['+', '-', '*'], bonus: 40 }
};

const logicDatabase = [
    {id: 1, q: "У палки 2 конца. Сколько у 3 палок?", a: "6", h: "3 палки * 2 конца"},
    {id: 2, q: "2 + 2 * 2 = ?", a: "6", h: "Сначала умножение!"},
    {id: 3, q: "Что можно увидеть с закрытыми глазами?", a: "сон", h: "Это бывает ночью"},
    {id: 4, q: "Сколько месяцев имеют 28 дней?", a: "12", h: "Во всех месяцах есть 28-е число"},
    {id: 5, q: "Что легче: кг ваты или кг железа?", a: "одинаково", h: "Вес одинаковый"},
    {id: 6, q: "Что становится больше, если его перевернуть?", a: "6", h: "Превратится в 9"},
    {id: 7, q: "Что можно сломать словом?", a: "молчание", h: "Тишина уходит, когда говоришь"}
];

// РЕГИСТРАЦИЯ
document.getElementById('start-game-btn').onclick = () => {
    const name = document.getElementById('username-input').value.trim();
    if (name.length < 2) return alert("Имя слишком короткое");
    currentUser = name;
    document.getElementById('display-username').innerText = currentUser;
    document.getElementById('auth-overlay').style.display = 'none';
    document.querySelector('.app-container').classList.add('visible');
    updateSideRating();
    generateTask();
};

// СЛОЖНОСТЬ
document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.onclick = function() {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentDifficulty = this.dataset.level;
        score = 0; correctCount = 0;
        document.getElementById('score').innerText = "0";
        document.getElementById('correct').innerText = "0";
        generateTask();
    };
});

function generateTask() {
    isProcessing = false;
    inputEl.disabled = false;
    inputEl.value = "";
    inputEl.focus();
    clearInterval(timerInterval);
    
    const settings = diffSettings[currentDifficulty];
    timeLeft = settings.time;
    feedbackEl.innerHTML = "";
    updateTimerProgress(100);
    startTimer();

    if (Math.random() > 0.4) {
        const a = Math.floor(Math.random() * settings.range) + 2;
        const b = Math.floor(Math.random() * settings.range) + 2;
        const op = settings.ops[Math.floor(Math.random() * settings.ops.length)];
        categoryEl.innerText = "МАТЕМАТИКА";
        categoryEl.className = "cat-tag cat-math";
        document.getElementById('question').innerText = `${a} ${op} ${b} = ?`;
        currentAnswer = eval(`${a}${op}${b}`).toString();
        currentHint = "Просто посчитай!";
    } else {
        let available = logicDatabase.filter(t => !usedLogicTasks.includes(t.id));
        if (available.length === 0) { usedLogicTasks = []; available = logicDatabase; }
        const task = available[Math.floor(Math.random() * available.length)];
        usedLogicTasks.push(task.id);
        categoryEl.innerText = "ЛОГИКА";
        categoryEl.className = "cat-tag cat-logic";
        document.getElementById('question').innerText = task.q;
        currentAnswer = task.a; currentHint = task.h;
    }
}

function startTimer() {
    const totalTime = diffSettings[currentDifficulty].time;
    timerInterval = setInterval(() => {
        timeLeft--;
        timerText.innerText = timeLeft;
        updateTimerProgress((timeLeft / totalTime) * 100);
        if (timeLeft <= 0) finishRound(false, true);
    }, 1000);
}

function updateTimerProgress(percent) {
    const circumference = 226;
    timerBar.style.strokeDashoffset = circumference - (percent / 100) * circumference;
}

function finishRound(isCorrect, isTimeout) {
    if (isProcessing) return;
    isProcessing = true;
    clearInterval(timerInterval);
    inputEl.disabled = true;

    if (isCorrect) {
        const bonus = diffSettings[currentDifficulty].bonus;
        feedbackEl.innerHTML = `<span style="color:var(--math-clr)">✨ ВЕРНО! +${bonus}</span>`;
        score += bonus; correctCount++;
        document.getElementById('score').innerText = score;
        document.getElementById('correct').innerText = correctCount;
        
        // ОБНОВЛЕНИЕ РЕЙТИНГА В РЕАЛЬНОМ ВРЕМЕНИ
        saveScore(); 
        
        setTimeout(generateTask, 1000);
    } else {
        feedbackEl.innerHTML = `<span style="color:var(--hard-clr)">❌ ${isTimeout ? 'ВРЕМЯ ВЫШЛО' : 'ОШИБКА'}. ОТВЕТ: ${currentAnswer}</span>`;
        saveScore();
        setTimeout(generateTask, 2500);
    }
}

function saveScore() {
    if (score === 0) return;
    let records = JSON.parse(localStorage.getItem('neonLogicDB')) || [];
    const idx = records.findIndex(r => r.name.toLowerCase() === currentUser.toLowerCase());
    if (idx !== -1) { 
        if (score > records[idx].s) records[idx].s = score; 
    }
    else { records.push({name: currentUser, s: score}); }
    records.sort((a,b) => b.s - a.s);
    localStorage.setItem('neonLogicDB', JSON.stringify(records.slice(0, 10)));
    updateSideRating();
}

function updateSideRating() {
    const list = document.getElementById('leaderboard-list-side');
    const records = JSON.parse(localStorage.getItem('neonLogicDB')) || [];
    list.innerHTML = records.map((r, i) => `
        <div class="leader-row-side">
            <span>${i+1}. ${r.name}</span><b>${r.s}</b>
        </div>`).join('') || "<div style='font-size:11px;color:#666'>Места свободны!</div>";
}

document.getElementById('check-btn').onclick = () => {
    if (inputEl.value.trim().toLowerCase() === currentAnswer.toLowerCase()) finishRound(true, false);
    else finishRound(false, false);
};
document.getElementById('next-btn').onclick = generateTask;
document.getElementById('help-btn').onclick = () => alert("ПОДСКАЗКА: " + currentHint);
inputEl.onkeydown = (e) => { if(e.key === 'Enter') document.getElementById('check-btn').click(); };