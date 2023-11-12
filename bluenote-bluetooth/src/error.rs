/// Bluenote Error
#[derive(Debug)]
pub enum Error {
    WindowsError(windows::core::Error),
    IOError(tokio::io::Error),
    TimeoutError(tokio::time::error::Elapsed),
    SyncError(String),
}

impl From<windows::core::Error> for Error {
    fn from(e: windows::core::Error) -> Self {
        Self::WindowsError(e)
    }
}

impl From<tokio::io::Error> for Error {
    fn from(e: tokio::io::Error) -> Self {
        Self::IOError(e)
    }
}

impl From<tokio::time::error::Elapsed> for Error {
    fn from(e: tokio::time::error::Elapsed) -> Self {
        Self::TimeoutError(e)
    }
}

impl From<std::str::Utf8Error> for Error {
    fn from(e: std::str::Utf8Error) -> Self {
        Self::SyncError(format!("{}", e))
    }
}

// napi::Error への変換
impl From<Error> for napi::Error {
    fn from(e: Error) -> Self {
        napi::Error::new(napi::Status::GenericFailure, e)
    }
}

impl From<Error> for napi::JsError {
    fn from(e: Error) -> Self {
        e.into()
    }
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::WindowsError(_) => write!(f, "WindowsError"),
            Self::IOError(_) => write!(f, "IOError"),
            Self::TimeoutError(_) => write!(f, "Timeout Error"),
            Self::SyncError(_) => write!(f, "SyncError"),
        }
    }
}

impl std::error::Error for Error {}
