import React, { useState, useEffect } from "react";
import "./App.css";

/**
 * Color map from project description
 */
const COLORS = {
  primary: "#1565c0",
  secondary: "#424242",
  accent: "#ffb300",
};

const EMPTY_BOARD = Array(9).fill(null);

const GAME_MODES = {
  PvP: "2 Players",
  PvC: "1 Player (vs Computer)",
};

/**
 * Returns the indices of the winning line if there is one on the board, or null if no winner.
 * Used for highlighting the line.
 */
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let line of lines) {
    const [a, b, c] = line;
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return line;
    }
  }
  return null;
}

/**
 * Returns 'X', 'O', or null (draw/unfinished)
 */
function getWinner(squares) {
  const line = calculateWinner(squares);
  if (line) return squares[line[0]];
  return null;
}

/**
 * Returns true if all squares are filled and game is a draw
 */
function isDraw(squares) {
  return squares.every(Boolean) && !getWinner(squares);
}

/** Mini square component for the board */
function Square({ value, onClick, highlight, accent, accentLine }) {
  return (
    <button
      className="ttt-square"
      onClick={onClick}
      tabIndex={0}
      style={{
        color: highlight ? accent : COLORS.secondary,
        borderColor: highlight ? accentLine : COLORS.secondary,
        background: "transparent",
      }}
      aria-label={value ? `Square ${value}` : "Empty square"}
    >
      {value}
    </button>
  );
}

/**
 * The Tic Tac Toe Board (3x3)
 */
function Board({ squares, onMove, winningLine, accent, accentLine, disabled }) {
  function renderSquare(idx) {
    const isWinningSquare = winningLine?.includes(idx);
    return (
      <Square
        key={idx}
        value={squares[idx]}
        onClick={() => onMove(idx)}
        highlight={isWinningSquare}
        accent={accent}
        accentLine={accentLine}
      />
    );
  }
  // Board as rows of squares for semantics/keyboard
  return (
    <div className="ttt-board" aria-label="Tic Tac Toe Board">
      {[0, 1, 2].map((row) => (
        <div className="ttt-board-row" key={row}>
          {[0, 1, 2].map((col) =>
            renderSquare(row * 3 + col)
          )}
        </div>
      ))}
      {disabled && <div className="ttt-board-overlay" />}
    </div>
  );
}

/**
 * Basic computer AI: Picks first available square, or random from available.
 */
