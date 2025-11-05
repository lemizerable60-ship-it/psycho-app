import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---
type Screen = 'clientList' | 'clientForm' | 'clientDetail' | 'testSelection' | 'testRunner' | 'result';

type Client = {
  id: string;
  fullName: string;
  birthDate: string;
  notes: string;
};

type TestResult = {
  id: string;
  clientId: string;
  testId: string;
  testName: string;
  date: string;
  answers: number[];
  score: number;
  interpretation?: string;
};

type Question = {
  text: string;
  options: string[];
  scoring: 'direct' | 'reverse';
};

type Test = {
  id: string;
  name: string;
  description: string;
  questions: Question[];
  getScore: (answers: number[]) => { score: number; summary: string };
};


// --- DATABASE (LocalStorage) ---
const db = {
  getClients: (): Client[] => {
    try {
      const clientsData = localStorage.getItem('clients');
      return clientsData ? JSON.parse(clientsData) : [];
    } catch (e) {
      console.error("Ошибка чтения клиентов из localStorage:", e);
      return []; // Возвращаем пустой массив в случае ошибки
    }
  },
  saveClients: (clients: Client[]) => {
    try {
      localStorage.setItem('clients', JSON.stringify(clients));
    } catch (e) {
      console.error("Ошибка сохранения клиентов в localStorage:", e);
    }
  },
  getResults: (): TestResult[] => {
     try {
      const resultsData = localStorage.getItem('results');
      return resultsData ? JSON.parse(resultsData) : [];
    } catch (e) {
      console.error("Ошибка чтения результатов из localStorage:", e);
      return []; // Возвращаем пустой массив в случае ошибки
    }
  },
  saveResults: (results: TestResult[]) => {
    try {
        localStorage.setItem('results', JSON.stringify(results));
    } catch (e) {
        console.error("Ошибка сохранения результатов в localStorage:", e);
    }
  },
  getApiKey: (): string | null => {
    try {
        return localStorage.getItem('gemini_api_key');
    } catch(e) {
        console.error("Ошибка чтения API ключа из localStorage:", e);
        return null;
    }
  },
  saveApiKey: (key: string) => {
    try {
        localStorage.setItem('gemini_api_key', key);
    } catch (e) {
        console.error("Ошибка сохранения API ключа в localStorage:", e);
    }
  },
};


// --- TEST DEFINITIONS ---
const ZUNG_QUESTIONS = [
  'Я чувствую подавленность, грусть, тоску.',
  'Утром я чувствую себя лучше всего.',
  'У меня бывают периоды плача или позывы к плачу.',
  'У меня плохой ночной сон.',
  'Аппетит у меня не хуже, чем обычно.',
  'Мне приятно смотреть на привлекательных женщин/мужчин, разговаривать с ними.',
  'Я замечаю, что теряю вес.',
  'Меня беспокоят запоры.',
  'Мое сердце бьется быстрее, чем обычно.',
  'Я устаю без всякой причины.',
  'Мой ум ясен, как всегда.',
  'Мне легко делать то, что я умею.',
  'Чувство беспокойства утомляет меня, я не могу усидеть на месте.',
  'Я полон надежд на будущее.',
  'Я более раздражителен, чем обычно.',
  'Мне легко принимать решения.',
  'Я чувствую, что я полезен и нужен.',
  'Я живу достаточно полной жизнью.',
  'Я чувствую, что другим людям станет лучше, если я умру.',
  'Я все еще получаю удовольствие от того, что мне нравилось раньше.',
];

