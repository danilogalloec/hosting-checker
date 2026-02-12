import { NextRequest } from 'next/server';
import { getHostingProvider } from '@/lib/services/hostingProvider';
import { validateAndSanitizeDomain } from '@/lib/utils/validators';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/utils/rateLimit';
import { handleAPIError, createSuccessResponse, createErrorResponse, RateLimitError } from '@/lib/utils/errorHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request);
    const rateLimitHeaders = createRateLimitHeaders(
      rateLimitResult.remaining,
      rateLimitResult.reset
    );

    if (!rateLimitResult.allowed) {
      throw new RateLimitError('Too many requests. Please try again later.');
    }

    // Obtener y validar dominio
    const { searchParams } = new URL(request.url);
    const domainParam = searchParams.get('domain');

    if (!domainParam) {
      return createErrorResponse('Domain parameter is required', 400, rateLimitHeaders);
    }

    const validation = validateAndSanitizeDomain(domainParam);
    if (!validation.valid) {
      return createErrorResponse(
        validation.error || 'Invalid domain format',
        400,
        rateLimitHeaders
      );
    }

    const domain = validation.domain!;

    // Obtener información del hosting provider
    const result = await getHostingProvider(domain);

    if (!result.success) {
      return createErrorResponse(
        result.error || 'Failed to fetch hosting provider',
        500,
        rateLimitHeaders
      );
    }

    return createSuccessResponse(result.data, result.cached, rateLimitHeaders);
  } catch (error) {
    const { response } = handleAPIError(error);
    return response;
  }
}
