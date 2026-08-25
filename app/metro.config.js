// Configuración de Metro (Expo SDK 57).
//
// `src/design/theme.ts` es un symlink al `design/theme.ts` de la raíz del
// repositorio: el sistema de diseño (BRD §11.2) es del proyecto entero, no de
// la app, y no queremos dos copias que diverjan. Metro resuelve el symlink,
// pero solo vigila lo que hay bajo el project root, así que sin esto editar el
// tema no recarga nada en caliente.
const path = require('path');

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.watchFolders = [path.resolve(__dirname, '..', 'design')];

module.exports = config;
