import dns from 'dns/promises';
import { ReverseDnsResult } from '../types';
import { tryCatch } from '../utils/errorHandler';

/**
 * Realiza una búsqueda Reverse DNS (PTR) para una IP dada.
 * Si se pasa un dominio, primero resuelve la IP.
 */
export async function getReverseDns(input: string): Promise<ReverseDnsResult> {
    // Verificar si es IP (IPv4 o IPv6)
    const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(input) || /^([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}$/.test(input) || input === '::1';
    let targetIp = input;

    if (!isIp) {
        // Resolver dominio a IP
        const resolveResult = await tryCatch(
            async () => {
                const addresses = await dns.resolve4(input);
                return addresses[0];
            },
            `Error resolving domain ${input} to IP`
        );

        if (!resolveResult.success) {
            return {
                ip: '',
                hostnames: [],
                error: resolveResult.error || 'Could not resolve domain to IP'
            };
        }

        if (!resolveResult.data) {
            return {
                ip: '',
                hostnames: [],
                error: 'Resolved IP is empty'
            };
        }

        targetIp = resolveResult.data;
    }

    // Realizar Reverse DNS (PTR)
    const ptrResult = await tryCatch(
        async () => {
            const hostnames = await dns.reverse(targetIp);
            return hostnames;
        },
        `Error performing reverse DNS for IP ${targetIp}`
    );

    if (!ptrResult.success) {
        return {
            ip: targetIp,
            hostnames: [],
            error: ptrResult.error
        };
    }

    return {
        ip: targetIp,
        hostnames: ptrResult.data || []
    };
}
