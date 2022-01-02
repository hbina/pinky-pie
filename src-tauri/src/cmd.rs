use tauri::command;

pub struct AppState(pub std::sync::Arc<std::sync::Mutex<Option<mongodb::sync::Client>>>);

pub type AppArg<'a> = tauri::State<'a, AppState>;

#[command]
pub async fn mongodb_connect(
  state: AppArg<'_>,
  mongodb_url: String,
) -> Result<Vec<mongodb::results::DatabaseSpecification>, String> {
  if let Ok(client) = mongodb::sync::Client::with_uri_str(mongodb_url.as_str()) {
    let databases = client.list_databases(None, None).unwrap();
    {
      let mut handle = state.0.lock().unwrap();
      *handle = Some(client)
    };
    Ok(databases)
  } else {
    Err(format!("Cannot connect to {}", mongodb_url))
  }
}

#[command]
pub async fn mongodb_find_colletions(
  state: AppArg<'_>,
  database_name: String,
) -> Result<Vec<mongodb::results::CollectionSpecification>, String> {
  let handle = &*state.0.lock().unwrap();
  if let Some(client) = handle {
    let database = client.database(&database_name);
    database
      .list_collections(None, None)
      .and_then(|r| r.collect::<Result<Vec<_>, _>>())
      .map_err(|err| {
        eprintln!("mongodb_find_colletions::{}", err);
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
  documents_filter: mongodb::bson::Document,
  documents_projection: mongodb::bson::Document,
  documents_sort: mongodb::bson::Document,
) -> Result<Vec<mongodb::bson::Document>, String> {
  let handle = &*state.0.lock().unwrap();
  if let Some(client) = handle {
    let database = client.database(&database_name);
    let collections = database.collection(&collection_name);
    let find_options = mongodb::options::FindOptions::builder()
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
  documents_filter: mongodb::bson::Document,
) -> Result<u64, String> {
  let handle = &*state.0.lock().unwrap();
  if let Some(client) = handle {
    let database = client.database(&database_name);
    let collections = database.collection::<mongodb::bson::Document>(&collection_name);
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
  aggregation_stages: Vec<mongodb::bson::Document>,
) -> Result<Vec<mongodb::bson::Document>, String> {
  let handle = &*state.0.lock().unwrap();
  if let Some(client) = handle {
    let database = client.database(&database_name);
    let collections = database.collection::<mongodb::bson::Document>(&collection_name);
    let documents = collections
      .aggregate(aggregation_stages, None)
      .and_then(|v| v.collect::<Result<Vec<mongodb::bson::Document>, _>>())
      .map_err(|err| {
        eprintln!("mongodb_aggregate_documents::{}", err);
        "Unable to perform document aggregation in a collection".to_string()
      });
    documents
  } else {
    Err("No MongoDB client available".to_string())
  }
}
