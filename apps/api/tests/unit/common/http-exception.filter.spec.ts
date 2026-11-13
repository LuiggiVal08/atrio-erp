import { BadRequestException, Logger } from '@nestjs/common';
import { GlobalExceptionFilter } from '../../../src/common/filters/http-exception.filter';

function createHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host: any = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ method: 'POST', url: '/api/v1/test' }),
    }),
  };
  return { host, status, json };
}

describe('GlobalExceptionFilter', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('forwards field errors when present', () => {
    const filter = new GlobalExceptionFilter();
    const { host, status, json } = createHost();
    const errors = [{ field: 'name', message: 'name should not be empty' }];

    filter.catch(
      new BadRequestException({ message: ['name should not be empty'], errors }),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, message: ['name should not be empty'], errors }),
    );
  });

  it('keeps the legacy shape when there are no field errors', () => {
    const filter = new GlobalExceptionFilter();
    const { host, json } = createHost();

    filter.catch(new BadRequestException('Invalid request'), host);

    const payload = json.mock.calls[0][0];
    expect(payload.message).toEqual(['Invalid request']);
    expect(payload.errors).toBeUndefined();
  });
});
