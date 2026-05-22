use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ClipType {
    Text,
    Code,
    Image,
}

impl ClipType {
    pub fn as_str(&self) -> &'static str {
        match self {
            ClipType::Text => "TEXT",
            ClipType::Code => "CODE",
            ClipType::Image => "IMAGE",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Clip {
    pub id: i64,
    pub content: String,
    #[serde(rename = "clipType")]
    pub clip_type: String,
    pub timestamp: i64,
    pub pinned: bool,
    pub thumbnail: Option<String>,
}

#[derive(Debug, Clone)]
pub struct NewClip {
    pub content: String,
    pub clip_type: ClipType,
    pub thumbnail: Option<String>,
}

pub struct Database {
    conn: Connection,
    pub max_entries: usize,
}

impl Database {
    pub fn new(path: PathBuf) -> SqlResult<Self> {
        let conn = Connection::open(path)?;
        conn.execute(
            "CREATE TABLE IF NOT EXISTS clips (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                clip_type TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                pinned INTEGER NOT NULL DEFAULT 0,
                thumbnail TEXT
            )",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_clips_timestamp ON clips(timestamp DESC)",
            [],
        )?;
        Ok(Self {
            conn,
            max_entries: 200,
        })
    }

    pub fn set_max_entries(&mut self, max: usize) {
        self.max_entries = max;
    }

    pub fn last_content(&self) -> SqlResult<Option<String>> {
        let mut stmt = self
            .conn
            .prepare("SELECT content FROM clips ORDER BY timestamp DESC LIMIT 1")?;
        let mut rows = stmt.query([])?;
        if let Some(row) = rows.next()? {
            Ok(Some(row.get(0)?))
        } else {
            Ok(None)
        }
    }

    pub fn insert_clip(&self, clip: &NewClip) -> SqlResult<Clip> {
        let now = now_millis();
        self.conn.execute(
            "INSERT INTO clips (content, clip_type, timestamp, pinned, thumbnail)
             VALUES (?1, ?2, ?3, 0, ?4)",
            params![
                clip.content,
                clip.clip_type.as_str(),
                now,
                clip.thumbnail
            ],
        )?;
        let id = self.conn.last_insert_rowid();
        self.enforce_limit()?;
        Ok(Clip {
            id,
            content: clip.content.clone(),
            clip_type: clip.clip_type.as_str().to_string(),
            timestamp: now,
            pinned: false,
            thumbnail: clip.thumbnail.clone(),
        })
    }

    fn enforce_limit(&self) -> SqlResult<()> {
        let count: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM clips WHERE pinned = 0",
            [],
            |r| r.get(0),
        )?;
        if count > self.max_entries as i64 {
            let excess = count - self.max_entries as i64;
            self.conn.execute(
                "DELETE FROM clips WHERE id IN (
                    SELECT id FROM clips WHERE pinned = 0
                    ORDER BY timestamp ASC LIMIT ?1
                )",
                params![excess],
            )?;
        }
        Ok(())
    }

    pub fn get_clips(&self, limit: u32, clip_type: Option<String>) -> SqlResult<Vec<Clip>> {
        let map_row = |row: &rusqlite::Row| -> SqlResult<Clip> {
            Ok(Clip {
                id: row.get(0)?,
                content: row.get(1)?,
                clip_type: row.get(2)?,
                timestamp: row.get(3)?,
                pinned: row.get::<_, i64>(4)? != 0,
                thumbnail: row.get(5)?,
            })
        };

        if let Some(t) = clip_type {
            let mut stmt = self.conn.prepare(
                "SELECT id, content, clip_type, timestamp, pinned, thumbnail FROM clips
                 WHERE clip_type = ?1
                 ORDER BY pinned DESC, timestamp DESC LIMIT ?2",
            )?;
            let rows: SqlResult<Vec<Clip>> =
                stmt.query_map(params![t, limit], map_row)?.collect();
            rows
        } else {
            let mut stmt = self.conn.prepare(
                "SELECT id, content, clip_type, timestamp, pinned, thumbnail FROM clips
                 ORDER BY pinned DESC, timestamp DESC LIMIT ?1",
            )?;
            let rows: SqlResult<Vec<Clip>> =
                stmt.query_map(params![limit], map_row)?.collect();
            rows
        }
    }

    pub fn search(&self, query: &str) -> SqlResult<Vec<Clip>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, content, clip_type, timestamp, pinned, thumbnail FROM clips
             WHERE content LIKE ?1
             ORDER BY pinned DESC, timestamp DESC LIMIT 200",
        )?;
        let q = format!("%{}%", query);
        let rows: SqlResult<Vec<Clip>> = stmt
            .query_map(params![q], |row| {
                Ok(Clip {
                    id: row.get(0)?,
                    content: row.get(1)?,
                    clip_type: row.get(2)?,
                    timestamp: row.get(3)?,
                    pinned: row.get::<_, i64>(4)? != 0,
                    thumbnail: row.get(5)?,
                })
            })?
            .collect();
        rows
    }

    pub fn pin(&self, id: i64, pinned: bool) -> SqlResult<()> {
        self.conn.execute(
            "UPDATE clips SET pinned = ?1 WHERE id = ?2",
            params![pinned as i64, id],
        )?;
        Ok(())
    }

    pub fn delete(&self, id: i64) -> SqlResult<()> {
        self.conn
            .execute("DELETE FROM clips WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn clear_all(&self) -> SqlResult<()> {
        self.conn.execute("DELETE FROM clips", [])?;
        Ok(())
    }
}

fn now_millis() -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}
