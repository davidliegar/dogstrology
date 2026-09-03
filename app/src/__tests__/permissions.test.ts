import appJson from '../../app.json';

/**
 * **La app pide tres permisos y ninguno más**, y esto lo ata.
 *
 * `expo-image-picker` declara por su cuenta cámara y micrófono, por si abres la
 * cámara — y Dogstrology solo elige una foto de la galería. Un usuario que ve
 * «Cámara y micrófono» en la ficha de una app de astrología para perros
 * desconfía con razón, y en una revisión de Play eso son preguntas.
 *
 * Se rompe solo: basta que alguien quite las opciones del plugin al reinstalar
 * la dependencia y los permisos vuelven, sin error y sin que se note hasta que
 * está publicado.
 */
describe('los permisos que se piden', () => {
  const plugins = appJson.expo.plugins as unknown as (string | [string, Record<string, unknown>])[];
  const imagePicker = plugins.find(
    (plugin): plugin is [string, Record<string, unknown>] =>
      Array.isArray(plugin) && plugin[0] === 'expo-image-picker',
  );

  it('el selector de fotos está configurado a mano y no por defecto', () => {
    expect(imagePicker).toBeDefined();
  });

  it('ni cámara ni micrófono: la app solo elige de la galería', () => {
    // `false` es lo que hace que el plugin los **bloquee**; quitarlos de aquí
    // no los deja fuera, los vuelve a poner.
    expect(imagePicker?.[1].cameraPermission).toBe(false);
    expect(imagePicker?.[1].microphonePermission).toBe(false);
  });

  it('y el texto del permiso de fotos dice para qué es', () => {
    // Lo lee el usuario en el diálogo del sistema: es el único sitio donde se
    // puede explicar antes de que decida.
    expect(String(imagePicker?.[1].photosPermission)).toContain('retrato de tu mascota');
  });
});
