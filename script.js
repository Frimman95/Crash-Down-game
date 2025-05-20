// Játékhoz szükséges HTML elemek kiválasztása
const gameBoard = document.getElementById('game'); // a játéktábla megjelenítési helye
const timerDisplay = document.getElementById('timer'); // idő és szint kijelző
const startButton = document.getElementById('startButton'); // start gomb

// == Játék változók ==
// A játék állapotát nyilvántartó változók
let gameTime = 0; // eltelt idő másodpercben
let level = 0; // aktuális szint
let score = 0; // aktuális pontszám
let isPlaying = false; // játék folyamatban van-e
let intervalTimer; // időzítő hivatkozás
const grid = []; // játéktábla rács
const clickEffect = new Audio('pop.mp3'); // kattintás hang
const backgroundMusic = new Audio('chill.mp3'); // háttérzene
const levelUpSound = new Audio('victory.mp3'); // szintlépés hang
const gameOverSound = new Audio('fail.mp3'); // játék vége hang
backgroundMusic.volume = 0.2; // háttérzene hangerő
levelUpSound.volume = 0.3; // szintlépés hangerő

const maxRows = 30; // játéktábla magassága

// == Tábla létrehozása ==
// DOM elemek létrehozása és eseménykezelők beállítása
for (let row = 0; row < maxRows; row++) {
    grid[row] = []; // új sor
    for (let col = 0; col < 15; col++) {
        const cell = document.createElement('div'); // új cella létrehozása
        cell.classList.add('cell'); // cella osztály beállítása
        cell.id = `cell-${row}-${col}`; // egyedi ID
        cell.addEventListener('click', () => handleCellClick(row, col)); // kattintás esemény
        grid[row][col] = cell; // mentés a grid-be
        gameBoard.appendChild(cell); // hozzáadás a játéktáblához
    }
}

// == Játék indítása ==
function startGame() {
    // játék kezdőértékek beállítása
    level = 1;
    score = 0;
    isPlaying = true;
    gameTime = 0;

    startTimer(); // időzítő indítása
    resetLevel(); // új szint előkészítése
    updateScore(); // pontszám frissítése

    // UI elemek megjelenítése / elrejtése
    startButton.style.display = 'none';
    gameBoard.style.display = 'grid';
    document.getElementById('divider').style.display = 'block';
    timerDisplay.style.display = 'block';
    document.getElementById('scoreDisplay').style.display = 'block';
    document.getElementById('leaderboardSection').style.display = 'none';

    backgroundMusic.load();
    backgroundMusic.play(); // háttérzene indítása
}

function startTimer() {
    intervalTimer = setInterval(updateTimer, 1000); // 1 másodperces időzítő
}

function resetLevel() {
    clearBoard(); // tábla törlése
    fillBottomRows(); // alsó sorok feltöltése színekkel
}

function clearBoard() {
    // minden cella visszaállítása alapállapotra
    document.querySelectorAll('.cell').forEach(cell => {
        cell.className = 'cell';
    });
}

function fillBottomRows() {
    // alsó 7 sor véletlenszerű színnel való feltöltése
    for (let row = maxRows - 7; row < maxRows; row++) {
        for (let col = 0; col < 15; col++) {
            const cell = grid[row][col];
            cell.className = 'cell';
            const color = randomColor(); // véletlen szín
            cell.classList.add(color);
        }
    }
    ensureMatchExists(); // legalább egy hármas egyezés biztosítása
}

function ensureMatchExists() {
    // biztosítja, hogy legyen legalább egy 3 azonos színből álló sor vagy oszlop
    let foundMatch = false;
    for (let row = maxRows - 7; row < maxRows; row++) {
        for (let col = 0; col < 15; col++) {
            const color = getColor(grid[row][col]);
            if (!color) continue;

            // vízszintes vagy függőleges hármas ellenőrzése
            if (
                (col <= 12 && getColor(grid[row][col + 1]) === color && getColor(grid[row][col + 2]) === color) ||
                (row <= maxRows - 3 && getColor(grid[row + 1][col]) === color && getColor(grid[row + 2][col]) === color)
            ) {
                foundMatch = true;
                break;
            }
        }
        if (foundMatch) break;
    }

    if (!foundMatch) {
        // ha nincs egyezés, létrehoz egy hármast véletlen pozíción
        const baseRow = Math.floor(Math.random() * 5) + (maxRows - 7);
        const baseCol = Math.floor(Math.random() * 13);
        const chosenColor = randomColor();

        grid[baseRow][baseCol].className = 'cell ' + chosenColor;
        grid[baseRow][baseCol + 1].className = 'cell ' + chosenColor;
        grid[baseRow][baseCol + 2].className = 'cell ' + chosenColor;
    }
}

function getColor(cell) {
    // visszaadja a cella színét
    if (cell.classList.contains('red')) return 'red';
    if (cell.classList.contains('yellow')) return 'yellow';
    if (cell.classList.contains('blue')) return 'blue';
    if (cell.classList.contains('green')) return 'green';
    return null;
}

