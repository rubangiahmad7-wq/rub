const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const newGameButton = document.getElementById('newGameBtn');

const pieces = {
  p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
  P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
};

const startPosition = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

let gameState = [];
let selectedSquare = null;
let legalMoves = [];
let turn = 'white';

function startGame() {
  gameState = startPosition.map(row => [...row]);
  selectedSquare = null;
  legalMoves = [];
  turn = 'white';
  statusElement.textContent = 'Giliran White (Putih). Klik bidak untuk memilih.';
  renderBoard();
}

function renderBoard() {
  boardElement.innerHTML = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
      square.dataset.row = row;
      square.dataset.col = col;

      if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
        square.classList.add('selected');
      }

      if (legalMoves.some(move => move.row === row && move.col === col)) {
        square.classList.add('movetarget');
      }

      const piece = gameState[row][col];
      if (piece) {
        const pieceElement = document.createElement('span');
        pieceElement.className = 'piece';
        pieceElement.textContent = pieces[piece] || '';
        square.appendChild(pieceElement);
      }

      square.addEventListener('click', () => handleSquareClick(row, col));
      boardElement.appendChild(square);
    }
  }
}

function handleSquareClick(row, col) {
  const piece = gameState[row][col];
  const color = getPieceColor(piece);

  if (selectedSquare) {
    if (selectedSquare.row === row && selectedSquare.col === col) {
      clearSelection();
      return;
    }

    if (legalMoves.some(move => move.row === row && move.col === col)) {
      movePiece(selectedSquare.row, selectedSquare.col, row, col);
      clearSelection();
      switchTurn();
      return;
    }

    if (piece && color === turn) {
      selectSquare(row, col);
      return;
    }

    statusElement.textContent = 'Langkah tidak valid. Pilih bidak yang sesuai giliran atau tujuan valid.';
    return;
  }

  if (piece && color === turn) {
    selectSquare(row, col);
  } else if (piece) {
    statusElement.textContent = `Bukan giliran ${color}. Giliran ${turn}.`;
  }
}

function selectSquare(row, col) {
  selectedSquare = { row, col, piece: gameState[row][col] };
  legalMoves = getLegalMoves(row, col, gameState[row][col]);
  statusElement.textContent = legalMoves.length
    ? `Bidak ${selectedSquare.piece} dipilih. Pilih tujuan valid.`
    : 'Bidak tidak memiliki langkah valid.';
  renderBoard();
}

function clearSelection() {
  selectedSquare = null;
  legalMoves = [];
  renderBoard();
}

function getPieceColor(piece) {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? 'white' : 'black';
}

function isWithinBoard(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function isEnemy(cellPiece, color) {
  if (!cellPiece) return false;
  return getPieceColor(cellPiece) !== color;
}

function isEmpty(row, col) {
  return gameState[row][col] === '';
}

function getLegalMoves(row, col, piece) {
  const moves = [];
  const color = getPieceColor(piece);
  if (!piece || !color) return moves;

  const directions = {
    p: getPawnMoves,
    r: getSlidingMoves,
    n: getKnightMoves,
    b: getSlidingMoves,
    q: getSlidingMoves,
    k: getKingMoves
  };

  const type = piece.toLowerCase();
  const generator = directions[type];
  if (generator) {
    return generator(row, col, piece, color);
  }
  return moves;
}

function getPawnMoves(row, col, piece, color) {
  const moves = [];
  const direction = color === 'white' ? -1 : 1;
  const startRow = color === 'white' ? 6 : 1;
  const forwardRow = row + direction;

  if (isWithinBoard(forwardRow, col) && isEmpty(forwardRow, col)) {
    moves.push({ row: forwardRow, col });
    const twoStepRow = row + direction * 2;
    if (row === startRow && isWithinBoard(twoStepRow, col) && isEmpty(twoStepRow, col)) {
      moves.push({ row: twoStepRow, col });
    }
  }

  for (const deltaCol of [-1, 1]) {
    const captureCol = col + deltaCol;
    if (isWithinBoard(forwardRow, captureCol) && isEnemy(gameState[forwardRow][captureCol], color)) {
      moves.push({ row: forwardRow, col: captureCol });
    }
  }

  return moves;
}

function getKnightMoves(row, col, piece, color) {
  const moves = [];
  const deltas = [
    [2, 1], [2, -1], [-2, 1], [-2, -1],
    [1, 2], [1, -2], [-1, 2], [-1, -2]
  ];

  for (const [dr, dc] of deltas) {
    const targetRow = row + dr;
    const targetCol = col + dc;
    if (!isWithinBoard(targetRow, targetCol)) continue;
    const targetPiece = gameState[targetRow][targetCol];
    if (!targetPiece || isEnemy(targetPiece, color)) {
      moves.push({ row: targetRow, col: targetCol });
    }
  }

  return moves;
}

function getKingMoves(row, col, piece, color) {
  const moves = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const targetRow = row + dr;
      const targetCol = col + dc;
      if (!isWithinBoard(targetRow, targetCol)) continue;
      const targetPiece = gameState[targetRow][targetCol];
      if (!targetPiece || isEnemy(targetPiece, color)) {
        moves.push({ row: targetRow, col: targetCol });
      }
    }
  }
  return moves;
}

function getSlidingMoves(row, col, piece, color) {
  const moves = [];
  const type = piece.toLowerCase();
  const stepVectors = [];

  if (type === 'r' || type === 'q') {
    stepVectors.push([1, 0], [-1, 0], [0, 1], [0, -1]);
  }
  if (type === 'b' || type === 'q') {
    stepVectors.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
  }

  for (const [dr, dc] of stepVectors) {
    let nextRow = row + dr;
    let nextCol = col + dc;
    while (isWithinBoard(nextRow, nextCol)) {
      const targetPiece = gameState[nextRow][nextCol];
      if (!targetPiece) {
        moves.push({ row: nextRow, col: nextCol });
      } else {
        if (isEnemy(targetPiece, color)) {
          moves.push({ row: nextRow, col: nextCol });
        }
        break;
      }
      nextRow += dr;
      nextCol += dc;
    }
  }

  return moves;
}

function movePiece(fromRow, fromCol, toRow, toCol) {
  const movingPiece = gameState[fromRow][fromCol];
  if (!movingPiece) return;

  gameState[toRow][toCol] = movingPiece;
  gameState[fromRow][fromCol] = '';

  if (movingPiece.toLowerCase() === 'p' && (toRow === 0 || toRow === 7)) {
    gameState[toRow][toCol] = movingPiece === 'P' ? 'Q' : 'q';
    statusElement.textContent = `${turn.charAt(0).toUpperCase() + turn.slice(1)} mempromosikan pion menjadi menteri!`;
  }
}

function switchTurn() {
  turn = turn === 'white' ? 'black' : 'white';
  statusElement.textContent = `Sekarang giliran ${turn === 'white' ? 'White (Putih)' : 'Black (Hitam)'}.`;
  renderBoard();
}

newGameButton.addEventListener('click', startGame);
startGame();
