import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from '../http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  it('should format HttpException responses consistently', () => {
    const exception = new BadRequestException('Invalid input');
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({
          url: '/api/v1/uploads/presign',
          method: 'POST',
        }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const calls = json.mock.calls as Array<
      [
        {
          statusCode: number;
          path: string;
          method: string;
          message: string;
          timestamp: string;
        },
      ]
    >;
    const responseBody = calls[0][0];
    expect(responseBody).toMatchObject({
      statusCode: HttpStatus.BAD_REQUEST,
      path: '/api/v1/uploads/presign',
      method: 'POST',
      message: 'Invalid input',
    });
    expect(responseBody.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
