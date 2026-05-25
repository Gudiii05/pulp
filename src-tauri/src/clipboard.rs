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
    pub paused: bool,
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
            // Honor pause: skip everything but keep the thread alive
            let paused = {
                let s = state.lock().unwrap();
                s.paused
            };
            if paused {
                thread::sleep(Duration::from_millis(500));
                continue;
            }

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
                    if let Ok(png_b64) = encode_image_png(&img) {
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
                                thumbnail: Some(png_b64),
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

fn is_single_url(text: &str) -> bool {
    let t = text.trim();
    if t.contains(char::is_whitespace) {
        return false;
    }
    t.starts_with("http://") || t.starts_with("https://")
}

fn detect_type(text: &str) -> ClipType {
    // A pure URL is text, not code — even though it contains "//".
    if is_single_url(text) {
        return ClipType::Text;
    }
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

/// Encodes the full clipboard image as a base64 PNG. We keep the original
/// dimensions so the clip can be put back to the clipboard later byte-for-byte.
fn encode_image_png(img: &arboard::ImageData) -> Result<String, Box<dyn std::error::Error>> {
    let buffer: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_raw(
        img.width as u32,
        img.height as u32,
        img.bytes.clone().into_owned(),
    )
    .ok_or("failed to build image buffer")?;

    let mut png_bytes: Vec<u8> = Vec::new();
    buffer.write_to(&mut Cursor::new(&mut png_bytes), image::ImageFormat::Png)?;
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

/// Decodes a base64-encoded PNG and writes it back to the system clipboard
/// as an image. Also marks the image as "already seen" so the watcher does
/// not save it as a new clip.
pub fn write_image_to_clipboard(b64_png: &str, state: &WatcherHandle) -> Result<(), String> {
    let png_bytes = general_purpose::STANDARD
        .decode(b64_png.as_bytes())
        .map_err(|e| format!("base64 decode failed: {}", e))?;

    let img = image::load_from_memory_with_format(&png_bytes, image::ImageFormat::Png)
        .map_err(|e| format!("png decode failed: {}", e))?;
    let rgba = img.to_rgba8();
    let (width, height) = rgba.dimensions();
    let raw = rgba.into_raw();

    // Update the watcher state BEFORE setting the clipboard so the next
    // poll tick recognizes this as already-seen and skips re-saving it.
    {
        let mut s = state.lock().unwrap();
        s.last_image_hash = Some(hash_bytes(&raw));
        s.last_text = None;
    }

    let image_data = arboard::ImageData {
        width: width as usize,
        height: height as usize,
        bytes: std::borrow::Cow::Owned(raw),
    };

    let mut cb = Clipboard::new().map_err(|e| e.to_string())?;
    cb.set_image(image_data).map_err(|e| e.to_string())?;
    Ok(())
}
