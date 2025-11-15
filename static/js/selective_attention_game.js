// static/js/selective_attention_game.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const startPhaseBtn = document.getElementById('start-phase-btn');
    const startMainGameBtn = document.getElementById('start-main-game-btn');
    const practiceAgainBtn = document.getElementById('practice-again-btn');
    const targetDefinitionOverlay = document.getElementById('target-definition-overlay');
    const phaseTransitionOverlay = document.getElementById('phase-transition-overlay');
    const targetDisplay = document.getElementById('target-display');
    const gameArea = document.getElementById('game-area');
    const stimuliGrid = document.getElementById('stimuli-grid');
    const confirmButton = document.getElementById('confirm-button');
    const infoHeader = document.querySelector('.info-header');
    const responseControls = document.getElementById('response-controls');
    const currentTrialDisplay = document.getElementById('current-trial-display');
    const timeLeftDisplay = document.getElementById('time-left-display');
    const messageDisplay = document.getElementById('message-display');
    const endGameScreen = document.getElementById('end-game-screen');
    const messageDisplayEnd = document.getElementById('message-display-end');

    // --- Game Configuration ---
    // === MODIFICATION START ===
    // 'distractors' for Testing changed from 6 to 15 to make a 25-item grid (10 + 15).
    const TRIALS_CONFIG = {
        Practice: { count: 1, targets: 5, distractors: 11, timeout: 60000 }, // Total 16
        Testing: { count: 5, targets: 10, distractors: 15, timeout: 30000 }  // Total 25
    };
    // Removed global GRID_SIZE constant, as it's now derived from targets + distractors.
    // === MODIFICATION END ===

    // --- NEW STIMULUS CONFIGURATION (Based on user rules) ---
    const ROTATIONS = [0, 90, 180, 270];
    const QUADRANTS = ['top', 'right', 'bottom', 'left'];
    const TRIANGLE_COUNTS = [0, 1, 2, 3];
    const DIRECTIONS = ['up', 'down'];

    // --- Game State ---
    let isPractice = true;
    let currentTrial = 0;
    let totalTrials = TRIALS_CONFIG.Practice.count;
    let targetStimulus = {};
    let trialStimuli = [];
    let selectedIndices = new Set();
    let trialTimer;
    let trialStartTime;
    let allTrialData = [];
    let completionTime = 0;
    let countdownInterval;

    // --- Event Listeners ---
    startPhaseBtn.addEventListener('click', startPhase);
    startMainGameBtn.addEventListener('click', () => {
        phaseTransitionOverlay.style.display = 'none';
        isPractice = false;
        startPhase(false);
    });
    practiceAgainBtn.addEventListener('click', () => {
        phaseTransitionOverlay.style.display = 'none';
        isPractice = true;
        startPhase(true);
    });
    stimuliGrid.addEventListener('click', handleStimulusClick);
    confirmButton.addEventListener('click', handleConfirm);

    // --- Initialization ---
    function initializeGame() {
        targetDefinitionOverlay.style.display = 'flex';
        gameArea.style.display = 'none';
        responseControls.style.display = 'none';
        infoHeader.style.display = 'none';
        phaseTransitionOverlay.style.display = 'none';
        endGameScreen.style.display = 'none';
        isPractice = true;
        defineTarget();
    }

    function defineTarget() {
        targetStimulus = {
            rotation: ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)],
            missingQuadrant: QUADRANTS[Math.floor(Math.random() * QUADRANTS.length)],
            topTriangleCount: TRIANGLE_COUNTS[Math.floor(Math.random() * TRIANGLE_COUNTS.length)],
            bottomTriangleCount: TRIANGLE_COUNTS[Math.floor(Math.random() * TRIANGLE_COUNTS.length)],
            topTriangleDir: DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)],
            bottomTriangleDir: DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
        };

        targetDisplay.style.backgroundColor = '#e9ecef';
        targetDisplay.innerHTML = createStimulusSVG(targetStimulus);
    }

    // --- Game Flow ---
    function startPhase(isPracticeOverride = null) {
        if (isPracticeOverride !== null) {
            isPractice = isPracticeOverride;
        }
        currentTrial = 0;
        totalTrials = isPractice ? TRIALS_CONFIG.Practice.count : TRIALS_CONFIG.Testing.count;
        if (!isPractice) {
            allTrialData = [];
            completionTime = 0;
        }
        targetDefinitionOverlay.style.display = 'none';
        gameArea.style.display = 'flex';
        runTrial();
    }

    function runTrial() {
        currentTrial++;
        selectedIndices.clear();
        stimuliGrid.innerHTML = '';
        messageDisplay.textContent = '';
        confirmButton.disabled = false;
        responseControls.style.display = 'flex';
        infoHeader.style.display = 'flex';
        updateHeader();

        const config = isPractice ? TRIALS_CONFIG.Practice : TRIALS_CONFIG.Testing;

        // === MODIFICATION START ===
        // Add/Remove class for dynamic grid layout (4x4 vs 5x5)
        if (isPractice) {
            stimuliGrid.classList.remove('grid-5x5');
            stimuliGrid.classList.add('grid-4x4');
        } else {
            stimuliGrid.classList.remove('grid-4x4');
            stimuliGrid.classList.add('grid-5x5');
        }
        // === MODIFICATION END ===

        trialStimuli = generateTrialStimuli(targetStimulus, config.targets, config.distractors);
        renderStimuli();

        trialStartTime = performance.now();
        startTimers(config.timeout);
    }

    function startTimers(timeout) {
        let timeLeft = timeout;
        timeLeftDisplay.textContent = Math.ceil(timeLeft / 1000);
        clearInterval(countdownInterval);
        countdownInterval = setInterval(() => {
            timeLeft -= 1000;
            timeLeftDisplay.textContent = Math.max(0, Math.ceil(timeLeft / 1000));
        }, 1000);
        clearTimeout(trialTimer);
        trialTimer = setTimeout(handleTimeout, timeout);
    }

    function updateHeader() {
        currentTrialDisplay.textContent = `${currentTrial} / ${totalTrials}`;
    }

    function handleStimulusClick(e) {
        let item = e.target.closest('.stimulus-item');
        if (!item || confirmButton.disabled) return;
        let index = parseInt(item.dataset.index);
        if (selectedIndices.has(index)) {
            selectedIndices.delete(index);
            item.classList.remove('selected');
        } else {
            selectedIndices.add(index);
            item.classList.add('selected');
        }
    }

    function handleConfirm() {
        processTrialResults(performance.now() - trialStartTime);
    }

    function handleTimeout() {
        messageDisplay.textContent = window.STRINGS.too_slow_message || "Time's up!";
        processTrialResults(isPractice ? TRIALS_CONFIG.Practice.timeout : TRIALS_CONFIG.Testing.timeout, true);
    }

    function processTrialResults(reactionTime, isTimeout = false) {
        clearTimeout(trialTimer);
        clearInterval(countdownInterval);
        confirmButton.disabled = true;

        let targetCount = trialStimuli.filter(s => s.isTarget).length;
        let selectedTargets = 0;
        let commissionErrors = 0;

        trialStimuli.forEach((stimulus, index) => {
            let isSelected = selectedIndices.has(index);
            let itemElement = stimuliGrid.querySelector(`[data-index="${index}"]`);
            if (!itemElement) return;
            itemElement.classList.remove('selected');
            if (stimulus.isTarget && isSelected) {
                selectedTargets++;
            } else if (!stimulus.isTarget && isSelected) {
                commissionErrors++;
                itemElement.classList.add('false-alarm');
            } else if (stimulus.isTarget && !isSelected) {
                itemElement.classList.add('missed');
            }
        });

        const omissionErrors = targetCount - selectedTargets;
        const isTrialCorrect = (omissionErrors === 0) && (commissionErrors === 0);

        if (!isPractice) {
            completionTime += reactionTime;
            // === MODIFICATION START ===
            // Calculate distractorCount dynamically instead of using a global GRID_SIZE
            const distractorCount = trialStimuli.length - targetCount;
            allTrialData.push({ isCorrect: isTrialCorrect, omissionErrors, commissionErrors, targetCount, distractorCount: distractorCount });
            // === MODIFICATION END ===
        }

        setTimeout(() => {
            if (currentTrial >= totalTrials) {
                endPhase();
            } else {
                runTrial();
            }
        }, 1500);
    }

    function endPhase() {
        gameArea.style.display = 'none';
        responseControls.style.display = 'none';
        infoHeader.style.display = 'none';
        if (isPractice) {
            phaseTransitionOverlay.style.display = 'flex';
        } else {
            endGame();
        }
    }

    function endGame() {
        const results = calculateAndSaveResults();
        messageDisplayEnd.textContent = window.STRINGS.task_finished_title;
        messageDisplayEnd.innerHTML += `<br><p>${window.STRINGS.accuracy_label || 'Accuracy'}: <strong>${results.accuracy.toFixed(1)}%</strong></p><p>${window.STRINGS.completion_time_label || 'Total Time'}: <strong>${(results.completion_time / 1000).toFixed(2)}s</strong></p><p>${window.STRINGS.omission_errors_label || 'Omission Errors'}: ${results.omission_errors_percentage.toFixed(1)}%</p><p>${window.STRINGS.commission_errors_label || 'Commission Errors'}: ${results.commission_errors_percentage.toFixed(1)}%</p>`;
        endGameScreen.style.display = 'block';
    }

    function generateTrialStimuli(target, targetCount, distractorCount) {
        let stimuli = [];
        // === MODIFICATION START ===
        // Loop based on sum of targets + distractors, not a global GRID_SIZE
        const localGridSize = targetCount + distractorCount;
        for (let i = 0; i < localGridSize; i++) {
        // === MODIFICATION END ===
            if (i < targetCount) {
                stimuli.push({ ...target, isTarget: true });
            } else {
                let distractor;
                do {
                    distractor = {
                        rotation: ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)],
                        missingQuadrant: QUADRANTS[Math.floor(Math.random() * QUADRANTS.length)],
                        topTriangleCount: TRIANGLE_COUNTS[Math.floor(Math.random() * TRIANGLE_COUNTS.length)],
                        bottomTriangleCount: TRIANGLE_COUNTS[Math.floor(Math.random() * TRIANGLE_COUNTS.length)],
                        topTriangleDir: DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)],
                        bottomTriangleDir: DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
                    };
                } while (
                    distractor.rotation === target.rotation &&
                    distractor.missingQuadrant === target.missingQuadrant &&
                    distractor.topTriangleCount === target.topTriangleCount &&
                    distractor.bottomTriangleCount === target.bottomTriangleCount &&
                    distractor.topTriangleDir === target.topTriangleDir &&
                    distractor.bottomTriangleDir === target.bottomTriangleDir
                );
                stimuli.push({ ...distractor, isTarget: false });
            }
        }
        return shuffle(stimuli);
    }

    function renderStimuli() {
        stimuliGrid.innerHTML = '';
        trialStimuli.forEach((stimulus, index) => {
            const item = document.createElement('div');
            item.className = 'stimulus-item';
            item.dataset.index = index;
            item.innerHTML = createStimulusSVG(stimulus);
            stimuliGrid.appendChild(item);
        });
    }

    function createStimulusSVG(stimulus) {
        const { rotation, missingQuadrant, topTriangleCount, bottomTriangleCount, topTriangleDir, bottomTriangleDir } = stimulus;
        const mainFill = '#002147';
        const mainStroke = '#333';
        const mainStrokeWidth = 2;

        const rhombusTriangles = {
            top:    `<polygon points="50,20 80,50 50,50" fill="${mainFill}" stroke="${mainStroke}" stroke-width="${mainStrokeWidth}" stroke-linejoin="round" />`,
            right:  `<polygon points="80,50 50,80 50,50" fill="${mainFill}" stroke="${mainStroke}" stroke-width="${mainStrokeWidth}" stroke-linejoin="round" />`,
            bottom: `<polygon points="50,80 20,50 50,50" fill="${mainFill}" stroke="${mainStroke}" stroke-width="${mainStrokeWidth}" stroke-linejoin="round" />`,
            left:   `<polygon points="20,50 50,20 50,50" fill="${mainFill}" stroke="${mainStroke}" stroke-width="${mainStrokeWidth}" stroke-linejoin="round" />`
        };

        let rhombusSVG = '';
        if (missingQuadrant !== 'top') rhombusSVG += rhombusTriangles.top;
        if (missingQuadrant !== 'right') rhombusSVG += rhombusTriangles.right;
        if (missingQuadrant !== 'bottom') rhombusSVG += rhombusTriangles.bottom;
        if (missingQuadrant !== 'left') rhombusSVG += rhombusTriangles.left;

        rhombusSVG += `<polygon points="50,20 80,50 50,80 20,50" fill="none" stroke="${mainStroke}" stroke-width="${mainStrokeWidth}" />`;

        let smallTrianglesSVG = '';
        const TRIANGLE_Y_TOP_BASE = 10;
        const TRIANGLE_Y_BOTTOM_BASE = 85;
        const TRIANGLE_SIZE = 5;
        const TRIANGLE_WIDTH = 8;
        const TRIANGLE_FILL = '#333';

        const createSmallTriangle = (x, y_base, direction) => {
            const y_point = (direction === 'up') ? y_base - TRIANGLE_SIZE : y_base + TRIANGLE_SIZE;
            return `<polygon points="${x - TRIANGLE_WIDTH/2},${y_base} ${x + TRIANGLE_WIDTH/2},${y_base} ${x},${y_point}" fill="${TRIANGLE_FILL}" />`;
        };

        const topPositions = [35, 50, 65];
        const bottomPositions = [35, 50, 65];

        if (topTriangleCount === 1) {
            smallTrianglesSVG += createSmallTriangle(topPositions[1], TRIANGLE_Y_TOP_BASE, topTriangleDir);
        } else if (topTriangleCount === 2) {
            smallTrianglesSVG += createSmallTriangle(topPositions[0], TRIANGLE_Y_TOP_BASE, topTriangleDir);
            smallTrianglesSVG += createSmallTriangle(topPositions[2], TRIANGLE_Y_TOP_BASE, topTriangleDir);
        } else if (topTriangleCount === 3) {
            topPositions.forEach(x => { smallTrianglesSVG += createSmallTriangle(x, TRIANGLE_Y_TOP_BASE, topTriangleDir); });
        }

        if (bottomTriangleCount === 1) {
            smallTrianglesSVG += createSmallTriangle(bottomPositions[1], TRIANGLE_Y_BOTTOM_BASE, bottomTriangleDir);
        } else if (bottomTriangleCount === 2) {
            smallTrianglesSVG += createSmallTriangle(bottomPositions[0], TRIANGLE_Y_BOTTOM_BASE, bottomTriangleDir);
            smallTrianglesSVG += createSmallTriangle(bottomPositions[2], TRIANGLE_Y_BOTTOM_BASE, bottomTriangleDir);
        } else if (bottomTriangleCount === 3) {
            bottomPositions.forEach(x => { smallTrianglesSVG += createSmallTriangle(x, TRIANGLE_Y_BOTTOM_BASE, bottomTriangleDir); });
        }

        const rotatedRhombus = `<g transform="rotate(${rotation} 50 50)">${rhombusSVG}</g>`;
        return `<svg viewBox="0 0 100 100" width="100%" height="100%">${rotatedRhombus}${smallTrianglesSVG}</svg>`;
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function calculateAndSaveResults() {
        if (allTrialData.length === 0) return { accuracy: 0, completion_time: 0, omission_errors_percentage: 0, commission_errors_percentage: 0 };
        const totalTargets = allTrialData.reduce((sum, t) => sum + t.targetCount, 0);
        const totalDistractors = allTrialData.reduce((sum, t) => sum + t.distractorCount, 0);
        const totalOmissions = allTrialData.reduce((sum, t) => sum + t.omissionErrors, 0);
        const totalCommissions = allTrialData.reduce((sum, t) => sum + t.commissionErrors, 0);
        const correctHits = totalTargets - totalOmissions;
        const correctRejections = totalDistractors - totalCommissions;
        const accuracy = ((correctHits + correctRejections) / (totalTargets + totalDistractors)) * 100;
        const results = {
            accuracy: isNaN(accuracy) ? 0 : accuracy,
            completion_time: completionTime,
            omission_errors_percentage: totalTargets > 0 ? (totalOmissions / totalTargets) * 100 : 0,
            commission_errors_percentage: totalDistractors > 0 ? (totalCommissions / totalDistractors) * 100 : 0,
        };
        localStorage.setItem('gameResults_SAT', JSON.stringify(results));
        console.log("Final SAT Results:", results);
        return results;
    }

    // --- Start the game ---
    initializeGame();
});