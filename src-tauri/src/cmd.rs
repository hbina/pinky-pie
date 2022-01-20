use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use mongodb::{
  bson::{Bson, Document},
  event::sdam::{SdamEventHandler, ServerHeartbeatSucceededEvent, TopologyDescriptionChangedEvent},
  options::{ClientOptions, FindOptions, ServerAddress},
  results::{CollectionSpecification, DatabaseSpecification},
  sync::Client,
  sync::Cursor,
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

#[derive(Clone, Debug, Serialize, Deserialize)]
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

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ServerDescription {
  pub address: String,
  pub server_type: SerializableServerType,
}

impl ServerDescription {
  pub fn from_document(event: TopologyDescriptionChangedEvent) -> Vec<ServerDescription> {
    let servers = event
      .new_description
      .servers()
      .iter()
      .map(|(address, info)| ServerDescription {
        address: address.to_string(),
        server_type: SerializableServerType::from(info.server_type()),
      })
      .collect::<Vec<_>>();
    servers
  }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ServerHeartbeat {
  pub duration: u64,
  pub document: Document,
}

impl ServerHeartbeat {
  pub fn from_document(event: ServerHeartbeatSucceededEvent) -> ServerHeartbeat {
    ServerHeartbeat {
      // Better way to do this?
      duration: event.duration.as_millis() as u64,
      document: event.reply,
    }
  }
}

#[derive(Default, Clone, Debug, Serialize, Deserialize)]
pub struct ServerStatus {
  descriptions: Vec<ServerDescription>,
  heartbeat: Option<ServerHeartbeat>,
}

impl SdamEventHandler for SdamHandler {
  fn handle_topology_description_changed_event(&self, event: TopologyDescriptionChangedEvent) {
    let mut handle = GLOBAL.as_ref().lock().unwrap();
    handle.descriptions = ServerDescription::from_document(event);
  }

  fn handle_server_heartbeat_succeeded_event(&self, event: ServerHeartbeatSucceededEvent) {
    let mut handle = GLOBAL.as_ref().lock().unwrap();
    handle.heartbeat = Some(ServerHeartbeat::from_document(event));
  }
}

#[derive(PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum BsonType {
  /// 64-bit binary floating point
  Double,
  /// UTF-8 string
  String,
  /// Array
  Array,
  /// Embedded document
  Document,
  /// Boolean value
  Boolean,
  /// Null value
  Null,
  /// Regular expression
  RegularExpression,
  /// JavaScript code
  JavaScriptCode,
  /// JavaScript code w/ scope
  JavaScriptCodeWithScope,
  /// 32-bit signed integer
  Int32,
  /// 64-bit signed integer
  Int64,
  /// Timestamp
  Timestamp,
  /// Binary data
  Binary,
  /// [ObjectId](http://dochub.mongodb.org/core/objectids)
  ObjectId,
  /// UTC datetime
  DateTime,
  /// Symbol (Deprecated)
  Symbol,
  /// [128-bit decimal floating point](https://github.com/mongodb/specifications/blob/master/source/bson-decimal128/decimal128.rst)
  Decimal128,
  /// Undefined value (Deprecated)
  Undefined,
  /// Max key
  MaxKey,
  /// Min key
  MinKey,
  /// DBPointer (Deprecated)
  DbPointer,
}

impl From<&Bson> for BsonType {
  fn from(b: &Bson) -> Self {
    match b {
      Bson::Double(_) => BsonType::Double,
      Bson::String(_) => BsonType::String,
      Bson::Array(_) => BsonType::Array,
      Bson::Document(_) => BsonType::Document,
      Bson::Boolean(_) => BsonType::Boolean,
      Bson::Null => BsonType::Null,
      Bson::RegularExpression(_) => BsonType::RegularExpression,
      Bson::JavaScriptCode(_) => BsonType::JavaScriptCode,
      Bson::JavaScriptCodeWithScope(_) => BsonType::JavaScriptCodeWithScope,
      Bson::Int32(_) => BsonType::Int32,
      Bson::Int64(_) => BsonType::Int64,
      Bson::Timestamp(_) => BsonType::Timestamp,
      Bson::Binary(_) => BsonType::Binary,
      Bson::ObjectId(_) => BsonType::ObjectId,
      Bson::DateTime(_) => BsonType::DateTime,
      Bson::Symbol(_) => BsonType::Symbol,
      Bson::Decimal128(_) => BsonType::Decimal128,
      Bson::Undefined => BsonType::Undefined,
      Bson::MaxKey => BsonType::MaxKey,
      Bson::MinKey => BsonType::MinKey,
      Bson::DbPointer(_) => BsonType::DbPointer,
    }
  }
}

#[derive(Debug, Serialize, Deserialize)]
pub enum PError {
  ClientNotAvailable,
  CannotConnectToMongodb,
  CannotListDatabases,
  CannotListCollections,
  CannotFindServerInfo,
  CursorFailure,
  DocumentCountFailed,
  DocumentAggregateFailed,
  DocumentFindFailed,
}

impl std::error::Error for PError {}

impl std::fmt::Display for PError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:#?}", self)
  }
}

lazy_static! {
  static ref GLOBAL: Arc<Mutex<ServerStatus>> = Arc::new(Mutex::new(ServerStatus::default()));
}

#[command]
pub async fn mongodb_connect(
  state: AppArg<'_>,
  url: String,
  port: u16,
) -> Result<Vec<DatabaseSpecification>, PError> {
  let handler: Arc<dyn SdamEventHandler> = Arc::new(SdamHandler);
  let client = Client::with_options(
    ClientOptions::builder()
      .hosts(vec![ServerAddress::Tcp {
        host: url.clone(),
        port: Some(port),
      }])
      .sdam_event_handler(handler)
      .build(),
  )
  .map_err(|_| PError::CannotConnectToMongodb)?;
  let databases = client
    .list_databases(None, None)
    .map_err(|_| PError::CannotListDatabases)?;
  {
    let mut handle = state.client.lock().unwrap();
    *handle = Some(client)
  };
  Ok(databases)
}

#[command]
pub async fn mongodb_find_collections(
  state: AppArg<'_>,
  database_name: String,
) -> Result<Vec<CollectionSpecification>, PError> {
  let handle = &*state.client.lock().unwrap();
  let client = handle.as_ref().ok_or(PError::ClientNotAvailable)?;
  let database = client.database(&database_name);
  database
    .list_collections(None, None)
    .and_then(|cursor| cursor.collect::<Result<Vec<_>, _>>())
    .map_err(|_| PError::CannotListCollections)
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
  collections
    .find(documents_filter, find_options)
    .and_then(|cursor| cursor.collect::<Result<Vec<_>, _>>())
    .map_err(|_| PError::CursorFailure)
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
  collections
    .count_documents(documents_filter, None)
    .map_err(|_| PError::DocumentCountFailed)
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
  collections
    .aggregate(stages, None)
    .and_then(|cursor| cursor.collect::<Result<Vec<Document>, _>>())
    .map_err(|_| PError::DocumentAggregateFailed)
}

#[command]
pub async fn mongodb_server_description() -> ServerStatus {
  let result = &*GLOBAL.lock().unwrap();
  result.clone()
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
  let find_options = FindOptions::builder().build();

  let cursor: Cursor<Document> = collections
    .find(documents_filter, find_options)
    .map_err(|_| PError::DocumentFindFailed)?;
  let mut result: HashMap<String, HashMap<BsonType, u64>> = HashMap::default();
  for document_cursor in cursor {
    let document = document_cursor.map_err(|_| PError::CursorFailure)?;
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
