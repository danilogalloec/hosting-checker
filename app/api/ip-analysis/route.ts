import { NextRequest, NextResponse } from 'next/server';
import { getGeolocationByIP } from '@/lib/services/geolocation';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { ip } = body;

        if (!ip) {
            return NextResponse.json(
                { error: 'IP address is required' },
                { status: 400 }
            );
        }

        // Reuse existing geolocation service
        const result = await getGeolocationByIP(ip);
        return NextResponse.json(result);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
