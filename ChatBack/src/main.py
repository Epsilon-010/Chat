from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from src.websocket import manager 
from src.crypto_utils import generate_server_keys, compute_shared_secret, derive_aes_key
import logging

logging.basicConfig(level=logging.DEBUG)

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, username: str):
    await manager.connect(websocket, username)

    # El servidor genera su par Diffie‐Hellman
    B, server_priv = generate_server_keys()
    uname = username.lower()

    # Guardamos la clave privada temporal del servidor
    manager.server_private[uname] = server_priv

    # Enviamos B al cliente
    await manager.send_json(websocket, {
        "type": "server_pub",
        "value": B
    })

    try:
        while True:
            data = await websocket.receive_json()

            if data["type"] == "client_pub":
                Apub = int(data["value"])  # clave pública del cliente

                # Cálculo del secreto compartido
                priv = manager.server_private[uname]
                shared = compute_shared_secret(priv, Apub) 

                # Derivar la clave AES y almacenarla
                aes_key = derive_aes_key(shared)
                manager.aes_keys[uname] = aes_key

                # Enviar permisos al cliente
                allowed = manager.allowed_users.get(uname, False)
                await manager.send_json(websocket, {
                    "type": "perm",
                    "allowed": allowed
                })

            elif data["type"] == "msg":
                message_text = data.get("msg", "")
                # Difundir mensaje a todos
                await manager.broadcast(username, message_text)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logging.error(f"Error en WebSocket: {e}")
        manager.disconnect(websocket)