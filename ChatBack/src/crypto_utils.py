import hashlib
from Crypto.Cipher import AES

def derive_key(shared_secret: int):
    # shared_secret → SHA-256 → 32 bytes
    return hashlib.sha256(str(shared_secret).encode()).digest()

def encrypt_message(key, plaintext: str):
    cipher = AES.new(key, AES.MODE_CFB)
    ciphertext = cipher.iv + cipher.encrypt(plaintext.encode())
    return ciphertext.hex()

def decrypt_message(key, ciphertext_hex: str):
    data = bytes.fromhex(ciphertext_hex)
    iv = data[:16]
    cipher = AES.new(key, AES.MODE_CFB, iv=iv)
    return cipher.decrypt(data[16:]).decode()
