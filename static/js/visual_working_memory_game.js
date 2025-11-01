// static/js/visual_working_working_memory_game.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const instructionsScreen = document.getElementById('instructions-screen');
    const startGameBtn = document.getElementById('start-game-btn');
    const gameArea = document.getElementById('game-area');
    const circlesContainer = document.getElementById('circles-container');
    const turnDisplay = document.getElementById('turn-display');
    const messageDisplay = document.getElementById('message-display');
    const progressBarContainer = document.querySelector('.progress-bar-container');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progressText');
    const delayOverlay = document.getElementById('delay-overlay');
    const phaseOverlay = document.getElementById('phase-transition-overlay');
    const startMainGameBtn = document.getElementById('start-main-game-btn');
    const practiceAgainBtn = document.getElementById('practice-again-btn');
    const endGameScreen = document.getElementById('end-game-screen'); // Target the dedicated end screen
    const messageDisplayEnd = document.getElementById('message-display-end'); // Target the message inside end screen

    // --- Game Configuration ---
    const NUM_CIRCLES = 10;
    const MIN_SEQUENCE = 2;
    const MAX_SEQUENCE = 10;
    const PRACTICE_SEQUENCE = 2;
    const LIGHT_UP_DURATION = 800;
    const PAUSE_BETWEEN_LIGHTS = 200;
    const DELAY_DURATION = 4000;
    const RESPONSE_TIMEOUT = 10000;

    // --- Game State ---
    let currentPhase = 1; // 1 or 2
    let isPractice = true;
    let sequenceLength = MIN_SEQUENCE;
    let attempt = 1;
    let currentSequence = [];
    let userAnswer = [];
    let allPhaseData = { 1: [], 2: [] };
    let responseTimer;
    let clickTimestamps = [];
    let omissionErrorsCount = 0;
    let gameStartTime; // Store the start time of the response phase

    // --- Event Listeners ---
    startGameBtn.addEventListener('click', () => startGame(true));
    startMainGameBtn.addEventListener('click', () => {
        phaseOverlay.style.display = 'none';
        startGame(false);
    });
    practiceAgainBtn.addEventListener('click', () => {
        phaseOverlay.style.display = 'none';
        startGame(true);
    });

    // --- Game Flow ---
    function startGame(practice) {
        isPractice = practice;
        instructionsScreen.style.display = 'none';
        phaseOverlay.style.display = 'none';
        endGameScreen.style.display = 'none'; // Hide end screen
        progressBarContainer.style.display = 'flex';
        gameArea.style.display = 'flex';
        messageDisplay.textContent = ''; // Clear message display

        if (isPractice) {
            sequenceLength = PRACTICE_SEQUENCE;
            currentPhase = 1;
            turnDisplay.textContent = window.STRINGS.practice_round_title;
        } else {
            currentPhase = 1;
            sequenceLength = MIN_SEQUENCE;
            allPhaseData = { 1: [], 2: [] };
            omissionErrorsCount = 0;
            turnDisplay.textContent = window.STRINGS.phase_1_title;
        }
        attempt = 1;

        createCircles();
        runNextStage();
    }

    async function runNextStage() {
        updateProgressBar();
        userAnswer = [];
        clickTimestamps = [];
        toggleCircles(false, true);

        turnDisplay.textContent = isPractice ? window.STRINGS.practice_round_title : window.STRINGS[`phase_${currentPhase}_title`];
        await new Promise(res => setTimeout(res, 500));
        turnDisplay.textContent = window.STRINGS.computers_turn;
        await new Promise(res => setTimeout(res, 1500));

        if (attempt === 1) {
            currentSequence = generateSequence(sequenceLength);
        }

        // Light up sequence
        for (const circleId of currentSequence) {
            const circle = circlesContainer.querySelector(`[data-id='${circleId}']`);
            circle.classList.add('lit');
            await new Promise(res => setTimeout(res, LIGHT_UP_DURATION));
            circle.classList.remove('lit');
            await new Promise(res => setTimeout(res, PAUSE_BETWEEN_LIGHTS));
        }

        startUserTurn();
    }

    async function startUserTurn() {
        delayOverlay.style.display = 'none';

        if (!isPractice && currentPhase === 2) {
            delayOverlay.style.display = 'flex';
            await new Promise(res => setTimeout(res, DELAY_DURATION));
            delayOverlay.style.display = 'none'; // Hide overlay after delay
        }

        turnDisplay.textContent = window.STRINGS.your_turn;
        toggleCircles(true, false); // Enable circles
        gameStartTime = performance.now(); // Record start of response window

        responseTimer = setTimeout(() => handleResponse(false, 'timeout'), RESPONSE_TIMEOUT);
    }

    function handleCircleClick(e) {
        const circle = e.target.closest('.vwm-circle');
        if (!circle || circle.disabled) return;

        clearTimeout(responseTimer);

        const clickedId = parseInt(circle.dataset.id);
        userAnswer.push(clickedId);
        clickTimestamps.push(performance.now());

        const isCorrectClick = currentSequence[userAnswer.length - 1] === clickedId;

        // Show immediate click feedback (correct/incorrect class is added during response handling)
        circle.classList.add('lit');
        setTimeout(() => circle.classList.remove('lit'), 100);


        if (!isCorrectClick) {
            handleResponse(false, 'error');
        } else if (userAnswer.length === currentSequence.length) {
            handleResponse(true, 'success');
        } else {
            responseTimer = setTimeout(() => handleResponse(false, 'timeout'), RESPONSE_TIMEOUT);
        }
    }

    function handleResponse(isCorrect, reason) {
        clearTimeout(responseTimer);
        toggleCircles(false, false);

        // Apply final visual feedback (Correct all squares or highlight mistakes)
        const circles = circlesContainer.querySelectorAll('.vwm-circle');
        circles.forEach(c => {
            const id = parseInt(c.dataset.id);
            const indexInUserAnswer = userAnswer.indexOf(id);

            if (isCorrect) {
                // If correct, light up all clicked ones with 'correct' color
                 if (currentSequence.includes(id)) {
                    c.classList.add('correct');
                }
            } else {
                // If incorrect, highlight mistakes
                if (indexInUserAnswer !== -1) {
                    // Check if the user's click at this position was wrong
                    if (currentSequence[indexInUserAnswer] !== id) {
                        c.classList.add('incorrect');
                    }
                }
            }
        });

        messageDisplay.textContent = isCorrect ? window.STRINGS.correct_message : window.STRINGS.incorrect_message;
        turnDisplay.textContent = '';

        if (reason === 'timeout') {
            omissionErrorsCount++;
            messageDisplay.textContent = window.STRINGS.times_up_message;
        }

        // --- Main Game Logic ---
        if (isPractice) {
            setTimeout(() => {
                messageDisplay.textContent = '';
                // Clear visuals before showing overlay
                toggleCircles(false, true);
                phaseOverlay.style.display = 'flex';
            }, 1500);
            return;
        }

        if (!isCorrect) {
            // Record error trial
            allPhaseData[currentPhase].push({
                sequenceLength,
                attempt,
                isCorrect: false,
                reason: reason,
                responseTimes: getResponseTimes()
            });

            attempt++;

            if (attempt > 2) {
                moveToNextPhase(false); // Fail the phase/game
            } else {
                setTimeout(() => {
                    messageDisplay.textContent = '';
                    toggleCircles(false, true);
                    runNextStage();
                }, 1500);
            }
        } else { // Correct
            // Record successful trial
            allPhaseData[currentPhase].push({
                sequenceLength,
                attempt: attempt,
                isCorrect: true,
                responseTimes: getResponseTimes()
            });

            attempt = 1;
            sequenceLength++;

            if (sequenceLength > MAX_SEQUENCE) {
                moveToNextPhase(true); // Complete the phase/game
            } else {
                setTimeout(() => {
                    messageDisplay.textContent = '';
                    toggleCircles(false, true);
                    runNextStage();
                }, 1500);
            }
        }
    }

    function moveToNextPhase(phaseCompleted) {
        if (currentPhase === 1) {
            currentPhase = 2;
            messageDisplay.textContent = window.STRINGS.get_ready_for_main_test;
            setTimeout(() => {
                messageDisplay.textContent = '';
                sequenceLength = MIN_SEQUENCE;
                attempt = 1;
                toggleCircles(false, true);
                runNextStage();
            }, 2000);
        } else {
            endGame(phaseCompleted); // End the entire game
        }
    }

    // FIX 1: Updated endGame function to correctly use the HTML's end screen structure
    function endGame(completedSuccessfully) {
        gameArea.style.display = 'none';
        progressBarContainer.style.display = 'none';
        messageDisplay.style.display = 'none'; // Hide in-game message

        const results = calculateAndSaveResults();

        // Use the dedicated message display for the end screen
        messageDisplayEnd.textContent = completedSuccessfully
            ? window.STRINGS.task_finished_title
            : window.STRINGS.game_over_fail_message;

        // Display results details
        const getLongestSequence = (phaseData) => {
            const correctStages = phaseData.filter(s => s.isCorrect);
            return correctStages.length > 0 ? Math.max(...correctStages.map(s => s.sequenceLength)) : 0;
        };

        messageDisplayEnd.innerHTML += `
            <br><p>${window.STRINGS.memory_span_label || 'Memory Span'}: <strong>${(getLongestSequence(allPhaseData[1]) + getLongestSequence(allPhaseData[2]))/2}</strong></p>
            <p>${window.STRINGS.phase_1_title || 'Phase 1'}: ${getLongestSequence(allPhaseData[1])}</p>
            <p>${window.STRINGS.phase_2_title || 'Phase 2'}: ${getLongestSequence(allPhaseData[2])}</p>
            <p>${window.STRINGS.average_rt_label || 'Avg. Response Time'}: ${results.response_time.toFixed(2)} ms</p>
        `;

        endGameScreen.style.display = 'block'; // Show dedicated end screen

        let completedGames = JSON.parse(localStorage.getItem('completedGames')) || [];
        if (!completedGames.includes('VWM')) {
            completedGames.push('VWM');
            localStorage.setItem('completedGames', JSON.stringify(completedGames));
        }
    }

    // --- Results Calculation ---
    function getAverage(arr) {
        return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    }

    function calculateAndSaveResults() {
        const correctSeriesData = [...allPhaseData[1], ...allPhaseData[2]].filter(s => s.isCorrect);
        const allCorrectResponseTimes = correctSeriesData.flatMap(s => s.responseTimes);
        const response_time = getAverage(allCorrectResponseTimes.filter(t => t > 0)); // Filter out any zero or negative RTs

        const getLongestSequence = (phaseData) => {
            const correctStages = phaseData.filter(s => s.isCorrect);
            return correctStages.length > 0 ? Math.max(...correctStages.map(s => s.sequenceLength)) : 0;
        };

        const memory_span_phase_1 = getLongestSequence(allPhaseData[1]);
        const memory_span_phase_2 = getLongestSequence(allPhaseData[2]);
        const memory_span = (memory_span_phase_1 + memory_span_phase_2) / 2;

        const totalAttemptsForCorrect = correctSeriesData.reduce((sum, s) => sum + s.attempt, 0);
        const average_number_of_trials_in_correct_series = correctSeriesData.length > 0 ? totalAttemptsForCorrect / correctSeriesData.length : 1;

        const finalResults = {
            memory_span,
            memory_span_in_phase_1,
            memory_span_in_phase_2,
            response_time,
            omission_errors: omissionErrorsCount,
            average_number_of_trials_in_correct_series
        };

        localStorage.setItem('gameData_VWM', JSON.stringify(allPhaseData));
        localStorage.setItem('gameResults_VWM', JSON.stringify(finalResults));
        console.log("Final VWM Results:", finalResults);
        return finalResults;
    }

    // --- UI Helper Functions ---
    function createCircles() {
        circlesContainer.innerHTML = '';
        const createdPositions = []; // Array to store created positions
        const CIRCLE_DIAMETER = 60;  // Must match the CSS size
        const PADDING = 10; // Distance from the container edges
        const MIN_DISTANCE = CIRCLE_DIAMETER + 10; // Minimum center-to-center distance for circles

        // Calculate container dimensions to spawn circles
        const containerRect = circlesContainer.getBoundingClientRect();

        // Usable area for the circle's center
        const spawnWidth = containerRect.width - (PADDING * 2) - CIRCLE_DIAMETER;
        const spawnHeight = containerRect.height - (PADDING * 2) - CIRCLE_DIAMETER;

        if (spawnWidth <= 0 || spawnHeight <= 0) {
            console.error("Circle container is too small to spawn circles.");
            return;
        }

        for (let i = 0; i < NUM_CIRCLES; i++) {
            const circle = document.createElement('button');
            circle.className = 'vwm-circle';
            circle.dataset.id = i;
            circle.addEventListener('click', handleCircleClick);

            let newPos;
            let attempts = 0;
            let overlaps;

            // Try to find a non-overlapping position
            do {
                overlaps = false;
                // Generate a random position
                newPos = {
                    // + PADDING + (CIRCLE_DIAMETER / 2)
                    left: Math.random() * spawnWidth + PADDING + (CIRCLE_DIAMETER / 2),
                    top: Math.random() * spawnHeight + PADDING + (CIRCLE_DIAMETER / 2)
                };

                // Check if it overlaps with previous circles
                for (const pos of createdPositions) {
                    const distance = Math.sqrt(
                        Math.pow(pos.left - newPos.left, 2) + Math.pow(pos.top - newPos.top, 2)
                    );
                    if (distance < MIN_DISTANCE) {
                        overlaps = true; // It overlaps
                        break;
                    }
                }
                attempts++;
            } while (overlaps && attempts < 100); // Try 100 times

            // Apply the final position (subtract half diameter for centering)
            circle.style.left = `${newPos.left - (CIRCLE_DIAMETER / 2)}px`;
            circle.style.top = `${newPos.top - (CIRCLE_DIAMETER / 2)}px`;

            createdPositions.push(newPos); // Save the position for subsequent checks
            circlesContainer.appendChild(circle);
        }
    }

    function toggleCircles(enabled, resetVisuals) {
        const circles = circlesContainer.querySelectorAll('.vwm-circle');
        circles.forEach(c => {
            c.disabled = !enabled;
            if (resetVisuals) {
                // Keep only the base class
                c.className = 'vwm-circle';
            }
        });
    }

    function generateSequence(length) {
        const ids = Array.from({ length: NUM_CIRCLES }, (_, i) => i);
        let sequence = [];
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * ids.length);
            sequence.push(ids.splice(randomIndex, 1)[0]);
        }
        return sequence;
    }

    function getResponseTimes() {
        if (clickTimestamps.length < 1) return [];
        const times = [];
        // First RT is time from response start (gameStartTime) to first click
        times.push(clickTimestamps[0] - gameStartTime);

        // Subsequent RTs are inter-click intervals
        for (let i = 1; i < clickTimestamps.length; i++) {
            times.push(clickTimestamps[i] - clickTimestamps[i - 1]);
        }
        // Filter out any negative or extremely large (indicating error in logic) times for safe average calculation later
        return times.filter(t => t > 0 && t < RESPONSE_TIMEOUT);
    }


    function updateProgressBar() {
        if(isPractice) {
            progressBarFill.style.width = '0%';
            progressText.textContent = window.STRINGS.practice_round_title;
            return;
        }
        // Assuming two phases, each running from MIN_SEQUENCE to MAX_SEQUENCE
        const totalLevels = (MAX_SEQUENCE - MIN_SEQUENCE + 1) * 2;
        const currentLevel = (currentPhase - 1) * (MAX_SEQUENCE - MIN_SEQUENCE + 1) + (sequenceLength - MIN_SEQUENCE);
        const progress = (currentLevel / totalLevels) * 100;

        progressBarFill.style.width = `${progress}%`;
        progressText.textContent = `${window.STRINGS[`phase_${currentPhase}_title`]} (${sequenceLength}/${MAX_SEQUENCE})`;
    }
});
