import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Pill, 
  Plus, 
  Trash2, 
  Printer, 
  Download, 
  Activity, 
  Search, 
  Save, 
  History, 
  Award,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { 
  Agendamento, 
  Medico, 
  Paciente, 
  ProntuarioRegistro, 
  PrescricaoItem, 
  SinaisVitais 
} from '../types';
import { getHojeIso, getHoraAtual } from '../services/storage';

interface ProntuarioMedicoProps {
  agendamentos: Agendamento[];
  medicos: Medico[];
  pacientes: Paciente[];
  prontuarios: ProntuarioRegistro[];
  onSalvarEvolucao: (registro: ProntuarioRegistro, agendamentoId?: string) => Promise<void>;
  onAtualizarStatusAgendamento: (id: string, novoStatus: any) => Promise<void>;
}

// CIDs comuns para atalho rápido
const CIDS_FREQUENTES = [
  { codigo: 'I10', descricao: 'Hipertensão essencial (primária)' },
  { codigo: 'E11', descricao: 'Diabetes mellitus não-insulino-dependente' },
  { codigo: 'J00', descricao: 'Nasofaringite aguda (resfriado comum)' },
  { codigo: 'M54.5', descricao: 'Dor lombar baixa / Lombalgia' },
  { codigo: 'R51', descricao: 'Cefaleia / Enxaqueca' },
  { codigo: 'K29.7', descricao: 'Gastrite não especificada' },
  { codigo: 'F41.1', descricao: 'Ansiedade generalizada' },
  { codigo: 'Z00.0', descricao: 'Exame médico geral de rotina / Check-up' },
];

