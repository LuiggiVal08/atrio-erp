import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { FormAddressInput } from '@/shared/form';
import { FieldProbe, FormHarness } from './harness';

afterEach(cleanup);

const initialAddress = {
  country: 'VE',
  state: '',
  city: '',
  addressLine: '',
  reference: '',
};

describe('FormAddressInput', () => {
  it('binds nested address values to the form field', async () => {
    const user = userEvent.setup();
    render(
      <FormHarness defaultValues={{ address: initialAddress }}>
        {(form) => (
          <>
            <FormAddressInput form={form} name="address" label="Dirección" />
            <FieldProbe form={form} name="address" />
          </>
        )}
      </FormHarness>,
    );

    await user.type(screen.getByPlaceholderText('Ciudad'), 'Caracas');

    expect(screen.getByTestId('value-address').textContent).toContain('"city":"Caracas"');
  });
});
