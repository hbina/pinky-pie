use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub enum PError {
  ClientNotAvailable,
  CannotConnectToMongodb,
  CannotListDatabases,
  CannotListCollections,
  CannotFindServerInfo,
  CursorFailure,
  DocumentCountFailed,
  // DocumentAggregateFailed,
  // DocumentFindFailed,
  MongodbError(String, Vec<String>),
  BsonSerializationError(String),
}

impl std::error::Error for PError {}

impl std::fmt::Display for PError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:#?}", self)
  }
}

impl From<mongodb::error::Error> for PError {
  fn from(err: mongodb::error::Error) -> Self {
    PError::MongodbError(
      format!("{:#?}", err.kind),
      err.labels().iter().cloned().collect(),
    )
  }
}

impl From<mongodb::bson::ser::Error> for PError {
  fn from(err: mongodb::bson::ser::Error) -> Self {
    PError::BsonSerializationError(format!("{:#?}", err))
  }
}
