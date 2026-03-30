const WORLD_COLS = 19;
const WORLD_ROWS = 19;
const BOARD_PADDING = 34;
const COORD_MAX_X = Math.floor(WORLD_COLS / 2);
const COORD_MAX_Y = Math.floor(WORLD_ROWS / 2);
const TICK_MS = 45;
const MIN_BODY_LENGTH = 3;
const MAX_BODY_LENGTH = 6;
const SUPPORT_RADIUS = 0.55;
const CHALLENGE_BODY_THRESHOLD = 9;
const CHALLENGE_TOP_ROW = 4;
const QUADRATIC_UNLOCK_SCORE = 120;
const CIRCLE_UNLOCK_SCORE = 260;
const DEFUSER_COST = 30;
const POLYNOMIAL_TOOL_COST = 45;
const POLYNOMIAL_BOMB_BONUS = 20;
const POLYNOMIAL_TOOL_THICKNESS = 1.35;
const GAME_MODES = {
  standard: {
    id: "standard",
    name: "Standard",
    description: "Default mix of lines, unlocks, choices, bombs, and store tools.",
    families: () => {
      const families = ["linear"];
      if (state.score >= QUADRATIC_UNLOCK_SCORE) {
        families.push("quadratic");
      }
      if (state.score >= CIRCLE_UNLOCK_SCORE) {
        families.push("circle");
      }
      return families;
    },
    specials: "default",
    choiceMode: "normal",
    infinitePolynomial: false,
    showDefuser: true,
  },
  curves_only: {
    id: "curves_only",
    name: "Curves Only",
    description: "Only quadratic and circle equations appear from the start.",
    families: () => ["quadratic", "circle"],
    specials: "default",
    choiceMode: "normal",
    infinitePolynomial: false,
    showDefuser: true,
  },
  bomb_timer: {
    id: "bomb_timer",
    name: "Bomb Timer",
    description: "Bombs are the only special block. Everything else is plain.",
    families: () => {
      const families = ["linear"];
      if (state.score >= QUADRATIC_UNLOCK_SCORE) {
        families.push("quadratic");
      }
      if (state.score >= CIRCLE_UNLOCK_SCORE) {
        families.push("circle");
      }
      return families;
    },
    specials: "bombs_only",
    choiceMode: "normal",
    infinitePolynomial: false,
    showDefuser: true,
  },
  self_formula: {
    id: "self_formula",
    name: "Self Formula",
    description: "No multiple choice. You clear only with your own typed equation.",
    families: () => ["linear"],
    specials: "default",
    choiceMode: "self_formula_only",
    infinitePolynomial: true,
    showDefuser: false,
  },
};
const STORAGE_KEYS = {
  bestScore: "equationRigidBodies.bestScore",
  leaderboard: "equationRigidBodies.leaderboard",
  playerName: "equationRigidBodies.playerName",
  tutorialHidden: "equationRigidBodies.tutorialHidden",
  selectedMode: "equationRigidBodies.selectedMode",
};
const COLORS = ["#e76f51", "#f4a261", "#e9c46a", "#2a9d8f", "#457b9d", "#8d5fd3"];
const SPECIAL_TYPES = {
  NORMAL: "normal",
  ARMORED: "armored",
  COIN: "coin",
  GLASS: "glass",
  BOMB: "bomb",
};

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const moneyEl = document.getElementById("money");
const bestScoreEl = document.getElementById("bestScore");
const timerStatEl = document.getElementById("timerStat");
const modeTimerEl = document.getElementById("modeTimer");
const bodyCountEl = document.getElementById("bodyCount");
const targetLabelEl = document.getElementById("targetLabel");
const comboCountEl = document.getElementById("comboCount");
const queueEl = document.getElementById("queue");
const choicesEl = document.getElementById("choices");
const statusEl = document.getElementById("status");
const activeLabelEl = document.getElementById("activeLabel");
const supportedCountEl = document.getElementById("supportedCount");
const splitResultEl = document.getElementById("splitResult");
const queueCountEl = document.getElementById("queueCount");
const toggleSimButton = document.getElementById("toggleSim");
const comboBannerEl = document.getElementById("comboBanner");
const unlockBannerEl = document.getElementById("unlockBanner");
const gameOverOverlayEl = document.getElementById("gameOverOverlay");
const gameOverTextEl = document.getElementById("gameOverText");
const resultScoreEl = document.getElementById("resultScore");
const resultMoneyEl = document.getElementById("resultMoney");
const resultBestEl = document.getElementById("resultBest");
const playerNameInputEl = document.getElementById("playerNameInput");
const saveScoreButton = document.getElementById("saveScore");
const saveScoreStatusEl = document.getElementById("saveScoreStatus");
const restartGameButton = document.getElementById("restartGame");
const defuserCountEl = document.getElementById("defuserCount");
const polynomialToolCountEl = document.getElementById("polynomialToolCount");
const buyDefuserButton = document.getElementById("buyDefuser");
const useDefuserButton = document.getElementById("useDefuser");
const buyPolynomialToolButton = document.getElementById("buyPolynomialTool");
const usePolynomialToolButton = document.getElementById("usePolynomialTool");
const polynomialStoreCardEl = document.getElementById("polynomialStoreCard");
const selfFormulaMountEl = document.getElementById("selfFormulaMount");
const polynomialPanelEl = document.getElementById("polynomialPanel");
const polynomialInputEl = document.getElementById("polynomialInput");
const polynomialGuideEl = document.getElementById("polynomialGuide");
const confirmPolynomialToolButton = document.getElementById("confirmPolynomialTool");
const cancelPolynomialToolButton = document.getElementById("cancelPolynomialTool");
const tutorialCardEl = document.getElementById("tutorialCard");
const dismissTutorialButton = document.getElementById("dismissTutorial");
const leaderboardListEl = document.getElementById("leaderboardList");
const leaderboardTitleEl = document.getElementById("leaderboardTitle");
const modeListEl = document.getElementById("modeList");

const state = {
  bodies: [],
  nextId: 1,
  score: 0,
  bestScore: 0,
  money: 0,
  selectedMode: "standard",
  defusers: 0,
  polynomialTools: 0,
  streak: 0,
  queue: [],
  targetBodyId: null,
  targetLine: null,
  targetLabel: "none",
  choices: [],
  paused: false,
  lastSplitCount: 0,
  lastClearCount: 0,
  awaitingAnswer: false,
  effectLine: null,
  effectCells: [],
  highlightedCells: [],
  explosionCells: [],
  shatterCells: [],
  coinEffectCells: [],
  bombEffectCells: [],
  floatingTexts: [],
  bombShockwave: null,
  pendingTool: null,
  hoverCell: null,
  comboBannerTimer: null,
  unlockBannerTimer: null,
  modeTimer: 0,
  modeTimerInterval: null,
  modeTimerStarted: false,
  turnCount: 0,
  gameOver: false,
  unlocksShown: {
    quadratic: false,
    circle: false,
  },
  leaderboard: [],
  scoreSavedThisRun: false,
};

function createVisualState() {
  return {
    visualOffsetY: 0,
    bounceOffsetY: 0,
    bounceVelocityY: 0,
  };
}

function setElementText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function safeStorageGet(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

function safeStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures and continue with in-memory state.
  }
}

function getLeaderboardStorageKey() {
  return `${STORAGE_KEYS.leaderboard}.${state.selectedMode}`;
}

