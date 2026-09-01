import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import { InMemoryShareSheet } from '../../testing/InMemoryShareSheet';
import ShareImageUseCase from '../ShareImageUseCase';

const PNG = 'iVBORw0KGgo=';

function useCase(sheet = InMemoryShareSheet.create()) {
  return { sheet, share: ShareImageUseCase.create({ sheet }) };
}

describe('ShareImageUseCase', () => {
  it('entrega la imagen con el nombre que va a leer el destino', async () => {
    const { sheet, share } = useCase();

    await share.execute({ png: PNG, name: 'baloo-25-agosto.png' });

    expect(sheet.shared).toEqual([{ png: PNG, name: 'baloo-25-agosto.png' }]);
  });

  it('una imagen vacía no llega a la hoja del sistema', async () => {
    // Allí fallaría igual, pero con un mensaje que ya no es nuestro.
    const { sheet, share } = useCase();

    await expect(share.execute({ png: '', name: 'vacia.png' })).rejects.toThrow(
      DomainError.withCodes(ErrorCode.SHARE_FAILED),
    );
    expect(sheet.shared).toEqual([]);
  });

  it('sin a dónde compartir no se abre nada', async () => {
    const sheet = InMemoryShareSheet.create();
    sheet.becomesUnavailable();
    const { share } = useCase(sheet);

    await expect(share.execute({ png: PNG, name: 'baloo.png' })).rejects.toThrow(
      DomainError.withCodes(ErrorCode.SHARE_FAILED),
    );
  });
});
