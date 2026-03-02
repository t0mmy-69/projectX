import Link from 'next/link';

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-xl text-center space-y-4 border border-white/10 rounded-2xl p-8 bg-[#0A0A0B]">
        <h1 className="text-3xl font-extrabold">NarrativeOS Demo</h1>
        <p className="text-muted">
          Product demo is currently private. Request access and we will share a live walkthrough.
        </p>
        <div className="flex justify-center gap-3">
          <a href="mailto:hello@narrativeos.app?subject=NarrativeOS%20Demo%20Request" className="px-4 py-2 bg-primary rounded-xl font-bold btn-glow">Request Demo</a>
          <Link href="/" className="px-4 py-2 border border-white/15 rounded-xl font-bold">Back Home</Link>
        </div>
      </div>
    </main>
  );
}
