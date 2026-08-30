import asyncio
import json
import logging
from typing import List, Optional

from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        self._loop = loop

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Active connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return

        payload = json.dumps(message)
        dead_connections = []

        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Failed to send message to client: {e}")
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)

    def broadcast_sync(self, message: dict):
        """
        Thread-safe method to broadcast from a synchronous background thread
        to the asyncio event loop managed by FastAPI.
        """
        if not self.active_connections or self._loop is None:
            return

        if self._loop.is_closed():
            logger.warning("Event loop is closed. Cannot broadcast message.")
            return

        asyncio.run_coroutine_threadsafe(self.broadcast(message), self._loop)

# Global instance to be imported by consumer and FastAPI app
manager = ConnectionManager()
