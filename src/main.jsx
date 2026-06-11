import React, {StrictMode, useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';

const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787';
const IMAGE_LIMIT = 5;
const RESET_CODE = '9539';

// ── Icons ─────────────────────────────────────────────────────────────────────

function SparkleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" />
      <path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
    </svg>
  );
}

function CanvasIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
      <path d="M17 14v6M14 17h6" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 3v13M7 11l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function ImagePlaceholder() {
  return (
    <svg className="placeholder-icon" aria-hidden="true" viewBox="0 0 64 64">
      <rect x="8" y="10" width="48" height="44" rx="4" />
      <circle cx="22" cy="25" r="5" />
      <path d="m13 47 13-13 9 9 6-6 10 10" />
    </svg>
  );
}

// ── Session helpers ───────────────────────────────────────────────────────────

function loadSession() {
  const token = localStorage.getItem('mobi_token');
  const exp = Number(localStorage.getItem('mobi_token_exp') || 0);
  if (token && exp && Date.now() < exp) return token;
  localStorage.removeItem('mobi_token');
  localStorage.removeItem('mobi_token_exp');
  return null;
}

function saveSession(token, exp) {
  localStorage.setItem('mobi_token', token);
  localStorage.setItem('mobi_token_exp', String(exp));
}

function clearSession() {
  localStorage.removeItem('mobi_token');
  localStorage.removeItem('mobi_token_exp');
}

// ── Image limit helpers ───────────────────────────────────────────────────────

function loadImageCount() {
  return Number(localStorage.getItem('mobi_image_count') || 0);
}

function saveImageCount(n) {
  localStorage.setItem('mobi_image_count', String(n));
}

function resetImageCount() {
  localStorage.setItem('mobi_image_count', '0');
}

// ── LoginPage ─────────────────────────────────────────────────────────────────

function LoginPage({error}) {
  function handleGoogleLogin() {
    window.location.href = `${WORKER_URL}/auth/login`;
  }

  const errorMessages = {
    not_allowed: 'Your Google account is not authorised to access this app.',
    token_exchange_failed: 'Authentication failed. Please try again.',
    no_email: 'Could not retrieve your email from Google. Please try again.',
    no_code: 'Authentication was cancelled. Please try again.',
  };

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="brand auth-brand">
          <img className="brand-logo" src={`${import.meta.env.BASE_URL}logo.png`} alt="Mobi Times logo" />
          <span>Mobi Times</span>
        </div>

        <p className="auth-desc">Sign in to access the AI image generator.</p>

        <button type="button" className="google-btn" onClick={handleGoogleLogin}>
          <GoogleIcon />
          <span>Sign in with Google</span>
        </button>

        {error && (
          <p className="error-banner" role="alert">
            {errorMessages[error] || 'Something went wrong. Please try again.'}
          </p>
        )}
      </div>
    </main>
  );
}

// ── ResetModal ────────────────────────────────────────────────────────────────

