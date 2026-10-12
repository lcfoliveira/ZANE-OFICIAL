import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Printer, 
  Download, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  CheckCircle,
  Copy,
  Check
} from 'lucide-react';
import { Agendamento, Medico } from '../types';
import { ZaneLogo } from './ZaneLogo';

interface AgendamentoReceiptModalProps {
  agendamento: Agendamento | null;
  medico?: Medico;
  onClose: () => void;
  onGoToCheckin?: () => void;
}

export const AgendamentoReceiptModal: React.FC<AgendamentoReceiptModalProps> = ({
  agendamento,
  medico,
  onClose,
  onGoToCheckin,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!agendamento) return;
    
    // Valor do QR Code com identificador de check-in
    const qrPayload = JSON.stringify({
      codigo: agendamento.codigo,
      paciente: agendamento.pacienteNome,
      cpf: agendamento.pacienteCpf,
      data: agendamento.data,
      hora: agendamento.hora,
      medico: agendamento.medicoNome,
      sala: agendamento.sala,
    });

    QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#16362C',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Erro ao gerar QR Code:', err));
  }, [agendamento]);

  if (!agendamento) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qrcode-checkin-${agendamento.codigo}.png`;
    a.click();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(agendamento.codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E5E0D5] overflow-hidden my-8">
        
        {/* Modal Header com Logotipo Oficial ZANE Pilates Studio */}
        <div className="bg-[#FAF8F5] px-6 py-4 flex items-center justify-between border-b border-[#E5E0D5]">
          <div className="flex items-center gap-3">
            <ZaneLogo size="sm" showSubtitle={true} />
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Pass Area */}
        <div className="p-6 space-y-6 print-area">
          
          {/* Success Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-bold text-emerald-950">Agendamento Confirmado com Sucesso!</div>
              <div className="text-xs text-emerald-800 mt-0.5">
                Os dados foram gravados e sincronizados na planilha Google Sheets do estúdio.
              </div>
            </div>
          </div>

          {/* QR Code Presentation */}
          <div className="flex flex-col items-center justify-center text-center p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5]">
            <div className="text-xs font-semibold text-[#CCB373] tracking-widest uppercase mb-1">
              QR Code de Presença para Check-in
            </div>
            <p className="text-[11px] text-[#879C7B] mb-4">
              Apresente esta imagem no totem ao chegar no estúdio para registrar sua presença.
            </p>

            {qrDataUrl ? (
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-[#E5E0D5]">
                <img 
                  src={qrDataUrl} 
                  alt="QR Code do Agendamento" 
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                />
              </div>
            ) : (
              <div className="w-48 h-48 sm:w-56 sm:h-56 bg-slate-100 rounded-2xl flex items-center justify-center text-xs text-slate-400">
                Gerando QR Code...
              </div>
            )}

            {/* Código Alfanumérico & Botão Copiar */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-[#879C7B]">Código:</span>
              <span className="font-mono text-base font-extrabold text-[#16362C] bg-white px-3 py-1 rounded-lg border border-[#E5E0D5]">
                {agendamento.codigo}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg border border-[#E5E0D5] bg-white hover:bg-slate-50 text-[#16362C] text-xs transition-colors cursor-pointer"
                title="Copiar código"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Dados do Agendamento Detalhados */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-[#879C7B] font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#16362C]" />
                Aluno / Paciente
              </span>
              <span className="font-bold text-[#16362C]">{agendamento.pacienteNome}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-[#879C7B] font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#16362C]" />
                Data & Horário
              </span>
              <span className="font-bold text-[#16362C]">
                {agendamento.data.split('-').reverse().join('/')} às {agendamento.hora}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-[#879C7B] font-medium">Profissional / Instrutor</span>
              <span className="font-bold text-[#16362C]">{agendamento.medicoNome}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-[#879C7B] font-medium">Especialidade / Sessão</span>
              <span className="font-semibold text-[#CCB373]">{agendamento.especialidade}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#879C7B] font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#16362C]" />
                Local no Studio
              </span>
              <span className="font-bold text-[#16362C]">{agendamento.sala}</span>
            </div>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="bg-[#FAF8F5] px-6 py-4 border-t border-[#E5E0D5] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#16362C] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#CCB373]" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleDownloadQr}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#16362C] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#CCB373]" />
              <span>Baixar QR</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onGoToCheckin && (
              <button
                onClick={() => {
                  onClose();
                  onGoToCheckin();
                }}
                className="px-4 py-2 rounded-full border border-[#CCB373] text-[#16362C] hover:bg-white font-bold transition-all cursor-pointer"
              >
                Abrir Totem
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-[#16362C] hover:bg-[#0D221C] text-[#FAF8F5] font-bold tracking-wider uppercase transition-all shadow-xs cursor-pointer"
            >
              Concluído
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
