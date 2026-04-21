import { createClient, type Client, type Row, type InValue } from "@libsql/client";

// ── Site Settings ──────────────────────────────────────────────────────────────
export interface SiteSettings {
  gridColumns:  2 | 3 | 4;
  defaultView:  "grid" | "table";
  pageSize:     8 | 12 | 16 | 24 | 32;
  sortDefault:  "newest" | "oldest" | "az" | "za" | "category";
  showStats:    boolean;
  accentColor:  string;  // hex, e.g. "#22d3ee"
}

// ── Client singleton ──────────────────────────────────────────────────────────

let _client: Client | null = null;

function getClient(): Client {
  if (_client) return _client;
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set");
  _client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return _client;
}

// ── Schema init (called once at startup) ─────────────────────────────────────

let _schemaInit = false;

async function ensureSchema() {
  if (_schemaInit) return;
  const c = getClient();
  await c.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS site_settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS page_views (
        date  TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS series (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        topic TEXT NOT NULL,
        category TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        youtube_id TEXT,
        youtube_url TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS slides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        series_id INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        template TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS quiz_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_id TEXT NOT NULL,
        correct INTEGER NOT NULL DEFAULT 0,
        cat TEXT NOT NULL DEFAULT '',
        diff TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      args: [],
    },
  ], "write");

  // Add scheduled_at column (migration — safe to fail if already exists)
  try {
    await c.execute("ALTER TABLE series ADD COLUMN scheduled_at TEXT");
  } catch { /* column already exists — ignore */ }

  _schemaInit = true;
}

// ── Row → typed object helpers ────────────────────────────────────────────────

function rowToSeries(r: Row): SeriesRow {
  return {
    id:           Number(r.id),
    slug:         String(r.slug ?? ""),
    title:        String(r.title ?? ""),
    topic:        String(r.topic ?? ""),
    category:     String(r.category ?? ""),
    difficulty:   String(r.difficulty ?? ""),
    status:       String(r.status ?? "draft"),
    youtube_id:   r.youtube_id  != null ? String(r.youtube_id)  : null,
    youtube_url:  r.youtube_url != null ? String(r.youtube_url) : null,
    scheduled_at: r.scheduled_at != null ? String(r.scheduled_at) : null,
    created_at:   String(r.created_at ?? ""),
    updated_at:   String(r.updated_at ?? ""),
    slide_count:  r.slide_count != null ? Number(r.slide_count) : undefined,
  };
}

