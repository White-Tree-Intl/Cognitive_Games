// static/js/ior_game.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const gameTitle = document.getElementById('game-title');
    const instructionsScreen = document.getElementById('instructions-screen');
    const startPracticeBtn = document.getElementById('start-practice-btn');
    const gameArea = document.getElementById('game-area');
    const responseButtons = document.getElementById('response-buttons');
    const leftCircle = document.getElementById('left-circle');
    const rightCircle = document.getElementById('right-circle');
    const fixationPoint = document.getElementById('fixation-point');
    const leftButton = document.getElementById('left-button');
    const rightButton = document.getElementById('right-button');
    const messageDisplay = document.getElementById('message-display');
    const progressBarContainer = document.querySelector('.progress-bar-container');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progressText');
    const phaseOverlay = document.getElementById('phase-transition-overlay');
    const startMainGameBtn = document.getElementById('start-main-game-btn');
    const practiceAgainBtn = document.getElementById('practice-again-btn');

    // --- Game Configuration (from PDF & user code) ---
    const FIXATION_TIME = 500;
    const STIM_DURATION = 5000; // Max response time
    const CUE_TO_TARGET_INTERVAL = 200; // Time between cue disappearing and target appearing
    const CUE_DURATION = 750;
    const ITI = 1500; // Inter-Trial Interval

    const PRACTICE_TRIALS = 4;
    const MAIN_TRIALS = 40;

    // --- Game State ---
    let currentTrialIndex = 0;
    let totalTrials = 0;
    let isPractice = true;
    let allTrialData = [];
    let startTime = 0;
    let trialTimeoutId;
    let isWaitingForResponse = false;
    let currentTrialInfo = {};
    let trialList = [];

    // --- Event Listeners ---
    startPracticeBtn.addEventListener('click', () => startGame(true));
    leftButton.addEventListener('click', () => handleResponse('left'));
    rightButton.addEventListener('click', () => handleResponse('right'));
    startMainGameBtn.addEventListener('click', () => {
        phaseOverlay.style.display = 'none';
        startGame(false);
    });
    practiceAgainBtn.addEventListener('click', () => {
        phaseOverlay.style.display = 'none';
        startGame(true);
    });

    // --- Trial List Generation ---
    function generateTrialList(numTrials) {
        const trials = [];
        const half = numTrials / 2;
        for(let i = 0; i < numTrials; i++) {
            const cueSide = Math.random() < 0.5 ? 'left' : 'right';
            // First half are congruent, second half are incongruent
            const isCongruent = i < half;
            const targetSide = isCongruent ? cueSide : (cueSide === 'left' ? 'right' : 'left');
            trials.push({ cueSide, targetSide });
        }
        // Shuffle the list to randomize trial order
        for (let i = trials.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [trials[i], trials[j]] = [trials[j], trials[i]];
        }
        return trials;
    }


    // --- Game Flow Functions ---
    function startGame(practice) {
        isPractice = practice;
        currentTrialIndex = 0;
        totalTrials = isPractice ? PRACTICE_TRIALS : MAIN_TRIALS;
        allTrialData = [];
        trialList = generateTrialList(totalTrials);

        instructionsScreen.style.display = 'none';
        progressBarContainer.style.display = 'flex';
        gameArea.style.display = 'flex';
        responseButtons.style.display = 'flex';
        messageDisplay.innerHTML = '';
        gameTitle.textContent = isPractice ? window.STRINGS.practice_round_title : window.STRINGS.main_game_title;

        runNextTrial();
    }

    async function runNextTrial() {
        if (currentTrialIndex >= totalTrials) {
            endGame();
            return;
        }
        updateProgressBar();
        isWaitingForResponse = false;
        leftButton.disabled = true;
        rightButton.disabled = true;

        // --- Reset visuals for new trial ---
        clearCircles();
        fixationPoint.style.visibility = 'visible';

        // Wait ITI before starting
        await new Promise(res => setTimeout(res, ITI));

        // Step 1: Fixation point '.'
        fixationPoint.textContent = '.';
        await new Promise(res => setTimeout(res, FIXATION_TIME));

        // Step 2: Fixation point '...'
        fixationPoint.textContent = '...';
        await new Promise(res => setTimeout(res, FIXATION_TIME)); // A small delay for this step too

        // Step 3: Yellow dot (cue) appears
        fixationPoint.textContent = '.';
        const { cueSide, targetSide } = trialList[currentTrialIndex];
        drawSmallYellowDot(cueSide);
        await new Promise(res => setTimeout(res, CUE_DURATION));
        clearCircles(); // Yellow dot disappears

        await new Promise(res => setTimeout(res, CUE_TO_TARGET_INTERVAL));

        // Step 4: Green circle (target) appears
        currentTrialInfo = {
            trial: currentTrialIndex + 1,
            isPractice: isPractice,
            cueSide: cueSide,
            targetSide: targetSide,
            isCued: cueSide === targetSide, // True for congruent
            reactionTime: null,
            response: 'none',
            accuracy: 'omission_error'
        };

        getCircleElement(targetSide).classList.add('green-light');
        isWaitingForResponse = true;
        leftButton.disabled = false;
        rightButton.disabled = false;
        startTime = performance.now();

        trialTimeoutId = setTimeout(() => handleResponse('timeout'), STIM_DURATION);
    }

    function handleResponse(side) {
        if (!isWaitingForResponse) return;
        isWaitingForResponse = false;
        clearTimeout(trialTimeoutId);
        leftButton.disabled = true;
        rightButton.disabled = true;

        if (side === 'timeout') {
            currentTrialInfo.accuracy = 'omission_error';
        } else {
            currentTrialInfo.reactionTime = performance.now() - startTime;
            currentTrialInfo.response = side;
            currentTrialInfo.accuracy = (side === currentTrialInfo.targetSide) ? 'correct' : 'incorrect';
        }

        if (!isPractice) {
            allTrialData.push(currentTrialInfo);
        }

        currentTrialIndex++;
        runNextTrial();
    }

    function endGame() {
        gameArea.style.display = 'none';
        responseButtons.style.display = 'none';
        fixationPoint.style.visibility = 'hidden';

        if (isPractice) {
            phaseOverlay.style.display = 'flex';
        } else {
            gameTitle.textContent = window.STRINGS.task_finished_title;
            calculateAndSaveResults();
            messageDisplay.textContent = window.STRINGS.results_saved_message;
            let completedGames = JSON.parse(localStorage.getItem('completedGames')) || [];
            if (!completedGames.includes('IOR')) {
                completedGames.push('IOR');
                localStorage.setItem('completedGames', JSON.stringify(completedGames));
            }
        }
    }

    // --- Results Calculation ---
    function calculateAndSaveResults() {
        if (allTrialData.length === 0) return;

        const correctTrials = allTrialData.filter(t => t.accuracy === 'correct');
        const cuedTrials = correctTrials.filter(t => t.isCued);
        const uncuedTrials = correctTrials.filter(t => !t.isCued);

        const getAverage = arr => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

        const rt_cued = getAverage(cuedTrials.map(t => t.reactionTime));
        const rt_uncued = getAverage(uncuedTrials.map(t => t.reactionTime));
        const ior_effect_rt = rt_cued - rt_uncued;

        const finalResults = {
            accuracy: (correctTrials.length / allTrialData.length) * 100,
            accuracy_cued: (cuedTrials.length / (allTrialData.length / 2)) * 100,
            accuracy_uncued: (uncuedTrials.length / (allTrialData.length / 2)) * 100,
            response_time: getAverage(correctTrials.map(t => t.reactionTime)),
            response_time_cued: rt_cued,
            response_time_uncued: rt_uncued,
            inhibition_of_return_effect_in_response_time: ior_effect_rt,
            omission_errors: allTrialData.filter(t => t.accuracy === 'omission_error').length
        };

        localStorage.setItem('gameData_IOR', JSON.stringify(allTrialData));
        localStorage.setItem('gameResults_IOR', JSON.stringify(finalResults));
        console.log("Final IOR Results:", finalResults);
    }


    // --- Helper Functions ---
    function getCircleElement(side) {
        return side === 'left' ? leftCircle : rightCircle;
    }

    function clearCircles() {
        leftCircle.className = 'ior-circle';
        rightCircle.className = 'ior-circle';
        // Remove any small yellow dots
        const existingDot = leftCircle.querySelector('.small-yellow-dot') || rightCircle.querySelector('.small-yellow-dot');
        if (existingDot) existingDot.remove();
    }

    function drawSmallYellowDot(side) {
        const dot = document.createElement('div');
        dot.className = 'small-yellow-dot';
        getCircleElement(side).appendChild(dot);
    }

    function updateProgressBar() {
        const progress = (currentTrialIndex / totalTrials) * 100;
        progressBarFill.style.width = `${progress}%`;
        progressText.textContent = `${currentTrialIndex} / ${totalTrials}`;
    }
});
