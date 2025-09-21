
QUnit.module('Timer Bug Fixes', function(hooks) {
    hooks.beforeEach(function() {
        const gameSetupModal = document.getElementById('game-setup-modal');
        if (gameSetupModal) {
            gameSetupModal.style.display = 'none';
        }
        const mainLayout = document.getElementById('main-layout');
        if (mainLayout) {
            mainLayout.style.display = 'flex';
        }
        localStorage.clear();
        Game.setState({
            board: [
                ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
                ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
                ['', '', '', '', '', '', '', ''],
                ['', '', '', '', '', '', '', ''],
                ['', '', '', '', '', '', '', ''],
                ['', '', '', '', '', '', '', ''],
                ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
                ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
            ],
            whiteTurn: true,
            whiteKingMoved: false,
            blackKingMoved: false,
            whiteRooksMoved: [false, false],
            blackRooksMoved: [false, false],
            fiftyMoveRuleCounter: 0,
            lastMove: null,
            moveHistory: [],
            boardHistory: [],
            whiteCaptured: [],
            blackCaptured: []
        });
        // Set a very short time for testing
        window.whiteTime = 1;
        window.blackTime = 1;
        window.startTimer();
    });

    QUnit.test('should end the game and prevent moves when the timer runs out', function(assert) {
        const done = assert.async();
        setTimeout(function() {
            const gameOverModal = document.getElementById('game-over-modal');
            assert.equal(gameOverModal.style.display, 'flex', 'Game over modal should be displayed');
            assert.ok(window.isUIBlocked, "UI should be blocked after timer runs out");

            // Attempt to make a move after the game is over
            const startRow = 6;
            const startCol = 4;
            const endRow = 4;
            const endCol = 4;

            // Find the squares
            const startSquare = document.querySelector(`.square[data-row='${startRow}'][data-col='${startCol}']`);
            const endSquare = document.querySelector(`.square[data-row='${endRow}'][data-col='${endCol}']`);

            // Simulate a click
            const clickEvent = new Event('click', { bubbles: true });
            startSquare.dispatchEvent(clickEvent);
            endSquare.dispatchEvent(clickEvent);
            
            // Check if the piece has moved
            const pieceAtStart = Game.getState().board[startRow][startCol];
            assert.ok(pieceAtStart, 'Piece should not have moved after game over');
            
            done();
        }, 2000); // Wait for the timer to run out
    });

    QUnit.test('timer display should not show negative values', function(assert) {
        const done = assert.async();
        setTimeout(function() {
            const whiteTimer = document.getElementById('white-timer').textContent;
            const blackTimer = document.getElementById('black-timer').textContent;
            assert.notOk(whiteTimer.includes('-'), "White's timer should not be negative");
            assert.notOk(blackTimer.includes('-'), "Black's timer should not be negative");
            done();
        }, 2000);
    });
});
