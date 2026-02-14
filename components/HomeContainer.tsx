'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { SearchForm } from '@/components/ui/SearchForm';
import IpAnalysisTool from '@/components/results/IpAnalysisTool';
import SupportTool from '@/components/results/SupportTool';
import { Globe, Shield, Activity, Network } from 'lucide-react';
import React, { useState } from 'react';

// Define the Tabs components locally if the import fails, or assume they exist. 
// However, since I just wrote them, I should import them.
// To be safe against the previous failure, I will implement a robust HomeContainer.

export default function HomeContainer() {
    const [activeTab, setActiveTab] = useState('domain');

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-8">
            {/* Custom Tabs Implementation for simplicity and robustness */}
            <div className="flex flex-col space-y-8">

                {/* Tab List */}
                <div className="flex justify-center">
                    <div className="inline-flex bg-white border border-gray-200 p-1.5 rounded-xl shadow-sm">
                        <button
                            onClick={() => setActiveTab('domain')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'domain'
                                ? 'bg-blue-50 text-[#0056b3] shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Globe className="h-4 w-4" />
                            Domain Analysis
                        </button>
                        <button
                            onClick={() => setActiveTab('ip')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'ip'
                                ? 'bg-blue-50 text-[#0056b3] shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Network className="h-4 w-4" />
                            IP Analysis
                        </button>
                        <button
                            onClick={() => setActiveTab('myip')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'myip'
                                ? 'bg-blue-50 text-[#0056b3] shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Shield className="h-4 w-4" />
                            Ver mi IP
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="min-h-[500px]">
                    {activeTab === 'domain' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center max-w-3xl mx-auto py-8">
                                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                                    Complete Domain Analysis
                                </h1>
                                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                    Get instant insights about any domain's hosting, DNS configuration, and infrastructure
                                </p>

                                <div className="max-w-2xl mx-auto mb-10">
                                    <SearchForm autoFocus />
                                </div>

                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    <span className="text-sm text-gray-500 font-medium">Popular checks:</span>
                                    {['google.com', 'github.com', 'cloudflare.com'].map((domain) => (
                                        <a
                                            key={domain}
                                            href={`/results/${domain}`}
                                            className="text-sm px-4 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-[#0056b3] hover:text-[#0056b3] transition-all shadow-sm"
                                        >
                                            {domain}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ip' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <IpAnalysisTool />
                        </div>
                    )}

                    {activeTab === 'myip' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <SupportTool />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
