import { NextResponse } from 'next/server';
import { createRequestId, logger } from '@/lib/logger';

export type ApiErrorBody = {
  success: false;
  error: string;
  code: string;
  requestId: string;
};

const PUBLIC_MESSAGES: Record<string, string> = {
  INTERNAL_ERROR: 'Unable to complete the request.',
  VALIDATION_FAILED: 'The request could not be processed.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'Authentication is required.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  ORDER_FAILED: 'Unable to place the order. Please try again.',
  STOCK_UPDATE_FAILED: 'Unable to update inventory.',
  PRODUCT_SAVE_FAILED: 'Unable to save the product.',
};

export function apiErrorResponse(params: {
  code: keyof typeof PUBLIC_MESSAGES | string;
  status?: number;
  error?: unknown;
  requestId?: string;
  publicMessage?: string;
}): NextResponse<ApiErrorBody> {
  const requestId = params.requestId ?? createRequestId();
  const status = params.status ?? 500;
  const publicMessage =
    params.publicMessage ??
    PUBLIC_MESSAGES[params.code as keyof typeof PUBLIC_MESSAGES] ??
    PUBLIC_MESSAGES.INTERNAL_ERROR;

  logger.error(`[${requestId}] ${params.code}`, params.error);

  return NextResponse.json(
    {
      success: false,
      error: publicMessage,
      code: params.code,
      requestId,
    },
    { status }
  );
}

export function apiSuccessResponse<T extends Record<string, unknown>>(
  data: T,
  status = 200
): NextResponse<T & { success: true }> {
  return NextResponse.json({ success: true, ...data } as T & { success: true }, { status });
}
