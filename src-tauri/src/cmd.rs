use std::collections::HashMap;
use std::sync::Arc;

use mongodb::{
  bson::Document,
  event::{command::CommandEventHandler, sdam::SdamEventHandler},
  options::{ClientOptions, FindOptions, ServerAddress},
  sync::{Client, Cursor},
};
use tauri::command;

use crate::mongodb_events::{
  CommandInfoHandler, ServerInfo, ServerInfoHandler, SERVER_INFO, SERVER_METRIC,
};
use crate::{error::PError, model::DatabaseInformation};
use crate::{
  model::{AppArg, BsonType},
  mongodb_events::FinishedCommandInfo,
};

#[command]
pub async fn mongodb_connect(
  state: AppArg<'_>,
  url: String,
  port: u16,
) -> Result<Document, PError> {
  let sdam_handler: Arc<dyn SdamEventHandler> = Arc::new(ServerInfoHandler);
  let command_handler: Arc<dyn CommandEventHandler> = Arc::new(CommandInfoHandler);
  let client = Client::with_options(
    ClientOptions::builder()
      .hosts(vec![ServerAddress::Tcp {
        host: url.clone(),
        port: Some(port),
      }])
      .sdam_event_handler(sdam_handler)
      .command_event_handler(command_handler)
      .build(),
  )?;
  let result = DatabaseInformation::from_client(&client)?;
  {
    let mut handle = state.client.lock().unwrap();
    *handle = Some(client)
  };
  Ok(result)
}

#[command]
pub async fn mongodb_find_documents(
  state: AppArg<'_>,
  database_name: String,
  collection_name: String,
  page: i64,
  per_page: i64,
  documents_filter: Document,
  documents_projection: Document,
  documents_sort: Document,
) -> Result<Vec<Document>, PError> {
  let handle = &*state.client.lock().unwrap();
  let client = handle.as_ref().ok_or(PError::ClientNotAvailable)?;
  let database = client.database(&database_name);
  let collections = database.collection(&collection_name);
  let find_options = FindOptions::builder()
    .limit(per_page)
    .skip((per_page * page) as u64)
    .projection(documents_projection)
    .sort(documents_sort)
    .build();
  let result = collections
    .find(documents_filter, find_options)
    .and_then(|cursor| cursor.collect::<Result<Vec<_>, _>>())?;
  Ok(result)
}

#[command]
pub async fn mongodb_count_documents(
  state: AppArg<'_>,
  database_name: String,
  collection_name: String,
  documents_filter: Document,
) -> Result<u64, PError> {
  let handle = &*state.client.lock().unwrap();
  let client = handle.as_ref().ok_or(PError::ClientNotAvailable)?;
  let database = client.database(&database_name);
  let collections = database.collection::<Document>(&collection_name);
  let result = collections.count_documents(documents_filter, None)?;
  Ok(result)
}

#[command]
pub async fn mongodb_aggregate_documents(
  state: AppArg<'_>,
  database_name: String,
  collection_name: String,
  stages: Vec<Document>,
) -> Result<Vec<Document>, PError> {
  let handle = &*state.client.lock().unwrap();
  let client = handle.as_ref().ok_or(PError::ClientNotAvailable)?;
  let database = client.database(&database_name);
  let collections = database.collection::<Document>(&collection_name);
  let result = collections
    .aggregate(stages, None)
    .and_then(|cursor| cursor.collect::<Result<Vec<Document>, _>>())?;
  Ok(result)
}

#[command]
pub async fn mongodb_server_info() -> ServerInfo {
  let result = &*SERVER_INFO.lock().unwrap();
  result.clone()
}

#[command]
pub async fn mongodb_get_commands_statistics_per_sec(count: usize) -> Vec<(usize, usize, usize)> {
  let result = &*SERVER_METRIC.lock().unwrap();
  result.get_commands_statistics_per_sec(count)
}

#[command]
pub async fn mongodb_n_slowest_commands(count: usize) -> Vec<FinishedCommandInfo> {
  let result = &*SERVER_METRIC.lock().unwrap();
  result.get_n_slowest_commands(count)
}

#[command]
pub async fn mongodb_analyze_documents(
  state: AppArg<'_>,
  database_name: String,
  collection_name: String,
  documents_filter: Document,
) -> Result<Vec<(String, Vec<(BsonType, u64)>)>, PError> {
  let handle = &*state.client.lock().unwrap();
  let client = handle.as_ref().ok_or(PError::ClientNotAvailable)?;
  let database = client.database(&database_name);
  let collections = database.collection(&collection_name);
  let find_options = FindOptions::builder().limit(1000).build();

  let cursor: Cursor<Document> = collections.find(documents_filter, find_options)?;
  let mut result: HashMap<String, HashMap<BsonType, u64>> = HashMap::default();
  for document_cursor in cursor {
    let document = document_cursor?;
    for (document_key, document_value) in &document {
      let document_value_bson_type = BsonType::from(document_value);
      let entry: &mut HashMap<BsonType, u64> = result.entry(document_key.to_string()).or_default();
      let eentry = entry.entry(document_value_bson_type).or_default();
      *eentry = *eentry + 1;
    }
  }
  let r = result
    .into_iter()
    .map(|(k, v)| (k, v.into_iter().collect()))
    .collect();
  Ok(r)
}
