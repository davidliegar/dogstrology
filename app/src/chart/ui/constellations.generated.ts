// GENERADO por scripts/generateConstellations.mjs desde
// design/constellations/svg/*.svg. NO editar a mano: `npm run generate:constellations`.
//
// Las 12 constelaciones **reales**, ploteadas desde coordenadas de estrellas
// (BRD §11.2.0, regla de canon). No son siluetas de perro y no se rediseñan.
import type { Sign } from '../domain/PlanetPosition';

/** Lienzo cuadrado del contrato de `design/constellations/README.md`. */
export const CONSTELLATION_CANVAS = 512;

export interface ConstellationStar {
  cx: number;
  cy: number;
  /** Sale de la magnitud aparente real, no del gusto: clamp(10 − 1,4·mag, 3, 10). */
  r: number;
  name: string | null;
  /** La **más brillante**, no la α: en 7 de las 12 no coinciden. Lleva halo. */
  dominant: boolean;
}

export interface ConstellationPath {
  d: string;
  /** Longitud exacta de la polilínea: la usa `strokeDasharray` para trazarla. */
  length: number;
}

export interface ConstellationArt {
  paths: ConstellationPath[];
  stars: ConstellationStar[];
}

export const CONSTELLATIONS: Record<Sign, ConstellationArt> = {
  'aries': {
    paths: [
      { d: "M64 138 L355.2 250.5 L440.5 329.1 L448 374", length: 473.7 },
    ],
    stars: [
      { cx: 64, cy: 138, r: 4.9, name: "Bharani", dominant: false },
      { cx: 355.2, cy: 250.5, r: 7.2, name: "Hamal", dominant: true },
      { cx: 440.5, cy: 329.1, r: 6.3, name: "Sheratan", dominant: false },
      { cx: 448, cy: 374, r: 4.6, name: "Mesarthim", dominant: false },
    ],
  },
  'taurus': {
    paths: [
      { d: "M64 176.7 L242.4 232.1 L263.4 239.7 L289.1 242.6 L280 219.7 L263.6 200.2 L96.8 87.6", length: 486.4 },
      { d: "M289.1 242.6 L344.3 280.1 L441.2 313 L337.2 357.7", length: 282.3 },
      { d: "M441.2 313 L448 321.4 L413.1 424.4", length: 119.6 },
    ],
    stars: [
      { cx: 64, cy: 176.7, r: 5.8, name: "Tianguan", dominant: false },
      { cx: 242.4, cy: 232.1, r: 8.8, name: "Aldebaran", dominant: true },
      { cx: 263.4, cy: 239.7, r: 5.2, name: "Chamukuy", dominant: false },
      { cx: 289.1, cy: 242.6, r: 4.9, name: "Prima Hyadum", dominant: false },
      { cx: 280, cy: 219.7, r: 4.7, name: "Secunda Hyadum", dominant: false },
      { cx: 263.6, cy: 200.2, r: 5.1, name: "Ain", dominant: false },
      { cx: 96.8, cy: 87.6, r: 7.7, name: "Elnath", dominant: false },
      { cx: 344.3, cy: 280.1, r: 5.2, name: null, dominant: false },
      { cx: 441.2, cy: 313, r: 4.8, name: null, dominant: false },
      { cx: 337.2, cy: 357.7, r: 4.5, name: null, dominant: false },
      { cx: 448, cy: 321.4, r: 4.9, name: null, dominant: false },
      { cx: 413.1, cy: 424.4, r: 4, name: null, dominant: false },
    ],
  },
  'gemini': {
    paths: [
      { d: "M448 253.9 L413.7 253.8 L324.6 205.7 L209.1 111.7 L109.5 81.6 L64 152.5 L103.9 173.3 L171 263.5 L239 289.5 L351 366.1 L318.9 430.4", length: 910.5 },
      { d: "M171 263.5 L179.6 363.5", length: 100.4 },
    ],
    stars: [
      { cx: 448, cy: 253.9, r: 5.4, name: "Propus", dominant: false },
      { cx: 413.7, cy: 253.8, r: 6, name: "Tejat", dominant: false },
      { cx: 324.6, cy: 205.7, r: 5.7, name: "Mebsuta", dominant: false },
      { cx: 209.1, cy: 111.7, r: 3.8, name: null, dominant: false },
      { cx: 109.5, cy: 81.6, r: 7.8, name: "Castor", dominant: false },
      { cx: 64, cy: 152.5, r: 8.4, name: "Pollux", dominant: true },
      { cx: 103.9, cy: 173.3, r: 4.3, name: null, dominant: false },
      { cx: 171, cy: 263.5, r: 5.1, name: "Wasat", dominant: false },
      { cx: 239, cy: 289.5, r: 4.4, name: "Mekbuda", dominant: false },
      { cx: 351, cy: 366.1, r: 7.3, name: "Alhena", dominant: false },
      { cx: 318.9, cy: 430.4, r: 5.3, name: "Alzirr", dominant: false },
      { cx: 179.6, cy: 363.5, r: 5, name: null, dominant: false },
    ],
  },
  'cancer': {
    paths: [
      { d: "M158.7 395.6 L222.7 272.1 L229.2 207 L213.3 64", length: 348.4 },
      { d: "M222.7 272.1 L353.3 448", length: 219.1 },
    ],
    stars: [
      { cx: 158.7, cy: 395.6, r: 4, name: "Acubens", dominant: false },
      { cx: 222.7, cy: 272.1, r: 4.5, name: "Asellus Australis", dominant: false },
      { cx: 229.2, cy: 207, r: 3.5, name: "Asellus Borealis", dominant: false },
      { cx: 213.3, cy: 64, r: 4.4, name: "Zubanah", dominant: false },
      { cx: 353.3, cy: 448, r: 5.1, name: "Tarf", dominant: true },
    ],
  },
  'leo': {
    paths: [
      { d: "M377.8 348.6 L381.1 285.3 L341.7 244.7 L172.9 235.7 L64 314.2 L172.5 302.9 L377.8 348.6", length: 742.7 },
      { d: "M341.7 244.7 L351.9 197.6 L426.5 163.4 L448 192.9", length: 166.8 },
    ],
    stars: [
      { cx: 377.8, cy: 348.6, r: 8.1, name: "Regulus", dominant: true },
      { cx: 381.1, cy: 285.3, r: 5.1, name: "Al Jabhah", dominant: false },
      { cx: 341.7, cy: 244.7, r: 7.2, name: "Algieba", dominant: false },
      { cx: 172.9, cy: 235.7, r: 6.4, name: "Zosma", dominant: false },
      { cx: 64, cy: 314.2, r: 7, name: "Denebola", dominant: false },
      { cx: 172.5, cy: 302.9, r: 5.3, name: "Chertan", dominant: false },
      { cx: 351.9, cy: 197.6, r: 5.2, name: "Adhafera", dominant: false },
      { cx: 426.5, cy: 163.4, r: 4.6, name: "Rasalas", dominant: false },
      { cx: 448, cy: 192.9, r: 5.8, name: "Algenubi", dominant: false },
    ],
  },
  'virgo': {
    paths: [
      { d: "M448 199.5 L437.7 240.1 L375.5 260.8 L329.2 267.5 L269 302.3 L236.5 350.2 L128.4 306.2 L70.8 303.3", length: 456 },
      { d: "M285.5 161.8 L299.5 226.2 L329.2 267.5", length: 116.8 },
      { d: "M269 302.3 L216.3 260.2 L158.9 242 L64 239", length: 222.6 },
    ],
    stars: [
      { cx: 448, cy: 199.5, r: 4.3, name: null, dominant: false },
      { cx: 437.7, cy: 240.1, r: 5, name: "Zavijava", dominant: false },
      { cx: 375.5, cy: 260.8, r: 4.6, name: "Zaniah", dominant: false },
      { cx: 329.2, cy: 267.5, r: 6.2, name: "Porrima", dominant: false },
      { cx: 269, cy: 302.3, r: 3.9, name: "Apami-Atsa", dominant: false },
      { cx: 236.5, cy: 350.2, r: 8.6, name: "Spica", dominant: true },
      { cx: 128.4, cy: 306.2, r: 4.3, name: "Syrma", dominant: false },
      { cx: 70.8, cy: 303.3, r: 4.6, name: "Rijl al Awwa", dominant: false },
      { cx: 285.5, cy: 161.8, r: 6, name: "Vindemiatrix", dominant: false },
      { cx: 299.5, cy: 226.2, r: 5.3, name: "Minelauva", dominant: false },
      { cx: 216.3, cy: 260.2, r: 5.3, name: "Heze", dominant: false },
      { cx: 158.9, cy: 242, r: 4.1, name: null, dominant: false },
      { cx: 64, cy: 239, r: 4.8, name: null, dominant: false },
    ],
  },
  'libra': {
    paths: [
      { d: "M303.4 363.4 L361.9 189.4 L246.1 64 L163.9 165.8 L157.3 417.1 L150.1 448", length: 768.2 },
      { d: "M361.9 189.4 L163.9 165.8", length: 199.4 },
    ],
    stars: [
      { cx: 303.4, cy: 363.4, r: 5.5, name: "Brachium", dominant: false },
      { cx: 361.9, cy: 189.4, r: 6.2, name: "Zubenelgenubi", dominant: false },
      { cx: 246.1, cy: 64, r: 6.3, name: "Zubeneschamali", dominant: true },
      { cx: 163.9, cy: 165.8, r: 4.5, name: "Zubenelhakrabi", dominant: false },
      { cx: 157.3, cy: 417.1, r: 5, name: null, dominant: false },
      { cx: 150.1, cy: 448, r: 4.9, name: null, dominant: false },
    ],
  },
  'scorpio': {
    paths: [
      { d: "M445.9 167.4 L440.7 110.1 L422.9 64", length: 107 },
      { d: "M440.7 110.1 L367.9 158.8 L339.2 172.6 L316.5 201.8 L266.7 301.4 L260.7 362.9 L251.2 433.6 L189.9 448 L102 444 L66.1 397 L83.9 379 L115 347.5", length: 680.6 },
    ],
    stars: [
      { cx: 445.9, cy: 167.4, r: 6, name: "Fang", dominant: false },
      { cx: 440.7, cy: 110.1, r: 6.8, name: "Dschubba", dominant: false },
      { cx: 422.9, cy: 64, r: 6.4, name: "Acrab", dominant: false },
      { cx: 367.9, cy: 158.8, r: 5.9, name: "Alniyat", dominant: false },
      { cx: 339.2, cy: 172.6, r: 8.5, name: "Antares", dominant: true },
      { cx: 316.5, cy: 201.8, r: 6.1, name: "Paikauhale", dominant: false },
      { cx: 266.7, cy: 301.4, r: 6.8, name: "Larawag", dominant: false },
      { cx: 260.7, cy: 362.9, r: 5.8, name: "Xamidimura", dominant: false },
      { cx: 251.2, cy: 433.6, r: 4.9, name: "Grafias", dominant: false },
      { cx: 189.9, cy: 448, r: 5.4, name: null, dominant: false },
      { cx: 102, cy: 444, r: 7.4, name: "Sargas", dominant: false },
      { cx: 66.1, cy: 397, r: 5.8, name: "Girtab", dominant: false },
      { cx: 83.9, cy: 379, r: 6.7, name: "Mula", dominant: false },
      { cx: 115, cy: 347.5, r: 7.7, name: "Shaula", dominant: false },
    ],
  },
  'sagittarius': {
    paths: [
      { d: "M387.4 344.3 L368.4 312.3 L377.6 250.9 L357.3 191.5 L398.6 132.8", length: 233.8 },
      { d: "M198.2 448 L194.5 396.2 L256.5 251.6 L305.8 212.7 L357.3 191.5", length: 327.8 },
      { d: "M103.2 413.1 L90.2 324.3 L101.5 203.4 L157.2 184.3 L190.5 179.2 L218.8 189.3 L277.8 203.3 L305.8 212.7 L377.6 250.9 L421.8 258.9 L368.4 312.3 L256.5 251.6 L243.9 221.8 L277.8 203.3 L250.4 142 L235.6 132.3 L212.7 104.4 L201 89.5 L200.8 64", length: 989.4 },
      { d: "M250.4 142 L270.7 133.4 L281 155.5 L277.8 203.3", length: 94.3 },
    ],
    stars: [
      { cx: 387.4, cy: 344.3, r: 5.7, name: "Hamalwarid", dominant: false },
      { cx: 368.4, cy: 312.3, r: 7.5, name: "Kaus Australis", dominant: true },
      { cx: 377.6, cy: 250.9, r: 6.2, name: "Kaus Media", dominant: false },
      { cx: 357.3, cy: 191.5, r: 6.1, name: "Kaus Borealis", dominant: false },
      { cx: 398.6, cy: 132.8, r: 4.6, name: "Polis", dominant: false },
      { cx: 198.2, cy: 448, r: 4.5, name: "Arkab Prior", dominant: false },
      { cx: 194.5, cy: 396.2, r: 4.5, name: "Rukbat", dominant: false },
      { cx: 256.5, cy: 251.6, r: 6.4, name: "Ascella", dominant: false },
      { cx: 305.8, cy: 212.7, r: 5.6, name: "Namalsadirah", dominant: false },
      { cx: 103.2, cy: 413.1, r: 4.2, name: null, dominant: false },
      { cx: 90.2, cy: 324.3, r: 3.9, name: null, dominant: false },
      { cx: 101.5, cy: 203.4, r: 3.4, name: "Terebellum", dominant: false },
      { cx: 157.2, cy: 184.3, r: 3.6, name: null, dominant: false },
      { cx: 190.5, cy: 179.2, r: 3, name: null, dominant: false },
      { cx: 218.8, cy: 189.3, r: 3.2, name: "Al Kiladah", dominant: false },
      { cx: 277.8, cy: 203.3, r: 7.1, name: "Nunki", dominant: false },
      { cx: 421.8, cy: 258.9, r: 5.8, name: "Alnasl", dominant: false },
      { cx: 243.9, cy: 221.8, r: 5.4, name: null, dominant: false },
      { cx: 250.4, cy: 142, r: 4.7, name: "Manubrij", dominant: false },
      { cx: 235.6, cy: 132.3, r: 6, name: "Albaldah", dominant: false },
      { cx: 212.7, cy: 104.4, r: 3.2, name: null, dominant: false },
      { cx: 201, cy: 89.5, r: 4.5, name: null, dominant: false },
      { cx: 200.8, cy: 64, r: 3.7, name: null, dominant: false },
      { cx: 270.7, cy: 133.4, r: 5.1, name: null, dominant: false },
      { cx: 281, cy: 155.5, r: 3.2, name: "Ainalrami", dominant: false },
    ],
  },
  'capricorn': {
    paths: [
      { d: "M448 124.5 L433.6 166 L399.8 221.3 L325.8 357.4 L301.2 387.5 L151.5 305.2 L64 190.5 L93.9 200.3 L170.5 203.4 L240.5 210.7 L448 124.5", length: 1020.8 },
    ],
    stars: [
      { cx: 448, cy: 124.5, r: 4, name: "Prima Giedi", dominant: false },
      { cx: 433.6, cy: 166, r: 5.7, name: "Dabih", dominant: false },
      { cx: 399.8, cy: 221.3, r: 3.3, name: null, dominant: false },
      { cx: 325.8, cy: 357.4, r: 4.2, name: "Wei", dominant: false },
      { cx: 301.2, cy: 387.5, r: 4.2, name: null, dominant: false },
      { cx: 151.5, cy: 305.2, r: 4.7, name: "Yen", dominant: false },
      { cx: 64, cy: 190.5, r: 6, name: "Deneb Algedi", dominant: true },
      { cx: 93.9, cy: 200.3, r: 4.8, name: "Nashira", dominant: false },
      { cx: 170.5, cy: 203.4, r: 4, name: null, dominant: false },
      { cx: 240.5, cy: 210.7, r: 4.3, name: null, dominant: false },
    ],
  },
  'aquarius': {
    paths: [
      { d: "M448 252.4 L437 247.8 L351.2 217.3 L275.7 170.2 L240.7 179.8 L224.9 167.5 L210.5 168.4 L172.4 235.2 L116.6 249.6 L135.3 357", length: 506.3 },
      { d: "M351.2 217.3 L274.3 291.6", length: 106.9 },
      { d: "M275.7 170.2 L251.3 237.1", length: 71.2 },
      { d: "M224.9 167.5 L232.7 155", length: 14.7 },
      { d: "M105.5 347.4 L116.6 249.6 L64 326.9", length: 191.9 },
    ],
    stars: [
      { cx: 448, cy: 252.4, r: 4.7, name: "Albali", dominant: false },
      { cx: 437, cy: 247.8, r: 3.4, name: "Albulan", dominant: false },
      { cx: 351.2, cy: 217.3, r: 5.9, name: "Sadalsuud", dominant: true },
      { cx: 275.7, cy: 170.2, r: 5.9, name: "Sadalmelik", dominant: false },
      { cx: 240.7, cy: 179.8, r: 4.6, name: "Sadachbia", dominant: false },
      { cx: 224.9, cy: 167.5, r: 4.9, name: "Sadaltager", dominant: false },
      { cx: 210.5, cy: 168.4, r: 4.3, name: null, dominant: false },
      { cx: 172.4, cy: 235.2, r: 4.8, name: "Hydor", dominant: false },
      { cx: 116.6, cy: 249.6, r: 3.8, name: null, dominant: false },
      { cx: 135.3, cy: 357, r: 4.8, name: null, dominant: false },
      { cx: 274.3, cy: 291.6, r: 4, name: null, dominant: false },
      { cx: 251.3, cy: 237.1, r: 4.2, name: "Ancha", dominant: false },
      { cx: 232.7, cy: 155, r: 3.3, name: "Seat", dominant: false },
      { cx: 105.5, cy: 347.4, r: 4.5, name: null, dominant: false },
      { cx: 64, cy: 326.9, r: 3.3, name: null, dominant: false },
    ],
  },
  'pisces': {
    paths: [
      { d: "M168.1 176.2 L172.6 126.9 L155.8 152.2 L168.1 176.2 L173 208 L129.9 258.9 L99.9 314.3 L64 371.6 L82.3 367.8 L108.4 347.2 L132.7 341.3 L168.1 328.5 L191.4 325.7 L222.1 328.4 L328.5 334.9 L370.3 346 L396.1 339.2 L412.5 348.1 L419.4 366.9 L398.3 385.1 L365.7 380.4 L356.4 365.1 L370.3 346", length: 822.8 },
      { d: "M419.4 366.9 L448 362.1", length: 29 },
    ],
    stars: [
      { cx: 168.1, cy: 176.2, r: 3.5, name: null, dominant: false },
      { cx: 172.6, cy: 126.9, r: 3.7, name: null, dominant: false },
      { cx: 155.8, cy: 152.2, r: 3.4, name: null, dominant: false },
      { cx: 173, cy: 208, r: 3.5, name: null, dominant: false },
      { cx: 129.9, cy: 258.9, r: 4.9, name: "Alpherg", dominant: true },
      { cx: 99.9, cy: 314.3, r: 4, name: "Torcular", dominant: false },
      { cx: 64, cy: 371.6, r: 4.7, name: "Alrescha", dominant: false },
      { cx: 82.3, cy: 367.8, r: 3.5, name: null, dominant: false },
      { cx: 108.4, cy: 347.2, r: 3.8, name: null, dominant: false },
      { cx: 132.7, cy: 341.3, r: 3.2, name: null, dominant: false },
      { cx: 168.1, cy: 328.5, r: 3, name: "Revati", dominant: false },
      { cx: 191.4, cy: 325.7, r: 4, name: null, dominant: false },
      { cx: 222.1, cy: 328.4, r: 3.8, name: "Kuton", dominant: false },
      { cx: 328.5, cy: 334.9, r: 4.4, name: null, dominant: false },
      { cx: 370.3, cy: 346, r: 4.2, name: null, dominant: false },
      { cx: 396.1, cy: 339.2, r: 4, name: null, dominant: false },
      { cx: 412.5, cy: 348.1, r: 3, name: null, dominant: false },
      { cx: 419.4, cy: 366.9, r: 4.8, name: null, dominant: false },
      { cx: 398.3, cy: 385.1, r: 3.1, name: null, dominant: false },
      { cx: 365.7, cy: 380.4, r: 3.7, name: null, dominant: false },
      { cx: 356.4, cy: 365.1, r: 3.1, name: null, dominant: false },
      { cx: 448, cy: 362.1, r: 3.7, name: "Fumalsamakah", dominant: false },
    ],
  },
};
