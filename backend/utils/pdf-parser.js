// Wrapper for pdf-parse to avoid serverless initialization issues
// The pdf-parse module tries to read test files during initialization
// when module.parent is null, which fails in Vercel's serverless environment

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Import the core parser directly, bypassing the problematic index.js wrapper
const Pdf = require('pdf-parse/lib/pdf-parse.js');

// Export as ES6 default export
export default Pdf;
