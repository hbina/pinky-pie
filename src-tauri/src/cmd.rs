use std::sync::{Arc, Mutex};

use mongodb::{
  bson::Document,
  event::sdam::{SdamEventHandler, TopologyDescriptionChangedEvent},
  options::{ClientOptions, FindOptions, ServerAddress},
  results::{CollectionSpecification, DatabaseSpecification},
  sync::Client,
  ServerType,
};
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Default)]
pub struct AppState {
  pub client: Arc<Mutex<Option<Client>>>,
}

pub type AppArg<'a> = tauri::State<'a, AppState>;

struct SdamHandler;

#[derive(Debug, Serialize, Deserialize)]
pub enum SerializableServerType {
  Standalone,
  Other(String),
}

impl From<ServerType> for SerializableServerType {
  fn from(s: ServerType) -> Self {
    match s {
      ServerType::Standalone => SerializableServerType::Standalone,
      o => SerializableServerType::Other(format!("{:#?}", o)),
    }
  }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServerDescription {
  pub address: ServerAddress,
  pub server_type: SerializableServerType,
}

impl SdamEventHandler for SdamHandler {
  fn handle_topology_description_changed_event(&self, event: TopologyDescriptionChangedEvent) {
    let mut handle = GLOBAL.as_ref().lock().unwrap();
    *handle = Some(event);
  }
}

lazy_static! {
  static ref GLOBAL: Arc<Mutex<Option<TopologyDescriptionChangedEvent>>> =
    Arc::new(Mutex::new(None));
}

#[command]
pub async fn mongodb_connect(
  state: AppArg<'_>,
  mongodb_url: String,
  mongodb_port: u16,
) -> Result<Vec<DatabaseSpecification>, String> {
  let handler: Arc<dyn SdamEventHandler> = Arc::new(SdamHandler);
  if let Ok(client) = Client::with_options(
    ClientOptions::builder()
      .hosts(vec![ServerAddress::Tcp {
        host: mongodb_url.clone(),
        port: Some(mongodb_port),
      }])
      .sdam_event_handler(handler)
      .build(),
  ) {
    let databases = client.list_databases(None, None).unwrap();
    {
      let mut handle = state.client.lock().unwrap();
      *handle = Some(client)
    };
    Ok(databases)
  } else {
    Err(format!("Cannot connect to {}", mongodb_url))
  }
}

#[command]
pub async fn mongodb_find_collections(
  state: AppArg<'_>,
  database_name: String,
) -> Result<Vec<CollectionSpecification>, String> {
  let handle = &*state.client.lock().unwrap();
  if let Some(client) = handle {
    let database = client.database(&database_name);
    database
      .list_collections(None, None)
      .and_then(|r| r.collect::<Result<Vec<_>, _>>())
      .map_err(|err| {
        eprintln!("mongodb_find_collections::{}", err);
        "Unable to open collection".to_string()
      })
  } else {
    Err("No MongoDB client available".to_string())
  }
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
) -> Result<Vec<Document>, String> {
  let handle = &*state.client.lock().unwrap();
  if let Some(client) = handle {
    let database = client.database(&database_name);
    let collections = database.collection(&collection_name);
    let find_options = FindOptions::builder()
      .limit(per_page)
      .skip((per_page * page) as u64)
      .projection(documents_projection)
      .sort(documents_sort)
      .build();
    collections
      .find(documents_filter, find_options)
      .and_then(|r| r.collect::<Result<Vec<_>, _>>())
      .map_err(|err| {
        eprintln!("mongodb_find_documents::{}", err);
        "Unable to open collection".to_string()
      })
  } else {
    Err("No MongoDB client available".to_string())
  }
}

#[command]
pub async fn mongodb_count_documents(
  state: AppArg<'_>,
  database_name: String,
  collection_name: String,
  documents_filter: Document,
) -> Result<u64, String> {
  let handle = &*state.client.lock().unwrap();
  if let Some(client) = handle {
    let database = client.database(&database_name);
    let collections = database.collection::<Document>(&collection_name);
    collections
      .count_documents(documents_filter, None)
      .map_err(|err| {
        eprintln!("mongodb_count_documents::{}", err);
        "Unable to estimated document count in a collection".to_string()
      })
  } else {
    Err("No MongoDB client available".to_string())
  }
}

#[command]
pub async fn mongodb_aggregate_documents(
  state: AppArg<'_>,
  database_name: String,
  collection_name: String,
  stages: Vec<Document>,
) -> Result<Vec<Document>, String> {
  let handle = &*state.client.lock().unwrap();
  if let Some(client) = handle {
    let database = client.database(&database_name);
    let collections = database.collection::<Document>(&collection_name);
    let documents = collections
      .aggregate(stages, None)
      .and_then(|v| v.collect::<Result<Vec<Document>, _>>())
      .map_err(|err| {
        eprintln!("mongodb_aggregate_documents::{}", err);
        "Unable to perform document aggregation in a collection".to_string()
      });
    documents
  } else {
    Err("No MongoDB client available".to_string())
  }
}

#[command]
pub async fn mongodb_server_description(
  mongodb_url: String,
  mongodb_port: u16,
) -> Result<ServerDescription, String> {
  let handle = &*GLOBAL.lock().unwrap();
  if let Some(client) = handle {
    client
      .new_description
      .servers()
      .get(&ServerAddress::Tcp {
        host: mongodb_url,
        port: Some(mongodb_port),
      })
      .map(|d| ServerDescription {
        address: d.address().clone(),
        server_type: SerializableServerType::from(d.server_type()),
      })
      .ok_or("Cannot find any server info for that url and port".to_string())
  } else {
    Err("No MongoDB client available".to_string())
  }
}
