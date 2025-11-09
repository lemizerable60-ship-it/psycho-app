// ============ DATA LAYER ============

class Storage {
  static get(key, defaultValue = []) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }
}

class DB {
  static getClients() {
    return Storage.get('clients', []);
  }

  static saveClients(clients) {
    Storage.set('clients', clients);
  }

  static addClient(client) {
    const clients = this.getClients();
    clients.push(client);
    this.saveClients(clients);
  }

  static getResults() {
    return Storage.get('results', []);
  }

  static saveResults(results) {
    Storage.set('results', results);
  }

  static addResult(result) {
    const results = this.getResults();
    results.push(result);
    this.saveResults(results);
  }

  static getClientResults(clientId) {
    return this.getResults().filter(r => r.clientId === clientId);
  }

  static getClient(id) {
    return this.getClients().find(c => c.id === id);
  }

  static getResult(id) {
    return this.getResults().find(r => r.id === id);
  }
}

// ============ TESTS CONFIGURATION ============

const TESTS = {
  mmse: {
    id: 'mmse',
    name: 'MMSE',
    description: 'Краткая шкала оценки психического статуса',
    questions: [
      {
        question: 'Какой сейчас год?',
        options: [
          { text: 'Правильный ответ', score: 1 },
          { text: 'Неправильный ответ', score: 0 }
        ]
      },
      {
        question: 'Какое сейчас время года?',
        options: [
          { text: 'Правильный ответ', score: 1 },
          { text: 'Неправильный ответ', score: 0 }
        ]
      },
      {
        question: 'Какое сегодня число?',
        options: [
          { text: 'Правильный ответ', score: 1 },
          { text: 'Неправильный ответ', score: 0 }
        ]
      },
      {
        question: 'Какой сегодня день недели?',
        options: [
          { text: 'Правильный ответ', score: 1 },
          { text: 'Неправильный ответ', score: 0 }
        ]
      },
      {
        question: 'Какой сейчас месяц?',
        options: [
          { text: 'Правильный ответ', score: 1 },
          { text: 'Неправильный ответ', score: 0 }
        ]
      }
    ],
    interpret: (score) => {
      if (score >= 28) return 'Норма (28-30 баллов): Когнитивные функции в пределах нормы';
      if (score >= 24) return 'Преддементные когнитивные нарушения (24-27 баллов)';
      if (score >= 20) return 'Деменция легкой степени (20-23 балла)';
      if (score >= 11) return 'Деменция умеренной степени (11-19 баллов)';
      return 'Тяжелая деменция (0-10 баллов)';
    }
  },
  hads: {
    id: 'hads',
    name: 'HADS',
    description: 'Госпитальная шкала тревоги и депрессии',
    questions: [
      {
        question: 'Я испытываю напряжение, мне не по себе',
        options: [
          { text: 'Все время', score: 3 },
          { text: 'Часто', score: 2 },
          { text: 'Иногда', score: 1 },
          { text: 'Совсем не испытываю', score: 0 }
        ]
      },
      {
        question: 'То, что приносило мне удовольствие, и сейчас вызывает то же чувство',
        options: [
          { text: 'Определенно это так', score: 0 },
          { text: 'Наверное, это так', score: 1 },
          { text: 'Лишь в очень малой степени', score: 2 },
          { text: 'Это совсем не так', score: 3 }
        ]
      },
      {
        question: 'Я испытываю страх, кажется, будто что-то ужасное может вот-вот случиться',
        options: [
          { text: 'Определенно это так, и страх очень сильный', score: 3 },
          { text: 'Да, это так, но страх не очень сильный', score: 2 },
          { text: 'Иногда, но это меня не беспокоит', score: 1 },
          { text: 'Совсем не испытываю', score: 0 }
        ]
      },
      {
        question: 'Я способен рассмеяться и увидеть в том или ином событии смешное',
        options: [
          { text: 'Определенно это так', score: 0 },
          { text: 'Наверное, это так', score: 1 },
          { text: 'Лишь в очень малой степени', score: 2 },
          { text: 'Совсем не способен', score: 3 }
        ]
      },
      {
        question: 'Беспокойные мысли крутятся у меня в голове',
        options: [
          { text: 'Постоянно', score: 3 },
          { text: 'Большую часть времени', score: 2 },
          { text: 'Время от времени', score: 1 },
          { text: 'Только иногда', score: 0 }
        ]
      }
    ],
    interpret: (score) => {
      if (score <= 7) return 'Норма (0-7 баллов): Отсутствие достоверно выраженных симптомов тревоги и депрессии';
      if (score <= 10) return 'Субклинически выраженная тревога/депрессия (8-10 баллов)';
      return 'Клинически выраженная тревога/депрессия (11+ баллов)';
    }
  },
  zung: {
    id: 'zung',
    name: 'Шкала Цунга',
    description: 'Шкала самооценки депрессии',
    questions: [
      {
        question: 'Я чувствую подавленность',
        options: [
          { text: 'Никогда или изредка', score: 1 },
          { text: 'Иногда', score: 2 },
          { text: 'Часто', score: 3 },
          { text: 'Почти всегда или постоянно', score: 4 }
        ]
      },
      {
        question: 'Утром я чувствую себя лучше всего',
        options: [
          { text: 'Почти всегда или постоянно', score: 1 },
          { text: 'Часто', score: 2 },
          { text: 'Иногда', score: 3 },
          { text: 'Никогда или изредка', score: 4 }
        ]
      },
      {
        question: 'У меня бывают периоды плача или близости к слезам',
        options: [
          { text: 'Никогда или изредка', score: 1 },
          { text: 'Иногда', score: 2 },
          { text: 'Часто', score: 3 },
          { text: 'Почти всегда или постоянно', score: 4 }
        ]
      },
      {
        question: 'У меня плохой ночной сон',
        options: [
          { text: 'Никогда или изредка', score: 1 },
          { text: 'Иногда', score: 2 },
          { text: 'Часто', score: 3 },
          { text: 'Почти всегда или постоянно', score: 4 }
        ]
      },
      {
        question: 'Я ем столько же, сколько и раньше',
        options: [
          { text: 'Почти всегда или постоянно', score: 1 },
          { text: 'Часто', score: 2 },
          { text: 'Иногда', score: 3 },
          { text: 'Никогда или изредка', score: 4 }
        ]
      }
    ],
    interpret: (score) => {
      const index = Math.round((score / 80) * 100);
      if (index < 50) return `Нормальное состояние (индекс ${index})`;
      if (index < 60) return `Легкая депрессия (индекс ${index})`;
      if (index < 70) return `Умеренная депрессия (индекс ${index})`;
      return `Тяжелая депрессия (индекс ${index})`;
    }
  }
};

