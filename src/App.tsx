import React, { useState, useEffect } from 'react';
import { 
  loadStoredState, 
  saveStoredState, 
  syncToGoogleSheets,
  getHojeIso 
} from './services/storage';
import { 
  AppState, 
  Agendamento, 
  Paciente, 
  Medico, 
  ProntuarioRegistro 
} from './types';
import { Header } from './components/Header';
import { HeroReference } from './components/HeroReference';
import { BookingModal } from './components/BookingModal';
import { AgendamentoReceiptModal } from './components/AgendamentoReceiptModal';
import { CheckinTotem } from './components/CheckinTotem';
import { ProntuarioMedico } from './components/ProntuarioMedico';
import { PacientesList } from './components/PacientesList';
import { ProfissionaisManager } from './components/ProfissionaisManager';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { 
  Calendar, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle, 
  FileText, 
  Filter, 
  QrCode,
  ShieldCheck,
  Stethoscope,
  Database,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const [state, setState] = useState<AppState>(loadStoredState);
  const [activeTab, setActiveTab] = useState<string>('inicio');

  // Modals state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [sheetsModalOpen, setSheetsModalOpen] = useState(false);
  
  const [receiptAgendamento, setReceiptAgendamento] = useState<Agendamento | null>(null);
  const [initialEspecialidadeForBooking, setInitialEspecialidadeForBooking] = useState<string>('');
  const [isProfissionalAdminUnlocked, setIsProfissionalAdminUnlocked] = useState(false);

  // Check URL params for solo totem kiosk mode (?totem=true)
  const isSoloTotem = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('totem');

  // Persist state on change
  useEffect(() => {
    saveStoredState(state);
  }, [state]);

  // Se a URL tiver ?totem=true, define a aba checkin automaticamente
  useEffect(() => {
    if (isSoloTotem) {
      setActiveTab('checkin');
    }
  }, [isSoloTotem]);

  const hoje = getHojeIso();
  const agendamentosHoje = state.agendamentos.filter((a) => a.data === hoje && a.status !== 'Cancelado');
  const presentesHoje = agendamentosHoje.filter((a) => a.status === 'Presente').length;

  // Registrar log de sincronização
  const recordSyncLog = (tipo: string, detalhe: string, sucesso: boolean) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setState((prev) => ({
      ...prev,
      sheetsConfig: {
        ...prev.sheetsConfig,
        ultimaSincronizacao: timestamp,
        statusSincronizacao: sucesso ? 'success' : 'error',
        logs: [
          { timestamp, tipo, detalhe, sucesso },
          ...prev.sheetsConfig.logs.slice(0, 19),
        ],
      },
    }));
  };

  // Sincronização em background com o Google Sheets
  const triggerBackgroundSync = async (
    sheetName: 'Agendamentos' | 'Pacientes' | 'Médicos' | 'Prontuários_PEP',
    op: 'add' | 'update' | 'delete' | 'sync_all',
    data: any
  ) => {
    if (!state.sheetsConfig.autoSyncEnabled || !state.sheetsConfig.webhookUrl) return;

    try {
      const res = await syncToGoogleSheets(sheetName, op, data, state.sheetsConfig.webhookUrl);
      recordSyncLog(
        `Sync ${sheetName}`,
        res.success ? `Registro sincronizado no Google Sheets com sucesso` : `Aviso: ${res.message}`,
        res.success
      );
    } catch (err: any) {
      recordSyncLog(`Erro ${sheetName}`, err.message || 'Falha ao conectar no webhook', false);
    }
  };

  // 1. Confirmar Novo Agendamento
  const handleConfirmBooking = async (novoAgendamento: Agendamento, novoPaciente?: Paciente) => {
    setState((prev) => {
      const updatedPacientes = novoPaciente
        ? [...prev.pacientes, novoPaciente]
        : prev.pacientes;
      return {
        ...prev,
        agendamentos: [novoAgendamento, ...prev.agendamentos],
        pacientes: updatedPacientes,
      };
    });

    setBookingModalOpen(false);
    setReceiptAgendamento(novoAgendamento);
    setReceiptModalOpen(true);

    // Sincroniza com Google Sheets
    await triggerBackgroundSync('Agendamentos', 'add', novoAgendamento);
    if (novoPaciente) {
      await triggerBackgroundSync('Pacientes', 'add', novoPaciente);
    }
  };

  // 2. Realizar Check-in (via Totem ou Recepção)
  const handlePerformCheckin = async (agendamentoId: string) => {
    const horaAgora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let updatedAgd: Agendamento | null = null;
    setState((prev) => {
      const updatedList = prev.agendamentos.map((a) => {
        if (a.id === agendamentoId) {
          updatedAgd = { ...a, status: 'Presente' as const, checkinEm: horaAgora };
          return updatedAgd;
        }
        return a;
      });
      return { ...prev, agendamentos: updatedList };
    });

    if (updatedAgd) {
      await triggerBackgroundSync('Agendamentos', 'update', updatedAgd);
    }
  };

  // 3. Check-in Expresso (Walk-in)
  const handleQuickWalkin = async (novoAgendamento: Agendamento) => {
    setState((prev) => ({
      ...prev,
      agendamentos: [novoAgendamento, ...prev.agendamentos],
    }));

    await triggerBackgroundSync('Agendamentos', 'add', novoAgendamento);
  };

  // 4. Salvar Evolução no Prontuário Médico (PEP)
  const handleSalvarEvolucao = async (registro: ProntuarioRegistro, agendamentoId?: string) => {
    setState((prev) => {
      let updatedAgds = prev.agendamentos;
      if (agendamentoId) {
        updatedAgds = prev.agendamentos.map((a) =>
          a.id === agendamentoId ? { ...a, status: 'Concluído' as const } : a
        );
      }
      return {
        ...prev,
        prontuarios: [registro, ...prev.prontuarios],
        agendamentos: updatedAgds,
      };
    });

    await triggerBackgroundSync('Prontuários_PEP', 'add', registro);
    if (agendamentoId) {
      const agd = state.agendamentos.find((a) => a.id === agendamentoId);
      if (agd) {
        await triggerBackgroundSync('Agendamentos', 'update', { ...agd, status: 'Concluído' });
      }
    }
  };

  // 5. Atualizar Status de Agendamento
  const handleAtualizarStatusAgendamento = async (id: string, novoStatus: any) => {
    let updated: Agendamento | null = null;
    setState((prev) => {
      const agds = prev.agendamentos.map((a) => {
        if (a.id === id) {
          updated = { ...a, status: novoStatus };
          return updated;
        }
        return a;
      });
      return { ...prev, agendamentos: agds };
    });

    if (updated) {
      await triggerBackgroundSync('Agendamentos', 'update', updated);
    }
  };

  // 6. Adicionar, Atualizar e Excluir Pacientes
  const handleAddPaciente = async (novo: Paciente) => {
    setState((prev) => ({
      ...prev,
      pacientes: [novo, ...prev.pacientes],
    }));

    await triggerBackgroundSync('Pacientes', 'add', novo);
  };

  const handleUpdatePaciente = async (atualizado: Paciente) => {
    setState((prev) => ({
      ...prev,
      pacientes: prev.pacientes.map((p) => (p.id === atualizado.id ? atualizado : p)),
    }));

    await triggerBackgroundSync('Pacientes', 'update', atualizado);
  };

  const handleDeletePaciente = async (id: string) => {
    const toDelete = state.pacientes.find((p) => p.id === id);
    setState((prev) => ({
      ...prev,
      pacientes: prev.pacientes.filter((p) => p.id !== id),
    }));

    if (toDelete) {
      await triggerBackgroundSync('Pacientes', 'delete', toDelete);
    }
  };

  // 7. Autenticação e Gestão de Profissionais (Senha ZANEPS)
  const handleAuthenticateProfissional = (pwd: string): boolean => {
    if (pwd.trim().toUpperCase() === 'ZANEPS') {
      setIsProfissionalAdminUnlocked(true);
      return true;
    }
    return false;
  };

  const handleAddMedico = async (novo: Medico) => {
    setState((prev) => ({
      ...prev,
      medicos: [...prev.medicos, novo],
    }));

    await triggerBackgroundSync('Médicos', 'add', novo);
  };

  const handleUpdateMedico = async (atualizado: Medico) => {
    setState((prev) => ({
      ...prev,
      medicos: prev.medicos.map((m) => (m.id === atualizado.id ? atualizado : m)),
    }));

    await triggerBackgroundSync('Médicos', 'update', atualizado);
  };

  const handleDeleteMedico = async (id: string) => {
    const toDelete = state.medicos.find((m) => m.id === id);
    setState((prev) => ({
      ...prev,
      medicos: prev.medicos.filter((m) => m.id !== id),
    }));

    if (toDelete) {
      await triggerBackgroundSync('Médicos', 'delete', toDelete);
    }
  };

  // 8. Sincronização Completa de Todas as Tabelas
  const handleTriggerFullSync = async () => {
    const url = state.sheetsConfig.webhookUrl;
    if (!url) throw new Error('URL do Webhook vazia');

    setState((prev) => ({
      ...prev,
      sheetsConfig: { ...prev.sheetsConfig, statusSincronizacao: 'syncing' },
    }));

    try {
      await syncToGoogleSheets('Agendamentos', 'sync_all', state.agendamentos, url);
      await syncToGoogleSheets('Pacientes', 'sync_all', state.pacientes, url);
      await syncToGoogleSheets('Médicos', 'sync_all', state.medicos, url);
      await syncToGoogleSheets('Prontuários_PEP', 'sync_all', state.prontuarios, url);

      recordSyncLog('Sync Total', 'Todas as 4 tabelas sincronizadas com o Google Sheets!', true);
    } catch (err: any) {
      recordSyncLog('Sync Total', err.message || 'Erro durante sincronização', false);
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F1] text-[#16362C] flex flex-col font-sans">
      
      {/* Top Bar Header - Limpo, sem botões de ação ou Google Sheets */}
      {!isSoloTotem && (
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          todayCount={agendamentosHoje.length}
          presentCount={presentesHoje}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        
        {/* TAB 1: INÍCIO / HERO REFERENCE (STYLE OF IMAGE.PNG) */}
        {activeTab === 'inicio' && (
          <HeroReference
            onAgendarClick={() => {
              setInitialEspecialidadeForBooking('');
              setBookingModalOpen(true);
            }}
            onTotemClick={() => setActiveTab('checkin')}
            onProntuarioClick={() => setActiveTab('prontuario')}
            medicos={state.medicos}
            agendamentosHoje={agendamentosHoje}
            onSelectEspecialidade={(esp) => {
              setInitialEspecialidadeForBooking(esp);
              setBookingModalOpen(true);
            }}
          />
        )}

        {/* TAB 2: AGENDAMENTOS E SESSÕES NO STUDIO */}
        {activeTab === 'agendamento' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-[#E5E0D5] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#CCB373] tracking-widest uppercase">
                  ZANE Pilates Studio
                </span>
                <h2 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-[#16362C]">
                  Sessões & Consultas Agendadas
                </h2>
                <p className="text-xs text-[#879C7B]">
                  Gerenciamento de horários do estúdio, salas de Pilates e emissão de vouchers com QR Code.
                </p>
              </div>

              <button
                onClick={() => {
                  setInitialEspecialidadeForBooking('');
                  setBookingModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-full bg-[#16362C] hover:bg-[#0D221C] text-[#FAF8F5] text-xs font-bold tracking-wider uppercase transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#CCB373]" />
                <span>Nova Sessão</span>
              </button>
            </div>

            {/* List of all appointments */}
            <div className="bg-white rounded-3xl p-6 border border-[#E5E0D5] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-[#879C7B] uppercase tracking-wider">
                  Histórico de Sessões ({state.agendamentos.length})
                </span>
                <span className="text-xs text-[#16362C] font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Sincronizado no Google Sheets
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-3">Código</th>
                      <th className="py-3 px-3">Data & Hora</th>
                      <th className="py-3 px-3">Aluno / Paciente</th>
                      <th className="py-3 px-3">Profissional</th>
                      <th className="py-3 px-3">Sala / Estúdio</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {state.agendamentos.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[#16362C]">
                          {a.codigo}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#16362C]">
                            {a.data.split('-').reverse().join('/')}
                          </div>
                          <div className="text-[#879C7B] font-semibold text-[11px]">{a.hora} hrs</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#16362C] text-sm">{a.pacienteNome}</div>
                          <div className="text-slate-400 font-mono text-[11px]">{a.pacienteCpf}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{a.medicoNome}</div>
                          <div className="text-[11px] text-[#CCB373]">{a.especialidade}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          {a.sala}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                              a.status === 'Presente'
                                ? 'bg-emerald-100 text-emerald-800'
                                : a.status === 'Em atendimento'
                                ? 'bg-[#16362C]/10 text-[#16362C]'
                                : a.status === 'Concluído'
                                ? 'bg-purple-100 text-purple-800'
                                : a.status === 'Cancelado'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                          {a.status === 'Agendado' && (
                            <button
                              onClick={() => handlePerformCheckin(a.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold hover:bg-emerald-100 text-[11px] cursor-pointer"
                            >
                              Check-in
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setReceiptAgendamento(a);
                              setReceiptModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-[#16362C] hover:bg-slate-100 text-[11px] font-semibold cursor-pointer"
                          >
                            QR Pass
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CHECK-IN QR & TOTEM */}
        {activeTab === 'checkin' && (
          <CheckinTotem
            agendamentos={state.agendamentos}
            medicos={state.medicos}
            pacientes={state.pacientes}
            onPerformCheckin={handlePerformCheckin}
            onQuickWalkinCheckin={handleQuickWalkin}
            onOpenReceipt={(agd) => {
              setReceiptAgendamento(agd);
              setReceiptModalOpen(true);
            }}
            isSoloTotemMode={isSoloTotem}
          />
        )}

        {/* TAB 4: PRONTUÁRIO MÉDICO ELETRÔNICO (PEP) */}
        {activeTab === 'prontuario' && (
          <ProntuarioMedico
            agendamentos={state.agendamentos}
            medicos={state.medicos}
            pacientes={state.pacientes}
            prontuarios={state.prontuarios}
            onSalvarEvolucao={handleSalvarEvolucao}
            onAtualizarStatusAgendamento={handleAtualizarStatusAgendamento}
          />
        )}

        {/* TAB 5: ALUNOS & PACIENTES COM EDIÇÃO COMPLETA */}
        {activeTab === 'pacientes' && (
          <PacientesList
            pacientes={state.pacientes}
            agendamentos={state.agendamentos}
            prontuarios={state.prontuarios}
            onAddPaciente={handleAddPaciente}
            onUpdatePaciente={handleUpdatePaciente}
            onDeletePaciente={handleDeletePaciente}
            onScheduleForPatient={(pac) => {
              setBookingModalOpen(true);
            }}
            onViewProntuario={(pac) => {
              setActiveTab('prontuario');
            }}
          />
        )}

        {/* TAB 6: CORPO DE FISIOTERAPEUTAS & MÉDICOS (PROTEGIDO COM SENHA ZANEPS) */}
        {activeTab === 'profissionais' && (
          <ProfissionaisManager
            medicos={state.medicos}
            onAddMedico={handleAddMedico}
            onUpdateMedico={handleUpdateMedico}
            onDeleteMedico={handleDeleteMedico}
            isAuthenticated={isProfissionalAdminUnlocked}
            onAuthenticate={handleAuthenticateProfissional}
            onLock={() => setIsProfissionalAdminUnlocked(false)}
          />
        )}

      </main>

      {/* 
        FOOTER OFICIAL COM INTEGRAÇÃO GOOGLE SHEETS DEDICADA NO FIM LÁ EMBAIXO
        Conforme solicitado: Google Sheets posicionado exclusivamente no rodapé
      */}
      {!isSoloTotem && (
        <footer className="border-t border-[#E5E0D5] bg-[#FAF8F5] py-8 px-4 md:px-8 mt-12 text-xs">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Seção Dedicada do Google Sheets no Rodapé */}
            <div className="bg-white rounded-3xl p-5 border border-[#CCB373]/40 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#16362C] text-[#CCB373] flex items-center justify-center shrink-0 shadow-xs">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      state.sheetsConfig.statusSincronizacao === 'syncing'
                        ? 'bg-amber-500 animate-spin'
                        : state.sheetsConfig.statusSincronizacao === 'error'
                        ? 'bg-rose-500'
                        : 'bg-emerald-600 animate-pulse'
                    }`}></span>
                    <span className="font-bold text-sm text-[#16362C]">
                      Google Sheets: {state.sheetsConfig.statusSincronizacao === 'syncing' ? 'Sincronizando...' : 'Online & Conectado'}
                    </span>
                    <span className="text-[10px] bg-[#16362C]/5 text-[#16362C] px-2 py-0.5 rounded-full font-mono font-semibold">
                      Último sincronismo: {state.sheetsConfig.ultimaSincronizacao || 'Registrado agora'}
                    </span>
                  </div>
                  <p className="text-xs text-[#879C7B] mt-0.5">
                    Todas as consultas, presenças, prontuários e pacientes são salvos e sincronizados automaticamente na planilha.
                  </p>
                </div>
              </div>

              {/* Ações da Planilha */}
              <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                <button
                  onClick={handleTriggerFullSync}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#16362C] text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#16362C]" />
                  <span>Sincronizar Agora</span>
                </button>

                <button
                  onClick={() => setSheetsModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#16362C] hover:bg-[#0D221C] text-[#FAF8F5] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5 text-[#CCB373]" />
                  <span>Configurar Planilha & Logs</span>
                </button>
              </div>
            </div>

            {/* Linha de Copyright e Navegação do Rodapé */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-[#879C7B]">
              <div className="flex items-center gap-2">
                <span className="font-serif-editorial text-base font-bold text-[#16362C] tracking-wider uppercase">
                  ZANE Pilates Studio
                </span>
                <span>•</span>
                <span>Pilates Clínico, Postura, Fisioterapia & Check-in QR</span>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <button
                  onClick={() => setActiveTab('profissionais')}
                  className="hover:text-[#16362C] transition-colors"
                >
                  Painel Profissionais 🔒
                </button>
                <button
                  onClick={() => setActiveTab('checkin')}
                  className="hover:text-[#16362C] transition-colors"
                >
                  Totem Recepção
                </button>
                <button
                  onClick={() => setActiveTab('agendamento')}
                  className="hover:text-[#16362C] transition-colors"
                >
                  Agendar Sessão
                </button>
              </div>
            </div>

          </div>
        </footer>
      )}

      {/* MODAL 1: AGENDAMENTO ONLINE */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        medicos={state.medicos}
        pacientes={state.pacientes}
        agendamentos={state.agendamentos}
        onConfirmBooking={handleConfirmBooking}
        initialEspecialidade={initialEspecialidadeForBooking}
      />

      {/* MODAL 2: VOUCHER / COMPROVANTE COM QR CODE */}
      <AgendamentoReceiptModal
        agendamento={receiptAgendamento}
        medico={state.medicos.find((m) => m.id === receiptAgendamento?.medicoId)}
        onClose={() => {
          setReceiptModalOpen(false);
          setReceiptAgendamento(null);
        }}
        onGoToCheckin={() => setActiveTab('checkin')}
      />

      {/* MODAL 3: CONFIGURAÇÃO & STATUS DO GOOGLE SHEETS */}
      <GoogleSheetsModal
        isOpen={sheetsModalOpen}
        onClose={() => setSheetsModalOpen(false)}
        sheetsConfig={state.sheetsConfig}
        appState={state}
        onUpdateWebhookUrl={(url) => {
          setState((prev) => ({
            ...prev,
            sheetsConfig: { ...prev.sheetsConfig, webhookUrl: url },
          }));
        }}
        onTriggerFullSync={handleTriggerFullSync}
      />

    </div>
  );
}
