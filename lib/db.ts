import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "quizbytes.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS series (
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
    );

    CREATE TABLE IF NOT EXISTS slides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      series_id INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      template TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

// ── Series ──────────────────────────────────────────────────────────────────

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

export function listSeries(): SeriesRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT s.*, COUNT(sl.id) as slide_count
       FROM series s
       LEFT JOIN slides sl ON sl.series_id = s.id
       GROUP BY s.id
       ORDER BY s.created_at DESC`
    )
    .all() as SeriesRow[];
}

export function getSeriesById(id: number): SeriesRow | null {
  const db = getDb();
  return (
    (db.prepare("SELECT * FROM series WHERE id = ?").get(id) as SeriesRow) ??
    null
  );
}

export function getSeriesBySlug(slug: string): SeriesRow | null {
  const db = getDb();
  return (
    (db
      .prepare("SELECT * FROM series WHERE slug = ?")
      .get(slug) as SeriesRow) ?? null
  );
}

export function createSeries(data: {
  slug: string;
  title: string;
  topic: string;
  category: string;
  difficulty: string;
}): SeriesRow {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO series (slug, title, topic, category, difficulty)
       VALUES (@slug, @title, @topic, @category, @difficulty)`
    )
    .run(data);
  return getSeriesById(info.lastInsertRowid as number)!;
}

export function updateSeriesYouTube(
  id: number,
  youtubeId: string,
  youtubeUrl: string
) {
  const db = getDb();
  db.prepare(
    `UPDATE series SET youtube_id = ?, youtube_url = ?, status = 'published',
     updated_at = datetime('now') WHERE id = ?`
  ).run(youtubeId, youtubeUrl, id);
}

export function deleteSeries(id: number) {
  const db = getDb();
  db.prepare("DELETE FROM series WHERE id = ?").run(id);
}

// ── Slides ───────────────────────────────────────────────────────────────────

export interface SlideRow {
  id: number;
  series_id: number;
  position: number;
  template: string;
  data: string; // JSON string
}

export function getSlides(seriesId: number): SlideRow[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM slides WHERE series_id = ? ORDER BY position ASC"
    )
    .all(seriesId) as SlideRow[];
}

export function insertSlides(
  seriesId: number,
  slides: Array<{ template: string; data: object }>
) {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO slides (series_id, position, template, data) VALUES (?, ?, ?, ?)`
  );
  const insertMany = db.transaction(
    (items: Array<{ template: string; data: object }>) => {
      db.prepare("DELETE FROM slides WHERE series_id = ?").run(seriesId);
      items.forEach((s, i) => {
        stmt.run(seriesId, i, s.template, JSON.stringify(s.data));
      });
    }
  );
  insertMany(slides);
}
