const plate = document.getElementById("plate");
const chefDisplay = document.getElementById("chef-display");
const ingredient = document.getElementById("ingredient");
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("high-score");
const container = document.getElementById("game-container");
const selectionScreen = document.getElementById("selection-screen");
const chefButtons = document.querySelectorAll(".chef-btn");

// Elementos de Configuração
const settingsToggleBtn = document.getElementById("settings-toggle-btn");
const settingsPanel = document.getElementById("settings-panel");
const closeSettingsBtn = document.getElementById("close-settings-btn");
const difficultySelect = document.getElementById("difficulty-select");
const resetHighscoreBtn = document.getElementById("reset-highscore-btn");

let gameActive = false; 
let score = 0;
let highScore = localStorage.getItem("kitchenHighScoreV2") || 0;
highScoreDisplay.innerText = "Recorde: " + highScore;

// Banco de dados dos Chefs (Cores e Ingredientes exclusivos)
const chefDatabase = {
    alfredo: { emoji: "👨‍🍳", bg: "#f1c40f", good: ["🍕", "🍝", "🍅", "🧀", "🍞"], bad: ["🪰", "🥾", "🤢"] },
    julia: { emoji: "👩‍🍳", bg: "#e74c3c", good: ["🍰", "🍩", "🍫", "🍓", "🧁"], bad: ["🪰", "👟", "🤢"] },
    panda: { emoji: "🐼", bg: "#2ecc71", good: ["🍣", "🍙", "🍜", "🍤", "🥠"], bad: ["🪰", "🥾", "🤢"] }
};

let currentChef = "alfredo";
let currentIngredientType = "good"; 
let speed = 4; 
let speedIncrement = 0.2;
let ingredientY = -50;
let ingredientX = 180;
let plateX = 160;

// === 🔊 SISTEMA DE SONS VIA CÓDIGO (WEB AUDIO API) ===
function playSound(type) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === "point") {
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime); 
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1); 
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
    } else if (type === "gameover") {
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.4); 
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.4);
    }
}

// === 1. SISTEMA DE CONFIGURAÇÕES ===
settingsToggleBtn.addEventListener("click", () => {
    settingsPanel.style.display = settingsPanel.style.display === "none" ? "flex" : "none";
});

closeSettingsBtn.addEventListener("click", () => {
    settingsPanel.style.display = "none";
});

resetHighscoreBtn.addEventListener("click", () => {
    if (confirm("Deseja realmente zerar seu recorde mundial?")) {
        highScore = 0;
        localStorage.setItem("kitchenHighScoreV2", 0);
        highScoreDisplay.innerText = "Recorde: 0";
        alert("Recorde resetado!");
    }
});

function getDifficultySettings() {
    const diff = difficultySelect.value;
    if (diff === "easy") { speed = 3; speedIncrement = 0.15; }
    else if (diff === "normal") { speed = 4.5; speedIncrement = 0.25; }
    else if (diff === "hard") { speed = 6.5; speedIncrement = 0.4; }
}

// === 2. SELEÇÃO DE CHEF ===
chefButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentChef = button.getAttribute("data-chef");
        getDifficultySettings();

        chefDisplay.innerText = chefDatabase[currentChef].emoji;
        container.style.backgroundColor = chefDatabase[currentChef].bg;

        selectionScreen.style.display = "none";
        settingsToggleBtn.style.display = "none"; 
        plate.style.display = "flex";
        ingredient.style.display = "flex";
        document.getElementById("hud").style.display = "block";

        gameActive = true;
        resetIngredient();
        updateGame();
    });
});

// === 3. MOVIMENTAÇÃO DO PRATO ===
function movePlate(clientX) {
    if (!gameActive) return;
    const rect = container.getBoundingClientRect();
    plateX = clientX - rect.left - 40; 
    if (plateX < 0) plateX = 0;
    if (plateX > 320) plateX = 320;
    plate.style.left = plateX + "px";
}

container.addEventListener("mousemove", (e) => movePlate(e.clientX));
container.addEventListener("touchmove", (e) => movePlate(e.touches.clientX));

// === 4. LÓGICA DOS INGREDIENTES ===
function resetIngredient() {
    ingredientY = -50;
    ingredientX = Math.floor(Math.random() * 340);
    ingredient.style.left = ingredientX + "px";

    const chefData = chefDatabase[currentChef];

    if (Math.random() < 0.3) {
        currentIngredientType = "bad";
        ingredient.innerText = chefData.bad[Math.floor(Math.random() * chefData.bad.length)];
    } else {
        currentIngredientType = "good";
        ingredient.innerText = chefData.good[Math.floor(Math.random() * chefData.good.length)];
    }
}

// === 5. LOOP DE ATUALIZAÇÃO ===
function updateGame() {
    if (!gameActive) return;

    ingredientY += speed;
    ingredient.style.top = ingredientY + "px";

    if (ingredientY >= 430 && ingredientY <= 460) {
        if (ingredientX >= plateX - 15 && ingredientX <= plateX + 65) {
            if (currentIngredientType === "good") {
                score++;
                scoreDisplay.innerText = "Pontos: " + score;
                speed += speedIncrement; 
                playSound("point"); 
                resetIngredient();
            } else {
                gameOver();
                return;
            }
        }
    }

    if (ingredientY > 500) {
        if (currentIngredientType === "good") {
            gameOver(); 
            return;
        } else {
            resetIngredient(); 
        }
    }

    requestAnimationFrame(updateGame);
}

// === 6. FIM DE JOGO ===
function gameOver() {
    gameActive = false;
    playSound("gameover"); 
    
    setTimeout(() => {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem("kitchenHighScoreV2", highScore);
            alert(`🎉 NOVO RECORDE MUNDIAL! Você fez ${score} pontos com o chef!`);
        } else {
            alert(`Fim de jogo! Pontos finais: ${score}`);
        }

        score = 0;
        scoreDisplay.innerText = "Pontos: " + score;
        highScoreDisplay.innerText = "Recorde: " + highScore;
        
        plate.style.display = "none";
        ingredient.style.display = "none";
        document.getElementById("hud").style.display = "none";
        container.style.backgroundColor = "#34495e";
        
        settingsToggleBtn.style.display = "block"; 
        selectionScreen.style.display = "flex";
    }, 100);
}
