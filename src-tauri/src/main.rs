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
      cmd::mongodb_connect,
      cmd::mongodb_find_collections,
      cmd::mongodb_find_documents,
      cmd::mongodb_count_documents,
      cmd::mongodb_aggregate_documents
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