const TESTS: Test[] = [
  {
    id: 'mmse',
    name: 'MMSE (Краткая шкала оценки психического статуса)',
    description: 'Оценка когнитивных функций. Заполняется специалистом.',
    questions: [
      { text: 'Ориентация во времени (год, время года, дата, день, месяц)', options: ['0', '1', '2', '3', '4', '5'], scoring: 'direct' },
      { text: 'Ориентация в месте (страна, область, город, клиника, этаж)', options: ['0', '1', '2', '3', '4', '5'], scoring: 'direct' },
      { text: 'Восприятие (повторение 3 слов)', options: ['0', '1', '2', '3'], scoring: 'direct' },
      { text: 'Внимание и счет (серийный счет от 100 по 7)', options: ['0', '1', '2', '3', '4', '5'], scoring: 'direct' },
      { text: 'Память (припоминание 3 слов)', options: ['0', '1', '2', '3'], scoring: 'direct' },
      { text: 'Речь (называние предметов)', options: ['0', '1', '2'], scoring: 'direct' },
      { text: 'Речь (повторение фразы)', options: ['0', '1'], scoring: 'direct' },
      { text: 'Речь (выполнение 3-этапной команды)', options: ['0', '1', '2', '3'], scoring: 'direct' },
      { text: 'Речь (чтение и выполнение)', options: ['0', '1'], scoring: 'direct' },
      { text: 'Речь (письмо)', options: ['0', '1'], scoring: 'direct' },
      { text: 'Зрительно-пространственные навыки (копирование рисунка)', options: ['0', '1'], scoring: 'direct' },
    ],
    getScore: (answers) => {
      const score = answers.reduce((sum, val) => sum + (val || 0), 0);
      let summary = '';
      if (score >= 28) summary = 'Нет когнитивных нарушений.';
      else if (score >= 24) summary = 'Преддементные когнитивные нарушения.';
      else if (score >= 20) summary = 'Деменция легкой степени выраженности.';
      else if (score >= 11) summary = 'Деменция умеренной степени выраженности.';
      else summary = 'Тяжелая деменция.';
      return { score, summary };
    }
  },
  {
    id: 'zung',
    name: 'Шкала самооценки депрессии Цунга (Занга)',
    description: '20 вопросов для самооценки уровня депрессии.',
    questions: ZUNG_QUESTIONS.map((text, i) => {
        const reverseScoreIds = [2, 5, 6, 11, 12, 14, 16, 17, 18, 20];
        return {
            text,
            options: ['Никогда или редко', 'Иногда', 'Часто', 'Почти всегда или постоянно'],
            scoring: reverseScoreIds.includes(i + 1) ? 'reverse' : 'direct',
        };
    }),
    getScore: (answers) => {
        const score = answers.reduce((sum, val) => sum + (val || 1), 0);
        let summary = '';
        if (score < 50) summary = 'Состояние в пределах нормы.';
        else if (score <= 59) summary = 'Легкая депрессия.';
        else if (score <= 69) summary = 'Умеренная депрессия.';
        else summary = 'Тяжелая депрессия.';
        return { score, summary: `Индекс: ${score}. ${summary}` };
    }
  }
];

// --- COMPONENTS ---

const ApiKeyModal = ({ onSave }) => {
    const [key, setKey] = useState('');
    return (
        <div className="modal-overlay">
            <div className="card" style={{maxWidth: '500px'}}>
                <h2>Введите ваш Gemini API ключ</h2>
                <p>Для работы функции анализа результатов нужен ваш личный ключ API. Получить его можно в <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a>.</p>
                <p>Ключ будет сохранен локально в вашем браузере.</p>
                <input 
                    type="password" 
                    value={key} 
                    onChange={(e) => setKey(e.target.value)} 
                    placeholder="Ваш API ключ"
                />
                <button onClick={() => onSave(key)} disabled={!key.trim()} style={{marginTop: '10px'}}>Сохранить и продолжить</button>
            </div>
        </div>
    );
};

const ClientForm = ({ client, onSave, onCancel }) => {
  const [formData, setFormData] = useState(client || { fullName: '', birthDate: '', notes: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, id: client?.id || Date.now().toString() });
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>{client ? 'Редактировать клиента' : 'Новый клиент'}</h2>
      <label>
        ФИО
        <input name="fullName" value={formData.fullName} onChange={handleChange} required />
      </label>
      <label>
        Дата рождения
        <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} />
      </label>
      <label>
        Заметки
        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4}></textarea>
      </label>
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <button type="submit">Сохранить</button>
        <button type="button" className="text-button" onClick={onCancel}>Отмена</button>
      </div>
    </form>
  );
};

