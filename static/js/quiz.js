// 互动问答页面交互功能

let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let quizMode = '';
let timerInterval = null;
let timeRemaining = 0;

document.addEventListener('DOMContentLoaded', function() {
    // 初始化模式选择
    initModeSelection();
    
    // 初始化答题功能
    initQuizFunctions();
    
    // 初始化键盘导航
    initKeyboardNavigation();
});

// 初始化模式选择
function initModeSelection() {
    const modeButtons = document.querySelectorAll('.mode-btn');
    
    modeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const mode = this.getAttribute('data-mode');
            startQuiz(mode);
        });
    });
}

// 开始答题
async function startQuiz(mode) {
    quizMode = mode;
    
    try {
        // 显示加载状态
        showLoading();
        
        // 获取题目
        const response = await fetch('/api/get-questions');
        if (!response.ok) {
            throw new Error('获取题目失败');
        }
        
        const data = await response.json();
        currentQuestions = data.questions;
        
        if (currentQuestions.length === 0) {
            throw new Error('没有可用的题目');
        }
        
        // 初始化用户答案
        userAnswers = {};
        currentQuestionIndex = 0;
        
        // 隐藏模式选择，显示答题界面
        document.getElementById('mode-selector').style.display = 'none';
        document.getElementById('quiz-interface').style.display = 'block';
        
        // 更新题目信息
        updateQuestionInfo();
        
        // 显示第一题
        showQuestion(currentQuestionIndex);
        
        // 如果是考试模式，启动计时器
        if (mode === 'exam') {
            startTimer(15 * 60); // 15分钟
        }
        
    } catch (error) {
        console.error('开始答题失败:', error);
        showError('无法加载题目，请稍后重试');
    } finally {
        hideLoading();
    }
}

// 显示题目
function showQuestion(index) {
    if (index < 0 || index >= currentQuestions.length) {
        return;
    }
    
    const question = currentQuestions[index];
    const questionCard = document.getElementById('question-card');
    const optionsContainer = document.getElementById('options-container');
    
    // 更新问题文本
    document.getElementById('question-text').textContent = question.question;
    
    // 清空选项容器
    optionsContainer.innerHTML = '';
    
    // 添加选项
    const options = ['A', 'B', 'C', 'D'];
    options.forEach((option, i) => {
        if (question[`option_${option.toLowerCase()}`]) {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option-item';
            optionDiv.innerHTML = `
                <div class="option-letter">${option}</div>
                <div class="option-text">${question[`option_${option.toLowerCase()}`]}</div>
            `;
            
            // 添加点击事件
            optionDiv.addEventListener('click', function() {
                selectOption(option, index);
            });
            
            optionsContainer.appendChild(optionDiv);
        }
    });
    
    // 更新按钮状态
    updateButtonStates();
    
    // 如果用户已经回答过这道题，显示选择状态
    if (userAnswers[index] !== undefined) {
        const selectedOption = userAnswers[index];
        const optionItems = optionsContainer.querySelectorAll('.option-item');
        optionItems[options.indexOf(selectedOption)]?.classList.add('selected');
    }
}

// 选择选项
function selectOption(option, questionIndex) {
    userAnswers[questionIndex] = option;
    
    // 更新选项样式
    const optionItems = document.querySelectorAll('.option-item');
    optionItems.forEach(item => item.classList.remove('selected'));
    
    const selectedIndex = ['A', 'B', 'C', 'D'].indexOf(option);
    if (selectedIndex >= 0) {
        optionItems[selectedIndex]?.classList.add('selected');
    }
    
    // 如果是练习模式，立即显示答案
    if (quizMode === 'practice') {
        showAnswerFeedback(questionIndex);
    }
    
    // 更新按钮状态
    updateButtonStates();
}

