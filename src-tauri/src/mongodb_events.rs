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
    sdam::{
      SdamEventHandler, ServerHeartbeatFailedEvent, ServerHeartbeatSucceededEvent,
      TopologyDescriptionChangedEvent,
    },
  },
  ServerType,
};
use serde::{Deserialize, Serialize};

lazy_static! {
  pub static ref DATABASE_TOPOLOGY: Arc<Mutex<DatabaseTopology>> =
    Arc::new(Mutex::new(DatabaseTopology::default()));
  pub static ref DATABASE_HEARTBEAT: Arc<Mutex<DatabaseHeartbeat>> =
    Arc::new(Mutex::new(DatabaseHeartbeat::default()));
  pub static ref SERVER_METRIC: Arc<Mutex<DatabaseMetric>> =
    Arc::new(Mutex::new(DatabaseMetric::default()));
}

#[derive(Default, Clone, Debug, Serialize, Deserialize)]
pub struct DatabaseTopology {
  servers: Vec<ServerDescription>,
}

impl DatabaseTopology {
  pub fn replace_document(&mut self, event: TopologyDescriptionChangedEvent) {
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
    self.servers = servers;
  }

  pub fn get_database_topology(&self) -> Vec<ServerDescription> {
    self.servers.clone()
  }
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

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum FinishedHeartbeat {
  SUCCEEDED(usize),
  FAILED(usize),
}

#[derive(Default, Clone, Debug, Serialize, Deserialize)]
pub struct DatabaseHeartbeat {
  pub duration: Vec<FinishedHeartbeat>,
}

impl DatabaseHeartbeat {
  pub fn add_succeeded_event(&mut self, event: ServerHeartbeatSucceededEvent) {
    self.duration.push(FinishedHeartbeat::SUCCEEDED(
      event.duration.as_nanos() as usize
    ));
    if self.duration.len() == 100 {
      self.duration.remove(0);
    }
  }

  pub fn add_failed_event(&mut self, event: ServerHeartbeatFailedEvent) {
    self
      .duration
      .push(FinishedHeartbeat::FAILED(event.duration.as_nanos() as usize));
    if self.duration.len() == 100 {
      self.duration.remove(0);
    }
  }

  pub fn get_connection_heartbeat(&self) -> Vec<(usize, usize)> {
    self
      .duration
      .iter()
      .map(|v| match v {
        FinishedHeartbeat::SUCCEEDED(s) => (*s, 0),
        FinishedHeartbeat::FAILED(s) => (0, *s),
      })
      .collect()
  }
}

pub struct ServerInfoHandler;

impl SdamEventHandler for ServerInfoHandler {
  fn handle_topology_description_changed_event(&self, event: TopologyDescriptionChangedEvent) {
    let mut handle = DATABASE_TOPOLOGY.as_ref().lock().unwrap();
    handle.replace_document(event);
  }

  fn handle_server_heartbeat_failed_event(&self, event: ServerHeartbeatFailedEvent) {
    let mut handle = DATABASE_HEARTBEAT.as_ref().lock().unwrap();
    handle.add_failed_event(event);
  }

  fn handle_server_heartbeat_succeeded_event(&self, event: ServerHeartbeatSucceededEvent) {
    let mut handle = DATABASE_HEARTBEAT.as_ref().lock().unwrap();
    handle.add_succeeded_event(event);
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
  pub intercepted_time: usize,
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
        .as_millis() as usize,
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
pub struct DatabaseMetric {
  commands: HashMap<i32, CommandStatistics>,
  // FIXME: Prevents duplicate keys, reimplement using a simple Vec
  slowest_commands: BTreeMap<u64, i32>,
}

impl DatabaseMetric {
  pub fn add_init_command(&mut self, event: CommandStartedEvent) {
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
      self.slowest_commands.insert(time_taken, event.request_id);
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
      self.slowest_commands.insert(time_taken, event.request_id);
    } else {
      eprintln!(
        "Cannot find the successful command with request_id:{} event:{:?}",
        event.request_id, event
      );
    }
  }

  pub fn get_commands_statistics_per_sec(&self, count: usize) -> Vec<(usize, usize, usize)> {
    let time_current = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .unwrap()
      .as_millis() as usize;
    let time_count_secs_ago = time_current - (count * 1000);
    let mut result = vec![(0, 0, 0); count];
    let cmds_time = self.commands.iter().filter_map(|(_, s)| {
      if s.intercepted_time > time_count_secs_ago {
        let time_idx = s.intercepted_time % time_count_secs_ago;
        let cmd_status_idx = match s.status {
          CommandStatus::STARTED => 0,
          CommandStatus::FAILED(_) => 1,
          CommandStatus::SUCCESSFUL(_) => 2,
        };
        Some((cmd_status_idx, time_idx))
      } else {
        None
      }
    });
    for (cmd_status_idx, time_idx) in cmds_time {
      let idx = time_idx / 1000;
      if cmd_status_idx == 0 {
        result[idx].0 += 1;
      } else if time_idx == 1 {
        result[idx].1 += 1;
      } else {
        result[idx].2 += 1;
      }
    }
    result
  }

  pub fn get_n_slowest_commands(&self, n: usize) -> Vec<FinishedCommandInfo> {
    self
      .slowest_commands
      .values()
      .take(n)
      .rev()
      .filter_map(|id| {
        let cmd_stat = self.commands.get(id)?;
        match cmd_stat.status {
          CommandStatus::STARTED => {
            unreachable!("Only finished commands should be inserted into `slowest_commands`")
          }
          CommandStatus::FAILED(CommandStatusFailed { time_taken, .. }) => Some(
            FinishedCommandInfo::new(time_taken, cmd_stat.name.clone(), cmd_stat.command.clone()),
          ),
          CommandStatus::SUCCESSFUL(CommandStatuSuccessful { time_taken, .. }) => Some(
            FinishedCommandInfo::new(time_taken, cmd_stat.name.clone(), cmd_stat.command.clone()),
          ),
        }
      })
      .collect()
  }
}

pub struct CommandInfoHandler;

impl CommandEventHandler for CommandInfoHandler {
  fn handle_command_started_event(&self, event: CommandStartedEvent) {
    // println!("handle_command_started_event:{:#?}", event);
    let mut handle = SERVER_METRIC.as_ref().lock().unwrap();
    handle.add_init_command(event);
  }

  fn handle_command_succeeded_event(&self, event: CommandSucceededEvent) {
    // println!("handle_command_succeeded_event:{:#?}", event);
    let mut handle = SERVER_METRIC.as_ref().lock().unwrap();
    handle.add_successful_command(event);
  }

  fn handle_command_failed_event(&self, event: CommandFailedEvent) {
    // println!("handle_command_failed_event:{:#?}", event);
    let mut handle = SERVER_METRIC.as_ref().lock().unwrap();
    handle.add_failed_command(event);
  }
}
