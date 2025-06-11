import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, query, where, getDoc, deleteDoc } from 'firebase/firestore';

// --- Ícones SVG ---
const CheckSquare = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>;
const Square = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>;
const ChevronLeft = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const ChevronRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;
const PlusCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>;
const Flame = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>;
const Target = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>;
const Trash2 = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const PlayCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>;
const Palette = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.477-1.122-.297-.287-.703-.465-1.17-.465-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2c0 .531.21 1.016.566 1.38.357.363.838.58 1.357.58 1.93 0 3.5-1.57 3.5-3.5S18.43 2 12 2z"></path></svg>;

// --- Configuração do Firebase ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Temas e Modelos de Dados ---
const themes = { 
    'Azul': { '--c-primary': '#3b82f6', '--c-secondary': '#14b8a6', isDark: true }, 
    'Rosa': { '--c-primary': '#ec4899', '--c-secondary': '#8b5cf6', isDark: true }, 
    'Verde': { '--c-primary': '#22c55e', '--c-secondary': '#0ea5e9', isDark: true }, 
    'Laranja': { '--c-primary': '#f97316', '--c-secondary': '#d946ef', isDark: true },
    'Amarelo': { '--c-primary': '#facc15', '--c-secondary': '#64748b', isDark: true },
    'Branco': { '--c-primary': '#2563eb', '--c-secondary': '#db2777', isDark: false }
};
const getInitialDailyData = () => ({ focus: '', actions: [], avoid: [], dayRating: 5, learned: '', gratefulFor: [] });
const getInitialGoalState = () => ({ title: '', description: '', status: 'in_progress' });
const ACTION_CATEGORIES = ['Trabalho', 'Estudo', 'Pessoal', 'Saúde'];
const POMODORO_DURATION = 25 * 60;

const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
    </div>
);

const parseTimeSpent = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return 0;
    let totalMinutes = 0;
    const hoursMatch = timeString.match(/(\d+)\s*h/i);
    const minutesMatch = timeString.match(/(\d+)\s*m/i);
    if (hoursMatch) totalMinutes += parseInt(hoursMatch[1], 10) * 60;
    if (minutesMatch) totalMinutes += parseInt(minutesMatch[1], 10);
    if (!hoursMatch && !minutesMatch && /^\d+$/.test(timeString.trim())) totalMinutes += parseInt(timeString.trim(), 10);
    return totalMinutes;
};


