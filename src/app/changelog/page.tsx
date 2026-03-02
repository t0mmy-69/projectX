import fs from 'node:fs';
import path from 'node:path';

export default function ChangelogPage() {
  const filePath = path.join(process.cwd(), 'changelog.md');
  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : 'No changelog yet.';

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-6">Changelog</h1>
        <pre className="whitespace-pre-wrap text-sm text-gray-200 leading-7 bg-[#0A0A0B] border border-white/10 rounded-2xl p-6 overflow-x-auto">{content}</pre>
      </div>
    </main>
  );
}
