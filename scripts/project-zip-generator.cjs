const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

/**
 * Generate a ZIP file of the project's source code
 * @param {string} outputPath - Where to save the ZIP file
 * @param {string} sourceDir - Directory to zip
 * @param {Array<string>} excludeDirs - Directories to exclude from the zip
 */
function generateProjectZip(outputPath = './project-export.zip', sourceDir = '.', excludeDirs = ['node_modules', 'dist', '.git', 'uploads']) {
  return new Promise((resolve, reject) => {
    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create a file to stream archive data to
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level
    });

    // Listen for all archive data to be written
    output.on('close', function() {
      console.log(`Archive created successfully: ${outputPath}`);
      console.log(`Total bytes: ${archive.pointer()}`);
      resolve(outputPath);
    });

    // Handle warnings and errors
    archive.on('warning', function(err) {
      if (err.code === 'ENOENT') {
        console.warn('Warning during archiving:', err);
      } else {
        reject(err);
      }
    });

    archive.on('error', function(err) {
      reject(err);
    });

    // Pipe archive data to the file
    archive.pipe(output);

    // Filter function to exclude certain directories and files
    const filterFunc = (filePath) => {
      const relativePath = path.relative(sourceDir, filePath);
      
      // Skip excluded directories
      for (const dir of excludeDirs) {
        if (relativePath.startsWith(dir + path.sep) || relativePath === dir) {
          return false;
        }
      }
      
      // Skip hidden files and directories
      if (path.basename(filePath).startsWith('.')) {
        return false;
      }
      
      return true;
    };

    // Add directory contents to the archive
    archive.glob('**/*', {
      cwd: sourceDir,
      dot: false, // Include dotfiles
      filter: filterFunc
    });

    // Finalize the archive
    archive.finalize();
  });
}

module.exports = { generateProjectZip };

// If this file is run directly, execute the zip generation
if (require.main === module) {
  const outputPath = process.argv[2] || './project-export.zip';
  generateProjectZip(outputPath)
    .then(zipPath => console.log('Project export completed successfully:', zipPath))
    .catch(err => console.error('Error generating project export:', err));
}