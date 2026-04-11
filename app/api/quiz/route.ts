import { NextResponse } from "next/server";
import { getSeriesSlides } from "@/lib/db";

export const dynamic = "force-dynamic";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SlideData {
  heading?:    string;
  definition?: { title?: string; body?: string };
  cards?:      { title?: string; icon?: string }[];
  // code-quiz fields
  question?:  string;
  code?:      string;
  language?:  string;
}

export interface QuizQuestion {
  id:         string;
  cat:        string;
  diff:       string;
  topic:      string;
  q:          string;
  opts:       string[];
  ans:        number;          // 0-3
  exp:        string;
  type:       "text" | "code";
  code?:      string;
  language?:  string;
  live?:      boolean;  // true = from DB, false/undefined = static fallback
}

// ── Static fallback questions ─────────────────────────────────────────────────
// Served when the DB has no questions for a given category, or on error.
// These live server-side so they don't bloat the client bundle.

const QUIZ_QS_FALLBACK: QuizQuestion[] = [
  // ── AI/ML ──
  { id: "fb-aiml-1", cat: "AI/ML", diff: "Beginner", topic: "RAG", type: "text",
    q: "What does RAG stand for in AI?",
    opts: ["Rapid AI Generation", "Retrieval-Augmented Generation", "Random Attention Graph", "Recursive Auto-regressor"],
    ans: 1, exp: "RAG retrieves relevant documents and feeds them into an LLM for grounded, factual answers — the backbone of most production AI chatbots." },
  { id: "fb-aiml-2", cat: "AI/ML", diff: "Intermediate", topic: "Function Calling", type: "text",
    q: "Which technique lets LLMs reliably call external APIs and tools?",
    opts: ["Fine-tuning", "Prompt caching", "Function calling / Tool use", "Quantization"],
    ans: 2, exp: "Function calling lets the LLM emit structured JSON to trigger external functions — the core mechanism of AI agents like LangGraph and OpenAI Agents SDK." },
  { id: "fb-aiml-3", cat: "AI/ML", diff: "Intermediate", topic: "MCP", type: "text",
    q: "What is Model Context Protocol (MCP)?",
    opts: ["A new transformer architecture", "A standard for connecting AI agents to external tools and data", "Meta's training protocol", "A prompt compression technique"],
    ans: 1, exp: "MCP is an open standard by Anthropic — like USB-C for AI. It lets any LLM agent connect to tools, databases, and APIs through a unified interface." },
  { id: "fb-aiml-4", cat: "AI/ML", diff: "Advanced", topic: "MoE", type: "text",
    q: "What is the Mixture of Experts (MoE) architecture used in?",
    opts: ["Robotics control systems", "Sparse activation in LLMs like GPT-4 and Mixtral", "Image classification networks", "Reinforcement learning reward shaping"],
    ans: 1, exp: "MoE activates only a subset of 'expert' sub-networks per token. GPT-4 and Mixtral use this to scale to huge parameter counts while keeping inference costs manageable." },

  // ── AI Productivity ──
  { id: "fb-aiprod-1", cat: "AI Productivity", diff: "Beginner", topic: "MCP", type: "text",
    q: "What does an MCP server enable in AI development?",
    opts: ["Training larger models", "Connecting AI agents to external tools and data sources", "Faster GPU inference", "Cloud cost reduction"],
    ans: 1, exp: "An MCP server acts as a bridge that lets Claude (or any MCP-compatible agent) interact with your tools — file system, databases, APIs — through a standardized protocol." },
  { id: "fb-aiprod-2", cat: "AI Productivity", diff: "Beginner", topic: "Claude Projects", type: "text",
    q: "What do Claude.ai Projects let you do?",
    opts: ["Train custom models", "Save custom instructions + knowledge that persist across chats", "Share Claude with your team for free", "Run Claude locally offline"],
    ans: 1, exp: "Projects give you a persistent workspace: custom system prompts, uploaded files, and conversation history that Claude remembers across sessions — perfect for recurring workflows." },
  { id: "fb-aiprod-3", cat: "AI Productivity", diff: "Beginner", topic: "Claude vs Cursor", type: "text",
    q: "What is the key advantage of Claude Code over Claude.ai chat for developers?",
    opts: ["It's free with no limits", "It operates directly in your terminal and can read/write files autonomously", "It has a better UI", "It uses a smaller, faster model"],
    ans: 1, exp: "Claude Code runs as a CLI tool with direct file system access — it can read, edit, and run code in your repo without copy-pasting, making it far more practical for software engineering." },
  { id: "fb-aiprod-4", cat: "AI Productivity", diff: "Intermediate", topic: "Task Automation", type: "text",
    q: "What is the Anthropic Batch API primarily used for?",
    opts: ["Real-time chat applications", "Processing large volumes of prompts asynchronously at ~50% lower cost", "Fine-tuning Claude models", "Streaming responses faster"],
    ans: 1, exp: "The Batch API lets you submit up to 10,000 requests at once, processed within 24 hours at half the cost of the standard API — ideal for bulk tasks like content generation or data analysis." },

  // ── AI Evaluation ──
  { id: "fb-aieval-1", cat: "AI Evaluation", diff: "Beginner", topic: "RAGAS", type: "text",
    q: "What does RAGAS evaluate in an AI system?",
    opts: ["GPU memory usage", "RAG pipeline quality — faithfulness, relevance, and recall", "Model training loss curves", "API latency and throughput"],
    ans: 1, exp: "RAGAS (Retrieval Augmented Generation Assessment) automatically scores your RAG pipeline across faithfulness (no hallucinations), answer relevancy, and context recall." },
  { id: "fb-aieval-2", cat: "AI Evaluation", diff: "Intermediate", topic: "Faithfulness", type: "text",
    q: "What does 'faithfulness' mean in RAGAS evaluation?",
    opts: ["The model answers quickly", "The answer is factually supported by the retrieved context", "The answer is grammatically correct", "The retriever returns enough documents"],
    ans: 1, exp: "Faithfulness measures whether the LLM's answer is grounded in the retrieved context. Low faithfulness = hallucination. It's the most critical RAG eval metric." },
  { id: "fb-aieval-3", cat: "AI Evaluation", diff: "Intermediate", topic: "LLM-as-Judge", type: "text",
    q: "What is 'LLM-as-judge' in AI evaluation?",
    opts: ["Using a small model to train a larger one", "Using a powerful LLM to score outputs of another LLM", "A hardware benchmark for LLM chips", "A human evaluation framework"],
    ans: 1, exp: "LLM-as-judge uses a capable model (like GPT-4 or Claude) to score other model outputs — enabling scalable automated evaluation without human labelers." },
  { id: "fb-aieval-4", cat: "AI Evaluation", diff: "Advanced", topic: "Langfuse", type: "text",
    q: "Which tool provides open-source LLM observability with traces, evals, and a UI?",
    opts: ["Stripe", "Langfuse", "Datadog", "Grafana"],
    ans: 1, exp: "Langfuse is an open-source LLM observability platform. It captures traces, runs evals (including RAGAS), and gives you a dashboard to debug and improve your AI app." },

  // ── AI Engineering ──
  { id: "fb-aieng-1", cat: "AI Engineering", diff: "Beginner", topic: "Vector DB", type: "text",
    q: "Which vector database is best for local dev and prototyping?",
    opts: ["Pinecone", "Chroma", "Weaviate", "Milvus"],
    ans: 1, exp: "Chroma runs entirely in-process (no server needed), making it perfect for local dev and notebooks. Switch to Pinecone or Qdrant when going to production." },
  { id: "fb-aieng-2", cat: "AI Engineering", diff: "Intermediate", topic: "Hybrid Search", type: "text",
    q: "What is hybrid search in vector databases?",
    opts: ["Searching two databases simultaneously", "Combining dense vector search with sparse BM25 keyword search", "Using GPU + CPU together for search", "Searching text and images at the same time"],
    ans: 1, exp: "Hybrid search combines semantic (dense vector) search with keyword (BM25) search. This beats pure vector search for most production RAG systems — especially for specific terms." },
  { id: "fb-aieng-3", cat: "AI Engineering", diff: "Intermediate", topic: "Reranking", type: "text",
    q: "What does reranking do in a RAG pipeline?",
    opts: ["Removes duplicate chunks", "Re-orders retrieved chunks by relevance before sending to LLM", "Summarizes long documents", "Splits documents into smaller chunks"],
    ans: 1, exp: "A reranker (like Cohere Rerank or a cross-encoder) takes the top-K retrieved chunks and reorders them by actual relevance. It dramatically improves RAG accuracy." },
  { id: "fb-aieng-4", cat: "AI Engineering", diff: "Advanced", topic: "vLLM", type: "text",
    q: "What is vLLM and why is it used in production?",
    opts: ["A video generation model", "A high-throughput LLM serving library using PagedAttention", "A vector database for LLMs", "A fine-tuning framework for smaller models"],
    ans: 1, exp: "vLLM uses PagedAttention to manage KV cache efficiently — enabling 24x higher throughput than naive HuggingFace serving. It's the standard for self-hosted LLM production deployments." },

  // ── Python ──
  { id: "fb-py-1", cat: "Python", diff: "Beginner", topic: "range()", type: "text",
    q: "What does list(range(3)) return?",
    opts: ["[1, 2, 3]", "[0, 1, 2]", "[0, 1, 2, 3]", "[1, 2]"],
    ans: 1, exp: "range(3) generates 0, 1, 2 — it starts at 0 and stops before the given number. This is one of the most common Python interview questions." },
  { id: "fb-py-2", cat: "Python", diff: "Intermediate", topic: "Pydantic v2", type: "text",
    q: "What is the main advantage of Pydantic v2 over v1?",
    opts: ["Supports Python 2", "Core validation logic rewritten in Rust — 5–50x faster", "Built-in database ORM", "Native async/await support"],
    ans: 1, exp: "Pydantic v2 rewrote its core in Rust via the `pydantic-core` library, making validation 5–50x faster. It's now the standard for data validation in FastAPI and AI frameworks." },
  { id: "fb-py-3", cat: "Python", diff: "Beginner", topic: "List Comprehension", type: "text",
    q: "What does [x*2 for x in range(4)] produce?",
    opts: ["[1, 2, 3, 4]", "[2, 4, 6, 8]", "[0, 2, 4, 6]", "[0, 1, 2, 3]"],
    ans: 2, exp: "range(4) gives 0,1,2,3. Multiplying each by 2 gives [0,2,4,6]. List comprehensions are faster than a for-loop appending to a list." },
  { id: "fb-py-4", cat: "Python", diff: "Intermediate", topic: "Decorators", type: "text",
    q: "What does the @property decorator do in Python?",
    opts: ["Makes a method static", "Marks the class as read-only", "Lets a method be called without parentheses like an attribute", "Caches the return value forever"],
    ans: 2, exp: "@property turns a method into a 'getter' so you can access it as obj.value instead of obj.value(). Pair with @value.setter to make it writable." },
  { id: "fb-py-5", cat: "Python", diff: "Advanced", topic: "GIL", type: "text",
    q: "What is Python's GIL and when does it matter?",
    opts: ["Global Input Library — for stdin handling", "Global Interpreter Lock — prevents true threading parallelism for CPU-bound tasks", "Graphics Interface Layer — for GUI applications", "Generic Iteration Loop — syntactic sugar"],
    ans: 1, exp: "The GIL ensures only one thread executes Python bytecode at a time. CPU-bound tasks get no parallelism from threads — use multiprocessing or async (for I/O-bound) instead." },
  { id: "fb-py-6", cat: "Python", diff: "Intermediate", topic: "Generators", type: "text",
    q: "What is the key difference between a generator and a list?",
    opts: ["Generators are faster to index", "Generators are lazy — they yield values one at a time, using O(1) memory", "Generators support slicing", "Lists can only store numbers"],
    ans: 1, exp: "A generator doesn't build the full sequence in memory. It yields items on demand, making it ideal for large datasets — e.g., reading a 10 GB file line by line without OOM errors." },

  // ── Algorithms ──
  { id: "fb-algo-1", cat: "Algorithms", diff: "Beginner", topic: "Binary Search", type: "text",
    q: "What is the time complexity of binary search?",
    opts: ["O(n)", "O(n log n)", "O(log n)", "O(1)"],
    ans: 2, exp: "Binary search halves the search space on each step — O(log n) on sorted arrays. For 1 million elements, that's at most 20 comparisons." },
  { id: "fb-algo-2", cat: "Algorithms", diff: "Intermediate", topic: "Hash Tables", type: "text",
    q: "Which data structure gives O(1) average-case lookup?",
    opts: ["Linked list", "Binary search tree", "Hash table", "Sorted array"],
    ans: 2, exp: "Hash tables use a hash function to map keys to buckets — O(1) average for get/set. O(n) worst case due to collisions, but rare with a good hash function." },
  { id: "fb-algo-3", cat: "Algorithms", diff: "Beginner", topic: "Big-O", type: "text",
    q: "What Big-O is a nested for loop over n elements?",
    opts: ["O(n)", "O(log n)", "O(n²)", "O(2n)"],
    ans: 2, exp: "A loop inside a loop gives O(n²) — for n=1000 that's 1,000,000 operations. This is why O(n²) sorts (bubble, insertion) are slow for large inputs." },
  { id: "fb-algo-4", cat: "Algorithms", diff: "Intermediate", topic: "Dynamic Programming", type: "text",
    q: "What is memoization in dynamic programming?",
    opts: ["Sorting results for faster lookup", "Caching previously computed results to avoid redundant work", "Storing data in memory rather than disk", "Converting recursion to iteration"],
    ans: 1, exp: "Memoization stores the results of expensive function calls keyed by inputs. The Fibonacci sequence goes from O(2ⁿ) to O(n) with a simple dictionary cache." },
  { id: "fb-algo-5", cat: "Algorithms", diff: "Advanced", topic: "Graph Traversal", type: "text",
    q: "What does BFS use vs DFS in terms of data structure?",
    opts: ["BFS uses a stack; DFS uses a queue", "BFS uses a queue; DFS uses a stack", "Both use a heap", "Both use a hash table"],
    ans: 1, exp: "BFS uses a queue (FIFO) — processes level by level, great for shortest path. DFS uses a stack (LIFO) or recursion — explores as deep as possible first, great for cycle detection." },

  // ── JavaScript ──
  { id: "fb-js-1", cat: "JavaScript", diff: "Beginner", topic: "Equality", type: "text",
    q: "What does === check vs == in JavaScript?",
    opts: ["Nothing different", "Type AND value (no coercion)", "Only value, not type", "Deep equality"],
    ans: 1, exp: "=== is strict equality — no type coercion. 5 == '5' is true, but 5 === '5' is false. Always prefer === in production code." },
  { id: "fb-js-2", cat: "JavaScript", diff: "Intermediate", topic: "React Server Components", type: "text",
    q: "What is new about React Server Components in React 19?",
    opts: ["They run on mobile devices", "They render on the server, send HTML+data, with zero client JS bundle", "They replace useEffect entirely", "They only work with Next.js"],
    ans: 1, exp: "RSCs render server-side and send the result to the client with no JavaScript bundle for the component itself. This eliminates waterfalls and reduces client bundle size dramatically." },
  { id: "fb-js-3", cat: "JavaScript", diff: "Beginner", topic: "Closures", type: "text",
    q: "What is a closure in JavaScript?",
    opts: ["A self-invoking anonymous function", "A function that retains access to its outer scope even after the outer function returns", "A way to import modules", "An arrow function with no body"],
    ans: 1, exp: "Closures let inner functions 'close over' variables from an outer scope. This powers patterns like factories, private state, and event handlers that remember context." },
  { id: "fb-js-4", cat: "JavaScript", diff: "Intermediate", topic: "Promises", type: "text",
    q: "What does Promise.all() do?",
    opts: ["Runs promises one after another", "Resolves when ALL promises resolve; rejects if any rejects", "Resolves when the first promise resolves", "Ignores rejections and resolves with partial results"],
    ans: 1, exp: "Promise.all() takes an array of promises and resolves with an array of results when ALL succeed. If any fail, the whole thing rejects. Use Promise.allSettled() to handle partial failures." },
  { id: "fb-js-5", cat: "JavaScript", diff: "Advanced", topic: "Event Loop", type: "text",
    q: "What executes first: a Promise callback or a setTimeout callback?",
    opts: ["setTimeout (macro-task)", "Promise (micro-task)", "They run at the same time", "Depends on the browser"],
    ans: 1, exp: "Promises use the microtask queue, which is drained completely before the next macro-task (like setTimeout). So Promise.resolve().then() always runs before setTimeout(fn, 0)." },

  // ── System Design ──
  { id: "fb-sd-1", cat: "System Design", diff: "Intermediate", topic: "CDN", type: "text",
    q: "What problem does a CDN primarily solve?",
    opts: ["Database replication", "Reducing latency via edge-cached content", "Encrypting data in transit", "Load balancing"],
    ans: 1, exp: "CDNs cache static assets at edge locations worldwide, so users download from the nearest node — reducing latency from 200ms to under 10ms for static content." },
  { id: "fb-sd-2", cat: "System Design", diff: "Advanced", topic: "CAP Theorem", type: "text",
    q: "What is the CAP theorem's core constraint?",
    opts: ["You must choose 2 of 3: Consistency, Availability, Performance", "You must choose 2 of 3: Consistency, Availability, Partition tolerance", "All distributed systems must be consistent", "Availability and consistency can both be guaranteed"],
    ans: 1, exp: "CAP states a distributed system can only guarantee 2 of: Consistency (all nodes see the same data), Availability (always responds), Partition tolerance (survives network splits). Real systems choose CP or AP." },
  { id: "fb-sd-3", cat: "System Design", diff: "Beginner", topic: "Load Balancer", type: "text",
    q: "What is the purpose of a load balancer?",
    opts: ["To compress API responses", "To distribute incoming traffic across multiple servers", "To cache database queries", "To encrypt requests"],
    ans: 1, exp: "A load balancer spreads requests across servers so no single one gets overwhelmed. Common strategies: round-robin, least-connections, consistent hashing. It also enables horizontal scaling." },
  { id: "fb-sd-4", cat: "System Design", diff: "Intermediate", topic: "Message Queues", type: "text",
    q: "Why use a message queue (e.g. Kafka, RabbitMQ) between services?",
    opts: ["To synchronously call services faster", "To decouple producer and consumer, enable async processing, and smooth traffic spikes", "To replace a database", "To handle authentication"],
    ans: 1, exp: "Message queues let a producer push work without waiting for the consumer. This decouples services, absorbs traffic bursts, and enables retry/dead-letter handling — essential for event-driven architectures." },

  // ── DevOps ──
  { id: "fb-devops-1", cat: "DevOps", diff: "Beginner", topic: "Docker", type: "text",
    q: "What does docker run -d do?",
    opts: ["Delete container after exit", "Run in detached (background) mode", "Run with debug output", "Dry-run mode"],
    ans: 1, exp: "-d (detached) runs the container in the background, freeing your terminal. Use docker logs <id> to see its output later." },
  { id: "fb-devops-2", cat: "DevOps", diff: "Intermediate", topic: "OpenTelemetry", type: "text",
    q: "What does OpenTelemetry unify for observability?",
    opts: ["Docker and Kubernetes configs", "Traces, metrics, and logs under a single open standard", "AWS and GCP monitoring dashboards", "CI/CD pipeline configurations"],
    ans: 1, exp: "OpenTelemetry (OTel) is the CNCF standard for collecting traces, metrics, and logs — replacing vendor-specific SDKs with one open API you can send to any backend (Jaeger, Grafana, Datadog)." },
  { id: "fb-devops-3", cat: "DevOps", diff: "Beginner", topic: "CI/CD", type: "text",
    q: "What is the difference between CI and CD?",
    opts: ["CI = code review, CD = deployment", "CI = automated build+test on every commit; CD = automated delivery to staging or production", "CI = containers, CD = cloud", "They mean the same thing"],
    ans: 1, exp: "CI (Continuous Integration) runs tests on every push to catch breakage early. CD (Continuous Delivery/Deployment) automatically ships passing builds to staging or prod — closing the loop from code to users." },
  { id: "fb-devops-4", cat: "DevOps", diff: "Intermediate", topic: "Kubernetes", type: "text",
    q: "What does a Kubernetes Pod contain?",
    opts: ["Only one container, always", "One or more tightly-coupled containers sharing network and storage", "A complete virtual machine", "A namespace and RBAC rules"],
    ans: 1, exp: "A Pod is the smallest deployable unit in Kubernetes and can hold multiple containers that share the same IP and volumes. Sidecar patterns (logging, proxies) use multi-container pods." },
];

