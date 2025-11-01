// static/js/visual_memory_test_game.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const instructionsScreen = document.getElementById('instructions-screen');
    const startPracticeBtn = document.getElementById('start-practice-btn');
    const gameArea = document.getElementById('game-area');
    const turnDisplay = document.getElementById('turn-display');
    const messageDisplay = document.getElementById('message-display');
    const progressBarContainer = document.querySelector('.progress-bar-container');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progressText');
    const phaseOverlay = document.getElementById('phase-transition-overlay');
    const startMainGameBtn = document.getElementById('start-main-game-btn');
    const practiceAgainBtn = document.getElementById('practice-again-btn');
    const modelDisplay = document.getElementById('model-display');
    const optionsContainer = document.getElementById('options-container');
    const endGameScreen = document.getElementById('end-game-screen');
    const messageDisplayEnd = document.getElementById('message-display-end');

    // --- Game Configuration from PDF ---
    const TRIALS_CONFIG = [
        // Practice Trials (Phase 0)
        { phase: 0, exposure: 3000, distance: 200 },
        { phase: 0, exposure: 3000, distance: 200 },
        // Testing Trials (Phase 1)
        { phase: 1, exposure: 3000, distance: 200 },
        { phase: 1, exposure: 2250, distance: 200 },
        { phase: 1, exposure: 1500, distance: 200 },
        { phase: 1, exposure: 3000, distance: 260 },
        { phase: 1, exposure: 2250, distance: 260 },
        { phase: 1, exposure: 1500, distance: 260 },
        { phase: 1, exposure: 3000, distance: 320 },
        { phase: 1, exposure: 2250, distance: 320 },
        { phase: 1, exposure: 1500, distance: 320 },
        { phase: 1, exposure: 3000, distance: 380 },
        { phase: 1, exposure: 2250, distance: 380 },
        { phase: 1, exposure: 1500, distance: 380 },
    ];
    const RESPONSE_TIMEOUT = 5000; // 5 seconds to respond

    // --- OBJECT_POOL with PNG Image Paths ---
    // These paths assume images are located in '/static/images/'
    // Make sure your filenames exactly match these (e.g., hammer.png)
    const OBJECT_POOL = [
        '<img src="/static/images/Airplane.png" alt="Airplane">',
        '<img src="/static/images/Apple.png" alt="Apple">',
        '<img src="/static/images/Backpack.png" alt="Backpack">',
        '<img src="/static/images/Banana.png" alt="Banana">',
        '<img src="/static/images/Basketball.png" alt="Basketball">',
        '<img src="/static/images/Bee.png" alt="Bee">',
        '<img src="/static/images/Bird.png" alt="Bird">',
        '<img src="/static/images/Book.png" alt="Book">',
        '<img src="/static/images/Box.png" alt="Box">',
        '<img src="/static/images/Bread.png" alt="Bread">',
        '<img src="/static/images/Camera.png" alt="Camera">',
        '<img src="/static/images/Car.png" alt="Car">',
        '<img src="/static/images/Cat.png" alt="Cat">',
        '<img src="/static/images/Chair.png" alt="Chair">',
        '<img src="/static/images/Clock.png" alt="Clock">',
        '<img src="/static/images/Dog.png" alt="Dog">',
        '<img src="/static/images/Donut.png" alt="Donut">',
        '<img src="/static/images/Flower.png" alt="Flower">',
        '<img src="/static/images/Football.png" alt="Football">',
        '<img src="/static/images/Hammer.png" alt="Hammer">',
        '<img src="/static/images/Home.png" alt="Home">',
        '<img src="/static/images/Key.png" alt="Key">',
        '<img src="/static/images/Light.png" alt="Light">',
        '<img src="/static/images/Mobile.png" alt="Mobile">',
        '<img src="/static/images/Pen.png" alt="Pen">',
        '<img src="/static/images/Pineapple.png" alt="Pineapple">',
        '<img src="/static/images/Police.png" alt="Police">',
        '<img src="/static/images/Refrigerator.png" alt="Refrigerator">',
        '<img src="/static/images/Rooster.png" alt="Rooster">',
        '<img src="/static/images/Strawberry.png" alt="Strawberry">',
        '<img src="/static/images/Toaster.png" alt="Toaster">',
        '<img src="/static/images/Tree.png" alt="Tree">'
    ];

    // --- Game State Variables ---
    let isPractice = true;
    let currentTrialIndex = 0;
    let allTrialData = [];
    let responseTimer;
    let currentTargetTrio; // The set of 3 objects the user needs to memorize
    let currentOptions;    // The 4 options presented to the user
    let trialStartTime;    // Timestamp when options are displayed for response time calculation


    // --- Event Listeners ---
    startPracticeBtn.addEventListener('click', () => startGame(true));
    startMainGameBtn.addEventListener('click', () => {
        phaseOverlay.style.display = 'none'; // Hide the transition overlay
        startGame(false); // Start the main game (not practice)
    });
    practiceAgainBtn.addEventListener('click', () => {
        phaseOverlay.style.display = 'none'; // Hide the transition overlay
        startGame(true); // Restart practice mode
    });
    optionsContainer.addEventListener('click', handleOptionClick); // Listen for clicks on the options grid

    // --- Game Flow Functions ---
    /**
     * Initializes and starts a new game session (practice or main game).
     * @param {boolean} practice - True if starting practice mode, false for main game.
     */
    function startGame(practice) {
        isPractice = practice;
        // Determine the starting trial index based on whether it's practice or main game
        currentTrialIndex = isPractice ? 0 : TRIALS_CONFIG.findIndex(t => t.phase === 1);
        allTrialData = []; // Reset data for the new session

        // Hide start/end screens and show game elements
        instructionsScreen.style.display = 'none';
        endGameScreen.style.display = 'none';
        gameArea.style.display = 'flex';
        progressBarContainer.style.display = 'flex';
        messageDisplay.textContent = ''; // Clear any previous messages

        runNextTrial(); // Start the first trial
    }

    /**
     * Executes a single trial of the game.
     * Handles showing the model, waiting for exposure, then displaying options.
     */
    async function runNextTrial() {
        // Filter trials based on current game phase (practice or main)
        const trials = isPractice ? TRIALS_CONFIG.filter(t => t.phase === 0) : TRIALS_CONFIG.filter(t => t.phase === 1);
        // Calculate relative index within the current phase's trials
        const relativeIndex = isPractice ? currentTrialIndex : currentTrialIndex - TRIALS_CONFIG.findIndex(t => t.phase === 1);

        // Check if all trials for the current phase are completed
        if (relativeIndex >= trials.length) {
            if (isPractice) {
                phaseOverlay.style.display = 'flex'; // Show practice complete overlay
            } else {
                endGame(true); // End the main game
            }
            return; // Stop processing trials
        }

        updateProgressBar();          // Update the progress display
        optionsContainer.innerHTML = ''; // Clear previous options
        messageDisplay.textContent = '';  // Clear previous messages

        const config = TRIALS_CONFIG[currentTrialIndex]; // Get configuration for the current trial

        // 1. Generate the target trio of objects and the set of options
        currentTargetTrio = generateTrio();
        currentOptions = generateOptions(currentTargetTrio);

        // 2. Show the Model (objects to memorize)
        turnDisplay.textContent = window.STRINGS.model_turn; // Display "Model Turn" message
        modelDisplay.style.display = 'flex';
        optionsContainer.style.display = 'none';
        renderModel(currentTargetTrio, config.distance); // Render the target trio

        // Wait for the specified exposure time
        await new Promise(res => setTimeout(res, config.exposure));

        // 3. Show the Options (for user response)
        modelDisplay.style.display = 'none';
        optionsContainer.style.display = 'grid'; // Display the options grid
        turnDisplay.textContent = window.STRINGS.user_turn; // Display "Your Turn" message
        renderOptions(currentOptions, config.distance); // Render the options

        trialStartTime = performance.now(); // Record start time for response calculation
        // Set a timeout for the user's response; if it expires, count as an omission
        responseTimer = setTimeout(() => handleResponse(null), RESPONSE_TIMEOUT);
    }

    /**
     * Handles a click event on one of the option trios.
     * @param {Event} e - The click event object.
     */
    function handleOptionClick(e) {
        // Find the closest '.vmt-option' element that was clicked
        const option = e.target.closest('.vmt-option');
        // If no option was clicked or if the option is already disabled, do nothing
        if (!option || option.style.pointerEvents === 'none') return;

        const selectedIndex = parseInt(option.dataset.index, 10); // Get the index of the selected option
        handleResponse(selectedIndex); // Process the user's response
    }

    /**
     * Processes the user's response to a trial.
     * @param {number|null} selectedIndex - The index of the selected option, or null if timed out.
     */
    function handleResponse(selectedIndex) {
        clearTimeout(responseTimer); // Clear the response timer as user has responded (or timed out)
        const responseTime = performance.now() - trialStartTime; // Calculate response time

        // Determine the selected trio and if the response was correct
        const selectedTrio = selectedIndex !== null ? currentOptions[selectedIndex] : null;
        const isCorrect = selectedTrio ? areTriosEqual(selectedTrio, currentTargetTrio) : false;

        // Provide visual feedback on the options
        Array.from(optionsContainer.children).forEach((opt, index) => {
            const isTarget = areTriosEqual(currentOptions[index], currentTargetTrio); // Check if this option is the correct answer
            if (isTarget) {
                opt.classList.add('correct-answer'); // Highlight the correct answer
            }
            if (index === selectedIndex) {
                opt.classList.add(isCorrect ? 'correct-choice' : 'incorrect-choice'); // Highlight user's choice (correct/incorrect)
            }
            opt.style.pointerEvents = 'none'; // Disable further clicks on all options
        });

        // Save trial data
        allTrialData.push({
            trial: currentTrialIndex,
            isPractice: isPractice,
            isCorrect: isCorrect,
            responseTime: isCorrect ? responseTime : null, // Only record response time for correct answers
            omission: selectedIndex === null // True if user failed to respond within timeout
        });

        currentTrialIndex++; // Move to the next trial
        // Wait for 2 seconds before starting the next trial to allow visual feedback to be seen
        setTimeout(() => {
            runNextTrial();
        }, 2000);
    }

    /**
     * Ends the game session and displays the results.
     * @param {boolean} completed - True if the game was completed, false if ended prematurely.
     */
    function endGame(completed) {
        gameArea.style.display = 'none'; // Hide the game area
        progressBarContainer.style.display = 'none'; // Hide the progress bar

        // Calculate statistics for the main game trials
        const mainGameData = allTrialData.filter(t => !t.isPractice);
        const correctTrials = mainGameData.filter(t => t.isCorrect);
        const accuracy = mainGameData.length > 0 ? (correctTrials.length / mainGameData.length) * 100 : 0;
        const avgResponseTime = correctTrials.length > 0 ? correctTrials.reduce((sum, t) => sum + t.responseTime, 0) / correctTrials.length : 0;

        // Display end game messages and statistics
        messageDisplayEnd.textContent = completed ? window.STRINGS.task_finished_title : 'Game Over';
        messageDisplayEnd.innerHTML += `
            <br><p>Accuracy: <strong>${accuracy.toFixed(1)}%</strong></p>
            <p>Average Correct Response Time: <strong>${avgResponseTime.toFixed(0)} ms</strong></p>
        `;

        endGameScreen.style.display = 'block'; // Show the end game screen
    }


    // --- Utility & Rendering Functions ---
    /**
     * Shuffles an array in place.
     * @param {Array} array - The array to shuffle.
     * @returns {Array} The shuffled array.
     */
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Generates a random trio of objects from the OBJECT_POOL.
     * @returns {Array<string>} An array of 3 unique object HTML strings.
     */
    function generateTrio() {
        // Ensure OBJECT_POOL has enough items to generate a unique trio
        if (OBJECT_POOL.length < 3) {
            console.error("OBJECT_POOL must contain at least 3 distinct items to generate a trio.");
            // Return a fallback trio to prevent errors, using a default image if available
            return ['<img src="/static/images/default.png" alt="Default">', '<img src="/static/images/default.png" alt="Default">', '<img src="/static/images/default.png" alt="Default">'];
        }
        return shuffle([...OBJECT_POOL]).slice(0, 3);
    }

    /**
     * Generates four options, including the target trio and three distractors.
     * Distractors are generated by changing one object from the target trio.
     * @param {Array<string>} targetTrio - The trio of objects the user needs to memorize.
     * @returns {Array<Array<string>>} An array of four trios (one target, three distractors).
     */
    function generateOptions(targetTrio) {
        let options = [targetTrio]; // Start with the correct target trio
        const maxAttemptsForDistractor = 50; // To prevent infinite loops in rare cases

        while (options.length < 4) {
            let distractor = [...targetTrio]; // Start with a copy of the target trio
            const changeIndex = Math.floor(Math.random() * 3); // Choose one position to change
            let newObject;
            let attempts = 0;

            // Find a new unique object for the distractor
            do {
                newObject = OBJECT_POOL[Math.floor(Math.random() * OBJECT_POOL.length)];
                attempts++;
                if (attempts > maxAttemptsForDistractor) {
                    console.warn("Could not find a unique object for distractor after many attempts. Using a potentially non-unique one.");
                    break;
                }
            } while (targetTrio.includes(newObject) || distractor[changeIndex] === newObject);
            // newObject must not be in the original targetTrio
            // and must not be the same as the object it's replacing in the distractor copy

            distractor[changeIndex] = newObject; // Apply the change

            // Ensure this exact distractor trio (regardless of order) isn't already in options
            if (!options.some(opt => areTriosEqual(opt, distractor))) {
                options.push(distractor);
            }
        }
        return shuffle(options); // Randomize the order of the four options
    }

    /**
     * Compares two trios to check if they contain the same objects, regardless of order.
     * @param {Array<string>} trio1 - The first trio of object HTML strings.
     * @param {Array<string>} trio2 - The second trio of object HTML strings.
     * @returns {boolean} True if the trios are equal, false otherwise.
     */
    function areTriosEqual(trio1, trio2) {
        if (trio1.length !== trio2.length) return false;
        // Sort the trios to compare their contents regardless of initial order
        const sortedTrio1 = [...trio1].sort();
        const sortedTrio2 = [...trio2].sort();
        // Compare each element (which are HTML strings like '<img src=...>')
        return sortedTrio1.every((obj, index) => obj === sortedTrio2[index]);
    }

    /**
     * Renders the target trio of objects in the model display.
     * @param {Array<string>} trio - The array of object HTML strings to display.
     * @param {number} distance - Configuration value affecting visual gap between objects.
     */
    function renderModel(trio, distance) {
        // Calculate gap based on distance for visual spacing
        const gap = distance / 20;
        modelDisplay.innerHTML = `<div class="vmt-trio-rectangle" style="gap: ${gap}px;">
            ${trio.map(obj => `<div class="vmt-object">${obj}</div>`).join('')}
        </div>`;
    }

    /**
     * Renders the four option trios in the options container.
     * @param {Array<Array<string>>} options - An array of four trios to display as selectable options.
     * @param {number} distance - Configuration value affecting visual gap between objects.
     */
    function renderOptions(options, distance) {
        // Calculate gap based on distance for visual spacing
        const gap = distance / 25;
        optionsContainer.innerHTML = options.map((trio, index) => `
            <div class="vmt-option" data-index="${index}">
                <div class="vmt-option-rect" style="gap: ${gap}px;">
                    ${trio.map(obj => `<div class="vmt-object-small">${obj}</div>`).join('')}
                </div>
            </div>
        `).join('');
    }

    /**
     * Updates the progress bar and text based on the current trial.
     */
    function updateProgressBar() {
        // Get trials relevant to the current phase
        const trials = isPractice ? TRIALS_CONFIG.filter(t => t.phase === 0) : TRIALS_CONFIG.filter(t => t.phase === 1);
        // Calculate relative index within the current phase
        const relativeIndex = isPractice ? currentTrialIndex : currentTrialIndex - TRIALS_CONFIG.findIndex(t => t.phase === 1);
        const progress = trials.length > 0 ? (relativeIndex / trials.length) * 100 : 0; // Calculate progress percentage

        progressBarFill.style.width = `${progress}%`; // Update progress bar width
        // Ensure window.STRINGS.current_trial_label is defined for localized string, fallback to 'Trial'
        progressText.textContent = `${window.STRINGS.current_trial_label || 'Trial'} ${relativeIndex + 1}/${trials.length}`;
    }
});