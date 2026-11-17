import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/shared/lib/api/client';
import { ProfileView } from '@/core/auth/ProfileView';

const { setUser, user } = vi.hoisted(() => ({
  setUser: vi.fn(),
  user: {
    id: 'u1',
    email: 'ana@example.com',
    name: 'Ana',
    locale: 'es',
    phone: '123',
    imageUrl: null,
    enabledModules: [],
    tenantId: 't1',
  },
}));

vi.mock('@/core/auth/store', () => ({
  useAuthStore: Object.assign(() => ({ user, setUser }), {
    getState: () => ({ logout: vi.fn() }),
  }),
}));

vi.mock('@/core/tenant/store', () => ({
  useTenantStore: { getState: () => ({ activeTenantId: 't1' }) },
}));

vi.mock('@/shared/lib/api/client', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api, true);

function mockProfileLoad() {
  mockedApi.get.mockImplementation((url: string) => {
    if (url === '/users/me') {
      return Promise.resolve({
        data: { name: 'Ana', locale: 'es', phone: '123', employeeId: null },
      });
    }
    if (url === '/users/me/security-questions') {
      return Promise.resolve({ data: { questions: [] } });
    }
    return Promise.resolve({ data: [] });
  });
}

describe('ProfileView', () => {
  beforeEach(() => {
    mockProfileLoad();
    mockedApi.patch.mockResolvedValue({ data: { name: 'Ana Pérez', locale: 'es', phone: '555' } });
    mockedApi.put.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('loads the profile and submits the general data', async () => {
    render(<ProfileView />);

    const name = screen.getByLabelText('Nombre') as HTMLInputElement;
    await waitFor(() => expect(name.value).toBe('Ana'));

    fireEvent.change(name, { target: { value: '  Ana Pérez  ' } });
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '555' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(mockedApi.patch).toHaveBeenCalledWith('/users/me', {
      name: 'Ana Pérez',
      locale: 'es',
      phone: '555',
      employeeId: null,
    }));
    expect(setUser).toHaveBeenCalledWith({ name: 'Ana Pérez', locale: 'es', phone: '555' });
  });

  it('validates that the password confirmation matches', async () => {
    render(<ProfileView />);
    await waitFor(() => expect((screen.getByLabelText('Nombre') as HTMLInputElement).value).toBe('Ana'));

    fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'old-pass' } });
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'new-password' } });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'other-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar contraseña' }));

    expect(await screen.findByText('La confirmación de contraseña no coincide')).toBeTruthy();
    expect(mockedApi.patch).not.toHaveBeenCalledWith('/users/me/password', expect.anything());
  });

  it('rejects duplicate security questions', async () => {
    render(<ProfileView />);
    await waitFor(() => expect((screen.getByLabelText('Nombre') as HTMLInputElement).value).toBe('Ana'));

    const question = '¿Cuál fue tu primera escuela?';
    fireEvent.change(screen.getByLabelText('Pregunta de seguridad 1'), { target: { value: question } });
    fireEvent.change(screen.getByLabelText('Pregunta de seguridad 2'), { target: { value: question } });
    fireEvent.change(screen.getByLabelText('Pregunta de seguridad 3'), {
      target: { value: '¿Cuál fue el nombre de tu primera mascota?' },
    });
    for (const position of [1, 2, 3]) {
      fireEvent.change(screen.getByLabelText(`Respuesta de seguridad ${position}`), {
        target: { value: 'respuesta' },
      });
    }

    fireEvent.click(screen.getByRole('button', { name: 'Guardar preguntas' }));

    expect(await screen.findByText('Selecciona tres preguntas diferentes')).toBeTruthy();
    expect(mockedApi.put).not.toHaveBeenCalled();
  });

  it('saves security answers and clears them afterwards', async () => {
    render(<ProfileView />);
    await waitFor(() => expect((screen.getByLabelText('Nombre') as HTMLInputElement).value).toBe('Ana'));

    fireEvent.change(screen.getByLabelText('Pregunta de seguridad 1'), {
      target: { value: '¿Cuál fue tu primera escuela?' },
    });
    fireEvent.change(screen.getByLabelText('Pregunta de seguridad 2'), {
      target: { value: '¿Cuál fue el nombre de tu primera mascota?' },
    });
    fireEvent.change(screen.getByLabelText('Pregunta de seguridad 3'), {
      target: { value: '¿Cuál es el nombre de tu ciudad de nacimiento?' },
    });
    for (const position of [1, 2, 3]) {
      fireEvent.change(screen.getByLabelText(`Respuesta de seguridad ${position}`), {
        target: { value: 'respuesta' },
      });
    }

    fireEvent.click(screen.getByRole('button', { name: 'Guardar preguntas' }));

    await waitFor(() => expect(mockedApi.put).toHaveBeenCalledTimes(1));
    expect(mockedApi.put).toHaveBeenCalledWith('/users/me/security-questions', {
      answers: [
        { position: 1, question: '¿Cuál fue tu primera escuela?', answer: 'respuesta' },
        { position: 2, question: '¿Cuál fue el nombre de tu primera mascota?', answer: 'respuesta' },
        { position: 3, question: '¿Cuál es el nombre de tu ciudad de nacimiento?', answer: 'respuesta' },
      ],
    });
    expect((screen.getByLabelText('Respuesta de seguridad 1') as HTMLInputElement).value).toBe('');
  });

  it('shows server errors without losing the entered data', async () => {
    mockedApi.patch.mockRejectedValueOnce({
      response: { data: { message: 'No se pudo guardar el perfil' } },
    });
    render(<ProfileView />);

    const name = screen.getByLabelText('Nombre') as HTMLInputElement;
    await waitFor(() => expect(name.value).toBe('Ana'));
    fireEvent.change(name, { target: { value: 'Ana Pérez' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      expect.stringContaining('No se pudo guardar el perfil'),
    );
    expect(name.value).toBe('Ana Pérez');
  });
});
