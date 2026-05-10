import { LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { ADMIN_SESSION_KEY, getConfiguredAdminPassword } from '../utils/adminAuth.js';

export default function AdminLogin({ onAuthenticated }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();

    if (password === getConfiguredAdminPassword()) {
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      setError('');
      onAuthenticated?.();
      return;
    }

    setError('Invalid admin password.');
  }

  return (
    <section className="admin-login" aria-labelledby="admin-login-title">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <span className="admin-login-icon"><LockKeyhole size={28} /></span>
        <p className="eyebrow">Private admin area</p>
        <h1 id="admin-login-title">Admin login required</h1>
        <p>Product editors, analytics, import tools, and automation controls are hidden from the public homepage.</p>
        <label htmlFor="admin-password">
          Admin password
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Enter admin password"
          />
        </label>
        {error && <strong className="admin-login-error" role="alert">{error}</strong>}
        <button type="submit">Unlock admin panel</button>
      </form>
    </section>
  );
}
