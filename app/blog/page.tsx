import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Tech Learning Resources & Guides — QuizBytesDaily',
  description: 'In-depth guides on Python, AI, algorithms, system design, and software engineering. Learn the concepts behind the daily quiz questions.',
};

const ARTICLES = [
  {
    slug: 'python',
    title: 'Python Quiz Questions & Concept Guide',
    category: 'Python',
    excerpt: 'Mutable default arguments, late binding closures, integer caching, and GIL misconceptions — Python has a long list of behaviours that do not match developer intuition. Our Python quiz series covers the most common ones with clear explanations and the output your code actually produces.',
  },
  {
    slug: 'algorithms',
    title: 'Algorithms Quiz Questions & Concept Guide',
    category: 'Algorithms',
    excerpt: 'Textbook Big-O explanations focus on theoretical worst-case bounds. Real engineering requires understanding constant factors, cache behaviour, and when O(n²) beats O(n log n) in practice. Our algorithms quiz series bridges theory and production code.',
  },
  {
    slug: 'ai-ml',
    title: 'AI & ML Quiz Questions & Concept Guide',
    category: 'AI & ML',
    excerpt: 'You do not need a machine learning PhD to work effectively with AI systems. But you do need to understand tokens, embeddings, attention, RAG, fine-tuning, and inference costs. Our AI/ML quiz series covers each concept with examples a software engineer can act on.',
  },
  {
    slug: 'system-design',
    title: 'System Design Quiz Questions & Concept Guide',
    category: 'System Design',
    excerpt: 'Rate limiting, consistent hashing, event sourcing, CQRS, saga pattern, and circuit breakers — these patterns appear repeatedly in senior engineering interviews. Our system design quiz series explains each with trade-offs and real-world use cases.',
  },
  {
    slug: 'javascript',
    title: 'JavaScript Quiz Questions & Concept Guide',
    category: 'JavaScript',
    excerpt: 'Closures are the most asked-about JavaScript concept in technical interviews and the most commonly misunderstood. Our JavaScript quiz series builds from first principles through increasingly subtle examples — including the classic loop-variable trap.',
  },
  {
    slug: 'typescript',
    title: 'TypeScript Quiz Questions & Concept Guide',
    category: 'TypeScript',
    excerpt: 'Generics, discriminated unions, and structural typing trip up even experienced JavaScript developers moving to TypeScript. Our TypeScript quiz series covers the type-system behaviours that show up in real production code.',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF9F6', color: '#1A1A18' }}>
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/" className="text-blue-600 text-sm hover:underline mb-8 inline-block">
          ← Back to QuizBytesDaily
        </Link>

        <h1 className="text-4xl font-bold mb-3" style={{ color: '#1A1A18' }}>Tech Guides</h1>
        <p className="text-gray-500 mb-12">Deep dives into the concepts behind the daily quiz questions.</p>

        <div className="space-y-10">
          {ARTICLES.map((article) => (
            <Link key={article.slug} href={`/quiz/${article.slug}`} className="block border-b border-gray-200 pb-10 hover:opacity-80">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
                  {article.category}
                </span>
              </div>
              <h2 className="text-xl font-bold mb-3 leading-snug" style={{ color: '#1A1A18' }}>
                {article.title}
              </h2>
              <p className="text-gray-500 leading-relaxed text-sm">{article.excerpt}</p>
              <div className="mt-4">
                <span className="text-blue-600 text-sm font-medium">Read guide →</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 p-6 border border-gray-200 rounded-xl bg-white">
          <h2 className="font-bold text-lg mb-2" style={{ color: '#1A1A18' }}>About QuizBytesDaily</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            QuizBytesDaily publishes a new tech quiz short every day covering Python, JavaScript, SQL, algorithms,
            system design, and AI concepts. This guide section provides the deeper explanations behind each
            quiz topic — so you understand the why, not just the answer. Subscribe on YouTube for the daily quiz.
          </p>
        </div>
      </div>
    </div>
  );
}
