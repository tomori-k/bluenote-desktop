pub mod async_reader;
pub mod async_writer;
pub mod client;
pub mod server;

const PROTOCOL_VERSION: u32 = 1;
const REQUEST_THREAD_UPDATES: u8 = 0;
const REQUEST_ALL_NOTES_IN_THREAD: u8 = 1;
const REQUEST_ALL_NOTES_IN_TREE: u8 = 2;
const REQUEST_NOTE_UPDATES_IN_THREAD: u8 = 3;
const REQUEST_NOTE_UPDATES_IN_TREE: u8 = 4;
const SYNC_ALLOWED: u8 = 5;
const SYNC_REJECTED: u8 = 6;
const SYNC_SUCCESS: u8 = 7;
const SYNC_FAILED: u8 = 8;
