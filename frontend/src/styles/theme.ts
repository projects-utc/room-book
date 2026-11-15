/**
 * ODauDay Stay Design Tokens (TypeScript Theme Engine)
 * Source of truth for dynamic styling across components (SPEC-FE-001)
 */

export const theme = {
  colors: {
    // Primary & Brand
    primary: {
      main: '#FF385C',
      hover: '#E00B41',
      active: '#C10836',
      soft: '#FFF1F2',
      border: '#FECDD3',
      gradient: 'linear-gradient(135deg, #FF385C 0%, #E00B41 100%)',
    },
    // Secondary & Dark Neutrals
    secondary: {
      main: '#1E293B',
      hover: '#0F172A',
      active: '#020617',
      soft: '#F1F5F9',
      border: '#CBD5E1',
    },
    // Background & Surfaces
    bg: {
      app: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      muted: '#F1F5F9',
    },
    // Text & Typography (WCAG AA Compliant)
    text: {
      primary: '#0F172A',   // 15.8:1 on white
      secondary: '#475569', // 6.5:1 on white
      muted: '#64748B',     // 4.6:1 on white
      inverse: '#FFFFFF',
      disabled: '#94A3B8',
    },
    // Borders & Lines
    border: {
      subtle: '#E2E8F0',
      strong: '#CBD5E1',
      focus: '#0F172A',
    },
    // Semantic States (Pastel Tint Theme)
    semantic: {
      success: {
        text: '#15803D',
        bg: '#F0FDF4',
        border: '#BBF7D0',
      },
      warning: {
        text: '#B45309',
        bg: '#FFFBEB',
        border: '#FDE68A',
      },
      danger: {
        text: '#B91C1C',
        bg: '#FEF2F2',
        border: '#FECACA',
      },
      info: {
        text: '#1D4ED8',
        bg: '#EFF6FF',
        border: '#BFDBFE',
      },
      neutral: {
        text: '#475569',
        bg: '#F1F5F9',
        border: '#E2E8F0',
      },
    },
  },
  shadows: {
    sm: '0 1px 3px rgba(15, 23, 42, 0.06)',
    md: '0 4px 12px rgba(15, 23, 42, 0.08)',
    lg: '0 10px 25px rgba(15, 23, 42, 0.12)',
    card: '0 2px 16px rgba(15, 23, 42, 0.06)',
    primary: '0 4px 14px rgba(255, 56, 92, 0.28)',
    primaryHover: '0 6px 20px rgba(255, 56, 92, 0.42)',
  },
  transitions: {
    fast: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
    normal: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  radii: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },
} as const;

export type Theme = typeof theme;
export type ThemeColors = typeof theme.colors;
export default theme;

