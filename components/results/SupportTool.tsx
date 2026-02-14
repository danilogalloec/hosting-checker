'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SupportTool() {
    const [clientInfo, setClientInfo] = useState<{ ip: string; hostname: string; userAgent: string } | null>(null);
    const [targetDomain, setTargetDomain] = useState('');
    const [targetServer, setTargetServer] = useState<string | null>(null);
    const [resolving, setResolving] = useState(false);
    const [copied, setCopied] = useState(false);

    // Fetch Client Info on Mount
    useEffect(() => {
        fetch('/api/my-ip')
            .then((res) => res.json())
            .then((data) => setClientInfo(data))
            .catch((err) => console.error('Failed to fetch user IP:', err));
    }, []);

    // Handle Domain Input Change (Debounced lookup could be added, but manual trigger is safer for now, 
    // or simple onBlur/Enter. User asked for "Real-time" so let's do a debounced effect)
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!targetDomain || !targetDomain.includes('.')) {
                setTargetServer(null);
                return;
            }

            setResolving(true);
            try {
                const res = await fetch('/api/dns-reverse', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ domain: targetDomain }),
                });
                const data = await res.json();
                if (data.hostnames && data.hostnames.length > 0) {
                    setTargetServer(data.hostnames[0]);
                } else {
                    setTargetServer('N/A');
                }
            } catch (error) {
                setTargetServer('Error resolving');
            } finally {
                setResolving(false);
            }
        }, 800); // 800ms debounce

        return () => clearTimeout(timer);
    }, [targetDomain]);

    const generateJson = () => {
        const data: any = {
            ipv4: clientInfo?.ip || 'Loading...',
            hostname: clientInfo?.hostname || 'Loading...',
            userAgent: clientInfo?.userAgent || 'Loading...',
        };

        if (targetDomain) {
            data.target_server = resolving ? 'Resolving...' : (targetServer || 'Pending...');
        }

        return JSON.stringify(data, null, 2);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generateJson());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-3xl mx-auto mt-8">

            {/* JSON Code Block */}
            <div className="relative group rounded-lg overflow-hidden shadow-2xl border border-gray-800 bg-[#1e1e1e]">

                {/* Header / Actions */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-blue-400" />
                        <span className="text-xs font-mono text-gray-400">support_info.json</span>
                    </div>
                    <button
                        onClick={copyToClipboard}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                            copied
                                ? "bg-green-600/20 text-green-400"
                                : "bg-blue-600 text-white hover:bg-blue-500"
                        )}
                    >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied ? 'Copied!' : 'Copy JSON for Support'}
                    </button>
                </div>

                {/* Code Content */}
                <div className="p-6 overflow-x-auto">
                    <pre className="font-mono text-sm leading-relaxed text-[#d4d4d4]">
                        {generateJson()}
                    </pre>
                </div>
            </div>

            {/* Optional Input Section */}
            <div className="mt-8">
                <label htmlFor="domain-input" className="block text-sm font-medium text-gray-700 mb-2">
                    Optional: Enter your domain to identify your hosting server
                </label>
                <div className="relative">
                    <input
                        id="domain-input"
                        type="text"
                        value={targetDomain}
                        onChange={(e) => setTargetDomain(e.target.value)}
                        placeholder="e.g. mywebsite.com"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0056b3] focus:border-transparent outline-none transition-all shadow-sm text-gray-900 placeholder-gray-400"
                    />
                    {resolving && (
                        <div className="absolute right-3 top-3.5">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-[#0056b3]" />
                        </div>
                    )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                    This will resolve the domain's IP and reverse DNS (PTR) to identify the target server.
                </p>
            </div>

        </div>
    );
}
