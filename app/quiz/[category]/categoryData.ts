export interface SampleQuestion {
  question: string;
  options: string[];
  /** 0-based index of the correct option */
  correctIndex: number;
  explanation: string;
}

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
  /** 3–4 static sample questions shown on the category landing page */
  sampleQuestions: SampleQuestion[];
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
    sampleQuestions: [
      {
        question: "What is the output of the following code?\n\ndef add(x, lst=[]):\n    lst.append(x)\n    return lst\n\nprint(add(1))\nprint(add(2))",
        options: ["[1] then [2]", "[1] then [1, 2]", "[1, 2] then [1, 2]", "Error"],
        correctIndex: 1,
        explanation: "Python evaluates default arguments once at function definition time, not each call. The same list object is reused across calls, so the second call appends to the same list, producing [1, 2]. This is a classic mutable default argument gotcha — use `lst=None` and create a new list inside the function instead.",
      },
      {
        question: "What does `isinstance(True, int)` return in Python?",
        options: ["False", "True", "TypeError", "None"],
        correctIndex: 1,
        explanation: "In Python, `bool` is a subclass of `int`. This means `True` and `False` are instances of both `bool` and `int`. As a result, `isinstance(True, int)` returns `True`. This also means `True + True` evaluates to `2` and `True == 1` is `True`.",
      },
      {
        question: "Which of the following creates a generator in Python?",
        options: [
          "def gen(): return [x * 2 for x in range(5)]",
          "def gen(): yield from [x * 2 for x in range(5)]",
          "gen = (x * 2 for x in range(5)) but calling gen()",
          "def gen(): return (x * 2 for x in range(5))",
        ],
        correctIndex: 1,
        explanation: "A function that contains a `yield` or `yield from` statement becomes a generator function — calling it returns a generator object that produces values lazily. Option B uses `yield from` to delegate to a list comprehension. A generator expression like `(x*2 for x in range(5))` is also a generator, but option C describes calling it as a function, which would fail.",
      },
      {
        question: "What is the time complexity of looking up a key in a Python dict?",
        options: ["O(n)", "O(log n)", "O(1) average, O(n) worst case", "O(n log n)"],
        correctIndex: 2,
        explanation: "Python dicts are hash tables. Key lookups are O(1) on average because the hash function maps the key directly to a bucket. In the worst case — when every key hashes to the same bucket (hash collision) — lookup degrades to O(n). CPython's dict implementation uses a compact open-addressing scheme that keeps the average case very close to O(1) in practice.",
      },
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
    sampleQuestions: [
      {
        question: "In a large language model, what does 'temperature' control?",
        options: [
          "The computational speed of token generation",
          "The randomness and creativity of the output distribution",
          "The maximum number of tokens in the response",
          "The size of the model's context window",
        ],
        correctIndex: 1,
        explanation: "Temperature scales the logits before applying softmax to produce the next-token probability distribution. A temperature of 0 makes the model always pick the highest-probability token (deterministic, repetitive). Higher temperatures flatten the distribution, making lower-probability tokens more likely, producing more varied and creative — but less predictable — output. Typical production values range from 0.1 (factual tasks) to 1.0 (creative tasks).",
      },
      {
        question: "What is the primary purpose of the 'retrieval' step in a RAG (Retrieval-Augmented Generation) pipeline?",
        options: [
          "To fine-tune the language model on domain-specific data",
          "To compress the prompt to fit within the context window",
          "To fetch relevant document chunks from a vector store to augment the LLM prompt",
          "To cache previous responses to avoid redundant API calls",
        ],
        correctIndex: 2,
        explanation: "RAG separates knowledge storage from the language model. At query time, the user's question is embedded into a vector, and a similarity search retrieves the most relevant document chunks from a vector database (e.g. Pinecone, pgvector, Chroma). These chunks are injected into the LLM's prompt as context, allowing the model to answer questions about private or up-to-date data it was never trained on.",
      },
      {
        question: "Which activation function is most commonly used in hidden layers of modern deep neural networks?",
        options: ["Sigmoid", "Tanh", "ReLU (Rectified Linear Unit)", "Softmax"],
        correctIndex: 2,
        explanation: "ReLU (f(x) = max(0, x)) replaced sigmoid and tanh as the dominant hidden-layer activation because it does not suffer from the vanishing gradient problem for positive inputs, is computationally cheap (a single comparison), and produces sparse activations that improve generalisation. Softmax is used in the output layer for multi-class classification. Sigmoid is still used for binary output gates (e.g. LSTM) but rarely in hidden layers.",
      },
      {
        question: "What is 'hallucination' in the context of large language models?",
        options: [
          "When the model generates an unusually long response",
          "When the model confidently produces factually incorrect or fabricated information",
          "When the model refuses to answer a question",
          "When the model repeats the same phrase multiple times",
        ],
        correctIndex: 1,
        explanation: "LLM hallucination refers to the model generating text that sounds confident and fluent but is factually wrong or entirely fabricated — citing non-existent papers, inventing historical events, or producing plausible-looking but incorrect code. It happens because LLMs are trained to produce statistically likely text, not to verify facts. Mitigations include grounding the model with RAG, using lower temperature, and adding explicit fact-checking steps.",
      },
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
    sampleQuestions: [
      {
        question: "What is the time complexity of binary search on a sorted array of n elements?",
        options: ["O(n)", "O(n log n)", "O(log n)", "O(1)"],
        correctIndex: 2,
        explanation: "Binary search repeatedly halves the search space: compare the target to the middle element and eliminate the half where the target cannot be. This halving means the number of steps grows logarithmically — to search 1 million elements takes at most ~20 comparisons (log₂ 1,000,000 ≈ 20). The key requirement is that the array must be sorted; otherwise you cannot safely discard half the remaining elements.",
      },
      {
        question: "Which data structure is used internally when performing a Breadth-First Search (BFS)?",
        options: ["Stack", "Queue", "Heap", "Hash map"],
        correctIndex: 1,
        explanation: "BFS explores nodes level by level, which requires processing nodes in the order they were discovered — first in, first out. A queue provides exactly this behaviour: enqueue discovered neighbours, then dequeue the next node to process. If you used a stack instead (LIFO), you'd get Depth-First Search (DFS) because you'd always explore the most recently discovered node first.",
      },
      {
        question: "What is the worst-case time complexity of QuickSort?",
        options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"],
        correctIndex: 1,
        explanation: "QuickSort's worst case is O(n²) and occurs when the pivot chosen is always the smallest or largest element in the partition — for example, applying QuickSort to an already-sorted array using a naive 'pick the first element as pivot' strategy. Each partition step reduces the problem size by only 1. In practice, randomised pivot selection or the median-of-three rule makes the worst case extremely unlikely, giving average O(n log n) performance.",
      },
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
    sampleQuestions: [
      {
        question: "What does `typeof null` return in JavaScript?",
        options: ['"null"', '"undefined"', '"object"', '"boolean"'],
        correctIndex: 2,
        explanation: 'typeof null returns "object" — this is a well-known bug from the original JavaScript implementation in 1995. In the early engine, values were stored as a tag + value pair. The null pointer (0x00) happened to share the same type tag as objects. The bug was never fixed because doing so would break vast amounts of existing code. This is why null checks should use strict equality (`=== null`) rather than typeof.',
      },
      {
        question: "What is the output of `0.1 + 0.2 === 0.3` in JavaScript?",
        options: ["true", "false", "TypeError", "NaN"],
        correctIndex: 1,
        explanation: "This evaluates to false. JavaScript uses 64-bit IEEE 754 floating-point arithmetic, and 0.1 and 0.2 cannot be represented exactly in binary — they are stored as repeating fractions. The actual sum is 0.30000000000000004, not 0.3. To compare floating-point numbers, use a tolerance: `Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON`.",
      },
      {
        question: "Which of the following correctly describes the JavaScript event loop?",
        options: [
          "JavaScript is multi-threaded and runs callbacks in parallel",
          "The event loop blocks execution until all microtasks are cleared before processing the next macrotask",
          "setTimeout callbacks always run before Promise callbacks",
          "The call stack and the event queue run on separate threads simultaneously",
        ],
        correctIndex: 1,
        explanation: "JavaScript is single-threaded. After each macrotask (e.g. setTimeout callback, I/O event), the event loop empties the entire microtask queue (resolved Promises, queueMicrotask) before picking up the next macrotask. This is why `Promise.resolve().then(...)` always executes before a `setTimeout(..., 0)` callback scheduled before it — microtasks have higher priority than macrotasks.",
      },
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
    sampleQuestions: [
      {
        question: "According to the CAP theorem, which two properties can a distributed system guarantee simultaneously during a network partition?",
        options: [
          "Consistency and Availability",
          "Availability and Partition tolerance",
          "Consistency and Partition tolerance",
          "All three: Consistency, Availability, and Partition tolerance",
        ],
        correctIndex: 2,
        explanation: "The CAP theorem states that during a network partition, a distributed system can provide either Consistency (every read returns the most recent write) OR Availability (every request gets a non-error response), but not both. Partition tolerance (the system continues despite network failures between nodes) is non-optional in any real distributed system — network failures happen. Systems like HBase and ZooKeeper choose CP; Cassandra and CouchDB choose AP.",
      },
      {
        question: "What is the key difference between a cache 'write-through' and 'write-back' strategy?",
        options: [
          "Write-through updates the cache only; write-back updates both cache and database",
          "Write-through updates both cache and database synchronously; write-back writes to cache immediately and database asynchronously",
          "Write-through is used for reads; write-back is used for writes",
          "There is no difference — the terms are interchangeable",
        ],
        correctIndex: 1,
        explanation: "Write-through: every write updates the cache and the database synchronously before acknowledging the write to the client. This ensures consistency but adds write latency. Write-back (write-behind): writes go to the cache immediately, and the cache asynchronously flushes to the database later. This gives much lower write latency but risks data loss if the cache node fails before the flush. Write-back is used where write throughput matters more than strict durability.",
      },
      {
        question: "What does a circuit breaker pattern do in a microservices architecture?",
        options: [
          "Encrypts traffic between services to prevent data leaks",
          "Balances load across service instances using round-robin",
          "Stops calls to a failing downstream service to prevent cascading failures, then periodically retries",
          "Caches responses from downstream services to reduce latency",
        ],
        correctIndex: 2,
        explanation: "A circuit breaker wraps calls to an external service. When the failure rate exceeds a threshold, the breaker trips to 'open' state and immediately rejects further calls without attempting the network request. After a timeout (half-open state), it allows a probe request through. If the probe succeeds, the breaker resets to closed; if it fails, the breaker stays open. This prevents a slow or failed dependency from consuming all threads and crashing the calling service.",
      },
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
    sampleQuestions: [
      {
        question: "What is the difference between `unknown` and `any` in TypeScript?",
        options: [
          "There is no difference — they are aliases",
          "`unknown` disables all type checking; `any` requires a type guard before use",
          "`unknown` requires a type guard or narrowing before use; `any` bypasses all type checks",
          "`unknown` is for primitive types only; `any` works with all types",
        ],
        correctIndex: 2,
        explanation: "`any` is a TypeScript escape hatch — you can assign anything to it and use it as anything, but you lose all type safety. `unknown` is the type-safe alternative: you can assign any value to `unknown`, but you cannot call methods, access properties, or pass it where a specific type is expected without first narrowing it with a type guard (typeof, instanceof, or a custom predicate). Prefer `unknown` over `any` whenever you genuinely don't know the type.",
      },
      {
        question: "What does the `Partial<T>` utility type do in TypeScript?",
        options: [
          "Removes all properties from type T",
          "Makes all properties of type T required and non-nullable",
          "Makes all properties of type T optional (adds ? to each property)",
          "Picks only the optional properties from type T",
        ],
        correctIndex: 2,
        explanation: "`Partial<T>` constructs a new type with all properties of T set to optional. It is equivalent to `{ [K in keyof T]?: T[K] }`. This is useful for update/patch functions where you only want to accept a subset of fields: `function updateUser(id: string, patch: Partial<User>)`. The counterpart is `Required<T>`, which makes all properties non-optional.",
      },
      {
        question: "What is a discriminated union in TypeScript and what makes it useful?",
        options: [
          "A union type where all members share a common literal property used to narrow the type",
          "A union of types that can only contain primitive values",
          "A union where TypeScript automatically selects the most specific type",
          "A union type where only one member can be assigned at a time",
        ],
        correctIndex: 0,
        explanation: "A discriminated union (also called a tagged union) is a union where each member has a shared property with a unique literal value — the discriminant. For example: `type Shape = { kind: 'circle'; radius: number } | { kind: 'square'; side: number }`. TypeScript uses the `kind` property to narrow the type in a switch statement, and with `strictNullChecks` enabled, the compiler will warn you if you add a new union member but forget to handle it in a switch — enabling exhaustive type checking.",
      },
    ],
  },
];

export function getCategoryBySlug(slug: string): CategoryData | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
