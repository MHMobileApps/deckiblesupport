'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setError('Invalid credentials');
      return;
    }
    router.push('/tickets');
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form className="bg-white p-8 rounded shadow w-full max-w-sm" onSubmit={onSubmit}>
        <h1 className="text-xl font-semibold mb-4">Deckible Support Copilot</h1>
        <input className="border p-2 w-full mb-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="border p-2 w-full mb-3" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <button className="bg-blue-600 text-white px-4 py-2 rounded w-full">Log in</button>
      </form>
    </main>
  );
}
