use std::{
    pin::Pin,
    task::{Context, Poll},
};

use futures::FutureExt;
use windows::{
    Foundation::IAsyncOperation,
    Storage::Streams::{DataWriter, DataWriterStoreOperation, IOutputStream},
};

// 一応実装したが、使うの一旦やめ
// 後々使うかも？

pub struct AsyncWriter {
    writer: DataWriter,
    store_operation: Option<DataWriterStoreOperation>,
    flush_operation: Option<IAsyncOperation<bool>>,
}

impl AsyncWriter {
    pub fn new(output_stream: &IOutputStream) -> windows::core::Result<Self> {
        let writer = DataWriter::CreateDataWriter(output_stream)?;
        Ok(Self {
            writer,
            store_operation: None,
            flush_operation: None,
        })
    }
}

impl tokio::io::AsyncWrite for AsyncWriter {
    fn poll_write(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &[u8],
    ) -> Poll<Result<usize, std::io::Error>> {
        let this = self.get_mut();

        let mut store_operation = match this.store_operation.take() {
            Some(v) => v,
            None => {
                match this.writer.WriteBytes(buf) {
                    Ok(_) => {}
                    Err(e) => {
                        return Poll::Ready(Err(std::io::Error::new(
                            std::io::ErrorKind::ConnectionAborted, // 適当
                            e,
                        )));
                    }
                };

                match this.writer.StoreAsync() {
                    Ok(v) => v,
                    Err(e) => {
                        return Poll::Ready(Err(std::io::Error::new(
                            std::io::ErrorKind::ConnectionAborted, // 適当
                            e,
                        )));
                    }
                }
            }
        };

        match store_operation.poll_unpin(cx) {
            Poll::Ready(v) => {
                match v {
                    Ok(v) => {
                        this.store_operation = None;
                        return Poll::Ready(Ok(v as usize));
                    }
                    Err(e) => {
                        return Poll::Ready(Err(std::io::Error::new(
                            std::io::ErrorKind::ConnectionAborted, // 適当
                            e,
                        )));
                    }
                }
            }
            Poll::Pending => {
                this.store_operation = Some(store_operation);
                return Poll::Pending;
            }
        };
    }

    fn poll_flush(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Result<(), std::io::Error>> {
        let this = self.get_mut();

        let mut flush_operation = match this.flush_operation.take() {
            Some(v) => v,
            None => match this.writer.FlushAsync() {
                Ok(v) => v,
                Err(e) => {
                    return Poll::Ready(Err(std::io::Error::new(
                        std::io::ErrorKind::ConnectionAborted, // 適当
                        e,
                    )));
                }
            },
        };

        match flush_operation.poll_unpin(cx) {
            Poll::Ready(v) => {
                match v {
                    Ok(_) => {
                        this.flush_operation = None;
                    }
                    Err(e) => {
                        return Poll::Ready(Err(std::io::Error::new(
                            std::io::ErrorKind::ConnectionAborted, // 適当
                            e,
                        )));
                    }
                }
            }
            Poll::Pending => {
                this.flush_operation = Some(flush_operation);
                return Poll::Pending;
            }
        };

        Poll::Ready(Ok(()))
    }

    fn poll_shutdown(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
    ) -> Poll<Result<(), std::io::Error>> {
        self.poll_flush(cx)
    }
}