export default function App() {
    // --- Estados ---
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dailyData, setDailyData] = useState(getInitialDailyData());
    const [allEntries, setAllEntries] = useState([]);
    const [goals, setGoals] = useState([]);
    const [newGoal, setNewGoal] = useState(getInitialGoalState());
    const [userProfile, setUserProfile] = useState({ currentStreak: 0, theme: 'Azul' });
    const [view, setView] = useState('agenda');
    const [reportRange, setReportRange] = useState({ start: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showThemePicker, setShowThemePicker] = useState(false);
    const [timer, setTimer] = useState({ active: false, actionId: null, timeLeft: POMODORO_DURATION });

    const selectedDateString = useMemo(() => new Date(selectedDate.setHours(0,0,0,0)).toISOString().split('T')[0], [selectedDate]);
    
    // --- Autenticação Anônima ---
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                try {
                    if (typeof __initial_auth_token !== 'undefined') { 
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } else { 
                        await signInAnonymously(auth); 
                    }
                } catch (error) {
                    console.error("Erro na autenticação anônima:", error);
                }
            }
            setIsAuthReady(true);
        });
        return () => unsubscribeAuth();
    }, []);

    // --- Listeners do Firebase ---
    useEffect(() => {
        if (!isAuthReady || !userId) return;
        const base = `/artifacts/${appId}/public/data`;
        const unsubEntries = onSnapshot(query(collection(db, `${base}/dailyEntries`), where("userId", "==", userId)), s => setAllEntries(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubGoals = onSnapshot(query(collection(db, `${base}/goals`), where("userId", "==", userId)), s => setGoals(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubProfile = onSnapshot(doc(db, `${base}/userProfiles`, userId), d => { if (d.exists()) { setUserProfile(p => ({...p, ...d.data()})); } else { setDoc(doc(db, `${base}/userProfiles`, userId), { theme: 'Azul', currentStreak: 0 }); } });
        return () => { unsubEntries(); unsubGoals(); unsubProfile(); };
    }, [isAuthReady, userId, appId]);

    useEffect(() => {
        if (!isAuthReady || !userId) return;
        const unsubDoc = onSnapshot(doc(db, `/artifacts/${appId}/public/data/dailyEntries`, selectedDateString), d => {
            setDailyData(d.exists() && d.data().userId === userId ? { ...getInitialDailyData(), ...d.data() } : getInitialDailyData());
        });
        return () => unsubDoc();
    }, [isAuthReady, userId, selectedDateString, appId]);
    
    const saveData = useCallback(async (dataToSave) => {
        if (!userId) return;
        try {
            await setDoc(doc(db, `/artifacts/${appId}/public/data/dailyEntries/${selectedDateString}`), { ...dataToSave, userId: userId, date: selectedDateString }, { merge: true });
        } catch (error) { console.error("Error saving data:", error); }
    }, [userId, selectedDateString, appId]);

    const handleItemChange = useCallback((cat, idx, sub, val) => {
        setDailyData(prevData => {
            const newItems = [...(prevData[cat] || [])];
            newItems[idx] = { ...newItems[idx], [sub]: val };
            const newData = { ...prevData, [cat]: newItems };
            saveData(newData);
            return newData;
        });
    }, [saveData]);

    useEffect(() => {
        if (!timer.active || timer.timeLeft <= 0) {
            if (timer.active && timer.timeLeft <= 0) {
                new Notification("Pomodoro Concluído!", { body: "Bom trabalho! Faça uma pausa." });
                const actionIndex = dailyData.actions.findIndex(a => a.id === timer.actionId);
                if (actionIndex !== -1) {
                    const currentSpent = dailyData.actions[actionIndex].timeSpent || "0";
                    handleItemChange('actions', actionIndex, 'timeSpent', `${(parseTimeSpent(currentSpent) || 0) + 25}m`);
                }
                setTimer({ active: false, actionId: null, timeLeft: POMODORO_DURATION });
            }
            return;
        }
        const interval = setInterval(() => setTimer(t => ({ ...t, timeLeft: t.timeLeft - 1 })), 1000);
        return () => clearInterval(interval);
    }, [timer.active, timer.timeLeft, dailyData.actions, handleItemChange, timer.actionId]);


    // --- Handlers ---
    const handleInputChange = (field, value) => { const n = { ...dailyData, [field]: value }; setDailyData(n); saveData(n); };
    const handleAddItem = (cat) => { const newItem = cat === 'actions' ? { id: Date.now(), text: '', completed: false, timeScheduled: '', timeSpent: '', category: 'Pessoal', goalId: '' } : cat === 'avoid' ? { id: Date.now(), text: '', completed: false } : { id: Date.now(), text: '' }; handleInputChange(cat, [...(dailyData[cat] || []), newItem]); };
    const handleDeleteDay = async () => { await deleteDoc(doc(db, `/artifacts/${appId}/public/data/dailyEntries`, selectedDateString)); setShowDeleteModal(false); };
    const handleAddGoal = async (e) => { e.preventDefault(); if (!newGoal.title.trim() || !userId) return; await setDoc(doc(collection(db, `/artifacts/${appId}/public/data/goals`)), { ...newGoal, userId: userId }); setNewGoal(getInitialGoalState()); };
    const changeDate = (amount) => setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() + amount); return n; });
    const handleDateChange = (e) => { const date = new Date(e.target.value); const userTimezoneOffset = date.getTimezoneOffset() * 60000; setSelectedDate(new Date(date.getTime() + userTimezoneOffset)); };
    const handleChangeTheme = async (themeName) => { if (!userId) return; await setDoc(doc(db, `/artifacts/${appId}/public/data/userProfiles`, userId), { theme: themeName }, { merge: true }); setShowThemePicker(false); };

    // --- Componentes de UI Internos (Renderers) ---
    const isLightMode = themes[userProfile.theme]?.isDark === false;
    
    const renderDynamicList = (category, placeholder, showCheckbox = true) => ( <div> <div className="space-y-3"> {(dailyData[category] || []).map((item, index) => ( <div key={item.id} className="flex items-center space-x-3"> {showCheckbox && <button onClick={() => handleItemChange(category, index, 'completed', !item.completed)}>{item.completed ? <CheckSquare /> : <Square />}</button>} <input type="text" value={item.text} onChange={(e) => handleItemChange(category, index, 'text', e.target.value)} placeholder={placeholder} className="flex-grow p-2 rounded-md bg-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-[var(--c-primary)] outline-none transition" /> </div> ))} </div> <button onClick={() => handleAddItem(category)} className="mt-4 flex items-center space-x-2 text-[var(--c-secondary)] hover:opacity-80 transition"><PlusCircle /><span>Adicionar Item</span></button> </div> );
    const renderActions = () => ( <div> <div className="space-y-3"> {(dailyData.actions || []).map((item, index) => ( <div key={item.id} className="p-3 bg-black/5 dark:bg-gray-700/50 rounded-lg space-y-2"> <div className="flex items-center space-x-2"> <button onClick={() => handleItemChange('actions', index, 'completed', !item.completed)}>{item.completed ? <CheckSquare /> : <Square />}</button> <input type="text" value={item.text} onChange={(e) => handleItemChange('actions', index, 'text', e.target.value)} placeholder="Descreva a ação..." className={`flex-grow p-2 rounded-md bg-gray-200 dark:bg-gray-600 focus:ring-2 focus:ring-[var(--c-primary)] outline-none transition ${item.completed ? 'line-through text-gray-500' : ''}`} /> <button onClick={() => setTimer({ active: !timer.active, actionId: item.id, timeLeft: POMODORO_DURATION })} className={`p-2 rounded-full transition ${timer.active && timer.actionId === item.id ? 'bg-red-600' : 'bg-green-600 hover:bg-green-700'}`} title={timer.active ? "Parar Pomodoro" : "Iniciar Pomodoro"}><PlayCircle /></button> </div> {timer.active && timer.actionId === item.id && <div className="text-center font-bold text-2xl text-green-400">{`${Math.floor(timer.timeLeft / 60)}:${(timer.timeLeft % 60).toString().padStart(2, '0')}`}</div>} <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm"> <input type="time" value={item.timeScheduled} onChange={(e) => handleItemChange('actions', index, 'timeScheduled', e.target.value)} className="p-2 rounded-md bg-gray-200 dark:bg-gray-600 focus:ring-2 focus:ring-[var(--c-primary)] outline-none" /> <input type="text" value={item.timeSpent} onChange={(e) => handleItemChange('actions', index, 'timeSpent', e.target.value)} placeholder="Tempo Gasto (ex: 1h 30m)" className="p-2 rounded-md bg-gray-200 dark:bg-gray-600 focus:ring-2 focus:ring-[var(--c-primary)] outline-none" /> <input list="action-categories" value={item.category || ''} onChange={(e) => handleItemChange('actions', index, 'category', e.target.value)} placeholder="Categoria" className="p-2 rounded-md bg-gray-200 dark:bg-gray-600 focus:ring-2 focus:ring-[var(--c-primary)] outline-none" /> </div> <select value={item.goalId || ''} onChange={(e) => handleItemChange('actions', index, 'goalId', e.target.value)} className="w-full p-2 mt-2 rounded-md bg-gray-200 dark:bg-gray-600 focus:ring-2 focus:ring-[var(--c-primary)] outline-none"><option value="">Vincular a uma meta...</option>{goals.filter(g => g.status === 'in_progress').map(goal => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select> </div> ))} </div> <button onClick={() => handleAddItem('actions')} className="mt-4 flex items-center space-x-2 text-[var(--c-secondary)] hover:opacity-80 transition"><PlusCircle /><span>Adicionar Ação</span></button> <datalist id="action-categories">{ACTION_CATEGORIES.map(cat => <option key={cat} value={cat} />)}</datalist> </div> );
    const renderGoalsView = () => ( <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg"> <h2 className="text-3xl font-bold mb-6 text-[var(--c-secondary)]">Minhas Metas</h2> <form onSubmit={handleAddGoal} className="mb-8 p-4 bg-black/5 dark:bg-gray-700/50 rounded-lg space-y-3"> <input type="text" value={newGoal.title} onChange={e => setNewGoal({...newGoal, title: e.target.value})} placeholder="Título da Meta" className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[var(--c-secondary)]"/> <textarea value={newGoal.description} onChange={e => setNewGoal({...newGoal, description: e.target.value})} placeholder="Descrição..." className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[var(--c-secondary)]" rows="3"></textarea> <button type="submit" className="px-4 py-2 bg-[var(--c-secondary)] text-white hover:opacity-80 rounded-lg font-semibold transition">Adicionar Nova Meta</button> </form> <div className="space-y-4"> {goals.map(goal => ( <div key={goal.id} className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"> <h3 className="font-bold text-xl text-gray-800 dark:text-gray-200">{goal.title}</h3> <p className="text-gray-600 dark:text-gray-300 mt-1">{goal.description}</p> <p className={`text-sm mt-2 font-bold ${goal.status === 'in_progress' ? 'text-yellow-500' : 'text-green-500'}`}>Status: {goal.status === 'in_progress' ? 'Em Progresso' : 'Concluída'}</p> </div> ))} </div> </div> );
    const renderDashboard = () => { const reportEntries = allEntries.filter(entry => entry.id >= reportRange.start && entry.id <= reportRange.end); const categoryData = reportEntries.flatMap(e => e.actions || []).reduce((acc, action) => { const cat = action.category || 'Outros'; acc[cat] = (acc[cat] || 0) + 1; return acc; }, {}); const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value })); const timeData = reportEntries.flatMap(e => e.actions || []).reduce((acc, action) => { const category = action.category || 'Outros'; const time = parseTimeSpent(action.timeSpent); if(time > 0) acc[category] = (acc[category] || 0) + time; return acc; }, {}); const timeChartData = Object.entries(timeData).map(([name, value]) => ({name, "Minutos": value})); const summary = { totalDays: reportEntries.length, avgRating: (reportEntries.length > 0 ? (reportEntries.reduce((s, e) => s + e.dayRating, 0) / reportEntries.length) : 0).toFixed(1), totalActions: reportEntries.reduce((s, e) => s + (e.actions?.length || 0), 0), completedActions: reportEntries.reduce((s, e) => s + (e.actions?.filter(a => a.completed).length || 0), 0) }; const tooltipStyle = isLightMode ? { backgroundColor: '#ffffff', border: '1px solid #cccccc', color: '#000000' } : { backgroundColor: '#2D3748', border: 'none', color: '#ffffff' }; return ( <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg"> <h2 className="text-3xl font-bold mb-2 text-indigo-500">Dashboard</h2> <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"> <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Relatório por Período</h3> <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-black/5 dark:bg-gray-700/50 rounded-lg"> <label>De: <input type="date" value={reportRange.start} onChange={e => setReportRange({...reportRange, start: e.target.value})} className="bg-gray-200 dark:bg-gray-600 p-2 rounded-md"/></label> <label>Até: <input type="date" value={reportRange.end} onChange={e => setReportRange({...reportRange, end: e.target.value})} className="bg-gray-200 dark:bg-gray-600 p-2 rounded-md"/></label> </div> <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-center"> <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"><p className="text-sm text-gray-500 dark:text-gray-400">Dias Registrados</p><p className="text-2xl font-bold">{summary.totalDays}</p></div> <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"><p className="text-sm text-gray-500 dark:text-gray-400">Média de Avaliação</p><p className="text-2xl font-bold">{summary.avgRating}</p></div> <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"><p className="text-sm text-gray-500 dark:text-gray-400">Total de Ações</p><p className="text-2xl font-bold">{summary.totalActions}</p></div> <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"><p className="text-sm text-gray-500 dark:text-gray-400">Ações Concluídas</p><p className="text-2xl font-bold">{summary.completedActions}</p></div> </div> <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"><div><h4 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Ações por Categoria</h4><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="var(--c-primary)" label>{pieData.map((e, i) => <Cell key={`cell-${i}`} fill={Object.values(themes)[i % Object.keys(themes).length]['--c-primary']} />)}</Pie><Tooltip contentStyle={tooltipStyle} /><Legend /></PieChart></ResponsiveContainer></div><div><h4 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Tempo Gasto por Categoria (min)</h4><ResponsiveContainer width="100%" height={300}><BarChart data={timeChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip contentStyle={tooltipStyle} /><Legend /><Bar dataKey="Minutos" fill="var(--c-secondary)" /></BarChart></ResponsiveContainer></div></div><div className="mt-8"><h4 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Avaliação Diária no Período</h4><ResponsiveContainer width="100%" height={300}><LineChart data={reportEntries.sort((a,b) => new Date(a.id) - new Date(b.id))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="id" /><YAxis domain={[0, 10]}/><Tooltip contentStyle={tooltipStyle} /><Legend /><Line type="monotone" dataKey="dayRating" name="Avaliação" stroke="var(--c-primary)" strokeWidth={2} /></LineChart></ResponsiveContainer></div></div> </div> ); };
    
    // --- Renderização Principal ---
    if (!isAuthReady) {
        return <LoadingSpinner />;
    }
    
    const currentTheme = themes[userProfile.theme] || themes['Azul'];
    
    return (
        <div style={currentTheme} className={currentTheme.isDark ? 'dark' : ''}>
            <div className="bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white">
                <div className="flex flex-col min-h-screen font-sans">
                    <main className="flex-grow">
                        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                            <header className="flex flex-wrap justify-between items-center gap-4 mb-6">
                                <div>
                                    <h1 className="text-4xl font-extrabold">Momentum <span className="text-[var(--c-primary)]">▲</span></h1>
                                    <div className="flex items-center mt-2 space-x-2 relative">
                                       <button onClick={() => changeDate(-1)} className="p-1 rounded-full bg-black/10 dark:bg-gray-700 hover:bg-black/20 dark:hover:bg-gray-600 transition"><ChevronLeft /></button>
                                       <input type="date" value={selectedDateString} onChange={handleDateChange} className="bg-transparent text-lg font-semibold text-center border-none outline-none appearance-none cursor-pointer" style={{colorScheme: currentTheme.isDark ? 'dark' : 'light'}}/>
                                       <button onClick={() => changeDate(1)} className="p-1 rounded-full bg-black/10 dark:bg-gray-700 hover:bg-black/20 dark:hover:bg-gray-600 transition"><ChevronRight /></button>
                                       <button onClick={() => setShowDeleteModal(true)} className="p-1.5 rounded-full bg-red-800 hover:bg-red-700 transition text-white" title="Limpar dia"><Trash2 /></button>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 sm:space-x-4">
                                    <div className="flex items-center space-x-2 p-2 bg-black/5 dark:bg-gray-700/50 rounded-lg"><Flame className="text-orange-400" /><span className="font-bold text-lg">{userProfile.currentStreak || 0}</span><span className="text-sm text-gray-500">dias</span></div>
                                    <div className="relative"> <button onClick={() => setShowThemePicker(!showThemePicker)} className="p-2 rounded-full bg-black/10 dark:bg-gray-700 hover:bg-black/20 dark:hover:bg-gray-600 transition" title="Mudar Tema"><Palette /></button> {showThemePicker && <div className="absolute top-full right-0 mt-2 p-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg flex gap-2 z-10"> {Object.entries(themes).map(([name, colors]) => ( <button key={name} onClick={() => handleChangeTheme(name)} className={`w-8 h-8 rounded-full border-2 ${userProfile.theme === name ? 'border-[var(--c-primary)]' : 'border-transparent'}`} style={{backgroundColor: colors['--c-primary']}} title={name}></button> ))} </div>} </div>
                                </div>
                            </header>
                            <nav className="mb-6 flex justify-center gap-2">
                                <button onClick={() => setView('agenda')} className={`font-bold py-2 px-6 rounded-lg transition ${view === 'agenda' ? 'bg-[var(--c-primary)] text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Agenda</button>
                                <button onClick={() => setView('goals')} className={`font-bold py-2 px-6 rounded-lg transition flex items-center gap-2 ${view === 'goals' ? 'bg-[var(--c-secondary)] text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}><Target /> Metas</button>
                                <button onClick={() => setView('dashboard')} className={`font-bold py-2 px-6 rounded-lg transition ${view === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Dashboard</button>
                            </nav>
                            
                            <div>
                                {view === 'agenda' && <main className="grid grid-cols-1 lg:grid-cols-2 gap-8"><div className="space-y-6"><div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg"><h2 className="text-xl font-bold mb-4 text-[var(--c-primary)]">Foco do dia:</h2><input type="text" value={dailyData.focus} onChange={(e) => handleInputChange('focus', e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-md focus:ring-2 focus:ring-[var(--c-primary)] outline-none" placeholder="Qual é a sua principal meta para hoje?"/></div><div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg"><h2 className="text-xl font-bold mb-4 text-[var(--c-primary)]">Ações:</h2>{renderActions()}</div><div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg"><h2 className="text-xl font-bold mb-4 text-[var(--c-primary)]">Para evitar no dia:</h2>{renderDynamicList('avoid', 'O que você deve evitar hoje?')}</div></div><div className="space-y-6"><div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg"><h2 className="text-xl font-bold mb-4 text-[var(--c-primary)]">Como foi o meu dia (de 0 a 10)</h2><div className="flex items-center space-x-4"><span className="text-2xl font-bold text-[var(--c-primary)]">{dailyData.dayRating}</span><input type="range" min="0" max="10" value={dailyData.dayRating} onChange={(e) => handleInputChange('dayRating', parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--c-primary)]"/></div></div><div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg"><h2 className="text-xl font-bold mb-4 text-[var(--c-primary)]">O que eu aprendi hoje:</h2><textarea value={dailyData.learned} onChange={(e) => handleInputChange('learned', e.target.value)} rows="5" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-md focus:ring-2 focus:ring-[var(--c-primary)] outline-none" placeholder="Descreva seus aprendizados..."></textarea></div><div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg"><h2 className="text-xl font-bold mb-4 text-[var(--c-primary)]">Hoje eu sou grato(a) por:</h2>{renderDynamicList('gratefulFor', 'Sou grato(a) por...', false)}</div></div></main>}
                                {view === 'goals' && renderGoalsView()}
                                {view === 'dashboard' && renderDashboard()}
                            </div>
                        </div>
                    </main>
                    <footer className="text-center py-4 text-gray-500 text-sm bg-black/5 dark:bg-gray-900/50">
                        <p>Desenvolvido por Duiany Fabrício Corcino Marques</p>
                    </footer>
                     {showDeleteModal && (
                         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-center">
                                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Confirmar Exclusão</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">Você tem certeza que deseja apagar todos os dados para o dia {selectedDate.toLocaleDateString('pt-BR')}? Esta ação não pode ser desfeita.</p>
                                <div className="flex justify-center gap-4">
                                    <button onClick={() => setShowDeleteModal(false)} className="px-6 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 transition">Cancelar</button>
                                    <button onClick={handleDeleteDay} className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-500 transition font-bold text-white">Apagar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
