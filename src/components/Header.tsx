import React from 'react';
import { 
  Calendar, 
  QrCode, 
  Users, 
  Stethoscope, 
  Lock
} from 'lucide-react';
import { ZaneLogo } from './ZaneLogo';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  todayCount: number;
  presentCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  todayCount,
  presentCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E5E0D5] px-4 md:px-8 py-3 transition-all shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Brand identity com o Logotipo Oficial ZANE Pilates Studio */}
        <div 
          onClick={() => setActiveTab('inicio')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <ZaneLogo size="md" showSubtitle={true} />
        </div>

        {/* Central Navigation Tabs - Sem Google Sheets, Totem ou Agendar no topo */}
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs md:text-sm font-medium">
          <button
            onClick={() => setActiveTab('inicio')}
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
              activeTab === 'inicio'
                ? 'bg-[#16362C] text-[#FAF8F5] shadow-xs font-semibold'
                : 'text-[#16362C]/70 hover:text-[#16362C] hover:bg-[#16362C]/5'
            }`}
          >
            Início
          </button>

          <button
            onClick={() => setActiveTab('agendamento')}
            className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'agendamento'
                ? 'bg-[#16362C] text-[#FAF8F5] shadow-xs font-semibold'
                : 'text-[#16362C]/70 hover:text-[#16362C] hover:bg-[#16362C]/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#CCB373]" />
            <span>Consultas</span>
            {todayCount > 0 && (
              <span className="bg-[#CCB373] text-[#16362C] text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {todayCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('checkin')}
            className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'checkin'
                ? 'bg-[#16362C] text-[#FAF8F5] shadow-xs font-semibold'
                : 'text-[#16362C]/70 hover:text-[#16362C] hover:bg-[#16362C]/5'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-[#CCB373]" />
            <span>Check-in QR</span>
            {presentCount > 0 && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {presentCount} presentes
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('prontuario')}
            className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'prontuario'
                ? 'bg-[#16362C] text-[#FAF8F5] shadow-xs font-semibold'
                : 'text-[#16362C]/70 hover:text-[#16362C] hover:bg-[#16362C]/5'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-[#CCB373]" />
            <span>Prontuário (PEP)</span>
          </button>

          <button
            onClick={() => setActiveTab('pacientes')}
            className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'pacientes'
                ? 'bg-[#16362C] text-[#FAF8F5] shadow-xs font-semibold'
                : 'text-[#16362C]/70 hover:text-[#16362C] hover:bg-[#16362C]/5'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#CCB373]" />
            <span>Gestão de Pacientes</span>
          </button>

          <button
            onClick={() => setActiveTab('profissionais')}
            className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'profissionais'
                ? 'bg-[#16362C] text-[#FAF8F5] shadow-xs font-semibold'
                : 'text-[#16362C]/70 hover:text-[#16362C] hover:bg-[#16362C]/5'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-[#CCB373]" />
            <span>Profissionais 🔒</span>
          </button>
        </nav>

      </div>
    </header>
  );
};
