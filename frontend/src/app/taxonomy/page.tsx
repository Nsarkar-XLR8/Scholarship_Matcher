'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Globe, RefreshCw, ArrowRight } from 'lucide-react';

function TaxonomyRedirectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const continent = searchParams.get('continent');
    const country = searchParams.get('country');

    const params = new URLSearchParams();
    params.set('view', 'geography');
    if (continent) params.set('continent', continent);
    if (country) params.set('country', country);

    router.replace(`/search?${params.toString()}`);
  }, [searchParams, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-royal flex items-center justify-center border border-blue-200 animate-pulse shadow-sm">
        <Globe className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold font-outfit text-slate-navy">
        Redirecting to Unified Global Program Explorer...
      </h2>
      <p className="text-xs font-mono text-slate-500 max-w-md">
        The UN M49 Geographic Catalog is now integrated directly into Explore Programs with real-time degree filtering, visa rights, and scholarships.
      </p>
      <a
        href="/search?view=geography"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-royal text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all"
      >
        <span>Open UN Geographic Explorer</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

export default function TaxonomyPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-mono text-xs text-slate-500">Loading UN Geographic Explorer...</div>}>
      <TaxonomyRedirectContent />
    </Suspense>
  );
}
