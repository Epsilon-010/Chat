import hashlib
import secrets

# HASH SHA-256
def sha256(text: str):
    return hashlib.sha256(text.encode()).hexdigest()

# PARÁMETROS DH
P = 23  
G = 5

def generate_private_key():
    return secrets.randbelow(P)

def generate_public_key(private):
    return pow(G, private, P)

def compute_shared_key(other_public, private):
    return pow(other_public, private, P)
