import React from 'react';
import { Settings, Zap, Activity } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function SettingsView() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-tg-bg px-4 py-6 animate-in fade-in duration-500 pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-tg-text">Настройки</h1>
        <Settings className="text-tg-link animate-spin-slow" size={28} />
      </div>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-tg-hint uppercase ml-2">Приложение</p>
          <div className="bg-tg-secondaryBg rounded-[2rem] overflow-hidden border border-slate-100/5">
            <div className="p-4 flex items-center justify-between border-b border-tg-bg/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                  <Zap size={20} />
                </div>
                <span className="text-tg-text font-bold">Тестовый режим</span>
              </div>
              <span className="text-tg-link font-black text-xs bg-tg-link/10 px-3 py-1 rounded-full uppercase tracking-wider">Активен</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center">
                  <Activity size={20} />
                </div>
                <span className="text-tg-text font-bold">Версия</span>
              </div>
              <span className="text-tg-hint font-bold text-sm">2.1.0 (Supabase)</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
           <p className="text-[10px] font-bold text-tg-hint uppercase ml-2">Аккаунт</p>
           <div className="bg-tg-secondaryBg rounded-[2rem] p-6 text-center border border-slate-100/5">
             <div className="w-16 h-16 bg-tg-bg rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-tg-link/20">
               <span className="text-2xl">👤</span>
             </div>
             <h3 className="font-bold text-tg-text">{user?.username || 'Гостевой доступ'}</h3>
             <p className="text-xs text-tg-hint mb-6">Ваши данные сохраняются в облаке Supabase</p>
             <button 
               onClick={() => {
                 localStorage.removeItem('access_token');
                 window.location.reload();
               }}
               className="w-full py-4 bg-red-500/10 text-red-500 rounded-2xl font-black text-sm active:scale-95 transition-all"
             >
               Выйти
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
