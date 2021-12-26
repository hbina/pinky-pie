#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod cmd;

fn main() {
  tauri::Builder::default()
    .manage(cmd::AppState(std::sync::Arc::new(std::sync::Mutex::new(
      None,
    ))))
    .invoke_handler(tauri::generate_handler![
      cmd::connect_mongodb,
      cmd::list_collections,
      cmd::list_documents
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
