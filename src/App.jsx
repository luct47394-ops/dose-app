import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Check, Activity, Droplet, Calendar, Info, BarChart2, X, Settings } from 'lucide-react';

/**
 * Dose
 * Minimalist Medication Tracker with Glassmorphism Design
 */

const getTodayString = () => new Date().toISOString().split('T')[0];

const getLastXDays = (days) => {
  const dates = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates.reverse();
};

export default function App() {
  const [activeTab, setActiveTab] = useState('today');
  
  const [medicines, setMedicines] = useState(() => {
    const saved = localStorage.getItem('dose_meds');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Vitamin C', frequency: 1, unit: 'tab' },
      { id: 2, name: 'Omega-3', frequency: 2, unit: 'gel' }
    ];
  });

  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('dose_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [newMedName, setNewMedName] = useState('');
  const [newMedFreq, setNewMedFreq] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    localStorage.setItem('dose_meds', JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    localStorage.setItem('dose_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
  };

  const addMedicine = () => {
    if (!newMedName.trim()) return;
    const newMed = {
      id: Date.now(),
      name: newMedName,
      frequency: parseInt(newMedFreq) || 1,
      unit: 'x'
    };
    setMedicines([...medicines, newMed]);
    setNewMedName('');
    setNewMedFreq(1);
    triggerToast('Added successfully');
  };

  const removeMedicine = (id) => {
    if (window.confirm('Remove this medication? History will be kept but hidden.')) {
      setMedicines(medicines.filter(m => m.id !== id));
      triggerToast('Removed');
    }
  };

  const logDose = (medId) => {
    const newLog = {
      id: Date.now(),
      medId,
      timestamp: new Date().toISOString(),
      dateString: getTodayString()
    };
    setLogs([...logs, newLog]);
    triggerToast('Dose logged');
  };

  const deleteLog = (logId) => {
      setLogs(logs.filter(l => l.id !== logId));
      triggerToast('Undone');
  }

  const getTodayCount = (medId) => {
    const today = getTodayString();
    return logs.filter(l => l.medId === medId && l.dateString === today).length;
  };

  const statsData = useMemo(() => {
    const last7Days = getLastXDays(7);
    
    return medicines.map(med => {
      let totalTaken = 0;
      const targetTotal = med.frequency * 7;

      const dailyHistory = last7Days.map(date => {
        const count = logs.filter(l => l.medId === med.id && l.dateString === date).length;
        totalTaken += count;
        return { date, count };
      });

      const adherenceRate = targetTotal > 0 ? Math.round((totalTaken / targetTotal) * 100) : 0;
      
      let advice = "";
      let statusColor = "";

      if (totalTaken === 0) {
        advice = "No records yet.";
        statusColor = "text-slate-400";
      } else if (adherenceRate < 80) {
        advice = "Consistency is key.";
        statusColor = "text-rose-500";
      } else if (adherenceRate <= 100) {
        advice = "Perfect streak.";
        statusColor = "text-teal-600";
      } else {
        advice = "Over limit?";
        statusColor = "text-orange-500";
      }

      return { ...med, dailyHistory, totalTaken, adherenceRate, advice, statusColor };
    });
  }, [medicines, logs]);


  // --- Components ---

  const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-white/60 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl ${className}`}>
      {children}
    </div>
  );

  const NavButton = ({ id, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`p-4 rounded-2xl transition-all duration-300 ${
        activeTab === id 
          ? 'bg-white text-slate-800 shadow-lg shadow-indigo-100 transform scale-110' 
          : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 2} />
    </button>
  );

  const TodayView = () => {
    const todayLogs = logs.filter(l => l.dateString === getTodayString());
    
    return (
      <div className="space-y-5 pb-24">
        {/* Hero Section */}
        <div className="pt-4 px-1">
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Today</h2>
            <p className="text-slate-500 font-medium text-sm mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
        </div>

        {/* Progress Summary */}
        <GlassCard className="p-6 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full blur-3xl opacity-30 -mr-10 -mt-10"></div>
            <div className="relative z-10">
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Daily Goals</span>
                <div className="text-4xl font-bold text-slate-800 mt-1">
                    {Math.round((todayLogs.length / (medicines.reduce((acc, m) => acc + m.frequency, 0) || 1)) * 100)}%
                </div>
                <div className="text-xs text-slate-500 mt-1 font-medium">Completed</div>
            </div>
            <div className="h-16 w-16 rounded-full border-4 border-indigo-100 flex items-center justify-center relative">
                 <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent opacity-80" style={{transform: 'rotate(45deg)'}}></div>
                 <Check className="text-indigo-600" />
            </div>
        </GlassCard>

        {medicines.length === 0 && (
          <div className="text-center py-12 opacity-50">
            <p>No routines set.</p>
            <button onClick={() => setActiveTab('settings')} className="text-indigo-500 font-medium mt-2 underline decoration-2 underline-offset-4">Add Now</button>
          </div>
        )}

        <div className="space-y-3">
            {medicines.map(med => {
            const count = getTodayCount(med.id);
            const isComplete = count >= med.frequency;

            return (
                <GlassCard key={med.id} className="p-0 overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-indigo-100/50 hover:-translate-y-1">
                <div className="p-5 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isComplete ? 'bg-teal-100 text-teal-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            <Droplet size={18} fill={isComplete ? "currentColor" : "none"} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 leading-tight">{med.name}</h3>
                            <p className="text-xs font-medium text-slate-400 mt-0.5">{count} / {med.frequency} times</p>
                        </div>
                    </div>
                    
                    <button
                    onClick={() => logDose(med.id)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        isComplete 
                        ? 'bg-slate-100 text-slate-300 cursor-default' 
                        : 'bg-slate-800 text-white shadow-lg shadow-slate-300 hover:scale-105 active:scale-95'
                    }`}
                    >
                        {isComplete ? <Check size={20} /> : <Plus size={20} />}
                    </button>
                </div>
                
                {/* Visual History Dots */}
                {count > 0 && (
                     <div className="bg-slate-50/50 px-5 py-2 flex gap-2 border-t border-slate-100/50">
                        {todayLogs.filter(l => l.medId === med.id).map(log => (
                            <button 
                                key={log.id} 
                                onClick={() => deleteLog(log.id)}
                                className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-100 hover:border-rose-200 hover:text-rose-500 transition-colors"
                            >
                                {new Date(log.timestamp).toLocaleTimeString('en-US', {hour: 'numeric', minute:'numeric', hour12: true})}
                            </button>
                        ))}
                     </div>
                )}
                </GlassCard>
            );
            })}
        </div>
      </div>
    );
  };

  const StatsView = () => {
    return (
      <div className="space-y-5 pb-24">
        <div className="pt-4 px-1">
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Insights</h2>
            <p className="text-slate-500 font-medium text-sm mt-1">Last 7 days performance</p>
        </div>

        <div className="grid gap-4">
            {statsData.map(data => (
            <GlassCard key={data.id} className="p-5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-700">{data.name}</h3>
                    <span className={`text-sm font-bold bg-slate-100 px-2 py-1 rounded-lg ${data.statusColor}`}>
                        {data.adherenceRate}%
                    </span>
                </div>

                <div className="flex items-end justify-between h-16 gap-1 mb-2">
                    {data.dailyHistory.map((d, i) => {
                        const isToday = d.date === getTodayString();
                        const h = Math.max(10, Math.min((d.count / data.frequency) * 100, 100));
                        return (
                            <div key={i} className="w-full flex flex-col items-center gap-1 group">
                                <div 
                                    className={`w-full rounded-md transition-all duration-500 ${
                                        isToday ? 'bg-indigo-500' : (d.count > 0 ? 'bg-indigo-200' : 'bg-slate-100')
                                    }`} 
                                    style={{ height: `${h}%` }}
                                ></div>
                            </div>
                        )
                    })}
                </div>
                <div className="mt-3 pt-3 border-t border-dashed border-slate-200">
                    <div className="flex items-start gap-2 text-xs text-slate-500">
                        <Info size={14} className="mt-0.5 text-indigo-400 shrink-0" />
                        <span>{data.advice}</span>
                    </div>
                </div>
            </GlassCard>
            ))}
        </div>
      </div>
    );
  };

  const SettingsView = () => {
    return (
      <div className="space-y-5 pb-24">
         <div className="pt-4 px-1">
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Manage</h2>
            <p className="text-slate-500 font-medium text-sm mt-1">Add or remove routines</p>
        </div>

        <GlassCard className="p-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">New Medication</label>
            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="Name (e.g. Aspirin)"
                    className="w-full px-4 py-3 bg-slate-50/50 border-0 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                />
                
                <div className="flex items-center gap-4">
                    <div className="flex-1 bg-slate-50/50 rounded-xl p-2 flex items-center justify-between">
                        <button onClick={() => setNewMedFreq(Math.max(1, newMedFreq - 1))} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-600 active:scale-95 transition-transform">-</button>
                        <span className="font-bold text-slate-700">{newMedFreq} <span className="text-xs text-slate-400 font-normal">/day</span></span>
                        <button onClick={() => setNewMedFreq(newMedFreq + 1)} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-600 active:scale-95 transition-transform">+</button>
                    </div>
                    <button
                        onClick={addMedicine}
                        className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold shadow-lg shadow-slate-300 hover:bg-slate-900 transition-all active:scale-95"
                    >
                        Add
                    </button>
                </div>
            </div>
        </GlassCard>

        <div className="space-y-3 mt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Current List</h3>
            {medicines.map(med => (
                <div key={med.id} className="flex justify-between items-center p-4 bg-white/40 rounded-2xl border border-white/40">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                        <span className="font-semibold text-slate-700">{med.name}</span>
                        <span className="text-xs bg-white px-2 py-0.5 rounded text-slate-400 border border-slate-100">{med.frequency}x</span>
                    </div>
                    <button onClick={() => removeMedicine(med.id)} className="text-slate-300 hover:text-rose-400 transition-colors">
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
        </div>
      </div>
    );
  };

  return (
    // Main Container with Gradient Background
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4F8] via-[#E6EAF5] to-[#F3E6F5] font-sans text-slate-800 max-w-md mx-auto relative shadow-2xl overflow-hidden selection:bg-indigo-100">
      
      {/* Floating Toast */}
      <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="bg-slate-800/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-2xl shadow-slate-400/50 text-xs font-bold tracking-wide flex items-center gap-2">
            <Check size={12} className="text-teal-400" strokeWidth={3} />
            {toastMsg}
        </div>
      </div>

      {/* Header - Minimalist */}
      <header className="px-6 pt-8 pb-2 flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-black italic text-lg shadow-lg shadow-indigo-500/20">D</div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Dose.</h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center border border-white/60">
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
        </div>
      </header>

      {/* Content Area */}
      <main className="p-5 min-h-screen overflow-y-auto scrollbar-hide">
        {activeTab === 'today' && <TodayView />}
        {activeTab === 'stats' && <StatsView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Floating Glass Dock Navigation */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-20">
        <nav className="bg-white/80 backdrop-blur-2xl border border-white/50 px-2 py-2 rounded-3xl shadow-2xl shadow-indigo-900/10 flex gap-2 pointer-events-auto transform translate-y-0 hover:scale-[1.02] transition-transform">
            <NavButton id="today" icon={Calendar} />
            <NavButton id="stats" icon={BarChart2} />
            <NavButton id="settings" icon={Settings} />
        </nav>
      </div>
    </div>
  );
}
