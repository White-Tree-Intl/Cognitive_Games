// static/js/selective_attention_game.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const instructionsScreen = document.getElementById('instructions-screen');
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
    const TRIALS_CONFIG = {
        Practice: { count: 1, targets: 5, distractors: 11, timeout: 60000 },
        Testing: { count: 5, targets: 10, distractors: 6, timeout: 30000 }
    };
    const GRID_SIZE = 16;
    const ROTATIONS = [0, 90, 180, 270];
    const TRIANGLE_COUNTS = [0, 1, 2];

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
    confirmButton.addEventListener('click', handleConfirm); // This was the missing line

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
            triangleCount: TRIANGLE_COUNTS[Math.floor(Math.random() * TRIANGLE_COUNTS.length)]
        };
        targetDisplay.style.backgroundColor = '#e9ecef';
        targetDisplay.innerHTML = createStimulusSVG(targetStimulus.rotation, targetStimulus.triangleCount);
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
            allTrialData.push({ isCorrect: isTrialCorrect, omissionErrors, commissionErrors, targetCount, distractorCount: GRID_SIZE - targetCount });
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
        for (let i = 0; i < GRID_SIZE; i++) {
            if (i < targetCount) {
                stimuli.push({ ...target, isTarget: true });
            } else {
                let distractorRotation, distractorTriangleCount;
                do {
                    distractorRotation = ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)];
                    distractorTriangleCount = TRIANGLE_COUNTS[Math.floor(Math.random() * TRIANGLE_COUNTS.length)];
                } while (distractorRotation === target.rotation && distractorTriangleCount === target.triangleCount);
                stimuli.push({ rotation: distractorRotation, triangleCount: distractorTriangleCount, isTarget: false });
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
            item.innerHTML = createStimulusSVG(stimulus.rotation, stimulus.triangleCount);
            stimuliGrid.appendChild(item);
        });
    }

    function createStimulusSVG(rotation, triangleCount) {
        const centralPolygonPoints = '50,30 95,50 50,85 5,50';
        const TRIANGLE_UP_Y = 15;
        const TRIANGLE_DOWN_Y = 85;
        const triangle1 = `<polygon points="40,${TRIANGLE_UP_Y} 50,${TRIANGLE_UP_Y - 5} 60,${TRIANGLE_UP_Y}" fill="#002147" />`;
        const triangle2 = `<polygon points="40,${TRIANGLE_DOWN_Y} 50,${TRIANGLE_DOWN_Y + 5} 60,${TRIANGLE_DOWN_Y}" fill="#002147" />`;
        let triangles = '';
        if (triangleCount === 1) triangles = triangle1;
        else if (triangleCount === 2) triangles = triangle1 + triangle2;
        const mainShapeFill = '#ffffff';
        return `<svg viewBox="0 0 100 100" width="100%" height="100%"><g transform="rotate(${rotation} 50 50)"><polygon points="${centralPolygonPoints}" stroke="#333" stroke-width="3" fill="${mainShapeFill}" /></g>${triangles}</svg>`;
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

    initializeGame();
});