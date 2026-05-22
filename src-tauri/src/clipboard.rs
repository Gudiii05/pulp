use arboard::Clipboard;
use base64::{engine::general_purpose, Engine as _};
use image::{ImageBuffer, Rgba};
use std::io::Cursor;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

use crate::db::{ClipType, Database, NewClip};

#[derive(Default)]
pub struct WatcherState {
    pub last_text: Option<String>,
    pub last_image_hash: Option<u64>,
}

pub type WatcherHandle = Arc<Mutex<WatcherState>>;

pub fn start_clipboard_watcher(app: AppHandle, state: WatcherHandle) {
    thread::spawn(move || {
        let mut clipboard = match Clipboard::new() {
            Ok(c) => c,
            Err(e) => {
                eprintln!("[pulp] failed to init clipboard: {}", e);
                return;
            }
        };

        loop {
            // Image slot first — arboard treats text/image as separate slots
            if let Ok(img) = clipboard.get_image() {
                let hash = hash_bytes(&img.bytes);
                let should_save = {
                    let s = state.lock().unwrap();
                    s.last_image_hash != Some(hash)
                };
                if should_save {
                    {
                        let mut s = state.lock().unwrap();
                        s.last_image_hash = Some(hash);
                    }
                    if let Ok(thumb_b64) = encode_thumbnail(&img) {
                        let preview = format!(
                            "{}x{} image · {} KB",
                            img.width,
                            img.height,
                            img.bytes.len() / 1024
                        );
                        save_and_notify(
                            &app,
                            NewClip {
                                content: preview,
                                clip_type: ClipType::Image,
                                thumbnail: Some(thumb_b64),
                            },
                        );
                    }
                }
            } else if let Ok(text) = clipboard.get_text() {
                let trimmed = text.trim();
                if !trimmed.is_empty() {
                    let should_save = {
                        let s = state.lock().unwrap();
                        s.last_text.as_deref() != Some(text.as_str())
                    };
                    if should_save {
                        {
                            let mut s = state.lock().unwrap();
                            s.last_text = Some(text.clone());
                            s.last_image_hash = None;
                        }
                        let ctype = detect_type(&text);
                        save_and_notify(
                            &app,
                            NewClip {
                                content: text,
                                clip_type: ctype,
                                thumbnail: None,
                            },
                        );
                    }
                }
            }

            thread::sleep(Duration::from_millis(500));
        }
    });
}

fn save_and_notify(app: &AppHandle, clip: NewClip) {
    if let Some(state) = app.try_state::<Arc<Mutex<Database>>>() {
        let db = state.lock().unwrap();
        if let Ok(saved) = db.insert_clip(&clip) {
            let _ = app.emit("clip-added", &saved);
        }
    }
}

const CODE_PATTERNS: &[&str] = &[
    "{", "=>", "fn ", "def ", "import ", "const ", "SELECT", "<?", "//", "```",
];

fn detect_type(text: &str) -> ClipType {
    for p in CODE_PATTERNS {
        if text.contains(p) {
            return ClipType::Code;
        }
    }
    let total = text.chars().count().max(1) as f32;
    let special = text
        .chars()
        .filter(|c| !c.is_alphanumeric() && !c.is_whitespace())
        .count() as f32;
    let has_newline = text.contains('\n');
    if has_newline && (special / total) > 0.15 {
        return ClipType::Code;
    }
    ClipType::Text
}

fn hash_bytes(bytes: &[u8]) -> u64 {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut h = DefaultHasher::new();
    bytes.hash(&mut h);
    h.finish()
}

fn encode_thumbnail(img: &arboard::ImageData) -> Result<String, Box<dyn std::error::Error>> {
    let buffer: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_raw(
        img.width as u32,
        img.height as u32,
        img.bytes.clone().into_owned(),
    )
    .ok_or("failed to build image buffer")?;

    let thumb = image::imageops::thumbnail(&buffer, 320, 320);
    let mut png_bytes: Vec<u8> = Vec::new();
    thumb.write_to(&mut Cursor::new(&mut png_bytes), image::ImageFormat::Png)?;
    Ok(general_purpose::STANDARD.encode(&png_bytes))
}

/// Writes text to the clipboard while marking it as "already seen" so the
/// watcher thread does not re-save it as a new clip.
pub fn write_text_to_clipboard(text: &str, state: &WatcherHandle) -> Result<(), String> {
    {
        let mut s = state.lock().unwrap();
        s.last_text = Some(text.to_string());
        s.last_image_hash = None;
    }
    let mut cb = Clipboard::new().map_err(|e| e.to_string())?;
    cb.set_text(text).map_err(|e| e.to_string())
}
