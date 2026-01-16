import dotenv from 'dotenv';
import path from 'path';

// Explicitly specify .env path
const envPath = path.resolve(__dirname, '..', '.env');
console.log('DEBUG: Looking for .env at:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('DEBUG: dotenv error:', result.error);
} else {
  console.log('DEBUG: dotenv loaded successfully');
  console.log('DEBUG: Parsed from .env file:', JSON.stringify(result.parsed, null, 2));
  console.log('DEBUG: LENCO vars after load:', Object.keys(process.env).filter(k => k.includes('LENCO')));
}

import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