// 显示答案反馈
function showAnswerFeedback(questionIndex) {
    const question = currentQuestions[questionIndex];
    const userAnswer = userAnswers[questionIndex];
    const isCorrect = userAnswer === question.correct_answer;
    
    const feedback = document.getElementById('answer-feedback');
    const feedbackTitle = document.getElementById('feedback-title');
    const feedbackMessage = document.getElementById('feedback-message');
    const correctAnswer = document.getElementById('correct-answer');
    const explanation = document.getElementById('explanation');
    
    if (isCorrect) {
        feedbackTitle.textContent = '回答正确！';
        feedbackTitle.style.color = '#2ed573';
        feedbackMessage.textContent = '恭喜您答对了！';
    } else {
        feedbackTitle.textContent = '回答错误';
        feedbackTitle.style.color = '#ff4757';
        feedbackMessage.textContent = '很遗憾，您的答案不正确。';
    }
    
    // 显示正确答案
    correctAnswer.style.display = 'block';
    document.getElementById('correct-option').textContent = 
        `${question.correct_answer}. ${question[`option_${question.correct_answer.toLowerCase()}`]}`;
    
    // 显示解析（如果有）
    if (question.explanation) {
        explanation.style.display = 'block';
        document.getElementById('explanation-text').textContent = question.explanation;
    } else {
        explanation.style.display = 'none';
    }
    
    feedback.style.display = 'block';
    
    // 更新选项样式
    const optionItems = document.querySelectorAll('.option-item');
    optionItems.forEach(item => {
        const optionLetter = item.querySelector('.option-letter').textContent;
        if (optionLetter === question.correct_answer) {
            item.classList.add('correct');
        } else if (optionLetter === userAnswer && !isCorrect) {
            item.classList.add('incorrect');
        }
    });
}

// 更新按钮状态
function updateButtonStates() {
    const prevBtn = document.getElementById('prev-question');
    const nextBtn = document.getElementById('next-question');
    const submitBtn = document.getElementById('submit-answer');
    const finishBtn = document.getElementById('finish-quiz');
    
    // 上一题按钮
    prevBtn.disabled = currentQuestionIndex === 0;
    
    // 下一题/提交按钮
    if (quizMode === 'practice') {
        submitBtn.style.display = 'none';
        nextBtn.style.display = 'inline-block';
        nextBtn.disabled = userAnswers[currentQuestionIndex] === undefined;
    } else {
        submitBtn.style.display = 'inline-block';
        nextBtn.style.display = 'none';
        submitBtn.disabled = userAnswers[currentQuestionIndex] === undefined;
    }
    
    // 完成按钮（最后一题且已回答）
    const isLastQuestion = currentQuestionIndex === currentQuestions.length - 1;
    const hasAnswered = userAnswers[currentQuestionIndex] !== undefined;
    
    if (isLastQuestion && hasAnswered) {
        finishBtn.style.display = 'inline-block';
        if (quizMode === 'practice') {
            nextBtn.style.display = 'none';
        } else {
            submitBtn.style.display = 'none';
        }
    } else {
        finishBtn.style.display = 'none';
    }
}

// 更新题目信息
function updateQuestionInfo() {
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    document.getElementById('total-questions').textContent = currentQuestions.length;
    
    // 更新正确计数
    const correctCount = Object.keys(userAnswers).reduce((count, index) => {
        const question = currentQuestions[index];
        return count + (userAnswers[index] === question.correct_answer ? 1 : 0);
    }, 0);
    
    document.getElementById('correct-count').textContent = correctCount;
}

// 下一题
function nextQuestion() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        showQuestion(currentQuestionIndex);
        updateQuestionInfo();
        
        // 隐藏反馈
        document.getElementById('answer-feedback').style.display = 'none';
    }
}

// 上一题
function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion(currentQuestionIndex);
        updateQuestionInfo();
        
        // 隐藏反馈
        document.getElementById('answer-feedback').style.display = 'none';
    }
}

// 提交答案（考试模式）
async function submitAnswer() {
    const question = currentQuestions[currentQuestionIndex];
    const userAnswer = userAnswers[currentQuestionIndex];
    
    try {
        const response = await fetch('/api/submit-answer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question_id: question.id,
                user_answer: userAnswer
            })
        });
        
        if (!response.ok) {
            throw new Error('提交答案失败');
        }
        
        const data = await response.json();
        
        // 显示反馈
        showAnswerFeedback(currentQuestionIndex);
        
        // 如果是最后一题，显示完成按钮
        updateButtonStates();
        
    } catch (error) {
        console.error('提交答案失败:', error);
        showError('提交答案失败，请稍后重试');
    }
}

