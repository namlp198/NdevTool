import {
  FontFamilyOption,
  FontSizeOption,
  FontStyleVariant,
  FontWeightOption,
  LineHeightOption,
  TypographyConfig,
} from '../types';

export const DEFAULT_TYPOGRAPHY: TypographyConfig = {
  fontFamily: 'jetbrains-mono',
  fontSize: 'sm', // 12px default
  fontStyleVariant: 'standard',
  lineHeight: 'normal',
  fontWeight: 'normal',
};

export function getFontFamilyCSS(fontFamily: FontFamilyOption, customFont?: string): string {
  if (fontFamily === 'custom' && customFont && customFont.trim()) {
    return `"${customFont.trim()}", "JetBrains Mono", Consolas, monospace`;
  }
  switch (fontFamily) {
    case 'fira-code':
      return '"Fira Code", "JetBrains Mono", monospace';
    case 'cascadia-code':
      return '"Cascadia Code", Consolas, "JetBrains Mono", monospace';
    case 'consolas':
      return 'Consolas, "Courier New", monospace';
    case 'roboto-mono':
      return '"Roboto Mono", "JetBrains Mono", monospace';
    case 'source-code-pro':
      return '"Source Code Pro", "Fira Code", monospace';
    case 'courier-new':
      return '"Courier New", Courier, monospace';
    case 'jetbrains-mono':
    default:
      return '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace';
  }
}

export function getFontSizePixels(fontSize: FontSizeOption): string {
  switch (fontSize) {
    case 'xs':
      return '11px';
    case 'sm':
      return '12px';
    case 'base':
      return '13px';
    case 'lg':
      return '14px';
    case 'xl':
      return '16px';
    default:
      return '12px';
  }
}

export function getLineHeightValue(lineHeight: LineHeightOption): string {
  switch (lineHeight) {
    case 'tight':
      return '1.3';
    case 'relaxed':
      return '1.75';
    case 'normal':
    default:
      return '1.5';
  }
}

export function getFontWeightValue(weight: FontWeightOption): string {
  switch (weight) {
    case 'medium':
      return '500';
    case 'semibold':
      return '600';
    case 'bold':
      return '700';
    case 'normal':
    default:
      return '400';
  }
}

export function getStyleVariantProperties(variant: FontStyleVariant): {
  textShadow: string;
  letterSpacing: string;
} {
  switch (variant) {
    case 'matrix-glow':
      return {
        textShadow: '0 0 4px rgba(0, 255, 156, 0.45)',
        letterSpacing: '0.015em',
      };
    case 'cyber-neon':
      return {
        textShadow: '0 0 5px rgba(0, 229, 255, 0.5)',
        letterSpacing: '0.02em',
      };
    case 'hacker-crisp':
      return {
        textShadow: 'none',
        letterSpacing: '0.035em',
      };
    case 'terminal-amber':
      return {
        textShadow: '0 0 3px rgba(255, 184, 77, 0.4)',
        letterSpacing: '0.025em',
      };
    case 'standard':
    default:
      return {
        textShadow: 'none',
        letterSpacing: 'normal',
      };
  }
}

export function applyTypographySettings(typography?: TypographyConfig) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const cfg: TypographyConfig = {
    ...DEFAULT_TYPOGRAPHY,
    ...(typography || {}),
  };

  const fontFamily = getFontFamilyCSS(cfg.fontFamily, cfg.customFontFamily);
  const fontSize = getFontSizePixels(cfg.fontSize);
  const lineHeight = getLineHeightValue(cfg.lineHeight);
  const fontWeight = getFontWeightValue(cfg.fontWeight);
  const { textShadow, letterSpacing } = getStyleVariantProperties(cfg.fontStyleVariant);

  root.style.setProperty('--app-font-family', fontFamily);
  root.style.setProperty('--app-font-size', fontSize);
  root.style.setProperty('--app-line-height', lineHeight);
  root.style.setProperty('--app-font-weight', fontWeight);
  root.style.setProperty('--app-text-shadow', textShadow);
  root.style.setProperty('--app-letter-spacing', letterSpacing);
}
