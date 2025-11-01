// static/js/eye_hand_mud_game.js
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
    const touchMarker = document.getElementById('touch-marker'); // CHANGED: Added marker element


    // --- Game Configuration ---
    const BALL_RADIUS = 25;
    const SPEEDS = { 'Slow': 0.5, 'Fast': 0.75 };
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
    let ballVelocity = { x: 0, y: 0 };
    let rawData = [];
    let dataCollectorInterval;
    let animationFrameId;
    let timeElapsedInPhase = 0;
    let segmentTimeout;
    // CHANGED: Added state for the touch marker
    let markerPos = { x: 0, y: 0 };
    const touchOffset = { x: -50, y: -50 }; // The offset between the finger and the marker

    // --- Event Listeners ---
    startGameBtn.addEventListener('click', setupGame);
    startMainGameBtn.addEventListener('click', () => {
        phaseOverlay.style.display = 'none';
        startMainGame();
    });
    practiceAgainBtn.addEventListener('click', () => {
        phaseOverlay.style.display = 'none';
        resetAndStartPractice();
    });
    window.addEventListener('resize', checkOrientation);

    // --- Orientation Check ---
    function isMobile() {
        return /Mobi|Android/i.test(navigator.userAgent);
    }

    function checkOrientation() {
        if (!isMobile()) return;
        if (window.innerHeight > window.innerWidth) {
            rotatePrompt.style.display = 'flex';
        } else {
            rotatePrompt.style.display = 'none';
        }
    }

    // --- Game Setup ---
    // CHANGED: This function is updated with new event listeners
    function setupGame() {
        checkOrientation();
        instructionsScreen.style.display = 'none';
        progressBarContainer.style.display = 'flex';
        gameArea.style.display = 'block';

        const areaRect = gameArea.getBoundingClientRect();
        ballPos = { x: areaRect.width / 2, y: areaRect.height / 2 };
        updateBallPosition();
        ball.className = 'ball orange';

        // Listen for mousemove
        gameArea.addEventListener('mousemove', trackMouse);

        // Listen for touch events, changing passive to false to allow preventDefault
        gameArea.addEventListener('touchstart', trackMouse, { passive: false });
        gameArea.addEventListener('touchmove', trackMouse, { passive: false });

        // Add listener to hide marker when touch ends
        gameArea.addEventListener('touchend', handleTouchEnd);
    }

    // CHANGED: Added this new function
    function handleTouchEnd(e) {
        if (touchMarker) {
            touchMarker.style.visibility = 'hidden';
        }
    }

    // CHANGED: This function is completely rewritten for the marker logic
    function trackMouse(e) {
        const areaRect = gameArea.getBoundingClientRect();
        let clientX, clientY;

        // Check if it is a touch event
        if (e.touches && e.touches.length > 0) {
            e.preventDefault(); // Prevent screen scrolling
            touchMarker.style.visibility = 'visible'; // Show the custom '+' marker

            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;

            // Calculate raw finger position
            mousePos = { x: clientX - areaRect.left, y: clientY - areaRect.top };

            // Calculate the offset marker's position
            markerPos = { x: mousePos.x + touchOffset.x, y: mousePos.y + touchOffset.y };

            // Move the visual marker
            touchMarker.style.transform = `translate(${markerPos.x}px, ${markerPos.y}px) translate(-50%, -50%)`;

        } else if (e.clientX) { // Check if it's a mouse event
            clientX = e.clientX;
            clientY = e.clientY;

            // For mouse, markerPos is the same as mousePos
            mousePos = { x: clientX - areaRect.left, y: clientY - areaRect.top };
            markerPos = mousePos; // No offset

        } else {
            return; // Not a valid event
        }

        // --- Game Logic based on MARKER position ---
        const distance = getDistance(markerPos, ballPos);
        updateBallAppearance(distance);

        // Start game if marker is on the ball
        if (!gameStarted && distance < BALL_RADIUS / 2) {
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

        gameTitle.textContent = window.STRINGS.practice_round_title;
        runSegmentManager();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function startMainGame() {
        currentSegmentIndex = 2; // Start from the first testing segment
        timeElapsedInPhase = 0;
        rawData = [];

        gameTitle.textContent = window.STRINGS.main_game_title;
        gameActive = true;
        dataCollectorInterval = setInterval(collectDataPoint, DATA_COLLECTION_INTERVAL);
        runSegmentManager();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // CHANGED: Updated to use markerPos for ball color
    function gameLoop() {
        if (!gameActive) return;

        const segment = SEGMENTS[currentSegmentIndex];
        if (!segment) {
            endGame();
            return;
        }
        const speed = SPEEDS[segment.speed];

        ballPos.x += ballVelocity.x * speed;
        ballPos.y += ballVelocity.y * speed;

        handleWallCollision();
        updateBallPosition();

        if (gameStarted) {
            // FIX: Use markerPos to check distance, not mousePos
            updateBallAppearance(getDistance(markerPos, ballPos));
        }
        updateProgressBar();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function runSegmentManager() {
        if (currentSegmentIndex >= SEGMENTS.length) return;

        const segment = SEGMENTS[currentSegmentIndex];
        setRandomVelocity(); // Change direction at the start of each segment

        segmentTimeout = setTimeout(() => {
            timeElapsedInPhase += segment.duration;
            currentSegmentIndex++;

            if (currentSegmentIndex >= SEGMENTS.length) {
                endGame();
            } else if (currentSegmentIndex === 2) { // End of learning phase
                gameActive = false;
                cancelAnimationFrame(animationFrameId);
                clearTimeout(segmentTimeout);
                phaseOverlay.style.display = 'flex';
            } else {
                runSegmentManager();
            }
        }, segment.duration);
    }

    function handleWallCollision() {
        const areaRect = gameArea.getBoundingClientRect();
        if (ballPos.x - BALL_RADIUS < 0) {
            ballPos.x = BALL_RADIUS;
            ballVelocity.x *= -1;
        } else if (ballPos.x + BALL_RADIUS > areaRect.width) {
            ballPos.x = areaRect.width - BALL_RADIUS;
            ballVelocity.x *= -1;
        }
        if (ballPos.y - BALL_RADIUS < 0) {
            ballPos.y = BALL_RADIUS;
            ballVelocity.y *= -1;
        } else if (ballPos.y + BALL_RADIUS > areaRect.height) {
            ballPos.y = areaRect.height - BALL_RADIUS;
            ballVelocity.y *= -1;
        }
    }

    function setRandomVelocity() {
        const angle = Math.random() * 2 * Math.PI;
        ballVelocity = { x: Math.cos(angle), y: Math.sin(angle) };
    }

    // CHANGED: Updated to use markerPos for data accuracy
    function collectDataPoint() {
        if (!gameActive || currentSegmentIndex < 2) return;
        const segment = SEGMENTS[currentSegmentIndex];
        // FIX: Use markerPos for data collection distance
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
        cancelAnimationFrame(animationFrameId);
        clearTimeout(segmentTimeout);
        clearInterval(dataCollectorInterval);

        // Hide game elements and show end screen
        gameArea.style.display = 'none';
        progressBarContainer.style.display = 'none';
        gameTitle.style.display = 'none';
        endGameScreen.style.display = 'block';


        calculateAndSaveResults();
        messageDisplay.textContent = window.STRINGS.task_finished_title;

        let completedGames = JSON.parse(localStorage.getItem('completedGames')) || [];
        if (!completedGames.includes('EHC-MUD')) {
            completedGames.push('EHC-MUD');
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

        localStorage.setItem('gameData_EHC-MUD', JSON.stringify(rawData));
        localStorage.setItem('gameResults_EHC-MUD', JSON.stringify(finalResults));
        console.log("Final EHC-MUD Results:", finalResults);
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
        if (currentSegmentIndex < 2) {
            const practiceDuration = SEGMENTS[0].duration + SEGMENTS[1].duration;
            progress = (timeElapsedInPhase / practiceDuration) * 100;
            phaseText = window.STRINGS.practice_round_title || 'Practice';
        } else {
            progress = (timeElapsedInPhase / TOTAL_TESTING_DURATION) * 100;
            phaseText = window.STRINGS.main_game_title || 'Main Game';
        }

        progressBarFill.style.width = `${Math.min(100, progress)}%`;
        if (currentSegmentIndex < SEGMENTS.length) {
            progressText.textContent = `${phaseText} - ${SEGMENTS[currentSegmentIndex].speed}`;
        }
    }
});
