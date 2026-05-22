use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

const DEFAULT_HOTKEY: &str = "CommandOrControl+Shift+V";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub hotkey: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            hotkey: DEFAULT_HOTKEY.to_string(),
        }
    }
}

pub struct ConfigStore {
    path: PathBuf,
    pub state: Mutex<AppConfig>,
}

impl ConfigStore {
    pub fn load_or_default(path: PathBuf) -> Self {
        let cfg = fs::read_to_string(&path)
            .ok()
            .and_then(|s| serde_json::from_str::<AppConfig>(&s).ok())
            .unwrap_or_default();
        Self {
            path,
            state: Mutex::new(cfg),
        }
    }

    pub fn get(&self) -> AppConfig {
        self.state.lock().unwrap().clone()
    }

    pub fn set_hotkey(&self, hotkey: String) -> Result<(), String> {
        {
            let mut s = self.state.lock().unwrap();
            s.hotkey = hotkey;
        }
        self.persist()
    }

    fn persist(&self) -> Result<(), String> {
        let cfg = self.state.lock().unwrap().clone();
        let json = serde_json::to_string_pretty(&cfg).map_err(|e| e.to_string())?;
        if let Some(parent) = self.path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        fs::write(&self.path, json).map_err(|e| e.to_string())
    }
}