// 完成答题
function finishQuiz() {
    // 停止计时器
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // 计算总分
    const totalScore = Object.keys(userAnswers).reduce((score, index) => {
        const question = currentQuestions[index];
        return score + (userAnswers[index] === question.correct_answer ? question.score : 0);
    }, 0);
    
    // 计算正确题数
    const correctCount = Object.keys(userAnswers).reduce((count, index) => {
        const question = currentQuestions[index];
        return count + (userAnswers[index] === question.correct_answer ? 1 : 0);
    }, 0);
    
    // 计算正确率
    const accuracy = Math.round((correctCount / currentQuestions.length) * 100);
    
    // 显示结果
    showResults(totalScore, correctCount, accuracy);
}

// 显示结果
function showResults(totalScore, correctCount, accuracy) {
    document.getElementById('quiz-interface').style.display = 'none';
    document.getElementById('quiz-results').style.display = 'block';
    
    document.getElementById('total-score').textContent = totalScore;
    document.getElementById('correct-answers').textContent = correctCount;
    document.getElementById('accuracy').textContent = `${accuracy}%`;
}

// 重新开始
function restartQuiz() {
    document.getElementById('quiz-results').style.display = 'none';
    document.getElementById('mode-selector').style.display = 'grid';
    
    // 重置状态
    currentQuestions = [];
    userAnswers = {};
    currentQuestionIndex = 0;
    
    // 停止计时器
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// 启动计时器
function startTimer(seconds) {
    timeRemaining = seconds;
    const timerContainer = document.getElementById('timer-container');
    const timer = document.getElementById('timer');
    
    timerContainer.style.display = 'flex';
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            finishQuiz();
        }
        
        // 最后1分钟闪烁提醒
        if (timeRemaining <= 60) {
            timer.classList.add('timer-warning');
        }
    }, 1000);
}

// 更新计时器显示
function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    document.getElementById('timer').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 初始化答题功能
function initQuizFunctions() {
    // 上一题按钮
    document.getElementById('prev-question').addEventListener('click', prevQuestion);
    
    // 下一题按钮
    document.getElementById('next-question').addEventListener('click', nextQuestion);
    
    // 提交答案按钮
    document.getElementById('submit-answer').addEventListener('click', submitAnswer);
    
    // 完成答题按钮
    document.getElementById('finish-quiz').addEventListener('click', finishQuiz);
    
    // 重新开始按钮
    document.getElementById('restart-quiz').addEventListener('click', restartQuiz);
    
    // 查看详情按钮
    document.getElementById('view-details').addEventListener('click', function() {
        // 这里可以跳转到答题详情页面
        alert('答题详情功能开发中...');
    });
}

// 初始化键盘导航
function initKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        // 数字键1-4选择选项
        if (e.key >= '1' && e.key <= '4') {
            const option = String.fromCharCode(64 + parseInt(e.key)); // 1->A, 2->B, etc.
            selectOption(option, currentQuestionIndex);
        }
        
        // 左右箭头切换题目
        if (e.key === 'ArrowLeft') {
            prevQuestion();
        } else if (e.key === 'ArrowRight' || e.key === ' ') {
            if (quizMode === 'practice') {
                nextQuestion();
            } else if (userAnswers[currentQuestionIndex] !== undefined) {
                submitAnswer();
            }
        }
        
        // Enter键提交/下一题
        if (e.key === 'Enter') {
            if (quizMode === 'exam' && userAnswers[currentQuestionIndex] !== undefined) {
                submitAnswer();
            } else if (quizMode === 'practice') {
                nextQuestion();
            }
        }
    });
}

// 显示加载状态
function showLoading() {
    // 可以在这里添加加载动画
}

// 隐藏加载状态
function hideLoading() {
    // 可以在这里移除加载动画
}

// 显示错误
function showError(message) {
    alert(message);
}

// 导出功能
window.restartQuiz = restartQuiz;
window.nextQuestion = nextQuestion;
window.prevQuestion = prevQuestion;
window.submitAnswer = submitAnswer;
window.finishQuiz = finishQuiz;
