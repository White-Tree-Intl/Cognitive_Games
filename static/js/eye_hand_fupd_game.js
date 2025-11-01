document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const gameTitle = document.getElementById('game-title');
    const instructionsScreen = document.getElementById('instructions-screen');
    const startGameBtn = document.getElementById('start-game-btn');
    const gameArea = document.getElementById('game-area');
    const ball = document.getElementById('ball');
    const messageDisplay = document.getElementById('message-display');
    const progressBarContainer = document.querySelector('.progress-bar-container');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progressText');
    const rotatePrompt = document.getElementById('rotate-prompt');
    const phaseOverlay = document.getElementById('phase-transition-overlay');
    const startMainGameBtn = document.getElementById('start-main-game-btn');
    const practiceAgainBtn = document.getElementById('practice-again-btn');
    const endGameScreen = document.getElementById('end-game-screen');
    const touchMarker = document.getElementById('touch-marker');

    // --- Game Configuration (from PDF) ---
    const BALL_RADIUS = 25; // 50px diameter
    const SPEEDS = { 'Slow': 0.5, 'Fast': 0.75 }; // Adjusted speeds for pixel-perfect movement
    const DATA_COLLECTION_INTERVAL = 50; // ms

    const SEGMENTS = [
        { phase: 'Learning', duration: 7000, speed: 'Slow' },
        { phase: 'Learning', duration: 7000, speed: 'Fast' },
        { phase: 'Testing', duration: 7000, speed: 'Slow' },
        { phase: 'Testing', duration: 7000, speed: 'Fast' },
        { phase: 'Testing', duration: 2333, speed: 'Slow' },
        { phase: 'Testing', duration: 2333, speed: 'Fast' },
        { phase: 'Testing', duration: 7000, speed: 'Slow' },
        { phase: 'Testing', duration: 7000, speed: 'Fast' },
        { phase: 'Testing', duration: 2333, speed: 'Slow' },
        { phase: 'Testing', duration: 2333, speed: 'Fast' },
        { phase: 'Testing', duration: 7000, speed: 'Slow' },
        { phase: 'Testing', duration: 7000, speed: 'Fast' },
        { phase: 'Testing', duration: 2333, speed: 'Slow' },
        { phase: 'Testing', duration: 2333, speed: 'Fast' },
    ];
    const TOTAL_TESTING_DURATION = SEGMENTS.filter(s => s.phase === 'Testing').reduce((sum, s) => sum + s.duration, 0);

    // --- Game State ---
    let gameActive = false;
    let gameStarted = false;
    let currentSegmentIndex = 0;
    let mousePos = { x: 0, y: 0 };
    let ballPos = { x: 0, y: 0 };
    let pathPoints = [];
    let currentPathIndex = 0;
    let rawData = [];
    let dataCollectorInterval;
    let animationFrameId;
    let timeElapsedInPhase = 0;
    let segmentTimeout;
    let markerPos = { x: 0, y: 0 };
    let gameFinished = false;

    const touchOffset = { x: -50, y: -50 };
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (isTouchDevice) {
        startGameBtn.addEventListener('touchstart', setupGame);
        startMainGameBtn.addEventListener('touchstart', () => {
            phaseOverlay.style.display = 'none';
            startMainGame();
        });
        practiceAgainBtn.addEventListener('touchstart', () => {
            phaseOverlay.style.display = 'none';
            resetAndStartPractice();
        });
    } else {
        startGameBtn.addEventListener('click', setupGame);

        startMainGameBtn.addEventListener('click', () => {
            phaseOverlay.style.display = 'none';
            startMainGame();
        });

        practiceAgainBtn.addEventListener('click', () => {
            phaseOverlay.style.display = 'none';
            resetAndStartPractice();
        });
    }

    // Use ResizeObserver for better performance on resize
    const resizeObserver = new ResizeObserver(() => {
        if (gameArea.style.display === 'block') {
             setupPath();
             if(!gameStarted) {
                ballPos = {...pathPoints[0]};
                updateBallPosition();
             }
        }
    });
    resizeObserver.observe(gameArea);


    // --- Orientation Check ---
    function isMobile() {
        // Simple check for mobile devices
        return /Mobi|Android/i.test(navigator.userAgent);
    }

    function checkOrientation() {
        if (!isMobile()) return;
        // Prompt to rotate if in portrait mode
        if (window.innerHeight > window.innerWidth) {
            rotatePrompt.style.display = 'flex';
        } else {
            rotatePrompt.style.display = 'none';
        }
    }
    window.addEventListener('resize', checkOrientation);


    // --- Game Setup ---
    function setupPath() {
        const areaRect = gameArea.getBoundingClientRect();
        const pathWidth = areaRect.width * 0.7;
        const pathHeight = areaRect.height * 0.7;
        const offsetX = areaRect.width * 0.15;
        const offsetY = areaRect.height * 0.15;

        pathPoints = [
            { x: offsetX, y: offsetY }, // Top-left
            { x: offsetX + pathWidth, y: offsetY }, // Top-right
            { x: offsetX + pathWidth, y: offsetY + pathHeight }, // Bottom-right
            { x: offsetX, y: offsetY + pathHeight }, // Bottom-left
        ];
    }

    function setupGame() {
        checkOrientation();
        instructionsScreen.style.display = 'none';
        progressBarContainer.style.display = 'flex';
        gameArea.style.display = 'block';

        setupPath();
        ballPos = { ...pathPoints[0] };
        updateBallPosition();
        ball.className = 'ball orange';

        // This section has been updated to handle both touch and mouse events.
        // Now both event types are routed to a single 'trackMouse' function.
        gameArea.addEventListener('mousemove', trackMouse);
        gameArea.addEventListener('touchmove', trackMouse, { passive: false });
        gameArea.addEventListener('touchstart', trackMouse, { passive: false });
        gameArea.addEventListener('touchend', handleTouchEnd);
    }
    function handleTouchEnd(e) {
        if (touchMarker) {
            touchMarker.style.visibility = 'hidden';
        }
    }
    // This function has been rewritten to manage both touch and mouse events.
    function trackMouse(e) {
        const areaRect = gameArea.getBoundingClientRect();

        let clientX, clientY;

        // First, check if the event is a touch event.
        if (e.touches && e.touches.length > 0) {
            e.preventDefault(); // Prevent screen scrolling during touch
            touchMarker.style.visibility = 'visible'; // Show the custom '+' marker

            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;

            // Calculate raw finger position
            mousePos = { x: clientX - areaRect.left, y: clientY - areaRect.top };

            // Calculate the offset marker's position (e.g., 50px above the finger)
            markerPos = { x: mousePos.x + touchOffset.x, y: mousePos.y + touchOffset.y };

            // Move the visual marker to the new offset position
            touchMarker.style.transform = `translate(${markerPos.x}px, ${markerPos.y}px) translate(-50%, -50%)`;

        } else if (e.clientX) { // Check if it's a mouse event (e.clientX exists)
            // Note: We don't hide the marker here. 'touchend' handles hiding.
            clientX = e.clientX;
            clientY = e.clientY;

            // For mouse events, the 'marker' is the mouse cursor itself.
            // So, mousePos and markerPos are the same.
            mousePos = { x: clientX - areaRect.left, y: clientY - areaRect.top };
            markerPos = mousePos; // No offset for mouse

        } else {
            return; // Not a mouse or touch event we can handle
        }

        // --- Game Logic ---
        // All game logic must now be based on 'markerPos', not 'mousePos'.
        // This allows the user to see the ball's color instead of covering it.

        // Calculate distance from the MARKER to the ball center
        const distance = getDistance(markerPos, ballPos); // <-- CORRECTED: Use markerPos

        // The ball's appearance is updated based on the MARKER's proximity.
        updateBallAppearance(distance); // <-- CORRECTED: Pass the marker's distance

        // The game only starts when the MARKER gets close enough to the ball.
        if (!gameStarted && distance < BALL_RADIUS && !gameFinished) { // <-- CORRECTED: Use distance
            resetAndStartPractice();
        }
    }

    // --- Game Flow ---
    function resetAndStartPractice() {
        if (gameStarted) return;
        gameStarted = true;
        gameActive = true;
        currentSegmentIndex = 0;
        timeElapsedInPhase = 0;
        currentPathIndex = 0;
        ballPos = { ...pathPoints[0] };

        gameTitle.textContent = window.STRINGS.practice_round_title;
        runSegmentManager();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function startMainGame() {
        currentSegmentIndex = 2;
        timeElapsedInPhase = 0;
        rawData = [];

        gameTitle.textContent = window.STRINGS.main_game_title;
        gameActive = true;
        dataCollectorInterval = setInterval(collectDataPoint, DATA_COLLECTION_INTERVAL);
        runSegmentManager();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function gameLoop() {
        if (!gameActive) return;

        const segment = SEGMENTS[currentSegmentIndex];
        if (!segment) {
            endGame();
            return;
        }
        const speed = SPEEDS[segment.speed];
        let targetPoint = pathPoints[currentPathIndex];

        // --- Improved Movement Logic ---
        if (ballPos.y === targetPoint.y) { // Moving horizontally
            if (ballPos.x < targetPoint.x) {
                ballPos.x = Math.min(ballPos.x + speed, targetPoint.x);
            } else {
                ballPos.x = Math.max(ballPos.x - speed, targetPoint.x);
            }
        } else if (ballPos.x === targetPoint.x) { // Moving vertically
             if (ballPos.y < targetPoint.y) {
                ballPos.y = Math.min(ballPos.y + speed, targetPoint.y);
            } else {
                ballPos.y = Math.max(ballPos.y - speed, targetPoint.y);
            }
        }

        // Check if the ball has reached the target corner to switch direction
        if (ballPos.x === targetPoint.x && ballPos.y === targetPoint.y) {
             currentPathIndex = (currentPathIndex + 1) % pathPoints.length;
        }

        updateBallPosition();
        if (gameStarted) {
            updateBallAppearance(getDistance(markerPos, ballPos));
        }
        updateProgressBar();

        animationFrameId = requestAnimationFrame(gameLoop);
    }

function runSegmentManager() {
        if (currentSegmentIndex >= SEGMENTS.length) return;

        const segment = SEGMENTS[currentSegmentIndex];

        segmentTimeout = setTimeout(() => {
            timeElapsedInPhase += segment.duration;
            currentSegmentIndex++;

            if (currentSegmentIndex >= SEGMENTS.length) {
                endGame();
            } else if (currentSegmentIndex === 2) { // End of learning phase
                gameActive = false;
                cancelAnimationFrame(animationFrameId);
                clearTimeout(segmentTimeout);

                // --- FIX for immediate click-through ---
                // 1. Disable buttons first
                startMainGameBtn.disabled = true;
                practiceAgainBtn.disabled = true;

                // 2. Show the overlay
                phaseOverlay.style.display = 'flex';

                // 3. Wait 500ms before enabling buttons to prevent ghost clicks
                setTimeout(() => {
                    startMainGameBtn.disabled = false;
                    practiceAgainBtn.disabled = false;
                }, 500); // 500ms delay

            } else {
                runSegmentManager();
            }
        }, segment.duration);
    }

    function collectDataPoint() {
        if (!gameActive || currentSegmentIndex < 2) return;

        const segment = SEGMENTS[currentSegmentIndex];
        const distance = getDistance(markerPos, ballPos);

        rawData.push({
            distance_from_ball_center: distance,
            is_inside: distance < BALL_RADIUS,
            speed: segment.speed,
            duration_type: segment.duration === 7000 ? 'long' : 'short',
            phase: segment.phase
        });
    }

    function endGame() {
        gameActive = false;
        gameStarted = false; // Allow restart
        gameFinished = true;
        cancelAnimationFrame(animationFrameId);
        clearTimeout(segmentTimeout);
        clearInterval(dataCollectorInterval);

        gameArea.style.display = 'none';
        progressBarContainer.style.display = 'none';
        gameTitle.style.display = 'none';
        endGameScreen.style.display = 'block';

        calculateAndSaveResults();

        endGameScreen.querySelector('.message').textContent = window.STRINGS.task_finished_title;
        let completedGames = JSON.parse(localStorage.getItem('completedGames')) || [];
        if (!completedGames.includes('EHC-FUPD')) {
            completedGames.push('EHC-FUPD');
            localStorage.setItem('completedGames', JSON.stringify(completedGames));
        }
    }

    // --- Results Calculation ---
    function calculateAndSaveResults() {
        if (rawData.length === 0) return;
        const testingData = rawData.filter(d => d.phase === 'Testing');
        if (testingData.length === 0) return;

        const safePercentage = (data) => data.length > 0 ? (data.filter(d => d.is_inside).length / data.length) * 100 : 0;

        const accuracy = safePercentage(testingData);
        const accuracy_in_fast_speed = safePercentage(testingData.filter(d => d.speed === 'Fast'));
        const accuracy_in_slow_speed = safePercentage(testingData.filter(d => d.speed === 'Slow'));
        const accuracy_in_long_segments = safePercentage(testingData.filter(d => d.duration_type === 'long'));
        const accuracy_in_short_segments = safePercentage(testingData.filter(d => d.duration_type === 'short'));
        const distance_from_ball_center = testingData.reduce((sum, d) => sum + d.distance_from_ball_center, 0) / testingData.length;

        const finalResults = {
            accuracy,
            accuracy_in_fast_speed,
            accuracy_in_slow_speed,
            accuracy_in_long_segments_duration: accuracy_in_long_segments,
            accuracy_in_short_segments_duration: accuracy_in_short_segments,
            distance_from_the_ball_center: distance_from_ball_center
        };

        localStorage.setItem('gameData_EHC-FUPD', JSON.stringify(rawData));
        localStorage.setItem('gameResults_EHC-FUPD', JSON.stringify(finalResults));
        console.log("Final EHC-FUPD Results:", finalResults);
    }

    // --- UI Helper Functions ---
    function updateBallPosition() {
        ball.style.transform = `translate(${ballPos.x - BALL_RADIUS}px, ${ballPos.y - BALL_RADIUS}px)`;
    }

    function updateBallAppearance(distance) {
        if (distance < BALL_RADIUS / 2) ball.className = 'ball white';
        else if (distance < BALL_RADIUS) ball.className = 'ball orange';
        else ball.className = 'ball red';
    }

    function getDistance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    function updateProgressBar() {
        let progress = 0;
        let phaseText = '';
        if (currentSegmentIndex < 2) { // Practice
            const practiceDuration = SEGMENTS[0].duration + SEGMENTS[1].duration;
            progress = (timeElapsedInPhase / practiceDuration) * 100;
            phaseText = window.STRINGS.practice_round_title || 'Practice';
        } else { // Testing
            progress = (timeElapsedInPhase / TOTAL_TESTING_DURATION) * 100;
            phaseText = window.STRINGS.main_game_title || 'Main Game';
        }

        progressBarFill.style.width = `${Math.min(100, progress)}%`;
        if (currentSegmentIndex < SEGMENTS.length) {
            progressText.textContent = `${phaseText} - ${SEGMENTS[currentSegmentIndex].speed}`;
        }
    }
});
