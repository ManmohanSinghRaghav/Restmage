/**
 * Test script to verify ML prediction endpoint
 * Run with: node test-ml-predict.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Testing ML Prediction Endpoint Logic...\n');

const testInput = {
  area: 1500,
  bedrooms: 3,
  bathrooms: 2,
  age: 5,
  location: 'Suburban',
  condition: 'Good',
  amenities: []
};

const scriptPath = path.join(__dirname, '..', 'PricePrediction', 'predict.py');
const py = spawn(process.env.PYTHON || 'python', [scriptPath]);

let stdout = '';
let stderr = '';

py.stdout.on('data', chunk => {
  stdout += chunk.toString();
});

py.stderr.on('data', chunk => {
  stderr += chunk.toString();
});

py.on('error', err => {
  console.error('❌ Failed to start python process:', err);
  process.exit(1);
});

py.on('close', code => {
  console.log(`Python process exited with code ${code}`);
  
  if (stderr) {
    console.log('\n⚠️  Python stderr output:');
    console.log(stderr);
  }

  if (code !== 0) {
    console.error('\n❌ Python prediction failed');
    process.exit(1);
  }

  try {
    const result = JSON.parse(stdout);
    
    if (result.error) {
      console.error('\n❌ Prediction error:', result);
      process.exit(1);
    }

    console.log('\n✅ Prediction successful!');
    console.log('Input:', JSON.stringify(testInput, null, 2));
    console.log('Output:', JSON.stringify(result, null, 2));
    
    if (result.predicted_price && result.predicted_price > 0) {
      console.log(`\n✅ ML Model returned valid price: ${result.symbol}${result.predicted_price.toFixed(2)}`);
    } else {
      console.log('\n⚠️  Warning: Price seems invalid');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Invalid JSON from python:', err);
    console.log('Raw output:', stdout);
    process.exit(1);
  }
});

// Send input
try {
  py.stdin.write(JSON.stringify(testInput));
  py.stdin.end();
  console.log('Input sent to Python script...');
} catch (err) {
  console.error('❌ Failed to write to python stdin:', err);
  process.exit(1);
}
