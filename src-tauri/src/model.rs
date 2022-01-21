use std::sync::{Arc, Mutex};

use mongodb::{
  bson::{Bson, Document},
  results::CollectionSpecification,
  sync::Client,
};
use serde::{Deserialize, Serialize};

use crate::error::PError;

#[derive(Default)]
pub struct AppState {
  pub client: Arc<Mutex<Option<Client>>>,
}

pub type AppArg<'a> = tauri::State<'a, AppState>;

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

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DatabaseInformation {
  pub name: String,
  pub size_on_disk: u64,
  pub empty: bool,
  pub shards: Option<Document>,
  pub collections: Vec<CollectionSpecification>,
}

impl DatabaseInformation {
  pub fn from_client(client: &Client) -> Result<Document, PError> {
    let databases = client.list_databases(None, None)?;
    let mut document = Document::default();

    for database in databases {
      let collections = client
        .database(&database.name)
        .list_collections(None, None)?
        .collect::<Result<Vec<_>, _>>()?;
      let mut database_information = mongodb::bson::to_document(&database)?;
      database_information.insert("collections", mongodb::bson::to_bson(&collections)?);
      document.insert(database.name, database_information);
    }

    Ok(document)
  }
}
