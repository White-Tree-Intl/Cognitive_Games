// static/js/digit_span_game.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const gameTitle = document.getElementById('game-title');
    const instructionsScreen = document.getElementById('instructions-screen');
    const startGameBtn = document.getElementById('start-game-btn');
    const gameArea = document.getElementById('game-area');
    const numberPad = document.getElementById('number-pad');
    const turnDisplay = document.getElementById('turn-display');
    const digitDisplay = document.getElementById('digit-display');
    const feedbackIcon = document.getElementById('feedback-icon');
    const userSequenceDisplay = document.getElementById('user-sequence-display');
    const messageDisplay = document.getElementById('message-display');
    const progressBarContainer = document.querySelector('.progress-bar-container');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progressText');
    const phaseOverlay = document.getElementById('phase-transition-overlay');
    const startMainGameBtn = document.getElementById('start-main-game-btn');
    const practiceAgainBtn = document.getElementById('practice-again-btn');

    // --- Game Configuration ---
    const MIN_DIGITS = 2;
    const MAX_DIGITS = 10;
    const PRACTICE_DIGITS = 2;
    const DISPLAY_DURATION = 1000; // ms for each digit to be on screen
    const ITI = 1500; // Inter-Trial Interval
    const RESPONSE_TIMEOUT_DURATION = 10000; // 10 seconds

    // --- Game State ---
    let isPractice = true;
    let currentSequenceLength = MIN_DIGITS;
    let attempt = 1;
    let currentSequence = [];
    let userAnswer = [];
    let allStageData = [];
    let digitResponseTimes = [];
    let stageStartTime;
    let responseTimeout;
    let omissionErrorsCount = 0;

    // --- Event Listeners ---
    startGameBtn.addEventListener('click', () => startGame(true));
    startMainGameBtn.addEventListener('click', () => startGame(false));
    practiceAgainBtn.addEventListener('click', () => {
        phaseOverlay.style.display = 'none';
        startGame(true);
    });

    // --- Game Flow ---
    function startGame(practice) {
        isPractice = practice;
        instructionsScreen.style.display = 'none';
        phaseOverlay.style.display = 'none';
        progressBarContainer.style.display = 'flex';
        gameArea.style.display = 'flex';
        numberPad.style.display = 'grid';
        messageDisplay.textContent = '';
        gameTitle.textContent = isPractice ? window.STRINGS.practice_round_title : window.STRINGS.main_game_title;

        if (isPractice) {
            currentSequenceLength = PRACTICE_DIGITS;
            attempt = 1;
        } else {
            currentSequenceLength = MIN_DIGITS;
            attempt = 1;
            allStageData = [];
            omissionErrorsCount = 0;
        }

        generateNumberPad();
        runNextStage();
    }

    async function runNextStage() {
        updateProgressBar();
        userAnswer = [];
        digitResponseTimes = [];
        updateUserSequenceDisplay();
        toggleNumpad(false);

        turnDisplay.textContent = window.STRINGS.computers_turn;
        digitDisplay.textContent = '';
        messageDisplay.textContent = '';

        await new Promise(res => setTimeout(res, ITI));

        if (attempt === 1) {
            currentSequence = generateSequence(currentSequenceLength);
        }

        for (const digit of currentSequence) {
            digitDisplay.textContent = digit;
            await new Promise(res => setTimeout(res, DISPLAY_DURATION));
            digitDisplay.textContent = '';
            await new Promise(res => setTimeout(res, 200));
        }

        startUserTurn();
    }

    function startUserTurn() {
        turnDisplay.textContent = window.STRINGS.your_turn;
        toggleNumpad(true);
        stageStartTime = performance.now();
        // Start a timer for the user to respond
        responseTimeout = setTimeout(handleTimeout, RESPONSE_TIMEOUT_DURATION);
    }

    function handleTimeout() {
        clearTimeout(responseTimeout);
        toggleNumpad(false);
        messageDisplay.textContent = window.STRINGS.times_up_message;
        showFeedback(false);

        if (!isPractice) {
            omissionErrorsCount++;
            handleIncorrectAttempt('timeout');
        } else {
             setTimeout(() => { phaseOverlay.style.display = 'flex'; }, 1000);
        }
    }


    function handleDigitInput(digit) {
        userAnswer.push(digit);
        digitResponseTimes.push(performance.now() - stageStartTime);
        stageStartTime = performance.now();
        updateUserSequenceDisplay();
    }

    function handleSubmit() {
        clearTimeout(responseTimeout); // Stop the timer
        toggleNumpad(false);
        const isCorrect = userAnswer.join('') === currentSequence.join('');

        showFeedback(isCorrect);

        if (isPractice) {
            setTimeout(() => { phaseOverlay.style.display = 'flex'; }, 1000);
            return;
        }

        // --- Main Game Logic ---
        if (isCorrect) {
            messageDisplay.textContent = window.STRINGS.correct_message;
            allStageData.push({
                sequenceLength: currentSequenceLength,
                attempt: attempt,
                responseTimes: digitResponseTimes,
                isCorrect: true
            });

            attempt = 1;
            currentSequenceLength++;

            if (currentSequenceLength > MAX_DIGITS) {
                endGame(true);
            } else {
                setTimeout(runNextStage, ITI);
            }
        } else {
            handleIncorrectAttempt('incorrect_input');
        }
    }

    function handleIncorrectAttempt(reason) {
        if (!isPractice) {
            allStageData.push({
                sequenceLength: currentSequenceLength,
                attempt: attempt,
                responseTimes: digitResponseTimes,
                isCorrect: false,
                reason: reason
            });
        }

        attempt++;
        if (attempt > 2) {
            endGame(false);
        } else {
            if(reason !== 'timeout') {
                messageDisplay.textContent = window.STRINGS.incorrect_message;
            }
            setTimeout(runNextStage, ITI);
        }
    }


    function endGame(completedSuccessfully) {
        gameArea.style.display = 'none';
        numberPad.style.display = 'none';
        turnDisplay.textContent = '';

        if (!completedSuccessfully) {
             messageDisplay.textContent = window.STRINGS.game_over_fail_message;
        } else {
             messageDisplay.textContent = window.STRINGS.task_finished_title;
        }
        gameTitle.textContent = window.STRINGS.task_finished_title;

        calculateAndSaveResults();

        let completedGames = JSON.parse(localStorage.getItem('completedGames')) || [];
        if (!completedGames.includes('DST')) {
            completedGames.push('DST');
            localStorage.setItem('completedGames', JSON.stringify(completedGames));
        }
    }

    function calculateAndSaveResults() {
        const correctStages = allStageData.filter(s => s.isCorrect);
        const memory_span = correctStages.length > 0 ? Math.max(...correctStages.map(s => s.sequenceLength)) : 0;

        const allCorrectResponseTimes = correctStages.flatMap(s => s.responseTimes);
        const response_time = allCorrectResponseTimes.length > 0 ? allCorrectResponseTimes.reduce((a, b) => a + b, 0) / allCorrectResponseTimes.length : 0;

        const totalAttemptsForCorrect = correctStages.reduce((sum, s) => sum + s.attempt, 0);
        const average_number_of_trials_in_correct_series = correctStages.length > 0 ? totalAttemptsForCorrect / correctStages.length : 1;

        const finalResults = {
            memory_span,
            response_time,
            omission_errors: omissionErrorsCount,
            average_number_of_trials_in_correct_series
        };

        localStorage.setItem('gameData_DST', JSON.stringify(allStageData));
        localStorage.setItem('gameResults_DST', JSON.stringify(finalResults));
        console.log("Final DST Results:", finalResults);
    }

    // --- UI Helper Functions ---
    function generateNumberPad() {
        numberPad.innerHTML = '';
        const buttons = {};

        for (let i = 0; i <= 9; i++) {
            const button = document.createElement('button');
            button.textContent = i;
            button.classList.add('game-button');
            button.onclick = () => handleDigitInput(i);
            buttons[i] = button;
        }

        const clearBtn = document.createElement('button');
        clearBtn.textContent = window.STRINGS.clear_button;
        clearBtn.classList.add('game-button', 'control-btn', 'clear-btn');
        clearBtn.onclick = () => {
            userAnswer = [];
            digitResponseTimes = [];
            updateUserSequenceDisplay();
        };
        buttons['clear'] = clearBtn;

        const submitBtn = document.createElement('button');
        submitBtn.textContent = window.STRINGS.submit_button;
        submitBtn.classList.add('game-button', 'control-btn', 'submit-btn');
        submitBtn.onclick = handleSubmit;
        buttons['submit'] = submitBtn;

        const layout = [
            7, 8, 9,
            4, 5, 6,
            1, 2, 3,
            'clear', 0, 'submit'
        ];

        layout.forEach(key => {
            numberPad.appendChild(buttons[key]);
        });
    }

    function updateUserSequenceDisplay() {
        userSequenceDisplay.textContent = userAnswer.join(' ');
    }

    function toggleNumpad(enable) {
        const buttons = numberPad.querySelectorAll('button');
        buttons.forEach(btn => btn.disabled = !enable);
    }

    function showFeedback(isCorrect) {
        feedbackIcon.textContent = isCorrect ? '✓' : '✗';
        feedbackIcon.className = isCorrect ? 'feedback-icon correct' : 'feedback-icon incorrect';
        feedbackIcon.style.display = 'block';
        setTimeout(() => { feedbackIcon.style.display = 'none'; }, 1000);
    }

    function generateSequence(length) {
        const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        let sequence = [];
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * digits.length);
            sequence.push(digits[randomIndex]);
        }
        return sequence;
    }

    function updateProgressBar() {
        if(isPractice) {
            progressBarFill.style.width = '0%';
            progressText.textContent = `Practice`;
            return;
        }
        const totalStages = MAX_DIGITS - MIN_DIGITS + 1;
        const completedStages = currentSequenceLength - MIN_DIGITS;
        const progress = (completedStages / totalStages) * 100;
        progressBarFill.style.width = `${progress}%`;
        progressText.textContent = `Stage ${completedStages + 1} / ${totalStages}`;
    }
});