export const ProntuarioMedico: React.FC<ProntuarioMedicoProps> = ({
  agendamentos,
  medicos,
  pacientes,
  prontuarios,
  onSalvarEvolucao,
  onAtualizarStatusAgendamento,
}) => {
  const [selectedMedicoId, setSelectedMedicoId] = useState<string>(medicos[0]?.id || '');
  const [activeAgendamento, setActiveAgendamento] = useState<Agendamento | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'fila' | 'atendimento' | 'historico'>('fila');
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState<Paciente | null>(null);

  // Form State do Prontuário em Atendimento
  const [queixaPrincipal, setQueixaPrincipal] = useState('');
  const [historiaDoencaAtual, setHistoriaDoencaAtual] = useState('');
  
  // Sinais Vitais
  const [pa, setPa] = useState('120/80');
  const [fc, setFc] = useState('72');
  const [temp, setTemp] = useState('36.5');
  const [satO2, setSatO2] = useState('98');
  const [peso, setPeso] = useState('70');
  const [altura, setAltura] = useState('1.70');
  const [imc, setImc] = useState('24.2');
  const [classificacaoImc, setClassificacaoImc] = useState('Peso normal');

  // Exame Físico & Diagnóstico
  const [exameFisico, setExameFisico] = useState('Bom estado geral, corado, hidratado, eupneico. ACV: RCR 2T sem sopros. AR: MV+ sem RA. Abdome flácido e indolor.');
  const [cidCodigo, setCidCodigo] = useState('Z00.0');
  const [cidDescricao, setCidDescricao] = useState('Exame médico geral de rotina / Check-up');
  const [condutaClinica, setCondutaClinica] = useState('');
  
  // Prescrições Dinâmicas
  const [prescricoes, setPrescricoes] = useState<PrescricaoItem[]>([
    {
      medicamento: 'Dipirona Monoidratada 500mg',
      dose: '1 comprimido',
      frequencia: 'De 6 em 6 horas (se dor ou febre)',
      duracao: '3 a 5 dias',
      orientacoes: 'Tomar com água após as refeições.',
    },
  ]);

  // Exames Solicitados
  const [examesSelecionados, setExamesSelecionados] = useState<string[]>([
    'Hemograma Completo',
    'Glicemia de Jejum',
  ]);
  const [novoExameInput, setNovoExameInput] = useState('');
  const [atestadoDias, setAtestadoDias] = useState<number>(0);
  const [observacoesPrivadas, setObservacoesPrivadas] = useState('');

  const [saving, setSaving] = useState(false);
  const [receitaModalOpen, setReceitaModalOpen] = useState(false);

  // Cálculo de IMC automático quando peso ou altura mudam
  useEffect(() => {
    const p = parseFloat(peso.replace(',', '.'));
    let a = parseFloat(altura.replace(',', '.'));
    if (a > 3) a = a / 100; // Converte se digitou em cm (ex: 175 -> 1.75)

    if (p > 0 && a > 0) {
      const val = p / (a * a);
      const imcFormatado = val.toFixed(1);
      setImc(imcFormatado);

      if (val < 18.5) setClassificacaoImc('Abaixo do peso');
      else if (val < 25) setClassificacaoImc('Peso normal');
      else if (val < 30) setClassificacaoImc('Sobrepeso leve');
      else if (val < 35) setClassificacaoImc('Obesidade Grau I');
      else setClassificacaoImc('Obesidade Grau II / III');
    }
  }, [peso, altura]);

  const currentMedico = medicos.find((m) => m.id === selectedMedicoId) || medicos[0];
  const hoje = getHojeIso();

  // Fila de hoje para o médico selecionado
  const filaMedico = agendamentos.filter(
    (a) => a.medicoId === selectedMedicoId && a.data === hoje && a.status !== 'Cancelado'
  ).sort((a, b) => a.hora.localeCompare(b.hora));

  // Paciente selecionado
  const currentPaciente = activeAgendamento
    ? pacientes.find((p) => p.id === activeAgendamento.pacienteId)
    : null;

  // Iniciar Atendimento
  const handleIniciarAtendimento = (agd: Agendamento) => {
    setActiveAgendamento(agd);
    onAtualizarStatusAgendamento(agd.id, 'Em atendimento');
    setActiveSubTab('atendimento');

    // Preenche campos iniciais com base na queixa relatada
    setQueixaPrincipal(agd.observacoes || 'Consulta de rotina');
    setHistoriaDoencaAtual(`Paciente comparece para ${agd.tipoConsulta}. Relata início dos sintomas recentemente.`);
  };

  // Adicionar item na prescrição
  const handleAddPrescricao = () => {
    setPrescricoes([
      ...prescricoes,
      { medicamento: '', dose: '', frequencia: '', duracao: '', orientacoes: '' },
    ]);
  };

  const handleUpdatePrescricao = (index: number, field: keyof PrescricaoItem, val: string) => {
    const copy = [...prescricoes];
    copy[index][field] = val;
    setPrescricoes(copy);
  };

  const handleRemovePrescricao = (index: number) => {
    setPrescricoes(prescricoes.filter((_, i) => i !== index));
  };

  const handleAddExame = () => {
    if (novoExameInput.trim()) {
      setExamesSelecionados([...examesSelecionados, novoExameInput.trim()]);
      setNovoExameInput('');
    }
  };

  const handleRemoveExame = (exame: string) => {
    setExamesSelecionados(examesSelecionados.filter((e) => e !== exame));
  };

  // Concluir e Salvar no PEP
  const handleSalvarConcluir = async () => {
    if (!activeAgendamento || !currentPaciente) {
      alert('Nenhuma consulta ativa selecionada.');
      return;
    }

    setSaving(true);
    try {
      const sinaisVitaisObj: SinaisVitais = {
        pressaoArterial: pa,
        freqCardiaca: fc,
        temperatura: temp,
        saturacaoO2: satO2,
        peso,
        altura,
        imc,
        classificacaoImc,
      };

      const registro: ProntuarioRegistro = {
        id: 'prt-' + Date.now().toString(36),
        agendamentoId: activeAgendamento.id,
        pacienteId: currentPaciente.id,
        pacienteNome: currentPaciente.nome,
        medicoId: currentMedico.id,
        medicoNome: currentMedico.nome,
        crm: currentMedico.crm,
        especialidade: currentMedico.especialidade,
        data: hoje,
        hora: getHoraAtual(),
        queixaPrincipal,
        historiaDoencaAtual,
        sinaisVitais: sinaisVitaisObj,
        exameFisico,
        cid10Codigo: cidCodigo,
        cid10Descricao: cidDescricao,
        condutaClinica,
        prescricoes: prescricoes.filter((p) => p.medicamento.trim()),
        examesSolicitados: examesSelecionados,
        atestadoDias,
        observacoes: observacoesPrivadas,
        criadoEm: new Date().toISOString(),
      };

      await onSalvarEvolucao(registro, activeAgendamento.id);
      await onAtualizarStatusAgendamento(activeAgendamento.id, 'Concluído');

      alert(`Consulta finalizada e gravada com sucesso no Prontuário Eletrônico e Google Sheets!`);
      setActiveAgendamento(null);
      setActiveSubTab('fila');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar no prontuário.');
    } finally {
      setSaving(false);
    }
  };

  // Histórico de prontuários do paciente ativo
  const historicoConsultasPaciente = prontuarios.filter(
    (p) => p.pacienteId === (selectedPatientForHistory?.id || currentPaciente?.id)
  );

  return (
    <div className="space-y-6">
      
      {/* Top Bar com Seleção do Médico */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#CBD5E1]/70 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={currentMedico?.foto}
            alt={currentMedico?.nome}
            className="w-12 h-12 rounded-full object-cover border-2 border-[#16362C]"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-base">{currentMedico?.nome}</span>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                {currentMedico?.crm}
              </span>
            </div>
            <div className="text-xs text-[#16362C] font-semibold">
              {currentMedico?.especialidade} • {currentMedico?.sala}
            </div>
          </div>
        </div>

        {/* Doctor Switcher & Subtab switches */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          <select
            value={selectedMedicoId}
            onChange={(e) => {
              setSelectedMedicoId(e.target.value);
              setActiveAgendamento(null);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-[#16362C]"
          >
            {medicos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome} ({m.especialidade})
              </option>
            ))}
          </select>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('fila')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'fila' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Fila de Espera ({filaMedico.length})
            </button>
            <button
              onClick={() => setActiveSubTab('atendimento')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'atendimento' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Consulta Ativa {activeAgendamento ? '●' : ''}
            </button>
            <button
              onClick={() => {
                if (currentPaciente) setSelectedPatientForHistory(currentPaciente);
                setActiveSubTab('historico');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'historico' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Histórico PEP
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUBTAB 1: FILA DE ATENDIMENTO DO MÉDICO NO DIA                 */}
      {/* ============================================================== */}
      {activeSubTab === 'fila' && (
        <div className="bg-white rounded-3xl p-6 border border-[#CBD5E1]/70 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif-editorial text-2xl font-bold text-[#1E293B]">
                Fila de Consultas de Hoje • {currentMedico?.nome}
              </h2>
              <p className="text-xs text-slate-500">
                Acompanhe os pacientes na recepção (check-in realizado) e inicie o atendimento com 1 clique.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 font-mono">
              {new Date().toLocaleDateString('pt-BR')}
            </span>
          </div>

          {filaMedico.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filaMedico.map((agd) => {
                const pac = pacientes.find((p) => p.id === agd.pacienteId);
                const isPresente = agd.status === 'Presente';
                const isEmAtendimento = agd.status === 'Em atendimento';
                const isConcluido = agd.status === 'Concluído';

                return (
                  <div
                    key={agd.id}
                    className={`py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl p-3 transition-colors ${
                      isPresente
                        ? 'bg-emerald-50/60 border border-emerald-200'
                        : isEmAtendimento
                        ? 'bg-blue-50/60 border border-blue-200'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-center px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-2xs shrink-0">
                        <div className="font-mono text-sm font-bold text-slate-800">{agd.hora}</div>
                        <div className="text-[10px] text-slate-400">{agd.tipoConsulta}</div>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{agd.pacienteNome}</span>
                          <span className="font-mono text-[11px] text-slate-400">({agd.codigo})</span>
                          {pac?.convenio && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                              {pac.convenio}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {agd.observacoes || pac?.queixaPrincipal || 'Sem queixas registradas'}
                        </div>
                        {pac?.alergias && pac.alergias.toLowerCase() !== 'nenhuma' && (
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full mt-1 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            Alergia: {pac.alergias}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {/* Status Badge */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          isPresente
                            ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                            : isEmAtendimento
                            ? 'bg-blue-100 text-blue-800'
                            : isConcluido
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isPresente
                          ? `● Na Recepção (${agd.checkinEm || 'Recente'})`
                          : isEmAtendimento
                          ? '● Em Consulta'
                          : isConcluido
                          ? '✓ Concluído'
                          : 'Aguardando Chegada'}
                      </span>

                      {/* Primary Action Button */}
                      {!isConcluido ? (
                        <button
                          onClick={() => handleIniciarAtendimento(agd)}
                          className="px-4 py-2 rounded-xl bg-[#16362C] hover:bg-[#0D221C] text-white text-xs font-bold tracking-wide uppercase transition-all shadow-2xs flex items-center gap-1.5"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>{isEmAtendimento ? 'Continuar PEP' : 'Chamar & Abrir PEP'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (pac) setSelectedPatientForHistory(pac);
                            setActiveSubTab('historico');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100"
                        >
                          Ver Registro
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
              Nenhuma consulta agendada para {currentMedico?.nome} hoje.
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBTAB 2: FICHA CLÍNICA / PEP ATIVO                            */}
      {/* ============================================================== */}
      {activeSubTab === 'atendimento' && (
        <div className="space-y-6">
          {!activeAgendamento ? (
            <div className="bg-white rounded-3xl p-8 border border-[#CBD5E1]/70 shadow-sm text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-[#16362C] rounded-full flex items-center justify-center mx-auto">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="font-serif-editorial text-2xl font-bold text-slate-800">
                Nenhuma Consulta Selecionada no Momento
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Retorne à <strong>Fila de Espera</strong> e clique em <strong>"Chamar & Abrir PEP"</strong> no paciente que deseja atender.
              </p>
              <button
                onClick={() => setActiveSubTab('fila')}
                className="px-4 py-2 rounded-full bg-[#16362C] text-white text-xs font-bold"
              >
                Ver Fila de Espera
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#CBD5E1]/70 shadow-sm space-y-8">
              
              {/* Header do Paciente no Prontuário */}
              <div className="p-4 bg-[#E9EEF4] rounded-2xl border border-[#CBD5E1] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#16362C] text-white flex items-center justify-center font-bold text-lg font-serif">
                    {currentPaciente?.nome.charAt(0) || 'P'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif-editorial text-xl font-bold text-slate-900">
                        {currentPaciente?.nome}
                      </span>
                      <span className="bg-white text-slate-700 text-[11px] font-mono px-2 py-0.5 rounded-full border border-slate-300">
                        CPF: {currentPaciente?.cpf}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2 mt-0.5">
                      <span>Nasc: {currentPaciente?.dataNascimento}</span>
                      <span>•</span>
                      <span>Convênio: <strong>{currentPaciente?.convenio}</strong></span>
                      <span>•</span>
                      <span>Tel: {currentPaciente?.telefone}</span>
                    </div>
                  </div>
                </div>

                {/* Badges de Alerta de Alergia */}
                <div className="flex flex-wrap items-center gap-2">
                  {currentPaciente?.alergias && currentPaciente.alergias.toLowerCase() !== 'nenhuma' ? (
                    <div className="px-3 py-1.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>ALERGIAS: {currentPaciente.alergias}</span>
                    </div>
                  ) : (
                    <div className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-medium">
                      Sem alergias relatadas
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (currentPaciente) setSelectedPatientForHistory(currentPaciente);
                      setActiveSubTab('historico');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
                  >
                    <History className="w-3.5 h-3.5 text-[#16362C]" />
                    <span>Ver Prontuário Anterior</span>
                  </button>
                </div>
              </div>

              {/* SEÇÃO 1: SINAIS VITAIS & BIOMETRIA */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#16362C]" />
                    1. Sinais Vitais & Dados Antropométricos
                  </h3>
                  <span className="text-[11px] text-slate-400">Classificação IMC automática</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase">PA (mmHg)</label>
                    <input
                      type="text"
                      value={pa}
                      onChange={(e) => setPa(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden"
                      placeholder="120/80"
                    />
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase">FC (bpm)</label>
                    <input
                      type="text"
                      value={fc}
                      onChange={(e) => setFc(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden"
                      placeholder="72"
                    />
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase">Temp (°C)</label>
                    <input
                      type="text"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden"
                      placeholder="36.5"
                    />
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase">SatO2 (%)</label>
                    <input
                      type="text"
                      value={satO2}
                      onChange={(e) => setSatO2(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden"
                      placeholder="98"
                    />
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase">Peso (kg)</label>
                    <input
                      type="text"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden"
                      placeholder="70.0"
                    />
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase">Altura (m)</label>
                    <input
                      type="text"
                      value={altura}
                      onChange={(e) => setAltura(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden"
                      placeholder="1.70"
                    />
                  </div>

                  <div className="p-2.5 bg-[#16362C]/10 rounded-xl border border-[#16362C]/30">
                    <label className="block text-[10px] text-[#16362C] font-bold uppercase">IMC</label>
                    <div className="text-xs font-bold text-[#1E293B]">{imc} kg/m²</div>
                    <div className="text-[10px] text-[#16362C] font-semibold truncate">{classificacaoImc}</div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: ANAMNESE CLÍNICA */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase border-b border-slate-200 pb-2">
                  2. Anamnese & Queixa Principal (QP)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Queixa Principal (QP) *
                    </label>
                    <textarea
                      rows={3}
                      value={queixaPrincipal}
                      onChange={(e) => setQueixaPrincipal(e.target.value)}
                      placeholder="Ex: Cefaleia pulsátil frontotemporal iniciada há 3 dias..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-[#16362C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      História da Doença Atual (HDA) & Hábitos
                    </label>
                    <textarea
                      rows={3}
                      value={historiaDoencaAtual}
                      onChange={(e) => setHistoriaDoencaAtual(e.target.value)}
                      placeholder="Evolução temporal, fatores de melhora/piora, antecedentes cirúrgicos e familiares..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-[#16362C]"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: EXAME FÍSICO */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase border-b border-slate-200 pb-2">
                  3. Exame Físico Geral & Segmentar
                </h3>
                <textarea
                  rows={3}
                  value={exameFisico}
                  onChange={(e) => setExameFisico(e.target.value)}
                  placeholder="Aparelho cardiovascular, respiratório, neurológico, palpação abdominal..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-[#16362C]"
                />
              </div>

              {/* SEÇÃO 4: DIAGNÓSTICO & CID-10 */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase border-b border-slate-200 pb-2">
                  4. Hipótese Diagnóstica & CID-10
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Código CID-10 *</label>
                    <input
                      type="text"
                      value={cidCodigo}
                      onChange={(e) => setCidCodigo(e.target.value)}
                      placeholder="Ex: I10"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 focus:bg-white focus:outline-[#16362C]"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] text-slate-500 mb-1">Descrição do Diagnóstico *</label>
                    <input
                      type="text"
                      value={cidDescricao}
                      onChange={(e) => setCidDescricao(e.target.value)}
                      placeholder="Ex: Hipertensão essencial (primária)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-[#16362C]"
                    />
                  </div>
                </div>

                {/* Atalhos para CIDs comuns */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 font-semibold mr-1">Atalhos rápidos:</span>
                  {CIDS_FREQUENTES.map((item) => (
                    <button
                      type="button"
                      key={item.codigo}
                      onClick={() => {
                        setCidCodigo(item.codigo);
                        setCidDescricao(item.descricao);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#16362C] hover:text-white text-[11px] text-slate-700 transition-colors font-mono"
                    >
                      {item.codigo} - {item.descricao.split('/')[0].split('(')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              {/* SEÇÃO 5: PRESCRIÇÃO MÉDICA ESTRUTURADA */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-[#16362C]" />
                    5. Prescrição Médica Eletrônica (Receituário)
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddPrescricao}
                    className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Medicamento
                  </button>
                </div>

                <div className="space-y-3">
                  {prescricoes.map((p, index) => (
                    <div
                      key={index}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                    >
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Medicamento & Concentração
                        </label>
                        <input
                          type="text"
                          value={p.medicamento}
                          onChange={(e) => handleUpdatePrescricao(index, 'medicamento', e.target.value)}
                          placeholder="Ex: Losartana Potássica 50mg"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Dose
                        </label>
                        <input
                          type="text"
                          value={p.dose}
                          onChange={(e) => handleUpdatePrescricao(index, 'dose', e.target.value)}
                          placeholder="1 comprimido"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Posologia / Frequência
                        </label>
                        <input
                          type="text"
                          value={p.frequencia}
                          onChange={(e) => handleUpdatePrescricao(index, 'frequencia', e.target.value)}
                          placeholder="1x ao dia pela manhã"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Duração
                        </label>
                        <input
                          type="text"
                          value={p.duracao}
                          onChange={(e) => handleUpdatePrescricao(index, 'duracao', e.target.value)}
                          placeholder="Uso contínuo (30d)"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemovePrescricao(index)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setReceitaModalOpen(true)}
                    className="px-4 py-2 rounded-xl border border-[#16362C] text-[#16362C] hover:bg-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Visualizar & Imprimir Receituário</span>
                  </button>
                </div>
              </div>

              {/* SEÇÃO 6: EXAMES & CONDUTA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-200">
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-800 tracking-wider uppercase">
                    6. Pedidos de Exames Complementares
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={novoExameInput}
                      onChange={(e) => setNovoExameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddExame();
                        }
                      }}
                      placeholder="Ex: Ecocardiograma, TSH, Raio-X..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleAddExame}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
                    >
                      + Incluir
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {examesSelecionados.map((exame) => (
                      <span
                        key={exame}
                        className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5"
                      >
                        <span>{exame}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExame(exame)}
                          className="text-slate-400 hover:text-rose-600 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800 tracking-wider uppercase">
                      7. Atestado Médico (Dias de Dispensa)
                    </label>
                    <span className="text-[11px] text-slate-400">Opcional</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={atestadoDias}
                      onChange={(e) => setAtestadoDias(parseInt(e.target.value) || 0)}
                      className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-center"
                    />
                    <span className="text-xs text-slate-600">
                      {atestadoDias > 0
                        ? `Emitir atestado de ${atestadoDias} dia(s) de afastamento das atividades laborais.`
                        : 'Nenhum atestado emitido.'}
                    </span>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Conduta Clínica & Orientações ao Paciente
                    </label>
                    <textarea
                      rows={2}
                      value={condutaClinica}
                      onChange={(e) => setCondutaClinica(e.target.value)}
                      placeholder="Orientado repouso relativo, hidratação adequada, retorno em 15 dias com resultados de exames..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Botões de Ação de Fechamento do Prontuário */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>
                    Ao salvar, o agendamento será marcado como <strong>Concluído</strong> e gravado no{' '}
                    <strong>Google Sheets</strong>.
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('fila')}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-full border border-slate-300 text-slate-600 hover:bg-white text-xs font-semibold"
                  >
                    Voltar à Fila
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSalvarConcluir}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-[#16362C] hover:bg-[#0D221C] text-white text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Gravando no Google Sheets...' : 'Salvar & Concluir Consulta'}</span>
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBTAB 3: HISTÓRICO DE CONSULTAS ANTERIORES DO PACIENTE        */}
      {/* ============================================================== */}
      {activeSubTab === 'historico' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#CBD5E1]/70 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-serif-editorial text-2xl font-bold text-[#1E293B]">
                Histórico Clínico do Paciente (PEP Cronológico)
              </h2>
              <p className="text-xs text-slate-500">
                Linha do tempo de todas as consultas, prescrições e evoluções médicas anteriores.
              </p>
            </div>

            {/* Seletor de Paciente para visualização de prontuário */}
            <select
              value={selectedPatientForHistory?.id || currentPaciente?.id || ''}
              onChange={(e) => {
                const found = pacientes.find((p) => p.id === e.target.value);
                if (found) setSelectedPatientForHistory(found);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} (CPF: {p.cpf})
                </option>
              ))}
            </select>
          </div>

          {/* Timeline de Registros */}
          {historicoConsultasPaciente.length > 0 ? (
            <div className="space-y-6">
              {historicoConsultasPaciente.map((reg) => (
                <div
                  key={reg.id}
                  className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-800">
                        {reg.data.split('-').reverse().join('/')} às {reg.hora}
                      </span>
                      <span className="text-xs text-[#16362C] font-semibold">
                        • Dr(a). {reg.medicoNome} ({reg.crm})
                      </span>
                    </div>
                    <span className="font-mono text-xs bg-white border border-slate-300 px-2.5 py-0.5 rounded-full font-bold text-slate-700">
                      CID-10: {reg.cid10Codigo} - {reg.cid10Descricao}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-slate-400 font-bold uppercase text-[10px]">Queixa Principal</div>
                      <div className="text-slate-800 font-medium mt-0.5">{reg.queixaPrincipal}</div>
                    </div>

                    <div>
                      <div className="text-slate-400 font-bold uppercase text-[10px]">Sinais Vitais Registrados</div>
                      <div className="text-slate-700 font-mono mt-0.5">
                        PA: {reg.sinaisVitais.pressaoArterial} • FC: {reg.sinaisVitais.freqCardiaca} • IMC: {reg.sinaisVitais.imc} ({reg.sinaisVitais.classificacaoImc})
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <div className="text-slate-400 font-bold uppercase text-[10px]">Exame Físico & HDA</div>
                      <div className="text-slate-700 mt-0.5 leading-relaxed">{reg.exameFisico}</div>
                    </div>

                    {reg.prescricoes && reg.prescricoes.length > 0 && (
                      <div className="md:col-span-2 p-3 bg-white rounded-xl border border-slate-200">
                        <div className="text-slate-500 font-bold uppercase text-[10px] mb-1">
                          Prescrição Emitida:
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-slate-800">
                          {reg.prescricoes.map((p, i) => (
                            <li key={i}>
                              <strong>{p.medicamento}</strong>: {p.dose} - {p.frequencia} ({p.duracao})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
              Nenhum histórico anterior registrado para este paciente ainda.
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL DE IMPRESSÃO DO RECEITUÁRIO MÉDICO                      */}
      {/* ============================================================== */}
      {receitaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 space-y-6 print-area">
            {/* Header do Receituário Oficial */}
            <div className="text-center border-b-2 border-[#16362C] pb-4 space-y-1">
              <h2 className="font-serif-editorial text-2xl font-bold text-slate-900 uppercase">
                ZANE Pilates Studio
              </h2>
              <div className="text-xs font-semibold text-slate-700">
                {currentMedico?.nome} • {currentMedico?.crm}
              </div>
              <div className="text-[11px] text-slate-500">
                {currentMedico?.especialidade} • Espaço de Movimento & Postura • Tel: (11) 97120-4491
              </div>
            </div>

            {/* Paciente */}
            <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-2">
              <div>
                Paciente: <strong>{currentPaciente?.nome || 'Nome do Paciente'}</strong>
              </div>
              <div>
                Data: <strong>{new Date().toLocaleDateString('pt-BR')}</strong>
              </div>
            </div>

            {/* Prescrições */}
            <div className="space-y-4 py-4 min-h-[220px]">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                RECEITUÁRIO MÉDICO
              </div>
              <div className="space-y-3">
                {prescricoes.map((p, idx) => (
                  <div key={idx} className="text-xs space-y-0.5">
                    <div className="font-bold text-slate-900 text-sm">
                      {idx + 1}. {p.medicamento || 'Medicamento'} {p.dose && `(${p.dose})`}
                    </div>
                    <div className="text-slate-700 pl-4">
                      Uso: {p.frequencia || 'Conforme orientação'} - Durante {p.duracao || 'tempo indicado'}.
                    </div>
                    {p.orientacoes && (
                      <div className="text-slate-500 text-[11px] pl-4 italic">
                        Obs: {p.orientacoes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Carimbo & Assinatura */}
            <div className="pt-12 text-center max-w-xs mx-auto border-t border-slate-300">
              <div className="font-bold text-xs text-slate-800">{currentMedico?.nome}</div>
              <div className="text-[11px] text-slate-500">{currentMedico?.crm}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                Assinatura & Carimbo Médico
              </div>
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 no-print">
              <button
                type="button"
                onClick={() => setReceitaModalOpen(false)}
                className="px-4 py-2 rounded-full border border-slate-300 text-xs font-semibold"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-full bg-[#16362C] text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Receituário</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