function ResetModal({onClose, onReset}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (code === RESET_CODE) {
      onReset();
      onClose();
    } else {
      setError('Incorrect code.');
      setCode('');
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Reset image limit</h2>
        <p>Enter the 4-digit reset code to generate more images.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="reset-code">Reset code</label>
            <input
              id="reset-code"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="••••"
              autoFocus
              required
            />
          </div>
          <button type="submit">Confirm</button>
        </form>
        {error && <p className="error-banner" role="alert">{error}</p>}
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const [token, setToken] = useState(() => loadSession());
  const [authError, setAuthError] = useState('');
  const [prompt, setPrompt] = useState('');
  const [orientation, setOrientation] = useState('square');
  const [imageUrl, setImageUrl] = useState('');
  const [imageMime, setImageMime] = useState('image/png');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageCount, setImageCount] = useState(() => loadImageCount());
  const [showResetModal, setShowResetModal] = useState(false);

  // Handle OAuth callback — token comes back as URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackToken = params.get('token');
    const callbackExp = params.get('exp');
    const callbackError = params.get('error');

    if (callbackToken && callbackExp) {
      saveSession(callbackToken, Number(callbackExp));
      setToken(callbackToken);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (callbackError) {
      setAuthError(callbackError);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  function handleLogout() {
    clearSession();
    setToken(null);
    setAuthError('');
  }

  async function handleReset() {
    try {
      await fetch(`${WORKER_URL}/reset-limit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // ignore — local reset still happens
    }
    resetImageCount();
    setImageCount(0);
  }

  if (!token) {
    return <LoginPage error={authError} />;
  }

  const limitReached = imageCount >= IMAGE_LIMIT;
  const canGenerate = prompt.trim().length > 0 && !isLoading && !limitReached;

  async function generateImage(event) {
    event.preventDefault();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || isLoading || limitReached) return;

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${WORKER_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({prompt: cleanPrompt, orientation}),
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const payload = await response.json().catch(() => null);

      if (response.status === 429 && payload?.limitReached) {
        const newCount = IMAGE_LIMIT;
        setImageCount(newCount);
        saveImageCount(newCount);
        throw new Error('Image limit reached. Use the reset button to continue.');
      }

      if (!response.ok) throw new Error(payload?.error || 'Image generation failed.');
      if (!payload?.imageBase64) throw new Error('The server returned no image.');

      const mime = payload.mimeType || 'image/png';
      setImageUrl(`data:${mime};base64,${payload.imageBase64}`);
      setImageMime(mime);

      const newCount = imageCount + 1;
      setImageCount(newCount);
      saveImageCount(newCount);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not generate the image.');
    } finally {
      setIsLoading(false);
    }
  }

  function downloadImage() {
    if (!imageUrl) return;
    const ext = imageMime === 'image/jpeg' ? 'jpg' : 'png';
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `mobi-image-${Date.now()}.${ext}`;
    a.click();
  }

  const orientations = [
    {value: 'square', label: 'Square'},
    {value: 'landscape', label: 'Landscape'},
    {value: 'portrait', label: 'Portrait'},
  ];

  return (
    <main className="app-shell">
      {showResetModal && (
        <ResetModal onClose={() => setShowResetModal(false)} onReset={handleReset} />
      )}

      <header className="brand-header">
        <div className="brand">
          <img className="brand-logo" src={`${import.meta.env.BASE_URL}logo.png`} alt="Mobi Times logo" />
          <span>Mobi Times</span>
        </div>
        <div className="header-right">
          <span className="image-counter">{imageCount}/{IMAGE_LIMIT} images</span>
          <button type="button" className="logout-btn" onClick={handleLogout}>
            Sign out
          </button>
          <span className="studio-badge">Web Studio</span>
        </div>
      </header>

      <section className="workspace">
        <aside className="prompt-panel">
          <div>
            <p className="eyebrow">AI image generator</p>
            <h1>Create an image</h1>
            <p className="intro">
              Describe your idea and generate a fresh visual with AI.
            </p>
          </div>

          <form className="prompt-form" onSubmit={generateImage}>
            <label htmlFor="prompt">Prompt</label>
            <textarea
              id="prompt"
              name="prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="A neon city skyline at midnight..."
              rows="6"
            />

            <div className="orientation-row">
              {orientations.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={`orientation-btn${orientation === o.value ? ' active' : ''}`}
                  onClick={() => setOrientation(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <button type="submit" disabled={!canGenerate}>
              {isLoading ? <span className="spinner" /> : <SparkleIcon />}
              <span>{isLoading ? 'Generating...' : 'Generate image'}</span>
            </button>

            <button type="button" className="reset-btn" onClick={() => setShowResetModal(true)}>
              {limitReached
                ? `Limit reached (${imageCount}/${IMAGE_LIMIT}) — Reset`
                : `Reset limit (${imageCount}/${IMAGE_LIMIT})`}
            </button>
          </form>

          {error && (
            <p className="error-banner" role="alert">
              {error}
            </p>
          )}
        </aside>

        <section className="canvas-panel" aria-label="Generated image canvas">
          <header className="canvas-header">
            <div className="canvas-title">
              <CanvasIcon />
              <span>Canvas</span>
            </div>
            <div className="canvas-header-right">
              <span className={isLoading ? 'status active' : 'status'}>
                {isLoading ? 'Generating' : 'Ready'}
              </span>
            </div>
          </header>

          <div className="canvas-body">
            <div className={`image-frame orientation-${orientation}`}>
              {imageUrl ? (
                <img src={imageUrl} alt={prompt.trim()} />
              ) : (
                <div className="placeholder">
                  <ImagePlaceholder />
                  <p>Your generated image will appear here</p>
                </div>
              )}
              {isLoading && (
                <div className="loading-overlay">
                  <span className="spinner large" />
                  <span>Creating your image</span>
                </div>
              )}
            </div>
          </div>

          {imageUrl && !isLoading && (
            <div className="canvas-footer">
              <button type="button" className="download-btn" onClick={downloadImage}>
                <DownloadIcon />
                <span>Download</span>
              </button>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
