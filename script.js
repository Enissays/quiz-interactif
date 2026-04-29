const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const quizMeta = document.getElementById("quiz-meta");
const appTitle = document.getElementById("app-title");

const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const restartResultBtn = document.getElementById("restart-result-btn");
const saveScoreBtn = document.getElementById("save-score-btn");
const timeInput = document.getElementById("time-input");
const settingsBtn = document.getElementById("settings-btn");
const settingsModal = document.getElementById("settings-modal");
const closeSettingsBtn = document.getElementById("close-settings-btn");
const saveSettingsBtn = document.getElementById("save-settings-btn");
const levelSelect = document.getElementById("level-select");

const questionText = document.getElementById("question-text");
const questionStatusesContainer = document.getElementById("question-statuses");
const answersContainer = document.getElementById("answers");
const progressLabel = document.getElementById("progress");
const scoreLabel = document.getElementById("score");
const streakLabel = document.getElementById("streak");
const timerLabel = document.getElementById("timer");
const victoryMessageLabel = document.getElementById("victory-message");
const finalScoreLabel = document.getElementById("final-score");
const playerNameInput = document.getElementById("player-name-input");
const saveStatusLabel = document.getElementById("save-status");
const bestScoresList = document.getElementById("best-scores");
const statusLabel = document.getElementById("status");


const BEST_SCORES_KEY = "quiz_best_scores";
const DEFAULT_APP_TITLE = "Quiz Interactif";

let allQuestions = [];
let questions = [];
let currentIndex = 0;
let score = 0;
let selectedIndex = null;
let answered = false;
let timePerQuestion = 20;
let remainingTime = 0;
let timerId = null;
let currentStreak = 0;
let bestStreak = 0;
let hasSavedCurrentScore = false;
let questionStates = [];

function sanitizeTimeInput() {
  const parsedTime = Number.parseInt(timeInput.value, 10);
  timePerQuestion = Number.isNaN(parsedTime) ? 20 : Math.min(Math.max(parsedTime, 5), 120);
  timeInput.value = String(timePerQuestion);
}

function openSettingsModal() {
  settingsModal.showModal();
}

function closeSettingsModal() {
  settingsModal.close();
}

function saveSettings() {
  sanitizeTimeInput();
  closeSettingsModal();
}

async function loadQuestions() {
  let response;
  try {
    response = await fetch("./questions.json", { cache: "no-store" });
  } catch {
    if (globalThis.location.protocol === "file:") {
      throw new Error(
        "Le navigateur bloque l'acces a questions.json en mode file://. Lance un serveur local (ex: python -m http.server 5500) puis ouvre http://localhost:5500."
      );
    }
    throw new Error("NetworkError: impossible de charger questions.json");
  }

  if (!response.ok) {
    throw new Error(`Impossible de charger questions.json (HTTP ${response.status})`);
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Le JSON doit contenir un tableau de questions non vide");
  }

  data.forEach((q, i) => {
    if (
      typeof q.question !== "string" ||
      !Array.isArray(q.choices) ||
      q.choices.length < 2 ||
      typeof q.answerIndex !== "number" ||
      typeof q.lv !== "number"
    ) {
      throw new Error(`Format invalide pour la question ${i + 1}`);
    }

    if (![1, 2, 3].includes(q.lv)) {
      throw new Error(`Le niveau (lv) de la question ${i + 1} doit etre 1, 2 ou 3`);
    }
  });

  return data;
}

