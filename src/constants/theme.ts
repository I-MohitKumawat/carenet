export const Colors = {
  primary: '#3A86FF',
  primaryPressed: '#2563EB',
  teal: '#35A7A0',
  success: '#38A169',
  warning: '#E9A23B',
  emergency: '#D94A4A',
  
  background: '#FAFAF7',
  surface: '#FFFFFF',
  surfaceSubtle: '#F4F7FC',
  divider: '#EAEAEA',
  border: '#E2E8F0',
  
  textPrimary: '#1F1F1F',
  textSecondary: '#737373',
  textMuted: '#9CA3AF',
  
  // Icon Badge backgrounds
  badgeBlueBg: '#EBF3FF',
  badgeTealBg: '#E6F7F5',
  badgeOrangeBg: '#FEF3E6',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const Typography = {
  largeTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    lineHeight: 38,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
};
