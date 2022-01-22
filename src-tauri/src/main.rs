#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[macro_use]
extern crate lazy_static;

mod cmd;
mod error;
mod model;
mod mongodb_events;

fn main() {
  tauri::Builder::default()
    .manage(model::AppState::default())
    .invoke_handler(tauri::generate_handler![
      cmd::mongodb_connect,
      cmd::mongodb_find_documents,
      cmd::mongodb_count_documents,
      cmd::mongodb_aggregate_documents,
      cmd::mongodb_server_info,
      cmd::mongodb_server_metric,
      cmd::mongodb_analyze_documents,
      cmd::mongodb_n_slowest_commands
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
