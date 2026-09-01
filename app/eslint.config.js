// Flat config de ESLint 9 (Expo SDK 57).
//
// Además del preset de Expo, aquí viven las reglas que convierten en errores
// de build tres normas de CLAUDE.md que hasta ahora solo eran disciplina:
// las capas de la arquitectura hexagonal, quién puede tocar el motor
// astrológico, y que ningún color se escriba fuera de `theme.ts`.
const expoConfig = require('eslint-config-expo/flat');

/** Nadie fuera de la infraestructura habla con la base de datos ni con el motor. */
const MOTOR_Y_BASE = [
  { group: ['@/_engine', '@/_engine/*'], message: 'El motor astrológico es infraestructura: usa el puerto chart/domain/ChartCalculator.' },
  { group: ['@/_db', '@/_db/*'], message: 'La UI y el dominio nunca ven SQL (BRD §12.2.3): pasa por un repositorio.' },
  { group: ['expo-sqlite'], message: 'Solo la infraestructura abre la base de datos.' },
];

/** React no entra en el dominio ni en los casos de uso. */
const REACT = [
  { group: ['react', 'react-native', 'react-dom', '@tanstack/*', 'expo-router'], message: 'Dominio y aplicación no saben que existe React.' },
  { group: ['@/_ui', '@/_ui/*', '**/ui/*'], message: 'La capa de UI depende del dominio, nunca al revés.' },
];

const prohibir = (patterns) => ({ 'no-restricted-imports': ['error', { patterns }] });

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', 'android/*', 'ios/*', '.expo/*', 'node_modules/*', 'src/design/*'],
  },
  {
    // El dominio es el centro: no depende de nada de fuera.
    files: ['src/*/domain/**/*.ts'],
    rules: prohibir([
      ...MOTOR_Y_BASE,
      ...REACT,
      { group: ['**/infrastructure/*', '**/application/*'], message: 'El dominio no conoce a quien lo implementa ni a quien lo orquesta.' },
    ]),
  },
  {
    // La aplicación orquesta puertos; no elige implementaciones.
    files: ['src/*/application/**/*.ts'],
    rules: prohibir([
      ...MOTOR_Y_BASE,
      ...REACT,
      { group: ['**/infrastructure/*'], message: 'Un caso de uso recibe sus dependencias inyectadas; quién las construye es el composition root (src/index.ts).' },
    ]),
  },
  {
    // La infraestructura sí puede usar el motor y SQLite — pero no React.
    files: ['src/*/infrastructure/**/*.ts'],
    rules: prohibir(REACT),
  },
  {
    // Pantallas y hooks: solo casos de uso, a través de la fachada.
    files: ['app/**/*.{ts,tsx}', 'src/*/ui/**/*.{ts,tsx}', 'src/_ui/**/*.{ts,tsx}'],
    rules: prohibir([
      ...MOTOR_Y_BASE,
      { group: ['**/infrastructure/*'], message: 'La UI no construye adaptadores: pide casos de uso a useDomain().' },
    ]),
  },
  {
    // Los tests sí componen capas: un test de integración monta el adaptador
    // real a propósito. Lo que no pueden es saltarse las reglas del código
    // que prueban — por eso solo se relaja aquí.
    files: ['**/__tests__/**/*.{ts,tsx}', 'src/*/testing/**/*.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // El fichero de arranque de Jest corre en el entorno de Jest, no en el de
    // la app: `jest` es global ahí y en ningún otro sitio del proyecto.
    files: ['jest.setup.js'],
    languageOptions: { globals: { jest: 'readonly' } },
  },
  {
    // BRD §11.2: ningún color, fuera de theme.ts. La firma delatora de la IA
    // es justo el hex suelto dentro de un StyleSheet.
    files: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]",
          message: 'Ningún color fuera de design/theme.ts (BRD §11.2).',
        },
      ],
    },
  },
];
