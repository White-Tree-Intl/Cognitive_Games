// static/js/psychomotor_vigilance_game.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const gameTitle = document.getElementById('game-title');
    const instructionsScreen = document.getElementById('instructions-screen');
    const startPracticeBtn = document.getElementById('start-practice-btn');
    const gameArea = document.getElementById('game-area');
    const messageDisplay = document.getElementById('message-display');
    const progressBarContainer = document.querySelector('.progress-bar-container');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progressText');
    const phaseOverlay = document.getElementById('phase-transition-overlay');
    const startMainGameBtn = document.getElementById('start-main-game-btn');
    const practiceAgainBtn = document.getElementById('practice-again-btn');
    const endGameScreen = document.getElementById('end-game-screen');


    // --- Game Configuration (from PDF) ---
    const STAGES = [
        { phase: 'Learning', stage: 0, trials: 3, hasDistractor: false },
        { phase: 'Testing', stage: 1, trials: 8, hasDistractor: false },
        { phase: 'Testing', stage: 2, trials: 4, hasDistractor: true },
        { phase: 'Testing', stage: 3, trials: 8, hasDistractor: false },
        { phase: 'Testing', stage: 4, trials: 4, hasDistractor: true }
    ];
    const STIMULUS_TIMEOUT = 5000; // ms
    const ITI = 1500; // Inter-Trial Interval

    // --- Game State ---
    let trialList = [];
    let currentTrialIndex = 0;
    let rawData = [];
    let trialTimeout;
    let startTime;
    let isPractice = true;

    // --- Event Listeners ---
    startPracticeBtn.addEventListener('click', () => startGame(true));
    startMainGameBtn.addEventListener('click', () => startGame(false));
    practiceAgainBtn.addEventListener('click', () => {
        phaseOverlay.style.display = 'none';
        startGame(true);
    });

    // --- Game Flow ---
    function buildTrialList(practice) {
        trialList = [];
        const relevantStages = practice
            ? STAGES.filter(s => s.phase === 'Learning')
            : STAGES.filter(s => s.phase === 'Testing');

        for (const stage of relevantStages) {
            for (let i = 0; i < stage.trials; i++) {
                trialList.push({
                    stage: stage.stage,
                    hasDistractor: stage.hasDistractor,
                    isPractice: practice
                });
            }
        }
    }

    function startGame(practice) {
        isPractice = practice;
        buildTrialList(isPractice);
        currentTrialIndex = 0;
        if (!isPractice) {
            rawData = [];
        }

        instructionsScreen.style.display = 'none';
        phaseOverlay.style.display = 'none';
        progressBarContainer.style.display = 'flex';
        gameArea.style.display = 'block';
        endGameScreen.style.display = 'none';
        gameTitle.style.display = 'block';

        gameTitle.textContent = isPractice ? window.STRINGS.practice_round_title : window.STRINGS.main_game_title;

        runNextTrial();
    }

    async function runNextTrial() {
        if (currentTrialIndex >= trialList.length) {
            endPhase();
            return;
        }

        updateProgressBar();
        gameArea.innerHTML = ''; // Clear previous stimuli

        await new Promise(res => setTimeout(res, ITI));

        const trial = trialList[currentTrialIndex];
        const trialInfo = { ...trial, responseTime: null, responseType: 'omission' };

        // Create and place circle (target)
        const circle = document.createElement('div');
        circle.className = 'pvt-stimulus pvt-circle';
        const circleRect = placeStimulus(circle);

        // Use touchend for mobile to avoid misclicks while dragging finger
        circle.addEventListener('touchend', () => handleResponse('correct', trialInfo));
        circle.addEventListener('click', () => handleResponse('correct', trialInfo));

        // Create and place hexagon (distractor) if needed
        if (trial.hasDistractor) {
            const hexagon = document.createElement('div');
            hexagon.className = 'pvt-stimulus pvt-hexagon';
            placeStimulus(hexagon, [circleRect]);
            hexagon.addEventListener('touchend', () => handleResponse('commission', trialInfo));
            hexagon.addEventListener('click', () => handleResponse('commission', trialInfo));
        }

        // Add listener for inaccurate clicks on the background
        const bgClickHandler = (e) => {
             if (e.target === gameArea) {
                handleResponse('inaccurate', trialInfo);
            }
        };
        gameArea.addEventListener('click', bgClickHandler);


        startTime = performance.now();
        trialTimeout = setTimeout(() => {
            gameArea.removeEventListener('click', bgClickHandler);
            handleResponse('omission', trialInfo);
        }, STIMULUS_TIMEOUT);
    }

    function handleResponse(responseType, trialInfo) {
        // Prevent multiple responses for the same trial
        if (trialInfo.responseTime !== null) return;

        clearTimeout(trialTimeout);
        trialInfo.responseTime = performance.now() - startTime;
        trialInfo.responseType = responseType;

        if (!trialInfo.isPractice) {
            rawData.push(trialInfo);
        }

        currentTrialIndex++;
        // Brief visual feedback
        gameArea.style.backgroundColor = '#f0f8ff';
        setTimeout(() => {
            gameArea.style.backgroundColor = 'white';
            runNextTrial();
        }, 200);
    }

    function endPhase() {
        gameArea.style.display = 'none';
        if (isPractice) {
            phaseOverlay.style.display = 'flex';
        } else {
            endGame();
        }
    }

    function endGame() {
        progressBarContainer.style.display = 'none';
        gameTitle.style.display = 'none';
        endGameScreen.style.display = 'block';

        calculateAndSaveResults();
        messageDisplay.textContent = window.STRINGS.task_finished_title;
        let completedGames = JSON.parse(localStorage.getItem('completedGames')) || [];
        if (!completedGames.includes('PVT')) {
            completedGames.push('PVT');
            localStorage.setItem('completedGames', JSON.stringify(completedGames));
        }
    }


    // --- Results Calculation ---
    function calculateAndSaveResults() {
        const lowDemandStages = [1, 3];
        const highDemandStages = [2, 4];

        const lowDemandTrials = rawData.filter(t => lowDemandStages.includes(t.stage));
        const highDemandTrials = rawData.filter(t => highDemandStages.includes(t.stage));

        const correctLowDemand = lowDemandTrials.filter(t => t.responseType === 'correct');
        const correctHighDemand = highDemandTrials.filter(t => t.responseType === 'correct');
        const correctAll = [...correctLowDemand, ...correctHighDemand];

        const omissionLowDemand = lowDemandTrials.filter(t => t.responseType === 'omission');
        const omissionHighDemand = highDemandTrials.filter(t => t.responseType === 'omission');

        const safePercentage = (num, den) => den > 0 ? (num / den) * 100 : 0;
        const getAverage = arr => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

        const finalResults = {
            accuracy: safePercentage(correctAll.length, rawData.length),
            accuracy_in_low_demand: safePercentage(correctLowDemand.length, lowDemandTrials.length),
            accuracy_in_high_demand: safePercentage(correctHighDemand.length, highDemandTrials.length),
            response_time: getAverage(correctAll.map(t => t.responseTime)),
            response_time_in_low_demand: getAverage(correctLowDemand.map(t => t.responseTime)),
            response_time_in_high_demand: getAverage(correctHighDemand.map(t => t.responseTime)),
            omission_errors: omissionLowDemand.length + omissionHighDemand.length,
            omission_errors_in_low_demand: omissionLowDemand.length,
            omission_errors_in_high_demand: omissionHighDemand.length,
            omission_errors_percentage: safePercentage(omissionLowDemand.length + omissionHighDemand.length, rawData.length),
            commission_errors: rawData.filter(t => t.responseType === 'commission').length,
            inaccurate_clicks: rawData.filter(t => t.responseType === 'inaccurate').length
        };

        localStorage.setItem('gameData_PVT', JSON.stringify(rawData));
        localStorage.setItem('gameResults_PVT', JSON.stringify(finalResults));
        console.log("Final PVT Results:", finalResults);
    }

    // --- UI Helper Functions ---
    function placeStimulus(element, existingRects = []) {
        const areaRect = gameArea.getBoundingClientRect();
        const stimSize = 80;
        const margin = 3;
        let attempts = 0;
        let newRect;

        while (attempts < 50) {
            const x = Math.random() * (areaRect.width - stimSize);
            const y = Math.random() * (areaRect.height - stimSize);

            // These coordinates are always relative to the game area, which is correct.
            newRect = { x, y, width: stimSize, height: stimSize, left: x, top: y, right: x + stimSize, bottom: y + stimSize };

            // The comparison now works correctly because both coordinates (r and newRect) are relative.
            let overlaps = existingRects.some(r =>
                newRect.left < r.right + margin &&
                newRect.right > r.left - margin &&
                newRect.top < r.bottom + margin &&
                newRect.bottom > r.top - margin
            );

            if (!overlaps) {
                element.style.left = `${x}px`;
                element.style.top = `${y}px`;
                gameArea.appendChild(element);
                // *** The key change is here: return the relative coordinates instead of viewport-based ones. ***
                return newRect;
            }
            attempts++;
        }

        // Fallback: If a suitable position isn't found, place it in a random spot.
        const fallbackX = Math.random() * (areaRect.width - stimSize);
        const fallbackY = Math.random() * (areaRect.height - stimSize);
        element.style.left = `${fallbackX}px`;
        element.style.top = `${fallbackY}px`;
        gameArea.appendChild(element);
        // We must also return the relative coordinates here.
        return { x: fallbackX, y: fallbackY, width: stimSize, height: stimSize, left: fallbackX, top: fallbackY, right: fallbackX + stimSize, bottom: fallbackY + stimSize };
    }

    function updateProgressBar() {
        const progress = (currentTrialIndex / trialList.length) * 100;
        progressBarFill.style.width = `${progress}%`;
        progressText.textContent = `${currentTrialIndex} / ${trialList.length}`;
    }
});
