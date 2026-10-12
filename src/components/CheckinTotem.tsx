import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { 
  QrCode, 
  Search, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  Printer, 
  Download, 
  Sparkles, 
  Volume2, 
  RefreshCw,
  Plus,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { Agendamento, Medico, Paciente } from '../types';
import { getHojeIso, getHoraAtual } from '../services/storage';
import { ZaneLogo, ZaneMedallion } from './ZaneLogo';

interface CheckinTotemProps {
  agendamentos: Agendamento[];
  medicos: Medico[];
  pacientes: Paciente[];
  onPerformCheckin: (agendamentoId: string) => Promise<void>;
  onQuickWalkinCheckin: (novoAgendamento: Agendamento) => Promise<void>;
  onOpenReceipt: (agendamento: Agendamento) => void;
  isSoloTotemMode?: boolean;
  onExitSoloTotem?: () => void;
}

export const CheckinTotem: React.FC<CheckinTotemProps> = ({
  agendamentos,
  medicos,
  pacientes,
  onPerformCheckin,
  onQuickWalkinCheckin,
  onOpenReceipt,
  isSoloTotemMode = false,
  onExitSoloTotem,
}) => {
  const [activeTab, setActiveTab] = useState<'totem' | 'fila' | 'cartaz' | 'expresso'>('totem');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastCheckedIn, setLastCheckedIn] = useState<Agendamento | null>(null);
  const [posterQrUrl, setPosterQrUrl] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');
  // Por privacidade e solicitação do usuário, sessões previstas ficam ocultas por padrão no totem
  const [mostrarSessoesPrevistas, setMostrarSessoesPrevistas] = useState(false);

  // Expresso / Encaixe Form
  const [expressPacienteId, setExpressPacienteId] = useState('');
  const [expressMedicoId, setExpressMedicoId] = useState('');
  const [expressSala, setExpressSala] = useState('');

  const hoje = getHojeIso();

  // Gera o QR Code para o Cartaz de Balcão da Recepção
  useEffect(() => {
    const totemUrl = window.location.origin + window.location.pathname + '?totem=true';
    QRCode.toDataURL(totemUrl, {
      width: 380,
      margin: 2,
      color: {
        dark: '#16362C',
        light: '#FFFFFF',
      },
    })
      .then((url) => setPosterQrUrl(url))
      .catch((err) => console.error('Erro ao gerar QR Code do totem:', err));
  }, []);

  // Consultas de hoje
  const agendamentosHoje = agendamentos.filter((a) => a.data === hoje && a.status !== 'Cancelado');

  // Filtro de busca para o totem
  const queryClean = searchQuery.trim().toLowerCase();
  const digitsOnly = searchQuery.replace(/\D/g, '');

  const agendamentosPendentes = agendamentosHoje.filter((a) => {
    if (a.status !== 'Agendado') return false;
    if (!queryClean) return true;
    const matchNome = a.pacienteNome.toLowerCase().includes(queryClean);
    const matchCodigo = a.codigo.toLowerCase().includes(queryClean);
    const matchCpf = digitsOnly && a.pacienteCpf.replace(/\D/g, '').includes(digitsOnly);
    const matchTelefone = digitsOnly && a.pacienteTelefone.replace(/\D/g, '').includes(digitsOnly);
    return matchNome || matchCodigo || matchCpf || matchTelefone;
  });

  const agendamentosPresentes = agendamentosHoje
    .filter((a) => a.status === 'Presente' || a.status === 'Em atendimento')
    .sort((a, b) => (b.checkinEm || '').localeCompare(a.checkinEm || ''));

  // Disparo de check-in com animação festiva
  const handleCheckinClick = async (agd: Agendamento) => {
    try {
      await onPerformCheckin(agd.id);
      setLastCheckedIn(agd);

      // Dispara confetes festivos nas cores da ZANE
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#16362C', '#CCB373', '#DFCA88', '#879C7B'],
      });

      // Tom suave de confirmação via Web Audio API
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (e) {
        // Ignora
      }

      setSearchQuery('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;

    let code = manualCodeInput.trim();
    try {
      const parsed = JSON.parse(code);
      if (parsed.codigo) code = parsed.codigo;
    } catch (e) {
      // É código puro
    }

    const found = agendamentosHoje.find(
      (a) => a.codigo.toLowerCase() === code.toLowerCase() || a.pacienteCpf.replace(/\D/g, '') === code.replace(/\D/g, '')
    );

    if (found) {
      handleCheckinClick(found);
      setManualCodeInput('');
      setScannerOpen(false);
    } else {
      alert(`Nenhum agendamento pendente encontrado para hoje com o código ou CPF: ${code}`);
    }
  };

  const handleExpressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = pacientes.find((x) => x.id === expressPacienteId);
    const m = medicos.find((x) => x.id === expressMedicoId);

    if (!p || !m) {
      alert('Selecione o aluno e o profissional para registrar a entrada.');
      return;
    }

    const novo: Agendamento = {
      id: 'agd-exp-' + Date.now().toString(36),
      codigo: 'ZNE-' + Math.floor(1000 + Math.random() * 9000),
      pacienteId: p.id,
      pacienteNome: p.nome,
      pacienteTelefone: p.telefone,
      pacienteCpf: p.cpf,
      medicoId: m.id,
      medicoNome: m.nome,
      especialidade: m.especialidade,
      data: hoje,
      hora: getHoraAtual(),
      sala: expressSala || m.sala,
      status: 'Presente',
      checkinEm: getHoraAtual(),
      tipoConsulta: 'Encaixe de Recepção',
      valor: 0,
      observacoes: 'Entrada expressa via recepção.',
      criadoEm: new Date().toISOString(),
    };

    await onQuickWalkinCheckin(novo);
    setLastCheckedIn(novo);
    setExpressPacienteId('');
    setExpressSala('');

    confetti({ 
      particleCount: 50, 
      spread: 50,
      colors: ['#16362C', '#CCB373', '#DFCA88', '#879C7B']
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Navigation tabs within Totem module */}
      {!isSoloTotemMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-[#E5E0D5]">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('totem')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'totem'
                  ? 'bg-[#16362C] text-[#FAF8F5] shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              🖥 Totem Interativo (Kiosk)
            </button>
            <button
              onClick={() => setActiveTab('fila')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'fila'
                  ? 'bg-[#16362C] text-[#FAF8F5] shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              📋 Fila de Chegadas Hoje ({agendamentosPresentes.length})
            </button>
            <button
              onClick={() => setActiveTab('cartaz')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'cartaz'
                  ? 'bg-[#16362C] text-[#FAF8F5] shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              🖨 Cartaz QR da Recepção
            </button>
            <button
              onClick={() => setActiveTab('expresso')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'expresso'
                  ? 'bg-[#16362C] text-[#FAF8F5] shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ⚡ Encaixe / Check-in Expresso
            </button>
          </div>

          <div className="text-xs text-[#879C7B] font-medium px-2">
            Hoje: <strong className="text-[#16362C]">{new Date().toLocaleDateString('pt-BR')}</strong>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 1: TOTEM INTERATIVO DE AUTOATENDIMENTO                     */}
      {/* ============================================================== */}
      {activeTab === 'totem' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E5E0D5] shadow-xs max-w-4xl mx-auto space-y-8">
          
          {/* Header do Totem */}
          <div className="text-center space-y-2 max-w-lg mx-auto">
            <div className="flex flex-col items-center justify-center gap-2 mb-2">
              <ZaneMedallion size={76} className="drop-shadow-md hover:scale-105 transition-transform" />
              <ZaneLogo size="md" showSubtitle={true} />
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-[#16362C]/5 text-[#16362C] text-[11px] font-bold tracking-widest uppercase border border-[#CCB373]/30">
              ✦ Autoatendimento & Recepção Digital
            </div>
            <h1 className="font-serif-editorial text-3xl sm:text-4xl font-normal text-[#16362C]">
              Bem-vindo ao ZANE Pilates Studio!
            </h1>
            <p className="text-xs sm:text-sm text-[#879C7B]">
              Digite seu <strong>Nome</strong>, <strong>CPF</strong> ou <strong>Código Localizador (ex: ZNE-1092)</strong> no campo de busca ou aproxime seu QR Code para confirmar presença instantaneamente.
            </p>
          </div>

          {/* Banner de Confirmação Recente */}
          {lastCheckedIn && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 text-center space-y-2 animate-fade-in shadow-xs">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold shadow-xs">
                ✓
              </div>
              <div className="font-serif-editorial text-2xl font-bold text-emerald-950">
                Check-in Confirmado, {lastCheckedIn.pacienteNome}!
              </div>
              <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto">
                Sua chegada foi comunicada ao consultório. Por favor, dirija-se à sala:{' '}
                <strong className="underline font-bold text-emerald-950">{lastCheckedIn.sala}</strong> com{' '}
                <strong>{lastCheckedIn.medicoNome}</strong>.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => onOpenReceipt(lastCheckedIn)}
                  className="px-4 py-1.5 rounded-full bg-white border border-emerald-300 text-emerald-900 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  Ver Comprovante Digital
                </button>
                <button
                  onClick={() => setLastCheckedIn(null)}
                  className="px-4 py-1.5 rounded-full bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors cursor-pointer"
                >
                  Fechar Aviso
                </button>
              </div>
            </div>
          )}

          {/* Search bar & Scan actions */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍  Digite seu Nome, CPF ou Código Localizador para check-in..."
                className="w-full pl-12 pr-28 py-4 bg-slate-50 border-2 border-[#E5E0D5] focus:border-[#16362C] rounded-2xl text-sm sm:text-base text-[#16362C] placeholder-slate-400 focus:bg-white focus:outline-hidden transition-all shadow-2xs"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setScannerOpen(!scannerOpen)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-[#16362C] hover:bg-[#16362C] hover:text-[#FAF8F5] text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-[#CCB373]" />
                <span className="hidden sm:inline">Escanear</span>
              </button>
            </div>

            {/* Modal / Gaveta de Scanner de Código */}
            {scannerOpen && (
              <div className="p-4 bg-[#FAF8F5] border border-[#E5E0D5] rounded-2xl space-y-3 animate-fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-[#16362C] uppercase">
                  <span>Leitor de QR Code / Código Localizador</span>
                  <button onClick={() => setScannerOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
                </div>
                <p className="text-xs text-[#879C7B]">
                  Aponte o leitor óptico para o código impresso ou digite o código do voucher (ex: <strong>ZNE-1092</strong>):
                </p>
                <form onSubmit={handleManualScanSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value)}
                    placeholder="Cole o código do QR Code ou CPF..."
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#16362C] text-[#FAF8F5] text-xs font-bold rounded-xl hover:bg-[#0D221C] cursor-pointer"
                  >
                    Confirmar Código
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Sessões no Totem: Ocultas por padrão para privacidade / LGPD */}
          <div className="space-y-4">
            {/* Se o usuário realizou uma busca ativa */}
            {searchQuery.trim() ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#879C7B] tracking-wider uppercase border-b border-slate-100 pb-2">
                  <span>Resultado da Busca ({agendamentosPendentes.length})</span>
                  <span>Toque para confirmar seu check-in</span>
                </div>

                {agendamentosPendentes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {agendamentosPendentes.map((agd) => (
                      <div
                        key={agd.id}
                        onClick={() => handleCheckinClick(agd)}
                        className="p-4 rounded-2xl border-2 border-emerald-300 hover:border-[#16362C] bg-white cursor-pointer transition-all flex items-center justify-between group shadow-sm hover:shadow-md animate-fade-in"
                      >
                        <div className="space-y-1 min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm sm:text-base text-[#16362C] group-hover:text-[#B89A57] truncate">
                              {agd.pacienteNome}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px] font-bold">
                              {agd.codigo}
                            </span>
                          </div>
                          <div className="text-xs text-[#879C7B] flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-[#CCB373]" />
                            <span>{agd.hora} hrs</span>
                            <span>•</span>
                            <span className="truncate">{agd.medicoNome}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {agd.sala}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="px-4 py-2 rounded-xl bg-[#16362C] text-[#FAF8F5] group-hover:bg-[#0D221C] text-xs font-bold tracking-wide uppercase shrink-0 transition-colors shadow-2xs cursor-pointer"
                        >
                          ✓ Confirmar
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E5E0D5] text-[#879C7B] space-y-2 animate-fade-in">
                    <p className="text-sm font-semibold text-[#16362C]">
                      Nenhuma sessão pendente encontrada para "{searchQuery}".
                    </p>
                    <p className="text-xs text-[#879C7B]">
                      Verifique se digitou o CPF ou Código corretamente, ou procure a recepção para auxílio.
                    </p>
                  </div>
                )}
              </div>
            ) : mostrarSessoesPrevistas ? (
              /* Caso o administrador/recepcionista tenha ativado para exibir sessões previstas */
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-[#879C7B] tracking-wider uppercase border-b border-slate-100 pb-2">
                  <span>Sessões Previstas para Hoje ({agendamentosPendentes.length})</span>
                  <button
                    type="button"
                    onClick={() => setMostrarSessoesPrevistas(false)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#879C7B] hover:text-[#16362C] font-semibold py-1 px-2.5 rounded-lg border border-[#E5E0D5] hover:bg-slate-50 transition-all cursor-pointer"
                    title="Ocultar lista de sessões do totem"
                  >
                    <EyeOff className="w-3.5 h-3.5 text-[#CCB373]" />
                    <span>Ocultar sessões previstas</span>
                  </button>
                </div>

                {agendamentosPendentes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {agendamentosPendentes.map((agd) => (
                      <div
                        key={agd.id}
                        onClick={() => handleCheckinClick(agd)}
                        className="p-4 rounded-2xl border-2 border-slate-200 hover:border-[#16362C] bg-[#FAF8F5]/60 hover:bg-white cursor-pointer transition-all flex items-center justify-between group shadow-2xs hover:shadow-md"
                      >
                        <div className="space-y-1 min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm sm:text-base text-[#16362C] group-hover:text-[#B89A57] truncate">
                              {agd.pacienteNome}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px] font-bold">
                              {agd.codigo}
                            </span>
                          </div>
                          <div className="text-xs text-[#879C7B] flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-[#CCB373]" />
                            <span>{agd.hora} hrs</span>
                            <span>•</span>
                            <span className="truncate">{agd.medicoNome}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {agd.sala}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="px-4 py-2 rounded-xl bg-[#16362C] text-[#FAF8F5] group-hover:bg-[#0D221C] text-xs font-bold tracking-wide uppercase shrink-0 transition-colors shadow-2xs cursor-pointer"
                        >
                          ✓ Check-in
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E5E0D5] text-[#879C7B] space-y-2">
                    <p className="text-sm font-semibold text-[#16362C]">
                      Não há sessões pendentes de check-in para hoje no momento.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* ESTADO PADRÃO: Sessões previstas ocultas do totem interativo */
              <div className="bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] p-6 sm:p-8 text-center space-y-6">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E0D5] flex items-center justify-center text-[#16362C] shadow-2xs">
                    <ShieldCheck className="w-6 h-6 text-[#16362C]" />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#16362C]">
                    <Lock className="w-3.5 h-3.5 text-[#CCB373]" />
                    <span>Sessões Previstas Ocultas • Privacidade e LGPD</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#879C7B] max-w-md">
                    Para garantir o sigilo dos seus dados, a lista pública de alunos e horários não é exibida na tela do totem.
                  </p>
                </div>

                {/* 3 Passos Guiados */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                  <div className="p-3.5 bg-white rounded-xl border border-[#E5E0D5] space-y-1">
                    <div className="w-6 h-6 rounded-lg bg-[#16362C]/10 text-[#16362C] text-xs font-bold flex items-center justify-center">
                      1
                    </div>
                    <div className="text-xs font-bold text-[#16362C]">Busca no Totem</div>
                    <p className="text-[11px] text-[#879C7B] leading-relaxed">
                      Digite seu Nome, CPF ou Código do voucher no campo de busca acima.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-[#E5E0D5] space-y-1">
                    <div className="w-6 h-6 rounded-lg bg-[#CCB373]/20 text-[#16362C] text-xs font-bold flex items-center justify-center">
                      2
                    </div>
                    <div className="text-xs font-bold text-[#16362C]">Ou Escaneie o QR Code</div>
                    <p className="text-[11px] text-[#879C7B] leading-relaxed">
                      Use a câmera do totem ou o leitor de código de barras do seu celular.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-[#E5E0D5] space-y-1">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                      3
                    </div>
                    <div className="text-xs font-bold text-[#16362C]">Confirmação Direta</div>
                    <p className="text-[11px] text-[#879C7B] leading-relaxed">
                      Sua presença é confirmada e sua sala informada na tela com recibo.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setScannerOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-[#16362C] hover:bg-[#0D221C] text-[#FAF8F5] text-xs font-bold tracking-wide transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-[#CCB373]" />
                    <span>Abrir Leitor de QR Code / Voucher</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMostrarSessoesPrevistas(true)}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E5E0D5] text-[#879C7B] hover:text-[#16362C] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Exibir sessões para auxílio da equipe"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#CCB373]" />
                    <span>Visualizar sessões previstas</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé explicativo do Totem */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-[#879C7B] gap-2">
            <span>ZANE Pilates Studio • Check-in de Presença sincronizado com Google Sheets</span>
            <span>Segurança de Dados Clínicos & Respeito à LGPD</span>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 2: FILA DE CHEGADAS DE HOJE (PAINEL DA RECEPÇÃO)           */}
      {/* ============================================================== */}
      {activeTab === 'fila' && (
        <div className="bg-white rounded-3xl p-6 border border-[#E5E0D5] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-serif-editorial text-2xl font-bold text-[#16362C]">
                Fila de Presença na Recepção
              </h2>
              <p className="text-xs text-[#879C7B]">
                Alunos e pacientes que já realizaram check-in no totem hoje ({agendamentosPresentes.length}).
              </p>
            </div>
          </div>

          {agendamentosPresentes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3">Horário Chegada</th>
                    <th className="py-3 px-3">Código</th>
                    <th className="py-3 px-3">Aluno / Paciente</th>
                    <th className="py-3 px-3">Profissional</th>
                    <th className="py-3 px-3">Sala</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Comprovante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {agendamentosPresentes.map((agd) => (
                    <tr key={agd.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-emerald-800">
                        {agd.checkinEm || agd.hora}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#16362C]">
                        {agd.codigo}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#16362C] text-sm">{agd.pacienteNome}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{agd.pacienteCpf}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{agd.medicoNome}</div>
                        <div className="text-[11px] text-[#CCB373]">{agd.especialidade}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {agd.sala}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-800">
                          {agd.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onOpenReceipt(agd)}
                          className="px-3 py-1 rounded-lg border border-slate-200 text-[#16362C] hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                        >
                          Ver QR Pass
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E5E0D5] text-[#879C7B]">
              Nenhum aluno aguardando na recepção no momento.
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 3: CARTAZ QR CODE PARA IMPRESSÃO NA RECEPÇÃO               */}
      {/* ============================================================== */}
      {activeTab === 'cartaz' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E5E0D5] shadow-xs max-w-xl mx-auto text-center space-y-6">
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-[#16362C]/5 text-[#16362C] text-[11px] font-bold tracking-widest uppercase mb-2 border border-[#CCB373]/30">
              Cartaz Oficial do Studio
            </div>
            <h2 className="font-serif-editorial text-3xl font-bold text-[#16362C]">
              Cartaz de Check-in por QR Code
            </h2>
            <p className="text-xs text-[#879C7B] max-w-sm mx-auto mt-1">
              Imprima este cartaz e posicione no balcão de entrada. Os alunos apontam a câmera do celular e confirmam presença em 3 segundos.
            </p>
          </div>

          {/* Visual Poster Frame */}
          <div className="p-8 bg-[#FAF8F5] rounded-3xl border-2 border-[#E5E0D5] shadow-inner flex flex-col items-center space-y-4">
            <ZaneMedallion size={72} />
            <div className="font-serif-editorial text-2xl font-bold text-[#16362C]">
              ZANE Pilates Studio
            </div>
            <p className="text-xs font-semibold text-[#879C7B] max-w-xs">
              Aponte a câmera do seu smartphone para o QR Code abaixo e confirme sua presença na recepção instantaneamente:
            </p>

            <div className="p-4 bg-white rounded-2xl border-2 border-[#E5E0D5] shadow-md">
              {posterQrUrl ? (
                <img src={posterQrUrl} alt="QR Code Totem" className="w-56 h-56 mx-auto" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
                  Gerando...
                </div>
              )}
            </div>

            <div className="text-[11px] font-mono text-[#879C7B]">
              Totem Digital de Recepção • ZANE Pilates Studio
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-full bg-[#16362C] text-[#FAF8F5] hover:bg-[#0D221C] text-xs font-bold tracking-wider uppercase transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#CCB373]" />
              <span>Imprimir Cartaz</span>
            </button>
            <a
              href={posterQrUrl}
              download="cartaz-qrcode-zane-pilates.png"
              className="px-5 py-2.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold tracking-wider uppercase transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#CCB373]" />
              <span>Baixar Imagem PNG</span>
            </a>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 4: ENCAIXE EXPRESSO / WALK-IN                             */}
      {/* ============================================================== */}
      {activeTab === 'expresso' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E0D5] shadow-xs max-w-xl mx-auto space-y-6">
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold tracking-widest uppercase mb-1">
              ⚡ Recepção Ágil
            </div>
            <h2 className="font-serif-editorial text-2xl font-bold text-[#16362C]">
              Registrar Check-in Expresso (Encaixe)
            </h2>
            <p className="text-xs text-[#879C7B]">
              Para alunos que chegaram sem agendamento prévio no sistema hoje.
            </p>
          </div>

          <form onSubmit={handleExpressSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#16362C] mb-1">
                Aluno Cadastrado *
              </label>
              <select
                value={expressPacienteId}
                onChange={(e) => setExpressPacienteId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-[#16362C]"
                required
              >
                <option value="">-- Selecione o Aluno --</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} • CPF: {p.cpf} • {p.convenio}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16362C] mb-1">
                Profissional Designado *
              </label>
              <select
                value={expressMedicoId}
                onChange={(e) => {
                  setExpressMedicoId(e.target.value);
                  const m = medicos.find((x) => x.id === e.target.value);
                  if (m) setExpressSala(m.sala);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-[#16362C]"
                required
              >
                <option value="">-- Selecione o Profissional --</option>
                {medicos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome} • {m.especialidade} ({m.sala})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16362C] mb-1">
                Sala / Espaço de Atendimento
              </label>
              <input
                type="text"
                placeholder="Ex: Studio 1 - Reformer & Cadillac"
                value={expressSala}
                onChange={(e) => setExpressSala(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-[#16362C]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#16362C] hover:bg-[#0D221C] text-[#FAF8F5] text-xs font-bold tracking-wider uppercase transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#CCB373]" />
              <span>Confirmar Entrada & Notificar Sala</span>
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