function showScreen(screen) {
  startScreen.classList.add("hidden");
  quizScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  quizMeta?.classList.add("hidden");
  screen.classList.remove("hidden");

  if (screen === quizScreen) {
    quizMeta?.classList.remove("hidden");
    restartBtn.classList.remove("hidden");
  } else {
    appTitle.textContent = DEFAULT_APP_TITLE;
  }
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function updateTimerLabel() {
  timerLabel.textContent = `Temps: ${formatTime(remainingTime)}`;
}

function updateStreakLabel() {
  streakLabel.textContent = `Streak: ${currentStreak}`;
}

function getSelectedLevel() {
  const parsedLevel = Number.parseInt(levelSelect.value, 10);
  return [1, 2, 3].includes(parsedLevel) ? parsedLevel : 2;
}

function getStreakTarget(level) {
  if (level === 1) return 3;
  if (level === 2) return 5;
  return 7;
}

function initializeQuestionStates() {
  questionStates = Array.from({ length: questions.length }, () => "pending");
  renderQuestionStatuses();
}

function renderQuestionStatuses() {
  if (!questionStatusesContainer) return;

  questionStatusesContainer.innerHTML = "";

  questionStates.forEach((state, index) => {
    const bubble = document.createElement("div");
    bubble.className = `question-status ${state}`;
    if (index === currentIndex && state === "pending") {
      bubble.classList.add("current");
    }
    bubble.textContent = String(index + 1);
    let stateLabel = "pas repondu";
    if (state === "correct") {
      stateLabel = "repondu correctement";
    } else if (state === "wrong") {
      stateLabel = "repondu faux";
    }
    bubble.title = `Question ${index + 1}: ${stateLabel}`;
    questionStatusesContainer.appendChild(bubble);
  });
}

function setCurrentQuestionState(state) {
  questionStates[currentIndex] = state;
  renderQuestionStatuses();
}

function clearQuestionTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function handleTimeUp() {
  if (answered) return;

  selectedIndex = -1;
  validateAnswer();
  nextBtn.textContent = currentIndex === questions.length - 1 ? "Voir resultat" : "Continuer";
}

function startQuestionTimer() {
  clearQuestionTimer();
  remainingTime = timePerQuestion;
  updateTimerLabel();

  timerId = setInterval(() => {
    remainingTime -= 1;
    updateTimerLabel();

    if (remainingTime <= 0) {
      clearQuestionTimer();
      handleTimeUp();
    }
  }, 1000);
}

function getBestScores() {
  try {
    const raw = localStorage.getItem(BEST_SCORES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBestScores(scores) {
  localStorage.setItem(BEST_SCORES_KEY, JSON.stringify(scores));
}

function renderBestScores() {
  const scores = getBestScores();
  bestScoresList.innerHTML = "";

  if (scores.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Aucun score enregistre";
    bestScoresList.appendChild(li);
    return;
  }

  scores.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.name || "Anonyme"} - ${entry.score}/${entry.total} (${entry.percent}%) - ${entry.timePerQuestion}s/question - ${entry.date}`;
    bestScoresList.appendChild(li);
  });
}

function registerBestScore(name) {
  const percent = Math.round((score / questions.length) * 100);
  const now = new Date();
  const entry = {
    name,
    score,
    total: questions.length,
    percent,
    timePerQuestion,
    date: now.toLocaleDateString("fr-FR")
  };

  const scores = getBestScores();
  scores.push(entry);
  scores.sort((a, b) => {
    if (b.percent !== a.percent) return b.percent - a.percent;
    return a.timePerQuestion - b.timePerQuestion;
  });

  const topScores = scores.slice(0, 5);
  saveBestScores(topScores);
  renderBestScores();
}

function handleSaveScore() {
  if (hasSavedCurrentScore) {
    saveStatusLabel.textContent = "Ce score est deja enregistre.";
    return;
  }

  const name = playerNameInput.value.trim() || "Anonyme";
  registerBestScore(name);
  hasSavedCurrentScore = true;
  saveStatusLabel.textContent = "Score enregistre.";
}

function renderQuestion() {
  const q = questions[currentIndex];
  selectedIndex = null;
  answered = false;
  nextBtn.disabled = true;

  progressLabel.textContent = `Question ${currentIndex + 1}/${questions.length}`;
  if (appTitle) {
    appTitle.textContent = `Question ${currentIndex + 1}`;
  }
  scoreLabel.textContent = `Score: ${score}`;
  updateStreakLabel();
  renderQuestionStatuses();
  questionText.textContent = q.question;

  answersContainer.innerHTML = "";
  q.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.className = "answer-btn";
    button.type = "button";
    button.textContent = choice;

    button.addEventListener("click", () => {
      if (answered) return;
      selectAnswer(index);
    });

    answersContainer.appendChild(button);
  });

  startQuestionTimer();
}

function selectAnswer(index) {
  selectedIndex = index;
  nextBtn.disabled = false;

  const answerButtons = answersContainer.querySelectorAll(".answer-btn");
  answerButtons.forEach((btn, i) => {
    btn.classList.toggle("selected", i === index);
  });
}

function validateAnswer() {
  clearQuestionTimer();

  const q = questions[currentIndex];
  const isCorrect = selectedIndex === q.answerIndex;

  if (isCorrect) {
    score += 1;
    currentStreak += 1;
    bestStreak = Math.max(bestStreak, currentStreak);
  } else {
    currentStreak = 0;
  }

  setCurrentQuestionState(isCorrect ? "correct" : "wrong");

  const answerButtons = answersContainer.querySelectorAll(".answer-btn");
  answerButtons.forEach((btn, i) => {
    if (i === q.answerIndex) btn.classList.add("correct");
    if (i === selectedIndex && i !== q.answerIndex) btn.classList.add("wrong");
    btn.disabled = true;
  });

  scoreLabel.textContent = `Score: ${score}`;
  updateStreakLabel();
  answered = true;
}

function nextQuestion() {
  if (selectedIndex === null) return;

  if (!answered) {
    validateAnswer();
    nextBtn.textContent = currentIndex === questions.length - 1 ? "Voir resultat" : "Continuer";
    return;
  }

  currentIndex += 1;
  nextBtn.textContent = "Suivante";

  if (currentIndex >= questions.length) {
    showResult();
    return;
  }

  renderQuestion();
}

function showResult() {
  showScreen(resultScreen);
  hasSavedCurrentScore = false;
  playerNameInput.value = "";
  saveStatusLabel.textContent = "";
  finalScoreLabel.textContent = `Tu as obtenu ${score} / ${questions.length}`;

  const level = getSelectedLevel();
  const targetStreak = getStreakTarget(level);
  if (bestStreak >= targetStreak) {
    victoryMessageLabel.textContent = `Victoire ! Tu as atteint un streak de ${bestStreak} et l'objectif était ${targetStreak}.`;
  } else {
    victoryMessageLabel.textContent = `Objectif non atteint : ${bestStreak} / ${targetStreak} pour une victoire.`;
  }
}

function resetQuiz() {
  console.log("resetting..");
  clearQuestionTimer();
  currentIndex = 0;
  score = 0;
  currentStreak = 0;
  bestStreak = 0;
  selectedIndex = null;
  answered = false;
  remainingTime = 0;
  updateTimerLabel();
  updateStreakLabel();
  victoryMessageLabel.textContent = "";
  questionStates = [];
  renderQuestionStatuses();
  nextBtn.textContent = "Suivante";
  showScreen(startScreen);
}

async function startQuiz() {
  statusLabel.textContent = "Chargement des questions...";

  try {
    if (allQuestions.length === 0) {
      allQuestions = await loadQuestions();
    }

    const selectedLevel = getSelectedLevel();
    questions = allQuestions.filter((q) => q.lv === selectedLevel);

    if (questions.length === 0) {
      throw new Error("Aucune question disponible pour ce niveau.");
    }

    currentIndex = 0;
    score = 0;
    currentStreak = 0;
    bestStreak = 0;
    sanitizeTimeInput();
    initializeQuestionStates();
    showScreen(quizScreen);
    renderQuestion();
    statusLabel.textContent = "";
  } catch (error) {
    statusLabel.textContent = error instanceof Error ? error.message : "Erreur inconnue";
  }
}

startBtn.addEventListener("click", startQuiz);
nextBtn.addEventListener("click", nextQuestion);
restartBtn.addEventListener("click", resetQuiz);
restartResultBtn?.addEventListener("click", resetQuiz);
saveScoreBtn.addEventListener("click", handleSaveScore);
settingsBtn.addEventListener("click", openSettingsModal);
closeSettingsBtn.addEventListener("click", closeSettingsModal);
saveSettingsBtn.addEventListener("click", saveSettings);

settingsModal.addEventListener("click", (event) => {
  if (event.target === settingsModal) {
    closeSettingsModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && settingsModal.open) {
    closeSettingsModal();
  }
});

renderBestScores();
updateTimerLabel();
updateStreakLabel();
renderQuestionStatuses();
