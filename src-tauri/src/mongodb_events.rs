use std::sync::{Arc, Mutex};

use mongodb::{
  bson::{Bson, Document},
  event::sdam::{SdamEventHandler, ServerHeartbeatSucceededEvent, TopologyDescriptionChangedEvent},
  ServerType,
};
use serde::{Deserialize, Serialize};

lazy_static! {
  pub static ref GLOBAL: Arc<Mutex<ServerStatus>> = Arc::new(Mutex::new(ServerStatus::default()));
}

#[derive(Default, Clone, Debug, Serialize, Deserialize)]
pub struct ServerStatus {
  servers: Vec<ServerDescription>,
  heartbeat: ServerHeartbeat,
}

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
  pub average_round_trip_time: Option<String>,
  pub last_update_time: Option<String>,
  pub max_wire_version: Option<i32>,
  pub min_wire_version: Option<i32>,
  pub replicat_set_name: Option<String>,
  pub replicate_set_version: Option<i32>,
  pub server_type: SerializableServerType,
  pub tags: Option<Document>,
}

impl ServerDescription {
  pub fn from_document(event: TopologyDescriptionChangedEvent) -> Vec<ServerDescription> {
    let servers = event
      .new_description
      .servers()
      .iter()
      .map(|(address, info)| ServerDescription {
        address: address.to_string(),
        average_round_trip_time: info
          .average_round_trip_time()
          .map(|v| v.as_millis().to_string()),
        last_update_time: info.last_update_time().map(|v| v.to_rfc3339_string()),
        max_wire_version: info.max_wire_version(),
        min_wire_version: info.min_wire_version(),
        replicat_set_name: info.replica_set_name().map(|s| s.to_string()),
        replicate_set_version: info.replica_set_version(),
        server_type: SerializableServerType::from(info.server_type()),
        tags: info.tags().map(|s| {
          s.iter()
            .map(|(k, v)| (k.clone(), Bson::String(v.clone())))
            .collect()
        }),
      })
      .collect::<Vec<_>>();
    servers
  }
}

#[derive(Default, Clone, Debug, Serialize, Deserialize)]
pub struct ServerHeartbeat {
  pub duration: Vec<(i64, u64)>,
  pub document: Option<Document>,
}

impl ServerHeartbeat {
  pub fn add_document(&mut self, event: ServerHeartbeatSucceededEvent) {
    self.duration.push((
      event
        .reply
        .get_datetime("localTime")
        .clone()
        .unwrap()
        .timestamp_millis(),
      event.duration.as_nanos() as u64,
    ));
    if self.duration.len() == 21 {
      self.duration.remove(0);
    }
    self.document = Some(event.reply);
  }
}

pub struct SdamHandler;

impl SdamEventHandler for SdamHandler {
  fn handle_topology_description_changed_event(&self, event: TopologyDescriptionChangedEvent) {
    let mut handle = GLOBAL.as_ref().lock().unwrap();
    handle.servers = ServerDescription::from_document(event);
  }

  fn handle_server_heartbeat_succeeded_event(&self, event: ServerHeartbeatSucceededEvent) {
    let mut handle = GLOBAL.as_ref().lock().unwrap();
    handle.heartbeat.add_document(event);
  }
}
