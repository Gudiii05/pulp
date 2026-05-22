mod clipboard;
mod config;
mod db;
mod tray;

use clipboard::{WatcherHandle, WatcherState};
use config::ConfigStore;
use db::{Clip, Database};
use std::str::FromStr;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Manager, WindowEvent};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

pub type DbState = Arc<Mutex<Database>>;
pub type ConfigState = Arc<ConfigStore>;

/// Tracks the moment a window drag was initiated, so the blur-hide
/// handler can ignore the focus-loss that the OS triggers during drag.
pub struct DragGate(pub Mutex<Option<Instant>>);
pub type DragGateState = Arc<DragGate>;

const DRAG_BLUR_GRACE_MS: u64 = 800;

#[tauri::command]
fn get_clips(
    state: tauri::State<DbState>,
    limit: u32,
    clip_type: Option<String>,
) -> Result<Vec<Clip>, String> {
    state
        .lock()
        .unwrap()
        .get_clips(limit, clip_type)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn search_clips(state: tauri::State<DbState>, query: String) -> Result<Vec<Clip>, String> {
    state
        .lock()
        .unwrap()
        .search(&query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn pin_clip(state: tauri::State<DbState>, id: i64, pinned: bool) -> Result<(), String> {
    state
        .lock()
        .unwrap()
        .pin(id, pinned)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_clip(state: tauri::State<DbState>, id: i64) -> Result<(), String> {
    state
        .lock()
        .unwrap()
        .delete(id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn clear_history(state: tauri::State<DbState>) -> Result<(), String> {
    state
        .lock()
        .unwrap()
        .clear_all()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn copy_to_clipboard(
    content: String,
    watcher: tauri::State<WatcherHandle>,
) -> Result<(), String> {
    clipboard::write_text_to_clipboard(&content, &watcher)
}

#[tauri::command]
fn set_max_history(state: tauri::State<DbState>, max: u32) -> Result<(), String> {
    let mut db = state.lock().unwrap();
    db.set_max_entries(max as usize);
    Ok(())
}

#[tauri::command]
fn toggle_window(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        if win.is_visible().unwrap_or(false) {
            let _ = win.hide();
        } else {
            let _ = win.show();
            let _ = win.set_focus();
        }
    }
    Ok(())
}

#[tauri::command]
fn hide_window(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.hide();
    }
    Ok(())
}

#[tauri::command]
fn get_hotkey(cfg: tauri::State<ConfigState>) -> Result<String, String> {
    Ok(cfg.get().hotkey)
}

#[tauri::command]
fn set_hotkey(
    app: AppHandle,
    cfg: tauri::State<ConfigState>,
    hotkey: String,
) -> Result<(), String> {
    // Validate the new shortcut before touching state
    let new_shortcut = Shortcut::from_str(&hotkey)
        .map_err(|e| format!("invalid shortcut '{}': {}", hotkey, e))?;

    // Unregister all existing shortcuts and register the new one
    let gs = app.global_shortcut();
    gs.unregister_all().map_err(|e| e.to_string())?;
    gs.register(new_shortcut).map_err(|e| e.to_string())?;

    cfg.set_hotkey(hotkey)?;
    Ok(())
}

#[tauri::command]
fn start_window_drag(app: AppHandle, gate: tauri::State<DragGateState>) -> Result<(), String> {
    *gate.0.lock().unwrap() = Some(Instant::now());
    if let Some(win) = app.get_webview_window("main") {
        win.start_dragging().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        // Any pressed shortcut routes to the window toggle —
                        // we only ever register one (the user-configured hotkey).
                        let _ = toggle_window(app.clone());
                    }
                })
                .build(),
        )
        .setup(move |app| {
            let handle = app.handle().clone();

            // Load persisted config (or default if first run)
            let app_data = handle.path().app_data_dir().expect("app_data_dir");
            std::fs::create_dir_all(&app_data).ok();
            let cfg_path = app_data.join("config.json");
            let cfg: ConfigState = Arc::new(ConfigStore::load_or_default(cfg_path));
            handle.manage(cfg.clone());

            // Register the user-configured hotkey
            let hotkey_str = cfg.get().hotkey;
            match Shortcut::from_str(&hotkey_str) {
                Ok(sc) => {
                    if let Err(e) = handle.global_shortcut().register(sc) {
                        eprintln!("[pulp] failed to register hotkey '{}': {}", hotkey_str, e);
                    }
                }
                Err(e) => {
                    eprintln!("[pulp] invalid hotkey in config '{}': {}", hotkey_str, e);
                }
            }

            // DB
            let db_path = app_data.join("pulp.db");
            let db = Database::new(db_path).expect("open db");
            let state: DbState = Arc::new(Mutex::new(db));
            handle.manage(state.clone());

            // Shared clipboard watcher state (used by both the polling
            // thread and the copy_to_clipboard command to avoid duplicates).
            let watcher: WatcherHandle = Arc::new(Mutex::new(WatcherState::default()));
            handle.manage(watcher.clone());

            // Drag gate — set when the user starts dragging the window so
            // the blur handler can ignore the focus-loss from the drag op.
            let drag_gate: DragGateState = Arc::new(DragGate(Mutex::new(None)));
            handle.manage(drag_gate.clone());

            // Tray
            tray::setup_tray(app)?;

            // Window: hide on blur, unless we're in the middle of a drag.
            if let Some(win) = handle.get_webview_window("main") {
                let win_clone = win.clone();
                let gate_for_blur = drag_gate.clone();
                win.on_window_event(move |evt| {
                    if let WindowEvent::Focused(false) = evt {
                        let in_drag = gate_for_blur
                            .0
                            .lock()
                            .unwrap()
                            .map(|t| t.elapsed() < Duration::from_millis(DRAG_BLUR_GRACE_MS))
                            .unwrap_or(false);
                        if !in_drag {
                            let _ = win_clone.hide();
                        }
                    }
                });
            }

            // Clipboard watcher thread
            clipboard::start_clipboard_watcher(handle, watcher);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_clips,
            search_clips,
            pin_clip,
            delete_clip,
            clear_history,
            copy_to_clipboard,
            set_max_history,
            toggle_window,
            hide_window,
            start_window_drag,
            get_hotkey,
            set_hotkey,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
