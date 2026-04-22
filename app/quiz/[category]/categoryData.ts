export interface CategoryData {
  slug: string;
  /** Display name shown in headings */
  name: string;
  emoji: string;
  tagline: string;
  /** ~300-word educational intro rendered as paragraphs */
  intro: string[];
  whyLearn: { heading: string; body: string }[];
  whatYouFind: string[];
  /** Maps to the category filter name used on the homepage */
  homeFilter: string;
  metaTitle: string;
  metaDescription: string;
}

export const CATEGORIES: CategoryData[] = [
  {
    slug: "python",
    name: "Python",
    emoji: "🐍",
    homeFilter: "Python",
    tagline: "Master Python from syntax to advanced patterns",
    metaTitle: "Python Quiz Questions — Test Your Python Knowledge",
    metaDescription:
      "Practice Python with daily quiz questions covering syntax, data structures, OOP, decorators, generators, async/await, comprehensions, and the standard library.",
    intro: [
      "Python is the world's most popular programming language for good reason: its clean syntax, expressive idioms, and vast ecosystem make it equally at home in data science, web development, automation, AI research, and system scripting. Yet despite Python's reputation for being beginner-friendly, it has surprising depths — descriptors, metaclasses, the GIL, CPython internals — that trip up even experienced engineers.",
      "QuizBytesDaily's Python quizzes are designed to close that gap. Each question targets a specific concept: how list comprehensions handle nested loops, when a generator is more memory-efficient than a list, what happens when you mutate a default mutable argument, or why `is` and `==` can give different results on the same integers.",
      "Our questions span the full spectrum from Beginner to Advanced. Beginner questions focus on types, control flow, and basic data structures. Intermediate questions cover OOP, file I/O, standard library modules (`itertools`, `collections`, `functools`), decorators, and context managers. Advanced questions tackle async/await concurrency, descriptor protocol, metaclasses, and CPython-level behaviours.",
    ],
    whyLearn: [
      { heading: "Industry demand", body: "Python consistently ranks #1 in developer surveys and is the dominant language for data engineering, ML research, and backend APIs." },
      { heading: "Versatility", body: "A single language covers scripting, web (Django/FastAPI), data science (pandas/numpy), ML (PyTorch/TensorFlow), and CLI tooling." },
      { heading: "Interview relevance", body: "Python is the go-to language for FAANG coding interviews. Deep knowledge of built-ins and idioms can set you apart from candidates who only know the basics." },
    ],
    whatYouFind: [
      "Syntax gotchas (mutable defaults, late binding closures)",
      "Data structure operations (dict, set, deque, heap)",
      "OOP concepts (MRO, property, __slots__, ABC)",
      "Functional patterns (map, filter, reduce, comprehensions)",
      "Async/await and the event loop",
      "Memory management and the GIL",
      "Standard library deep-dives",
    ],
  },
  {
    slug: "ai-ml",
    name: "AI & Machine Learning",
    emoji: "🤖",
    homeFilter: "AI/ML",
    tagline: "From neural networks to LLMs and RAG pipelines",
    metaTitle: "AI & Machine Learning Quiz — Test Your ML Knowledge",
    metaDescription:
      "Test your AI and machine learning knowledge with quiz questions on neural networks, LLMs, RAG, embeddings, model evaluation, transformers, PyTorch, and more.",
    intro: [
      "Artificial intelligence and machine learning have undergone a revolution in the last few years. Large Language Models (LLMs) like GPT-4 and Claude, diffusion models for images, and retrieval-augmented generation (RAG) pipelines have moved from research curiosities to production workhorses. Understanding how these systems work — not just how to call an API — is now a core skill for software engineers.",
      "QuizBytesDaily's AI/ML quizzes blend classical ML theory with practical modern AI engineering. You'll encounter questions on gradient descent and backpropagation alongside questions on attention mechanisms, tokenisation, context windows, and prompt engineering. We cover PyTorch fundamentals, embedding spaces, vector databases, and evaluation metrics like BLEU, ROUGE, and F1.",
      "Whether you're a data scientist brushing up on fundamentals, a backend engineer integrating LLM APIs, or an ML engineer fine-tuning models, our quizzes will surface the concepts you use every day and the edge cases that matter in production.",
    ],
    whyLearn: [
      { heading: "Career-defining skill", body: "AI/ML engineering is the fastest-growing field in software. Every company is integrating AI — engineers who understand the internals are far more effective than those who only use SDKs." },
      { heading: "Research meets practice", body: "Modern AI sits at the intersection of math, statistics, and software engineering. Understanding both theory and implementation makes you a more complete practitioner." },
      { heading: "Move fast safely", body: "Knowing how models fail — hallucination, context overflow, embedding drift — helps you build reliable AI features, not just demos." },
    ],
    whatYouFind: [
      "Neural network fundamentals (layers, activations, loss functions)",
      "Transformer architecture and attention mechanisms",
      "LLM concepts: tokenisation, context windows, temperature, top-p",
      "RAG pipelines: chunking, embedding, retrieval, reranking",
      "Model evaluation metrics (accuracy, F1, BLEU, ROUGE, perplexity)",
      "PyTorch tensors, autograd, and training loops",
      "Prompt engineering patterns and few-shot learning",
    ],
  },
  {
    slug: "algorithms",
    name: "Algorithms",
    emoji: "🧮",
    homeFilter: "Algorithms",
    tagline: "Master the algorithms and data structures that matter",
    metaTitle: "Algorithms & Data Structures Quiz — Test Your CS Knowledge",
    metaDescription:
      "Test your algorithms and data structures knowledge with quiz questions on sorting, searching, dynamic programming, graph algorithms, Big O complexity, and more.",
    intro: [
      "Algorithms and data structures form the bedrock of computer science and remain the centrepiece of technical interviews at top engineering companies. But beyond interviews, a solid algorithms foundation helps you write faster code, choose the right data structure for the job, and reason clearly about performance trade-offs.",
      "QuizBytesDaily's algorithms quizzes cover the full canonical curriculum: searching and sorting, trees and graphs, heaps and hash tables, dynamic programming, greedy algorithms, and divide-and-conquer strategies. Each question focuses on the specific insight that makes an algorithm work — not just the name, but the 'why'.",
      "We pay particular attention to time and space complexity analysis. Understanding Big O notation intuitively — not just memorising it — lets you estimate performance before writing a single line of code. Our questions frequently ask you to reason about best-case versus worst-case behaviour, amortised complexity, and the practical difference between O(n log n) and O(n²) on real input sizes.",
    ],
    whyLearn: [
      { heading: "Interview essential", body: "Algorithms questions appear in virtually every FAANG/top-tier interview. Consistent daily practice is the most reliable way to build confidence." },
      { heading: "Write better code", body: "Understanding when to use a hash map vs. a sorted array, or BFS vs. DFS, makes the difference between a solution that scales and one that doesn't." },
      { heading: "Think more clearly", body: "Algorithmic thinking — breaking problems into subproblems, finding invariants, proving correctness — is a transferable skill for all of engineering." },
    ],
    whatYouFind: [
      "Sorting algorithms: merge sort, quicksort, heapsort, counting sort",
      "Searching: binary search, BFS, DFS, A*",
      "Dynamic programming patterns: memoisation, tabulation, optimal substructure",
      "Graph algorithms: Dijkstra, Bellman-Ford, Kruskal, Prim",
      "Tree operations: traversal, balancing, segment trees",
      "Hash tables: collision resolution, load factor, open addressing",
      "Big O analysis: time, space, amortised complexity",
    ],
  },
  {
    slug: "javascript",
    name: "JavaScript",
    emoji: "⚡",
    homeFilter: "JavaScript",
    tagline: "From event loop quirks to modern ES2024+ features",
    metaTitle: "JavaScript Quiz Questions — Test Your JS Knowledge",
    metaDescription:
      "Test your JavaScript knowledge with quiz questions on closures, prototypes, the event loop, async/await, ES6+ features, DOM manipulation, and modern JS patterns.",
    intro: [
      "JavaScript is the only language that runs natively in every web browser, and with Node.js it powers servers, CLIs, and serverless functions too. Its ubiquity makes it essential — but JavaScript's design decisions, accumulated over 30 years of backwards-compatible evolution, produce some genuinely surprising behaviours that catch even senior engineers off guard.",
      "QuizBytesDaily's JavaScript quizzes explore the language at a deeper level than tutorials typically cover. We dive into the event loop and microtask queue, prototype chains and `this` binding, closures and lexical scope, the differences between `var`, `let`, and `const`, and why certain patterns work in strict mode but not in sloppy mode.",
      "Modern JavaScript (ES6 through ES2024) has transformed how we write code: arrow functions, destructuring, optional chaining, nullish coalescing, Promises, async generators, top-level await, and more. Our quizzes cover both the legacy behaviours you need to understand to debug old codebases, and the modern features you should be using in new code.",
    ],
    whyLearn: [
      { heading: "Universal language", body: "JavaScript is the only language that runs in the browser without transpilation. Full-stack JS engineers are in high demand." },
      { heading: "Quirks matter in production", body: "Type coercion bugs, closure-in-loop pitfalls, and async ordering errors are common sources of production incidents. Knowing the language deeply prevents them." },
      { heading: "Modern ecosystem", body: "React, Vue, Next.js, Node.js, Deno, Bun — all are built on JavaScript. Understanding the foundation makes every framework easier to learn." },
    ],
    whatYouFind: [
      "Closures, scope, hoisting, and the temporal dead zone",
      "Prototype chain, `this` binding, and `new` keyword",
      "Event loop, call stack, microtask queue, and macrotask queue",
      "Promises, async/await, and error handling patterns",
      "ES6+ features: destructuring, spread, generators, symbols",
      "Type coercion and equality (`==` vs `===`)",
      "Module systems: CommonJS, ESM, dynamic imports",
    ],
  },
  {
    slug: "system-design",
    name: "System Design",
    emoji: "🏗️",
    homeFilter: "System Design",
    tagline: "Design scalable, reliable distributed systems",
    metaTitle: "System Design Quiz — Test Your Architecture Knowledge",
    metaDescription:
      "Test your system design knowledge with quiz questions on distributed systems, databases, caching, load balancing, microservices, CAP theorem, and scalability patterns.",
    intro: [
      "System design is the discipline of architecting software systems that are scalable, reliable, maintainable, and cost-effective. Unlike coding problems, system design has no single correct answer — it requires weighing trade-offs: consistency vs. availability, latency vs. throughput, simplicity vs. flexibility.",
      "QuizBytesDaily's system design quizzes translate abstract principles into concrete questions. What consistency guarantees does a relational database provide that a document store doesn't? When should you prefer a message queue over a direct HTTP call? What is the practical difference between horizontal and vertical scaling? How do CDNs work, and what are their failure modes?",
      "We cover the building blocks every senior engineer must know: load balancers, caches (Redis, Memcached), relational and NoSQL databases, message queues (Kafka, RabbitMQ), CDNs, API gateways, service meshes, and observability tooling. We also cover the theoretical foundations: the CAP theorem, PACELC, eventual consistency, consensus algorithms, and the two generals' problem.",
    ],
    whyLearn: [
      { heading: "Senior-level interviews", body: "System design rounds are mandatory at senior+ levels at all major tech companies. Structured daily practice builds the vocabulary and intuition you need." },
      { heading: "Make better architectural decisions", body: "Every engineering decision is a design decision. Understanding the trade-offs at a systems level helps you propose and evaluate solutions more rigorously." },
      { heading: "Communicate with your team", body: "System design vocabulary — idempotency, eventual consistency, back-pressure — is the lingua franca of senior engineering discussions." },
    ],
    whatYouFind: [
      "CAP theorem, PACELC, and consistency models",
      "Database choices: RDBMS, NoSQL, NewSQL, time-series",
      "Caching strategies: write-through, write-back, cache-aside, CDN",
      "Message queues: Kafka partitions, consumer groups, at-least-once delivery",
      "Load balancing: L4 vs L7, sticky sessions, health checks",
      "Microservices: service discovery, circuit breakers, API gateways",
      "Rate limiting, back-pressure, and bulkhead patterns",
    ],
  },
  {
    slug: "typescript",
    name: "TypeScript",
    emoji: "📘",
    homeFilter: "TypeScript",
    tagline: "Level up from basic types to advanced TypeScript patterns",
    metaTitle: "TypeScript Quiz Questions — Test Your TS Knowledge",
    metaDescription:
      "Test your TypeScript knowledge with quiz questions on types, generics, interfaces, utility types, conditional types, strict mode, and advanced TypeScript patterns.",
    intro: [
      "TypeScript adds a powerful static type system to JavaScript, catching entire categories of runtime errors at compile time. But TypeScript's type system goes far beyond simple type annotations — it includes generics, conditional types, mapped types, template literal types, and inferred types that can express complex type relationships that JavaScript cannot.",
      "QuizBytesDaily's TypeScript quizzes help you understand not just the syntax but the semantics of TypeScript's type system. Why does `unknown` require a type narrowing check but `any` doesn't? What's the difference between `interface` and `type` alias? How do you write a generic function that preserves the literal type of its argument? When should you use `as const`?",
      "We cover practical TypeScript patterns used in real codebases: discriminated unions for exhaustive switch statements, utility types (`Partial`, `Pick`, `Omit`, `ReturnType`, `Awaited`), the `satisfies` operator, strict null checks, module augmentation, and the `infer` keyword for conditional type inference. These are the patterns that separate TypeScript users from TypeScript engineers.",
    ],
    whyLearn: [
      { heading: "Industry standard", body: "TypeScript is now the default choice for new JavaScript projects at most companies. Fluency in advanced TypeScript types is increasingly a hiring differentiator." },
      { heading: "Write self-documenting code", body: "Well-typed TypeScript code is documentation. Clear types reduce the need for comments and make code reviews faster." },
      { heading: "Catch bugs before they ship", body: "TypeScript's strict mode, combined with advanced utility types, catches entire classes of null-pointer, type-mismatch, and refactoring bugs before runtime." },
    ],
    whatYouFind: [
      "Structural vs. nominal typing and type compatibility",
      "Generics: constraints, defaults, and higher-kinded patterns",
      "Utility types: Partial, Required, Pick, Omit, Record, Extract, Exclude",
      "Conditional types and the `infer` keyword",
      "Mapped types and template literal types",
      "Discriminated unions and exhaustive type checking",
      "Strict mode flags and their practical implications",
    ],
  },
];

export function getCategoryBySlug(slug: string): CategoryData | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
