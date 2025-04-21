// Color-impaired friendly color scheme based on 'Fundamentals of Data Visualization' by Claus Wilke
const colorBlindPalette = ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7']
const colorBlindPaletteBullet = ['#F0E442', '#E69F00', '#D55E00', '#CC79A7', '#0072B2', '#56B4E9', '#009E73']

export function getColorBlindSchemeWithBW(isDarkMode: boolean): string[] {
  return [...colorBlindPalette, isDarkMode ? '#FFFFFF' : '#000000']
}

export function getColorBlindScheme(): string[] {
  return colorBlindPalette
}

export function getColorBlindSchemeBullet(): string[] {
  return colorBlindPaletteBullet
}
