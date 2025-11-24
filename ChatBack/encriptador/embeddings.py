import torch
from red import tokens
import random

embeddings = torch.load("token_embeddings.pth")

char_a = random.choice(tokens)
char_b = random.choice(tokens)
key = embeddings[char_a] + embeddings[char_b]

def text_to_vector(text: str):
    message = []
    for char in text:
        emb = embeddings[char.upper()]
        hashed = emb + key
        message.append(hashed)
    return message

def vector_to_char(vec, key, embeddings):
    original = vec - key
    best_char = None
    best_dist = float("inf")

    for ch, emb in embeddings.items():
        dist = torch.norm(original - emb)
        if dist < best_dist:
            best_dist = dist
            best_char = ch

    return best_char

def vectors_to_text(vectors, key, embeddings):
    text = ""
    for v in vectors:
        text += vector_to_char(v, key, embeddings)
    return text

cipher = text_to_vector("Teexto de prueba con caracteres # % 90     espacios")
plain  = vectors_to_text(cipher, key, embeddings)

print(plain)










