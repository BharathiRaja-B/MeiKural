import { useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getGetEvaluationResultsQueryKey, getGetHealthQueryKey, getGetKuralQueryKey, getHealthCheckQueryKey, useGuardAnswer, useGetEvaluationResults, useGetHealth, useGetKural, useHealthCheck, useVerifyQuote } from '@workspace/api-client-react';
import type { EvaluationResults, GuardQuote, Kural, Verification } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { Activity, ArrowRight, BookOpen, Check, ChevronDown, CircleHelp, Clipboard, FileSearch, Gauge, Leaf, LoaderCircle, RefreshCw, ScanText, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts';

const queryClient = new QueryClient();
type Tab = 'verify' | 'guard' | 'evaluation';

const tabs: { id: Tab; label: string; icon: typeof ScanText; note: string }[] = [
  { id: 'verify', label: 'Verify', icon: FileSearch, note: 'One quote, carefully checked' },
  { id: 'guard', label: 'Guard', icon: ShieldCheck, note: 'Review an entire answer' },
  { id: 'evaluation', label: 'Evaluation', icon: Gauge, note: 'Inspect corpus performance' },
];

function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('verify');
  const health = useGetHealth({ query: { queryKey: getGetHealthQueryKey() } });
  const healthz = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const apiOnline = Boolean(health.data || healthz.data);
  return (
    <main className="grain min-h-[100dvh] overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1440px]">
        <aside className="hidden w-[248px] shrink-0 flex-col justify-between border-r border-sidebar-border bg-sidebar px-6 py-7 text-sidebar-foreground md:flex">
          <div>
            <Brand />
            <div className="mt-14">
              <p className="mb-3 px-3 font-data text-[10px] uppercase tracking-[.2em] text-sidebar-foreground/45">Workspace</p>
              <nav className="space-y-1" aria-label="Workspace tools">
                {tabs.map((tab, index) => {
                  const Icon = tab.icon;
                  return <button key={tab.id} data-testid={`tab-${tab.id}`} onClick={() => setActiveTab(tab.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${activeTab === tab.id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'}`}>
                    <Icon size={17} strokeWidth={1.8} />
                    <span className="flex-1 text-sm font-medium">{tab.label}</span>
                    {activeTab === tab.id && <span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
                    <span className="sr-only">Section {index + 1}</span>
                  </button>;
                })}
              </nav>
            </div>
            <div className="mt-12 rounded-2xl border border-sidebar-border/80 bg-sidebar-accent/35 p-4">
              <div className="flex items-center gap-2 text-sidebar-primary"><Leaf size={15} /><span className="font-data text-[10px] uppercase tracking-[.18em]">Our promise</span></div>
              <p className="mt-3 text-[13px] leading-6 text-sidebar-foreground/75">A missing match is not proof of a false quote. We check the corpus; people carry the wisdom.</p>
            </div>
          </div>
          <div className="border-t border-sidebar-border pt-5">
            <div className="flex items-center gap-2.5">
              <span className={`h-2 w-2 rounded-full ${health.isError && healthz.isError ? 'bg-amber-300' : apiOnline ? 'bg-emerald-300' : 'bg-sidebar-primary animate-pulse'}`} />
              <span className="text-xs text-sidebar-foreground/70" data-testid="status-api">{health.isError && healthz.isError ? 'Service unavailable' : apiOnline ? 'Corpus service connected' : 'Connecting to corpus'}</span>
            </div>
            <p className="mt-3 font-data text-[10px] tracking-wide text-sidebar-foreground/40">TIRUKKURAL · 1330 COUPLETS</p>
          </div>
        </aside>
        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border/80 bg-background/95 px-5 backdrop-blur-md sm:px-8 lg:px-12">
            <div className="flex items-center gap-3 md:hidden"><Brand compact /></div>
            <p className="hidden font-data text-[10px] uppercase tracking-[.2em] text-muted-foreground md:block">A careful reader for a living tradition</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className={`h-1.5 w-1.5 rounded-full ${apiOnline ? 'bg-primary' : 'bg-amber-500'}`} /><span data-testid="text-service-state">{health.isError && healthz.isError ? 'Service unavailable' : apiOnline ? 'Corpus online' : 'Checking service'}</span></div>
          </header>
          <div className="mx-auto max-w-[1080px] px-5 pb-14 pt-9 sm:px-8 sm:pt-12 lg:px-12">
            <div className="mb-9 reveal">
              <div className="flex items-center gap-2 font-data text-[10px] uppercase tracking-[.22em] text-primary"><span className="h-px w-6 bg-primary" />Tamil literature, handled with care</div>
              <h1 className="mt-4 max-w-3xl font-display text-[2.35rem] leading-[1.12] tracking-[-.035em] text-foreground sm:text-[3.4rem]">Words deserve <em className="font-display font-medium text-primary">provenance.</em></h1>
              <p className="mt-4 max-w-[590px] text-[15px] leading-7 text-muted-foreground">Check a quotation against the local Tirukkural corpus. An exact match can be confirmed; an uncertain one stays uncertain.</p>
            </div>
            <div className="mb-8 grid grid-cols-3 gap-1 rounded-2xl border border-border bg-card p-1.5 md:hidden" role="tablist" aria-label="KuralGuard tools">
              {tabs.map((tab) => { const Icon = tab.icon; return <button role="tab" aria-selected={activeTab === tab.id} key={tab.id} onClick={() => setActiveTab(tab.id)} data-testid={`mobile-tab-${tab.id}`} className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-2 text-[12px] font-semibold transition-all ${activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}><Icon size={15} />{tab.label}</button>; })}
            </div>
            <div className="mb-7 hidden items-end justify-between border-b border-border md:flex">
              <div className="flex gap-7" role="tablist" aria-label="KuralGuard tools">
                {tabs.map((tab) => { const Icon = tab.icon; return <button role="tab" aria-selected={activeTab === tab.id} key={tab.id} onClick={() => setActiveTab(tab.id)} data-testid={`desktop-tab-${tab.id}`} className={`relative flex items-center gap-2 pb-4 text-[13px] font-semibold transition-colors ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}><Icon size={16} />{tab.label}<span className={`absolute inset-x-0 -bottom-px h-[2px] transition-opacity ${activeTab === tab.id ? 'bg-primary opacity-100' : 'opacity-0'}`} /></button>; })}
              </div>
              <p className="mb-4 font-data text-[10px] text-muted-foreground">{tabs.find((item) => item.id === activeTab)?.note}</p>
            </div>
            <div key={activeTab} className="reveal" role="tabpanel">
              {activeTab === 'verify' && <VerifyPanel />}
              {activeTab === 'guard' && <GuardPanel />}
              {activeTab === 'evaluation' && <EvaluationPanel />}
            </div>
            <footer className="mt-14 flex flex-col gap-3 border-t border-border pt-5 text-[11px] leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>Rooted in the Tirukkural. Humble about what a search can know.</span>
              <span className="font-data uppercase tracking-[.12em]">Corpus lookup · Not an authenticity oracle</span>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3" data-testid="brand-kuralguard">
    <div className="flex h-10 w-10 items-center justify-center rounded-[13px] border border-sidebar-primary/40 bg-sidebar-primary/10 text-sidebar-primary"><BookOpen size={19} strokeWidth={1.7} /></div>
    <div><div className={`font-display text-[18px] leading-5 tracking-[-.03em] ${compact ? 'text-foreground' : 'text-sidebar-foreground'}`}>KuralGuard</div><div className={`mt-1 font-data text-[9px] uppercase tracking-[.19em] ${compact ? 'text-muted-foreground' : 'text-sidebar-foreground/45'}`}>குறள் · corpus care</div></div>
  </div>;
}

function VerifyPanel() {
  const [text, setText] = useState('');
  const [claimedId, setClaimedId] = useState('');
  const verify = useVerifyQuote();
  const sampleOne = useGetKural(1, { query: { queryKey: getGetKuralQueryKey(1) } });
  const sampleTwo = useGetKural(2, { query: { queryKey: getGetKuralQueryKey(2) } });
  const sampleReady = Boolean(sampleOne.data && sampleTwo.data);
  const samples = sampleReady ? makeSamples(sampleOne.data!, sampleTwo.data!) : null;
  const lookupId = Number(claimedId);
  const kuralLookup = useGetKural(lookupId || 0, { query: { enabled: lookupId >= 1 && lookupId <= 1330, queryKey: getGetKuralQueryKey(lookupId || 0) } });
  const onSubmit = (event: FormEvent) => { event.preventDefault(); if (!text.trim()) return; verify.mutate({ data: { text: text.trim(), ...(claimedId ? { claimed_id: Number(claimedId) } : {}) } }); };
  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1.06fr)_minmax(320px,.94fr)]">
    <section className="rounded-[22px] border border-border bg-card p-5 shadow-[0_8px_32px_hsl(36_26%_45%/.05)] sm:p-7">
      <div className="flex items-start justify-between gap-3"><div><p className="font-data text-[10px] uppercase tracking-[.18em] text-muted-foreground">01 / Single quotation</p><h2 className="mt-2 font-display text-[24px] tracking-[-.02em]">Check a passage</h2></div><span className="rounded-full bg-secondary px-3 py-1.5 font-data text-[10px] text-secondary-foreground">LOCAL CORPUS</span></div>
      <form className="mt-7" onSubmit={onSubmit}>
        <label htmlFor="quote-input" className="mb-2 flex items-center justify-between text-[12px] font-semibold">Quotation text <span className="font-normal text-muted-foreground">Tamil text only</span></label>
        <textarea id="quote-input" data-testid="input-quote" value={text} onChange={(event) => setText(event.target.value)} maxLength={5000} placeholder="Paste the quoted text here…" className="min-h-[164px] w-full resize-y rounded-xl border border-input bg-background px-4 py-3.5 text-[15px] leading-7 outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15" />
        <div className="mt-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="font-data text-[9px] uppercase tracking-[.13em] text-muted-foreground">Try a sample from the corpus</span>
            {!sampleReady && !sampleOne.isError && !sampleTwo.isError && <span className="font-data text-[9px] text-muted-foreground">{sampleOne.isLoading || sampleTwo.isLoading ? 'Loading samples…' : ''}</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => samples && setText(samples.real)} disabled={!samples} data-testid="button-sample-real" className="rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-wait disabled:opacity-50">Real quote</button>
            <button type="button" onClick={() => samples && setText(samples.spliced)} disabled={!samples} data-testid="button-sample-spliced" className="rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-wait disabled:opacity-50">Spliced quote</button>
            <button type="button" onClick={() => samples && setText(samples.replacement)} disabled={!samples || !samples.replacement} data-testid="button-sample-replacement" className="rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-wait disabled:opacity-50">One-word replacement</button>
          </div>
          {(sampleOne.isError || sampleTwo.isError) && <p className="mt-2 text-[11px] leading-5 text-muted-foreground" data-testid="error-sample-source">Corpus samples are unavailable. Enter a quotation to check it manually.</p>}
          {sampleReady && !samples?.replacement && <p className="mt-2 text-[11px] leading-5 text-muted-foreground" data-testid="text-sample-replacement-unavailable">No distinct replacement word is available in these two couplets.</p>}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block text-[12px] font-semibold">Claimed Kural number <span className="font-normal text-muted-foreground">(optional)</span><div className="relative mt-2"><input data-testid="input-claimed-id" type="number" min="1" max="1330" value={claimedId} onChange={(event) => setClaimedId(event.target.value)} placeholder="e.g. 391" className="h-11 w-full rounded-xl border border-input bg-background px-3 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /><ChevronDown className="pointer-events-none absolute right-3 top-3.5 rotate-[-90deg] text-muted-foreground" size={15} /></div>{kuralLookup.data && <span className="mt-2 block rounded-lg bg-muted px-3 py-2 font-normal text-muted-foreground" data-testid="text-claimed-kural-preview"><span className="font-tamil text-foreground">{kuralLookup.data.line1}</span><br /><span className="font-tamil text-foreground">{kuralLookup.data.line2}</span><br /><span className="font-data text-[9px]">{kuralLookup.data.chapter_name}</span></span>}{kuralLookup.isError && <span className="mt-2 block text-[11px] font-normal text-muted-foreground" data-testid="error-kural-lookup">Kural lookup unavailable.</span>}</label>
          <button data-testid="button-verify-quote" type="submit" disabled={!text.trim() || verify.isPending} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[13px] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">{verify.isPending ? <LoaderCircle className="animate-spin" size={16} /> : <FileSearch size={16} />}{verify.isPending ? 'Checking…' : 'Check quotation'}<ArrowRight size={15} /></button>
        </div>
        {verify.isError && <InlineError message="The quotation could not be checked just now." onRetry={() => verify.mutate({ data: { text: text.trim(), ...(claimedId ? { claimed_id: Number(claimedId) } : {}) } })} />}
      </form>
    </section>
    {verify.data ? <VerificationResult result={verify.data} inputText={text} /> : <section className="relative flex min-h-[310px] flex-col justify-between overflow-hidden rounded-[22px] border border-border bg-[#e9e4d8] p-6 sm:p-8">
      <div className="absolute -right-10 -top-16 h-64 w-64 rounded-full border border-primary/10" /><div className="absolute -right-1 -top-7 h-48 w-48 rounded-full border border-primary/10" />
      <div className="relative"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><CircleHelp size={19} /></div><p className="mt-5 font-display text-[21px] leading-7">Begin with the words,<br />not the attribution.</p><p className="mt-3 max-w-[290px] text-[13px] leading-6 text-foreground/65">We compare your passage with the local corpus and show where the wording agrees or differs.</p></div>
      <div className="relative mt-8 flex items-center gap-3 border-l-2 border-primary/50 pl-4"><span className="h-10 w-10 rounded-full border border-primary/25 bg-primary/5" /><span className="h-px w-14 bg-primary/30" /><span className="h-6 w-6 rounded-full border border-primary/25 bg-primary/5" /><span className="h-px flex-1 bg-primary/30" /></div>
    </section>}
    <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-secondary/50 px-4 py-3.5 lg:col-span-2"><Sparkles size={15} className="mt-0.5 shrink-0 text-primary" /><p className="text-[12px] leading-5 text-muted-foreground">KuralGuard only searches the Tirukkural corpus. It does not use an LLM to judge authenticity, and a quote not found here may still have another source.</p></div>
  </div>;
}

function makeSamples(first: Kural, second: Kural) {
  const real = `${first.line1}\n${first.line2}`;
  const spliced = `${first.line1}\n${second.line2}`;
  const tokenize = (value: string) => value.split(/\s+/).filter(Boolean);
  const normalize = (word: string) => word.replace(/[.,;:!?()[\]{}"'“”‘’。，、]/g, '');
  const firstWords = new Set(tokenize(`${first.line1} ${first.line2}`).map(normalize));
  const replacementWord = tokenize(`${second.line1} ${second.line2}`).find((word) => {
    const clean = normalize(word);
    return clean.length > 1 && !firstWords.has(clean);
  });
  let replacement = '';
  if (replacementWord) {
    const lines = [first.line1, first.line2];
    const wordToReplace = tokenize(lines[0])[0];
    if (wordToReplace) {
      lines[0] = lines[0].replace(wordToReplace, replacementWord);
      replacement = lines.join('\n');
    }
  }
  return { real, spliced, replacement };
}

function VerificationResult({ result, inputText }: { result: Verification; inputText: string }) {
  return <div className="space-y-4">
    <StatusCard verdict={result.verdict} score={result.score} matchedId={result.matched_id} scope={result.matched_scope} claimedOk={result.claimed_id_ok} warning={result.warning} />
    {result.verdict === 'not_found' ? <Abstention /> : result.matched_kural ? <><KuralCard kural={result.matched_kural} diff={result.diff} /><DiffComparison diff={result.diff} inputText={inputText} /></> : null}
  </div>;
}

function StatusCard({ verdict, score, matchedId, scope, claimedOk, warning }: { verdict: string; score: number; matchedId: number | null; scope: string | null; claimedOk: boolean | null; warning: string | null }) {
  const style = verdict === 'verified' ? 'status-verified' : verdict === 'near_match' ? 'status-near' : 'status-not-found';
  const title = verdict === 'verified' ? 'Verified in corpus' : verdict === 'near_match' ? 'Near match — review wording' : 'Not found in corpus';
  const marker = verdict === 'verified' ? <Check size={17} /> : verdict === 'near_match' ? <TriangleAlert size={17} /> : <FileSearch size={17} />;
  return <section className={`rounded-[20px] border p-5 ${style}`} data-testid={`status-${verdict}`}>
    <div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="mt-0.5">{marker}</span><div><h3 className="text-[15px] font-bold">{title}</h3><p className="mt-1 text-[12px] leading-5 opacity-80">{verdict === 'verified' ? 'The passage matches a couplet in the local Tirukkural corpus.' : verdict === 'near_match' ? 'Related wording was found, but the text is not an exact confirmation.' : 'No matching couplet was identified in this corpus.'}</p></div></div><span className="shrink-0 font-data text-[11px]">{Math.round(score)}%<span className="ml-1 opacity-60">match</span></span></div>
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-current/15 pt-3 font-data text-[10px] uppercase tracking-[.08em] opacity-80">
      {matchedId !== null && <span>Closest Kural {matchedId}</span>}{scope && <span>Scope: {scope === 'line1' ? 'Line 1' : scope === 'line2' ? 'Line 2' : scope}</span>}{claimedOk !== null && <span>Claimed ID {claimedOk ? 'agrees' : 'differs'}</span>}
    </div>{warning && <p className="mt-3 text-[12px] leading-5">{warning}</p>}
  </section>;
}

function Abstention() {
  return <div className="rounded-[20px] border border-[#d9b8a3] bg-[#f7eee6] p-5" data-testid="text-abstention"><div className="flex gap-3"><CircleHelp className="mt-0.5 shrink-0 text-[#98543f]" size={17} /><p className="text-[13px] leading-6 text-[#69483c]">Not found in the Tirukkural corpus. This cannot be confirmed as authentic. Please consult a Tamil scholar.</p></div></div>;
}

function KuralCard({ kural, diff }: { kural: Kural; diff?: Verification['diff'] }) {
  return <section className="overflow-hidden rounded-[20px] border border-border bg-card" data-testid={`card-matched-kural-${kural.id}`}>
    <div className="flex items-center justify-between border-b border-border bg-muted/55 px-5 py-3"><div className="flex items-center gap-2 font-data text-[10px] uppercase tracking-[.13em] text-muted-foreground"><BookOpen size={14} className="text-primary" />Tirukkural <span className="text-foreground">#{kural.id}</span></div><span className="text-right text-[11px] text-muted-foreground">{kural.chapter_no} · {kural.chapter_name}</span></div>
    <div className="px-5 py-5 sm:px-6"><p className="font-tamil text-[17px] leading-[2.1] text-foreground" data-testid="text-kural-line1">{renderDiffLine(kural.line1, diff, 'corpus')}</p><p className="font-tamil text-[17px] leading-[2.1] text-foreground" data-testid="text-kural-line2">{renderDiffLine(kural.line2, diff, 'corpus')}</p>{kural.meaning_en && <p className="mt-4 border-t border-border pt-3 text-[12px] italic leading-5 text-muted-foreground" data-testid="text-kural-meaning">{kural.meaning_en}</p>}<div className="mt-4 flex items-center gap-2 font-data text-[9px] uppercase tracking-[.12em] text-muted-foreground"><span className={`h-1.5 w-1.5 rounded-full ${kural.needs_human_review ? 'bg-amber-500' : 'bg-primary'}`} />{kural.needs_human_review ? 'Human review recommended' : 'Corpus record'}</div></div>
  </section>;
}

function renderDiffLine(text: string, diff: Verification['diff'] | undefined, field: 'input' | 'corpus') {
  if (!diff?.length) return text;
  const fragments: ReactNode[] = [];
  let cursor = 0;
  diff.forEach((part, index) => {
    const token = part[field];
    if (!token) return;
    const position = text.indexOf(token, cursor);
    if (position < 0) return;
    if (position > cursor) fragments.push(text.slice(cursor, position));
    fragments.push(<mark key={`${index}-${position}`} className={part.kind === 'same' ? 'diff-same' : 'diff-changed'}>{text.slice(position, position + token.length)}</mark>);
    cursor = position + token.length;
  });
  if (!fragments.length) return text;
  if (cursor < text.length) fragments.push(text.slice(cursor));
  return fragments;
}

function DiffComparison({ diff, inputText }: { diff: Verification['diff']; inputText: string }) {
  if (!diff.length) return null;
  return <section className="rounded-[18px] border border-border bg-card p-4 sm:p-5" data-testid="word-diff"><div className="mb-3 flex items-center justify-between"><h3 className="text-[12px] font-semibold">Wording comparison</h3><span className="font-data text-[9px] uppercase tracking-[.1em] text-muted-foreground">Input / corpus</span></div><div className="grid grid-cols-2 gap-3 border-b border-border pb-2 font-data text-[9px] uppercase tracking-[.12em] text-muted-foreground"><span>Your text</span><span>Corpus text</span></div><div className="divide-y divide-border">{diff.map((part, index) => <div key={`${index}-${part.kind}`} className="grid grid-cols-2 gap-3 py-2.5 text-[12px] leading-5"><span className={part.kind === 'input_only' || part.kind === 'changed' ? 'rounded bg-[#f5e4dc] px-1 text-[#87513e]' : 'text-foreground'}>{part.input || <span className="text-muted-foreground/50">—</span>}</span><span className={part.kind === 'corpus_only' || part.kind === 'changed' ? 'rounded bg-[#e7f0e9] px-1 text-[#285b49]' : 'text-foreground'}>{part.corpus || <span className="text-muted-foreground/50">—</span>}</span></div>)}</div><p className="mt-2 border-t border-border pt-3 text-[10px] leading-4 text-muted-foreground">Input: {inputText}</p></section>;
}

function GuardPanel() {
  const [answer, setAnswer] = useState('');
  const guard = useGuardAnswer();
  const submit = (event: FormEvent) => { event.preventDefault(); if (answer.trim()) guard.mutate({ data: { llm_answer: answer.trim() } }); };
  return <div className="space-y-6">
    <section className="rounded-[22px] border border-border bg-card p-5 shadow-[0_8px_32px_hsl(36_26%_45%/.05)] sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><p className="font-data text-[10px] uppercase tracking-[.18em] text-muted-foreground">02 / Answer review</p><h2 className="mt-2 font-display text-[24px] tracking-[-.02em]">Guard an answer</h2><p className="mt-2 max-w-[500px] text-[13px] leading-6 text-muted-foreground">Paste a chatbot response. We’ll find quoted passages and annotate them without changing the original wording.</p></div><div className="hidden h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary sm:flex"><ScanText size={19} /></div></div>
      <form onSubmit={submit} className="mt-6"><label htmlFor="answer-input" className="mb-2 block text-[12px] font-semibold">Chatbot answer</label><textarea id="answer-input" data-testid="input-guard-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} maxLength={20000} placeholder="Paste the complete answer here…" className="min-h-[188px] w-full resize-y rounded-xl border border-input bg-background px-4 py-3.5 text-[14px] leading-7 outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="font-data text-[10px] text-muted-foreground">{answer.length.toLocaleString()} / 20,000 characters</span><button data-testid="button-guard-answer" type="submit" disabled={!answer.trim() || guard.isPending} className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-[13px] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">{guard.isPending ? <LoaderCircle className="animate-spin" size={16} /> : <ShieldCheck size={16} />}{guard.isPending ? 'Reviewing…' : 'Review answer'}<ArrowRight size={15} /></button></div>
        {guard.isError && <InlineError message="The answer could not be reviewed just now." onRetry={() => guard.mutate({ data: { llm_answer: answer.trim() } })} />}
      </form>
    </section>
    {guard.data ? <GuardOutput result={guard.data} /> : <div className="flex gap-3 rounded-xl border border-border bg-muted/45 px-4 py-3.5"><CircleHelp className="mt-0.5 shrink-0 text-primary" size={15} /><p className="text-[12px] leading-5 text-muted-foreground">Annotations are returned by the corpus checker. Their markers are preserved exactly as supplied by the API.</p></div>}
  </div>;
}

function GuardOutput({ result }: { result: { annotated_answer: string; quotes: GuardQuote[]; summary: { verified: number; near: number; not_found: number } } }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(result.annotated_answer); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); } };
  return <div className="space-y-5">
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <CountCard label="Verified" count={result.summary.verified} kind="verified" />
      <CountCard label="Near match" count={result.summary.near} kind="near" />
      <CountCard label="Not found" count={result.summary.not_found} kind="not-found" />
    </div>
    <section className="overflow-hidden rounded-[20px] border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5"><div><p className="font-data text-[10px] uppercase tracking-[.16em] text-muted-foreground">Annotated response</p><p className="mt-1 text-[11px] text-muted-foreground">Original API output · markers preserved</p></div><button onClick={copy} data-testid="button-copy-annotation" className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-[11px] font-semibold hover:bg-muted">{copied ? <Check size={14} /> : <Clipboard size={14} />}{copied ? 'Copied' : 'Copy annotated text'}</button></div>
      <pre className="whitespace-pre-wrap break-words px-5 py-5 font-sans text-[13px] leading-7 text-foreground" data-testid="text-annotated-answer">{result.annotated_answer}</pre>
    </section>
    <section><div className="mb-3 flex items-center justify-between"><h3 className="font-display text-[19px]">Detected quotations</h3><span className="font-data text-[10px] text-muted-foreground">{result.quotes.length} {result.quotes.length === 1 ? 'quote' : 'quotes'}</span></div>{result.quotes.length ? <div className="space-y-3">{result.quotes.map((quote, index) => <QuoteReview key={`${quote.matched_id ?? 'none'}-${index}`} quote={quote} index={index} />)}</div> : <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-8 text-center"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary"><ScanText size={18} /></div><p className="mt-3 text-sm font-semibold">No quotations detected</p><p className="mt-1 text-xs text-muted-foreground">The response did not contain a quote to check.</p></div>}</section>
  </div>;
}

function CountCard({ label, count, kind }: { label: string; count: number; kind: string }) {
  return <div className={`rounded-xl border px-3 py-3 sm:px-4 ${kind === 'verified' ? 'count-verified' : kind === 'near' ? 'count-near' : 'count-not-found'}`} data-testid={`count-${kind}`}><p className="font-data text-[9px] uppercase tracking-[.1em] opacity-75 sm:text-[10px]">{label}</p><p className="mt-1 font-display text-[26px] leading-8">{count}</p></div>;
}

function QuoteReview({ quote, index }: { quote: GuardQuote; index: number }) {
  return <article className="rounded-[18px] border border-border bg-card p-4 sm:p-5" data-testid={`card-guard-quote-${index}`}>
    <div className="flex items-start justify-between gap-3"><blockquote className="line-clamp-4 text-[13px] leading-6 text-foreground/85">“{quote.text}”</blockquote><span className={`shrink-0 rounded-full px-2.5 py-1 font-data text-[9px] uppercase tracking-[.08em] ${quote.verdict === 'verified' ? 'pill-verified' : quote.verdict === 'near_match' ? 'pill-near' : 'pill-not-found'}`}>{quote.verdict === 'near_match' ? 'Near match' : quote.verdict === 'not_found' ? 'Not found' : 'Verified'}</span></div>
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-data text-[10px] text-muted-foreground">{quote.matched_id !== null && <span>Closest Kural {quote.matched_id}</span>}<span>{Math.round(quote.score)}% score</span>{quote.matched_scope && <span>{quote.matched_scope}</span>}</div>
    {quote.verdict === 'not_found' ? <p className="mt-3 text-[11px] leading-5 text-[#845340]">Not found in the Tirukkural corpus. This cannot be confirmed as authentic. Please consult a Tamil scholar.</p> : quote.matched_kural && <div className="mt-3 rounded-xl bg-muted/65 px-4 py-3"><p className="font-tamil text-[14px] leading-8">{quote.matched_kural.line1}<br />{quote.matched_kural.line2}</p><p className="mt-1 font-data text-[9px] text-muted-foreground">Kural {quote.matched_kural.id} · {quote.matched_kural.chapter_name}</p></div>}
    {quote.warning && <p className="mt-3 text-[11px] leading-5 text-muted-foreground">{quote.warning}</p>}
  </article>;
}

function EvaluationPanel() {
  const query = useGetEvaluationResults({ query: { queryKey: getGetEvaluationResultsQueryKey() } });
  if (query.isLoading) return <EvaluationSkeleton />;
  if (query.isError) return <ErrorState message="Evaluation results are not available right now." onRetry={() => query.refetch()} />;
  if (!query.data) return <EmptyState title="No evaluation results" description="The corpus has not returned an evaluation report." />;
  return <EvaluationReport results={query.data} />;
}

function EvaluationReport({ results }: { results: EvaluationResults }) {
  const metrics = [
    { key: 'verified_precision', label: 'Verified precision', value: results.metrics.verified_precision, note: 'How often a verified result is correct', tone: 'primary' },
    { key: 'real_recall', label: 'Real-quote recall', value: results.metrics.real_recall, note: 'Known corpus quotes recovered', tone: 'gold' },
    { key: 'false_accept_rate', label: 'False accept rate', value: results.metrics.false_accept_rate, note: 'Unmatched text marked verified', tone: 'rust' },
    { key: 'tricky_near_match_rate', label: 'Tricky near matches', value: results.metrics.tricky_near_match_rate, note: 'Hard variations kept for review', tone: 'blue' },
    { key: 'fake_abstain_rate', label: 'Abstention rate', value: results.metrics.fake_abstain_rate, note: 'Unconfirmed text not overclaimed', tone: 'violet' },
  ];
  const sampleRows = Object.entries(results.metrics.sample_counts);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-data text-[10px] uppercase tracking-[.18em] text-muted-foreground">03 / Evaluation report</p><h2 className="mt-2 font-display text-[26px] tracking-[-.02em]">How careful is the checker?</h2><p className="mt-2 max-w-xl text-[13px] leading-6 text-muted-foreground">Deterministic evaluation against the project’s dataset. Metrics describe matching behavior, not literary authority.</p></div><div className="rounded-xl border border-border bg-card px-4 py-2.5"><p className="font-data text-[9px] uppercase tracking-[.12em] text-muted-foreground">Near-match threshold</p><p className="mt-1 font-data text-[15px] text-primary">{results.near_threshold}<span className="text-[10px]">%</span></p></div></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(({ key, ...metric }) => <MetricCard key={key} {...metric} />)}</div>
    <section className="rounded-[20px] border border-border bg-card p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-display text-[19px]">Threshold sweep</h3><p className="mt-1 text-[11px] text-muted-foreground">Trade-offs as the near-match threshold changes</p></div><div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px]"><Legend color="#275b4b" label="Real recall" /><Legend color="#b75e45" label="False accept" /><Legend color="#c89c48" label="Tricky near match" /></div></div>
      {results.threshold_sweep.length ? <div className="mt-6 h-[260px] w-full" data-testid="chart-threshold-sweep"><ResponsiveContainer width="100%" height="100%"><LineChart data={results.threshold_sweep} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}><CartesianGrid stroke="hsl(39 20% 83%)" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="threshold" tickFormatter={(value: number) => `${Math.round(value)}%`} tickLine={false} axisLine={false} tick={{ fill: 'hsl(163 10% 44%)', fontSize: 10 }} dy={9} /><YAxis domain={[0, 1]} tickFormatter={(value: number) => `${Math.round(value * 100)}%`} tickLine={false} axisLine={false} tick={{ fill: 'hsl(163 10% 44%)', fontSize: 10 }} /><ChartTooltip content={<SweepTooltip />} /><Line type="monotone" dataKey="real_recall" name="Real recall" stroke="#275b4b" strokeWidth={2.5} dot={{ r: 3, fill: '#275b4b', strokeWidth: 0 }} activeDot={{ r: 5 }} /><Line type="monotone" dataKey="false_accept_rate" name="False accept" stroke="#b75e45" strokeWidth={2} dot={{ r: 2.5, fill: '#b75e45', strokeWidth: 0 }} /><Line type="monotone" dataKey="tricky_near_match_rate" name="Tricky near match" stroke="#c89c48" strokeWidth={2} dot={{ r: 2.5, fill: '#c89c48', strokeWidth: 0 }} /></LineChart></ResponsiveContainer></div> : <EmptyState title="No threshold points" description="The evaluation report contains no sweep data." />}</section>
    <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
      <div className="rounded-[20px] border border-border bg-card p-5 sm:p-6"><h3 className="font-display text-[19px]">Verdict distribution</h3><p className="mt-1 text-[11px] text-muted-foreground">Results recorded in this evaluation</p><div className="mt-5 space-y-4">{Object.entries(results.verdict_counts).map(([label, value]) => <DistributionRow key={label} label={label} value={value} total={Object.values(results.verdict_counts).reduce((sum, n) => sum + n, 0)} />)}</div></div>
      <div className="rounded-[20px] border border-border bg-card p-5 sm:p-6"><h3 className="font-display text-[19px]">Dataset & sample counts</h3><p className="mt-1 text-[11px] text-muted-foreground">Evaluation coverage, as reported by the API</p><div className="mt-4 divide-y divide-border">{Object.entries(results.dataset_counts).map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 py-2.5 text-[12px]"><span className="capitalize text-muted-foreground">{humanize(label)}</span><span className="font-data text-[12px]">{value.toLocaleString()}</span></div>)}</div>{sampleRows.length > 0 && <div className="mt-3 border-t border-border pt-2">{sampleRows.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 py-2 text-[11px]"><span className="capitalize text-muted-foreground">{humanize(label)} samples</span><span className="font-data">{value.toLocaleString()}</span></div>)}</div>}</div>
    </section>
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 font-data text-[10px] text-muted-foreground"><span>Report generated {formatDate(results.generated_at)}</span><span>Thresholds are experimental · human judgment remains essential</span></div>
  </div>;
}

function MetricCard({ label, value, note, tone }: { label: string; value: number; note: string; tone: string }) {
  return <article className={`metric-card rounded-[17px] border border-border bg-card p-4 ${tone}`} data-testid={`metric-${tone}`}><div className="flex items-start justify-between gap-2"><p className="text-[12px] font-semibold leading-5">{label}</p><Activity size={14} className="mt-0.5 opacity-60" /></div><p className="mt-3 font-display text-[30px] leading-8 tracking-[-.04em]">{(value * 100).toFixed(1)}<span className="ml-0.5 text-[15px]">%</span></p><p className="mt-2 text-[10px] leading-4 text-muted-foreground">{note}</p></article>;
}

function Legend({ color, label }: { color: string; label: string }) { return <span className="flex items-center gap-1.5 text-muted-foreground"><i className="h-2 w-2 rounded-full" style={{ background: color }} />{label}</span>; }

function SweepTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: number }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-xl border border-border bg-card p-3 shadow-lg"><p className="mb-2 font-data text-[10px] text-muted-foreground">Threshold {(label ?? 0).toFixed(1)}%</p>{payload.map((item) => <p key={item.name} className="mt-1 flex items-center justify-between gap-5 text-[11px]"><span style={{ color: item.color }}>{item.name}</span><span className="font-data">{(item.value * 100).toFixed(1)}%</span></p>)}</div>;
}

function DistributionRow({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total ? value / total * 100 : 0;
  const kind = label === 'verified' ? 'fill-verified' : label === 'near_match' ? 'fill-near' : 'fill-not-found';
  return <div data-testid={`distribution-${label}`}><div className="mb-1.5 flex justify-between text-[11px]"><span className="capitalize text-muted-foreground">{humanize(label)}</span><span className="font-data">{value.toLocaleString()} <span className="text-muted-foreground">· {percentage.toFixed(1)}%</span></span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${kind}`} style={{ width: `${percentage}%` }} /></div></div>;
}

function humanize(value: string) { return value.replaceAll('_', ' '); }
function formatDate(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }

function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-3.5 py-3" role="alert" data-testid="error-mutation"><p className="text-[12px] leading-5 text-destructive">{message}</p><button type="button" onClick={onRetry} className="flex items-center gap-1.5 text-[11px] font-semibold text-destructive" data-testid="button-retry-mutation"><RefreshCw size={13} />Retry</button></div>;
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="rounded-[22px] border border-destructive/25 bg-card px-6 py-12 text-center" role="alert" data-testid="error-evaluation"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive"><TriangleAlert size={19} /></div><h2 className="mt-4 font-display text-[20px]">Unable to load report</h2><p className="mt-2 text-[13px] text-muted-foreground">{message}</p><button onClick={onRetry} className="mx-auto mt-5 flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[12px] font-semibold text-primary-foreground" data-testid="button-retry-evaluation"><RefreshCw size={14} />Try again</button></div>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center" data-testid="empty-evaluation"><p className="font-display text-[18px]">{title}</p><p className="mt-1 text-[12px] text-muted-foreground">{description}</p></div>;
}

function EvaluationSkeleton() {
  return <div className="space-y-6" aria-label="Loading evaluation results" data-testid="loading-evaluation"><div className="h-20 animate-pulse rounded-2xl bg-muted" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3, 4, 5].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-muted" />)}</div><div className="h-[300px] animate-pulse rounded-2xl bg-muted" /></div>;
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