function rowToSlide(r: Row): SlideRow {
  return {
    id:        Number(r.id),
    series_id: Number(r.series_id),
    position:  Number(r.position),
    template:  String(r.template ?? ""),
    data:      String(r.data ?? ""),
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SeriesRow {
  id: number;
  slug: string;
  title: string;
  topic: string;
  category: string;
  difficulty: string;
  status: string;
  youtube_id: string | null;
  youtube_url: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  slide_count?: number;
}

export interface SlideRow {
  id: number;
  series_id: number;
  position: number;
  template: string;
  data: string; // JSON string
}

// ── Series ────────────────────────────────────────────────────────────────────

export async function listSeries(): Promise<SeriesRow[]> {
  await ensureSchema();
  const c = getClient();
  const rs = await c.execute(
    `SELECT s.*, COUNT(sl.id) as slide_count
     FROM series s
     LEFT JOIN slides sl ON sl.series_id = s.id
     GROUP BY s.id
     ORDER BY s.created_at DESC`
  );
  return rs.rows.map(rowToSeries);
}

export async function getSeriesById(id: number): Promise<SeriesRow | null> {
  await ensureSchema();
  const c = getClient();
  const rs = await c.execute({ sql: "SELECT * FROM series WHERE id = ?", args: [id] });
  return rs.rows[0] ? rowToSeries(rs.rows[0]) : null;
}

export async function getSeriesBySlug(slug: string): Promise<SeriesRow | null> {
  await ensureSchema();
  const c = getClient();
  const rs = await c.execute({
    sql: `SELECT s.*, (SELECT COUNT(*) FROM slides WHERE series_id = s.id) AS slide_count
          FROM series s WHERE s.slug = ?`,
    args: [slug],
  });
  return rs.rows[0] ? rowToSeries(rs.rows[0]) : null;
}

export async function createSeries(data: {
  slug: string;
  title: string;
  topic: string;
  category: string;
  difficulty: string;
}): Promise<SeriesRow> {
  await ensureSchema();
  const c = getClient();
  const rs = await c.execute({
    sql: `INSERT INTO series (slug, title, topic, category, difficulty)
          VALUES (?, ?, ?, ?, ?)`,
    args: [data.slug, data.title, data.topic, data.category, data.difficulty],
  });
  return (await getSeriesById(Number(rs.lastInsertRowid)))!;
}

export async function updateSeriesYouTube(
  id: number,
  youtubeId: string,
  youtubeUrl: string,
): Promise<void> {
  await ensureSchema();
  const c = getClient();
  await c.execute({
    sql: `UPDATE series SET youtube_id = ?, youtube_url = ?, status = 'published',
          updated_at = datetime('now') WHERE id = ?`,
    args: [youtubeId, youtubeUrl, id],
  });
}

export async function deleteSeries(id: number): Promise<void> {
  await ensureSchema();
  const c = getClient();
  await c.execute({ sql: "DELETE FROM series WHERE id = ?", args: [id] });
}

// ── Slides ────────────────────────────────────────────────────────────────────

export async function getSlides(seriesId: number): Promise<SlideRow[]> {
  await ensureSchema();
  const c = getClient();
  const rs = await c.execute({
    sql: "SELECT * FROM slides WHERE series_id = ? ORDER BY position ASC",
    args: [seriesId],
  });
  return rs.rows.map(rowToSlide);
}

export async function insertSlides(
  seriesId: number,
  slides: Array<{ template: string; data: object }>,
): Promise<void> {
  await ensureSchema();
  const c = getClient();
  const stmts = [
    { sql: "DELETE FROM slides WHERE series_id = ?", args: [seriesId] as InValue[] },
    ...slides.map((s, i) => ({
      sql: "INSERT INTO slides (series_id, position, template, data) VALUES (?, ?, ?, ?)",
      args: [seriesId, i, s.template, JSON.stringify(s.data)] as InValue[],
    })),
  ];
  await c.batch(stmts, "write");
}

// ── Scheduling / Automation ────────────────────────────────────────────────────

/** Set the scheduled_at datetime for a series (status stays 'draft') */
export async function scheduleSeriesForDate(id: number, scheduledAt: string): Promise<void> {
  await ensureSchema();
  const c = getClient();
  await c.execute({
    sql: "UPDATE series SET scheduled_at = ?, updated_at = datetime('now') WHERE id = ?",
    args: [scheduledAt, id],
  });
}

/** Mark series as 'queued' (approved for upload) — called after Telegram approval */
export async function approveSeriesForUpload(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await ensureSchema();
  const c = getClient();
  const placeholders = ids.map(() => "?").join(", ");
  await c.execute({
    sql: `UPDATE series SET status = 'queued', updated_at = datetime('now') WHERE id IN (${placeholders})`,
    args: ids as InValue[],
  });
}

/** Set an arbitrary status on a series */
export async function setSeriesStatus(id: number, status: string): Promise<void> {
  await ensureSchema();
  const c = getClient();
  await c.execute({
    sql: "UPDATE series SET status = ?, updated_at = datetime('now') WHERE id = ?",
    args: [status, id],
  });
}

/**
 * Reset series stuck in 'publishing' status back to 'queued'.
 * This happens when a Vercel function hard-times-out mid-upload — the catch
 * block never runs so the series is never reverted automatically.
 * Call this at the top of each upload-scheduled cron run.
 */
export async function resetStuckPublishing(olderThanMinutes = 20): Promise<number> {
  await ensureSchema();
  const c = getClient();
  const rs = await c.execute({
    sql: `UPDATE series
          SET status = 'queued', updated_at = datetime('now')
          WHERE status = 'publishing'
            AND updated_at <= datetime('now', '-${olderThanMinutes} minutes')`,
    args: [],
  });
  return rs.rowsAffected ?? 0;
}

/** Get series that are queued and due for upload (scheduled_at <= now) */
export async function getQueuedForUpload(): Promise<SeriesRow[]> {
  await ensureSchema();
  const c = getClient();
  const rs = await c.execute(
    `SELECT s.*, COUNT(sl.id) as slide_count
     FROM series s
     LEFT JOIN slides sl ON sl.series_id = s.id
     WHERE s.status = 'queued'
       AND (s.scheduled_at IS NULL OR s.scheduled_at <= datetime('now'))
     GROUP BY s.id
     ORDER BY s.scheduled_at ASC`
  );
  return rs.rows.map(rowToSeries);
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface DailyActivity  { date: string; count: number }
export interface CategoryStat   { category: string; total: number; published: number }
export interface DifficultyStat { difficulty: string; count: number }
export interface StatusStat     { status: string; count: number }

export interface AnalyticsData {
  dailyActivity:       DailyActivity[];
  categoryBreakdown:   CategoryStat[];
  difficultyBreakdown: DifficultyStat[];
  statusSummary:       StatusStat[];
  totalSlides:         number;
}

export async function getAnalytics(): Promise<AnalyticsData> {
  await ensureSchema();
  const c = getClient();

  const [daily, cats, diffs, statuses, slidesCount] = await Promise.all([
    c.execute(`
      SELECT date(created_at) AS date, COUNT(*) AS count
      FROM series
      WHERE created_at >= date('now', '-30 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `),
    c.execute(`
      SELECT category,
             COUNT(*) AS total,
             SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published
      FROM series
      GROUP BY category
      ORDER BY total DESC
    `),
    c.execute(`
      SELECT difficulty, COUNT(*) AS count
      FROM series
      GROUP BY difficulty
      ORDER BY count DESC
    `),
    c.execute(`
      SELECT status, COUNT(*) AS count
      FROM series
      GROUP BY status
      ORDER BY count DESC
    `),
    c.execute("SELECT COUNT(*) AS total FROM slides"),
  ]);

  return {
    dailyActivity: daily.rows.map((r) => ({
      date:  String(r.date ?? ""),
      count: Number(r.count ?? 0),
    })),
    categoryBreakdown: cats.rows.map((r) => ({
      category:  String(r.category ?? ""),
      total:     Number(r.total ?? 0),
      published: Number(r.published ?? 0),
    })),
    difficultyBreakdown: diffs.rows.map((r) => ({
      difficulty: String(r.difficulty ?? ""),
      count:      Number(r.count ?? 0),
    })),
    statusSummary: statuses.rows.map((r) => ({
      status: String(r.status ?? ""),
      count:  Number(r.count ?? 0),
    })),
    totalSlides: Number(slidesCount.rows[0]?.total ?? 0),
  };
}

// ── Page View Tracking ────────────────────────────────────────────────────────

export async function trackPageView(): Promise<void> {
  await ensureSchema();
  const c    = getClient();
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  await c.execute({
    sql:  "INSERT INTO page_views (date, count) VALUES (?, 1) ON CONFLICT(date) DO UPDATE SET count = count + 1",
    args: [date],
  });
}

export async function getPageViewStats(): Promise<{ today: number; week: number; total: number; daily: { date: string; count: number }[] }> {
  await ensureSchema();
  const c = getClient();
  const [totals, daily] = await Promise.all([
    c.execute(`
      SELECT
        SUM(count) AS total,
        SUM(CASE WHEN date = date('now') THEN count ELSE 0 END) AS today,
        SUM(CASE WHEN date >= date('now', '-6 days') THEN count ELSE 0 END) AS week
      FROM page_views
    `),
    c.execute(`
      SELECT date, count FROM page_views
      WHERE date >= date('now', '-29 days')
      ORDER BY date ASC
    `),
  ]);
  return {
    today: Number(totals.rows[0]?.today ?? 0),
    week:  Number(totals.rows[0]?.week  ?? 0),
    total: Number(totals.rows[0]?.total ?? 0),
    daily: daily.rows.map((r) => ({ date: String(r.date), count: Number(r.count) })),
  };
}

// ── Bot State (for Telegram stateful flows) ───────────────────────────────────

/** Get the current bot conversation state (e.g. "awaiting_topic") */
export async function getBotState(): Promise<string> {
  await ensureSchema();
  const c = getClient();
  const rs = await c.execute("SELECT value FROM site_settings WHERE key = 'bot_state'");
  return rs.rows[0] ? String(rs.rows[0].value) : "";
}

/** Set the bot conversation state */
export async function setBotState(state: string): Promise<void> {
  await ensureSchema();
  const c = getClient();
  await c.execute({
    sql:  "INSERT OR REPLACE INTO site_settings (key, value) VALUES ('bot_state', ?)",
    args: [state],
  });
}

// ── Quiz Question Extraction ──────────────────────────────────────────────────

export interface SeriesSlideRow {
  series_id: number;
  category:  string;
  difficulty: string;
  topic:     string;
  slug:      string;
  template:  string;
  data:      string; // JSON string
  position:  number;
}

/** Fetch all slides for series matching optional category/difficulty filters */
export async function getSeriesSlides(category?: string, difficulty?: string): Promise<SeriesSlideRow[]> {
  await ensureSchema();
  const c = getClient();
  const conds: string[] = [];
  const args: InValue[] = [];
  if (category)   { conds.push("s.category = ?");   args.push(category); }
  if (difficulty) { conds.push("s.difficulty = ?"); args.push(difficulty); }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const rs = await c.execute({
    sql: `SELECT s.id AS series_id, s.category, s.difficulty, s.topic, s.slug,
                 sl.template, sl.data, sl.position
          FROM series s
          JOIN slides sl ON sl.series_id = s.id
          ${where}
          ORDER BY s.id, sl.position`,
    args,
  });
  return rs.rows.map((r) => ({
    series_id:  Number(r.series_id),
    category:   String(r.category   ?? ""),
    difficulty: String(r.difficulty ?? ""),
    topic:      String(r.topic      ?? ""),
    slug:       String(r.slug       ?? ""),
    template:   String(r.template   ?? ""),
    data:       String(r.data       ?? "{}"),
    position:   Number(r.position),
  }));
}

// ── Quiz Stats ────────────────────────────────────────────────────────────────

export interface QuizStatRow {
  question_id: string;
  correct:     boolean;
  cat:         string;
  diff:        string;
}

export async function saveQuizStat(stat: QuizStatRow): Promise<void> {
  await ensureSchema();
  const c = getClient();
  await c.execute({
    sql:  "INSERT INTO quiz_stats (question_id, correct, cat, diff) VALUES (?, ?, ?, ?)",
    args: [stat.question_id, stat.correct ? 1 : 0, stat.cat, stat.diff],
  });
}

export interface QuizStatsSummary {
  totalAttempts: number;
  correctAttempts: number;
  accuracyPct: number;
  byCategory: { cat: string; attempts: number; correct: number; pct: number }[];
  byDifficulty: { diff: string; attempts: number; correct: number; pct: number }[];
  recent: { date: string; attempts: number }[];
}

export async function getQuizStatsSummary(): Promise<QuizStatsSummary> {
  await ensureSchema();
  const c = getClient();
  const [totals, byCat, byDiff, recentRows] = await Promise.all([
    c.execute(`
      SELECT COUNT(*) AS total, SUM(correct) AS correct FROM quiz_stats
    `),
    c.execute(`
      SELECT cat, COUNT(*) AS attempts, SUM(correct) AS correct
      FROM quiz_stats GROUP BY cat ORDER BY attempts DESC
    `),
    c.execute(`
      SELECT diff, COUNT(*) AS attempts, SUM(correct) AS correct
      FROM quiz_stats GROUP BY diff ORDER BY attempts DESC
    `),
    c.execute(`
      SELECT date(created_at) AS date, COUNT(*) AS attempts
      FROM quiz_stats
      WHERE created_at >= date('now', '-29 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `),
  ]);
  const total   = Number(totals.rows[0]?.total   ?? 0);
  const correct = Number(totals.rows[0]?.correct ?? 0);
  return {
    totalAttempts:   total,
    correctAttempts: correct,
    accuracyPct:     total > 0 ? Math.round((correct / total) * 100) : 0,
    byCategory: byCat.rows.map((r) => {
      const a = Number(r.attempts ?? 0); const c2 = Number(r.correct ?? 0);
      return { cat: String(r.cat ?? ""), attempts: a, correct: c2, pct: a > 0 ? Math.round((c2/a)*100) : 0 };
    }),
    byDifficulty: byDiff.rows.map((r) => {
      const a = Number(r.attempts ?? 0); const c2 = Number(r.correct ?? 0);
      return { diff: String(r.diff ?? ""), attempts: a, correct: c2, pct: a > 0 ? Math.round((c2/a)*100) : 0 };
    }),
    recent: recentRows.rows.map((r) => ({ date: String(r.date ?? ""), attempts: Number(r.attempts ?? 0) })),
  };
}

// ── Site Settings CRUD ────────────────────────────────────────────────────────

const SETTING_DEFAULTS: Record<string, string> = {
  grid_columns:  "3",
  default_view:  "table",
  page_size:     "20",
  sort_default:  "newest",
  show_stats:    "1",
  accent_color:  "#22d3ee",
};

export async function getSiteSettings(): Promise<SiteSettings> {
  await ensureSchema();
  const c  = getClient();
  const rs = await c.execute("SELECT key, value FROM site_settings");
  const m: Record<string, string> = {};
  for (const r of rs.rows) m[String(r.key)] = String(r.value);
  const g = (k: string) => m[k] ?? SETTING_DEFAULTS[k] ?? "";
  return {
    gridColumns:  (Number(g("grid_columns")) as 2 | 3 | 4)                    || 3,
    defaultView:  (g("default_view") as "grid" | "table")                     || "table",
    pageSize:     (Number(g("page_size")) as 8 | 12 | 16 | 24 | 32)           || 20,
    sortDefault:  (g("sort_default") as SiteSettings["sortDefault"])           || "newest",
    showStats:    g("show_stats") !== "0",
    accentColor:  g("accent_color") || "#22d3ee",
  };
}

export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
  await ensureSchema();
  const c       = getClient();
  const entries: [string, string][] = [];
  if (settings.gridColumns !== undefined) entries.push(["grid_columns",  String(settings.gridColumns)]);
  if (settings.defaultView !== undefined) entries.push(["default_view",  settings.defaultView]);
  if (settings.pageSize    !== undefined) entries.push(["page_size",     String(settings.pageSize)]);
  if (settings.sortDefault !== undefined) entries.push(["sort_default",  settings.sortDefault]);
  if (settings.showStats   !== undefined) entries.push(["show_stats",    settings.showStats ? "1" : "0"]);
  if (settings.accentColor !== undefined) entries.push(["accent_color",  settings.accentColor]);
  if (entries.length === 0) return;
  await c.batch(
    entries.map(([key, value]) => ({
      sql:  "INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)",
      args: [key, value] as InValue[],
    })),
    "write",
  );
}
