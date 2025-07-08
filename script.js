document.addEventListener('DOMContentLoaded', () => {
    // --- Constants and State ---
    const CODE_LENGTH = 4;
    const MAX_TRIES = 10;

    
    const COLORS = [
        { name: "red", hex: "#FF0000" },      // Bright Red
        { name: "orange", hex: "#FF8C00" },   // Slightly deeper Orange
        { name: "yellow", hex: "#FFFF00" },   // Bright Yellow
        { name: "pink", hex: "#FFC0CB" },     // Added Pink (common hex for light pink)
        { name: "green", hex: "#00C853" },    // Distinct Green (e.g., Emerald Green)
        { name: "black", hex: "#000000" },    // Pure Black
        { name: "purple", hex: "#8A2BE2" },   // Blue Violet (distinct purple)
        { name: "white", hex: "#FFFFFF" }     // Pure White
    ];

    let secretCode = [];
    let currentTry = 0;
    let allowDuplicates = false;

    // --- DOM Elements ---
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game');
    const startBtn = document.getElementById('start-btn');
    const rulesBtn = document.getElementById('rules-btn');
    const allowDuplicatesToggle = document.getElementById('allow-duplicates');
    const colorBlocksContainer = document.getElementById('color-blocks');
    const gameBoard = document.getElementById('board');
    const checkButton = document.getElementById('check-btn');
    const newGameButton = document.getElementById('newgame-btn');
    const messageElement = document.getElementById('message');

    // Popups
    const winPopup = document.getElementById('win-popup');
    const losePopup = document.getElementById('lose-popup');
    const loseMessage = document.getElementById('lose-message');
    const finalSecretCodeDisplay = document.getElementById('final-secret-code');
    const errorPopup = document.getElementById('error-popup');
    const errorMessage = document.getElementById('error-message');
    const rulesPopup = document.getElementById('rules-popup');

    // Buttons within popups
    const playAgainBtnWin = winPopup.querySelector('button');
    const playAgainBtnLose = losePopup.querySelector('button');
    const errorOkBtn = errorPopup.querySelector('button');
    const closeRulesBtn = rulesPopup.querySelector('.close-rules-btn');

    // Win/Lose specific elements
    const starsContainer = document.getElementById('stars');
    const scoreText = document.getElementById('score');
    const scoreLevelText = document.getElementById('score-level'); // This will now include percentage

    // --- Initial State (Ensure all popups and game are hidden on load) ---
    gameContainer.classList.add('hidden'); // Ensure game board is hidden initially
    winPopup.classList.add('hidden');
    losePopup.classList.add('hidden');
    errorPopup.classList.add('hidden');
    rulesPopup.classList.add('hidden');
    startScreen.classList.remove('hidden'); // Ensure start screen is visible

    // --- Event Listeners ---
    startBtn.addEventListener('click', startGame);
    rulesBtn.addEventListener('click', showRulesPopup);
    newGameButton.addEventListener('click', () => initGame(true));
    checkButton.addEventListener('click', checkGuessHandler);
    playAgainBtnWin.addEventListener('click', () => initGame(true));
    playAgainBtnLose.addEventListener('click', () => initGame(true));
    errorOkBtn.addEventListener('click', hideErrorPopup);
    closeRulesBtn.addEventListener('click', hideRulesPopup);

    // --- Helper Functions for Popups ---
    function showRulesPopup() {
        rulesPopup.classList.remove('hidden');
    }

    function hideRulesPopup() {
        rulesPopup.classList.add('hidden');
    }

    function showErrorPopup(message) {
        errorMessage.textContent = message;
        errorPopup.classList.remove('hidden');
    }

    function hideErrorPopup() {
        errorPopup.classList.add('hidden');
    }

    function showWinPopup(triesTaken) { // Renamed 'score' to 'triesTaken' for clarity
        const maxTries = MAX_TRIES;
        const remainingTries = maxTries - (triesTaken - 1); // Subtract 1 because triesTaken is 1-indexed for the win
        const winPercentage = ((remainingTries / maxTries) * 100).toFixed(0); // Calculate percentage

        let scoreLevel;
        if (triesTaken <= 4) {
            scoreLevel = "Mastermind!";
        } else if (triesTaken <= 7) {
            scoreLevel = "Great Job!";
        } else {
            scoreLevel = "Good Effort!";
        }

        scoreText.textContent = `You cracked the code in ${triesTaken} tries!`;
        scoreLevelText.textContent = `${scoreLevel} (${winPercentage}% efficiency)`; // Display score level and percentage
        
        starsContainer.innerHTML = '';
        const numStars = triesTaken <= 4 ? 3 : (triesTaken <= 7 ? 2 : 1);
        for (let i = 0; i < numStars; i++) {
            const star = document.createElement('span');
            star.textContent = '⭐';
            star.classList.add('star-animate');
            starsContainer.appendChild(star);
        }
        winPopup.classList.remove('hidden');
    }

    function showLosePopup() {
        loseMessage.textContent = `You ran out of tries! The secret code was:`;
        finalSecretCodeDisplay.innerHTML = '';
        secretCode.forEach(colorName => {
            const peg = document.createElement('div');
            peg.className = 'peg';
            const colorObj = COLORS.find(c => c.name === colorName);
            peg.style.backgroundColor = colorObj ? colorObj.hex : 'gray';
            if (colorObj && (colorObj.name === 'white' || colorObj.name === 'yellow' || colorObj.name === 'pink')) {
                peg.style.border = '2px solid rgba(0, 0, 0, 0.3)';
            } else {
                peg.style.border = '2px solid rgba(255, 255, 255, 0.2)';
            }
            finalSecretCodeDisplay.appendChild(peg);
        });
        losePopup.classList.remove('hidden');
    }

    // Dynamically create/style color pegs for consistency and to use new COLORS
    // This part ensures the visual style of the draggable pegs.
    COLORS.forEach(colorObj => {
        let pegElement = document.querySelector(`.peg[data-color='${colorObj.name}']`);

        if (pegElement) {
            pegElement.style.backgroundColor = colorObj.hex;
            if (colorObj.name === 'white' || colorObj.name === 'yellow' || colorObj.name === 'pink') {
                pegElement.style.border = '3px solid rgba(0, 0, 0, 0.4)'; // Updated border for light colors
            } else {
                pegElement.style.border = '3px solid rgba(255, 255, 255, 0.2)'; // Updated border for dark colors
            }
        }
    });

    // Drag and Drop for color pegs
    colorBlocksContainer.querySelectorAll('.peg').forEach(peg => {
        peg.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', e.target.dataset.color);
            e.dataTransfer.effectAllowed = 'copy';
        });
    });

    // Drag and Drop for slots on the board
    gameBoard.addEventListener('dragover', e => {
        const targetSlot = e.target.closest('.slot');
        const parentRow = targetSlot ? targetSlot.closest('.row') : null;

        if (targetSlot && parentRow && parseInt(parentRow.dataset.row) === currentTry) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }
    });

    gameBoard.addEventListener('drop', handleDrop);

    // --- Game Flow Functions ---
    function startGame() {
        allowDuplicates = allowDuplicatesToggle.checked;
        startScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        initGame(false); // Do not reset duplicates preference if coming from start screen
    }

    window.initGame = function(resetDuplicates = false) {
        currentTry = 0;
        createBoard();
        generateSecretCode();
        winPopup.classList.add('hidden');
        losePopup.classList.add('hidden');
        errorPopup.classList.add('hidden');
        rulesPopup.classList.add('hidden');
        checkButton.disabled = false;
        messageElement.textContent = '';

        if (resetDuplicates) {
            allowDuplicatesToggle.checked = false;
            allowDuplicates = false;
        }

        startScreen.classList.add('hidden'); // Ensure start screen is hidden
        gameContainer.classList.remove('hidden'); // Ensure game container is visible

        updateActiveRowHighlight();
    }

    // --- Core Game Logic ---
    function createBoard() {
        gameBoard.innerHTML = '';
        for (let i = 0; i < MAX_TRIES; i++) {
            const row = document.createElement('div');
            row.className = 'row';
            row.dataset.row = i;

            const slotsContainer = document.createElement('div');
            slotsContainer.className = 'slots-container';
            for (let j = 0; j < CODE_LENGTH; j++) {
                const slot = document.createElement('div');
                slot.className = 'slot';
                slot.addEventListener('click', () => {
                    if (parseInt(row.dataset.row) === currentTry) {
                        clearSlot(slot);
                    }
                });
                slotsContainer.appendChild(slot);
            }

            const feedbackContainer = document.createElement('div');
            feedbackContainer.className = 'feedback-container';
            for (let j = 0; j < CODE_LENGTH; j++) {
                const feedbackPeg = document.createElement('div');
                feedbackPeg.className = 'feedback-peg';
                feedbackContainer.appendChild(feedbackPeg);
            }

            row.appendChild(slotsContainer);
            row.appendChild(feedbackContainer);
            gameBoard.appendChild(row);
        }
        updateActiveRowHighlight();
    }

    function updateActiveRowHighlight() {
        gameBoard.querySelectorAll('.row').forEach(row => {
            row.classList.remove('active-row');
        });
        const currentRowElement = gameBoard.querySelector(`[data-row='${currentTry}']`);
        if (currentRowElement) {
            currentRowElement.classList.add('active-row');
        }
    }

    function clearSlot(slot) {
        if (parseInt(slot.closest('.row').dataset.row) === currentTry) {
            slot.style.backgroundColor = '';
            slot.dataset.color = '';
            slot.classList.remove('placed');
            slot.style.border = '3px dashed #777'; // Reset border to dashed with updated thickness
        }
    }

    function generateSecretCode() {
        secretCode = [];
        let availableColorNames = COLORS.map(color => color.name);

        for (let i = 0; i < CODE_LENGTH; i++) {
            const randomIndex = Math.floor(Math.random() * availableColorNames.length);
            const colorName = availableColorNames[randomIndex];
            secretCode.push(colorName);
            if (!allowDuplicates) {
                availableColorNames.splice(randomIndex, 1);
            }
        }
        console.log("Secret Code (for debugging):", secretCode);
    }

    function handleDrop(e) {
        const droppedColorName = e.dataTransfer.getData('text/plain');
        const targetSlot = e.target.closest('.slot');
        const parentRow = targetSlot ? targetSlot.closest('.row') : null;

        if (targetSlot && parentRow && parseInt(parentRow.dataset.row) === currentTry) {
            e.preventDefault();
            const colorObj = COLORS.find(c => c.name === droppedColorName);
            if (colorObj) {
                targetSlot.style.backgroundColor = colorObj.hex;
                targetSlot.dataset.color = colorObj.name;
                targetSlot.classList.add('placed');

                if (colorObj.name === 'white' || colorObj.name === 'yellow' || colorObj.name === 'pink') {
                    targetSlot.style.border = '3px solid rgba(0, 0, 0, 0.6)'; // Updated border for light colors
                } else {
                    targetSlot.style.border = '3px solid #3498DB'; // Updated solid border for dark colors
                }
            }
        }
    }

    function checkGuessHandler() {
        const currentRowElement = gameBoard.querySelector(`[data-row='${currentTry}']`);
        const guessSlots = Array.from(currentRowElement.querySelectorAll('.slot'));
        const currentGuess = guessSlots.map(slot => slot.dataset.color);

        if (currentGuess.some(color => !color)) {
            showErrorPopup("Please fill all slots before checking!");
            return;
        }

        const feedbackPegs = Array.from(currentRowElement.querySelectorAll('.feedback-peg'));
        const { correctPosition, correctColor } = getFeedback(currentGuess, secretCode);

        feedbackPegs.forEach(peg => {
            peg.style.backgroundColor = '';
            peg.style.border = '1px solid rgba(255, 255, 255, 0.4)'; // Updated border for feedback pegs
        });

        let feedbackIndex = 0;
        for (let i = 0; i < correctPosition; i++) {
            feedbackPegs[feedbackIndex].style.backgroundColor = '#E74C3C'; // Red for correct position
            feedbackPegs[feedbackIndex].style.border = '1px solid #C0392B';
            feedbackIndex++;
        }
        for (let i = 0; i < correctColor; i++) {
            feedbackPegs[feedbackIndex].style.backgroundColor = '#ECF0F1'; // White for correct color, wrong position
            feedbackPegs[feedbackIndex].style.border = '1px solid #BDC3C7';
            feedbackIndex++;
        }

        if (correctPosition === CODE_LENGTH) {
            messageElement.textContent = "Congratulations! You guessed the code!";
            checkButton.disabled = true;
            showWinPopup(currentTry + 1); // Pass tries taken to showWinPopup
        } else {
            currentTry++;
            if (currentTry < MAX_TRIES) {
                messageElement.textContent = `Try ${currentTry + 1} of ${MAX_TRIES}.`;
                updateActiveRowHighlight();
            } else {
                messageElement.textContent = "Game Over! You ran out of tries.";
                checkButton.disabled = true;
                showLosePopup();
            }
        }
    }

    function getFeedback(guess, secret) {
        let correctPosition = 0;
        let correctColor = 0;
        const secretCopy = [...secret]; // Create a copy to modify

        // First pass: check for correct color and correct position (red pegs)
        for (let i = 0; i < CODE_LENGTH; i++) {
            if (guess[i] === secretCopy[i]) {
                correctPosition++;
                guess[i] = null; // Mark as used
                secretCopy[i] = null; // Mark as used
            }
        }

        // Second pass: check for correct color, wrong position (white pegs)
        for (let i = 0; i < CODE_LENGTH; i++) {
            if (guess[i] !== null) { // If not already counted as correct position
                const secretIndex = secretCopy.indexOf(guess[i]);
                if (secretIndex > -1) {
                    correctColor++;
                    secretCopy[secretIndex] = null; // Mark as used
                }
            }
        }
        return { correctPosition, correctColor };
    }
});