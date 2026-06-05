import React, {StrictMode, useState} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';

const apiUrl = `${import.meta.env.VITE_WORKER_URL || 'http://localhost:8787'}/generate`;

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

function ImagePlaceholder() {
  return (
    <svg className="placeholder-icon" aria-hidden="true" viewBox="0 0 64 64">
      <rect x="8" y="10" width="48" height="44" rx="4" />
      <circle cx="22" cy="25" r="5" />
      <path d="m13 47 13-13 9 9 6-6 10 10" />
    </svg>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canGenerate = prompt.trim().length > 0 && !isLoading;

  async function generateImage(event) {
    event.preventDefault();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || isLoading) return;

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({prompt: cleanPrompt}),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || 'Image generation failed.');
      if (!payload?.imageBase64) throw new Error('The server returned no image.');

      setImageUrl(`data:${payload.mimeType || 'image/png'};base64,${payload.imageBase64}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not generate the image.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="brand-header">
        <div className="brand">
          <img className="brand-logo" src="/logo.png" alt="Mobi Times logo" />
          <span>Mobi Times</span>
        </div>
        <span className="studio-badge">Web Studio</span>
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
            <button type="submit" disabled={!canGenerate}>
              {isLoading ? <span className="spinner" /> : <SparkleIcon />}
              <span>{isLoading ? 'Generating...' : 'Generate image'}</span>
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
            <span className={isLoading ? 'status active' : 'status'}>
              {isLoading ? 'Generating' : 'Ready'}
            </span>
          </header>

          <div className="canvas-body">
            <div className="image-frame">
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