// ── Daily focus rotation ──────────────────────────────────────────────────────
// Rotates through categories deterministically by day-of-year.
// Each day a different category is "featured" — the quiz widget opens pre-set to it.

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

function getDailyFocus(questions: QuizQuestion[]): string {
  const cats = [...new Set(questions.map((q) => q.cat))];
  if (cats.length === 0) return "All";
  return cats[dayOfYear(new Date()) % cats.length];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseData(raw: string): SlideData | null {
  try { return JSON.parse(raw) as SlideData; } catch { return null; }
}

/** Strip any "A) " / "B) " etc. prefix from an option label */
function stripPrefix(s: string): string {
  return s.replace(/^[A-Da-d][).]\s*/u, "").trim();
}

/** Return 0..3 for letters A..D, or -1 */
function letterToIdx(letter: string): number {
  return "ABCD".indexOf(letter.toUpperCase());
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const catParam  = searchParams.get("category")   || undefined;
  const diffParam = searchParams.get("difficulty") || undefined;

  // Normalise "All" → undefined so the SQL query has no filter
  const category   = catParam  === "All" ? undefined : catParam;
  const difficulty = diffParam === "All" ? undefined : diffParam;

  try {
    const rows = await getSeriesSlides(category, difficulty);

    // Group all slides by series_id, preserving order
    const byId = new Map<number, typeof rows>();
    for (const row of rows) {
      if (!byId.has(row.series_id)) byId.set(row.series_id, []);
      byId.get(row.series_id)!.push(row);
    }

    const dbQuestions: QuizQuestion[] = [];

    for (const [, slides] of byId) {
      // slides are already ordered by position from the SQL query

      for (let i = 0; i < slides.length; i++) {
        const s    = slides[i];
        const data = parseData(s.data);
        if (!data) continue;

        const heading    = data.heading ?? "";
        const isTextQuiz = s.template === "definition-steps" && /quiz/i.test(heading);
        const isCodeQuiz = s.template === "code-quiz";

        if (!isTextQuiz && !isCodeQuiz) continue;

        // ── Extract 4 option titles from opt_a..opt_d cards ──
        const rawCards = (data.cards ?? []).filter((c) =>
          /^opt_[abcd]$/i.test(c.icon ?? ""),
        );
        if (rawCards.length !== 4) continue;
        const opts = rawCards.map((c) => stripPrefix(String(c.title ?? "")));

        // ── Find the next "Answer" slide in the same series ──
        let answerData: SlideData | null = null;
        for (let j = i + 1; j < slides.length; j++) {
          if (slides[j].template !== "definition-steps") continue;
          const ad = parseData(slides[j].data);
          if (ad && /answer/i.test(ad.heading ?? "")) { answerData = ad; break; }
        }
        if (!answerData) continue;

        // ── Extract correct answer letter from answer slide title "B)  ..." ──
        const ansTitle = answerData.definition?.title ?? "";
        const match    = ansTitle.match(/^([A-D])[).]/i);
        if (!match) continue;
        const ans = letterToIdx(match[1]);
        if (ans < 0) continue;

        const exp = (answerData.definition?.body ?? "").trim();

        if (isTextQuiz) {
          const q = (data.definition?.title ?? "").trim();
          if (!q) continue;
          dbQuestions.push({
            id: `${s.series_id}-${i}`,
            cat: s.category, diff: s.difficulty, topic: s.topic,
            q, opts, ans, exp, type: "text", live: true,
          });
        } else {
          // code-quiz
          const q = (data.question ?? "").trim();
          if (!q) continue;
          dbQuestions.push({
            id: `${s.series_id}-${i}`,
            cat: s.category, diff: s.difficulty, topic: s.topic,
            q, opts, ans, exp, type: "code", live: true,
            code:     data.code     ?? "",
            language: data.language ?? "code",
          });
        }
      }
    }

    // ── Supplement with fallback for categories not yet in the DB ─────────────
    const dbCats = new Set(dbQuestions.map((q) => q.cat));
    const supplement = QUIZ_QS_FALLBACK.filter((q) => !dbCats.has(q.cat));
    const questions  = dbQuestions.length ? [...dbQuestions, ...supplement] : QUIZ_QS_FALLBACK;

    // ── Daily focus: rotate through categories deterministically by day ────────
    const dailyFocus = getDailyFocus(questions);

    return NextResponse.json({ questions, dailyFocus });
  } catch (err) {
    console.error("[/api/quiz] error:", err);
    const dailyFocus = getDailyFocus(QUIZ_QS_FALLBACK);
    return NextResponse.json({ questions: QUIZ_QS_FALLBACK, dailyFocus });
  }
}
