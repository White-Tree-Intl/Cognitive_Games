// static/js/maze_game.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const instructionsScreen = document.getElementById('instructions-screen');
    const startGameBtn = document.getElementById('start-game-btn');
    const gameArea = document.getElementById('game-area');
    const mazeGrid = document.getElementById('maze-grid');
    const interactiveLayer = document.getElementById('interactive-layer');
    const messageDisplay = document.getElementById('message-display');
    const progressBarContainer = document.querySelector('.progress-bar-container');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progressText');
    const infoFooter = document.getElementById('info-footer');
    const currentStepsDisplay = document.getElementById('current-steps');
    const minStepsDisplay = document.getElementById('min-steps');
    const timeLeftDisplay = document.getElementById('time-left');
    const phaseOverlay = document.getElementById('phase-transition-overlay');
    const startMainGameBtn = document.getElementById('start-main-game-btn');
    const practiceAgainBtn = document.getElementById('practice-again-btn');

    // --- Predefined Practice Maze Structure (4x5) ---
    // Using 'isActive' property. Cells with isActive: false are not targetable.
    const practiceMaze = [
        // Row 0
        [ { walls: { T: true, R: false, B: true, L: true }, isActive: true }, { walls: { T: true, R: false, B: false, L: false }, isActive: true }, { walls: { T: true, R: true, B: false, L: false }, isActive: true }, { walls: { T: true, R: true, B: false, L: true }, isActive: true }, { walls: { T: true, R: true, B: false, L: true }, isActive: true } ],
        // Row 1
        [ { walls: { T: true, R: false, B: false, L: true }, isActive: true }, { walls: { T: false, R: true, B: true, L: false }, isActive: true }, { walls: { T: false, R: true, B: false, L: true }, isActive: false }, { walls: { T: false, R: true, B: false, L: true }, isActive: false }, { walls: { T: false, R: true, B: false, L: true }, isActive: false } ],
        // Row 2
        [ { walls: { T: false, R: false, B: false, L: true }, isActive: true }, { walls: { T: true, R: true, B: false, L: false }, isActive: true }, { walls: { T: false, R: true, B: false, L: true }, isActive: false }, { walls: { T: false, R: true, B: false, L: true }, isActive: false }, { walls: { T: false, R: true, B: false, L: true }, isActive: false } ],
        // Row 3
        [ { walls: { T: false, R: false, B: true, L: true }, isActive: true }, { walls: { T: false, R: true, B: true, L: false }, isActive: true }, { walls: { T: false, R: false, B: true, L: true }, isActive: true }, { walls: { T: false, R: false, B: true, L: false }, isActive: true }, { walls: { T: false, R: true, B: true, L: false }, isActive: true } ]
    ];


    // --- Predefined Stage 1 Maze with All Walls Closed (7x10) ---
    // Using 'isActive' property.
    const stageOneMaze = [
        [{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:true,B:false,L:false},isActive:true}],
        [{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:false,L:false},isActive:true}],
        [{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:false,L:false},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:true,L:false},isActive:true}],
        [{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:true,B:true,L:false},isActive:true},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:true,B:false,L:false},isActive:true}],
        [{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:false,R:true,B:true,L:false},isActive:true}],
        [{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:true,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:false,B:true,L:false},isActive:true},{walls:{T:true,R:true,B:false,L:false},isActive:true}],
        [{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:false,R:false,B:true,L:false},isActive:true},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:true,L:false},isActive:true}]
    ];

    // --- Predefined Stage 2 Maze with All Walls Closed (9x13) ---
    // Using 'isActive' property.
    const stageTwoMaze = [
        [{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:true,B:false,L:false},isActive:true}],
        [{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:false,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:false},isActive:true}],
        [{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:false,L:false},isActive:false},{walls:{T:false,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false}],
        [{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:true,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false}],
        [{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:true,L:true},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false}],
        [{walls:{T:false,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:false,B:true,L:false},isActive:true},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false}],
        [{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:true,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:false,L:false},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:false,L:false},isActive:true}],
        [{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:true,R:false,B:true,L:true},isActive:true},{walls:{T:false,R:true,B:false,L:false},isActive:true}],
        [{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:false,R:false,B:true,L:false},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:true,R:false,B:true,L:true},isActive:true},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:true,R:false,B:true,L:true},isActive:true},{walls:{T:false,R:true,B:true,L:false},isActive:true}]
    ];

    // --- Predefined Stage 3 Maze with All Walls Closed (13x18) ---
    // Using 'isActive' property.
    const stageThreeMaze = [
        [{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:false,L:false},isActive:true},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:true,R:true,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:true,B:false,L:false},isActive:true}],
        [{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:true,R:false,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:false},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:false,L:false},isActive:true}],
        [{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:false,B:true,L:true},isActive:false},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false}],
        [{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:false,L:false},isActive:true},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:true,B:true,L:true},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false}],
        [{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:false,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:true,B:true,L:true},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false}],
        [{walls:{T:true,R:false,B:true,L:true},isActive:true},{walls:{T:false,R:false,B:true,L:false},isActive:true},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:true,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:false,R:true,B:false,L:false},isActive:true},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false}],
        [{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false}],
        [{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:true,R:true,B:false,L:true},isActive:true},{walls:{T:true,R:true,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false}],
        [{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:false,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:false,R:true,B:true,L:false},isActive:true}],
        [{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:true,L:true},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:true,B:true,L:false},isActive:true},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:true,B:false,L:false},isActive:true}],
        [{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:false,R:true,B:false,L:true},isActive:false},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:false,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false}],
        [{walls:{T:false,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:true,B:false,L:false},isActive:true},{walls:{T:true,R:false,B:false,L:true},isActive:true},{walls:{T:true,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:false,B:false,L:true},isActive:true},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:false,R:false,B:true,L:false},isActive:true},{walls:{T:false,R:false,B:true,L:false},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:false,B:true,L:false},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:true,B:false,L:true},isActive:false}],
        [{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:false,R:true,B:true,L:false},isActive:true},{walls:{T:false,R:false,B:true,L:true},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:false,B:true,L:false},isActive:true},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:true,R:false,B:true,L:false},isActive:false},{walls:{T:false,R:true,B:true,L:false},isActive:true}]
    ];

    // --- Game Configuration ---
    // CHANGED: rows for Learning is now 4
    const MAZE_CONFIG = {
        Learning: { rows: 4, cols: 5, minSteps: 8, maxSteps: 25, time: 300000 },
        Testing1: { rows: 7, cols: 10, minSteps: 17, maxSteps: 40, time: 40000 },
        Testing2: { rows: 9, cols: 13, minSteps: 25, maxSteps: 60, time: 80000 },
        Testing3: { rows: 13, cols: 18, minSteps: 35, maxSteps: 90, time: 120000 },
    };
    const STAGE_ORDER = ['Learning', 'Testing1', 'Testing2', 'Testing3'];

    // --- Game State ---
    let currentStageIndex = 0;
    let isPractice = true;
    let maze, playerPos, goalPos, cellSize; // goalPos is now an object {r, c, w, h}
    let currentSteps = 0;
    let timerInterval;
    let stageStartTime;
    let allStageData = [];
    let controlsActive = false;
    let gameStarted = false;

    // --- Event Listeners ---
    startGameBtn.addEventListener('click', () => startGame(true));
    startMainGameBtn.addEventListener('click', () => startGame(false));
    practiceAgainBtn.addEventListener('click', () => {
        phaseOverlay.style.display = 'none';
        startGame(true); // Restart practice
    });

    setupControls(); // Setup keyboard controls

    // --- Game Flow ---
    function startGame(practice) {
        isPractice = practice;
        // If starting main game, set index to 1 (Testing1). Otherwise, 0 (Learning).
        currentStageIndex = isPractice ? 0 : 1;
        allStageData = []; // Clear previous results
        gameStarted = true;

        // Update UI
        instructionsScreen.style.display = 'none';
        phaseOverlay.style.display = 'none'; // Hide overlay if shown
        progressBarContainer.style.display = 'flex';
        gameArea.style.display = 'block'; // Show maze area
        infoFooter.style.display = 'flex'; // Show steps/time info
        messageDisplay.textContent = ''; // Clear any previous messages

        runNextStage(); // Load and start the first stage
    }

    // CHANGED: Updated goalPos definitions to use {r, c, w, h} format
    function runNextStage() {
        // If it's not practice and we've finished all stages, end the game
        if (!isPractice && currentStageIndex >= STAGE_ORDER.length) {
            endGame();
            return;
        }

        const stageKey = STAGE_ORDER[currentStageIndex]; // e.g., 'Learning', 'Testing1'
        const config = MAZE_CONFIG[stageKey]; // Get config for the current stage

        // Reset stage-specific state
        updateProgressBar();
        currentSteps = 0;
        currentStepsDisplay.textContent = 0;
        minStepsDisplay.textContent = config.minSteps;

        // Load the correct maze structure and define player/goal positions
        if (stageKey === 'Learning') {
            maze = practiceMaze;
            playerPos = { r: 0, c: 4 };
            // Define a 2x2 goal area starting at row 2, col 0 (Correct for 4 rows)
            goalPos = { r: 2, c: 0, w: 2, h: 2 };
        } else if (stageKey === 'Testing1') {
            maze = stageOneMaze;
            playerPos = { r: 0, c: 9 };
            // Define a 2x2 goal area starting at row 5, col 0 (Corrected: 6 -> 5 to fit in 7 rows)
            goalPos = { r: 5, c: 0, w: 2, h: 2 };
        } else if (stageKey === 'Testing2') {
            maze = stageTwoMaze;
            playerPos = { r: 0, c: 12 };
            // Define a 2x2 goal area starting at row 7, col 0 (Corrected: 8 -> 7 to fit in 9 rows)
            goalPos = { r: 7, c: 0, w: 2, h: 2 };
        } else if (stageKey === 'Testing3') {
            maze = stageThreeMaze;
            playerPos = { r: 0, c: 17 };
            // Define a 2x2 goal area starting at row 11, col 0 (Corrected: 12 -> 11 to fit in 13 rows)
            goalPos = { r: 11, c: 0, w: 2, h: 2 };
        } else {
            // Fallback (remains 1x1, no change needed)
            maze = generateMaze(config.rows, config.cols);
            playerPos = { r: 0, c: 0 };
            goalPos = { r: config.rows - 1, c: config.cols - 1, w: 1, h: 1 };
        }

        // Render the maze and start the timer
        renderFullMaze(config);
        startTimer(config.time);
        stageStartTime = performance.now(); // Record start time for duration calculation
        controlsActive = true; // Enable player movement
    }

    function handleStageEnd(reason) {
        controlsActive = false; // Disable movement
        clearInterval(timerInterval); // Stop the timer
        const stageKey = STAGE_ORDER[currentStageIndex];
        const config = MAZE_CONFIG[stageKey];
        const completionTime = performance.now() - stageStartTime; // Calculate duration

        // Record results for this stage
        const stageResult = {
            stage: stageKey,
            steps: currentSteps,
            minSteps: config.minSteps,
            maxSteps: config.maxSteps,
            time: completionTime,
            completed: reason === 'goal_reached',
            reason: reason // 'goal_reached', 'max_steps_reached', 'timeout'
        };
        allStageData.push(stageResult);

        // Transition logic
        if (isPractice) {
            // If practice ended, show the overlay to choose next action
            phaseOverlay.style.display = 'flex';
            return; // Don't automatically proceed
        }

        // If it was a testing stage, move to the next one
        currentStageIndex++;
        if (currentStageIndex >= STAGE_ORDER.length) {
            // All testing stages done, end the game
            endGame();
        } else {
            // Wait a bit before starting the next stage
            messageDisplay.textContent = `Stage ${currentStageIndex -1} finished. Get ready...`; // Temporary message
            setTimeout(runNextStage, 1500); // Start next stage after 1.5 seconds
        }
    }

    function endGame() {
        // Hide game elements, show final message
        gameArea.style.display = 'none';
        infoFooter.style.display = 'none';
        progressBarContainer.style.display = 'none'; // Also hide progress bar
        messageDisplay.textContent = window.STRINGS.task_finished_title;

        calculateAndSaveResults(); // Process and save data

        // Mark game as completed in local storage
        let completedGames = JSON.parse(localStorage.getItem('completedGames')) || [];
        if (!completedGames.includes('MT')) {
            completedGames.push('MT');
            localStorage.setItem('completedGames', JSON.stringify(completedGames));
        }
    }

    // Function to generate a random maze (if predefined ones aren't used)
    // Includes 'isActive: true' for all generated cells by default
    function generateMaze(rows, cols) {
        let grid = Array(rows).fill(null).map(() => Array(cols).fill(null).map(() => ({
            visited: false, walls: { T: true, R: true, B: true, L: true }, isActive: true
        })));

        function carve(r, c) {
            grid[r][c].visited = true;
            const neighbors = shuffle([{r:r-1,c:c,w:'T',o:'B'}, {r:r+1,c:c,w:'B',o:'T'}, {r:r,c:c-1,w:'L',o:'R'}, {r:r,c:c+1,w:'R',o:'L'}]);
            for (const {r:nr, c:nc, w, o} of neighbors) {
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc].visited) {
                    grid[r][c].walls[w] = false;
                    grid[nr][nc].walls[o] = false;
                    carve(nr, nc);
                }
            }
        }
        carve(0, 0); // Start carving from top-left
        return grid;
    }

    // CHANGED: Updated win condition check to use goal area boundaries
    function handleMove(r, c) {
        if (!controlsActive) return; // Ignore if controls are disabled

        playerPos = { r, c }; // Update player position
        currentSteps++; // Increment step count
        currentStepsDisplay.textContent = currentSteps; // Update UI
        renderInteractiveElements(); // Re-render player and possible moves

        // Check if player is within the goal area
        const { r: goalR, c: goalC, w: goalW, h: goalH } = goalPos;
        if (playerPos.r >= goalR && playerPos.r < goalR + goalH &&
            playerPos.c >= goalC && playerPos.c < goalC + goalW) {
            handleStageEnd('goal_reached'); // End stage successfully
        } else if (currentSteps >= MAZE_CONFIG[STAGE_ORDER[currentStageIndex]].maxSteps) {
            handleStageEnd('max_steps_reached'); // End stage due to too many steps
        }
    }

    function calculateAndSaveResults() {
        const testingStages = allStageData.filter(s => s.stage.startsWith('Testing'));
        if (testingStages.length === 0) return;

        const completedMazes = testingStages.filter(s => s.completed);
        const getSteps = (stageKey) => {
            const stage = testingStages.find(s => s.stage === stageKey);
            return stage ? stage.steps : null;
        };
        const getTime = (stageKey) => {
            const stage = testingStages.find(s => s.stage === stageKey);
            return (stage && stage.completed) ? stage.time : null;
        };
        const getAdditionalStepsDirect = (s) => s ? Math.max(0, s.steps - s.minSteps) : 0;
        const getAdditionalStepsPercent = (s) => {
            if (!s || !s.completed) return 0;
            const maxAdditional = s.maxSteps - s.minSteps;
            return maxAdditional > 0 ? (getAdditionalStepsDirect(s) / maxAdditional) * 100 : 0;
        };

        const finalResults = {
            mazes_completed: completedMazes.length,
            mazes_completed_with_additional_steps: completedMazes.filter(s => s.steps > s.minSteps).length,
            mazes_completed_without_additional_steps: completedMazes.filter(s => s.steps === s.minSteps).length,
            mazes_not_completed_due_to_reaching_max_steps: testingStages.filter(s => s.reason === 'max_steps_reached').length,
            omission_errors: testingStages.filter(s => s.reason === 'timeout').length,
            completion_time: completedMazes.length > 0 ? completedMazes.reduce((sum, s) => sum + s.time, 0) / completedMazes.length : 0,
            completion_time_in_first_maze: getTime('Testing1'),
            completion_time_in_second_maze: getTime('Testing2'),
            completion_time_in_third_maze: getTime('Testing3'),
            steps_in_first_maze: getSteps('Testing1'),
            steps_in_second_maze: getSteps('Testing2'),
            steps_in_third_maze: getSteps('Testing3'),
            additional_steps_direct_score: completedMazes.length > 0 ? completedMazes.reduce((sum, s) => sum + getAdditionalStepsDirect(s), 0) / completedMazes.length : 0,
            additional_steps: completedMazes.length > 0 ? completedMazes.reduce((sum, s) => sum + getAdditionalStepsPercent(s), 0) / completedMazes.length : 0,
            additional_steps_in_first_maze: getAdditionalStepsPercent(testingStages.find(s => s.stage === 'Testing1')),
            additional_steps_in_second_maze: getAdditionalStepsPercent(testingStages.find(s => s.stage === 'Testing2')),
            additional_steps_in_third_maze: getAdditionalStepsPercent(testingStages.find(s => s.stage === 'Testing3')),
        };

        localStorage.setItem('gameData_MT', JSON.stringify(allStageData));
        localStorage.setItem('gameResults_MT', JSON.stringify(finalResults));
        console.log("Final Maze Test Results:", finalResults);
    }

    // Recalculates sizes and re-renders the maze grid and interactive elements
    function renderFullMaze(config) {
        const areaRect = gameArea.getBoundingClientRect();
        // Check if game area is visible and has dimensions
        if (areaRect.width === 0 || areaRect.height === 0) {
             console.error("Maze gameArea dimensions are zero. Cannot render maze.");
             return;
        }

        // Calculate the maximum possible size for each cell based on container dimensions
        const maxCellWidth = Math.floor(areaRect.width / config.cols);
        const maxCellHeight = Math.floor(areaRect.height / config.rows);
        cellSize = Math.floor(Math.min(maxCellWidth, maxCellHeight)); // Use the smaller dimension to fit

        // Calculate the total grid size based on cell size
        const gridWidth = cellSize * config.cols;
        const gridHeight = cellSize * config.rows;

        // Apply calculated dimensions to the grid and interactive layer containers
        mazeGrid.style.width = `${gridWidth}px`;
        mazeGrid.style.height = `${gridHeight}px`;
        interactiveLayer.style.width = `${gridWidth}px`;
        interactiveLayer.style.height = `${gridHeight}px`;

        // Set up CSS Grid layout for the maze walls
        mazeGrid.style.gridTemplateColumns = `repeat(${config.cols}, ${cellSize}px)`;
        mazeGrid.style.gridTemplateRows = `repeat(${config.rows}, ${cellSize}px)`;

        // Render the visual components
        renderMazeWalls(config); // Draw the walls
        renderInteractiveElements(); // Draw the player, goal, and moves
    }

    // CHANGED: Logic to ignore 'isActive' for rendering walls
    function renderMazeWalls(config) {
        mazeGrid.innerHTML = ''; // Clear previous walls
        for (let r = 0; r < config.rows; r++) {
            for (let c = 0; c < config.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'maze-cell'; // Start with the base style
                if(maze[r] && maze[r][c]){
                    // Apply wall classes based on the 'walls' property, ignoring 'isActive'
                    const walls = maze[r][c].walls;
                    if (walls.T) cell.classList.add('wall-top');
                    if (walls.R) cell.classList.add('wall-right');
                    if (walls.B) cell.classList.add('wall-bottom');
                    if (walls.L) cell.classList.add('wall-left');
                }
                mazeGrid.appendChild(cell);
            }
        }
    }

    // Core function for finding possible moves using jump-logic, respects 'isActive'
    function findPossibleMoves() {
        const moves = [];
        // Basic checks for valid state
        if (!maze || !playerPos || !maze[playerPos.r] || !maze[playerPos.r][playerPos.c]) {
            return moves;
        }

        const { r, c } = playerPos; // Current player position
        // Define the four directions and corresponding wall checks
        const directions = [
            { dr: -1, dc: 0, wall: 'T' }, // Up
            { dr: 1, dc: 0, wall: 'B' },  // Down
            { dr: 0, dc: -1, wall: 'L' }, // Left
            { dr: 0, dc: 1, wall: 'R' }   // Right
        ];

        // Check each direction
        for (const dir of directions) {
            let currentR = r;
            let currentC = c;

            // Keep moving in the current direction until blocked or an active cell is found
            while (true) {
                // Is there a wall blocking movement from the current cell in this direction?
                if (maze[currentR][currentC].walls[dir.wall]) {
                    break; // Hit a wall, stop searching this path
                }

                // Calculate the coordinates of the next cell
                const nextR = currentR + dir.dr;
                const nextC = currentC + dir.dc;

                // Check if the next cell is outside the maze boundaries
                if (nextR < 0 || nextR >= maze.length || nextC < 0 || nextC >= maze[0].length) {
                    break; // Reached the edge of the maze
                }

                // Check if the next cell is active
                if (maze[nextR][nextC].isActive) {
                    moves.push({ r: nextR, c: nextC }); // Found a valid target cell
                    break; // Stop searching in this direction
                }

                // If the next cell is inactive, continue the search *from* that cell
                // This allows jumping over inactive cells
                currentR = nextR;
                currentC = nextC;
            }
        }
        return moves; // Return the list of reachable active cells
    }

    // CHANGED: Renders a single goal area and uses findPossibleMoves
    function renderInteractiveElements() {
        interactiveLayer.innerHTML = ''; // Clear previous elements
        if (!maze || !playerPos || !goalPos) return; // Need maze, player, and goal defined

        // --- Render Player (No changes) ---
        const playerEl = document.createElement('div');
        playerEl.className = 'maze-player';
        playerEl.style.width = `${cellSize * 0.7}px`;
        playerEl.style.height = `${cellSize * 0.7}px`;
        playerEl.style.transform = `translate(${playerPos.c * cellSize + cellSize * 0.15}px, ${playerPos.r * cellSize + cellSize * 0.15}px)`;
        interactiveLayer.appendChild(playerEl);

        // --- Render Goal Area (Adjusted for size and to hide internal moves) ---
        const goalEl = document.createElement('div');
        goalEl.className = 'maze-goal';

        // 1. Make the goal circle slightly smaller
        const goalMargin = cellSize * 0.1; // 10% margin
        const goalWidth = (cellSize * goalPos.w) - (2 * goalMargin);
        const goalHeight = (cellSize * goalPos.h) - (2 * goalMargin);
        const goalLeft = (goalPos.c * cellSize) + goalMargin;
        const goalTop = (goalPos.r * cellSize) + goalMargin;

        goalEl.style.width = `${Math.max(cellSize * 0.5, goalWidth)}px`;
        goalEl.style.height = `${Math.max(cellSize * 0.5, goalHeight)}px`;
        goalEl.style.transform = `translate(${goalLeft}px, ${goalTop}px)`;

        // Make it a circle if it's a square (like 1x1 or 2x2)
        if (goalPos.w === goalPos.h) {
            goalEl.style.borderRadius = '50%'; // This makes it a circle
        } else {
            goalEl.style.borderRadius = '8px';
        }
        interactiveLayer.appendChild(goalEl);
        // --- End of Goal Rendering ---


        // --- Find and Render Possible Moves ---
        const possibleMoves = findPossibleMoves();

        possibleMoves.forEach(move => {
            // 2. Check if the move is inside the goal area
            const isInsideGoal = (
                move.r >= goalPos.r && move.r < goalPos.r + goalPos.h &&
                move.c >= goalPos.c && move.c < goalPos.c + goalPos.w
            );

            // Only render the move circle if it is NOT inside the goal area
            if (!isInsideGoal) {
                const moveEl = document.createElement('div');
                moveEl.className = 'maze-possible-move';
                moveEl.style.width = `${cellSize * 0.5}px`;
                moveEl.style.height = `${cellSize * 0.5}px`;
                moveEl.style.transform = `translate(${move.c * cellSize + cellSize * 0.25}px, ${move.r * cellSize + cellSize * 0.25}px)`;

                moveEl.addEventListener('click', (e) => {
                     e.preventDefault();
                     handleMove(move.r, move.c);
                });
                moveEl.addEventListener('touchend', (e) => {
                     e.preventDefault();
                     handleMove(move.r, move.c);
                });
                interactiveLayer.appendChild(moveEl);
            }
        });
    }

    // Starts or restarts the countdown timer for the stage
    function startTimer(timeLimit) {
        clearInterval(timerInterval); // Clear any existing timer
        let timeLeft = timeLimit; // Set initial time
        timeLeftDisplay.textContent = Math.ceil(timeLeft / 1000); // Display initial time

        // Update timer every second
        timerInterval = setInterval(() => {
            timeLeft -= 1000;
            timeLeftDisplay.textContent = Math.ceil(timeLeft / 1000); // Update UI
            if (timeLeft <= 0) {
                // Time's up
                clearInterval(timerInterval);
                handleStageEnd('timeout'); // End stage due to timeout
            }
        }, 1000);
    }

    // CHANGED: Keyboard controls now use findPossibleMoves
    function setupControls() {
        document.onkeydown = (e) => {
            // Only process key presses if game is active
            if (!gameStarted || !controlsActive) return;

            const possibleMoves = findPossibleMoves(); // Get valid jump targets
            let targetMove = null;

            // Determine target based on arrow key pressed
            if (e.key === 'ArrowUp') {
                // Find the first possible move directly above the player
                targetMove = possibleMoves.find(m => m.r < playerPos.r && m.c === playerPos.c);
            } else if (e.key === 'ArrowDown') {
                 // Find the first possible move directly below the player
                targetMove = possibleMoves.find(m => m.r > playerPos.r && m.c === playerPos.c);
            } else if (e.key === 'ArrowLeft') {
                // Find the first possible move directly left of the player
                targetMove = possibleMoves.find(m => m.c < playerPos.c && m.r === playerPos.r);
            } else if (e.key === 'ArrowRight') {
                // Find the first possible move directly right of the player
                targetMove = possibleMoves.find(m => m.c > playerPos.c && m.r === playerPos.r);
            }

            // If a valid move was found for the key press, execute it
            if (targetMove) {
                handleMove(targetMove.r, targetMove.c);
            }
        };
    }

    // Utility function to shuffle an array (used for maze generation)
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Updates the progress bar UI
    function updateProgressBar() {
        // Handle practice stage index correctly (always show as first step)
        const displayStageIndex = isPractice ? 0 : currentStageIndex;
        // Calculate progress percentage
        const progress = (displayStageIndex / STAGE_ORDER.length) * 100;
        progressBarFill.style.width = `${progress}%`; // Update bar width
        // Update text based on practice or testing stage
        progressText.textContent = isPractice ? 'Practice' : `Stage ${currentStageIndex}/${STAGE_ORDER.length - 1}`;
    }

    // Re-render the maze when the window (or game area) is resized
    const resizeObserver = new ResizeObserver(() => {
        // Only re-render if the game has started and the area is visible
        if(gameStarted && gameArea.style.display === 'block') {
            const currentConfig = MAZE_CONFIG[STAGE_ORDER[currentStageIndex]];
            renderFullMaze(currentConfig); // Call the main render function
        }
    });
    resizeObserver.observe(gameArea); // Start observing the game area for size changes
});