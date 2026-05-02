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
let questionsCache = {};
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

// locale support
let currentLocale = "fr";
const LOCALES = {
  fr: {
    pageTitle: "Quiz Interactif",
    eyebrow: "Challenge archéologique",
    startKicker: "30 questions",
    startText: "Sauriez-vous répondre?",
    startBtn: "Lancer le quiz",
    nextBtn: "Suivante",
    continueBtn: "Continuer",
    seeResult: "Voir résultat",
    restart: "Rejouer",
    score: (s) => `Score: ${s}`,
    streak: (s) => `Streak: ${s}`,
    timer: (t) => `Temps: ${t}`,
    progress: (i, total) => `Question ${i}/${total}`,
    noScores: "Aucun score enregistré",
    savedAlready: "Ce score est déjà enregistré.",
    saved: "Score enregistré.",
    settingsTitle: "Paramètres",
    levelLabel: "Niveau",
    levelEasy: "Facile",
    levelMedium: "Moyen",
    levelHard: "Avancé",
    timeLabel: "Temps par question (secondes)",
    langLabel: "Langue",
    langFrench: "Français",
    langArabic: "العربية",
    modalNote: "Valeur recommandée: 20 à 30 secondes.",
    applyBtn: "Appliquer",
    playerNamePlaceholder: "Ex: Rachid",
    finalResult: (s, total) => `Tu as obtenu ${s} / ${total}`,
    victory: (best, target) => `Victoire ! Tu as atteint un streak de ${best} et l'objectif était ${target}.`,
    defeat: (best, target) => `Objectif non atteint : ${best} / ${target} pour une victoire.`,
    bestScoresTitle: "Meilleurs scores",
    saveScoreBtn: "Enregistrer mon score",
    resultTitle: "Résultat",
    nextQuestion: "Suivante",
    continueQuestion: "Continuer",
    seeResultQuestion: "Voir résultat",
    loadingQuestions: "Chargement des questions...",
    noQuestionsAvailable: "Aucune question disponible pour ce niveau.",
    unknownError: "Erreur inconnue"
  },
  ar: {
    pageTitle: "اختبار أثري",
    eyebrow: "تحدي أثري",
    startKicker: "30 سؤالاً",
    startText: "هل تستطيع الإجابة؟",
    startBtn: "ابدأ الاختبار",
    nextBtn: "التالي",
    continueBtn: "استمرار",
    seeResult: "عرض النتيجة",
    restart: "إعادة اللعب",
    score: (s) => `النتيجة: ${s}`,
    streak: (s) => `السلسلة: ${s}`,
    timer: (t) => `الوقت: ${t}`,
    progress: (i, total) => `السؤال ${i}/${total}`,
    noScores: "لا توجد نتائج مسجلة",
    savedAlready: "تم تسجيل هذه النتيجة بالفعل.",
    saved: "تم حفظ النتيجة.",
    settingsTitle: "الإعدادات",
    levelLabel: "المستوى",
    levelEasy: "سهل",
    levelMedium: "متوسط",
    levelHard: "متقدم",
    timeLabel: "الوقت لكل سؤال (بالثواني)",
    langLabel: "اللغة",
    langFrench: "الفرنسية",
    langArabic: "العربية",
    modalNote: "القيمة الموصى بها: 20 إلى 30 ثانية.",
    applyBtn: "تطبيق",
    playerNamePlaceholder: "مثال: رشيد",
    finalResult: (s, total) => `لقد حصلت على ${s} / ${total}`,
    victory: (best, target) => `انتصار! وصلت إلى سلسلة ${best} والهدف كان ${target}.`,
    defeat: (best, target) => `الهدف غير محقق: ${best} / ${target} للفوز.`,
    bestScoresTitle: "أفضل النتائج",
    saveScoreBtn: "حفظ نتيجتي",
    resultTitle: "النتيجة",
    nextQuestion: "التالي",
    continueQuestion: "استمرار",
    seeResultQuestion: "عرض النتيجة",
    loadingQuestions: "جارٍ تحميل الأسئلة...",
    noQuestionsAvailable: "لا توجد أسئلة متاحة لهذا المستوى.",
    unknownError: "خطأ غير معروف"
  }
};

function setButtonLabel(button, label) {
  const span = button?.querySelector("span");
  if (span) {
    span.textContent = label;
  } else if (button) {
    button.textContent = label;
  }
}

