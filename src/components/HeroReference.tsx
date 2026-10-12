import React, { useState } from 'react';
import { 
  Calendar, 
  QrCode, 
  Stethoscope, 
  ArrowRight, 
  Award, 
  Sparkles,
  Users,
  Image as ImageIcon
} from 'lucide-react';
import { Medico, Agendamento } from '../types';
import { ZaneLogo, ZaneMedallion } from './ZaneLogo';

interface HeroReferenceProps {
  onAgendarClick: () => void;
  onTotemClick: () => void;
  onProntuarioClick: () => void;
  medicos: Medico[];
  agendamentosHoje: Agendamento[];
  onSelectEspecialidade?: (esp: string) => void;
}

// Fotografias do estúdio com Pilates Clínico, Reformer e Postura
const STUDIO_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=85',
    title: 'Pilates Clínico & Teaser',
    desc: 'Instrutora acompanhando execução postural no estúdio',
  },
  {
    url: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?auto=format&fit=crop&w=1200&q=85',
    title: 'Alongamento & Reabilitação',
    desc: 'Alinhamento biomecânico e liberação miofascial',
  },
  {
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85',
    title: 'Aparelhos Reformer & Cadillac',
    desc: 'Fortalecimento profundo e precisão de movimento',
  },
];

export const HeroReference: React.FC<HeroReferenceProps> = ({
  onAgendarClick,
  onTotemClick,
  onProntuarioClick,
  medicos,
  agendamentosHoje,
  onSelectEspecialidade,
}) => {
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);

  const especialidades = [
    { nome: 'PILATES CLÍNICO & POSTURA', count: 'Dra. Mariana Costa' },
    { nome: 'REABILITAÇÃO ORTOPÉDICA & COLUNA', count: 'Ft. Roberto Vasconcelos' },
    { nome: 'RPG & CADEIAS MUSCULARES', count: 'Ft. Camila Albuquerque' },
    { nome: 'ORTOPEDIA & MEDICINA DO EXERCÍCIO', count: 'Dr. Lucas Silveira' },
    { nome: 'PRONTUÁRIO CLÍNICO (PEP)', count: 'Evolução & Conduta' },
    { nome: 'CHECK-IN POR QR CODE', count: 'Totem de Entrada' },
  ];

  const confirmados = agendamentosHoje.filter((a) => a.status === 'Presente').length;
  const emAtendimento = agendamentosHoje.filter((a) => a.status === 'Em atendimento').length;

  return (
    <div className="space-y-12 pb-16">
      {/* 
        HERO SECTION: 
        Design editorial com split-screen, logotipo oficial ZANE Pilates Studio 
        (Forest Green #16362C, Ouro Polido #CCB373)
        e fotografia autêntica da instrutora e aluna no estúdio.
      */}
      <section className="relative overflow-hidden rounded-3xl bg-[#FAF8F5] border border-[#E5E0D5] shadow-xs p-4 sm:p-8 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Imagem Principal Oficial do Studio com Medalhão e Seletor */}
          <div className="lg:col-span-6 flex flex-col items-center order-2 lg:order-1">
            <div className="relative w-full max-w-md aspect-4/5 rounded-3xl overflow-hidden shadow-xl border-2 border-[#CCB373]/30 group bg-[#16362C]/5">
              
              {/* Fotografia oficial do estúdio */}
              <img 
                src={STUDIO_PHOTOS[selectedPhotoIdx].url} 
                alt={`ZANE Pilates Studio - ${STUDIO_PHOTOS[selectedPhotoIdx].title}`} 
                className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700"
              />

              {/* Medalhão Ouro oficial (Selo circular ZANE) */}
              <div className="absolute top-4 left-4 z-20">
                <ZaneMedallion size={68} className="shadow-lg hover:scale-105 transition-transform" />
              </div>

              {/* Card flutuante sobre a imagem */}
              <div className="absolute bottom-4 left-4 right-4 bg-[#FAF8F5]/92 backdrop-blur-md rounded-2xl p-3.5 border border-[#E5E0D5] shadow-lg z-20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#16362C] text-[#CCB373] flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#16362C]">Check-in de Presença por QR Code</div>
                    <div className="text-[11px] text-[#879C7B]">{STUDIO_PHOTOS[selectedPhotoIdx].desc}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#16362C] bg-[#CCB373]/30 px-2 py-0.5 rounded-full border border-[#CCB373]/50">
                  Ao Vivo
                </span>
              </div>
            </div>

            {/* Alternador de fotos do studio */}
            <div className="flex items-center gap-2 mt-3 text-xs text-[#879C7B]">
              <ImageIcon className="w-3.5 h-3.5 text-[#CCB373]" />
              <span>Fotos do Studio:</span>
              <div className="flex items-center gap-1.5">
                {STUDIO_PHOTOS.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPhotoIdx(idx)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      selectedPhotoIdx === idx
                        ? 'bg-[#16362C] text-[#FAF8F5] shadow-2xs'
                        : 'bg-white border border-[#E5E0D5] text-[#16362C] hover:bg-slate-100'
                    }`}
                  >
                    Foto {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Logotipo Oficial ZANE + Pilares Clínicos + Ações (Sem ícone Google Sheets) */}
          <div className="lg:col-span-6 flex flex-col justify-center items-center lg:items-start text-center lg:text-left order-1 lg:order-2 space-y-6">
            
            {/* Logotipo Oficial ZANE PILATES STUDIO */}
            <div className="space-y-3">
              <ZaneLogo size="lg" className="mx-auto lg:mx-0 drop-shadow-2xs" showSubtitle={true} />
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16362C]/5 border border-[#CCB373]/40 text-[11px] font-semibold tracking-widest text-[#16362C] uppercase">
                <Sparkles className="w-3 h-3 text-[#CCB373]" />
                Excelência em Pilates Clínico & Fisioterapia
              </div>
            </div>

            {/* Especialidades do Studio */}
            <div className="py-2 space-y-2 w-full max-w-md">
              {especialidades.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (item.nome.includes('QR') || item.nome.includes('CHECK-IN')) onTotemClick();
                    else if (item.nome.includes('PRONTUÁRIO')) onProntuarioClick();
                    else {
                      if (onSelectEspecialidade) onSelectEspecialidade(item.nome);
                      onAgendarClick();
                    }
                  }}
                  className="w-full group flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white transition-all border-b border-[#E5E0D5] text-left"
                >
                  <span className="font-serif-editorial text-base sm:text-lg tracking-[0.12em] text-[#16362C] group-hover:text-[#B89A57] group-hover:translate-x-1 transition-all uppercase font-semibold">
                    {item.nome}
                  </span>
                  <span className="text-xs text-[#879C7B] group-hover:text-[#16362C] flex items-center gap-1 font-medium">
                    {item.count}
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </button>
              ))}
            </div>

            {/* Botões Principais de Ação: Agendar e Totem Check-in (Google Sheets removido daqui e colocado apenas no fim) */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3.5 w-full max-w-md">
              <button
                onClick={onAgendarClick}
                className="w-full sm:w-auto flex-1 px-8 py-3.5 rounded-full border border-[#16362C] bg-[#16362C] hover:bg-[#0D221C] text-[#FAF8F5] text-xs font-semibold tracking-[0.2em] uppercase transition-all shadow-sm hover:shadow-md text-center cursor-pointer"
              >
                Agendar Sessão
              </button>

              <button
                onClick={onTotemClick}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-[#CCB373] hover:border-[#16362C] bg-[#FAF8F5] hover:bg-white text-[#16362C] text-xs font-semibold tracking-[0.16em] uppercase transition-all shadow-2xs text-center cursor-pointer"
              >
                Totem Check-in
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 
        STUDIO STATS & PULSE BAR
      */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#FAF8F5] border border-[#E5E0D5] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#879C7B] text-xs font-medium">
            <span>Sessões Hoje</span>
            <Calendar className="w-4 h-4 text-[#16362C]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#16362C]">{agendamentosHoje.length}</span>
            <span className="text-xs text-[#879C7B]">agendadas</span>
          </div>
        </div>

        <div className="bg-[#FAF8F5] border border-[#E5E0D5] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#879C7B] text-xs font-medium">
            <span>Check-in Realizado</span>
            <QrCode className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-800">{confirmados}</span>
            <span className="text-xs text-emerald-700 font-medium">na recepção</span>
          </div>
        </div>

        <div className="bg-[#FAF8F5] border border-[#E5E0D5] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#879C7B] text-xs font-medium">
            <span>Em Atendimento</span>
            <Stethoscope className="w-4 h-4 text-[#B89A57]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#16362C]">{emAtendimento}</span>
            <span className="text-xs text-[#879C7B] font-medium">em estúdio</span>
          </div>
        </div>

        <div className="bg-[#FAF8F5] border border-[#E5E0D5] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#879C7B] text-xs font-medium">
            <span>Corpo Clínico</span>
            <Award className="w-4 h-4 text-[#CCB373]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#16362C]">{medicos.length}</span>
            <span className="text-xs text-[#879C7B]">profissionais</span>
          </div>
        </div>
      </section>

      {/* 
        CORPO DE FISIOTERAPEUTAS E MÉDICOS
      */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-semibold tracking-wider text-[#CCB373] uppercase">
              Corpo Profissional Qualificado
            </span>
            <h2 className="font-serif-editorial text-3xl font-normal text-[#16362C]">
              Fisioterapeutas & Médicos do Studio
            </h2>
            <p className="text-sm text-[#879C7B]">
              Atendimento individualizado com foco em postura, reabilitação articular e biomecânica do movimento.
            </p>
          </div>
          <button 
            onClick={onAgendarClick}
            className="self-start sm:self-auto px-4 py-2 rounded-full border border-[#16362C] text-[#16362C] hover:bg-[#16362C] hover:text-[#FAF8F5] text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer"
          >
            Escolher Horário
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {medicos.map((med) => (
            <div 
              key={med.id} 
              className="bg-white rounded-2xl overflow-hidden border border-[#E5E0D5] shadow-xs hover:shadow-md transition-all flex flex-col group"
            >
              <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100">
                <img 
                  src={med.foto} 
                  alt={med.nome} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-[#16362C] text-[#CCB373] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#CCB373]/40">
                  {med.crm}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[11px] font-bold text-[#CCB373] tracking-wide uppercase">
                    {med.especialidade}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-[#16362C] leading-snug">
                    {med.nome}
                  </h3>
                  <p className="text-xs text-[#879C7B] line-clamp-2 mt-1">
                    {med.biografia}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-[#879C7B]">
                    <span>{med.sala}</span>
                  </div>
                  <button
                    onClick={onAgendarClick}
                    className="font-semibold text-[#16362C] hover:text-[#CCB373] flex items-center gap-1 group-hover:underline cursor-pointer"
                  >
                    Agendar
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 
        TRÍADE DE BENEFÍCIOS DO STUDIO
      */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-[#E5E0D5] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#16362C] text-[#CCB373] flex items-center justify-center font-bold">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-xl font-bold text-[#16362C]">Check-in Ágil por QR Code</h3>
          <p className="text-xs text-[#879C7B] leading-relaxed">
            Elimine filas na recepção do estúdio. O aluno aponta o celular para o totem ou digita seu CPF e sua presença é confirmada em 3 segundos.
          </p>
          <button onClick={onTotemClick} className="text-xs font-semibold text-[#16362C] hover:underline flex items-center gap-1 cursor-pointer">
            Testar Totem de Entrada →
          </button>
        </div>

        <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-[#E5E0D5] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#16362C] text-[#CCB373] flex items-center justify-center font-bold">
            <Stethoscope className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-xl font-bold text-[#16362C]">Prontuário & Evolução (PEP)</h3>
          <p className="text-xs text-[#879C7B] leading-relaxed">
            Ficha clínica completa para fisioterapeutas e médicos: avaliação postural, restrições articulares, histórico de dores e evolução contínua.
          </p>
          <button onClick={onProntuarioClick} className="text-xs font-semibold text-[#16362C] hover:underline flex items-center gap-1 cursor-pointer">
            Acessar Prontuário Clínico →
          </button>
        </div>

        <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-[#E5E0D5] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#16362C] text-[#CCB373] flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-xl font-bold text-[#16362C]">Gestão Completa de Pacientes</h3>
          <p className="text-xs text-[#879C7B] leading-relaxed">
            Edite todos os dados de cadastro, planos (Gympass, TotalPass, sessões avulsas), telefones, diagnósticos e histórico com sincronização Google Sheets.
          </p>
          <button onClick={onAgendarClick} className="text-xs font-semibold text-[#16362C] hover:underline flex items-center gap-1 cursor-pointer">
            Ver Pacientes & Alunos →
          </button>
        </div>
      </section>

    </div>
  );
};
