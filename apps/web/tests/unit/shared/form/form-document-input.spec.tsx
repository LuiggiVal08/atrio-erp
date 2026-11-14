import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { FormDocumentInput } from '@/shared/form';
import { FieldProbe, FormHarness } from './harness';

afterEach(cleanup);

describe('FormDocumentInput', () => {
  it('binds the identification type and document number to separate fields', async () => {
    const user = userEvent.setup();
    render(
      <FormHarness defaultValues={{ docNumber: '', docType: '' }}>
        {(form) => (
          <>
            <FormDocumentInput
              form={form}
              name="docNumber"
              identificationTypeName="docType"
              label="Documento"
              country="VE"
            />
            <FieldProbe form={form} name="docNumber" />
            <FieldProbe form={form} name="docType" />
          </>
        )}
      </FormHarness>,
    );

    await user.selectOptions(screen.getByRole('combobox'), 'CI');

    expect(screen.getByTestId('value-docType').textContent).toBe('"CI_VE"');

    await user.type(screen.getByPlaceholderText('V-###.###.###'), '12345678');

    expect(screen.getByTestId('value-docNumber').textContent).toBe('"12345678"');
  });
});
