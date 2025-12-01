# src/crypto_utils.py
import hashlib
import secrets
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
import json
import base64

# primos pequeños iguales a los del cliente
DH_P = 101
DH_G = 2

def generate_server_keys():
    # private in range [2, p-2]
    private = secrets.randbelow(DH_P - 2) + 2
    public = pow(DH_G, private, DH_P)
    return private, public

def compute_shared_secret(server_private: int, client_public: int) -> int:
    return pow(client_public, server_private, DH_P)

def derive_aes_key(shared_secret: int) -> bytes:
    # convertir secreto (int) a bytes (representación decimal) y hashear
    return hashlib.sha256(str(shared_secret).encode()).digest()  # 32 bytes

def encrypt_message(key: bytes, plaintext: str) -> str:
    iv = get_random_bytes(12)  # 96-bit para GCM
    cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
    ct, tag = cipher.encrypt_and_digest(plaintext.encode("utf-8"))
    # Empaquetar iv, ct y tag en un objeto JSON
    obj = {
        "iv": list(iv),
        "data": list(ct),
        "tag": list(tag)
    }
    return base64.b64encode(json.dumps(obj).encode()).decode()

def decrypt_message(key: bytes, ciphertext_b64: str) -> str:
    obj = json.loads(base64.b64decode(ciphertext_b64).decode())
    iv = bytes(obj["iv"])
    ct = bytes(obj["data"])
    tag = bytes(obj["tag"])
    cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
    pt = cipher.decrypt_and_verify(ct, tag)
    return pt.decode("utf-8", errors="ignore")
