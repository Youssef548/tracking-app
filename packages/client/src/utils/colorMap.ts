interface ColorEntry {
  bg: string;
  text: string;
  btnBg: string;
  progress: string;
}

export const colorMap: Record<string, ColorEntry> = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', btnBg: 'bg-primary', progress: 'bg-primary' },
  secondary: { bg: 'bg-secondary/10', text: 'text-secondary', btnBg: 'bg-secondary', progress: 'bg-secondary' },
  tertiary: { bg: 'bg-tertiary/10', text: 'text-tertiary', btnBg: 'bg-tertiary', progress: 'bg-tertiary' },
};

export const barColors: Record<string, string> = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  tertiary: 'var(--color-tertiary)',
};
