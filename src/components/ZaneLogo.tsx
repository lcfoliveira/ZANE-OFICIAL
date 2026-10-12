import React from 'react';

interface ZaneLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

/**
 * Logotipo oficial exato do ZANE Pilates Studio
 * - Letra Z em Forest Green (#16362C)
 * - Silhueta feminina dourada na postura clássica de Teaser erguendo o Magic Circle (anel de pilates)
 * - Letras A N E em Forest Green (#16362C) com serifa nobre
 * - Linha dourada metálica de apoio
 * - Texto 'pilates studio' em minúsculas douradas
 */
export const ZaneLogo: React.FC<ZaneLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  const heightClass = {
    sm: 'h-8 sm:h-9',
    md: 'h-11 sm:h-13',
    lg: 'h-16 sm:h-20',
    xl: 'h-24 sm:h-28',
  }[size];

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 460 160"
        className={`${heightClass} w-auto`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Gradiente Ouro Nobre Polido */}
          <linearGradient id="zaneGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DFCA88" />
            <stop offset="35%" stopColor="#CCB373" />
            <stop offset="70%" stopColor="#B3954B" />
            <stop offset="100%" stopColor="#D9C27E" />
          </linearGradient>

          {/* Gradiente Ouro Metálico para o Anel de Pilates */}
          <linearGradient id="zaneRingGrad" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#F5E8BE" />
            <stop offset="45%" stopColor="#CCB373" />
            <stop offset="100%" stopColor="#9E7F35" />
          </linearGradient>

          {/* Sombra sutil para destaque da silhueta */}
          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#B3954B" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* ======================================================== */}
        {/* LETRA 'Z' EM FOREST GREEN (#16362C) COM SERIFAS CLÁSSICAS */}
        {/* ======================================================== */}
        <g id="letter-Z">
          {/* Barra superior com serifa */}
          <path
            d="M 14 36 L 24 36 L 24 40 L 98 40 L 98 48 L 44 116 L 112 116 L 114 104 L 118 104 L 118 126 L 10 126 L 10 122 L 72 48 L 14 48 Z"
            fill="#16362C"
          />
        </g>

        {/* ======================================================== */}
        {/* SILHUETA DA PRATICANTE DE PILATES EM TEASER COM O ANEL   */}
        {/* ======================================================== */}
        <g id="pilates-teaser-figure" filter="url(#goldGlow)">
          {/* Anel de Pilates (Magic Circle) erguido nas mãos */}
          <ellipse
            cx="106"
            cy="35"
            rx="14"
            ry="18"
            transform="rotate(22 106 35)"
            stroke="url(#zaneRingGrad)"
            strokeWidth="3.6"
            fill="none"
          />
          {/* Detalhes das manoplas do Magic Circle */}
          <rect
            x="93"
            y="26"
            width="3"
            height="6"
            rx="1.5"
            transform="rotate(22 94 29)"
            fill="url(#zaneGoldGrad)"
          />
          <rect
            x="116"
            y="38"
            width="3"
            height="6"
            rx="1.5"
            transform="rotate(22 117 41)"
            fill="url(#zaneGoldGrad)"
          />

          {/* Mãos e Braços estendidos segurando o anel */}
          <path
            d="M 85 54 C 91 46, 96 40, 101 34 M 89 57 C 94 48, 100 42, 104 36"
            stroke="url(#zaneGoldGrad)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Cabeça erguida e coque elegante */}
          <circle cx="68" cy="50" r="6" fill="url(#zaneGoldGrad)" />
          <path
            d="M 63 47 C 61 44, 58 47, 60 50 C 62 52, 64 51, 64 48 Z"
            fill="url(#zaneGoldGrad)"
          />

          {/* Tronco & Curvatura em Teaser do Pilates */}
          <path
            d="M 72 56 C 80 66, 85 78, 92 90 C 97 99, 105 106, 116 108"
            stroke="url(#zaneGoldGrad)"
            strokeWidth="3.8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Abdômen e Contorno Torácico */}
          <path
            d="M 76 60 C 82 70, 87 82, 94 92"
            stroke="url(#zaneGoldGrad)"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Pernas Estendidas em 'V' Teaser */}
          <path
            d="M 100 106 C 112 96, 128 74, 144 54 C 148 49, 153 47, 157 51 C 154 57, 144 74, 130 96 C 118 112, 104 116, 88 116 C 76 116, 52 118, 38 124"
            stroke="url(#zaneGoldGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />

          {/* Pés em ponta suave (Pilates point) */}
          <path
            d="M 144 54 Q 152 46 156 48"
            stroke="url(#zaneGoldGrad)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Curva de transição inferior harmoniosa */}
          <path
            d="M 38 124 C 62 118, 86 117, 106 126"
            stroke="url(#zaneGoldGrad)"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* ======================================================== */}
        {/* LETRAS 'A', 'N', 'E' EM FOREST GREEN (#16362C)           */}
        {/* Renderizadas com tipografia serif clássica de alta precisão */}
        {/* ======================================================== */}
        <g id="letters-ANE">
          <text
            x="172"
            y="126"
            fill="#16362C"
            fontFamily="'Playfair Display', 'Cormorant Garamond', 'Georgia', serif"
            fontSize="98"
            fontWeight="700"
            letterSpacing="5"
          >
            ANE
          </text>
        </g>

        {/* ======================================================== */}
        {/* LINHA DOURADA E SUBTÍTULO 'pilates studio'               */}
        {/* ======================================================== */}
        {showSubtitle && (
          <g id="subtitle-group">
            {/* Linha Divisória Dourada */}
            <line
              x1="174"
              y1="136"
              x2="424"
              y2="136"
              stroke="url(#zaneGoldGrad)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* Texto 'pilates studio' em minúsculas refinadas */}
            <text
              x="178"
              y="153"
              fill="url(#zaneGoldGrad)"
              fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
              fontSize="16.5"
              fontWeight="700"
              letterSpacing="6.5"
            >
              pilates studio
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

/**
 * Medalhão Dourado Circular Oficial ZANE (Selo com Borda de Moeda)
 */
export const ZaneMedallion: React.FC<{ size?: number; className?: string }> = ({
  size = 64,
  className = '',
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full select-none flex items-center justify-center p-1.5 shadow-lg ${className}`}
    >
      {/* Moldura de Moeda / Medalhão com Gradiente Dourado Bisotado */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#8E712B] via-[#DFCA88] to-[#B39347] p-1 shadow-md">
        <div className="w-full h-full rounded-full border border-[#FAF7F0]/40"></div>
      </div>

      {/* Interior Creme com o Símbolo Oficial Centralizado */}
      <div className="relative w-full h-full rounded-full bg-[#FAF7F0] border-2 border-[#D4BC7C] flex items-center justify-center overflow-hidden p-1 shadow-inner">
        <svg viewBox="0 0 160 160" className="w-full h-full" fill="none">
          <defs>
            <linearGradient id="medallionGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DFCA88" />
              <stop offset="50%" stopColor="#CCB373" />
              <stop offset="100%" stopColor="#9E8138" />
            </linearGradient>
          </defs>

          {/* Letra Z em Forest Green */}
          <path
            d="M 28 42 L 102 42 L 102 48 L 52 108 L 112 108 L 112 118 L 24 118 L 24 110 L 78 48 L 28 48 Z"
            fill="#16362C"
          />

          {/* Anel de Pilates erguido */}
          <ellipse
            cx="98"
            cy="42"
            rx="12"
            ry="15"
            transform="rotate(22 98 42)"
            stroke="url(#medallionGold)"
            strokeWidth="3.2"
            fill="none"
          />

          {/* Cabeça e Silhueta */}
          <circle cx="66" cy="54" r="5" fill="url(#medallionGold)" />
          <path
            d="M 70 59 C 76 68, 80 79, 86 88 C 91 96, 98 102, 108 104"
            stroke="url(#medallionGold)"
            strokeWidth="3.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 94 102 C 104 93, 117 73, 131 56 C 134 52, 138 51, 141 54 C 137 60, 127 76, 116 94 C 106 108, 94 112, 80 112 C 70 112, 48 114, 36 118"
            stroke="url(#medallionGold)"
            strokeWidth="3.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 131 56 Q 138 49 141 51"
            stroke="url(#medallionGold)"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};
