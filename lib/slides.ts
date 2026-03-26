export type CardColor = "cyan" | "purple" | "green" | "pink" | "amber";

export interface SlideCard {
  color: CardColor;
  icon: string;   // icon key (see SlideIcon) or emoji fallback
  title: string;
  body: string;
}

export interface QuizSlide {
  id: string;
  template: "definition-steps" | "pipeline" | "cta";
  heading: string;
  subtitle?: string;
  slideNum: number;
  totalSlides: number;
  handle?: string;
  definition?: { color: CardColor; title: string; body: string };
  cards: SlideCard[];
}

export const COLORS: Record<CardColor, { text: string; border: string; bg: string }> = {
  cyan:   { text: "#22d3ee", border: "#22d3ee55", bg: "#22d3ee0a" },
  purple: { text: "#a855f7", border: "#a855f755", bg: "#a855f70a" },
  green:  { text: "#4ade80", border: "#4ade8055", bg: "#4ade800a" },
  pink:   { text: "#f472b6", border: "#f472b655", bg: "#f472b60a" },
  amber:  { text: "#fbbf24", border: "#fbbf2455", bg: "#fbbf240a" },
};

const H = "@QuizBytesDaily";

// ─────────────────────────────────────────────────────────────────────────────
// SERIES 1 — RAG (8 slides)
// ─────────────────────────────────────────────────────────────────────────────
export const RAG_SERIES: QuizSlide[] = [
  {
    id: "rag-1", template: "definition-steps", heading: "What is RAG?",
    slideNum: 1, totalSlides: 9, handle: H,
    definition: {
      color: "cyan", title: "Retrieval-Augmented Generation",
      body: "A technique that enhances LLM responses by fetching relevant data from external sources before generating an answer.",
    },
    cards: [
      { color: "cyan",   icon: "search",  title: "Retrieve", body: "Search relevant documents"  },
      { color: "purple", icon: "plus",    title: "Augment",  body: "Add context to the prompt"  },
      { color: "green",  icon: "robot",   title: "Generate", body: "LLM creates the answer"     },
    ],
  },
  {
    id: "rag-2", template: "definition-steps", heading: "Why LLMs Hallucinate",
    slideNum: 2, totalSlides: 9, handle: H,
    definition: {
      color: "pink", title: "The Core Problem",
      body: "LLMs are frozen at training time — they know nothing about recent events, your private data, or domain-specific knowledge.",
    },
    cards: [
      { color: "pink",   icon: "warning",   title: "Knowledge Cutoff",  body: "Training data has a hard end date"       },
      { color: "pink",   icon: "warning",   title: "Hallucination",     body: "LLMs confidently make things up"         },
      { color: "pink",   icon: "warning",   title: "No Private Data",   body: "Can't access your docs or database"      },
    ],
  },
  {
    id: "rag-3", template: "pipeline", heading: "How Embeddings Work",
    subtitle: "Text → Numbers → Meaning",
    slideNum: 3, totalSlides: 9, handle: H,
    cards: [
      { color: "cyan",   icon: "code",     title: "Raw Text",          body: '"Python is a language"'          },
      { color: "purple", icon: "gear",     title: "Embedding Model",   body: "Convert to 1536-dim vector"     },
      { color: "green",  icon: "database", title: "Vector Space",      body: "Similar meaning = close vectors" },
      { color: "cyan",   icon: "search",   title: "Semantic Search",   body: "Find nearest neighbors"         },
    ],
  },
  {
    id: "rag-4", template: "pipeline", heading: "RAG Architecture",
    subtitle: "The Complete Pipeline",
    slideNum: 4, totalSlides: 9, handle: H,
    cards: [
      { color: "cyan",   icon: "search",   title: "User Query",        body: '"How does X work?"'              },
      { color: "purple", icon: "gear",     title: "Embedding Model",   body: "Convert to vectors"             },
      { color: "green",  icon: "database", title: "Vector Database",   body: "Similarity search"              },
      { color: "pink",   icon: "book",     title: "Retrieved Chunks",  body: "Top-K relevant docs"            },
      { color: "purple", icon: "brain",    title: "LLM + Context",     body: "Augmented prompt"               },
      { color: "green",  icon: "robot",    title: "Final Response",    body: "Grounded answer"                },
    ],
  },
  {
    id: "rag-5", template: "definition-steps", heading: "RAG vs Fine-Tuning",
    slideNum: 5, totalSlides: 9, handle: H,
    definition: {
      color: "purple", title: "Which Should You Use?",
      body: "Use RAG when your data changes frequently. Fine-tune when you need specific reasoning styles or domain behaviour baked in.",
    },
    cards: [
      { color: "cyan",   icon: "search",  title: "RAG",       body: "Fresh data, no retraining needed"   },
      { color: "purple", icon: "gear",    title: "Fine-tune", body: "Baked knowledge, slower to update"  },
      { color: "green",  icon: "check",   title: "Best Combo",body: "Use both for production systems"    },
    ],
  },
  {
    id: "rag-6", template: "definition-steps", heading: "RAG Use Cases",
    slideNum: 6, totalSlides: 9, handle: H,
    definition: {
      color: "purple", title: "Where RAG Shines",
      body: "Any app where an LLM must answer questions from a specific, evolving knowledge base.",
    },
    cards: [
      { color: "cyan",   icon: "book",    title: "Customer Support", body: "Answer from product docs"     },
      { color: "purple", icon: "search",  title: "Legal Research",   body: "Find relevant case law"       },
      { color: "green",  icon: "robot",   title: "Code Assistant",   body: "Search your own codebase"     },
    ],
  },
  {
    id: "rag-7", template: "definition-steps", heading: "Quick Quiz! 🎯",
    slideNum: 7, totalSlides: 9, handle: H,
    definition: {
      color: "amber", title: "What does RAG primarily solve in LLMs?",
      body: "Pick the best answer ↓",
    },
    cards: [
      { color: "cyan",   icon: "opt_a", title: "A)  Slower inference speed",          body: " " },
      { color: "purple", icon: "opt_b", title: "B)  Knowledge cutoff & hallucination", body: " " },
      { color: "green",  icon: "opt_c", title: "C)  Higher training cost",             body: " " },
      { color: "pink",   icon: "opt_d", title: "D)  Limited context window",           body: " " },
    ],
  },
  {
    id: "rag-8", template: "definition-steps", heading: "Answer ✅",
    slideNum: 8, totalSlides: 9, handle: H,
    definition: {
      color: "green", title: "B) Knowledge cutoff & hallucination",
      body: "RAG grounds LLM responses in retrieved real-world data, solving the knowledge cutoff problem and reducing hallucination by 40–60%.",
    },
    cards: [
      { color: "green",  icon: "check",  title: "Retrieves fresh context",      body: "No stale training data"       },
      { color: "cyan",   icon: "check",  title: "Grounds every response",       body: "Answer backed by real docs"   },
      { color: "purple", icon: "check",  title: "No retraining needed",         body: "Just update your vector DB"   },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SERIES 2 — Python Async (6 slides)
// ─────────────────────────────────────────────────────────────────────────────
export const PYTHON_ASYNC_SERIES: QuizSlide[] = [
  {
    id: "async-1", template: "definition-steps", heading: "Python Async I/O",
    slideNum: 1, totalSlides: 7, handle: H,
    definition: {
      color: "cyan", title: "What is Async I/O?",
      body: "Run many tasks concurrently in a single thread — by pausing tasks waiting for I/O and switching to other ready tasks.",
    },
    cards: [
      { color: "cyan",   icon: "clock",     title: "Non-blocking",  body: "Tasks yield control while waiting"  },
      { color: "purple", icon: "lightning", title: "Concurrency",   body: "Many tasks, single thread"          },
      { color: "green",  icon: "check",     title: "Efficient",     body: "No thread overhead or GIL issues"   },
    ],
  },
  {
    id: "async-2", template: "pipeline", heading: "async / await Flow",
    subtitle: "How the event loop works",
    slideNum: 2, totalSlides: 7, handle: H,
    cards: [
      { color: "cyan",   icon: "code",     title: "async def fetch()",       body: "Mark function as coroutine"         },
      { color: "purple", icon: "clock",    title: "await slow_io()",         body: "Suspend — yield to event loop"      },
      { color: "green",  icon: "lightning",title: "Event Loop",              body: "Pick next ready coroutine"          },
      { color: "pink",   icon: "gear",     title: "Resume coroutine",        body: "Continue from suspension point"     },
      { color: "green",  icon: "check",    title: "Return result",           body: "Coroutine completes normally"       },
    ],
  },
  {
    id: "async-3", template: "definition-steps", heading: "async vs Threads",
    slideNum: 3, totalSlides: 7, handle: H,
    definition: {
      color: "purple", title: "Two Concurrency Models",
      body: "asyncio uses cooperative multitasking. Threads use preemptive multitasking. Each has its own sweet spot.",
    },
    cards: [
      { color: "cyan",   icon: "lightning", title: "asyncio",  body: "Best for I/O-bound: API calls, DB, files" },
      { color: "purple", icon: "gear",      title: "Threads",  body: "Best for blocking code you can't control"  },
      { color: "pink",   icon: "warning",   title: "Avoid!",   body: "asyncio + blocking code = event loop hang" },
    ],
  },
  {
    id: "async-4", template: "definition-steps", heading: "Must-Know Patterns",
    slideNum: 4, totalSlides: 7, handle: H,
    definition: {
      color: "purple", title: "Top 3 async Patterns",
      body: "Master these and you'll cover 90% of real-world async Python use cases.",
    },
    cards: [
      { color: "cyan",   icon: "search",   title: "asyncio.gather()",    body: "Run multiple coroutines in parallel"   },
      { color: "purple", icon: "clock",    title: "asyncio.wait_for()",  body: "Add a timeout to any coroutine"        },
      { color: "green",  icon: "database", title: "async with / for",    body: "Async context managers & iterators"    },
    ],
  },
  {
    id: "async-5", template: "definition-steps", heading: "Quick Quiz! 🎯",
    slideNum: 5, totalSlides: 7, handle: H,
    definition: {
      color: "amber", title: "What does 'await' actually do?",
      body: "Pick the best answer ↓",
    },
    cards: [
      { color: "cyan",   icon: "opt_a", title: "A)  Creates a new OS thread",                 body: " " },
      { color: "purple", icon: "opt_b", title: "B)  Suspends coroutine until result is ready", body: " " },
      { color: "green",  icon: "opt_c", title: "C)  Blocks the entire Python process",        body: " " },
      { color: "pink",   icon: "opt_d", title: "D)  Runs code in a subprocess",               body: " " },
    ],
  },
  {
    id: "async-6", template: "definition-steps", heading: "Answer ✅",
    slideNum: 6, totalSlides: 7, handle: H,
    definition: {
      color: "green", title: "B) Suspends the coroutine",
      body: "await pauses the current coroutine and returns control to the event loop — which runs other tasks while waiting for the result.",
    },
    cards: [
      { color: "green",  icon: "check",  title: "Returns control to event loop",  body: "Other tasks can run"          },
      { color: "cyan",   icon: "check",  title: "Zero thread creation overhead",  body: "Lightweight and fast"         },
      { color: "purple", icon: "check",  title: "Resumes when result is ready",   body: "Transparent to the caller"    },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SERIES 3 — Transformers (7 slides)
// ─────────────────────────────────────────────────────────────────────────────
export const TRANSFORMERS_SERIES: QuizSlide[] = [
  {
    id: "tfm-1", template: "definition-steps", heading: "Transformers 101",
    slideNum: 1, totalSlides: 8, handle: H,
    definition: {
      color: "cyan", title: "The Architecture Behind AI",
      body: "Introduced in 'Attention Is All You Need' (2017), transformers replaced RNNs and became the foundation of every major LLM.",
    },
    cards: [
      { color: "cyan",   icon: "search",  title: "Attention",  body: "Relate every token to every other"   },
      { color: "purple", icon: "gear",    title: "Encoder",    body: "Understand and represent input"      },
      { color: "green",  icon: "robot",   title: "Decoder",    body: "Generate output tokens one by one"   },
    ],
  },
  {
    id: "tfm-2", template: "pipeline", heading: "Attention Mechanism",
    subtitle: "Query · Key · Value",
    slideNum: 2, totalSlides: 8, handle: H,
    cards: [
      { color: "cyan",   icon: "search",   title: "Query (Q)",       body: "What am I looking for?"             },
      { color: "purple", icon: "gear",     title: "Key (K)",         body: "What information do I contain?"     },
      { color: "green",  icon: "database", title: "Value (V)",       body: "What to return when matched"        },
      { color: "pink",   icon: "code",     title: "Score = Q·Kᵀ/√d", body: "Softmax → attention weights"        },
      { color: "green",  icon: "robot",    title: "Output",          body: "Weighted sum of Values"             },
    ],
  },
  {
    id: "tfm-3", template: "definition-steps", heading: "Attention vs RNN",
    slideNum: 3, totalSlides: 8, handle: H,
    definition: {
      color: "cyan", title: "The Key Advantage",
      body: "RNNs process tokens sequentially — one at a time. Attention processes all tokens in parallel, making training 10-100x faster.",
    },
    cards: [
      { color: "pink",   icon: "warning",  title: "RNN",      body: "Sequential — forgets long-range context"   },
      { color: "green",  icon: "check",    title: "Attention",body: "Parallel — captures global context"        },
      { color: "green",  icon: "lightning",title: "Speed",    body: "10-100x faster to train on GPUs"           },
    ],
  },
  {
    id: "tfm-4", template: "definition-steps", heading: "BERT vs GPT",
    slideNum: 4, totalSlides: 8, handle: H,
    definition: {
      color: "purple", title: "Encoder vs Decoder",
      body: "Both are transformer-based but built for different purposes — BERT understands context bidirectionally, GPT generates left-to-right.",
    },
    cards: [
      { color: "cyan",   icon: "search",  title: "BERT",    body: "Bidirectional — great for classification"  },
      { color: "purple", icon: "robot",   title: "GPT",     body: "Autoregressive — great for generation"     },
      { color: "green",  icon: "check",   title: "Rule",    body: "BERT: embeddings. GPT: chat & code"        },
    ],
  },
  {
    id: "tfm-5", template: "pipeline", heading: "Fine-Tuning Flow",
    subtitle: "Adapt a base model to your task",
    slideNum: 5, totalSlides: 8, handle: H,
    cards: [
      { color: "cyan",   icon: "robot",    title: "Base LLM",         body: "Pretrained on trillions of tokens"  },
      { color: "purple", icon: "database", title: "Your Dataset",     body: "Task-specific labeled examples"     },
      { color: "green",  icon: "gear",     title: "Training",         body: "Update weights on your data"        },
      { color: "pink",   icon: "lightning",title: "LoRA / QLoRA",     body: "Efficient fine-tuning — saves VRAM" },
      { color: "green",  icon: "check",    title: "Fine-tuned Model", body: "Specialized for your exact task"    },
    ],
  },
  {
    id: "tfm-6", template: "definition-steps", heading: "Quick Quiz! 🎯",
    slideNum: 6, totalSlides: 8, handle: H,
    definition: {
      color: "amber", title: "In attention formula Q·Kᵀ/√d — what is 'd'?",
      body: "Pick the best answer ↓",
    },
    cards: [
      { color: "cyan",   icon: "opt_a", title: "A)  Dataset size",                    body: " " },
      { color: "purple", icon: "opt_b", title: "B)  Dimension of the key vectors",    body: " " },
      { color: "green",  icon: "opt_c", title: "C)  Number of attention heads",       body: " " },
      { color: "pink",   icon: "opt_d", title: "D)  Dropout rate",                   body: " " },
    ],
  },
  {
    id: "tfm-7", template: "definition-steps", heading: "Answer ✅",
    slideNum: 7, totalSlides: 8, handle: H,
    definition: {
      color: "green", title: "B) Dimension of the key vectors",
      body: "√d scales the dot products — without it, large dimensions cause tiny gradients after softmax, making training unstable.",
    },
    cards: [
      { color: "green",  icon: "check",  title: "Prevents vanishing gradients",  body: "Training stays stable"      },
      { color: "cyan",   icon: "check",  title: "Normalises softmax inputs",     body: "No extreme attention scores" },
      { color: "purple", icon: "check",  title: "Used in all transformer models", body: "BERT, GPT, T5, Claude…"    },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SERIES 4 — Docker (6 slides)
// ─────────────────────────────────────────────────────────────────────────────
export const DOCKER_SERIES: QuizSlide[] = [
  {
    id: "dk-1", template: "definition-steps", heading: "Docker in 60s",
    slideNum: 1, totalSlides: 7, handle: H,
    definition: {
      color: "cyan", title: "What is Docker?",
      body: "A platform that packages your application and all its dependencies into a portable container — runs identically on any machine.",
    },
    cards: [
      { color: "cyan",   icon: "book",     title: "Image",       body: "Blueprint: OS + app + dependencies"   },
      { color: "purple", icon: "layers",   title: "Container",   body: "Running instance of an image"         },
      { color: "green",  icon: "check",    title: "Portability", body: "Build once, run anywhere"             },
    ],
  },
  {
    id: "dk-2", template: "definition-steps", heading: "Container vs VM",
    slideNum: 2, totalSlides: 7, handle: H,
    definition: {
      color: "purple", title: "What's the Difference?",
      body: "VMs virtualise the hardware. Containers virtualise the OS. Containers share the host kernel — they're lighter and start in seconds.",
    },
    cards: [
      { color: "pink",   icon: "warning",   title: "VM",         body: "Full OS per instance — GB, minutes to start" },
      { color: "green",  icon: "check",     title: "Container",  body: "Shared kernel — MB, seconds to start"        },
      { color: "green",  icon: "lightning", title: "Docker",     body: "10-100x lighter than a virtual machine"      },
    ],
  },
  {
    id: "dk-3", template: "pipeline", heading: "Docker Workflow",
    subtitle: "From code to running app",
    slideNum: 3, totalSlides: 7, handle: H,
    cards: [
      { color: "cyan",   icon: "code",     title: "Dockerfile",    body: "Define your app environment"       },
      { color: "purple", icon: "gear",     title: "docker build",  body: "Create a Docker image"             },
      { color: "green",  icon: "database", title: "Docker Hub",    body: "Push / pull images to registry"    },
      { color: "pink",   icon: "search",   title: "docker run",    body: "Start a container from image"      },
      { color: "green",  icon: "check",    title: "Running App",   body: "Isolated, consistent, portable"    },
    ],
  },
  {
    id: "dk-4", template: "definition-steps", heading: "Docker Cheat Sheet",
    slideNum: 4, totalSlides: 7, handle: H,
    definition: {
      color: "cyan", title: "5 Commands to Know",
      body: "Master these and you can work with Docker in any project, from local dev to production.",
    },
    cards: [
      { color: "cyan",   icon: "gear",    title: "docker build -t myapp .",      body: "Build image from Dockerfile"   },
      { color: "purple", icon: "lightning",title: "docker run -p 8080:80 myapp", body: "Run with port mapping"         },
      { color: "green",  icon: "search",  title: "docker ps / docker logs",      body: "Inspect running containers"    },
    ],
  },
  {
    id: "dk-5", template: "definition-steps", heading: "Quick Quiz! 🎯",
    slideNum: 5, totalSlides: 7, handle: H,
    definition: {
      color: "amber", title: "What is a Docker Image?",
      body: "Pick the best answer ↓",
    },
    cards: [
      { color: "cyan",   icon: "opt_a", title: "A)  A running container instance",          body: " " },
      { color: "purple", icon: "opt_b", title: "B)  A read-only blueprint for containers",  body: " " },
      { color: "green",  icon: "opt_c", title: "C)  A virtual machine snapshot",            body: " " },
      { color: "pink",   icon: "opt_d", title: "D)  A Kubernetes pod definition",           body: " " },
    ],
  },
  {
    id: "dk-6", template: "definition-steps", heading: "Answer ✅",
    slideNum: 6, totalSlides: 7, handle: H,
    definition: {
      color: "green", title: "B) A read-only blueprint for containers",
      body: "Images are layered read-only templates. When you run one, Docker adds a thin writable layer on top — that's your container.",
    },
    cards: [
      { color: "green",  icon: "check",  title: "Images are immutable",        body: "Can't change a built image"   },
      { color: "cyan",   icon: "check",  title: "Containers are instances",    body: "Running image + writable layer"},
      { color: "purple", icon: "check",  title: "Layers make storage fast",    body: "Shared base layers = less disk"},
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CTA slide factory — appended to every series
// ─────────────────────────────────────────────────────────────────────────────
function ctaSlide(id: string, slideNum: number, total: number): QuizSlide {
  return {
    id: `${id}-cta`, template: "cta",
    heading: "Enjoyed This Quiz?", slideNum, totalSlides: total, handle: H,
    cards: [],
  };
}

export const ALL_SERIES = [
  { id: "rag",   label: "RAG",          slides: [...RAG_SERIES,          ctaSlide("rag",   9, 9)] },
  { id: "async", label: "Python Async", slides: [...PYTHON_ASYNC_SERIES,  ctaSlide("async", 7, 7)] },
  { id: "tfm",   label: "Transformers", slides: [...TRANSFORMERS_SERIES,  ctaSlide("tfm",   8, 8)] },
  { id: "docker",label: "Docker",       slides: [...DOCKER_SERIES,        ctaSlide("dk",    7, 7)] },
];
