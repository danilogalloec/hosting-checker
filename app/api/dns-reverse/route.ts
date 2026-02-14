import { NextRequest, NextResponse } from 'next/server';
import { getReverseDns } from '@/lib/services/dns-reverse';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { domain } = body;

        if (!domain) {
            return NextResponse.json(
                { error: 'Domain or IP is required' },
                { status: 400 }
            );
        }

        const result = await getReverseDns(domain);
        return NextResponse.json(result);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
