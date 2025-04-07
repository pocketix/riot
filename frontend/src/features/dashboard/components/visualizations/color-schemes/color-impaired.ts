// Color-impaired friendly color scheme based on 'Fundamentals of Data Visualization' by Claus Wilke
const colorBlindPalette = ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7']

export function getColorBlindSchemeWithBW(isDarkMode: boolean): string[] {
  return [...colorBlindPalette, isDarkMode ? '#FFFFFF' : '#000000']
}

export function getColorBlindScheme(): string[] {
  return colorBlindPalette
}