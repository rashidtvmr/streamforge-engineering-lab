import { useEffect, useState, type FormEvent } from 'react';
import { platformRequest, type SessionUser } from '../platform/client.ts';

export function AccountPanel() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [mode, setMode] = useState<'sign-in' | 'register'>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    platformRequest<{ user: SessionUser | null }>('/me', { signal: controller.signal })
      .then((result) => setUser(result.user))
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load account'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setSaving(true);
    try {
      const payload = mode === 'register' ? { name, email, password } : { email, password };
      const response = await platformRequest<{ user: SessionUser }>(mode === 'register' ? '/accounts' : '/session', { method: 'POST', body: payload });
      setUser(response.user);
      setPassword('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to sign in'); }
    finally { setSaving(false); }
  }

  async function signOut() {
    setSaving(true); setError('');
    try { await platformRequest('/session', { method: 'DELETE' }); setUser(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to sign out'); }
    finally { setSaving(false); }
  }

  return (
    <section className="account-panel" aria-label="Account">
      <p className="eyebrow">YOUR STREAMFORGE ACCOUNT</p>
      <h1>Account</h1>
      {loading && <p role="status">Checking session…</p>}
      {error && <p role="alert" className="form-error">{error}</p>}
      {!loading && user ? (
        <div className="account-card">
          <h2>Welcome, {user.name}</h2>
          <p>{user.email}</p>
          <p>Your session lives in an HttpOnly cookie. Your password is never stored in the browser.</p>
          <button type="button" onClick={signOut} disabled={saving}>Sign out</button>
        </div>
      ) : !loading && (
        <form className="account-form" onSubmit={(event) => { void submit(event); }}>
          <h2>{mode === 'register' ? 'Create an account' : 'Sign in to StreamForge'}</h2>
          {mode === 'register' && <label>Display name<input name="name" required minLength={1} maxLength={60} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} /></label>}
          <label>Email<input name="email" required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<input name="password" required type="password" minLength={10} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button type="submit" disabled={saving}>{saving ? 'Working…' : mode === 'register' ? 'Create account' : 'Sign in'}</button>
          <button type="button" className="subtle-link" onClick={() => { setMode(mode === 'register' ? 'sign-in' : 'register'); setError(''); }}>{mode === 'register' ? 'Already have an account? Sign in' : 'New here? Create an account'}</button>
        </form>
      )}
    </section>
  );
}
