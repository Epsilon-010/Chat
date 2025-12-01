from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from src.websocket import manager
from src.auth import (
    ALLOWED_USERS, sha256,
    generate_private_key, generate_public_key, compute_shared_key
)
from src.crypto_utils import encrypt_message, decrypt_message, derive_key

app = FastAPI()

clients_keys = {}  # websocket → AES key
clients_allowed = {}  # websocket → bool

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    # Paso 1: recibir username y valor DH del cliente
    query = websocket.query_params
    username = query.get("username")
    client_public = int(query.get("pub", "0"))

    # Paso 2: Generar clave DH del servidor
    server_private = generate_private_key()
    server_public = generate_public_key(server_private)

    # Enviar al cliente el public key del servidor
    await websocket.send_json({"server_pub": server_public})

    # Paso 3: Calcular clave compartida
    shared_secret = compute_shared_key(client_public, server_private)
    key = derive_key(shared_secret)
    clients_keys[websocket] = key

    # Verificar si usuario es permitido
    clients_allowed[websocket] = username in ALLOWED_USERS

    await manager.connect(websocket)

    try:
        # Mensaje de inicio
        await manager.broadcast(f"🔵 {username} se unió", websocket)

        while True:
            ciphertext = await websocket.receive_text()
            key = clients_keys[websocket]
            allowed = clients_allowed[websocket]

            if allowed:
                # Usuario permitido envía texto en claro cifrado → Servidor descifra
                plaintext = decrypt_message(key, ciphertext)
            else:
                # Usuario no permitido → NO DESCIFRAMOS
                plaintext = f"[ENCRYPTED]{ciphertext}"

            # Ahora enviamos a cada cliente según su tipo
            for ws in manager.active_connections:
                dest_key = clients_keys[ws]
                dest_allowed = clients_allowed[ws]

                if dest_allowed:
                    # Destinatario permitido → recibe en claro
                    await ws.send_text(f"{username}: {plaintext}")
                else:
                    # Destinatario NO permitido → ciframos
                    encrypted = encrypt_message(dest_key, plaintext)
                    await ws.send_text(encrypted)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"🔴 {username} salió", websocket)
