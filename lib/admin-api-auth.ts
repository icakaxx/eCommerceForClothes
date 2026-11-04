import 'server-only';

import { NextResponse } from 'next/server';
import { requireAdmin, type AdminUser } from '@/lib/auth-admin';
import { createRequestId } from '@/lib/logger';

export type StructuredAdminError = {
  success: false;
  error: {
    code: string;
    field?: string;
    title: string;
    message: string;
    suggestion?: string;
    retryable: boolean;
  };
  requestId: string;
};

export function structuredAdminErrorResponse(
  params: Omit<StructuredAdminError['error'], never> & {
    status?: number;
    requestId?: string;
  }
): NextResponse<StructuredAdminError> {
  const requestId = params.requestId ?? createRequestId();
  const { status = 400, code, field, title, message, suggestion, retryable } = params;
  return NextResponse.json(
    {
      success: false,
      error: { code, field, title, message, suggestion, retryable },
      requestId,
    },
    { status }
  );
}

export async function withAdminAuth(
  request: Request,
  handler: (admin: AdminUser, requestId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const requestId = createRequestId();
  try {
    const admin = await requireAdmin(request);
    return await handler(admin, requestId);
  } catch {
    return structuredAdminErrorResponse({
      status: 401,
      code: 'UNAUTHORIZED',
      title: 'Необходима е автентикация',
      message: 'Влезте като администратор, за да продължите.',
      suggestion: 'Отворете отново админ панела и влезте с валиден акаунт.',
      retryable: false,
      requestId,
    });
  }
}
