use std::sync::{Arc, Mutex};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, Manager,
};

use crate::db::Database;

pub fn setup_tray(app: &mut App) -> tauri::Result<()> {
    let open_i = MenuItem::with_id(app, "open", "Open Pulp", true, None::<&str>)?;
    let clear_i = MenuItem::with_id(app, "clear", "Clear All", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open_i, &clear_i, &quit_i])?;

    let _tray = TrayIconBuilder::with_id("pulp-tray")
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("Pulp · Clipboard Manager")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => {
                show_window(app);
            }
            "clear" => {
                if let Some(state) = app.try_state::<Arc<Mutex<Database>>>() {
                    let _ = state.lock().unwrap().clear_all();
                    let _ = tauri::Emitter::emit(app, "history-cleared", ());
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                toggle_window(app);
            }
        })
        .build(app)?;

    Ok(())
}

fn show_window(app: &tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.show();
        let _ = win.set_focus();
    }
}

fn toggle_window(app: &tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        if win.is_visible().unwrap_or(false) {
            let _ = win.hide();
        } else {
            let _ = win.show();
            let _ = win.set_focus();
        }
    }
}
