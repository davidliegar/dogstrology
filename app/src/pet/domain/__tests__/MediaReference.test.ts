import { MediaReference } from '../MediaReference';

describe('MediaReference', () => {
  it('.local() construye una referencia local', () => {
    const r = MediaReference.local({ relativePath: 'pets/baloo.jpg' });
    expect(r.isLocal()).toBe(true);
    expect(r.relativePath()).toBe('pets/baloo.jpg');
    expect(r.url()).toBeUndefined();
  });

  it('.remote() construye una referencia remota', () => {
    const r = MediaReference.remote({ url: 'https://cdn.dogstrology.app/baloo.jpg' });
    expect(r.isLocal()).toBe(false);
    expect(r.url()).toBe('https://cdn.dogstrology.app/baloo.jpg');
  });

  it('.local() rechaza relativePath vacía', () => {
    expect(() => MediaReference.local({ relativePath: '' })).toThrow('[MediaReference] relativePath no puede estar vacía');
  });

  it('.local() rechaza relativePath ausente', () => {
    expect(() => MediaReference.local({} as never)).toThrow('[MediaReference] relativePath es obligatoria');
  });

  it('.remote() rechaza una url inválida', () => {
    expect(() => MediaReference.remote({ url: 'not-a-url' })).toThrow('[MediaReference] url inválida');
  });

  it('fromJSON(toJSON()) es circular para local y remota', () => {
    const local = MediaReference.local({ relativePath: 'a/b.jpg' });
    expect(MediaReference.fromJSON(local.toJSON()).toJSON()).toEqual(local.toJSON());

    const remote = MediaReference.remote({ url: 'https://example.com/a.jpg' });
    expect(MediaReference.fromJSON(remote.toJSON()).toJSON()).toEqual(remote.toJSON());
  });
});

describe('target()', () => {
  it('dice a dónde apunta, sea local o remota', () => {
    expect(MediaReference.local({ relativePath: 'pets/abc-1700000000000.jpg' }).target()).toBe(
      'pets/abc-1700000000000.jpg',
    );
    expect(MediaReference.remote({ url: 'https://cdn.example/foto.jpg' }).target()).toBe(
      'https://cdn.example/foto.jpg',
    );
  });

  /**
   * Es lo que deja cachear la foto por su ruta sin arriesgarse a enseñar la
   * vieja: `FileSystemPhotoStore` mete un sello de tiempo en cada nombre, así
   * que dos fotos distintas nunca comparten destino.
   */
  it('distingue dos fotos de la misma mascota', () => {
    const antes = MediaReference.local({ relativePath: 'pets/abc-1700000000000.jpg' });
    const despues = MediaReference.local({ relativePath: 'pets/abc-1700000009999.jpg' });

    expect(antes.target()).not.toBe(despues.target());
  });
});
