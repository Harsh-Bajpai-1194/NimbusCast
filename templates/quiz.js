// -------------------------------
// Weather Quiz Logic
// -------------------------------

const startScreen = document.querySelector(".start");
const quizScreen = document.querySelector(".quiz");
const scoreScreen = document.querySelector(".score");

const questionText = document.querySelector(".question");
const optionsBox = document.querySelector(".options");
const progressBar = document.querySelector(".bar");
const questionMeta = document.querySelector(".chip");
const explainText = document.querySelector(".explain");
const nextBtn = document.querySelector(".next-btn");
const scoreText = document.querySelector(".score h2");

let currentQuestion = 0;
let score = 0;
let totalQuestions = 5;
let quizData = [];

// Quiz questions
const quizQuestions = [
  {
    question: "What does AQI stand for?",
    options: ["Air Quality Index", "Atmosphere Quantity Indicator", "Air Quality Input", "Air Quick Info"],
    answer: 0,
    explanation: "AQI stands for Air Quality Index, which measures pollution levels."
  },
  {
    question: "Which gas is the primary contributor to global warming?",
    options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
    answer: 1,
    explanation: "Carbon Dioxide is the major greenhouse gas responsible for global warming."
  },
  {
    question: "Which layer of the atmosphere contains the ozone layer?",
    options: ["Troposphere", "Stratosphere", "Mesosphere", "Thermosphere"],
    answer: 1,
    explanation: "The ozone layer is found in the Stratosphere, protecting us from UV rays."
  },
  {
    question: "Which weather instrument measures air pressure?",
    options: ["Thermometer", "Hygrometer", "Barometer", "Anemometer"],
    answer: 2,
    explanation: "A Barometer is used to measure air pressure."
  },
  {
    question: "Which natural phenomenon is measured on the Richter scale?",
    options: ["Tornado", "Earthquake", "Volcano", "Cyclone"],
    answer: 1,
    explanation: "The Richter scale is used to measure the magnitude of earthquakes."
  }
];

// -------------------------------
// Functions
// -------------------------------

function startQuiz() {
  startScreen.hidden = true;
  quizScreen.hidden = false;
  currentQuestion = 0;
  score = 0;
  quizData = shuffleArray([...quizQuestions]).slice(0, totalQuestions);
  loadQuestion();
}

function loadQuestion() {
  resetState();

  let q = quizData[currentQuestion];
  questionText.textContent = q.question;
  questionMeta.textContent = `Question ${currentQuestion + 1} of ${totalQuestions}`;

  q.options.forEach((option, index) => {
    let btn = document.createElement("button");
    btn.classList.add("option");
    btn.textContent = option;
    btn.onclick = () => selectOption(btn, index);
    optionsBox.appendChild(btn);
  });

  progressBar.style.width = `${((currentQuestion) / totalQuestions) * 100}%`;
}

function resetState() {
  optionsBox.innerHTML = "";
  explainText.textContent = "";
  nextBtn.hidden = true;
}

function selectOption(button, index) {
  let q = quizData[currentQuestion];
  let options = optionsBox.querySelectorAll(".option");

  options.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answer) {
      btn.classList.add("correct");
    }
    if (i === index && index !== q.answer) {
      btn.classList.add("wrong");
    }
  });

  if (index === q.answer) {
    score++;
  }

  explainText.textContent = q.explanation;
  nextBtn.hidden = false;
}

function nextQuestion() {
  currentQuestion++;
  if (currentQuestion < totalQuestions) {
    loadQuestion();
  } else {
    showScore();
  }
}

function showScore() {
  quizScreen.hidden = true;
  scoreScreen.hidden = false;
  scoreText.textContent = `You scored ${score} out of ${totalQuestions}`;
}

function restartQuiz() {
  scoreScreen.hidden = true;
  startScreen.hidden = false;
}

// Utility: Shuffle options/questions
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

// -------------------------------
// Event Listeners
// -------------------------------
document.querySelector(".start-btn")?.addEventListener("click", startQuiz);
nextBtn?.addEventListener("click", nextQuestion);
document.querySelector(".restart-btn")?.addEventListener("click", restartQuiz);