const ClientListScreen = ({ clients, onSelectClient, onAddClient }) => (
  <div>
    <div className="header">
      <h1>Клиенты</h1>
      <button onClick={onAddClient}>+ Добавить клиента</button>
    </div>
    <div className="card">
      {clients.length > 0 ? clients.map(client => (
        <div key={client.id} className="client-list-item" onClick={() => onSelectClient(client)}>
          <h3>{client.fullName}</h3>
          <p style={{ color: 'var(--secondary-text-color)', margin: 0 }}>{client.birthDate}</p>
        </div>
      )) : <p>Список клиентов пуст. Нажмите "+ Добавить клиента", чтобы начать.</p>}
    </div>
  </div>
);

const ClientDetailScreen = ({ client, results, onBack, onStartTest, onSelectResult }) => (
  <div>
    <div className="header">
        <button className="text-button" onClick={onBack}>&larr; К списку клиентов</button>
    </div>
    <div className="card">
      <h2>{client.fullName}</h2>
      <p><strong>Дата рождения:</strong> {client.birthDate}</p>
      <p><strong>Заметки:</strong> {client.notes || 'Нет'}</p>
    </div>
    <div className="card">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
        <h3>История диагностик</h3>
        <button className="secondary" onClick={onStartTest}>+ Новая диагностика</button>
      </div>
      {results.length > 0 ? results.map(result => (
        <div key={result.id} className="test-history-item" onClick={() => onSelectResult(result)}>
          <strong>{result.testName}</strong>
          <p style={{ color: 'var(--secondary-text-color)', margin: 0 }}>{new Date(result.date).toLocaleDateString()}</p>
        </div>
      )) : <p>Еще не было проведено ни одной диагностики.</p>}
    </div>
  </div>
);

const TestSelectionScreen = ({ onSelectTest, onBack }) => (
  <div>
    <div className="header">
        <button className="text-button" onClick={onBack}>&larr; Назад к клиенту</button>
    </div>
    <div className="card">
        <h2>Выберите методику</h2>
        {TESTS.map(test => (
            <div key={test.id} className="client-list-item" onClick={() => onSelectTest(test)}>
                <h3>{test.name}</h3>
                <p style={{ color: 'var(--secondary-text-color)', margin: 0 }}>{test.description}</p>
            </div>
        ))}
    </div>
  </div>
);

