use std::{
  collections::{BTreeMap, HashMap},
  sync::{Arc, Mutex},
  time::{SystemTime, UNIX_EPOCH},
};

use mongodb::{
  bson::{Bson, Document},
  event::{
    command::{
      CommandEventHandler, CommandFailedEvent, CommandStartedEvent, CommandSucceededEvent,
    },
    sdam::{SdamEventHandler, ServerHeartbeatSucceededEvent, TopologyDescriptionChangedEvent},
  },
  ServerType,
};
use serde::{Deserialize, Serialize};

lazy_static! {
  pub static ref SERVER_INFO: Arc<Mutex<ServerInfo>> = Arc::new(Mutex::new(ServerInfo::default()));
  pub static ref SERVER_METRIC: Arc<Mutex<ServerMetric>> =
    Arc::new(Mutex::new(ServerMetric::default()));
}

#[derive(Default, Clone, Debug, Serialize, Deserialize)]
pub struct ServerInfo {
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
  pub fn add_event(&mut self, event: ServerHeartbeatSucceededEvent) {
    self.duration.push((
      event
        .reply
        .get_datetime("localTime")
        .clone()
        .unwrap()
        .timestamp_millis(),
      event.duration.as_millis() as u64,
    ));
    if self.duration.len() == 21 {
      self.duration.remove(0);
    }
    self.document = Some(event.reply);
  }
}

pub struct ServerInfoHandler;

impl SdamEventHandler for ServerInfoHandler {
  fn handle_topology_description_changed_event(&self, event: TopologyDescriptionChangedEvent) {
    let mut handle = SERVER_INFO.as_ref().lock().unwrap();
    handle.servers = ServerDescription::from_document(event);
  }

  fn handle_server_heartbeat_succeeded_event(&self, event: ServerHeartbeatSucceededEvent) {
    let mut handle = SERVER_INFO.as_ref().lock().unwrap();
    handle.heartbeat.add_event(event);
  }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CommandStatusFailed {
  pub time_taken: u64,
  pub message: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CommandStatuSuccessful {
  pub time_taken: u64,
  pub reply: Document,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum CommandStatus {
  STARTED,
  FAILED(CommandStatusFailed),
  SUCCESSFUL(CommandStatuSuccessful),
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CommandStatistics {
  pub request_id: i32,
  pub name: String,
  pub status: CommandStatus,
  pub command: Document,
  pub intercepted_time: u64,
}

impl CommandStatistics {
  fn new(request_id: i32, name: String, command: Document) -> CommandStatistics {
    CommandStatistics {
      request_id,
      name,
      command,
      status: CommandStatus::STARTED,
      intercepted_time: SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64,
    }
  }
}

#[derive(Default, Clone, Debug, Serialize, Deserialize)]
pub struct FinishedCommandInfo {
  pub time_taken: u64,
  pub command_name: String,
  pub command: Document,
}

impl FinishedCommandInfo {
  pub fn new(time_taken: u64, command_name: String, command: Document) -> FinishedCommandInfo {
    FinishedCommandInfo {
      time_taken,
      command_name,
      command,
    }
  }
}

#[derive(Default, Clone, Debug, Serialize, Deserialize)]
pub struct ServerMetric {
  commands: HashMap<i32, CommandStatistics>,
  access_pattern: HashMap<String, Vec<i32>>,
  slowest_commands: BTreeMap<u64, FinishedCommandInfo>,
}

impl ServerMetric {
  pub fn add_init_command(&mut self, event: CommandStartedEvent) {
    // Insert into access_pattern
    let database_entry = self.access_pattern.entry(event.db).or_default();
    database_entry.push(event.request_id);

    // Insert into commands
    let old_cmd_stat = self.commands.insert(
      event.request_id,
      CommandStatistics::new(event.request_id, event.command_name, event.command),
    );
    if let Some(cmd_stat) = old_cmd_stat {
      eprintln!(
        "There appears to be a duplicate event for request_id:{} payload:{:?}",
        event.request_id, cmd_stat
      );
    }
  }

  pub fn add_failed_command(&mut self, event: CommandFailedEvent) {
    if let Some(cmd_stat) = self.commands.get_mut(&event.request_id) {
      let time_taken = event.duration.as_nanos() as u64;
      cmd_stat.status = CommandStatus::FAILED(CommandStatusFailed {
        time_taken,
        message: format!("{}", event.failure),
      });
      self.slowest_commands.insert(
        time_taken,
        FinishedCommandInfo::new(time_taken, cmd_stat.name.clone(), cmd_stat.command.clone()),
      );
    } else {
      eprintln!(
        "Cannot find the failed command with request_id:{} event:{:?}",
        event.request_id, event
      );
    }
  }

  pub fn add_successful_command(&mut self, event: CommandSucceededEvent) {
    if let Some(cmd_stat) = self.commands.get_mut(&event.request_id) {
      let time_taken = event.duration.as_nanos() as u64;
      cmd_stat.status = CommandStatus::SUCCESSFUL(CommandStatuSuccessful {
        time_taken,
        reply: event.reply,
      });
      self.slowest_commands.insert(
        time_taken,
        FinishedCommandInfo::new(time_taken, cmd_stat.name.clone(), cmd_stat.command.clone()),
      );
    } else {
      eprintln!(
        "Cannot find the successful command with request_id:{} event:{:?}",
        event.request_id, event
      );
    }
  }

  pub fn get_access_pattern(&self) -> HashMap<String, Vec<CommandStatistics>> {
    let mut result = HashMap::<String, Vec<CommandStatistics>>::new();
    for (database_name, ids) in &self.access_pattern {
      let mut commands = Vec::<CommandStatistics>::default();
      for id in ids {
        let stat = self.commands.get(id).unwrap();
        commands.push(stat.clone());
      }
      result.insert(database_name.clone(), commands);
    }
    result
  }

  pub fn get_n_slowest_commands(&self, n: usize) -> Vec<FinishedCommandInfo> {
    self
      .slowest_commands
      .values()
      .take(n)
      .rev()
      .cloned()
      .collect()
  }
}

pub struct CommandInfoHandler;

impl CommandEventHandler for CommandInfoHandler {
  fn handle_command_started_event(&self, event: CommandStartedEvent) {
    println!("handle_command_started_event:{:#?}", event);
    let mut handle = SERVER_METRIC.as_ref().lock().unwrap();
    handle.add_init_command(event);
  }

  fn handle_command_succeeded_event(&self, event: CommandSucceededEvent) {
    println!("handle_command_succeeded_event:{:#?}", event);
    let mut handle = SERVER_METRIC.as_ref().lock().unwrap();
    handle.add_successful_command(event);
  }

  fn handle_command_failed_event(&self, event: CommandFailedEvent) {
    println!("handle_command_failed_event:{:#?}", event);
    let mut handle = SERVER_METRIC.as_ref().lock().unwrap();
    handle.add_failed_command(event);
  }
}
