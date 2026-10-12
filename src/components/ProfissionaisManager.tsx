import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  Plus, 
  User, 
  Stethoscope, 
  Award, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Medico } from '../types';

interface ProfissionaisManagerProps {
  medicos: Medico[];
  onAddMedico: (novo: Medico) => Promise<void>;
  onUpdateMedico: (atualizado: Medico) => Promise<void>;
  onDeleteMedico: (id: string) => Promise<void>;
  isAuthenticated: boolean;
  onAuthenticate: (password: string) => boolean;
  onLock: () => void;
}

const ESPECIALIDADES_SUGERIDAS = [
  'Pilates Clínico & Postura',
  'Reabilitação Traumato-Ortopédica',
  'RPG & Cadeias Musculares',
  'Ortopedia & Medicina do Exercício',
  'Fisioterapia Desportiva & Performance',
  'Gerontologia & Mobilidade Funcional',
  'Saúde da Mulher & Fisioterapia Pélvica',
  'Pilates para Gestantes & Pós-Parto',
  'Clínica Geral & Integrativa',
];

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const ProfissionaisManager: React.FC<ProfissionaisManagerProps> = ({
  medicos,
  onAddMedico,
  onUpdateMedico,
  onDeleteMedico,
  isAuthenticated,
  onAuthenticate,
  onLock,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMedico, setEditingMedico] = useState<Medico | null>(null);

  // Form State
  const [tipo, setTipo] = useState<'Fisioterapeuta' | 'Médico'>('Fisioterapeuta');
  const [nome, setNome] = useState('');
  const [registro, setRegistro] = useState('');
  const [especialidade, setEspecialidade] = useState(ESPECIALIDADES_SUGERIDAS[0]);
  const [sala, setSala] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>(['Seg', 'Ter', 'Qua', 'Qui', 'Sex']);
  const [inicio, setInicio] = useState('08:00');
  const [fim, setFim] = useState('18:00');
  const [foto, setFoto] = useState('');
  const [biografia, setBiografia] = useState('');

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const ok = onAuthenticate(passwordInput.trim());
    if (!ok) {
      setAuthError('Senha incorreta! Digite a senha administrativa ZANEPS para acessar.');
    } else {
      setPasswordInput('');
    }
  };

  const handleOpenNew = () => {
    setEditingMedico(null);
    setTipo('Fisioterapeuta');
    setNome('');
    setRegistro('CREFITO-3/');
    setEspecialidade(ESPECIALIDADES_SUGERIDAS[0]);
    setSala('Estúdio 1 - Reformer');
    setEmail('');
    setTelefone('');
    setDiasSelecionados(['Seg', 'Ter', 'Qua', 'Qui', 'Sex']);
    setInicio('08:00');
    setFim('18:00');
    setFoto('');
    setBiografia('');
    setModalOpen(true);
  };

  const handleOpenEdit = (m: Medico) => {
    setEditingMedico(m);
    setTipo(m.tipo || (m.crm.includes('CREFITO') ? 'Fisioterapeuta' : 'Médico'));
    setNome(m.nome);
    setRegistro(m.crm);
    setEspecialidade(m.especialidade);
    setSala(m.sala);
    setEmail(m.email);
    setTelefone(m.telefone);
    setDiasSelecionados(m.diasAtendimento.split(',').map((d) => d.trim()));
    setInicio(m.horarioInicio);
    setFim(m.horarioFim);
    setFoto(m.foto);
    setBiografia(m.biografia);
    setModalOpen(true);
  };

  const toggleDia = (d: string) => {
    if (diasSelecionados.includes(d)) {
      setDiasSelecionados(diasSelecionados.filter((item) => item !== d));
    } else {
      setDiasSelecionados([...diasSelecionados, d]);
    }
  };

  const addPrefix = (prefix: string) => {
    if (!nome.startsWith(prefix)) {
      setNome(prefix + nome.replace(/^(Dra?\.|Ft\.|Prof\.)\s*/, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !registro.trim()) {
      alert('Por favor, informe o Nome Completo e o Registro (CREFITO/CRM).');
      return;
    }

    const defaultPhoto = tipo === 'Fisioterapeuta'
      ? 'https://images.unsplash.com/photo-1594824813583-98285511e6d4?auto=format&fit=crop&w=400&q=80'
      : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80';

    const profissionalData: Medico = {
      id: editingMedico ? editingMedico.id : 'med-' + Date.now().toString(36),
      nome: nome.trim(),
      tipo,
      crm: registro.trim(),
      especialidade,
      foto: foto.trim() || defaultPhoto,
      sala: sala.trim() || 'Estúdio de Pilates',
      email: email.trim() || 'profissional@zanepilates.com.br',
      telefone: telefone.trim(),
      diasAtendimento: diasSelecionados.join(', '),
      horarioInicio: inicio,
      horarioFim: fim,
      biografia: biografia.trim() || `${tipo} especializado(a) no ZANE Pilates Studio.`,
    };

    if (editingMedico) {
      await onUpdateMedico(profissionalData);
    } else {
      await onAddMedico(profissionalData);
    }

    setModalOpen(false);
  };

  // Se não estiver autenticado, exibe a tela de bloqueio com senha ZANEPS
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-[#CBD5E1]/70 shadow-lg text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-[#16362C] flex items-center justify-center mx-auto border border-slate-200">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#16362C] tracking-widest uppercase">
            Acesso Administrativo Restrito
          </span>
          <h2 className="font-serif-editorial text-2xl font-bold text-slate-900">
            Cadastro de Profissionais
          </h2>
          <p className="text-xs text-slate-500">
            Área protegida para gestão do corpo de <strong>Médicos</strong> e <strong>Fisioterapeutas</strong> do ZANE Pilates Studio.
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Senha de Acesso (ZANEPS)
            </label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Digite a senha..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono tracking-widest text-center focus:bg-white focus:outline-[#16362C]"
              autoFocus
            />
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              ⚠ {authError}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-full bg-[#16362C] hover:bg-[#0D221C] text-white text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4" />
            <span>Desbloquear Painel</span>
          </button>
        </form>

        <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
          Dica de segurança da clínica: utilize a chave padrão <strong>ZANEPS</strong>.
        </div>
      </div>
    );
  }

  // Se autenticado, exibe o painel completo de gestão
  return (
    <div className="space-y-6">
      
      {/* Top Banner de Gestão com Logout */}
      <div className="bg-white rounded-3xl p-6 border border-[#CBD5E1]/70 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-emerald-800 tracking-wider uppercase">
              Área Administrativa Autenticada
            </span>
          </div>
          <h2 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-[#1E293B]">
            Corpo de Fisioterapeutas & Médicos
          </h2>
          <p className="text-xs text-slate-500">
            Cadastre e edite os profissionais responsáveis pelas sessões de Pilates e avaliações clínicas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onLock}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Bloquear área com senha"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Bloquear</span>
          </button>

          <button
            onClick={handleOpenNew}
            className="px-5 py-2 rounded-xl bg-[#16362C] hover:bg-[#0D221C] text-white text-xs font-bold tracking-wider uppercase transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Profissional</span>
          </button>
        </div>
      </div>

      {/* Grid de Profissionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medicos.map((m) => {
          const isFisio = m.tipo === 'Fisioterapeuta' || m.crm.includes('CREFITO');
          return (
            <div
              key={m.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-16/9 w-full bg-slate-100 overflow-hidden">
                  <img src={m.foto} alt={m.nome} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[10px] font-bold text-[#16362C] px-2.5 py-0.5 rounded-full border border-white/60">
                    {isFisio ? 'Fisioterapeuta' : 'Médico(a)'}
                  </div>
                  <div className="absolute top-3 right-3 bg-slate-900/80 text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
                    {m.crm}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-[11px] font-semibold text-[#16362C] uppercase tracking-wide">
                      {m.especialidade}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {m.nome}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {m.biografia}
                    </p>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{m.sala}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{m.diasAtendimento} • {m.horarioInicio} às {m.horarioFim}</span>
                    </div>
                    {m.telefone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{m.telefone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">ZANE Pilates Studio</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(m)}
                    className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-white transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remover ${m.nome} do corpo clínico?`)) {
                        onDeleteMedico(m.id);
                      }
                    }}
                    className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            
            <div className="bg-[#E9EEF4] px-6 py-4 border-b border-[#CBD5E1] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#16362C] tracking-widest uppercase">
                  ZANE Pilates Studio
                </span>
                <h3 className="font-serif-editorial text-xl font-bold text-slate-900">
                  {editingMedico ? 'Editar Profissional' : 'Cadastrar Novo Fisioterapeuta ou Médico'}
                </h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              
              {/* Tipo de Profissional */}
              <div className="space-y-1">
                <label className="block text-slate-700 font-bold uppercase text-[11px]">
                  Categoria do Profissional *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTipo('Fisioterapeuta');
                      if (!registro || registro.includes('CRM')) setRegistro('CREFITO-3/');
                    }}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      tipo === 'Fisioterapeuta'
                        ? 'bg-[#16362C] text-white border-[#16362C] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Fisioterapeuta (CREFITO)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipo('Médico');
                      if (!registro || registro.includes('CREFITO')) setRegistro('CRM/SP ');
                    }}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      tipo === 'Médico'
                        ? 'bg-[#16362C] text-white border-[#16362C] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Médico(a) (CRM)
                  </button>
                </div>
              </div>

              {/* Nome com prefixos rápidos */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold uppercase text-[11px]">
                    Nome Completo *
                  </label>
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-400">Prefixos:</span>
                    <button type="button" onClick={() => addPrefix('Ft. ')} className="text-[#16362C] font-bold hover:underline">+ Ft.</button>
                    <button type="button" onClick={() => addPrefix('Dra. ')} className="text-[#16362C] font-bold hover:underline">+ Dra.</button>
                    <button type="button" onClick={() => addPrefix('Dr. ')} className="text-[#16362C] font-bold hover:underline">+ Dr.</button>
                    <button type="button" onClick={() => addPrefix('Prof. ')} className="text-[#16362C] font-bold hover:underline">+ Prof.</button>
                  </div>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dra. Mariana Silveira Costa ou Dr. Lucas Silveira"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              {/* Registro Profissional e Especialidade */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase text-[11px] mb-1">
                    {tipo === 'Fisioterapeuta' ? 'Registro CREFITO *' : 'Registro CRM *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={tipo === 'Fisioterapeuta' ? 'CREFITO-3/000000-F' : 'CRM/SP 000.000'}
                    value={registro}
                    onChange={(e) => setRegistro(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase text-[11px] mb-1">
                    Especialidade Principal *
                  </label>
                  <select
                    value={especialidade}
                    onChange={(e) => setEspecialidade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    {ESPECIALIDADES_SUGERIDAS.map((esp) => (
                      <option key={esp} value={esp}>{esp}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sala e Telefone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase text-[11px] mb-1">
                    Estúdio / Sala Designada
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Estúdio 1 - Reformer & Cadillac"
                    value={sala}
                    onChange={(e) => setSala(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase text-[11px] mb-1">
                    Telefone de Contato
                  </label>
                  <input
                    type="tel"
                    placeholder="(11) 98000-0000"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* E-mail e Foto */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase text-[11px] mb-1">
                    E-mail Profissional
                  </label>
                  <input
                    type="email"
                    placeholder="profissional@zanepilates.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase text-[11px] mb-1">
                    URL da Foto (opcional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={foto}
                    onChange={(e) => setFoto(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Dias de Atendimento */}
              <div>
                <label className="block text-slate-700 font-bold uppercase text-[11px] mb-1.5">
                  Dias de Atendimento no Estúdio
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map((dia) => (
                    <button
                      type="button"
                      key={dia}
                      onClick={() => toggleDia(dia)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        diasSelecionados.includes(dia)
                          ? 'bg-[#16362C] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {dia}
                    </button>
                  ))}
                </div>
              </div>

              {/* Horários */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase text-[11px] mb-1">
                    Horário Início
                  </label>
                  <input
                    type="time"
                    value={inicio}
                    onChange={(e) => setInicio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold uppercase text-[11px] mb-1">
                    Horário Fim
                  </label>
                  <input
                    type="time"
                    value={fim}
                    onChange={(e) => setFim(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Biografia */}
              <div>
                <label className="block text-slate-700 font-bold uppercase text-[11px] mb-1">
                  Biografia / Formação Clínica
                </label>
                <textarea
                  rows={2}
                  placeholder="Formação em Fisioterapia, certificações em Pilates, experiência clínica..."
                  value={biografia}
                  onChange={(e) => setBiografia(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
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
                  className="px-6 py-2 rounded-xl bg-[#16362C] hover:bg-[#0D221C] text-white font-bold tracking-wider uppercase shadow-xs"
                >
                  {editingMedico ? 'Salvar Alterações' : 'Salvar Profissional'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
