import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getReverseDns } from '@/lib/services/dns-reverse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    const headersList = headers();
    // Get IP from X-Forwarded-For (Hetzner/Nginx usually puts real IP here)
    const forwardedFor = headersList.get('x-forwarded-for');
    // If multiple IPs, the first one is the client
    const realIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    let hostname = 'Unknown';
    try {
        // Attempt to resolve client hostname
        const dnsResult = await getReverseDns(realIp);
        hostname = dnsResult.hostnames?.[0] || 'N/A';
    } catch (error) {
        console.error('Failed to resolve client hostname:', error);
    }

    return NextResponse.json({
        ip: realIp,
        hostname,
        userAgent: headersList.get('user-agent') || 'Unknown',
    });
}