// ============ ROUTER ============

class Router {
  static currentScreen = null;
  static params = {};

  static navigate(screen, params = {}) {
    this.currentScreen = screen;
    this.params = params;
    this.render();
  }

  static render() {
    const app = document.getElementById('app');
    
    switch (this.currentScreen) {
      case 'home':
        app.innerHTML = HomeScreen();
        break;
      case 'clients':
        app.innerHTML = ClientsScreen();
        break;
      case 'addClient':
        app.innerHTML = AddClientScreen();
        setTimeout(() => this.attachAddClientListeners(), 0);
        break;
      case 'selectClient':
        app.innerHTML = SelectClientScreen();
        break;
      case 'selectTest':
        app.innerHTML = SelectTestScreen();
        break;
      case 'runTest':
        app.innerHTML = RunTestScreen();
        setTimeout(() => this.attachTestListeners(), 0);
        break;
      case 'results':
        app.innerHTML = ResultsScreen();
        break;
      case 'viewResult':
        app.innerHTML = ViewResultScreen();
        break;
      case 'createReport':
        app.innerHTML = CreateReportScreen();
        setTimeout(() => this.attachReportListeners(), 0);
        break;
      default:
        app.innerHTML = HomeScreen();
    }
  }

  static attachAddClientListeners() {
    const form = document.getElementById('addClientForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('clientName').value;
        const birthDate = document.getElementById('clientBirthDate').value;
        
        DB.addClient({
          id: Date.now().toString(),
          name,
          birthDate,
          addedDate: new Date().toISOString()
        });
        
        Router.navigate('clients');
      });
    }
  }

  static testState = {
    currentQuestion: 0,
    answers: []
  };

  static attachTestListeners() {
    const test = TESTS[this.params.testId];
    const options = document.querySelectorAll('.answer-option');
    
    options.forEach(option => {
      option.addEventListener('click', () => {
        const score = parseInt(option.dataset.score);
        this.testState.answers.push(score);

        if (this.testState.currentQuestion < test.questions.length - 1) {
          this.testState.currentQuestion++;
          setTimeout(() => this.render(), 300);
        } else {
          // Finish test
          const totalScore = this.testState.answers.reduce((a, b) => a + b, 0);
          DB.addResult({
            id: Date.now().toString(),
            clientId: this.params.clientId,
            testId: this.params.testId,
            date: new Date().toISOString(),
            score: totalScore,
            answers: [...this.testState.answers],
            interpretation: test.interpret(totalScore)
          });
          
          this.testState = { currentQuestion: 0, answers: [] };
          Router.navigate('results', { clientId: this.params.clientId });
        }
      });
    });

    // Back button
    const backBtn = document.getElementById('testBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (this.testState.currentQuestion > 0) {
          this.testState.currentQuestion--;
          this.testState.answers.pop();
          this.render();
        } else {
          this.testState = { currentQuestion: 0, answers: [] };
          Router.navigate('selectTest', { clientId: this.params.clientId });
        }
      });
    }
  }

  static attachReportListeners() {
    const form = document.getElementById('reportForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const checkboxes = document.querySelectorAll('input[name="resultIds"]:checked');
        const selectedIds = Array.from(checkboxes).map(cb => cb.value);
        
        if (selectedIds.length === 0) {
          alert('Выберите хотя бы один результат');
          return;
        }

        this.downloadReport(selectedIds);
      });
    }
  }

  static downloadReport(resultIds) {
    const client = DB.getClient(this.params.clientId);
    const results = resultIds.map(id => DB.getResult(id)).filter(Boolean);
    
    let report = `ПРОТОКОЛ ПСИХОЛОГИЧЕСКОГО ОБСЛЕДОВАНИЯ\n`;
    report += `${'='.repeat(60)}\n\n`;
    report += `Клиент: ${client.name}\n`;
    report += `Дата рождения: ${new Date(client.birthDate).toLocaleDateString('ru-RU')}\n`;
    report += `Дата обследования: ${new Date().toLocaleDateString('ru-RU')}\n\n`;
    report += `${'='.repeat(60)}\n\n`;

    results.forEach(result => {
      const test = TESTS[result.testId];
      report += `МЕТОДИКА: ${test.name}\n`;
      report += `${test.description}\n`;
      report += `Дата проведения: ${new Date(result.date).toLocaleString('ru-RU')}\n\n`;
      report += `Итоговый балл: ${result.score}\n\n`;
      report += `ИНТЕРПРЕТАЦИЯ:\n${result.interpretation}\n\n`;
      report += `${'='.repeat(60)}\n\n`;
    });

    // Download as TXT
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `protocol_${client.name}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    Router.navigate('results', { clientId: this.params.clientId });
  }
}

// ============ SCREENS ============

function HomeScreen() {
  return `
    <div class="card">
      <h2>Главное меню</h2>
      <button class="btn-primary" onclick="Router.navigate('selectClient', {action:'test'})">
        Провести тестирование
      </button>
      <button class="btn-success" onclick="Router.navigate('clients')">
        Управление клиентами
      </button>
      <button class="btn-outline" onclick="Router.navigate('selectClient', {action:'results'})">
        Просмотр результатов
      </button>
    </div>
  `;
}

function ClientsScreen() {
  const clients = DB.getClients();
  
  return `
    <div class="card">
      <h2>Список клиентов</h2>
      <button class="btn-primary" onclick="Router.navigate('addClient')">
        + Добавить клиента
      </button>
      ${clients.length === 0 ? `
        <div class="empty-state">
          Нет клиентов.<br>Добавьте первого клиента.
        </div>
      ` : clients.map(client => `
        <div class="list-item">
          <div>
            <strong>${client.name}</strong>
            <div class="list-item-info">
              ДР: ${new Date(client.birthDate).toLocaleDateString('ru-RU')}
            </div>
          </div>
        </div>
      `).join('')}
      <button class="btn-outline" onclick="Router.navigate('home')">
        ← Назад
      </button>
    </div>
  `;
}

function AddClientScreen() {
  return `
    <div class="card">
      <h2>Добавить клиента</h2>
      <form id="addClientForm">
        <label>ФИО</label>
        <input type="text" id="clientName" placeholder="Иванов Иван Иванович" required>
        
        <label>Дата рождения</label>
        <input type="date" id="clientBirthDate" required>
        
        <button type="submit" class="btn-primary">Сохранить</button>
        <button type="button" class="btn-outline" onclick="Router.navigate('clients')">
          Отмена
        </button>
      </form>
    </div>
  `;
}

function SelectClientScreen() {
  const clients = DB.getClients();
  const action = Router.params.action || 'test';
  
  return `
    <div class="card">
      <h2>Выберите клиента</h2>
      ${clients.length === 0 ? `
        <div class="empty-state">
          Нет клиентов.<br>Сначала добавьте клиента.
        </div>
        <button class="btn-primary" onclick="Router.navigate('addClient')">
          + Добавить клиента
        </button>
      ` : clients.map(client => `
        <div class="list-item" onclick="Router.navigate('${action === 'test' ? 'selectTest' : 'results'}', {clientId:'${client.id}'})">
          <div>
            <strong>${client.name}</strong>
            <div class="list-item-info">
              ДР: ${new Date(client.birthDate).toLocaleDateString('ru-RU')}
            </div>
          </div>
        </div>
      `).join('')}
      <button class="btn-outline" onclick="Router.navigate('home')">
        ← Назад
      </button>
    </div>
  `;
}

function SelectTestScreen() {
  return `
    <div class="card">
      <h2>Выберите методику</h2>
      ${Object.values(TESTS).map(test => `
        <div class="list-item" onclick="Router.navigate('runTest', {clientId:'${Router.params.clientId}', testId:'${test.id}'})">
          <div>
            <strong>${test.name}</strong>
            <div class="list-item-info">${test.description}</div>
          </div>
        </div>
      `).join('')}
      <button class="btn-outline" onclick="Router.navigate('selectClient', {action:'test'})">
        ← Назад
      </button>
    </div>
  `;
}

function RunTestScreen() {
  const test = TESTS[Router.params.testId];
  const q = Router.testState.currentQuestion;
  const question = test.questions[q];
  const progress = ((q + 1) / test.questions.length) * 100;

  return `
    <div class="card">
      <div class="question-screen">
        <div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
          <div class="question-number">
            Вопрос ${q + 1} из ${test.questions.length}
          </div>
        </div>

        <div>
          <div class="question-text">${question.question}</div>
          <div>
            ${question.options.map((opt, i) => `
              <div class="answer-option" data-score="${opt.score}">
                ${opt.text}
              </div>
            `).join('')}
          </div>
        </div>

        <div>
          <button class="btn-outline" id="testBackBtn">
            ← ${q > 0 ? 'Предыдущий вопрос' : 'Отменить тест'}
          </button>
        </div>
      </div>
    </div>
  `;
}

function ResultsScreen() {
  const client = DB.getClient(Router.params.clientId);
  const results = DB.getClientResults(Router.params.clientId);

  return `
    <div class="card">
      <h2>Результаты: ${client.name}</h2>
      
      ${results.length > 0 ? `
        <button class="btn-success" onclick="Router.navigate('createReport', {clientId:'${client.id}'})">
          📄 Создать сводный протокол
        </button>
      ` : ''}

      ${results.length === 0 ? `
        <div class="empty-state">
          Нет результатов тестирования
        </div>
      ` : results.map(result => {
        const test = TESTS[result.testId];
        return `
          <div class="result-card" onclick="Router.navigate('viewResult', {resultId:'${result.id}'})">
            <h3 style="font-size: var(--fs-xl); margin-bottom: 0.5rem">${test.name}</h3>
            <p style="opacity: 0.9">
              ${new Date(result.date).toLocaleString('ru-RU')}
            </p>
            <div class="result-score">Балл: ${result.score}</div>
            <div class="result-interpretation">${result.interpretation}</div>
          </div>
        `;
      }).join('')}
      
      <button class="btn-outline" onclick="Router.navigate('selectClient', {action:'results'})">
        ← Назад
      </button>
    </div>
  `;
}

function ViewResultScreen() {
  const result = DB.getResult(Router.params.resultId);
  const client = DB.getClient(result.clientId);
  const test = TESTS[result.testId];

  return `
    <div class="card">
      <h2>Результат теста</h2>
      <div style="margin-bottom: 2rem">
        <p style="margin-bottom: 0.5rem"><strong>Клиент:</strong> ${client.name}</p>
        <p style="margin-bottom: 0.5rem"><strong>Тест:</strong> ${test.name}</p>
        <p style="margin-bottom: 0.5rem"><strong>Дата:</strong> ${new Date(result.date).toLocaleString('ru-RU')}</p>
      </div>
      <div class="result-card">
        <div class="result-score">Итоговый балл: ${result.score}</div>
        <div class="result-interpretation">${result.interpretation}</div>
      </div>
      <button class="btn-outline" onclick="Router.navigate('results', {clientId:'${client.id}'})">
        ← Назад
      </button>
    </div>
  `;
}

function CreateReportScreen() {
  const client = DB.getClient(Router.params.clientId);
  const results = DB.getClientResults(Router.params.clientId);

  return `
    <div class="card">
      <h2>Создать протокол</h2>
      <p style="margin-bottom: 1.5rem; color: var(--text-light)">
        Выберите результаты для включения в протокол
      </p>
      
      <form id="reportForm">
        ${results.map(result => {
          const test = TESTS[result.testId];
          return `
            <div class="checkbox-item">
              <input type="checkbox" name="resultIds" value="${result.id}" id="res_${result.id}">
              <label for="res_${result.id}">
                <strong>${test.name}</strong>
                <div class="list-item-info">
                  ${new Date(result.date).toLocaleDateString('ru-RU')} • Балл: ${result.score}
                </div>
              </label>
            </div>
          `;
        }).join('')}
        
        <button type="submit" class="btn-success" style="margin-top: 1rem">
          📥 Скачать протокол (TXT)
        </button>
        <button type="button" class="btn-outline" onclick="Router.navigate('results', {clientId:'${client.id}'})">
          Отмена
        </button>
      </form>
    </div>
  `;
}

// ============ INIT APP ============

Router.navigate('home');