function computerMove(squares) {
  // For real challenge, implement minimax, but for this just random from avail
  const available = squares.map((v, i) => (v ? null : i)).filter((i) => i !== null);
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

// Score state
function initialScore() {
  return { X: 0, O: 0, draw: 0 };
}

// PUBLIC_INTERFACE
function App() {
  // Theme toggle state (light only, but keep extensible for future)
  const [theme] = useState("light");

  // Game mode: PvP (2 players) or PvC (vs computer)
  const [mode, setMode] = useState(GAME_MODES.PvP);

  // X always goes first. 'X' (player 1), 'O' (player 2 or computer)
  const [squares, setSquares] = useState([...EMPTY_BOARD]);
  const [xIsNext, setXIsNext] = useState(true);

  // Score
  const [score, setScore] = useState(initialScore);

  // Winning line for highlight
  const [winningLine, setWinningLine] = useState(null);

  // Who won ('X', 'O', null), 'draw'
  const winner = getWinner(squares);
  const draw = isDraw(squares);

  // When game ends, lock board until reset
  const gameOver = Boolean(winner) || draw;

  // Accent colors
  const accentColor = COLORS.accent;
  const accentLine = COLORS.primary;

  // Effect: for PvC, computer ("O") makes its move after human ("X")
  useEffect(() => {
    if (
      mode === GAME_MODES.PvC &&
      !gameOver &&
      !xIsNext
    ) {
      const timeout = setTimeout(() => {
        // Computer move (as "O")
        const idx = computerMove(squares);
        if (idx !== null) {
          handleMove(idx, false); // not a player, computer triggers
        }
      }, 600); // slight delay for feel
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line
  }, [mode, squares, xIsNext, gameOver]);

  // Effect: calculate winning line to highlight
  useEffect(() => {
    setWinningLine(calculateWinner(squares));
  }, [squares]);

  // PUBLIC_INTERFACE
  function handleMove(idx, isPlayer = true) {
    if (squares[idx] || gameOver) {
      return;
    }
    let newSquares = squares.slice();
    newSquares[idx] = xIsNext ? "X" : "O";
    setSquares(newSquares);
    setXIsNext((prev) => !prev);
    // On next render, winner/draw will auto-update
  }

  // PUBLIC_INTERFACE
  function handleModeChange(e) {
    setMode(e.target.value);
    handleReset(e.target.value);
  }

  // PUBLIC_INTERFACE
  function handleReset(selectedMode = mode) {
    setSquares([...EMPTY_BOARD]);
    setXIsNext(true);
    setWinningLine(null);
    // Reset score only if changing mode, not on normal reset
    if (selectedMode !== mode) {
      setScore(initialScore());
    }
  }

  // Score update on game end
  useEffect(() => {
    if (winner || draw) {
      setTimeout(() => {
        setScore((prev) => {
          if (winner) {
            const w = winner;
            return { ...prev, [w]: prev[w] + 1 };
          }
          if (draw) {
            return { ...prev, draw: prev.draw + 1 };
          }
          return prev;
        });
      }, 0);
    }
    // eslint-disable-next-line
  }, [winner, draw]);

  // UI: Player turn text (shows result if over)
  function getStatusText() {
    if (winner) {
      return `Winner: ${winner}`;
    }
    if (draw) {
      return "Draw!";
    }
    if (xIsNext) {
      return mode === GAME_MODES.PvC
        ? "Your turn (X)"
        : "Turn: X";
    }
    return mode === GAME_MODES.PvC
      ? "Computer's turn (O)"
      : "Turn: O";
  }

  // Theme settings
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Responsive center content wrapper
  return (
    <div
      className="App"
      style={{
        minHeight: "100vh",
        background: "#fff",
        color: COLORS.secondary,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <main className="ttt-main-container">
        {/* Title/Header */}
        <div className="ttt-top-container">
          <h1 className="ttt-title" style={{ color: COLORS.primary }}>
            Tic Tac Toe
          </h1>
          {/* Game mode toggle */}
          <div className="ttt-row ttt-mode-row">
            <label htmlFor="ttt-game-mode" className="ttt-mode-label">
              Mode:
            </label>
            <select
              id="ttt-game-mode"
              className="ttt-mode-select"
              value={mode}
              onChange={handleModeChange}
              aria-label="Select game mode"
            >
              {Object.values(GAME_MODES).map((m) => (
                <option value={m} key={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          {/* Status */}
          <div className="ttt-status" style={{ color: accentColor }}>
            {getStatusText()}
          </div>
          {/* Scoreboard */}
          <div className="ttt-scoreboard" role="region" aria-label="Scoreboard">
            <span
              className="ttt-score ttt-x"
              style={{
                color: COLORS.primary,
                fontWeight: "bold",
              }}
            >
              X: {score.X}
            </span>
            <span className="ttt-score ttt-divider" style={{ color: COLORS.secondary }}>
              &nbsp;|&nbsp;
            </span>
            <span
              className="ttt-score ttt-o"
              style={{
                color: COLORS.secondary,
                fontWeight: "bold",
              }}
            >
              O: {score.O}
            </span>
            <span className="ttt-score ttt-divider" style={{ color: COLORS.secondary }}>
              &nbsp;|&nbsp;
            </span>
            <span className="ttt-score ttt-draw" style={{ color: "#888" }}>
              Draw: {score.draw}
            </span>
          </div>
        </div>
        {/* Board */}
        <Board
          squares={squares}
          onMove={idx => {
            if (gameOver) return;
            // Human only moves on X or in PvP
            if (
              mode === GAME_MODES.PvC &&
              !xIsNext
            ) {
              return;
            }
            handleMove(idx, true);
          }}
          winningLine={winningLine}
          accent={accentColor}
          accentLine={accentLine}
          disabled={gameOver || (mode === GAME_MODES.PvC && !xIsNext)}
        />
        {/* Reset button */}
        <div className="ttt-row ttt-reset-row">
          <button
            className="ttt-reset-btn"
            onClick={() => handleReset()}
            aria-label="Restart game"
            style={{
              background: COLORS.primary,
              color: "#fff",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Restart
          </button>
        </div>
        {/* Footer hint */}
        <div style={{ fontSize: 12, color: "#aaa", textAlign: "center", marginTop: 24 }}>
          {mode === GAME_MODES.PvC
            ? "You play as X. Computer plays O."
            : "Player 1: X | Player 2: O"}
        </div>
      </main>
    </div>
  );
}

export default App;
