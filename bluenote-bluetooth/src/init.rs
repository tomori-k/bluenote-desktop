pub mod client;
pub mod server;

use windows::{
    core::HSTRING,
    Storage::Streams::{ByteOrder, DataReader, DataWriter, IInputStream, IOutputStream},
};

async fn exchange_uuid(
    my_uuid: &str,
    input_stream: &IInputStream,
    output_stream: &IOutputStream,
) -> windows::core::Result<String> {
    let writer = DataWriter::CreateDataWriter(output_stream)?;
    let reader = DataReader::CreateDataReader(input_stream)?;

    writer.SetByteOrder(ByteOrder::LittleEndian)?;
    reader.SetByteOrder(ByteOrder::LittleEndian)?;

    let (send_result, uuid): (windows::core::Result<()>, windows::core::Result<String>) = futures::join!(
        async {
            // 自身のデバイスIDを送信
            writer.WriteString(&HSTRING::from(my_uuid))?;
            writer.StoreAsync()?.await?;
            writer.FlushAsync()?.await?;

            Ok(())
        },
        async {
            // 相手のデバイスの UUID を受信
            reader.LoadAsync(36)?.await?;
            Ok(reader.ReadString(36)?.to_string())
        }
    );

    send_result?;
    let uuid = uuid?;

    let (send_result, receive_result): (windows::core::Result<()>, windows::core::Result<()>) = futures::join!(
        async {
            // ACK 送信
            writer.WriteByte(0)?;
            writer.StoreAsync()?.await?;
            writer.FlushAsync()?.await?;
            Ok(())
        },
        async {
            // ACK 受信
            reader.LoadAsync(1)?.await?;
            reader.ReadByte()?;
            Ok(())
        }
    );

    send_result?;
    receive_result?;

    Ok(uuid)
}
