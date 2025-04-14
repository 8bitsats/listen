const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 6969; // Matches the port in listen-interface config

// Middleware
app.use(cors());
app.use(express.json());

// Get list of examples
app.get('/examples', (req, res) => {
  try {
    const examplesDir = __dirname;
    const examples = fs.readdirSync(examplesDir)
      .filter(file => file.endsWith('.rs') && !file.startsWith('.'))
      .map(file => {
        const filePath = path.join(examplesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const description = content.includes('//') ? 
          content.split('//')[1].split('\n')[0].trim() : 
          'Rust example';
          
        return {
          id: path.basename(file, '.rs'),
          name: path.basename(file, '.rs')
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
          description,
          path: file
        };
      });
    
    res.json({ examples });
  } catch (error) {
    console.error('Error getting examples:', error);
    res.status(500).json({ error: 'Failed to get examples' });
  }
});

// Get source code for an example
app.get('/examples/source', (req, res) => {
  try {
    const { path: filePath } = req.query;
    
    if (!filePath || !filePath.endsWith('.rs')) {
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    const fullPath = path.join(__dirname, filePath);
    
    // Security check to prevent directory traversal
    if (!fullPath.startsWith(__dirname)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const source = fs.readFileSync(fullPath, 'utf8');
    res.json({ source });
  } catch (error) {
    console.error('Error getting source code:', error);
    res.status(500).json({ error: 'Failed to get source code' });
  }
});

// Run an example
app.post('/examples/run', (req, res) => {
  try {
    const { example_id } = req.body;
    
    if (!example_id) {
      return res.status(400).json({ error: 'Example ID is required' });
    }
    
    const examplePath = path.join(__dirname, `${example_id}.rs`);
    
    if (!fs.existsSync(examplePath)) {
      return res.status(404).json({ error: 'Example not found' });
    }
    
    // Run the example using cargo run
    const process = spawn('cargo', ['run', '--example', example_id], {
      cwd: path.join(__dirname, '..')
    });
    
    let output = '';
    let error = '';
    
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    process.on('close', (code) => {
      if (code !== 0) {
        console.error(`Example process exited with code ${code}`);
        return res.status(500).json({ error: error || 'Failed to run example' });
      }
      
      res.json({ output: output || 'Example ran successfully but produced no output' });
    });
  } catch (error) {
    console.error('Error running example:', error);
    res.status(500).json({ error: 'Failed to run example' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Example API server running on port ${PORT}`);
});
