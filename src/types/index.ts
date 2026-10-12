export type StatusAgendamento = 'Agendado' | 'Presente' | 'Em atendimento' | 'Concluído' | 'Cancelado';

export interface Paciente {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  dataNascimento: string;
  genero: string;
  convenio: string; // 'Particular', 'Unimed', 'Bradesco Saúde', 'SulAmérica', 'Amil', 'Gympass Saúde', etc.
  foto?: string;
  queixaPrincipal?: string;
  alergias?: string;
  historico?: string;
  cadastradoEm: string;
}

export interface Medico {
  id: string;
  nome: string;
  tipo?: 'Fisioterapeuta' | 'Médico';
  crm: string; // CREFITO ou CRM
  especialidade: string;
  foto: string;
  sala: string;
  email: string;
  telefone: string;
  diasAtendimento: string;
  horarioInicio: string;
  horarioFim: string;
  biografia: string;
  valorConsulta?: number;
}

export interface Agendamento {
  id: string;
  codigo: string; // Ex: MRD-8492
  pacienteId: string;
  pacienteNome: string;
  pacienteTelefone: string;
  pacienteCpf: string;
  medicoId: string;
  medicoNome: string;
  especialidade: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:MM
  sala: string;
  status: StatusAgendamento;
  checkinEm?: string; // HH:MM ou timestamp
  tipoConsulta: string; // 'Primeira Consulta' | 'Retorno' | 'Exame de Rotina' | 'Telemedicina'
  valor: number;
  observacoes?: string;
  criadoEm: string;
}

export interface PrescricaoItem {
  medicamento: string;
  dose: string;
  frequencia: string;
  duracao: string;
  orientacoes?: string;
}

export interface SinaisVitais {
  pressaoArterial: string; // ex: 120/80 mmHg
  freqCardiaca: string; // bpm
  temperatura: string; // °C
  saturacaoO2: string; // %
  peso: string; // kg
  altura: string; // cm ou m
  imc: string;
  classificacaoImc?: string;
}

export interface ProntuarioRegistro {
  id: string;
  agendamentoId: string;
  pacienteId: string;
  pacienteNome: string;
  medicoId: string;
  medicoNome: string;
  crm: string;
  especialidade: string;
  data: string;
  hora: string;
  queixaPrincipal: string;
  historiaDoencaAtual: string;
  sinaisVitais: SinaisVitais;
  exameFisico: string;
  cid10Codigo: string;
  cid10Descricao: string;
  condutaClinica: string;
  prescricoes: PrescricaoItem[];
  examesSolicitados: string[];
  atestadoDias: number;
  observacoes: string;
  criadoEm: string;
}

export interface SyncLog {
  timestamp: string;
  tipo: string;
  detalhe: string;
  sucesso: boolean;
}

export interface GoogleSheetsConfig {
  webhookUrl: string;
  autoSyncEnabled: boolean;
  ultimaSincronizacao?: string;
  statusSincronizacao: 'idle' | 'syncing' | 'success' | 'error';
  logs: SyncLog[];
}

export interface AppState {
  pacientes: Paciente[];
  medicos: Medico[];
  agendamentos: Agendamento[];
  prontuarios: ProntuarioRegistro[];
  sheetsConfig: GoogleSheetsConfig;
}
