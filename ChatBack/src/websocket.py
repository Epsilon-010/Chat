from fastapi import WebSocket
from typing import Dict, List
from .crypto_utils import (
    generate_server_keys,
    compute_shared_secret,
    derive_aes_key,
    encrypt_message,
    decrypt_message,
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.allowed_users: Dict[str, bool] = {
            "ray": True,
            "emiliano": True,
            "agustin": True,
            "camila": True,
            "angel": True,
            "jesus": True,
        }
        # datos DH / AES por username (string lowercased)
        self.server_private: Dict[str, int] = {}
        self.aes_keys: Dict[str, bytes] = {}

    async def connect(self, websocket: WebSocket, username: str):
        await websocket.accept()
        websocket.username = username
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        user = getattr(websocket, "username", None)
        if user:
            uname = user.lower()
            self.server_private.pop(uname, None)
            self.aes_keys.pop(uname, None)

    async def send_json(self, ws: WebSocket, data: dict):
        await ws.send_json(data)

    async def broadcast(self, sender: str, plaintext: str):
        """
        Enviar 'plaintext' a todos.
        - Si destinatario está permitido => enviar plaintext.
        - Si destinatario NO lo está => cifrar con la key de ese usuario.
        - Si el destinatario es el mismo que el remitente => enviar texto plano.
        """
        for ws in self.active_connections:
            uname = getattr(ws, "username", "anon").lower()
            allowed = self.allowed_users.get(uname, False)
            key = self.aes_keys.get(uname)

            # Si el destinatario es el remitente, enviar texto plano (para que se vea su propio mensaje)
            if uname == sender.lower():
                await ws.send_json({
                    "type": "message", 
                    "sender": sender, 
                    "msg": plaintext
                })
            elif allowed:
                # destinatario permitido: enviar texto claro
                await ws.send_json({
                    "type": "message", 
                    "sender": sender, 
                    "msg": plaintext
                })
            else:
                # destinatario no permitido y no es el remitente
                if key:
                    try:
                        ct = encrypt_message(key, plaintext)
                        await ws.send_json({
                            "type": "message", 
                            "sender": sender, 
                            "msg": ct  # Envía el mensaje cifrado
                        })
                    except Exception as e:
                        print(f"Error cifrando para {uname}: {e}")
                        await ws.send_json({
                            "type": "system", 
                            "msg": "Error al cifrar mensaje"
                        })
                else:
                    # Si no hay clave, enviar aviso
                    await ws.send_json({
                        "type": "system", 
                        "msg": "Esperando negociación de clave..."
                    })

manager = ConnectionManager()