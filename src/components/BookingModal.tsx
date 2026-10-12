import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  FileText, 
  Check, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import { Medico, Paciente, Agendamento } from '../types';
import { getHojeIso } from '../services/storage';
import { ZaneLogo } from './ZaneLogo';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicos: Medico[];
  pacientes: Paciente[];
  agendamentos: Agendamento[];
  onConfirmBooking: (novoAgendamento: Agendamento, novoPaciente?: Paciente) => void;
  initialEspecialidade?: string;
}

const HORARIOS_PADRAO = [
  '07:00', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '18:00', '19:00'
];

const PLANOS_PILATES = [
  'Pilates 2×/semana',
  'Pilates 3×/semana',
  'Sessão Avulsa',
  'Reabilitação Intensiva',
  'Gympass (Wellhub)',
  'TotalPass',
  'Pilates para Gestantes',
  'RPG & Postura',
  'Particular',
  'Bradesco Saúde',
  'SulAmérica',
  'Unimed',
  'Amil',
];

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  medicos,
  pacientes,
  agendamentos,
  onConfirmBooking,
  initialEspecialidade,
}) => {
  const [selectedMedicoId, setSelectedMedicoId] = useState<string>('');
  const [selectedData, setSelectedData] = useState<string>(getHojeIso());
  const [selectedHora, setSelectedHora] = useState<string>('09:00');
  const [tipoConsulta, setTipoConsulta] = useState<string>('Avaliação & Aula Experimental');

  // Paciente Form State
  const [isExistingPatient, setIsExistingPatient] = useState<boolean>(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [dataNascimento, setDataNascimento] = useState('1990-01-01');
  const [convenio, setConvenio] = useState(PLANOS_PILATES[0]);
  const [queixaPrincipal, setQueixaPrincipal] = useState('');
  const [alergias, setAlergias] = useState('Nenhuma');

  const [errorMsg, setErrorMsg] = useState('');

  // Initial selection
  useEffect(() => {
    if (medicos.length > 0 && !selectedMedicoId) {
      if (initialEspecialidade) {
        const found = medicos.find(m => m.especialidade.toLowerCase().includes(initialEspecialidade.toLowerCase()));
        setSelectedMedicoId(found ? found.id : medicos[0].id);
      } else {
        setSelectedMedicoId(medicos[0].id);
      }
    }
  }, [medicos, initialEspecialidade, selectedMedicoId]);

  // Sync existing patient selection
  useEffect(() => {
    if (isExistingPatient && selectedPatientId) {
      const p = pacientes.find(item => item.id === selectedPatientId);
      if (p) {
        setNome(p.nome);
        setCpf(p.cpf);
        setTelefone(p.telefone);
        setEmail(p.email);
        setDataNascimento(p.dataNascimento);
        setConvenio(p.convenio);
        setQueixaPrincipal(p.queixaPrincipal || '');
        setAlergias(p.alergias || 'Nenhuma');
      }
    }
  }, [isExistingPatient, selectedPatientId, pacientes]);

  if (!isOpen) return null;

  const currentMedico = medicos.find(m => m.id === selectedMedicoId) || medicos[0];

  // Horários disponíveis para a data e profissional selecionados
  const horariosOcupados = agendamentos
    .filter(a => a.medicoId === selectedMedicoId && a.data === selectedData && a.status !== 'Cancelado')
    .map(a => a.hora);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nome.trim() || !telefone.trim()) {
      setErrorMsg('Por favor, informe ao menos o Nome Completo e o Telefone/WhatsApp do aluno.');
      return;
    }

    if (!currentMedico) {
      setErrorMsg('Selecione o profissional para a sessão.');
      return;
    }

    // Gera código exclusivo do agendamento ZNE-XXXX
    const numRandom = Math.floor(1000 + Math.random() * 9000);
    const codigoLocalizador = `ZNE-${numRandom}`;
    const uid = 'agd-' + Date.now().toString(36);

    let pacienteId = selectedPatientId;
    let novoPacienteObj: Paciente | undefined = undefined;

    if (!isExistingPatient || !pacienteId) {
      pacienteId = 'pac-' + Date.now().toString(36);
      novoPacienteObj = {
        id: pacienteId,
        nome: nome.trim(),
        cpf: cpf.trim() || 'Não informado',
        telefone: telefone.trim(),
        email: email.trim() || 'aluno@zanepilates.com.br',
        dataNascimento,
        genero: 'Feminino',
        convenio,
        queixaPrincipal,
        alergias,
        cadastradoEm: new Date().toISOString(),
      };
    }

    const novoAgendamento: Agendamento = {
      id: uid,
      codigo: codigoLocalizador,
      pacienteId,
      pacienteNome: nome.trim(),
      pacienteTelefone: telefone.trim(),
      pacienteCpf: cpf.trim() || 'Não informado',
      medicoId: currentMedico.id,
      medicoNome: currentMedico.nome,
      especialidade: currentMedico.especialidade,
      data: selectedData,
      hora: selectedHora,
      sala: currentMedico.sala,
      status: 'Agendado',
      tipoConsulta,
      valor: 0,
      observacoes: queixaPrincipal,
      criadoEm: new Date().toISOString(),
    };

    onConfirmBooking(novoAgendamento, novoPacienteObj);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E5E0D5] overflow-hidden my-6">
        
        {/* Header com identidade oficial ZANE Pilates Studio */}
        <div className="bg-[#FAF8F5] px-6 py-4.5 border-b border-[#E5E0D5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ZaneLogo size="sm" showSubtitle={true} />
            <div className="h-7 w-px bg-[#E5E0D5] hidden sm:block"></div>
            <div className="hidden sm:block">
              <span className="text-[10px] font-bold text-[#CCB373] tracking-widest uppercase">
                Agendamento de Sessão
              </span>
              <h2 className="font-serif-editorial text-lg font-bold text-[#16362C]">
                Marcar Horário no Studio
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Booking Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
              ⚠ {errorMsg}
            </div>
          )}

          {/* Passo 1: Escolha do Profissional (Fisioterapeuta ou Médico) */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-[#16362C] tracking-wide uppercase">
              1. Selecione o Fisioterapeuta ou Médico do Studio *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {medicos.map((med) => {
                const isSelected = med.id === selectedMedicoId;
                return (
                  <div
                    key={med.id}
                    onClick={() => setSelectedMedicoId(med.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'border-[#16362C] bg-[#16362C]/5 shadow-xs ring-1 ring-[#16362C]'
                        : 'border-[#E5E0D5] hover:border-[#CCB373] bg-[#FAF8F5]/60'
                    }`}
                  >
                    <img
                      src={med.foto}
                      alt={med.nome}
                      className="w-12 h-12 rounded-full object-cover border border-[#CCB373] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold text-[#CCB373] uppercase truncate">
                        {med.especialidade}
                      </div>
                      <div className="text-xs font-bold text-[#16362C] truncate">
                        {med.nome}
                      </div>
                      <div className="text-[11px] text-[#879C7B]">
                        {med.sala}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Passo 2: Data & Horários Disponíveis */}
          <div className="space-y-3 pt-2 border-t border-[#E5E0D5]">
            <label className="block text-xs font-bold text-[#16362C] tracking-wide uppercase">
              2. Data & Horário da Sessão *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-[#879C7B] mb-1 font-medium">Data da Sessão</label>
                <input
                  type="date"
                  min={getHojeIso()}
                  value={selectedData}
                  onChange={(e) => setSelectedData(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#16362C] focus:bg-white focus:outline-[#16362C]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-[#879C7B] mb-1 font-medium">
                  Tipo de Atendimento / Sessão
                </label>
                <select
                  value={tipoConsulta}
                  onChange={(e) => setTipoConsulta(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#16362C] focus:bg-white focus:outline-[#16362C]"
                >
                  <option>Avaliação Postural & Aula Experimental</option>
                  <option>Sessão Pilates Reformer & Cadillac</option>
                  <option>Sessão Pilates Solo & Matwork</option>
                  <option>Reabilitação Ortopédica & Coluna</option>
                  <option>RPG & Cadeias Musculares</option>
                  <option>Consulta Médica Ortopédica</option>
                </select>
              </div>
            </div>

            {/* Grid de Horários */}
            <div>
              <label className="block text-[11px] text-[#879C7B] mb-1.5 font-medium">
                Horários Disponíveis ({selectedData.split('-').reverse().join('/')})
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {HORARIOS_PADRAO.map((h) => {
                  const isOcupado = horariosOcupados.includes(h);
                  const isSelected = selectedHora === h;

                  return (
                    <button
                      type="button"
                      key={h}
                      disabled={isOcupado}
                      onClick={() => setSelectedHora(h)}
                      className={`py-2 px-1 text-xs font-mono font-bold rounded-xl border transition-all ${
                        isOcupado
                          ? 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed line-through'
                          : isSelected
                          ? 'bg-[#16362C] text-[#FAF8F5] border-[#16362C] shadow-xs'
                          : 'bg-white text-[#16362C] border-slate-200 hover:border-[#CCB373] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Passo 3: Dados do Paciente / Aluno */}
          <div className="space-y-3 pt-2 border-t border-[#E5E0D5]">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#16362C] tracking-wide uppercase">
                3. Dados do Aluno / Paciente *
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsExistingPatient(false)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                    !isExistingPatient
                      ? 'bg-[#16362C] text-[#FAF8F5]'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Novo Cadastro
                </button>
                <button
                  type="button"
                  onClick={() => setIsExistingPatient(true)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                    isExistingPatient
                      ? 'bg-[#16362C] text-[#FAF8F5]'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Já é Aluno
                </button>
              </div>
            </div>

            {/* Seletor de Paciente Existente */}
            {isExistingPatient && (
              <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] space-y-2">
                <label className="block text-[11px] text-[#879C7B] font-medium">Selecione o Aluno Cadastrado</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E0D5] rounded-xl text-xs font-semibold text-[#16362C] focus:outline-[#16362C]"
                >
                  <option value="">-- Escolha um aluno --</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} (CPF: {p.cpf})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Campos de formulário do paciente */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#879C7B] mb-1 font-medium">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do aluno"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#16362C] font-semibold focus:bg-white focus:outline-[#16362C]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#879C7B] mb-1 font-medium">Telefone / WhatsApp *</label>
                <input
                  type="text"
                  required
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#16362C] focus:bg-white focus:outline-[#16362C]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#879C7B] mb-1 font-medium">CPF</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[#16362C] focus:bg-white focus:outline-[#16362C]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#879C7B] mb-1 font-medium">Plano / Categoria</label>
                <select
                  value={convenio}
                  onChange={(e) => setConvenio(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#16362C] font-semibold focus:bg-white focus:outline-[#16362C]"
                >
                  {PLANOS_PILATES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-[#879C7B] mb-1 font-medium">
                  Objetivo / Queixa Principal / Restrição Fisioterápica
                </label>
                <input
                  type="text"
                  placeholder="Ex: Hérnia de disco, dor cervical, fortalecimento postural, condicionamento..."
                  value={queixaPrincipal}
                  onChange={(e) => setQueixaPrincipal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#16362C] focus:bg-white focus:outline-[#16362C]"
                />
              </div>
            </div>
          </div>

          {/* Nota de sincronização automática com Google Sheets */}
          <div className="bg-[#FAF8F5] border border-[#E5E0D5] rounded-2xl p-3.5 flex items-center justify-between text-xs text-[#879C7B]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>
                Esta sessão será registrada no <strong>Google Sheets</strong> e emitirá um QR Code exclusivo para check-in no totem de entrada.
              </span>
            </div>
            <span className="text-[10px] font-bold text-[#16362C] bg-[#CCB373]/30 px-2.5 py-0.5 rounded-full border border-[#CCB373]/40">
              Check-in Ágil
            </span>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E5E0D5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#16362C] hover:bg-[#0D221C] text-[#FAF8F5] text-xs font-semibold tracking-wider uppercase transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 text-[#CCB373]" />
              <span>Confirmar & Gerar QR Code</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
