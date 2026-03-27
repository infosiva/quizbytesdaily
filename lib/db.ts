import { createClient, type Client, type Row, type InValue } from "@libsql/client";

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
  ], "write");
  _schemaInit = true;
}

// ── Row → typed object helpers ────────────────────────────────────────────────

function rowToSeries(r: Row): SeriesRow {
  return {
    id:          Number(r.id),
    slug:        String(r.slug ?? ""),
    title:       String(r.title ?? ""),
    topic:       String(r.topic ?? ""),
    category:    String(r.category ?? ""),
    difficulty:  String(r.difficulty ?? ""),
    status:      String(r.status ?? "draft"),
    youtube_id:  r.youtube_id != null ? String(r.youtube_id) : null,
    youtube_url: r.youtube_url != null ? String(r.youtube_url) : null,
    created_at:  String(r.created_at ?? ""),
    updated_at:  String(r.updated_at ?? ""),
    slide_count: r.slide_count != null ? Number(r.slide_count) : undefined,
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
  const rs = await c.execute({ sql: "SELECT * FROM series WHERE slug = ?", args: [slug] });
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
