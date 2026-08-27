import { MediaReference } from '@/pet/domain/MediaReference';
import { InMemoryPhotoStore } from '@/pet/testing/InMemoryPhotoStore';
import ResolvePetPhotoUseCase from '../ResolvePetPhotoUseCase';

const useCase = () => ResolvePetPhotoUseCase.create({ photos: new InMemoryPhotoStore() });

describe('ResolvePetPhotoUseCase', () => {
  it('convierte la referencia relativa en una URI absoluta', async () => {
    const uri = await useCase().execute({ photo: MediaReference.local({ relativePath: 'pets/baloo.jpg' }) });
    expect(uri).toBe('file:///documents/pets/baloo.jpg');
  });

  it('deja pasar la URL de una foto remota, para el día que las haya', async () => {
    const uri = await useCase().execute({ photo: MediaReference.remote({ url: 'https://cdn.example/baloo.jpg' }) });
    expect(uri).toBe('https://cdn.example/baloo.jpg');
  });

  it('sin foto devuelve undefined — y quien lo consuma tiene que traducirlo', async () => {
    // El dominio dice "no hay" con `undefined`, que es su convención. TanStack
    // Query es lo único que no lo acepta, así que la traducción a `null` vive
    // en el `queryFn` y no aquí: es una restricción de esa librería, no del
    // dominio.
    expect(await useCase().execute({ photo: undefined })).toBeUndefined();
  });
});
