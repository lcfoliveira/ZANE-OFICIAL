import React, { useState } from 'react';
import { 
  X, 
  Database, 
  RefreshCw, 
  Download, 
  Check, 
  Copy, 
  ExternalLink, 
  FileSpreadsheet, 
  AlertCircle,
  Code,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { GoogleSheetsConfig, AppState } from '../types';
import { 
  GOOGLE_APPS_SCRIPT_TEMPLATE, 
  exportTableToCsv, 
  syncToGoogleSheets 
} from '../services/storage';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetsConfig: GoogleSheetsConfig;
  appState: AppState;
  onUpdateWebhookUrl: (url: string) => void;
  onTriggerFullSync: () => Promise<void>;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  sheetsConfig,
  appState,
  onUpdateWebhookUrl,
  onTriggerFullSync,
}) => {
  const [webhookUrlInput, setWebhookUrlInput] = useState(sheetsConfig.webhookUrl);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  const handleSaveUrl = () => {
    onUpdateWebhookUrl(webhookUrlInput.trim());
    setTestResult({ success: true, message: 'URL do Google Sheets atualizada com sucesso!' });
  };

  const handleTestConnection = async () => {
    setIsSyncing(true);
    setTestResult(null);
    try {
      await onTriggerFullSync();
      setTestResult({ success: true, message: '✓ Sincronização e conexão validadas com sucesso no Google Sheets!' });
    } catch (e: any) {
      setTestResult({ success: false, message: 'Erro na conexão: ' + (e.message || 'Verifique a URL.') });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportAgendamentos = () => {
    const headers = ['ID', 'Código', 'Data', 'Hora', 'Paciente', 'CPF', 'Telefone', 'Médico', 'Especialidade', 'Sala', 'Status', 'Check-in Em', 'Tipo', 'Valor (R$)'];
    const rows = appState.agendamentos.map((a) => [
      a.id, a.codigo, a.data, a.hora, a.pacienteNome, a.pacienteCpf, a.pacienteTelefone,
      a.medicoNome, a.especialidade, a.sala, a.status, a.checkinEm || '', a.tipoConsulta, a.valor
    ]);
    exportTableToCsv('ZANE_Agendamentos', headers, rows);
  };

  const handleExportPacientes = () => {
    const headers = ['ID', 'Nome', 'CPF', 'Telefone', 'E-mail', 'Nascimento', 'Gênero', 'Convênio', 'Alergias', 'Queixa Principal', 'Cadastrado Em'];
    const rows = appState.pacientes.map((p) => [
      p.id, p.nome, p.cpf, p.telefone, p.email, p.dataNascimento, p.genero, p.convenio, p.alergias || '', p.queixaPrincipal || '', p.cadastradoEm
    ]);
    exportTableToCsv('ZANE_Pacientes', headers, rows);
  };

  const handleExportProntuarios = () => {
    const headers = ['ID', 'Agendamento ID', 'Data', 'Hora', 'Paciente', 'Médico', 'CRM', 'Especialidade', 'Queixa', 'PA', 'FC', 'Temp', 'IMC', 'CID-10 Código', 'CID-10 Descrição', 'Conduta', 'Exames'];
    const rows = appState.prontuarios.map((prt) => [
      prt.id, prt.agendamentoId, prt.data, prt.hora, prt.pacienteNome, prt.medicoNome, prt.crm, prt.especialidade,
      prt.queixaPrincipal, prt.sinaisVitais.pressaoArterial, prt.sinaisVitais.freqCardiaca, prt.sinaisVitais.temperatura,
      prt.sinaisVitais.imc, prt.cid10Codigo, prt.cid10Descricao, prt.condutaClinica, prt.examesSolicitados.join('; ')
    ]);
    exportTableToCsv('ZANE_Prontuarios_PEP', headers, rows);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-[#E9EEF4] px-6 py-4 border-b border-[#CBD5E1] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-emerald-800 tracking-wider uppercase">
                Integração Google Workspace
              </span>
              <h2 className="font-serif-editorial text-2xl font-bold text-slate-900">
                Sincronização com Google Sheets
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
          
          {/* Status Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-sm text-slate-800">Sincronizador Automático Ativo</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Última sincronização bem-sucedida:{' '}
                <strong>{sheetsConfig.ultimaSincronizacao || 'Registrada agora'}</strong>
              </p>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wide uppercase transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Tudo Agora'}</span>
            </button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-xl border text-xs font-semibold ${
              testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {testResult.message}
            </div>
          )}

          {/* Webhook URL Input */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Endereço do App da Web (Google Apps Script Webhook URL)
            </label>
            <p className="text-slate-500 text-[11px]">
              Cole abaixo a URL de implantação gerada pelo seu Google Apps Script (terminada em <code className="text-emerald-700 bg-slate-100 px-1 py-0.5 rounded">/exec</code>):
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={webhookUrlInput}
                onChange={(e) => setWebhookUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px] text-slate-800 focus:bg-white focus:outline-emerald-600"
              />
              <button
                type="button"
                onClick={handleSaveUrl}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold hover:bg-black transition-colors"
              >
                Salvar URL
              </button>
            </div>
          </div>

          {/* Download Direct CSV / Excel */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center justify-between">
              <span>Exportar Dados em Planilha (CSV / Excel)</span>
              <span className="text-slate-400 font-normal">Download Instantâneo</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={handleExportAgendamentos}
                className="p-3 bg-white border border-slate-200 hover:border-emerald-500 rounded-xl text-left flex items-center justify-between group transition-all"
              >
                <div>
                  <div className="font-bold text-slate-800 group-hover:text-emerald-700">Agendamentos</div>
                  <div className="text-[10px] text-slate-400">{appState.agendamentos.length} linhas</div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </button>

              <button
                onClick={handleExportPacientes}
                className="p-3 bg-white border border-slate-200 hover:border-emerald-500 rounded-xl text-left flex items-center justify-between group transition-all"
              >
                <div>
                  <div className="font-bold text-slate-800 group-hover:text-emerald-700">Pacientes</div>
                  <div className="text-[10px] text-slate-400">{appState.pacientes.length} linhas</div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </button>

              <button
                onClick={handleExportProntuarios}
                className="p-3 bg-white border border-slate-200 hover:border-emerald-500 rounded-xl text-left flex items-center justify-between group transition-all"
              >
                <div>
                  <div className="font-bold text-slate-800 group-hover:text-emerald-700">Prontuários (PEP)</div>
                  <div className="text-[10px] text-slate-400">{appState.prontuarios.length} evoluções</div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </button>
            </div>
          </div>

          {/* Instruções passo a passo de como criar no Google Drive */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Code className="w-4 h-4 text-[#16362C]" />
                Como Conectar Sua Própria Planilha Google (1 Minuto)
              </h3>
              <button
                type="button"
                onClick={handleCopyScript}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
              >
                {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{codeCopied ? 'Código Copiado!' : 'Copiar Código Apps Script'}</span>
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200 leading-relaxed text-[11px]">
              <li>Crie uma nova planilha vazia no <strong>Google Sheets</strong> (<a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">sheets.new</a>).</li>
              <li>No menu superior da planilha, clique em <strong>Extensões</strong> &gt; <strong>Apps Script</strong>.</li>
              <li>Apague o código de exemplo e clique no botão acima para <strong>Copiar o Código Apps Script</strong> e colar lá.</li>
              <li>Clique no botão azul <strong>Implantar</strong> &gt; <strong>Nova Implantação</strong> &gt; Selecione tipo <strong>App da Web</strong>.</li>
              <li>Em <em>"Quem pode acessar"</em>, selecione <strong>Qualquer pessoa (Anyone)</strong> e clique em <em>Implantar</em>.</li>
              <li>Copie a URL gerada (terminada em <code className="bg-slate-200 px-1 rounded">/exec</code>) e cole no campo acima! As abas <strong>Agendamentos</strong>, <strong>Pacientes</strong>, <strong>Médicos</strong> e <strong>Prontuários_PEP</strong> serão criadas automaticamente.</li>
            </ol>
          </div>

          {/* Logs Recentes */}
          <div className="space-y-2">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Histórico de Eventos do Sincronizador
            </div>
            <div className="bg-slate-900 text-slate-300 p-3 rounded-2xl font-mono text-[10px] space-y-1 max-h-32 overflow-y-auto">
              {sheetsConfig.logs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-slate-500">[{log.timestamp}]</span>
                  <span className={log.sucesso ? 'text-emerald-400' : 'text-rose-400'}>
                    {log.tipo}:
                  </span>
                  <span>{log.detalhe}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#16362C] text-white font-bold text-xs hover:bg-[#0D221C] transition-all"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
