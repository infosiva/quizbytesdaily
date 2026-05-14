import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Tech Learning Resources & Guides — QuizBytesDaily',
  description: 'In-depth guides on Python, AI, algorithms, system design, and software engineering. Learn the concepts behind the daily quiz questions.',
};

const ARTICLES = [
  {
    slug: 'python-gotchas-2026',
    title: '15 Python Gotchas That Trip Up Even Senior Developers',
    date: '14 May 2026',
    category: 'Python',
    readTime: '7 min read',
    excerpt: 'Mutable default arguments, late binding closures, integer caching, and GIL misconceptions — Python has a long list of behaviours that do not match developer intuition. We cover the most common ones with clear explanations and the output your code actually produces.',
  },
  {
    slug: 'understanding-big-o-practical',
    title: 'Big-O Notation: What It Actually Means in Practice',
    date: '12 May 2026',
    category: 'Algorithms',
    readTime: '8 min read',
    excerpt: 'Textbook Big-O explanations focus on theoretical worst-case bounds. Real engineering requires understanding constant factors, cache behaviour, and when O(n²) beats O(n log n) in practice. This guide bridges theory and production code.',
  },
  {
    slug: 'ai-concepts-every-dev-should-know',
    title: '10 AI Concepts Every Developer Should Understand in 2026',
    date: '10 May 2026',
    category: 'AI & ML',
    readTime: '9 min read',
    excerpt: 'You do not need a machine learning PhD to work effectively with AI systems. But you do need to understand tokens, embeddings, attention, RAG, fine-tuning, and inference costs. This practical guide covers each concept with examples a software engineer can act on.',
  },
  {
    slug: 'system-design-interview-patterns',
    title: 'The 6 System Design Patterns That Appear in Every FAANG Interview',
    date: '8 May 2026',
    category: 'System Design',
    readTime: '10 min read',
    excerpt: 'Rate limiting, consistent hashing, event sourcing, CQRS, saga pattern, and circuit breakers — these six patterns appear repeatedly in senior engineering interviews. We explain each with architecture diagrams, trade-offs, and real-world use cases.',
  },
  {
    slug: 'javascript-closures-explained',
    title: 'JavaScript Closures Explained Through 10 Progressively Harder Examples',
    date: '6 May 2026',
    category: 'JavaScript',
    readTime: '6 min read',
    excerpt: 'Closures are the most asked-about JavaScript concept in technical interviews and the most commonly misunderstood. We build from first principles through increasingly subtle examples — finishing with the classic loop-variable trap and three ways to fix it.',
  },
  {
    slug: 'sql-interview-questions',
    title: 'The SQL Questions That Filter Out 80% of Candidates',
    date: '4 May 2026',
    category: 'SQL & Databases',
    readTime: '7 min read',
    excerpt: 'Window functions, CTEs, correlated subqueries, and execution plan analysis separate candidates who know SQL from those who have memorised it. We cover the query patterns that consistently appear in data engineering and backend interviews.',
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
            <article key={article.slug} className="border-b border-gray-200 pb-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
                  {article.category}
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-500">{article.date}</span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-500">{article.readTime}</span>
              </div>
              <h2 className="text-xl font-bold mb-3 leading-snug" style={{ color: '#1A1A18' }}>
                {article.title}
              </h2>
              <p className="text-gray-500 leading-relaxed text-sm">{article.excerpt}</p>
              <div className="mt-4">
                <span className="text-blue-600 text-sm font-medium">Read guide →</span>
              </div>
            </article>
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
