import { describe, it, expect } from 'vitest';
import { handleApiError } from '../ErrorHandler';

describe('Error Handler', () => {
  it('should handle 401 error', () => {
    const error = {
      response: { status: 401 }
    };
    expect(handleApiError(error)).toBe('Niste autorizovani. Prijavite se ponovo.');
  });

  it('should handle 404 error', () => {
    const error = {
      response: { status: 404 }
    };
    expect(handleApiError(error)).toBe('Resurs nije pronađen.');
  });

  it('should handle network error', () => {
    const error = {
      request: {}
    };
    expect(handleApiError(error)).toBe('Nema odgovora od servera. Proverite internet konekciju.');
  });

  it('should handle generic error', () => {
    const error = {
      message: 'Something went wrong'
    };
    expect(handleApiError(error)).toBe('Došlo je do greške. Pokušajte ponovo.');
  });
});