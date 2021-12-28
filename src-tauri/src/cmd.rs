use tauri::command;

pub struct AppState(pub std::sync::Arc<std::sync::Mutex<Option<mongodb::sync::Client>>>);

pub type AppArg<'a> = tauri::State<'a, AppState>;

#[command]
pub async fn connect_mongodb(
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
pub async fn list_collections(
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
        eprintln!("list_collections::{}", err);
        "Unable to open collection".to_string()
      })
  } else {
    Err("Unable to open database".to_string())
  }
}

#[command]
pub async fn list_documents(
  state: AppArg<'_>,
  database_name: String,
  collection_name: String,
  page: i64,
  per_page: i64,
) -> Result<Vec<mongodb::bson::Document>, String> {
  let handle = &*state.0.lock().unwrap();
  if let Some(client) = handle {
    let database = client.database(&database_name);
    let collections = database.collection(&collection_name);
    let find_options = mongodb::options::FindOptions::builder()
      .limit(per_page)
      .skip((per_page * page) as u64)
      .build();
    println!("database_name:{}", database_name);
    println!("collection_name:{}", collection_name);
    println!("page:{}", page);
    println!("per_page:{}", per_page);
    collections
      .find(None, find_options)
      .and_then(|r| r.collect::<Result<Vec<_>, _>>())
      .map_err(|err| {
        eprintln!("list_documents::{}", err);
        "Unable to open collection".to_string()
      })
  } else {
    Err("Unable to list documents in collection".to_string())
  }
}