const TestRunnerScreen = ({ client, test, onFinish, onBack }) => {
    const [answers, setAnswers] = useState<(number|null)[]>(new Array(test.questions.length).fill(null));

    const handleAnswer = (qIndex, value) => {
        const newAnswers = [...answers];
        newAnswers[qIndex] = value;
        setAnswers(newAnswers);
    };

    const handleSubmit = () => {
        const { score } = test.getScore(answers as number[]);

        const result: Omit<TestResult, 'id' | 'interpretation'> = {
            clientId: client.id,
            testId: test.id,
            testName: test.name,
            date: new Date().toISOString(),
            answers: answers as number[],
            score,
        };
        onFinish(result);
    };

    return (
        <div>
            <div className="header">
                <button className="text-button" onClick={onBack}>&larr; Отмена</button>
            </div>
            <div className="card">
                <h2>{test.name}</h2>
                <p>Клиент: {client.fullName}</p>
                <hr style={{margin: '20px 0', border: 'none', borderBottom: '1px solid var(--divider-color)'}}/>
                {test.questions.map((q, i) => (
                    <div key={i} className="question-group">
                        <p><strong>{i + 1}. {q.text}</strong></p>
                        <div className="radio-group">
                            {q.options.map((opt, optIndex) => {
                                let value;
                                if (test.id === 'mmse') {
                                    value = parseInt(opt);
                                } else { // zung
                                    value = q.scoring === 'direct' ? optIndex + 1 : q.options.length - optIndex;
                                }

                                return (
                                    <label key={optIndex}>
                                        <input
                                            type="radio"
                                            name={`q-${i}`}
                                            checked={answers[i] === value}
                                            onChange={() => handleAnswer(i, value)}
                                        /> {opt}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}
                <button onClick={handleSubmit} disabled={answers.some(a => a === null)}>Завершить и рассчитать</button>
            </div>
        </div>
    );
};

const ResultScreen = ({ result: initialResult, onBack, onUpdateResult, client, apiKey }) => {
    const [result, setResult] = useState(initialResult);
    const [isLoading, setIsLoading] = useState(false);
    
    const test = TESTS.find(t => t.id === result.testId);
    const { summary } = test.getScore(result.answers);
    
     useEffect(() => {
         const generateInterpretation = async () => {
            if (result.interpretation || !apiKey) {
                if(!apiKey) console.warn("Gemini API key is missing.");
                return;
            }
            const ai = new GoogleGenAI({ apiKey });
            setIsLoading(true);
            let newInterpretation = 'Не удалось сгенерировать интерпретацию.';
             try {
                const prompt = `Ты - ассистент клинического психолога. Проанализируй результат психологического теста и дай краткое, структурированное резюме для записей специалиста.
 Тест: ${test.name}
 Клиент: ${client.fullName}
 Результат: ${result.score}
 Краткое заключение по шкале: ${summary}
Твоя задача - предоставить профессиональную интерпретацию этого результата.`;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });
                newInterpretation = response.text;
             } catch (error) {
                console.error("Gemini API error:", error);
                newInterpretation = `Ошибка при вызове Gemini API: ${error.message}`;
             }
            
            const updatedResult = { ...result, interpretation: newInterpretation };
            setResult(updatedResult);
            onUpdateResult(updatedResult); // Save to global state
            setIsLoading(false);
         };

        generateInterpretation();
     }, [result.id]); // Rerun only when a new result is displayed

     const handleExportTXT = () => {
        const test = TESTS.find(t => t.id === result.testId);
        
        let content = `ОТЧЕТ О ПСИХОЛОГИЧЕСКОЙ ДИАГНОСТИКЕ\n`;
        content += `=========================================\n\n`;
        content += `Клиент: ${client.fullName}\n`;
        content += `Тест: ${result.testName}\n`;
        content += `Дата: ${new Date(result.date).toLocaleString()}\n\n`;
        content += `--- РЕЗУЛЬТАТЫ ---\n`;
        content += `Итоговый балл: ${result.score}\n`;
        content += `Заключение по шкале: ${summary}\n\n`;
        content += `--- ИНТЕРПРЕТАЦИЯ (СГЕНЕРИРОВАНО ИИ) ---\n`;
        content += `${result.interpretation || 'Нет данных.'}\n\n`;
        content += `--- ДЕТАЛИЗИРОВАННЫЙ ПРОТОКОЛ ---\n`;

        test.questions.forEach((q, i) => {
            const answerScore = result.answers[i];
            content += `Вопрос ${i + 1}: ${q.text}\n`;
            content += `Ответ (балл): ${answerScore}\n\n`;
        });

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const date = new Date().toISOString().slice(0, 10);
        link.download = `Отчет_${client.fullName}_${date}.txt`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
     };

     return (
       <div>
         <div className="header">
          <button className="text-button" onClick={onBack}>&larr; Назад к клиенту</button>
          <button onClick={handleExportTXT} disabled={isLoading || !result.interpretation}>Экспорт в TXT</button>
         </div>
         <div className="card">
          <h2>Результаты: {result.testName}</h2>
          <p><strong>Клиент:</strong> {client.fullName}</p>
          <p><strong>Дата:</strong> {new Date(result.date).toLocaleString()}</p>
          <p><strong>Итоговый балл:</strong> {result.score}</p>
          <p><strong>Заключение по шкале:</strong> {summary}</p>
          <h3>Интерпретация (сгенерировано ИИ):</h3>
           <div className="interpretation">
             {isLoading 
             ? "Генерация интерпретации..." 
             : result.interpretation || (apiKey ? "Нет данных." : "API ключ не указан.")}
           </div>
         </div>
       </div>
     );
};


const App = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  
  const [screen, setScreen] = useState<Screen>('clientList');
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [activeResult, setActiveResult] = useState<TestResult | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

   useEffect(() => {
    const loadedClients = db.getClients();
    const loadedResults = db.getResults();
    const loadedApiKey = db.getApiKey();

    setClients(loadedClients);
    setResults(loadedResults);
    setApiKey(loadedApiKey);

    if (!loadedApiKey) {
      setShowKeyModal(true);
    }
    
    setIsInitialized(true);
  }, []);

   useEffect(() => {
     if (isInitialized) {
        db.saveClients(clients);
     }
   }, [clients, isInitialized]);

   useEffect(() => {
     if (isInitialized) {
        db.saveResults(results);
     }
   }, [results, isInitialized]);

   const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    db.saveApiKey(key);
    setShowKeyModal(false);
   };

   const handleSaveClient = (client) => {
    if (isEditing) {
      setClients(clients.map(c => c.id === client.id ? client : c));
    } else {
      setClients([...clients, client]);
    }
    setScreen('clientList');
    setIsEditing(false);
   };
   
   const handleFinishTest = (resultData) => {
    const newResult = { ...resultData, id: Date.now().toString() };
    setResults(prevResults => [...prevResults, newResult]);
    setActiveResult(newResult);
    setScreen('result');
   };
   
   const handleUpdateResult = (updatedResult) => {
    const newResults = results.map(r => r.id === updatedResult.id ? updatedResult : r);
    setResults(newResults);
   };
   
   const handleExportData = () => {
    const dataToExport = {
        clients: db.getClients(),
        results: db.getResults(),
    };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    link.download = `psychosuite_backup_${date}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

   const handleImportData = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const importedData = JSON.parse(e.target.result as string);
              if (Array.isArray(importedData.clients) && Array.isArray(importedData.results)) {
                  if (window.confirm("Вы уверены, что хотите импортировать данные? Это перезапишет все текущие данные!")) {
                      db.saveClients(importedData.clients);
                      db.saveResults(importedData.results);
                      setClients(importedData.clients);
                      setResults(importedData.results);
                      alert("Данные успешно импортированы!");
                      setScreen('clientList');
                  }
              } else {
                  throw new Error("Неверный формат файла.");
              }
          } catch (error) {
              alert(`Ошибка при импорте файла: ${error.message}`);
          } finally {
             event.target.value = null;
          }
      };
      reader.readAsText(file);
   };


   const renderScreen = () => {
     switch (screen) {
       case 'clientForm':
         return <ClientForm client={isEditing ? activeClient : null} onSave={handleSaveClient} onCancel={() => setScreen('clientList')} />;
       case 'clientDetail':
        return <ClientDetailScreen 
            client={activeClient}
            results={results.filter(r => r.clientId === activeClient.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
            onBack={() => setScreen('clientList')}
            onStartTest={() => setScreen('testSelection')}
            onSelectResult={(result) => { setActiveResult(result); setScreen('result'); }}
        />;
       case 'testSelection':
        return <TestSelectionScreen onSelectTest={(test) => { setActiveTest(test); setScreen('testRunner'); }} onBack={() => setScreen('clientDetail')}/>;
       case 'testRunner':
        return <TestRunnerScreen client={activeClient} test={activeTest} onFinish={handleFinishTest} onBack={() => setScreen('testSelection')}/>
       case 'result':
        return <ResultScreen result={activeResult} client={activeClient} onBack={() => setScreen('clientDetail')} onUpdateResult={handleUpdateResult} apiKey={apiKey} />
       case 'clientList':
       default:
        return <ClientListScreen
          clients={clients}
          onSelectClient={(client) => { setActiveClient(client); setScreen('clientDetail'); }}
          onAddClient={() => { setIsEditing(false); setActiveClient(null); setScreen('clientForm'); }}
        />;
     }
   };

   if (!isInitialized) {
     return <div className="card" style={{textAlign: 'center', padding: '40px'}}>Загрузка приложения...</div>;
   }

   if (showKeyModal) {
    return <ApiKeyModal onSave={handleSaveApiKey} />;
   }

   return (
     <div>
       {renderScreen()}
       <footer style={{textAlign: 'center', color: 'var(--secondary-text-color)', marginTop: '30px', padding: '10px'}}>
        <p><strong>Внимание!</strong> Все данные хранятся локально. Регулярно делайте резервные копии.</p>
         <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px'}}>
            <button className="secondary" onClick={handleExportData}>Экспорт данных</button>
            <button className="secondary" onClick={() => fileInputRef.current?.click()}>Импорт данных</button>
            <input type="file" ref={fileInputRef} onChange={handleImportData} style={{display: 'none'}} accept=".json"/>
         </div>
       </footer>
     </div>
   );
 };

 const container = document.getElementById('root');
 const root = createRoot(container);
 root.render(<App />);