import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  FileText, 
  X, 
  Check, 
  Clock,
  Edit3,
  Trash2,
  Camera,
  Upload,
  UserCheck,
  Eye,
  History,
  Activity
} from 'lucide-react';
import { Paciente, Agendamento, ProntuarioRegistro } from '../types';

interface PacientesListProps {
  pacientes: Paciente[];
  agendamentos: Agendamento[];
  prontuarios: ProntuarioRegistro[];
  onAddPaciente: (novo: Paciente) => Promise<void>;
  onUpdatePaciente: (atualizado: Paciente) => Promise<void>;
  onDeletePaciente: (id: string) => Promise<void>;
  onScheduleForPatient: (paciente: Paciente) => void;
  onViewProntuario: (paciente: Paciente) => void;
}

const CATEGORIAS_PLANOS = [
  'Gympass (Wellhub)',
  'TotalPass',
  'Pilates 2×/semana',
  'Pilates 3×/semana',
  'Sessão Avulsa',
  'Reabilitação Intensiva',
  'Pilates para Gestantes',
  'RPG & Postura',
  'Particular',
  'Bradesco Saúde',
  'SulAmérica',
  'Unimed',
  'Amil',
];

export const PacientesList: React.FC<PacientesListProps> = ({
  pacientes,
  agendamentos,
  prontuarios,
  onAddPaciente,
  onUpdatePaciente,
  onDeletePaciente,
  onScheduleForPatient,
  onViewProntuario,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Paciente | null>(null);
  const [viewDetailsPatient, setViewDetailsPatient] = useState<Paciente | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [dataNascimento, setDataNascimento] = useState('1990-01-01');
  const [genero, setGenero] = useState('Feminino');
  const [convenio, setConvenio] = useState(CATEGORIAS_PLANOS[2]); // Pilates 2x/sem
  const [foto, setFoto] = useState('');
  const [alergias, setAlergias] = useState('Nenhuma');
  const [queixaPrincipal, setQueixaPrincipal] = useState('');
  const [historico, setHistorico] = useState('');

  const q = searchQuery.toLowerCase().trim();
  const digits = searchQuery.replace(/\D/g, '');

  const filteredPacientes = pacientes.filter((p) => {
    if (!q) return true;
    const matchNome = p.nome.toLowerCase().includes(q);
    const matchCpf = digits && p.cpf.replace(/\D/g, '').includes(digits);
    const matchTel = digits && p.telefone.replace(/\D/g, '').includes(digits);
    const matchEmail = p.email.toLowerCase().includes(q);
    const matchConvenio = p.convenio.toLowerCase().includes(q);
    return matchNome || matchCpf || matchTel || matchEmail || matchConvenio;
  });

  const handleOpenNew = () => {
    setEditingPatient(null);
    setNome('');
    setCpf('');
    setTelefone('');
    setEmail('');
    setDataNascimento('1990-01-01');
    setGenero('Feminino');
    setConvenio(CATEGORIAS_PLANOS[2]);
    setFoto('');
    setAlergias('Nenhuma');
    setQueixaPrincipal('');
    setHistorico('');
    setModalOpen(true);
  };

  const handleOpenEdit = (pac: Paciente) => {
    setEditingPatient(pac);
    setNome(pac.nome);
    setCpf(pac.cpf);
    setTelefone(pac.telefone);
    setEmail(pac.email);
    setDataNascimento(pac.dataNascimento || '1990-01-01');
    setGenero(pac.genero || 'Feminino');
    setConvenio(pac.convenio || CATEGORIAS_PLANOS[2]);
    setFoto(pac.foto || '');
    setAlergias(pac.alergias || 'Nenhuma');
    setQueixaPrincipal(pac.queixaPrincipal || '');
    setHistorico(pac.historico || '');
    setModalOpen(true);
  };

  // Upload de arquivo local de foto e conversão rápida para dataURL
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setFoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !telefone.trim()) {
      alert('Por favor, informe ao menos o Nome Completo e o Telefone/WhatsApp do aluno.');
      return;
    }

    const pacienteData: Paciente = {
      id: editingPatient ? editingPatient.id : 'pac-' + Date.now().toString(36),
      nome: nome.trim(),
      cpf: cpf.trim() || 'Não informado',
      telefone: telefone.trim(),
      email: email.trim() || 'aluno@zanepilates.com.br',
      dataNascimento,
      genero,
      convenio,
      foto: foto.trim() || undefined,
      alergias: alergias.trim() || 'Nenhuma',
      queixaPrincipal: queixaPrincipal.trim(),
      historico: historico.trim(),
      cadastradoEm: editingPatient ? editingPatient.cadastradoEm : new Date().toISOString(),
    };

    if (editingPatient) {
      await onUpdatePaciente(pacienteData);
    } else {
      await onAddPaciente(pacienteData);
    }

    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Search */}
      <div className="bg-[#FAF8F5] rounded-3xl p-6 border border-[#E5E0D5] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#CCB373] tracking-widest uppercase">
            ZANE Pilates Studio
          </span>
          <h2 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-[#16362C]">
            Gestão de Pacientes & Alunos
          </h2>
          <p className="text-xs text-[#879C7B]">
            Cadastre, edite qualquer informação, consulte prontuários e sincronize tudo com o Google Sheets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por Nome, CPF, WhatsApp..."
              className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#E5E0D5] rounded-xl text-xs text-[#16362C] focus:outline-[#16362C]"
            />
          </div>

          <button
            onClick={handleOpenNew}
            className="px-5 py-2.5 rounded-xl bg-[#16362C] hover:bg-[#0D221C] text-[#FAF8F5] text-xs font-bold tracking-wide uppercase transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Aluno</span>
          </button>
        </div>
      </div>

      {/* Pacientes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPacientes.map((pac) => {
          const totalConsultas = agendamentos.filter((a) => a.pacienteId === pac.id).length;
          const prontuariosCount = prontuarios.filter((p) => p.pacienteId === pac.id).length;
          const hasAlergias = pac.alergias && pac.alergias.toLowerCase() !== 'nenhuma';

          return (
            <div
              key={pac.id}
              className="bg-white rounded-3xl p-5 border border-[#E5E0D5] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {pac.foto ? (
                      <img
                        src={pac.foto}
                        alt={pac.nome}
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#CCB373]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#16362C] text-[#CCB373] flex items-center justify-center font-bold text-lg font-serif">
                        {pac.nome.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-[#16362C] text-sm group-hover:text-[#B89A57] transition-colors leading-snug">
                        {pac.nome}
                      </h3>
                      <div className="text-[11px] font-mono text-[#879C7B]">
                        CPF: {pac.cpf}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold bg-[#FAF8F5] text-[#16362C] px-2.5 py-1 rounded-full border border-[#E5E0D5]">
                    {pac.convenio}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#879C7B]" />
                    <span>{pac.telefone}</span>
                  </div>
                  {pac.email && (
                    <div className="flex items-center gap-2 truncate text-slate-500">
                      <Mail className="w-3.5 h-3.5 text-[#879C7B]" />
                      <span className="truncate">{pac.email}</span>
                    </div>
                  )}
                  {pac.queixaPrincipal && (
                    <div className="text-[11px] text-slate-500 line-clamp-1 italic bg-[#FAF8F5] p-1.5 rounded-lg border border-[#E5E0D5]">
                      Diagnóstico/Queixa: {pac.queixaPrincipal}
                    </div>
                  )}
                </div>

                {hasAlergias && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="truncate">Restrições/Alergias: {pac.alergias}</span>
                  </div>
                )}
              </div>

              {/* Botões de Ação Completa */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-[11px] text-[#879C7B]">
                  <span>{totalConsultas} sessões • {prontuariosCount} PEP</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setViewDetailsPatient(pac)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                    title="Ver Ficha Completa"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenEdit(pac)}
                    className="px-2.5 py-1.5 rounded-lg border border-[#CCB373] bg-[#FAF8F5] text-[#16362C] hover:bg-[#CCB373]/20 transition-all font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Editar Tudo no Paciente"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#CCB373]" />
                    <span>Editar Tudo</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Excluir permanentemente o cadastro de ${pac.nome}?`)) {
                        onDeletePaciente(pac.id);
                      }
                    }}
                    className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Excluir Aluno"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onScheduleForPatient(pac)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#16362C] text-[#FAF8F5] text-[11px] font-bold hover:bg-[#0D221C] transition-colors cursor-pointer shadow-2xs"
                  >
                    Agendar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPacientes.length === 0 && (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-[#E5E0D5] text-[#879C7B]">
          Nenhum paciente ou aluno encontrado para "{searchQuery}".
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: EDITAR / CADASTRAR TUDO NO PACIENTE                   */}
      {/* ============================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            
            <div className="bg-[#FAF8F5] px-6 py-4 border-b border-[#E5E0D5] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#CCB373] tracking-widest uppercase">
                  ZANE Pilates Studio
                </span>
                <h3 className="font-serif-editorial text-xl font-bold text-[#16362C]">
                  {editingPatient ? `Editar Cadastro: ${editingPatient.nome}` : 'Cadastrar Novo Paciente / Aluno'}
                </h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              
              {/* Nome Completo */}
              <div>
                <label className="block text-[#16362C] font-bold uppercase text-[11px] mb-1">
                  Nome Completo do Aluno / Paciente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mariana Silveira Costa"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-[#16362C]"
                />
              </div>

              {/* CPF e Telefone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#16362C] font-bold uppercase text-[11px] mb-1">CPF</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-[#16362C]"
                  />
                </div>
                <div>
                  <label className="block text-[#16362C] font-bold uppercase text-[11px] mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 99999-9999"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-[#16362C]"
                  />
                </div>
              </div>

              {/* E-mail e Data de Nascimento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#16362C] font-bold uppercase text-[11px] mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="aluno@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-[#16362C]"
                  />
                </div>
                <div>
                  <label className="block text-[#16362C] font-bold uppercase text-[11px] mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-[#16362C]"
                  />
                </div>
              </div>

              {/* Plano / Categoria & Gênero */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#16362C] font-bold uppercase text-[11px] mb-1">
                    Plano / Categoria *
                  </label>
                  <select
                    value={convenio}
                    onChange={(e) => setConvenio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-[#16362C]"
                  >
                    {CATEGORIAS_PLANOS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#16362C] font-bold uppercase text-[11px] mb-1">Gênero</label>
                  <select
                    value={genero}
                    onChange={(e) => setGenero(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-[#16362C]"
                  >
                    <option>Feminino</option>
                    <option>Masculino</option>
                    <option>Não-binário</option>
                    <option>Prefiro não informar</option>
                  </select>
                </div>
              </div>

              {/* Foto de Identificação */}
              <div className="p-3 bg-[#FAF8F5] border border-[#E5E0D5] rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[#16362C] font-bold uppercase text-[11px]">
                    Foto de Perfil do Aluno
                  </label>
                  {foto && (
                    <button
                      type="button"
                      onClick={() => setFoto('')}
                      className="text-rose-600 hover:underline text-[10px] font-semibold"
                    >
                      Remover foto
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {foto ? (
                    <img src={foto} alt="Preview" className="w-12 h-12 rounded-full object-cover border-2 border-[#CCB373]" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">
                      Sem foto
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      placeholder="Cole a URL da foto ou selecione o arquivo abaixo..."
                      value={foto}
                      onChange={(e) => setFoto(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-bold text-[#16362C] hover:bg-slate-50 cursor-pointer">
                      <Upload className="w-3 h-3 text-[#CCB373]" />
                      <span>Escolher arquivo do computador/celular</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Alergias & Cuidados Especiais */}
              <div>
                <label className="block text-[#16362C] font-bold uppercase text-[11px] mb-1">
                  Alergias & Cuidados Especiais / Restrições Físicas
                </label>
                <input
                  type="text"
                  placeholder="Ex: Hérnia de disco L4-L5, labirintite, alergia a látex, cirurgia recente..."
                  value={alergias}
                  onChange={(e) => setAlergias(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-rose-800 focus:bg-white focus:outline-[#16362C]"
                />
              </div>

              {/* Queixa Principal / Diagnóstico */}
              <div>
                <label className="block text-[#16362C] font-bold uppercase text-[11px] mb-1">
                  Queixa Principal / Diagnóstico Clínico
                </label>
                <input
                  type="text"
                  placeholder="Ex: Lombalgia crônica ao ficar sentado, fortalecimento postural, reabilitação de joelho..."
                  value={queixaPrincipal}
                  onChange={(e) => setQueixaPrincipal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-[#16362C]"
                />
              </div>

              {/* Histórico Clínico & Objetivos */}
              <div>
                <label className="block text-[#16362C] font-bold uppercase text-[11px] mb-1">
                  Histórico Clínico & Objetivos Terapêuticos
                </label>
                <textarea
                  rows={2}
                  placeholder="Antecedentes cirúrgicos, prática de atividades físicas, objetivos com o Pilates..."
                  value={historico}
                  onChange={(e) => setHistorico(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-[#16362C]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#16362C] hover:bg-[#0D221C] text-[#FAF8F5] font-bold tracking-wider uppercase shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-[#CCB373]" />
                  <span>{editingPatient ? 'Salvar Todas as Alterações' : 'Cadastrar Aluno'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: VISUALIZAÇÃO DETALHADA DA FICHA DO PACIENTE           */}
      {/* ============================================================== */}
      {viewDetailsPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            
            <div className="bg-[#FAF8F5] px-6 py-4 border-b border-[#E5E0D5] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#CCB373] tracking-widest uppercase">
                  Ficha do Aluno
                </span>
                <h3 className="font-serif-editorial text-xl font-bold text-[#16362C]">
                  {viewDetailsPatient.nome}
                </h3>
              </div>
              <button onClick={() => setViewDetailsPatient(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              
              {/* Card Resumo */}
              <div className="flex items-center gap-4 p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5]">
                {viewDetailsPatient.foto ? (
                  <img src={viewDetailsPatient.foto} alt={viewDetailsPatient.nome} className="w-16 h-16 rounded-full object-cover border-2 border-[#CCB373]" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#16362C] text-[#CCB373] flex items-center justify-center font-bold text-2xl font-serif">
                    {viewDetailsPatient.nome.charAt(0)}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="text-base font-bold text-[#16362C]">{viewDetailsPatient.nome}</div>
                  <div className="text-xs font-mono text-[#879C7B]">CPF: {viewDetailsPatient.cpf}</div>
                  <div className="text-xs font-bold text-[#16362C] bg-[#CCB373]/20 px-2 py-0.5 rounded-full inline-block">
                    Plano: {viewDetailsPatient.convenio}
                  </div>
                </div>
              </div>

              {/* Informações de Contato e Pessoais */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Telefone / WhatsApp</span>
                  <div className="font-semibold text-slate-800">{viewDetailsPatient.telefone}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">E-mail</span>
                  <div className="font-semibold text-slate-800 truncate">{viewDetailsPatient.email || 'Não informado'}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Nascimento</span>
                  <div className="font-semibold text-slate-800">{viewDetailsPatient.dataNascimento}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Gênero</span>
                  <div className="font-semibold text-slate-800">{viewDetailsPatient.genero}</div>
                </div>
              </div>

              {/* Queixa & Diagnóstico */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Queixa Principal / Diagnóstico</span>
                <p className="text-slate-800 font-medium">{viewDetailsPatient.queixaPrincipal || 'Nenhuma queixa inicial registrada.'}</p>
              </div>

              {/* Alergias & Restrições */}
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-1">
                <span className="text-rose-700 text-[10px] uppercase font-bold">Alergias & Restrições Físicas</span>
                <p className="text-rose-900 font-semibold">{viewDetailsPatient.alergias || 'Nenhuma restrição conhecida.'}</p>
              </div>

              {/* Histórico Clínico */}
              {viewDetailsPatient.historico && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Histórico Clínico</span>
                  <p className="text-slate-700">{viewDetailsPatient.historico}</p>
                </div>
              )}

              {/* Botão de Edição Rápida */}
              <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setViewDetailsPatient(null);
                    onViewProntuario(viewDetailsPatient);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#16362C] font-semibold flex items-center gap-1.5"
                >
                  <History className="w-3.5 h-3.5 text-[#CCB373]" />
                  <span>Ver Prontuário Completo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const toEdit = viewDetailsPatient;
                    setViewDetailsPatient(null);
                    handleOpenEdit(toEdit);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#16362C] hover:bg-[#0D221C] text-[#FAF8F5] font-bold flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#CCB373]" />
                  <span>Editar Todos os Dados</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
