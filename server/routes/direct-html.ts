import express from 'express';
import path from 'path';

const router = express.Router();

// Explicitly serve the HTML test files
router.get('/branding-test', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'branding-settings-test.html'));
});

router.get('/logo-test', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'logo-upload-debug.html'));
});

router.get('/direct-logo-test', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'logo-direct-test.html'));
});

// Ensure we can serve the SVG directly through multiple paths
router.get('/icons/custom-checkmark-logo.svg', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'icons', 'custom-checkmark-logo.svg'));
});

// Also serve it at /custom-logo.svg for a simpler path
router.get('/custom-logo.svg', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'icons', 'custom-checkmark-logo.svg'));
});

// Add a test endpoint to confirm the SVG is accessible
router.get('/test-logo', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Logo Test</title>
      <style>
        body { font-family: Arial; max-width: 800px; margin: 0 auto; padding: 20px; }
        .logo-container { background: #19466B; padding: 20px; border-radius: 8px; margin: 20px 0; display: flex; justify-content: center; }
        img { max-height: 100px; }
      </style>
    </head>
    <body>
      <h1>Logo Test</h1>
      <div class="logo-container">
        <img src="/custom-logo.svg" alt="Custom Logo" />
      </div>
      <p>If you can see the logo above, the SVG is loading correctly.</p>
    </body>
    </html>
  `);
});

export default router;