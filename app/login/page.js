'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Ticket, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modo, setModo] = useState('login'); // login | registro
  const [verPass, setVerPass] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    setCargando(true);
    setError(null);
    setMensaje(null);

    if (modo === 'registro') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMensaje('¡Cuenta creada! Revisa tu correo para confirmar.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError('Correo o contraseña incorrectos');
      else window.location.href = '/';
    }
    setCargando(false);
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-red-700 px-6 py-8 text-center">
          <Ticket className="text-white mx-auto mb-2" size={36} />
          <h1 className="text-white text-2xl font-bold">LotoCheck</h1>
          <p className="text-red-200 text-sm mt-1">Colombia</p>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setModo('login')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${modo === 'login' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setModo('registro')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${modo === 'registro' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
            >
              Registrarse
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={16} />
              <input
                type={verPass ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-9 pr-10 py-2.5 text-sm"
              />
              <button onClick={() => setVerPass(!verPass)} className="absolute right-3 top-3 text-gray-400">
                {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-600 text-xs text-center">{error}</p>}
          {mensaje && <p className="text-green-600 text-xs text-center">{mensaje}</p>}

          <button
            onClick={handleSubmit}
            disabled={cargando || !email || !password}
            className="w-full bg-red-700 text-white py-3 rounded-lg font-semibold text-sm hover:bg-red-800 transition-colors disabled:opacity-50"
          >
            {cargando ? 'Cargando...' : modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>

          <p className="text-center text-xs text-gray-400">
            Al registrarte aceptas los términos de uso
          </p>
        </div>
      </div>
    </div>
  );
}