function randomColor() {
    // véletlenszerű színt ad vissza
    const colors = ['red', 'yellow', 'blue', 'green'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function handleCellClick(row, col) {
    // kattintás kezelése, azonos színű összefüggő mezők kiválasztása
    if (!isPlaying) return;

    const targetColor = grid[row][col].classList[1];
    if (!targetColor) return;

    selectConnectedCells(row, col, targetColor); // összefüggő mezők kijelölése

    const selectedCells = document.querySelectorAll('.selected');
    const selectedCount = selectedCells.length;

    if (selectedCount > 2) {
        // pontszám számítása: (n * (n-2)) * szint
        score += (selectedCount * (selectedCount - 2)) * level;
        updateScore();

        // vizuális animáció, majd törlés
        selectedCells.forEach(cell => {
            cell.classList.add('pop');
            setTimeout(() => {
                cell.className = 'cell';
            }, 400);
        });

        playClickSound(); // hang lejátszása

        setTimeout(() => {
            shiftEverythingUp(); // feltolódás
            applyGravity(); // színek lefelé esnek
            if (checkGameOver()) stopGame('You lost!');
        }, 450);
    } else {
        // ha kevés cellát választott, csak eltünteti a kijelölést
        selectedCells.forEach(cell => {
            cell.classList.remove('selected');
        });
    }
}

function selectConnectedCells(row, col, color) {
    // rekurzívan kiválasztja az összefüggő azonos színű cellákat
    if (row < 0 || row >= maxRows || col < 0 || col >= 15) return;
    const cell = grid[row][col];
    if (!cell.classList.contains(color) || cell.classList.contains('selected')) return;

    cell.classList.add('selected');

    // négy irányban rekurzió
    selectConnectedCells(row - 1, col, color);
    selectConnectedCells(row + 1, col, color);
    selectConnectedCells(row, col - 1, color);
    selectConnectedCells(row, col + 1, color);
}

function playClickSound() {
    // kattintás hang lejátszása
    const sound = new Audio(clickEffect.src);
    sound.volume = 0.2;
    sound.play();
}

function updateScore() {
    // pontszám frissítése a kijelzőn
    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
}

function updateTimer() {
    // idő kijelző frissítése másodpercenként
    gameTime++;
    timerDisplay.textContent = `Time: ${gameTime} Level: ${level}`;
}

function shiftEverythingUp() {
    // minden sor eggyel feljebb tolódik
    for (let row = 0; row < maxRows - 1; row++) {
        for (let col = 0; col < 15; col++) {
            grid[row][col].className = grid[row + 1][col].className;
        }
    }
    // alsó sor feltöltése új színekkel
    for (let col = 0; col < 15; col++) {
        const cell = grid[maxRows - 1][col];
        cell.className = 'cell ' + randomColor();
    }
}

function applyGravity() {
    // az "üres" cellák alá esik minden fölötte lévő színes cella
    for (let col = 0; col < 15; col++) {
        for (let row = maxRows - 2; row >= 0; row--) {
            let currentRow = row;
            while (currentRow < maxRows - 1 && isEmpty(grid[currentRow + 1][col]) && !isEmpty(grid[currentRow][col])) {
                grid[currentRow + 1][col].className = grid[currentRow][col].className;
                grid[currentRow][col].className = 'cell';
                currentRow++;
            }
        }
    }
}

function isEmpty(cell) {
    // true, ha a cella nem tartalmaz színt
    return !cell.classList.contains('red') &&
        !cell.classList.contains('yellow') &&
        !cell.classList.contains('blue') &&
        !cell.classList.contains('green');
}

function checkGameOver() {
    // akkor van vége a játéknak, ha a legfelső sorban van színes cella
    for (let col = 0; col < 15; col++) {
        if (grid[0][col].classList.contains('red') ||
            grid[0][col].classList.contains('yellow') ||
            grid[0][col].classList.contains('blue') ||
            grid[0][col].classList.contains('green')) {
            return true;
        }
    }
    return false;
}

function stopGame(message) {
    // játék leállítása, kijelzők frissítése
    clearInterval(intervalTimer);
    timerDisplay.textContent = `Time: ${gameTime} ${message}`;
    backgroundMusic.pause();
    gameOverSound.play();
    isPlaying = false;

    // UI frissítése
    gameBoard.style.display = 'none';
    document.getElementById('divider').style.display = 'none';
    document.getElementById('formSection').style.display = 'block';
    timerDisplay.style.display = 'none';
    document.getElementById('scoreDisplay').style.display = 'none';
}

function saveScore() {
    // név és pontszám mentése localStorage-be
    const playerName = document.getElementById('nameInput').value;
    if (!playerName) return;

    const playerData = {
        name: playerName,
        level: level,
        time: gameTime,
        score: score
    };

    let highscores = JSON.parse(localStorage.getItem('highscores')) || [];
    highscores.push(playerData);
    highscores.sort((a, b) => b.score - a.score); // csökkenő sorrend
    highscores = highscores.slice(0, 10); // csak top 10

    localStorage.setItem('highscores', JSON.stringify(highscores));
    document.getElementById('formSection').style.display = 'none';
    showLeaderboard(); // ranglista megjelenítése
}

function showLeaderboard() {
    // ranglista kirajzolása
    const leaderboardTable = document.getElementById('leaderboardTable');
    leaderboardTable.innerHTML = '';

    const highscores = JSON.parse(localStorage.getItem('highscores')) || [];

    highscores.forEach(player => {
        const row = leaderboardTable.insertRow();
        row.innerHTML = `
            <td>${player.name}</td>
            <td>${player.level}</td>
            <td>${player.time}</td>
            <td>${player.score}</td>
        `;
    });

    document.getElementById('leaderboardSection').style.display = 'block';
    startButton.style.display = 'block';
}

function forceGameOver() {
    // tesztelési célból azonnali "game over" létrehozása
    for (let col = 0; col < 15; col++) {
        grid[0][col].className = 'cell ' + randomColor();
    }
    if (checkGameOver()) {
        stopGame("Forced Game Over");
    }
}
