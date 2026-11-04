import { EcontAppError } from '@/lib/econt/types';
import type { EcontServiceError } from '@/lib/econt/types';

export function mapEcontTransportError(cause: unknown): EcontAppError {
  return new EcontAppError({
    code: 'ECONT_NETWORK',
    title: 'Временен проблем с Еконт',
    message: 'Не успяхме да получим отговор от тестовата система на Еконт. Опитайте отново.',
    suggestion: 'Проверете интернет връзката и опитайте след малко.',
    retryable: true,
    httpStatus: 503,
    raw: cause instanceof Error ? cause.message : cause,
  });
}

export function mapEcontHttpError(
  status: number,
  message: string,
  raw?: EcontServiceError | unknown
): EcontAppError {
  const lower = message.toLowerCase();
  if (status === 401 || status === 403) {
    return new EcontAppError({
      code: 'ECONT_AUTH',
      title: 'Грешка при достъп до Еконт Demo',
      message: 'Тестовите данни за Еконт не са валидни или нямате достъп.',
      suggestion: 'Проверете ECONT_USERNAME и ECONT_PASSWORD в средата на сървъра.',
      retryable: false,
      httpStatus: status,
      raw,
    });
  }
  if (status === 429) {
    return new EcontAppError({
      code: 'ECONT_RATE_LIMIT',
      title: 'Твърде много заявки към Еконт',
      message: 'Еконт Demo временно ограничи заявките.',
      suggestion: 'Изчакайте и опитайте отново.',
      retryable: true,
      httpStatus: status,
      raw,
    });
  }
  if (status >= 500) {
    return new EcontAppError({
      code: 'ECONT_SERVER',
      title: 'Временен проблем с Еконт',
      message: 'Не успяхме да получим отговор от тестовата система на Еконт. Опитайте отново.',
      retryable: true,
      httpStatus: status,
      raw,
    });
  }
  if (lower.includes('office') || lower.includes('офис')) {
    return new EcontAppError({
      code: 'ECONT_INVALID_OFFICE',
      field: 'receiverOfficeCode',
      title: 'Офисът не е разпознат',
      message: 'Избраният офис не е намерен в актуалния списък на Еконт.',
      suggestion: 'Изберете друг офис от падащото меню.',
      retryable: false,
      httpStatus: 400,
      raw,
    });
  }
  if (lower.includes('phone') || lower.includes('тел')) {
    return new EcontAppError({
      code: 'ECONT_INVALID_PHONE',
      field: 'receiverPhone',
      title: 'Невалиден телефон',
      message: 'Телефонният номер не е в поддържания формат.',
      suggestion: 'Проверете номера и опитайте отново.',
      retryable: false,
      httpStatus: 400,
      raw,
    });
  }
  return new EcontAppError({
    code: 'ECONT_VALIDATION',
    title: 'Грешка при валидация на пратката',
    message: message || 'Еконт отхвърли данните за пратката.',
    suggestion: 'Прегледайте полетата и опитайте отново.',
    retryable: false,
    httpStatus: status >= 400 && status < 500 ? status : 400,
    raw,
  });
}

export function toStructuredError(err: unknown): EcontAppError {
  if (err instanceof EcontAppError) return err;
  if (err instanceof Error) {
    if (err.message.includes('ECONT_USERNAME') || err.message.includes('ECONT_API_URL') || err.message.includes('ECONT_ENV')) {
      return new EcontAppError({
        code: 'ECONT_NOT_CONFIGURED',
        title: 'Econt Demo не е конфигуриран',
        message:
          'Липсват ECONT_* променливи или dev сървърът не е рестартиран след промяна на .env.local.',
        suggestion: 'Добавете ECONT_USERNAME/ECONT_PASSWORD и рестартирайте npm run dev.',
        retryable: false,
        httpStatus: 503,
      });
    }
  }
  return new EcontAppError({
    code: 'INTERNAL_ERROR',
    title: 'Неочаквана грешка',
    message: 'Възникна неочаквана грешка. Опитайте отново.',
    suggestion:
      err instanceof Error && err.message
        ? err.message
        : 'Ако проблемът продължава, свържете се с поддръжка.',
    retryable: true,
    httpStatus: 500,
  });
}