function updateNextButtonLabel() {
  if (!questions.length || !answered) {
    setButtonLabel(nextBtn, LOCALES[currentLocale].nextQuestion);
    return;
  }

  const label = currentIndex === questions.length - 1 ? LOCALES[currentLocale].seeResultQuestion : LOCALES[currentLocale].continueQuestion;
  setButtonLabel(nextBtn, label);
}

function applyLocale(locale) {
  currentLocale = locale;
  document.documentElement.lang = locale === "ar" ? "ar" : "fr";
  if (locale === "ar") document.body.classList.add("rtl");
  else document.body.classList.remove("rtl");

  document.title = LOCALES[locale].pageTitle;
  updateLocaleHeader(locale);
  updateLocaleStartScreen(locale);
  updateLocaleSettings(locale);
  updateLocaleResult(locale);
  updateLocaleToggle(locale);
  playerNameInput.placeholder = LOCALES[locale].playerNamePlaceholder;

  updateTimerLabel();
  updateStreakLabel();
  scoreLabel.textContent = LOCALES[locale].score(score);
  renderBestScores();
  renderQuestionStatuses();
  updateNextButtonLabel();
}

function updateLocaleHeader(locale) {
  appTitle.textContent = LOCALES[locale].pageTitle;
}

function updateLocaleStartScreen(locale) {
  const startKickerEl = document.querySelector(".start-kicker");
  if (startKickerEl) startKickerEl.textContent = LOCALES[locale].startKicker;

  const startTextEl = document.querySelector(".start-text");
  if (startTextEl) startTextEl.textContent = LOCALES[locale].startText;

  const eyebrowEl = document.querySelector(".eyebrow");
  if (eyebrowEl) eyebrowEl.textContent = LOCALES[locale].eyebrow;

  setButtonLabel(startBtn, LOCALES[locale].startBtn);
  setButtonLabel(nextBtn, LOCALES[locale].nextQuestion);
  setButtonLabel(restartBtn, LOCALES[locale].restart);
  restartResultBtn && setButtonLabel(restartResultBtn, LOCALES[locale].restart);

  setButtonLabel(saveScoreBtn, LOCALES[locale].saveScoreBtn);
}

function updateLocaleSettings(locale) {
  const settingsTitleEl = document.getElementById("settings-title");
  if (settingsTitleEl) settingsTitleEl.textContent = LOCALES[locale].settingsTitle;

  const levelLabelEl = document.querySelector('label[for="level-select"]');
  if (levelLabelEl) levelLabelEl.textContent = LOCALES[locale].levelLabel;

  const levelEasyOption = levelSelect?.querySelector('option[value="1"]');
  const levelMediumOption = levelSelect?.querySelector('option[value="2"]');
  const levelHardOption = levelSelect?.querySelector('option[value="3"]');
  if (levelEasyOption) levelEasyOption.textContent = LOCALES[locale].levelEasy;
  if (levelMediumOption) levelMediumOption.textContent = LOCALES[locale].levelMedium;
  if (levelHardOption) levelHardOption.textContent = LOCALES[locale].levelHard;

  const timeLabelEl = document.querySelector('label[for="time-input"]');
  if (timeLabelEl) timeLabelEl.textContent = LOCALES[locale].timeLabel;

  const langLabelEl = document.querySelector('label[for="lang-select"]');
  if (langLabelEl) langLabelEl.textContent = LOCALES[locale].langLabel;

  const langFrenchOption = langSelect?.querySelector('option[value="fr"]');
  const langArabicOption = langSelect?.querySelector('option[value="ar"]');
  if (langFrenchOption) langFrenchOption.textContent = LOCALES[locale].langFrench;
  if (langArabicOption) langArabicOption.textContent = LOCALES[locale].langArabic;

  const modalNoteEl = document.getElementById("modal-note-text");
  if (modalNoteEl) modalNoteEl.textContent = LOCALES[locale].modalNote;

  const saveSettingsBtnEl = document.getElementById("save-settings-btn");
  if (saveSettingsBtnEl) saveSettingsBtnEl.textContent = LOCALES[locale].applyBtn;
}

function updateLocaleResult(locale) {
  const resultTitleEl = document.querySelector("#result-screen h2");
  if (resultTitleEl) resultTitleEl.textContent = LOCALES[locale].resultTitle;

  const bestScoresTitleEl = document.querySelector("#result-screen h3");
  if (bestScoresTitleEl) bestScoresTitleEl.textContent = LOCALES[locale].bestScoresTitle;
}

