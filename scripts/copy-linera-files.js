/**
 * Post-install script to copy Linera client files to public directory
 * This is necessary because the Linera client uses Web Workers and WASM files
 * that need to be served as static assets.
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'node_modules', '@linera', 'client', 'dist');
const targetDir = path.join(__dirname, '..', 'public', 'linera');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy all files from source to target
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`Warning: Source directory not found: ${src}`);
    return;
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  copyDir(sourceDir, targetDir);
  console.log('✓ Linera client files copied to public/linera/');
} catch (error) {
  console.error('Error copying Linera client files:', error);
  process.exit(1);
}
