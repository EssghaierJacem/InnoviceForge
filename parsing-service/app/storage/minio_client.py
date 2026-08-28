import asyncio
from urllib.parse import urlparse

from minio import Minio


class MinioFileStore:
    def __init__(self, url: str, access_key: str, secret_key: str, bucket: str):
        parsed = urlparse(url)
        endpoint = parsed.netloc or parsed.path  # tolerate "host:port" with no scheme
        self._client = Minio(
            endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=parsed.scheme == "https",
        )
        self._bucket = bucket

    async def fetch(self, file_key: str) -> tuple[bytes, str]:
        return await asyncio.to_thread(self._fetch_sync, file_key)

    def _fetch_sync(self, file_key: str) -> tuple[bytes, str]:
        response = self._client.get_object(self._bucket, file_key)
        try:
            content = response.read()
            mime_type = response.headers.get("Content-Type", "application/octet-stream")
            return content, mime_type
        finally:
            response.close()
            response.release_conn()
