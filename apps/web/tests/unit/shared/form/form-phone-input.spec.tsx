import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { FormPhoneInput } from '@/shared/form';
import { FieldProbe, FormHarness } from './harness';

afterEach(cleanup);

describe('FormPhoneInput', () => {
  it('binds the phone value and blur to the form field', async () => {
    const user = userEvent.setup();
    render(
      <FormHarness defaultValues={{ phone: '' }}>
        {(form) => (
          <>
            <FormPhoneInput form={form} name="phone" label="Teléfono" defaultCountry="VE" />
            <FieldProbe form={form} name="phone" />
          </>
        )}
      </FormHarness>,
    );

    await user.type(screen.getByRole('textbox'), '4121234567');

    expect(screen.getByTestId('value-phone').textContent).toContain('4121234567');

    await user.tab();

    expect(screen.getByTestId('blur-phone').textContent).toBe('blurred');
  });
});