function loadPersistentState() {
  const storedBest = Number(safeStorageGet(STORAGE_KEYS.bestScore, "0"));
  state.bestScore = Number.isFinite(storedBest) ? storedBest : 0;

  try {
    const parsed = JSON.parse(safeStorageGet(getLeaderboardStorageKey(), "[]"));
    state.leaderboard = Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch {
    state.leaderboard = [];
  }

  if (playerNameInputEl) {
    playerNameInputEl.value = safeStorageGet(STORAGE_KEYS.playerName, "");
  }

  const tutorialHidden = safeStorageGet(STORAGE_KEYS.tutorialHidden, "0") === "1";
  if (tutorialCardEl) {
    tutorialCardEl.hidden = tutorialHidden;
  }

  const selectedMode = safeStorageGet(STORAGE_KEYS.selectedMode, "standard");
  state.selectedMode = GAME_MODES[selectedMode] ? selectedMode : "standard";
}

function saveBestScore() {
  safeStorageSet(STORAGE_KEYS.bestScore, String(state.bestScore));
}

function saveLeaderboard() {
  safeStorageSet(getLeaderboardStorageKey(), JSON.stringify(state.leaderboard.slice(0, 10)));
}

function getModeConfig() {
  return GAME_MODES[state.selectedMode] || GAME_MODES.standard;
}

function loadLeaderboardForCurrentMode() {
  try {
    const parsed = JSON.parse(safeStorageGet(getLeaderboardStorageKey(), "[]"));
    state.leaderboard = Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch {
    state.leaderboard = [];
  }
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function createCell(point) {
  const mode = getModeConfig();
  const roll = Math.random();
  const bombEnabled = state.turnCount >= 4 || state.score >= 80;

  if (mode.specials === "bombs_only") {
    if (roll < 0.12) {
      return { ...point, special: SPECIAL_TYPES.BOMB, timer: 3 };
    }
    return { ...point, special: SPECIAL_TYPES.NORMAL };
  }

  if (bombEnabled && roll < 0.05) {
    return { ...point, special: SPECIAL_TYPES.BOMB, timer: 3 };
  }
  if (roll < 0.1) {
    return { ...point, special: SPECIAL_TYPES.ARMORED, hp: 2 };
  }
  if (roll < 0.18) {
    return { ...point, special: SPECIAL_TYPES.COIN, coinValue: 8 };
  }
  if (roll < 0.28) {
    return { ...point, special: SPECIAL_TYPES.GLASS };
  }
  return { ...point, special: SPECIAL_TYPES.NORMAL };
}

function sample(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function showGameOver(message) {
  if (state.score > state.bestScore) {
    state.bestScore = state.score;
    saveBestScore();
  }
  state.gameOver = true;
  state.paused = true;
  gameOverTextEl.textContent = message;
  setElementText(resultScoreEl, state.score);
  setElementText(resultMoneyEl, state.selectedMode === "bomb_timer" ? `${state.money} / ${state.modeTimer}s` : state.money);
  setElementText(resultBestEl, state.bestScore);
  setElementText(saveScoreStatusEl, "");
  state.scoreSavedThisRun = false;
  gameOverOverlayEl.hidden = false;
}

function hideGameOver() {
  state.gameOver = false;
  state.paused = false;
  gameOverOverlayEl.hidden = true;
  gameOverTextEl.textContent = "";
  setElementText(saveScoreStatusEl, "");
}

function getAvailableFamilies() {
  return getModeConfig().families();
}

function formatSigned(value) {
  return value >= 0 ? `+ ${formatNumber(value)}` : `- ${formatNumber(Math.abs(value))}`;
}

function buildLinearFormula() {
  const options = [
    { stepX: 1, stepY: 1 },
    { stepX: 1, stepY: -1 },
    { stepX: 1, stepY: 0 },
    { stepX: 0, stepY: 1 },
    { stepX: 1, stepY: 2 },
    { stepX: 1, stepY: -2 },
    { stepX: 2, stepY: 1 },
    { stepX: 2, stepY: -1 },
  ];
  const base = sample(options);
  return {
    family: "linear",
    id: `linear-${base.stepX}-${base.stepY}-${Math.random().toString(36).slice(2, 6)}`,
    stepX: base.stepX,
    stepY: base.stepY,
    length: randomInt(MIN_BODY_LENGTH, MAX_BODY_LENGTH),
  };
}

function buildQuadraticFormula() {
  return {
    family: "quadratic",
    id: `quad-${Math.random().toString(36).slice(2, 6)}`,
    a: sample([-1, 1]),
    h: randomInt(-4, 4),
    k: randomInt(-2, 4),
    length: randomInt(3, 5),
    labelStyle: Math.random() < 0.5 ? "vertex" : "standard",
  };
}

function buildCircleFormula() {
  return {
    family: "circle",
    id: `circle-${Math.random().toString(36).slice(2, 6)}`,
    h: randomInt(-4, 4),
    k: randomInt(-2, 4),
    r: sample([2, 3, 4]),
    length: randomInt(3, 5),
    labelStyle: Math.random() < 0.5 ? "center" : "expanded",
  };
}

function generateFormula() {
  const family = sample(getAvailableFamilies());
  if (family === "quadratic") {
    return buildQuadraticFormula();
  }
  if (family === "circle") {
    return buildCircleFormula();
  }
  return buildLinearFormula();
}

function ensureQueue() {
  while (state.queue.length < 4) {
    state.queue.push(generateFormula());
  }
}

function resetState() {
  const mode = getModeConfig();
  stopModeTimer();
  state.bodies = [];
  state.nextId = 1;
  state.score = 0;
  state.money = 0;
  state.defusers = 0;
  state.polynomialTools = 0;
  state.streak = 0;
  state.queue = [];
  state.targetBodyId = null;
  state.targetLine = null;
  state.targetLabel = "none";
  state.choices = [];
  state.paused = false;
  state.lastSplitCount = 0;
  state.lastClearCount = 0;
  state.awaitingAnswer = false;
  state.effectLine = null;
  state.effectCells = [];
  state.highlightedCells = [];
  state.explosionCells = [];
  state.shatterCells = [];
  state.coinEffectCells = [];
  state.bombEffectCells = [];
  state.floatingTexts = [];
  state.bombShockwave = null;
  state.pendingTool = null;
  state.hoverCell = null;
  state.turnCount = 0;
  state.modeTimer = 0;
  state.modeTimerStarted = false;
  state.scoreSavedThisRun = false;
  state.unlocksShown = {
    quadratic: false,
    circle: false,
  };
  hideGameOver();
  comboBannerEl.classList.remove("show");
  comboBannerEl.textContent = "";
  if (unlockBannerEl) {
    unlockBannerEl.classList.remove("show");
  }
  if (toggleSimButton) {
    toggleSimButton.textContent = "Pause";
  }
  setElementText(
    statusEl,
    mode.choiceMode === "self_formula_only"
      ? "Self Formula mode: type your own equation in Options, then press Arm."
      : "Wait for the world to become still, then choose a line or use a tool from the shop."
  );
  startModeTimerIfNeeded();
}

function formulaSpan(points) {
  return {
    minCol: Math.min(...points.map((point) => point.col)),
    maxCol: Math.max(...points.map((point) => point.col)),
    minRow: Math.min(...points.map((point) => point.row)),
    maxRow: Math.max(...points.map((point) => point.row)),
  };
}

function buildLinearPoints(formula) {
  const points = [];
  let col = 0;
  let row = 0;
  for (let index = 0; index < formula.length; index += 1) {
    points.push({ col, row });
    col += formula.stepX;
    row -= formula.stepY;
  }
  return points;
}

function buildQuadraticPoints(formula) {
  const points = [];
  const xStart = formula.h - Math.floor(formula.length / 2);
  for (let index = 0; index < formula.length; index += 1) {
    const x = xStart + index;
    const y = formula.a * (x - formula.h) * (x - formula.h) + formula.k;
    points.push({ col: x, row: -y });
  }
  return points;
}

function buildCirclePoints(formula) {
  const points = [];
  const octants = [
    { x: formula.h - formula.r, y: formula.k },
    { x: formula.h - formula.r + 1, y: formula.k + formula.r - 1 },
    { x: formula.h, y: formula.k + formula.r },
    { x: formula.h + formula.r - 1, y: formula.k + formula.r - 1 },
    { x: formula.h + formula.r, y: formula.k },
    { x: formula.h + formula.r - 1, y: formula.k - formula.r + 1 },
    { x: formula.h, y: formula.k - formula.r },
    { x: formula.h - formula.r + 1, y: formula.k - formula.r + 1 },
  ];
  const start = randomInt(0, octants.length - 1);
  for (let index = 0; index < formula.length; index += 1) {
    const point = octants[(start + index) % octants.length];
    points.push({ col: point.x, row: -point.y });
  }
  return points;
}

function getFormulaPoints(formula) {
  if (formula.family === "quadratic") {
    return buildQuadraticPoints(formula);
  }
  if (formula.family === "circle") {
    return buildCirclePoints(formula);
  }
  return buildLinearPoints(formula);
}

function createBody(formula) {
  const localPoints = getFormulaPoints(formula);
  const span = formulaSpan(localPoints);
  const shiftCol = randomInt(-span.minCol, (WORLD_COLS - 1) - span.maxCol);
  const shiftRow = 0 - span.minRow;
  const cells = localPoints.map((point) => createCell({
    col: point.col + shiftCol,
    row: point.row + shiftRow,
  }));

  const edges = [];
  for (let index = 0; index < cells.length - 1; index += 1) {
    edges.push([index, index + 1]);
  }

  return {
    id: state.nextId++,
    formulaId: formula.id,
    formulaLabel: "",
    formulaMeta: formula,
    line: null,
    color: randomColor(),
    cells,
    edges,
    active: true,
    visual: createVisualState(),
  };
}

function toMathCoord(cell) {
  return {
    x: cell.col - COORD_MAX_X,
    y: COORD_MAX_Y - cell.row,
  };
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getEquationData(formula, cell) {
  const point = toMathCoord(cell);

  if (formula.family === "quadratic") {
    const a = formula.a;
    const h = formula.h;
    const k = formula.k;
    const standardB = -2 * a * h;
    const standardC = a * h * h + k;
    const label = formula.labelStyle === "vertex"
      ? `y = ${a === 1 ? "" : a === -1 ? "-" : formatNumber(a)}(x ${h >= 0 ? "-" : "+"} ${formatNumber(Math.abs(h))})^2 ${formatSigned(k)}`
      : `y = ${a === 1 ? "" : a === -1 ? "-" : formatNumber(a)}x^2 ${formatSigned(standardB)}x ${formatSigned(standardC)}`;

    return {
      family: "quadratic",
      a,
      h,
      k,
      label,
      hitTest(mathPoint) {
        return Math.abs(mathPoint.y - (a * (mathPoint.x - h) * (mathPoint.x - h) + k)) <= 0.5;
      },
    };
  }

  if (formula.family === "circle") {
    const h = formula.h;
    const k = formula.k;
    const r = formula.r;
    const expandedD = -2 * h;
    const expandedE = -2 * k;
    const expandedF = h * h + k * k - r * r;
    const label = formula.labelStyle === "center"
      ? `(x ${h >= 0 ? "-" : "+"} ${formatNumber(Math.abs(h))})^2 + (y ${k >= 0 ? "-" : "+"} ${formatNumber(Math.abs(k))})^2 = ${r * r}`
      : `x^2 + y^2 ${formatSigned(expandedD)}x ${formatSigned(expandedE)}y ${formatSigned(expandedF)} = 0`;

    return {
      family: "circle",
      h,
      k,
      r,
      label,
      hitTest(mathPoint) {
        const distance = Math.sqrt((mathPoint.x - h) ** 2 + (mathPoint.y - k) ** 2);
        return Math.abs(distance - r) <= 0.55;
      },
    };
  }

  const a = formula.stepY;
  const b = -formula.stepX;
  const c = -(a * point.x + b * point.y);
  if (formula.stepX === 0) {
    return {
      family: "linear",
      a,
      b,
      c,
      vertical: true,
      xIntercept: point.x,
      label: `x = ${formatNumber(point.x)}`,
      hitTest(mathPoint) {
        return Math.abs(mathPoint.x - point.x) <= 0.5;
      },
    };
  }

  const slope = formula.stepY / formula.stepX;
  const intercept = point.y - slope * point.x;
  let label;

  if (slope === 0) {
    label = `y = ${formatNumber(intercept)}`;
  } else {
    const slopeText = slope === 1 ? "x" : slope === -1 ? "-x" : `${formatNumber(slope)}x`;
    label = intercept === 0
      ? `y = ${slopeText}`
      : `y = ${slopeText} ${intercept > 0 ? "+" : "-"} ${formatNumber(Math.abs(intercept))}`;
  }

  return {
    family: "linear",
    a,
    b,
    c,
    vertical: false,
    slope,
    intercept,
    label,
    hitTest(mathPoint) {
      return Math.abs(mathPoint.y - (slope * mathPoint.x + intercept)) <= 0.5;
    },
  };
}

function getBodyById(bodyId) {
  return state.bodies.find((body) => body.id === bodyId) || null;
}

function positionKey(row, col) {
  return `${row},${col}`;
}

function inBounds(row, col) {
  return row >= 0 && row < WORLD_ROWS && col >= 0 && col < WORLD_COLS;
}

function getOccupancyMap(excludeBodyId = null) {
  const map = new Map();
  state.bodies.forEach((body) => {
    if (body.id === excludeBodyId) {
      return;
    }
    body.cells.forEach((cell) => {
      map.set(positionKey(cell.row, cell.col), body.id);
    });
  });
  return map;
}

function canBodyDrop(body, occupancy) {
  const own = new Set(body.cells.map((cell) => positionKey(cell.row, cell.col)));
  return body.cells.every((cell) => {
    const nextRow = cell.row + 1;
    if (nextRow >= WORLD_ROWS) {
      return false;
    }

    const key = positionKey(nextRow, cell.col);
    return !occupancy.has(key) || own.has(key);
  });
}

function bodyWouldHitWorld(body, rowOffset = 0, excludeBodyId = null) {
  const thresholdSquared = SUPPORT_RADIUS * SUPPORT_RADIUS;
  const shiftedSegments = getBodySegments(body, rowOffset);
  const shiftedCells = body.cells.map((cell) => ({ row: cell.row + rowOffset, col: cell.col }));

  for (const other of state.bodies) {
    if (other.id === body.id || other.id === excludeBodyId) {
      continue;
    }

    const otherSegments = getBodySegments(other);
    for (const shifted of shiftedSegments) {
      for (const segment of otherSegments) {
        const sharesEndpoint =
          (shifted.a.row === segment.a.row && shifted.a.col === segment.a.col) ||
          (shifted.a.row === segment.b.row && shifted.a.col === segment.b.col) ||
          (shifted.b.row === segment.a.row && shifted.b.col === segment.a.col) ||
          (shifted.b.row === segment.b.row && shifted.b.col === segment.b.col);

        if (!sharesEndpoint && segmentDistanceSquared(shifted, segment) < thresholdSquared) {
          return true;
        }
      }
    }

    for (const shiftedCell of shiftedCells) {
      for (const otherCell of other.cells) {
        if (distanceSquaredBetweenPoints(shiftedCell, otherCell) < thresholdSquared) {
          return true;
        }
      }
    }
  }

  return false;
}

function getBodySegments(body, rowOffset = 0) {
  return body.edges.map(([from, to]) => ({
    a: { row: body.cells[from].row + rowOffset, col: body.cells[from].col },
    b: { row: body.cells[to].row + rowOffset, col: body.cells[to].col },
  }));
}

function dot(ax, ay, bx, by) {
  return ax * bx + ay * by;
}

function distanceSquaredBetweenPoints(a, b) {
  const dx = a.col - b.col;
  const dy = a.row - b.row;
  return dx * dx + dy * dy;
}

function pointToSegmentDistanceSquared(point, start, end) {
  const vx = end.col - start.col;
  const vy = end.row - start.row;
  const wx = point.col - start.col;
  const wy = point.row - start.row;
  const lengthSquared = vx * vx + vy * vy;

  if (lengthSquared === 0) {
    return distanceSquaredBetweenPoints(point, start);
  }

  const t = Math.max(0, Math.min(1, dot(wx, wy, vx, vy) / lengthSquared));
  const projection = {
    col: start.col + vx * t,
    row: start.row + vy * t,
  };

  return distanceSquaredBetweenPoints(point, projection);
}

function segmentDistanceSquared(first, second) {
  if (segmentsIntersect(first.a, first.b, second.a, second.b)) {
    return 0;
  }

  return Math.min(
    pointToSegmentDistanceSquared(first.a, second.a, second.b),
    pointToSegmentDistanceSquared(first.b, second.a, second.b),
    pointToSegmentDistanceSquared(second.a, first.a, first.b),
    pointToSegmentDistanceSquared(second.b, first.a, first.b)
  );
}

function moveBodyDown(body) {
  body.cells.forEach((cell) => {
    cell.row += 1;
  });
  if (body.visual) {
    body.visual.visualOffsetY -= 1;
  }
}

function triggerSettleBounce(body, strength = -0.18) {
  if (!body.visual) {
    body.visual = createVisualState();
  }
  body.visual.bounceVelocityY = strength;
}

function getActiveBody() {
  return state.bodies.find((body) => body.active) || null;
}

function spawnNextBody() {
  if (getActiveBody()) {
    statusEl.textContent = "Wait for the current body to settle before dropping another one.";
    return;
  }

  ensureQueue();
  const formula = state.queue.shift();
  const body = createBody(formula);
  body.line = getEquationData(formula, body.cells[0]);
  body.formulaLabel = body.line.label;
  const occupancy = getOccupancyMap();

  const blockedAtSpawn = body.cells.some((cell) => occupancy.has(positionKey(cell.row, cell.col)));
  if (blockedAtSpawn || bodyIntersectsWorld(body) || bodyWouldHitWorld(body)) {
    chooseTargetBody(true);
    statusEl.textContent = state.awaitingAnswer
      ? "Spawn area is blocked, so the game switched into challenge mode."
      : "Spawn area is blocked. Cut a support body before dropping more pieces.";
    state.queue.unshift(formula);
    updateUI();
    drawBoard();
    return;
  }

  state.bodies.push(body);
  state.awaitingAnswer = false;
  ensureQueue();
  chooseTargetBody();
  updateUI();
  drawBoard();
}

function tickActiveBody() {
  const body = getActiveBody();
  if (!body) {
    return;
  }

  const occupancy = getOccupancyMap(body.id);
  if (!bodyIntersectsWorld(body, body.id) && canBodyDrop(body, occupancy) && !bodyWouldHitWorld(body, 1, body.id)) {
    moveBodyDown(body);
  } else {
    body.active = false;
    triggerSettleBounce(body);
    statusEl.textContent = `${body.formulaLabel} has settled and can now support later bodies.`;
    chooseTargetBody();
  }

  updateUI();
  drawBoard();
}

function getSupportMap() {
  const occupancy = getOccupancyMap();
  const supportMap = new Map();

  state.bodies.forEach((body) => {
    if (body.active) {
      return;
    }

    let supportsSomeone = false;
    body.cells.forEach((cell) => {
      const aboveKey = positionKey(cell.row - 1, cell.col);
      const aboveId = occupancy.get(aboveKey);
      if (aboveId && aboveId !== body.id) {
        supportsSomeone = true;
      }
    });

    supportMap.set(body.id, supportsSomeone);
  });

  return supportMap;
}

function shouldStartChallenge(settledBodies) {
  if (settledBodies.length < CHALLENGE_BODY_THRESHOLD) {
    return false;
  }

  const topMostRow = Math.min(...settledBodies.flatMap((body) => body.cells.map((cell) => cell.row)));
  return topMostRow <= CHALLENGE_TOP_ROW || settledBodies.length >= CHALLENGE_BODY_THRESHOLD + 2;
}

function getMinimumRepresentativeCells(body) {
  if (!body || !body.line) {
    return Infinity;
  }

  if (body.line.family === "linear") {
    return 2;
  }

  if (body.line.family === "quadratic") {
    return 3;
  }

  if (body.line.family === "circle") {
    return 3;
  }

  return 2;
}

function getAllOccupiedCells() {
  return state.bodies.flatMap((body) => body.cells.map((cell) => ({ row: cell.row, col: cell.col })));
}

function buildCellBasedLinearCandidates() {
  const linearTemplates = [
    { family: "linear", stepX: 1, stepY: 1 },
    { family: "linear", stepX: 1, stepY: -1 },
    { family: "linear", stepX: 1, stepY: 0 },
    { family: "linear", stepX: 0, stepY: 1 },
    { family: "linear", stepX: 1, stepY: 2 },
    { family: "linear", stepX: 1, stepY: -2 },
    { family: "linear", stepX: 2, stepY: 1 },
    { family: "linear", stepX: 2, stepY: -1 },
  ];
  const byLabel = new Map();

  getAllOccupiedCells().forEach((cell) => {
    linearTemplates.forEach((template) => {
      const line = getEquationData(template, cell);
      const clearCount = getCellsHitByLine(line).length;
      if (clearCount < 2) {
        return;
      }

      const existing = byLabel.get(line.label);
      const candidate = {
        bodyId: null,
        label: line.label,
        line,
        clearCount,
        length: clearCount,
      };

      if (!existing || clearCount > existing.clearCount) {
        byLabel.set(line.label, candidate);
      }
    });
  });

  return Array.from(byLabel.values());
}

function getVisibleCurveCandidates() {
  const settledBodies = state.bodies.filter(
    (body) =>
      !body.active &&
      body.cells.every((cell) => inBounds(cell.row, cell.col)) &&
      body.cells.length >= getMinimumRepresentativeCells(body)
  );
  const byLabel = new Map();

  settledBodies.forEach((body) => {
    if (!body.line) {
      return;
    }

    const existing = byLabel.get(body.formulaLabel);
    const clearCount = getLineClearCount(body);
    const candidate = {
      bodyId: body.id,
      label: body.formulaLabel,
      line: body.line,
      clearCount,
      length: body.cells.length,
    };

    if (!existing || clearCount > existing.clearCount || (clearCount === existing.clearCount && body.id < existing.bodyId)) {
      byLabel.set(body.formulaLabel, candidate);
    }
  });

  return Array.from(byLabel.values())
    .filter((candidate) => candidate.clearCount >= getMinimumRepresentativeCells(getBodyById(candidate.bodyId)))
    .sort((a, b) => b.clearCount - a.clearCount || b.length - a.length || (a.bodyId ?? 0) - (b.bodyId ?? 0));
}

function getVisibleLineCandidates() {
  const mode = getModeConfig();
  const byLabel = new Map();
  const candidates = [
    ...(mode.id === "curves_only" ? [] : buildCellBasedLinearCandidates()),
    ...getVisibleCurveCandidates().filter((candidate) => mode.id !== "curves_only" || candidate.line?.family !== "linear"),
  ];

  candidates.forEach((candidate) => {
    const existing = byLabel.get(candidate.label);
    if (!existing || candidate.clearCount > existing.clearCount) {
      byLabel.set(candidate.label, candidate);
    }
  });

  return Array.from(byLabel.values())
    .sort((a, b) => b.clearCount - a.clearCount || b.length - a.length || (a.bodyId ?? 0) - (b.bodyId ?? 0));
}

function createRandomCandidate(excludeLabels = new Set(), preferredFamily = null) {
  let attempts = 0;

  while (attempts < 30) {
    attempts += 1;
    let formula;
    if (preferredFamily === "quadratic") {
      formula = buildQuadraticFormula();
    } else if (preferredFamily === "circle") {
      formula = buildCircleFormula();
    } else if (preferredFamily === "linear") {
      formula = buildLinearFormula();
    } else {
      formula = generateFormula();
    }
    let line;

    if (formula.family === "linear") {
      const randomCol = randomInt(2, WORLD_COLS - 3);
      const randomRow = randomInt(2, WORLD_ROWS - 3);
      line = getEquationData(formula, { row: randomRow, col: randomCol });
    } else {
      line = getEquationData(formula, { row: COORD_MAX_Y, col: COORD_MAX_X });
    }

    if (excludeLabels.has(line.label)) {
      continue;
    }

    const clearCount = getCellsHitByLine(line).length;
    return {
      bodyId: null,
      label: line.label,
      line,
      clearCount,
      length: formula.length,
    };
  }

  return null;
}

function chooseTargetBody(force = false) {
  const settledBodies = state.bodies.filter((body) => !body.active && body.cells.every((cell) => inBounds(cell.row, cell.col)));
  if (settledBodies.length < 4 || (!force && !shouldStartChallenge(settledBodies))) {
    state.targetBodyId = null;
    state.targetLine = null;
    state.targetLabel = "none";
    state.awaitingAnswer = false;
    state.highlightedCells = [];
    buildChoices();
    return;
  }

  const candidates = getVisibleLineCandidates();
  const candidate = candidates[0] || null;
  state.targetBodyId = candidate ? candidate.bodyId : null;
  state.targetLine = candidate ? candidate.line : null;
  state.targetLabel = candidate ? candidate.label : "none";
  state.awaitingAnswer = Boolean(candidate);
  if (state.selectedMode === "bomb_timer" && candidate && !state.modeTimerStarted) {
    state.modeTimerStarted = true;
  }
  state.highlightedCells = candidate ? getCellsHitByLine(candidate.line) : [];
  buildChoices(candidates);

  if (state.choices.length === 0 || !candidate) {
    state.targetBodyId = null;
    state.targetLine = null;
    state.targetLabel = "none";
    state.awaitingAnswer = false;
    state.highlightedCells = [];
  }
}

function buildChoices(candidates = null) {
  if (getModeConfig().choiceMode === "self_formula_only") {
    state.choices = [];
    state.highlightedCells = [];
    return;
  }

  if (!state.targetLine) {
    state.choices = [];
    state.highlightedCells = [];
    return;
  }

  const rankedCandidates = candidates || getVisibleLineCandidates();
  const bestCandidate = rankedCandidates[0];
  const distractors = shuffle(rankedCandidates.slice(1)).slice(0, 3);
  const usedLabels = new Set(bestCandidate ? [bestCandidate.label] : []);
  distractors.forEach((candidate) => usedLabels.add(candidate.label));

  const availableFamilies = getAvailableFamilies();
  if (availableFamilies.includes("quadratic")) {
    const hasQuadratic = [bestCandidate, ...distractors].some((candidate) => candidate?.line?.family === "quadratic");
    if (!hasQuadratic) {
      const quadraticCandidate = createRandomCandidate(usedLabels, "quadratic");
      if (quadraticCandidate) {
        if (distractors.length >= 3) {
          const removed = distractors.pop();
          if (removed) {
            usedLabels.delete(removed.label);
          }
        }
        distractors.push(quadraticCandidate);
        usedLabels.add(quadraticCandidate.label);
      }
    }
  }

  if (availableFamilies.includes("circle")) {
    const hasCircle = [bestCandidate, ...distractors].some((candidate) => candidate?.line?.family === "circle");
    if (!hasCircle) {
      const circleCandidate = createRandomCandidate(usedLabels, "circle");
      if (circleCandidate) {
        if (distractors.length >= 3) {
          const removableIndex = distractors.findIndex((candidate) => candidate.line?.family === "linear");
          const removed = removableIndex >= 0 ? distractors.splice(removableIndex, 1)[0] : distractors.pop();
          if (removed) {
            usedLabels.delete(removed.label);
          }
        }
        distractors.push(circleCandidate);
        usedLabels.add(circleCandidate.label);
      }
    }
  }

  while (distractors.length < 3) {
    const randomCandidate = createRandomCandidate(usedLabels);
    if (!randomCandidate) {
      break;
    }
    distractors.push(randomCandidate);
    usedLabels.add(randomCandidate.label);
  }

  if (!bestCandidate || distractors.length < 3) {
    state.choices = [];
    state.highlightedCells = [];
    return;
  }

  state.choices = shuffle(
    [
      { bodyId: bestCandidate.bodyId, label: bestCandidate.label, line: bestCandidate.line, correct: true, clearCount: bestCandidate.clearCount },
      ...distractors.map((candidate) => ({
        bodyId: candidate.bodyId,
        label: candidate.label,
        line: candidate.line,
        correct: false,
        clearCount: candidate.clearCount,
      })),
    ].map((candidate) => ({
      bodyId: candidate.bodyId,
      label: candidate.label,
      line: candidate.line,
      correct: candidate.correct,
      clearCount: candidate.clearCount,
    }))
  );
}

function lineHitsCell(cell, line) {
  if (!line || typeof line.hitTest !== "function") {
    return false;
  }
  return line.hitTest(toMathCoord(cell));
}

function getLineClearCount(body) {
  if (!body || !body.line) {
    return 0;
  }

  let count = 0;
  state.bodies.forEach((candidate) => {
    candidate.cells.forEach((cell) => {
      if (lineHitsCell(cell, body.line)) {
        count += 1;
      }
    });
  });

  return count;
}

function getCellsHitByLine(line) {
  const hits = [];
  state.bodies.forEach((body) => {
    body.cells.forEach((cell) => {
      if (lineHitsCell(cell, line)) {
        hits.push({ row: cell.row, col: cell.col });
      }
    });
  });
  return hits;
}

function dedupeCells(cells) {
  const seen = new Set();
  return cells.filter((cell) => {
    const key = positionKey(cell.row, cell.col);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function addFloatingText(text, cells, color = "#8e5b00") {
  if (!cells || cells.length === 0) {
    return;
  }

  const row = cells.reduce((sum, cell) => sum + cell.row, 0) / cells.length;
  const col = cells.reduce((sum, cell) => sum + cell.col, 0) / cells.length;
  state.floatingTexts.push({
    text,
    row,
    col,
    offsetY: 0,
    velocityY: -0.04,
    alpha: 1,
    life: 1,
    color,
  });
}

function triggerCoinEffect(cells, amount) {
  const uniqueCells = dedupeCells(cells);
  state.coinEffectCells = uniqueCells;
  if (amount > 0) {
    addFloatingText(`+$${amount}`, uniqueCells, "#8e5b00");
  }
}

function triggerBombEffect(center, radius) {
  state.bombEffectCells = getBlastArea(center, radius);
  state.bombShockwave = {
    row: center.row,
    col: center.col,
    radius: 0.2,
    maxRadius: radius + 1.4,
    alpha: 0.95,
  };
  addFloatingText("BOOM", [center], "#5f1b13");
}

function canUseShopTool() {
  return !state.gameOver && !getActiveBody();
}

function clearPendingTool() {
  state.pendingTool = null;
  state.hoverCell = null;
  if (polynomialPanelEl) {
    polynomialPanelEl.hidden = getModeConfig().id !== "self_formula";
  }
}

function buyItem(cost, inventoryKey, label) {
  if (state.money < cost) {
    statusEl.textContent = `Not enough money for ${label}.`;
    return;
  }

  state.money -= cost;
  state[inventoryKey] += 1;
  addFloatingText(`-${cost}$`, [{ row: 1, col: WORLD_COLS - 3 }], "#8a4d1a");
  statusEl.textContent = `${label} purchased.`;
  updateUI();
  drawBoard();
}

function removeBodyCells(body, removedIndices) {
  if (!body || removedIndices.length === 0) {
    return;
  }

  const groups = getConnectedGroups(body, removedIndices);
  state.bodies = state.bodies.filter((candidate) => candidate.id !== body.id);
  groups.forEach((group) => {
    const rebuilt = rebuildBodyFromGroup(body, group);
    if (rebuilt) {
      state.bodies.push(rebuilt);
    }
  });
}

function findBombAtCell(targetCell) {
  for (const body of state.bodies) {
    for (let index = 0; index < body.cells.length; index += 1) {
      const cell = body.cells[index];
      if (cell.row === targetCell.row && cell.col === targetCell.col && cell.special === SPECIAL_TYPES.BOMB) {
        return { body, index, cell };
      }
    }
  }
  return null;
}

function armDefuserTool() {
  if (!canUseShopTool()) {
    statusEl.textContent = "Wait until the current action finishes before using a store tool.";
    return;
  }
  if (state.defusers <= 0) {
    statusEl.textContent = "You do not own a bomb defuser yet.";
    return;
  }

  const hasBomb = state.bodies.some((body) => body.cells.some((cell) => cell.special === SPECIAL_TYPES.BOMB));
  if (!hasBomb) {
    statusEl.textContent = "There are no bomb blocks to defuse right now.";
    return;
  }

  if (state.pendingTool?.type === "defuser") {
    clearPendingTool();
    statusEl.textContent = "Bomb defuser cancelled.";
    updateUI();
    drawBoard();
    return;
  }

  state.pendingTool = { type: "defuser" };
  statusEl.textContent = "Bomb defuser armed. Click a bomb block on the board to remove it.";
  updateUI();
  drawBoard();
}

function deployDefuser(targetCell) {
  const target = findBombAtCell(targetCell);
  if (!target) {
    statusEl.textContent = "That cell is not a bomb. Click directly on a bomb block.";
    drawBoard();
    return;
  }

  const { body: targetBody, index: targetIndex, cell } = target;
  state.defusers -= 1;
  state.bombEffectCells = [{ row: cell.row, col: cell.col }];
  addFloatingText("DEFUSED", [{ row: cell.row, col: cell.col }], "#1f8f67");
  removeBodyCells(targetBody, [targetIndex]);
  state.lastClearCount = 1;
  state.lastSplitCount = 0;
  clearPendingTool();
  settleWorld();
  statusEl.textContent = "Bomb defused safely.";
}

function parsePolynomialInput(input) {
  if (!input) {
    return null;
  }

  const coefficients = input
    .split(",")
    .map((token) => Number(token.trim()))
    .filter((value) => Number.isFinite(value));

  if (coefficients.length < 2 || coefficients.length > 4) {
    return null;
  }

  const degree = coefficients.length - 1;
  if (coefficients[0] === 0) {
    return null;
  }

  return { degree, coefficients };
}

function getPolynomialGuideText(coefficients) {
  if (!coefficients || coefficients.length === 0) {
    return "The 1st number is the highest-power coefficient, and the last number is the constant term.";
  }

  const degree = coefficients.length - 1;
  const labels = coefficients.map((_, index) => {
    const power = degree - index;
    if (power === 0) {
      return "constant";
    }
    if (power === 1) {
      return "x term";
    }
    return `x^${power} term`;
  });

  return coefficients
    .map((value, index) => `${index + 1}: ${value || 0} -> ${labels[index]}`)
    .join(" | ");
}

function formatPolynomialLabel(coefficients) {
  const degree = coefficients.length - 1;
  const parts = [];

  coefficients.forEach((coefficient, index) => {
    if (coefficient === 0) {
      return;
    }

    const power = degree - index;
    const absolute = Math.abs(coefficient);
    const sign = coefficient > 0 ? "+" : "-";
    let term = "";

    if (power === 0) {
      term = `${absolute}`;
    } else if (power === 1) {
      term = `${absolute === 1 ? "" : absolute}x`;
    } else {
      term = `${absolute === 1 ? "" : absolute}x^${power}`;
    }

    parts.push(parts.length === 0 ? `${coefficient < 0 ? "-" : ""}${term}` : `${sign} ${term}`);
  });

  return `y = ${parts.join(" ")}`;
}

function buildPolynomialLine(coefficients, xShift = 0, yShift = 0) {
  const baseLabel = formatPolynomialLabel(coefficients);
  return {
    family: "polynomial",
    degree: coefficients.length - 1,
    coefficients,
    xShift,
    yShift,
    label: xShift === 0 && yShift === 0
      ? baseLabel
      : `${baseLabel} anchored at (${formatNumber(xShift)}, ${formatNumber(yShift)})`,
    hitTestValue(mathPoint) {
      const translatedX = mathPoint.x - xShift;
      return mathPoint.y - coefficients.reduce((sum, coefficient, index) => {
        const power = coefficients.length - 1 - index;
        return sum + coefficient * (translatedX ** power);
      }, yShift);
    },
    hitTest(mathPoint) {
      return Math.abs(this.hitTestValue(mathPoint)) <= 0.5;
    },
  };
}

function buildThickLine(baseLine, thickness = 1) {
  return {
    ...baseLine,
    thickness,
    label: `${baseLine.label} (thick)`,
    hitTest(mathPoint) {
      return Math.abs(baseLine.hitTestValue(mathPoint)) <= 0.5 + thickness;
    },
    hitTestValue(mathPoint) {
      return baseLine.hitTestValue(mathPoint);
    },
  };
}

function getPolynomialY(line, x) {
  return line.coefficients.reduce((sum, coefficient, index) => {
    const power = line.coefficients.length - 1 - index;
    return sum + coefficient * ((x - line.xShift) ** power);
  }, line.yShift);
}

function drawPolynomialCurve(ctx, line, cellSize, padding, yOffset = 0, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  let started = false;
  for (let x = -COORD_MAX_X - 0.5; x <= COORD_MAX_X + 0.5; x += 0.25) {
    const y = getPolynomialY(line, x) + yOffset;
    const canvasX = toCanvasX(x + COORD_MAX_X, cellSize, padding);
    const canvasY = toCanvasY(COORD_MAX_Y - y, cellSize, padding);
    if (!started) {
      ctx.moveTo(canvasX, canvasY);
      started = true;
    } else {
      ctx.lineTo(canvasX, canvasY);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function armPolynomialTool() {
  const mode = getModeConfig();
  if (!canUseShopTool()) {
    statusEl.textContent = "Wait until the current action finishes before using a store tool.";
    return;
  }
  if (!mode.infinitePolynomial && state.polynomialTools <= 0) {
    statusEl.textContent = "You do not own a polynomial tool yet.";
    return;
  }

  if (state.pendingTool?.type === "polynomial") {
    clearPendingTool();
    state.effectLine = null;
    state.effectCells = [];
    statusEl.textContent = "Polynomial tool cancelled.";
    updateUI();
    drawBoard();
    return;
  }

  state.pendingTool = {
    type: "polynomial",
    coefficients: [],
  };

  if (polynomialPanelEl) {
    polynomialPanelEl.hidden = false;
  }
  if (polynomialInputEl) {
    polynomialInputEl.value = "";
    polynomialInputEl.focus();
  }
  setElementText(polynomialGuideEl, getPolynomialGuideText([]));
  statusEl.textContent = mode.id === "self_formula"
    ? "Enter coefficients in Options, then press Arm."
    : "Enter coefficients in the shop panel, then press Arm.";
  updateUI();
  drawBoard();
}

function confirmPolynomialTool() {
  const mode = getModeConfig();
  const raw = polynomialInputEl ? polynomialInputEl.value : "";
  const parsed = parsePolynomialInput(raw);
  if (!parsed) {
    statusEl.textContent = "Invalid polynomial. Use 2 to 4 coefficients like 1,0,-2,1.";
    if (polynomialInputEl) {
      polynomialInputEl.focus();
      polynomialInputEl.select();
    }
    return;
  }

  const line = buildPolynomialLine(parsed.coefficients);
  const thickLine = buildThickLine(line, POLYNOMIAL_TOOL_THICKNESS);
  if (polynomialPanelEl && mode.id !== "self_formula") {
    polynomialPanelEl.hidden = true;
  }
  if (!mode.infinitePolynomial) {
    state.polynomialTools -= 1;
  }
  clearPendingTool();
  state.effectLine = thickLine;
  state.effectCells = getCellsHitByLine(thickLine);
  drawBoard();

  window.setTimeout(() => {
    const removed = executeLine(thickLine, {
      safeBombs: mode.id !== "self_formula",
      coinMultiplier: 2,
      bombReward: mode.id !== "self_formula" ? POLYNOMIAL_BOMB_BONUS : 0,
      bombBlastRadius: mode.id !== "self_formula" ? 1 : 0,
    });
    state.effectLine = null;
    state.effectCells = [];
    if (removed > 0) {
      state.score += Math.max(18, removed * 3);
      statusEl.textContent = mode.id === "self_formula"
        ? `${thickLine.label} executed and removed ${removed} cells.`
        : `${thickLine.label} executed safely and removed ${removed} cells.`;
    } else {
      statusEl.textContent = `${thickLine.label} executed, but it did not clear any cells.`;
    }
    window.setTimeout(() => {
      state.explosionCells = [];
      state.shatterCells = [];
      state.coinEffectCells = [];
      state.bombEffectCells = [];
      buildChoices();
      updateUI();
      drawBoard();
    }, 220);
  }, 220);
}

function getBlastArea(center, radius) {
  const cells = [];
  for (let row = center.row - radius; row <= center.row + radius; row += 1) {
    for (let col = center.col - radius; col <= center.col + radius; col += 1) {
      if (!inBounds(row, col)) {
        continue;
      }
      const distance = Math.abs(row - center.row) + Math.abs(col - center.col);
      if (distance <= radius + 1) {
        cells.push({ row, col });
      }
    }
  }
  return dedupeCells(cells);
}

function buildExplosionCells(hitCells) {
  if (state.streak < 1 || hitCells.length === 0) {
    return [];
  }

  const center = hitCells[Math.floor(hitCells.length / 2)];
  const radius = Math.min(4, 1 + state.streak);
  return dedupeCells(
    getBlastArea(center, radius).filter((cell) => {
      const manhattan = Math.abs(cell.row - center.row) + Math.abs(cell.col - center.col);
      const diagonal = Math.max(Math.abs(cell.row - center.row), Math.abs(cell.col - center.col));
      return manhattan <= radius + 2 && diagonal <= radius;
    })
  );
}

function showComboBanner() {
  if (state.streak <= 0) {
    comboBannerEl.classList.remove("show");
    comboBannerEl.textContent = "";
    return;
  }

  const blastText = state.streak >= 5 ? "MEGA BLAST" : state.streak >= 3 ? "CHAIN BLAST" : "COMBO";
  comboBannerEl.textContent = `${state.streak} HIT ${blastText}`;
  comboBannerEl.classList.add("show");

  if (state.comboBannerTimer) {
    window.clearTimeout(state.comboBannerTimer);
  }

  state.comboBannerTimer = window.setTimeout(() => {
    comboBannerEl.classList.remove("show");
  }, 900);
}

function showUnlockBanner(text) {
  if (!unlockBannerEl) {
    return;
  }

  unlockBannerEl.textContent = text;
  unlockBannerEl.classList.add("show");

  if (state.unlockBannerTimer) {
    window.clearTimeout(state.unlockBannerTimer);
  }

  state.unlockBannerTimer = window.setTimeout(() => {
    unlockBannerEl.classList.remove("show");
  }, 1800);
}

function checkUnlockMilestones() {
  if (!state.unlocksShown.quadratic && state.score >= QUADRATIC_UNLOCK_SCORE) {
    state.unlocksShown.quadratic = true;
    showUnlockBanner("Quadratic equations unlocked");
  }

  if (!state.unlocksShown.circle && state.score >= CIRCLE_UNLOCK_SCORE) {
    state.unlocksShown.circle = true;
    showUnlockBanner("Circle equations unlocked");
  }
}

function renderLeaderboard() {
  if (!leaderboardListEl) {
    return;
  }
  if (leaderboardTitleEl) {
    leaderboardTitleEl.textContent = `${getModeConfig().name} Leaderboard`;
  }

  leaderboardListEl.innerHTML = "";
  if (state.leaderboard.length === 0) {
    const empty = document.createElement("div");
    empty.className = "leaderboard-empty";
    empty.textContent = "No saved scores yet.";
    leaderboardListEl.appendChild(empty);
    return;
  }

  state.leaderboard.slice(0, 8).forEach((entry, index) => {
    const row = document.createElement("div");
    row.className = "leaderboard-entry";
    const scoreText = getModeConfig().id === "bomb_timer" && Number.isFinite(entry.time)
      ? `${entry.score} | ${entry.time}s`
      : `${entry.score}`;
    row.innerHTML = [
      `<span class="leaderboard-rank">#${index + 1}</span>`,
      `<span class="leaderboard-name">${entry.name}</span>`,
      `<span class="leaderboard-score">${scoreText}</span>`,
    ].join("");
    leaderboardListEl.appendChild(row);
  });
}

function renderModes() {
  if (!modeListEl) {
    return;
  }

  modeListEl.innerHTML = "";
  Object.values(GAME_MODES).forEach((mode) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.modeId = mode.id;
    button.className = `mode-button${state.selectedMode === mode.id ? " active" : ""}`;
    button.innerHTML = `<strong>${mode.name}</strong><span>${mode.description}</span>`;
    button.addEventListener("click", () => {
      if (state.selectedMode === mode.id) {
        return;
      }
      stopModeTimer();
      state.selectedMode = mode.id;
      safeStorageSet(STORAGE_KEYS.selectedMode, mode.id);
      loadLeaderboardForCurrentMode();
      resetState();
      ensureQueue();
      updateUI();
      drawBoard();
      showUnlockBanner(`${mode.name} mode`);
    });
    modeListEl.appendChild(button);
  });
}

function refreshModeButtons() {
  if (!modeListEl) {
    return;
  }
  Array.from(modeListEl.querySelectorAll(".mode-button")).forEach((button) => {
    button.classList.toggle("active", button.dataset.modeId === state.selectedMode);
  });
}

function saveCurrentRunToLeaderboard() {
  if (state.scoreSavedThisRun) {
    setElementText(saveScoreStatusEl, "This run has already been saved.");
    return;
  }

  const rawName = playerNameInputEl ? playerNameInputEl.value.trim() : "";
  const name = rawName || "Player";
  safeStorageSet(STORAGE_KEYS.playerName, name);

  state.leaderboard.push({
    name,
    score: state.score,
    money: state.money,
    time: state.selectedMode === "bomb_timer" ? state.modeTimer : null,
    at: new Date().toISOString(),
  });
  state.leaderboard.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if ((b.time ?? -1) !== (a.time ?? -1)) {
      return (b.time ?? -1) - (a.time ?? -1);
    }
    if (b.money !== a.money) {
      return b.money - a.money;
    }
    return a.at.localeCompare(b.at);
  });
  state.leaderboard = state.leaderboard.slice(0, 10);
  saveLeaderboard();
  renderLeaderboard();
  state.scoreSavedThisRun = true;
  setElementText(saveScoreStatusEl, "Score saved to local leaderboard.");
}

function stopModeTimer() {
  if (state.modeTimerInterval) {
    window.clearInterval(state.modeTimerInterval);
    state.modeTimerInterval = null;
  }
}

function startModeTimerIfNeeded() {
  stopModeTimer();
  if (state.selectedMode !== "bomb_timer") {
    state.modeTimer = 0;
    state.modeTimerStarted = false;
    return;
  }

  state.modeTimer = 0;
  state.modeTimerStarted = false;
  state.modeTimerInterval = window.setInterval(() => {
    if (state.paused || state.gameOver || !state.modeTimerStarted) {
      return;
    }
    state.modeTimer += 1;
    setElementText(modeTimerEl, state.modeTimer);
  }, 1000);
}

function updateModeLayout() {
  const mode = getModeConfig();

  if (timerStatEl) {
    timerStatEl.hidden = mode.id !== "bomb_timer";
  }
  setElementText(modeTimerEl, state.modeTimer);

  if (polynomialPanelEl) {
    const mount = mode.id === "self_formula" ? selfFormulaMountEl : polynomialStoreCardEl;
    if (mount && polynomialPanelEl.parentElement !== mount) {
      mount.appendChild(polynomialPanelEl);
    }
    if (mode.id === "self_formula") {
      polynomialPanelEl.hidden = false;
    }
  }

  if (polynomialStoreCardEl) {
    polynomialStoreCardEl.hidden = mode.id === "self_formula";
  }

  if (buyPolynomialToolButton) {
    buyPolynomialToolButton.hidden = mode.id === "self_formula";
  }
  if (usePolynomialToolButton) {
    usePolynomialToolButton.hidden = mode.id === "self_formula";
  }

  if (cancelPolynomialToolButton) {
    cancelPolynomialToolButton.textContent = mode.id === "self_formula" ? "Clear" : "Cancel";
  }
}

function getConnectedGroups(body, removedIndices) {
  const removed = new Set(removedIndices);
  const adjacency = new Map();

  body.cells.forEach((_, index) => {
    if (!removed.has(index)) {
      adjacency.set(index, []);
    }
  });

  body.edges.forEach(([from, to]) => {
    if (removed.has(from) || removed.has(to)) {
      return;
    }
    adjacency.get(from).push(to);
    adjacency.get(to).push(from);
  });

  const visited = new Set();
  const groups = [];

  adjacency.forEach((_, start) => {
    if (visited.has(start)) {
      return;
    }

    const stack = [start];
    const group = [];
    visited.add(start);

    while (stack.length > 0) {
      const current = stack.pop();
      group.push(current);
      adjacency.get(current).forEach((next) => {
        if (!visited.has(next)) {
          visited.add(next);
          stack.push(next);
        }
      });
    }

    groups.push(group);
  });

  return groups;
}

function getConnectedGlassIndices(body, startingIndices) {
  const queue = [...startingIndices];
  const visited = new Set(startingIndices);

  while (queue.length > 0) {
    const current = queue.shift();
    body.edges.forEach(([from, to]) => {
      const next = from === current ? to : to === current ? from : null;
      if (next === null || visited.has(next)) {
        return;
      }
      const nextCell = body.cells[next];
      if (nextCell.special !== SPECIAL_TYPES.GLASS) {
        return;
      }
      visited.add(next);
      queue.push(next);
    });
  }

  return visited;
}

function getNeighborGlassIndices(body, removedIndices) {
  const removedSet = new Set(removedIndices);
  const shattered = new Set();

  body.cells.forEach((cell, index) => {
    if (removedSet.has(index) || cell.special !== SPECIAL_TYPES.GLASS) {
      return;
    }

    const touchingRemoved = body.cells.some((otherCell, otherIndex) => {
      if (!removedSet.has(otherIndex)) {
        return false;
      }
      return Math.abs(cell.row - otherCell.row) <= 1 && Math.abs(cell.col - otherCell.col) <= 1;
    });

    if (touchingRemoved) {
      shattered.add(index);
    }
  });

  return shattered;
}

function rebuildBodyFromGroup(originalBody, group) {
  const sortedGroup = group.slice().sort((a, b) => a - b);
  if (sortedGroup.length === 0) {
    return null;
  }

  const remap = new Map();
  const cells = sortedGroup.map((originalIndex, nextIndex) => {
    remap.set(originalIndex, nextIndex);
    const cell = originalBody.cells[originalIndex];
    return { ...cell };
  });

  const edges = [];
  originalBody.edges.forEach(([from, to]) => {
    if (remap.has(from) && remap.has(to)) {
      edges.push([remap.get(from), remap.get(to)]);
    }
  });

  return {
    id: state.nextId++,
    formulaId: originalBody.formulaId,
    formulaLabel: originalBody.formulaLabel,
    formulaMeta: originalBody.formulaMeta,
    line: originalBody.line,
    color: originalBody.color,
    cells,
    edges,
    active: false,
    visual: createVisualState(),
  };
}

function executeLine(line, options = {}) {
  if (!line) {
    statusEl.textContent = "There is no settled body to cut right now.";
    return 0;
  }

  const config = {
    safeBombs: false,
    safeExplosionBombs: false,
    coinMultiplier: 1,
    bombReward: 0,
    bombBlastRadius: 0,
    ...options,
  };

  const directHits = dedupeCells(getCellsHitByLine(line));
  const directHitKeys = new Set(directHits.map((cell) => positionKey(cell.row, cell.col)));
  const explosionCells = buildExplosionCells(directHits);
  const removalKeys = new Set([
    ...directHits.map((cell) => positionKey(cell.row, cell.col)),
    ...explosionCells.map((cell) => positionKey(cell.row, cell.col)),
  ]);
  const nextBodies = [];
  let removedCells = 0;
  let createdPieces = 0;
  let coinBonus = 0;
  let hitBomb = false;
  const shatteredCells = [];
  const collectedCoinCells = [];
  const safelyHitBombs = [];

  state.bodies.forEach((body) => {
    const removedIndices = [];
    const glassSeeds = [];

    body.cells.forEach((cell, index) => {
      if (hitBomb) {
        return;
      }
      if (!removalKeys.has(positionKey(cell.row, cell.col))) {
        return;
      }

      if (cell.special === SPECIAL_TYPES.BOMB) {
        const wasDirectHit = directHitKeys.has(positionKey(cell.row, cell.col));
        if (config.safeBombs || (!wasDirectHit && config.safeExplosionBombs)) {
          removedIndices.push(index);
          state.bombEffectCells.push({ row: cell.row, col: cell.col });
          addFloatingText("SAFE HIT", [{ row: cell.row, col: cell.col }], "#1f8f67");
          safelyHitBombs.push({ row: cell.row, col: cell.col });
          return;
        }
        showGameOver("You hit a bomb block. That run is over.");
        hitBomb = true;
        return;
      }

      if (cell.special === SPECIAL_TYPES.ARMORED) {
        cell.hp -= 1;
        if (cell.hp <= 0) {
          removedIndices.push(index);
        }
        return;
      }

      if (cell.special === SPECIAL_TYPES.COIN) {
        coinBonus += cell.coinValue || 8;
        collectedCoinCells.push({ row: cell.row, col: cell.col });
      }

      if (cell.special === SPECIAL_TYPES.GLASS) {
        glassSeeds.push(index);
      }

      removedIndices.push(index);
    });

    if (hitBomb) {
      return;
    }

    if (glassSeeds.length > 0) {
      getConnectedGlassIndices(body, glassSeeds).forEach((index) => {
        if (!removedIndices.includes(index)) {
          removedIndices.push(index);
        }
      });
    }

    getNeighborGlassIndices(body, removedIndices).forEach((index) => {
      if (!removedIndices.includes(index)) {
        removedIndices.push(index);
      }
    });

    if (removedIndices.length === 0) {
      nextBodies.push(body);
      return;
    }

    removedIndices.forEach((index) => {
      const cell = body.cells[index];
      if (cell.special === SPECIAL_TYPES.GLASS) {
        shatteredCells.push({ row: cell.row, col: cell.col });
      }
    });

    removedCells += removedIndices.length;
    const groups = getConnectedGroups(body, removedIndices);
    groups.forEach((group) => {
      const rebuilt = rebuildBodyFromGroup(body, group);
      if (rebuilt) {
        nextBodies.push(rebuilt);
        createdPieces += 1;
      }
    });
  });

  if (hitBomb) {
    return 0;
  }

  state.bodies = [];
  nextBodies.forEach((body) => {
    if (!bodyIntersectsWorld(body)) {
      state.bodies.push(body);
    }
  });
  state.lastSplitCount = createdPieces;
  state.lastClearCount = removedCells;
  state.explosionCells = explosionCells;
  state.shatterCells = dedupeCells(shatteredCells);
  coinBonus *= config.coinMultiplier;
  if (safelyHitBombs.length > 0 && config.bombReward > 0) {
    coinBonus += safelyHitBombs.length * config.bombReward;
    safelyHitBombs.forEach((bombCell) => {
      addFloatingText(`+$${config.bombReward}`, [bombCell], "#1f8f67");
    });
  }
  triggerCoinEffect(collectedCoinCells, coinBonus);
  state.money += coinBonus;
  if (safelyHitBombs.length > 0 && config.bombBlastRadius > 0) {
    safelyHitBombs.forEach((bombCell) => {
      executeBombExplosion(bombCell, config.bombBlastRadius);
    });
  }
  settleWorld();
  return removedCells;
}

function executeBombExplosion(center, blastRadius = 2) {
  const removalKeys = new Set(getBlastArea(center, blastRadius).map((cell) => positionKey(cell.row, cell.col)));
  const nextBodies = [];
  const shatteredCells = [];
  const collectedCoinCells = [];
  let coinBonus = 0;

  state.bodies.forEach((body) => {
    const removedIndices = body.cells
      .map((cell, index) => (removalKeys.has(positionKey(cell.row, cell.col)) ? index : -1))
      .filter((index) => index !== -1);

    getNeighborGlassIndices(body, removedIndices).forEach((index) => {
      if (!removedIndices.includes(index)) {
        removedIndices.push(index);
      }
    });

    if (removedIndices.length === 0) {
      nextBodies.push(body);
      return;
    }

    removedIndices.forEach((index) => {
      const cell = body.cells[index];
      if (cell.special === SPECIAL_TYPES.GLASS) {
        shatteredCells.push({ row: cell.row, col: cell.col });
      } else if (cell.special === SPECIAL_TYPES.COIN) {
        coinBonus += cell.coinValue || 8;
        collectedCoinCells.push({ row: cell.row, col: cell.col });
      }
    });

    const groups = getConnectedGroups(body, removedIndices);
    groups.forEach((group) => {
      const rebuilt = rebuildBodyFromGroup(body, group);
      if (rebuilt) {
        nextBodies.push(rebuilt);
      }
    });
  });

  state.bodies = nextBodies;
  state.explosionCells = getBlastArea(center, blastRadius);
  state.shatterCells = dedupeCells(shatteredCells);
  triggerCoinEffect(collectedCoinCells, coinBonus);
  state.money += coinBonus;
  triggerBombEffect(center, blastRadius);
}

function advanceBombs() {
  const bombsToExplode = [];

  state.bodies.forEach((body) => {
    body.cells.forEach((cell) => {
      if (cell.special !== SPECIAL_TYPES.BOMB) {
        return;
      }
      cell.timer -= 1;
      if (cell.timer <= 0) {
        bombsToExplode.push({ row: cell.row, col: cell.col });
      }
    });
  });

  bombsToExplode.forEach((center) => {
    executeBombExplosion(center);
  });
}

function settleWorld() {
  let moved = true;
  let guard = 0;

  while (moved && guard < WORLD_ROWS * 4) {
    moved = false;
    const bodies = state.bodies
      .filter((body) => !body.active)
      .slice()
      .sort((a, b) => {
        const aBottom = Math.max(...a.cells.map((cell) => cell.row));
        const bBottom = Math.max(...b.cells.map((cell) => cell.row));
        return bBottom - aBottom;
      });

    bodies.forEach((body) => {
      const occupancy = getOccupancyMap(body.id);
      if (!bodyIntersectsWorld(body, body.id) && canBodyDrop(body, occupancy) && !bodyWouldHitWorld(body, 1, body.id)) {
        moveBodyDown(body);
        moved = true;
      } else if (body.visual && Math.abs(body.visual.visualOffsetY) < 0.05 && Math.abs(body.visual.bounceOffsetY) < 0.02) {
        triggerSettleBounce(body, -0.12);
      }
    });

    guard += 1;
  }

  chooseTargetBody();
  updateUI();
  drawBoard();
}

function handleChoice(choice, button) {
  if (!state.targetLine || !choice.line) {
    statusEl.textContent = "There is no available target body yet. Drop and settle more pieces first.";
    return;
  }

  if (state.pendingTool) {
    clearPendingTool();
  }

  Array.from(choicesEl.querySelectorAll(".choice")).forEach((choiceButton) => {
    choiceButton.disabled = true;
  });

  if (choice.correct) {
    button.classList.add("correct");
  } else {
    button.classList.add("wrong");
  }

  state.awaitingAnswer = true;
  state.effectLine = choice.line;
  state.effectCells = getCellsHitByLine(choice.line);
  state.explosionCells = [];
  drawBoard();

  window.setTimeout(() => {
    if (choice.correct) {
      state.streak += 1;
    } else {
      state.streak = 0;
    }

    const removed = executeLine(choice.line, {
      safeExplosionBombs: choice.correct,
    });

    if (choice.correct) {
      if (removed > 0) {
        state.score += 20 + removed * (3 + state.streak);
      }
      showComboBanner();
      statusEl.textContent = removed > 0
        ? state.explosionCells.length > 0
          ? `Correct. ${choice.label} removed ${removed} cells and triggered a combo blast.`
          : `Correct. ${choice.label} was the best line and removed ${removed} cells.`
        : `Correct choice, but this shot did not clear any cells.`;
    } else {
      showComboBanner();
      state.score = Math.max(0, state.score - 5);
      statusEl.textContent = `Wrong target, but ${choice.label} still executed and removed ${removed} cells.`;
    }

    state.effectLine = null;
    state.effectCells = [];
    state.awaitingAnswer = false;
    state.turnCount += 1;
    if (!state.gameOver) {
      advanceBombs();
    }

    window.setTimeout(() => {
      state.explosionCells = [];
      state.shatterCells = [];
      state.coinEffectCells = [];
      state.bombEffectCells = [];
      buildChoices();
      updateUI();
      drawBoard();
    }, 200);
  }, 280);
}

function getBoardMetrics() {
  const cellSize = (canvas.width - BOARD_PADDING * 2) / WORLD_COLS;
  return { padding: BOARD_PADDING, cellSize };
}

function getBoardCellFromPointer(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const canvasX = (event.clientX - rect.left) * scaleX;
  const canvasY = (event.clientY - rect.top) * scaleY;
  const { padding, cellSize } = getBoardMetrics();
  const col = Math.floor((canvasX - padding) / cellSize);
  const row = Math.floor((canvasY - padding) / cellSize);

  if (!inBounds(row, col)) {
    return null;
  }

  return { row, col };
}

function handleBoardPointerMove(event) {
  if (!state.pendingTool) {
    return;
  }
  state.hoverCell = getBoardCellFromPointer(event);
  drawBoard();
}

function handleBoardPointerLeave() {
  if (!state.pendingTool) {
    return;
  }
  state.hoverCell = null;
  drawBoard();
}

function handleBoardClick(event) {
  if (!state.pendingTool) {
    return;
  }

  const cell = getBoardCellFromPointer(event);
  if (!cell) {
    statusEl.textContent = "Click inside the board to deploy the selected tool.";
    return;
  }

  if (state.pendingTool.type === "defuser") {
    deployDefuser(cell);
    updateUI();
    drawBoard();
    return;
  }
}

function renderChoices() {
  choicesEl.innerHTML = "";

  if (getModeConfig().choiceMode === "self_formula_only") {
    const note = document.createElement("div");
    note.className = "choice";
    note.innerHTML = "<strong>Self Formula Mode</strong><span>No multiple-choice answers here. Use your own equation from the store.</span>";
    choicesEl.appendChild(note);
    return;
  }

  if (state.choices.length === 0) {
    const empty = document.createElement("div");
    empty.className = "choice";
    empty.innerHTML = "<strong>No target yet</strong><span>Let at least one body settle first.</span>";
    choicesEl.appendChild(empty);
    return;
  }

  state.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.innerHTML = [
      `<span class="choice-badge">${String.fromCharCode(65 + index)}</span>`,
      `<span class="choice-copy">`,
      `<strong>${choice.label}</strong>`,
      `<span>This line will execute even if wrong. Current clear: ${choice.clearCount} cells.</span>`,
      `</span>`,
    ].join("");
    button.addEventListener("click", () => handleChoice(choice, button));
    choicesEl.appendChild(button);
  });
}

function renderQueue() {
  if (!queueEl) {
    ensureQueue();
    return;
  }

  queueEl.innerHTML = "";
  ensureQueue();

  state.queue.slice(0, 4).forEach((formula, index) => {
    const item = document.createElement("div");
    item.className = "queue-item";
    const detail = formula.family === "quadratic"
      ? `${formula.length} cells, quadratic fit`
      : formula.family === "circle"
        ? `${formula.length} cells, circle fit`
        : `${formula.length} cells, line step (${formula.stepX}, ${formula.stepY})`;
    item.innerHTML = `<strong>${index === 0 ? "Next" : `Queue ${index}`}: ${formula.family}</strong><span>${detail}</span>`;
    queueEl.appendChild(item);
  });
}

function updateUI() {
  const activeBody = getActiveBody();
  const supportMap = getSupportMap();
  const supportedCount = Array.from(supportMap.values()).filter(Boolean).length;
  const mode = getModeConfig();

  if (state.score > state.bestScore) {
    state.bestScore = state.score;
    saveBestScore();
  }

  setElementText(scoreEl, state.score);
  setElementText(moneyEl, state.money);
  setElementText(bestScoreEl, state.bestScore);
  setElementText(defuserCountEl, state.defusers);
  setElementText(polynomialToolCountEl, state.polynomialTools);
  setElementText(bodyCountEl, state.bodies.length);
  setElementText(targetLabelEl, state.targetLabel);
  setElementText(comboCountEl, state.streak);
  setElementText(activeLabelEl, activeBody ? activeBody.formulaLabel : "none");
  setElementText(supportedCountEl, supportedCount);
  setElementText(splitResultEl, `${state.lastClearCount} cells / ${state.lastSplitCount} pieces`);
  setElementText(queueCountEl, state.queue.length);
  if (buyDefuserButton) {
    buyDefuserButton.disabled = !mode.showDefuser || state.money < DEFUSER_COST || state.gameOver;
    buyDefuserButton.hidden = !mode.showDefuser;
  }
  if (useDefuserButton) {
    useDefuserButton.disabled = !mode.showDefuser || state.defusers <= 0 || !canUseShopTool();
    useDefuserButton.textContent = state.pendingTool?.type === "defuser" ? "Cancel" : "Use";
    useDefuserButton.hidden = !mode.showDefuser;
  }
  if (buyPolynomialToolButton) {
    buyPolynomialToolButton.disabled = mode.infinitePolynomial ? true : state.money < POLYNOMIAL_TOOL_COST || state.gameOver;
    buyPolynomialToolButton.hidden = mode.infinitePolynomial;
  }
  if (usePolynomialToolButton) {
    const availablePolynomialTools = mode.infinitePolynomial ? 1 : state.polynomialTools;
    usePolynomialToolButton.disabled = availablePolynomialTools <= 0 || !canUseShopTool();
    usePolynomialToolButton.textContent = state.pendingTool?.type === "polynomial" ? "Cancel" : "Use";
  }
  setElementText(polynomialToolCountEl, mode.infinitePolynomial ? "INF" : state.polynomialTools);
  setElementText(modeTimerEl, state.modeTimer);

  checkUnlockMilestones();
  renderQueue();
  renderChoices();
  renderLeaderboard();
  updateModeLayout();
  refreshModeButtons();
}

function toCanvasX(col, cellSize, padding) {
  return padding + col * cellSize + cellSize / 2;
}

function toCanvasY(row, cellSize, padding) {
  return padding + row * cellSize + cellSize / 2;
}

function getRenderRow(body, cell) {
  const visual = body.visual || createVisualState();
  return cell.row + visual.visualOffsetY + visual.bounceOffsetY;
}

function updateVisualEffects() {
  let needsRedraw = false;

  state.bodies.forEach((body) => {
    if (!body.visual) {
      body.visual = createVisualState();
    }

    if (Math.abs(body.visual.visualOffsetY) > 0.001) {
      body.visual.visualOffsetY *= 0.52;
      if (Math.abs(body.visual.visualOffsetY) < 0.01) {
        body.visual.visualOffsetY = 0;
      }
      needsRedraw = true;
    }

    if (Math.abs(body.visual.bounceVelocityY) > 0.001 || Math.abs(body.visual.bounceOffsetY) > 0.001) {
      body.visual.bounceVelocityY += 0.018;
      body.visual.bounceOffsetY += body.visual.bounceVelocityY;
      body.visual.bounceVelocityY *= 0.74;

      if (body.visual.bounceOffsetY > 0) {
        body.visual.bounceOffsetY = 0;
        body.visual.bounceVelocityY *= -0.45;
      }

      if (Math.abs(body.visual.bounceVelocityY) < 0.01 && Math.abs(body.visual.bounceOffsetY) < 0.01) {
        body.visual.bounceVelocityY = 0;
        body.visual.bounceOffsetY = 0;
      }
      needsRedraw = true;
    }
  });

  if (state.bombShockwave) {
    state.bombShockwave.radius += 0.13;
    state.bombShockwave.alpha *= 0.88;
    if (state.bombShockwave.alpha < 0.05 || state.bombShockwave.radius >= state.bombShockwave.maxRadius) {
      state.bombShockwave = null;
    }
    needsRedraw = true;
  }

  if (state.floatingTexts.length > 0) {
    state.floatingTexts = state.floatingTexts.filter((text) => {
      text.offsetY += text.velocityY;
      text.velocityY *= 0.98;
      text.alpha *= 0.94;
      text.life *= 0.96;
      return text.alpha > 0.05;
    });
    needsRedraw = true;
  }

  return needsRedraw;
}

function drawBoard() {
  const { width, height } = canvas;
  const padding = BOARD_PADDING;
  const cellSize = (width - padding * 2) / WORLD_COLS;
  ctx.clearRect(0, 0, width, height);

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#fffdf8");
  bg.addColorStop(1, "#ffe8bb");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  for (let index = 0; index <= WORLD_COLS; index += 1) {
    const x = padding + index * cellSize;
    ctx.strokeStyle = "rgba(92, 57, 44, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, padding);
    ctx.lineTo(x, height - padding);
    ctx.stroke();
  }

  for (let index = 0; index <= WORLD_ROWS; index += 1) {
    const y = padding + index * cellSize;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  const axisX = padding + COORD_MAX_X * cellSize + cellSize / 2;
  const axisY = padding + COORD_MAX_Y * cellSize + cellSize / 2;
  ctx.strokeStyle = "#5c392c";
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(axisX, padding);
  ctx.lineTo(axisX, height - padding);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(padding, axisY);
  ctx.lineTo(width - padding, axisY);
  ctx.stroke();

  state.bodies.forEach((body) => {
    const lineWidth = body.active ? cellSize * 0.2 : cellSize * 0.16;

    body.edges.forEach(([from, to]) => {
      const a = body.cells[from];
      const b = body.cells[to];
      ctx.strokeStyle = body.active ? "#1f8f67" : body.color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(toCanvasX(a.col, cellSize, padding), toCanvasY(getRenderRow(body, a), cellSize, padding));
      ctx.lineTo(toCanvasX(b.col, cellSize, padding), toCanvasY(getRenderRow(body, b), cellSize, padding));
      ctx.stroke();
    });

    body.cells.forEach((cell) => {
      const centerX = toCanvasX(cell.col, cellSize, padding);
      const centerY = toCanvasY(getRenderRow(body, cell), cellSize, padding);
      const radius = cellSize * 0.28;

      ctx.fillStyle = body.active ? "#1f8f67" : body.color;
      if (state.effectCells.some((effectCell) => effectCell.row === cell.row && effectCell.col === cell.col)) {
        ctx.fillStyle = "#ffd166";
      } else if (state.explosionCells.some((blastCell) => blastCell.row === cell.row && blastCell.col === cell.col)) {
        ctx.fillStyle = "#ff8c42";
      } else if (state.bombEffectCells.some((blastCell) => blastCell.row === cell.row && blastCell.col === cell.col)) {
        ctx.fillStyle = "#ff6b57";
      } else if (state.coinEffectCells.some((coinCell) => coinCell.row === cell.row && coinCell.col === cell.col)) {
        ctx.fillStyle = "#ffe37a";
      } else if (state.shatterCells.some((shatterCell) => shatterCell.row === cell.row && shatterCell.col === cell.col)) {
        ctx.fillStyle = "#d7f6ff";
      }
      ctx.beginPath();
      ctx.rect(centerX - radius, centerY - radius, radius * 2, radius * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(centerX - radius * 0.6, centerY - radius * 0.6, radius * 0.8, radius * 0.4);

      if (cell.special === SPECIAL_TYPES.ARMORED) {
        ctx.strokeStyle = "#2f241d";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(centerX - radius + 2, centerY - radius + 2, radius * 2 - 4, radius * 2 - 4);
        ctx.fillStyle = "#2f241d";
        ctx.font = '12px "Trebuchet MS"';
        ctx.fillText(String(cell.hp), centerX - 4, centerY + 4);
      } else if (cell.special === SPECIAL_TYPES.COIN) {
        ctx.fillStyle = "#fff3a3";
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#a46b00";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (cell.special === SPECIAL_TYPES.GLASS) {
        ctx.strokeStyle = "rgba(200, 245, 255, 0.95)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - radius * 0.65, centerY - radius * 0.1);
        ctx.lineTo(centerX - radius * 0.1, centerY - radius * 0.45);
        ctx.lineTo(centerX + radius * 0.2, centerY - radius * 0.05);
        ctx.lineTo(centerX + radius * 0.55, centerY - radius * 0.35);
        ctx.stroke();
      } else if (cell.special === SPECIAL_TYPES.BOMB) {
        ctx.fillStyle = "#1c1614";
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff2dc";
        ctx.font = '11px "Trebuchet MS"';
        ctx.fillText(String(cell.timer), centerX - 3, centerY + 4);
      }

      if (state.highlightedCells.some((highlightedCell) => highlightedCell.row === cell.row && highlightedCell.col === cell.col)) {
        ctx.strokeStyle = "#f4c542";
        ctx.lineWidth = 3;
        ctx.strokeRect(centerX - radius - 4, centerY - radius - 4, radius * 2 + 8, radius * 2 + 8);
      }

      if (state.explosionCells.some((blastCell) => blastCell.row === cell.row && blastCell.col === cell.col)) {
        ctx.strokeStyle = "rgba(255, 140, 66, 0.95)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 7, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (state.bombEffectCells.some((blastCell) => blastCell.row === cell.row && blastCell.col === cell.col)) {
        ctx.strokeStyle = "rgba(255, 82, 82, 0.98)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(centerX - radius - 5, centerY);
        ctx.lineTo(centerX + radius + 5, centerY);
        ctx.moveTo(centerX, centerY - radius - 5);
        ctx.lineTo(centerX, centerY + radius + 5);
        ctx.stroke();
      }

      if (state.coinEffectCells.some((coinCell) => coinCell.row === cell.row && coinCell.col === cell.col)) {
        ctx.strokeStyle = "rgba(255, 224, 102, 0.98)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255, 246, 191, 0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - radius * 0.95, centerY);
        ctx.lineTo(centerX + radius * 0.95, centerY);
        ctx.moveTo(centerX, centerY - radius * 0.95);
        ctx.lineTo(centerX, centerY + radius * 0.95);
        ctx.stroke();
      }

      if (state.shatterCells.some((shatterCell) => shatterCell.row === cell.row && shatterCell.col === cell.col)) {
        ctx.strokeStyle = "rgba(204, 247, 255, 0.98)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - radius * 0.75, centerY - radius * 0.3);
        ctx.lineTo(centerX - radius * 0.15, centerY + radius * 0.05);
        ctx.lineTo(centerX + radius * 0.1, centerY - radius * 0.45);
        ctx.lineTo(centerX + radius * 0.55, centerY - radius * 0.1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX - radius * 0.2, centerY + radius * 0.55);
        ctx.lineTo(centerX + radius * 0.15, centerY + radius * 0.1);
        ctx.lineTo(centerX + radius * 0.62, centerY + radius * 0.4);
        ctx.stroke();
      }
    });
  });

  if (state.bombShockwave) {
    const shockX = toCanvasX(state.bombShockwave.col, cellSize, padding);
    const shockY = toCanvasY(state.bombShockwave.row, cellSize, padding);
    ctx.strokeStyle = `rgba(255, 94, 72, ${state.bombShockwave.alpha})`;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(shockX, shockY, state.bombShockwave.radius * cellSize, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 220, 164, ${state.bombShockwave.alpha * 0.7})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(shockX, shockY, (state.bombShockwave.radius + 0.42) * cellSize, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (state.effectLine) {
    ctx.strokeStyle = "rgba(255, 209, 102, 0.95)";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";

    if (state.effectLine.family === "circle") {
      const centerCol = state.effectLine.h + COORD_MAX_X;
      const centerRow = COORD_MAX_Y - state.effectLine.k;
      ctx.beginPath();
      ctx.arc(
        toCanvasX(centerCol, cellSize, padding),
        toCanvasY(centerRow, cellSize, padding),
        state.effectLine.r * cellSize,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    } else {
      ctx.beginPath();
      let started = false;
      if (state.effectLine.vertical) {
        const fixedCol = state.effectLine.xIntercept + COORD_MAX_X;
        for (let y = -COORD_MAX_Y - 0.5; y <= COORD_MAX_Y + 0.5; y += 0.25) {
          const canvasX = toCanvasX(fixedCol, cellSize, padding);
          const canvasY = toCanvasY(COORD_MAX_Y - y, cellSize, padding);
          if (!started) {
            ctx.moveTo(canvasX, canvasY);
            started = true;
          } else {
            ctx.lineTo(canvasX, canvasY);
          }
        }
        ctx.stroke();
      } else {
        if (state.effectLine.family === "polynomial" && state.effectLine.thickness) {
          ctx.lineWidth = 6;
          drawPolynomialCurve(ctx, state.effectLine, cellSize, padding, 0, 0.98);
          drawPolynomialCurve(ctx, state.effectLine, cellSize, padding, state.effectLine.thickness, 0.42);
          drawPolynomialCurve(ctx, state.effectLine, cellSize, padding, -state.effectLine.thickness, 0.42);
        } else {
          for (let x = -COORD_MAX_X - 0.5; x <= COORD_MAX_X + 0.5; x += 0.25) {
            let y;
            if (state.effectLine.family === "quadratic") {
              y = state.effectLine.a * (x - state.effectLine.h) * (x - state.effectLine.h) + state.effectLine.k;
            } else if (state.effectLine.family === "polynomial") {
              y = getPolynomialY(state.effectLine, x);
            } else {
              y = state.effectLine.slope * x + state.effectLine.intercept;
            }

            const canvasX = toCanvasX(x + COORD_MAX_X, cellSize, padding);
            const canvasY = toCanvasY(COORD_MAX_Y - y, cellSize, padding);
            if (!started) {
              ctx.moveTo(canvasX, canvasY);
              started = true;
            } else {
              ctx.lineTo(canvasX, canvasY);
            }
          }
          ctx.stroke();
        }
      }
    }
  }

  if (state.pendingTool?.type === "polynomial" && state.hoverCell) {
    const previewLine = buildPolynomialLine(
      state.pendingTool.coefficients,
      toMathCoord(state.hoverCell).x,
      toMathCoord(state.hoverCell).y
    );
    ctx.strokeStyle = "rgba(103, 80, 164, 0.88)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    let started = false;
    for (let x = -COORD_MAX_X - 0.5; x <= COORD_MAX_X + 0.5; x += 0.25) {
      const y = previewLine.coefficients.reduce((sum, coefficient, index) => {
        const power = previewLine.coefficients.length - 1 - index;
        return sum + coefficient * ((x - previewLine.xShift) ** power);
      }, previewLine.yShift);

      const canvasX = toCanvasX(x + COORD_MAX_X, cellSize, padding);
      const canvasY = toCanvasY(COORD_MAX_Y - y, cellSize, padding);
      if (!started) {
        ctx.moveTo(canvasX, canvasY);
        started = true;
      } else {
        ctx.lineTo(canvasX, canvasY);
      }
    }
    ctx.stroke();
  }

  ctx.fillStyle = "#5c392c";
  ctx.font = '13px "Trebuchet MS"';
  for (let x = -COORD_MAX_X; x <= COORD_MAX_X; x += 1) {
    if (x === 0) {
      continue;
    }
    ctx.fillText(String(x), toCanvasX(x + COORD_MAX_X, cellSize, padding) - 4, axisY + 18);
  }
  for (let y = -COORD_MAX_Y; y <= COORD_MAX_Y; y += 1) {
    if (y === 0) {
      continue;
    }
    ctx.fillText(String(y), axisX + 10, toCanvasY(COORD_MAX_Y - y, cellSize, padding) + 4);
  }

  state.floatingTexts.forEach((text) => {
    const textX = toCanvasX(text.col, cellSize, padding);
    const textY = toCanvasY(text.row + text.offsetY, cellSize, padding);
    ctx.save();
    ctx.globalAlpha = text.alpha;
    ctx.fillStyle = text.color;
    ctx.font = 'bold 22px "Trebuchet MS"';
    ctx.textAlign = "center";
    ctx.fillText(text.text, textX, textY - cellSize * 0.65);
    ctx.restore();
  });

  if (state.pendingTool && state.hoverCell) {
    const centerX = toCanvasX(state.hoverCell.col, cellSize, padding);
    const centerY = toCanvasY(state.hoverCell.row, cellSize, padding);
    const radius = cellSize * 0.38;
    ctx.strokeStyle = state.pendingTool.type === "defuser" ? "rgba(36, 148, 104, 0.95)" : "rgba(103, 80, 164, 0.95)";
    ctx.lineWidth = 3;
    ctx.strokeRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
  }
}

function loop() {
  if (!state.paused && !state.gameOver) {
    if (state.pendingTool) {
      return;
    }
    if (!getActiveBody() && !state.awaitingAnswer) {
      spawnNextBody();
    }
    tickActiveBody();
  }
}

function animationLoop() {
  if (updateVisualEffects()) {
    drawBoard();
  }
  window.requestAnimationFrame(animationLoop);
}

if (toggleSimButton) {
  toggleSimButton.addEventListener("click", () => {
    if (state.gameOver) {
      return;
    }
    state.paused = !state.paused;
    toggleSimButton.textContent = state.paused ? "Resume" : "Pause";
    setElementText(statusEl, state.paused ? "Simulation paused." : "Simulation running.");
  });
}

restartGameButton.addEventListener("click", () => {
  resetState();
  ensureQueue();
  updateUI();
  drawBoard();
});

if (saveScoreButton) {
  saveScoreButton.addEventListener("click", () => {
    saveCurrentRunToLeaderboard();
  });
}

if (playerNameInputEl) {
  playerNameInputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveCurrentRunToLeaderboard();
    }
  });
}

if (dismissTutorialButton) {
  dismissTutorialButton.addEventListener("click", () => {
    if (tutorialCardEl) {
      tutorialCardEl.hidden = true;
    }
    safeStorageSet(STORAGE_KEYS.tutorialHidden, "1");
  });
}

buyDefuserButton.addEventListener("click", () => {
  buyItem(DEFUSER_COST, "defusers", "Bomb defuser");
});

useDefuserButton.addEventListener("click", () => {
  armDefuserTool();
  updateUI();
  drawBoard();
});

buyPolynomialToolButton.addEventListener("click", () => {
  buyItem(POLYNOMIAL_TOOL_COST, "polynomialTools", "Polynomial tool");
});

usePolynomialToolButton.addEventListener("click", () => {
  armPolynomialTool();
  updateUI();
});

if (confirmPolynomialToolButton) {
  confirmPolynomialToolButton.addEventListener("click", () => {
    confirmPolynomialTool();
  });
}

if (cancelPolynomialToolButton) {
  cancelPolynomialToolButton.addEventListener("click", () => {
    if (getModeConfig().id === "self_formula") {
      if (polynomialInputEl) {
        polynomialInputEl.value = "";
        polynomialInputEl.focus();
      }
      setElementText(polynomialGuideEl, getPolynomialGuideText([]));
      state.effectLine = null;
      state.effectCells = [];
      setElementText(statusEl, "Self Formula mode: type your own equation in Options, then press Arm.");
      updateUI();
      drawBoard();
      return;
    }
    clearPendingTool();
    state.effectLine = null;
    state.effectCells = [];
    setElementText(statusEl, "Polynomial tool cancelled.");
    updateUI();
    drawBoard();
  });
}

if (polynomialInputEl) {
  polynomialInputEl.addEventListener("input", () => {
    const tokens = polynomialInputEl.value
      .split(",")
      .map((token) => token.trim())
      .filter((token) => token.length > 0);
    const preview = tokens.map((token) => Number(token)).filter((value) => Number.isFinite(value));
    setElementText(polynomialGuideEl, getPolynomialGuideText(preview));
    if (preview.length >= 2 && preview.length <= 4) {
      const previewLine = buildThickLine(buildPolynomialLine(preview), POLYNOMIAL_TOOL_THICKNESS);
      state.effectLine = previewLine;
      state.effectCells = getCellsHitByLine(previewLine);
    } else {
      state.effectLine = null;
      state.effectCells = [];
    }
    drawBoard();
  });

  polynomialInputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      confirmPolynomialTool();
    }
  });
}

canvas.addEventListener("mousemove", handleBoardPointerMove);
canvas.addEventListener("mouseleave", handleBoardPointerLeave);
canvas.addEventListener("click", handleBoardClick);

function crossProduct(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function onSegment(a, b, c) {
  return (
    Math.min(a.x, b.x) <= c.x &&
    c.x <= Math.max(a.x, b.x) &&
    Math.min(a.y, b.y) <= c.y &&
    c.y <= Math.max(a.y, b.y)
  );
}

function segmentsIntersect(a, b, c, d) {
  const c1 = crossProduct(a, b, c);
  const c2 = crossProduct(a, b, d);
  const c3 = crossProduct(c, d, a);
  const c4 = crossProduct(c, d, b);

  if (((c1 > 0 && c2 < 0) || (c1 < 0 && c2 > 0)) && ((c3 > 0 && c4 < 0) || (c3 < 0 && c4 > 0))) {
    return true;
  }

  if (c1 === 0 && onSegment(a, b, c)) {
    return true;
  }
  if (c2 === 0 && onSegment(a, b, d)) {
    return true;
  }
  if (c3 === 0 && onSegment(c, d, a)) {
    return true;
  }
  if (c4 === 0 && onSegment(c, d, b)) {
    return true;
  }

  return false;
}

function wouldBodyIntersect(activeBody) {
  const movedCells = activeBody.cells.map((cell) => ({ row: cell.row + 1, col: cell.col }));
  const activeSegments = activeBody.edges.map(([from, to]) => ({
    a: movedCells[from],
    b: movedCells[to],
  }));

  for (const cell of movedCells) {
    if (cell.col < 0 || cell.col >= WORLD_COLS || cell.row >= WORLD_ROWS) {
      return true;
    }
  }

  for (const body of state.bodies) {
    if (body.id === activeBody.id) {
      continue;
    }

    const otherSegments = body.edges.map(([from, to]) => ({
      a: body.cells[from],
      b: body.cells[to],
    }));

    for (const segment of activeSegments) {
      for (const other of otherSegments) {
        if (segmentsIntersect(segment.a, segment.b, other.a, other.b)) {
          return true;
        }
      }
    }
  }

  return false;
}

function bodyIntersectsWorld(body, excludeBodyId = null) {
  const ownCells = new Set(body.cells.map((cell) => positionKey(cell.row, cell.col)));
  const bodySegments = getBodySegments(body);

  for (const other of state.bodies) {
    if (other.id === body.id || other.id === excludeBodyId) {
      continue;
    }

    for (const cell of other.cells) {
      if (ownCells.has(positionKey(cell.row, cell.col))) {
        return true;
      }
    }

    const otherSegments = getBodySegments(other);
    for (const segment of bodySegments) {
      for (const otherSegment of otherSegments) {
        const sharesEndpoint =
          (segment.a.row === otherSegment.a.row && segment.a.col === otherSegment.a.col) ||
          (segment.a.row === otherSegment.b.row && segment.a.col === otherSegment.b.col) ||
          (segment.b.row === otherSegment.a.row && segment.b.col === otherSegment.a.col) ||
          (segment.b.row === otherSegment.b.row && segment.b.col === otherSegment.b.col);

        if (!sharesEndpoint && segmentsIntersect(segment.a, segment.b, otherSegment.a, otherSegment.b)) {
          return true;
        }
      }
    }
  }

  return false;
}

function init() {
  loadPersistentState();
  loadLeaderboardForCurrentMode();
  hideGameOver();
  ensureQueue();
  renderModes();
  updateUI();
  drawBoard();
  window.setInterval(loop, TICK_MS);
  window.requestAnimationFrame(animationLoop);
}

init();

