import type { InteractionPreset, ResolvedInteractionStyle } from './types'

export const interactionPresets: Record<InteractionPreset, ResolvedInteractionStyle> = {
  lift: {
    base: {
      transition: 'transform 180ms ease, box-shadow 180ms ease',
      willChange: 'transform',
    },
    state: {
      boxShadow: '0 16px 42px rgba(15, 23, 42, 0.12)',
      transform: 'translateY(-2px)',
    },
  },
  scale: {
    base: {
      transition: 'transform 160ms ease',
      willChange: 'transform',
    },
    state: {
      transform: 'scale(1.05)',
    },
  },
  glow: {
    base: {
      transition: 'box-shadow 180ms ease, border-color 180ms ease',
    },
    state: {
      borderColor: '#60a5fa',
      boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.16)',
    },
  },
  soft: {
    base: {
      transition: 'background-color 180ms ease, box-shadow 180ms ease',
    },
    state: {
      backgroundColor: '#f8fafc',
      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
    },
  },
  none: {
    base: {},
    state: {},
  },
}
