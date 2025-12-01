import React, { useState } from "react";

interface LoginProps {
  onLogin: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Ingresa un nombre de usuario");
      return;
    }
    setError("");
    onLogin(username.trim());
  };

  return (
  <div className="min-h-screen flex items-center justify-center 
                  bg-gradient-to-br from-slate-100 to-slate-300">
    <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-sm 
                    border border-slate-200">
      <h1 className="text-3xl font-bold text-slate-800 mb-3 text-center">
        Bienvenido 👋
      </h1>
      <p className="text-slate-500 text-sm mb-6 text-center">
        Ingresa tu nombre para entrar al chat
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nombre de usuario
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 
                       focus:outline-none focus:ring-2 focus:ring-amber-400 
                       shadow-sm"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm font-medium">{error}</p>
        )}

        <button
          type="submit"
          className="w-full bg-amber-400 hover:bg-amber-500 text-white 
                     font-semibold py-2 rounded-lg transition-all shadow-md"
        >
          Entrar
        </button>
      </form>
    </div>
  </div>
);

};

export default Login;
