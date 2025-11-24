import torch
import torch.nn as nn
import torch.optim as optim

tokens = list(" ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&/()=?¿¡+-*_{}[];:,.<>")
token_to_idx = {ch: i for i, ch in enumerate(tokens)}
idx_to_token = {i: ch for i, ch in enumerate(tokens)}

vocab_size = len(tokens)
embedding_dim = 32

class TokenEmbeddingNet(nn.Module):
    def __init__(self, vocab_size, embedding_dim):
        super().__init__()
        self.layer = nn.Linear(vocab_size, embedding_dim)

    def forward(self, x):
        return self.layer(x)

model = TokenEmbeddingNet(vocab_size, embedding_dim)
optimizer = optim.Adam(model.parameters(), lr=0.005)
criterion = nn.MSELoss()

inputs = torch.eye(vocab_size)
targets = torch.randn(vocab_size, embedding_dim)

for _ in range(800):
    optimizer.zero_grad()
    output = model(inputs)
    loss = criterion(output, targets)
    loss.backward()
    optimizer.step()

torch.save(model.state_dict(), "token_embedding.pth")

def get_embedding(token):
    idx = token_to_idx[token]
    one_hot = torch.zeros(1, vocab_size)
    one_hot[0, idx] = 1.0
    return model(one_hot)

embeddings = {ch: get_embedding(ch).detach() for ch in tokens}
torch.save(embeddings, "token_embeddings.pth")
