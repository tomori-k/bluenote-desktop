use std::{
    pin::Pin,
    task::{Context, Poll},
};

use futures::FutureExt;
use tokio::io::ReadBuf;
use windows::Storage::Streams::{
    DataReader, DataReaderLoadOperation, IInputStream, InputStreamOptions,
};

// 一応実装したが、使うの一旦やめ
// 後々使うかも？

pub struct AsyncReader {
    reader: DataReader,
    load_operation: Option<DataReaderLoadOperation>,
}

impl AsyncReader {
    pub fn new(input_stream: &IInputStream) -> windows::core::Result<Self> {
        let reader = DataReader::CreateDataReader(input_stream)?;

        reader.SetInputStreamOptions(InputStreamOptions::ReadAhead)?;

        Ok(Self {
            reader,
            load_operation: None,
        })
    }
}

impl tokio::io::AsyncRead for AsyncReader {
    fn poll_read(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &mut ReadBuf<'_>,
    ) -> Poll<tokio::io::Result<()>> {
        let this = self.get_mut();

        let mut load_operation = match this.load_operation.take() {
            Some(v) => v,
            None => match this.reader.LoadAsync(1) {
                Ok(v) => v,
                Err(e) => {
                    return Poll::Ready(Err(std::io::Error::new(
                        std::io::ErrorKind::ConnectionAborted, // 適当
                        e,
                    )));
                }
            },
        };

        let result = match load_operation.poll_unpin(cx) {
            Poll::Ready(v) => {
                match v {
                    Ok(v) => {
                        let mut buffer = vec![0u8; v as usize];

                        match this.reader.ReadBytes(buffer.as_mut_slice()) {
                            Ok(_) => {
                                buf.put_slice(buffer.as_slice());
                            }
                            Err(e) => {
                                return Poll::Ready(Err(std::io::Error::new(
                                    std::io::ErrorKind::ConnectionAborted, // 適当
                                    e,
                                )));
                            }
                        }

                        Poll::Ready(Ok(()))
                    }
                    Err(e) => {
                        Poll::Ready(Err(std::io::Error::new(
                            std::io::ErrorKind::ConnectionAborted, // 適当
                            e,
                        )))
                    }
                }
            }
            Poll::Pending => Poll::Pending,
        };

        this.load_operation = match result {
            Poll::Ready(_) => None,
            Poll::Pending => Some(load_operation),
        };

        result
    }
}
