use tauri::command;

pub struct AppState(pub std::sync::Arc<std::sync::Mutex<Option<mongodb::sync::Client>>>);

pub type AppArg<'a> = tauri::State<'a, AppState>;

#[command]
pub async fn connect_mongodb(
  state: AppArg<'_>,
  mongodb_url: String,
) -> Result<Vec<mongodb::results::DatabaseSpecification>, String> {
  let client = mongodb::sync::Client::with_uri_str(mongodb_url.as_str()).unwrap();
  let databases = client.list_databases(None, None).unwrap();
  {
    let mut handle = state.0.lock().unwrap();
    *handle = Some(client)
  };
  Ok(databases)
}

#[command]
pub async fn list_collections(
  state: AppArg<'_>,
  database_name: String,
) -> Result<Vec<mongodb::results::CollectionSpecification>, String> {
  let handle = &*state.0.lock().unwrap();
  if let Some(client) = handle {
    let database = client.database(&database_name);
    let collections = database
      .list_collections(None, None)
      .unwrap()
      .collect::<Result<Vec<_>, _>>()
      .unwrap();
    Ok(collections)
  } else {
    Err("Unable to open database".to_string())
  }
}

#[command]
pub async fn list_documents(
  state: AppArg<'_>,
  database_name: String,
  collection_name: String,
) -> Result<Vec<mongodb::bson::Document>, String> {
  let handle = &*state.0.lock().unwrap();
  if let Some(client) = handle {
    let database = client.database(&database_name);
    let collections = database.collection(&collection_name);
    let find_options = mongodb::options::FindOptions::builder().limit(2).build();
    let documents = collections
      .find(None, find_options)
      .unwrap()
      .collect::<Result<Vec<_>, _>>()
      .unwrap();
    Ok(documents)
  } else {
    Err("Unable to list documents in collection".to_string())
  }
}