function updateLocaleToggle(locale) {
  const langToggleAr = document.getElementById("lang-toggle-ar");
  const langToggleFr = document.getElementById("lang-toggle-fr");
  if (langToggleAr && langToggleFr) {
    langToggleAr.style.fontWeight = locale === "ar" ? "700" : "400";
    langToggleFr.style.fontWeight = locale === "fr" ? "700" : "400";
  }
}

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

async function loadQuestions(locale = currentLocale) {
  if (questionsCache[locale]) {
    return questionsCache[locale];
  }

  let response;
  try {
    const path = locale === "ar" ? "./questions.ar.json" : "./questions.json";
    response = await fetch(path, { cache: "no-store" });
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

  questionsCache[locale] = data;
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
    appTitle.textContent = LOCALES[currentLocale].pageTitle;
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
  timerLabel.textContent = LOCALES[currentLocale].timer(formatTime(remainingTime));
}

function updateStreakLabel() {
  streakLabel.textContent = LOCALES[currentLocale].streak(currentStreak);
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

function shuffleArray(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function shuffleQuestionChoices(question) {
  const correctChoice = question.choices[question.answerIndex];
  const shuffledChoices = shuffleArray(question.choices);

  return {
    ...question,
    choices: shuffledChoices,
    answerIndex: shuffledChoices.indexOf(correctChoice)
  };
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
  updateNextButtonLabel();
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
    li.textContent = LOCALES[currentLocale].noScores;
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
    saveStatusLabel.textContent = LOCALES[currentLocale].savedAlready;
    return;
  }

  const name = playerNameInput.value.trim() || "Anonyme";
  registerBestScore(name);
  hasSavedCurrentScore = true;
  saveStatusLabel.textContent = LOCALES[currentLocale].saved;
}

function renderQuestion() {
  const q = questions[currentIndex];
  selectedIndex = null;
  answered = false;
  nextBtn.disabled = true;

  progressLabel.textContent = LOCALES[currentLocale].progress(currentIndex + 1, questions.length);
  if (appTitle) {
    appTitle.textContent = LOCALES[currentLocale].progress(currentIndex + 1, questions.length);
  }
  scoreLabel.textContent = LOCALES[currentLocale].score(score);
  updateStreakLabel();
  renderQuestionStatuses();
  questionText.textContent = q.question;
  updateNextButtonLabel();

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

  scoreLabel.textContent = LOCALES[currentLocale].score(score);
  updateStreakLabel();
  answered = true;
}

function nextQuestion() {
  if (selectedIndex === null) return;

  if (!answered) {
    validateAnswer();
    updateNextButtonLabel();
    return;
  }

  currentIndex += 1;
  updateNextButtonLabel();

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
  finalScoreLabel.textContent = LOCALES[currentLocale].finalResult(score, questions.length);

  const level = getSelectedLevel();
  const targetStreak = getStreakTarget(level);
  if (bestStreak >= targetStreak) {
    victoryMessageLabel.textContent = LOCALES[currentLocale].victory(bestStreak, targetStreak);
  } else {
    victoryMessageLabel.textContent = LOCALES[currentLocale].defeat(bestStreak, targetStreak);
  }
}

function resetQuiz() {
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
  updateNextButtonLabel();
  showScreen(startScreen);
}

async function startQuiz() {
  statusLabel.textContent = LOCALES[currentLocale].loadingQuestions;

  try {
    allQuestions = await loadQuestions(currentLocale);

    const selectedLevel = getSelectedLevel();
    questions = shuffleArray(
      allQuestions.filter((q) => q.lv === selectedLevel).map((question) => shuffleQuestionChoices(question))
    );

    if (questions.length === 0) {
      throw new Error(LOCALES[currentLocale].noQuestionsAvailable);
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
    statusLabel.textContent = error instanceof Error ? error.message : LOCALES[currentLocale].unknownError;
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

// language toggle button
const langToggleBtn = document.getElementById("lang-toggle-btn");
langToggleBtn?.addEventListener("click", () => {
  const newLocale = currentLocale === "fr" ? "ar" : "fr";
  applyLocale(newLocale);
  questions = [];
  allQuestions = [];

  if (!startScreen.classList.contains("hidden")) {
    return;
  }

  clearQuestionTimer();
  currentIndex = 0;
  score = 0;
  currentStreak = 0;
  bestStreak = 0;
  selectedIndex = null;
  answered = false;
  questionStates = [];
  renderQuestionStatuses();
  updateNextButtonLabel();
  showScreen(startScreen);
});

// set initial locale
applyLocale(currentLocale);

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
