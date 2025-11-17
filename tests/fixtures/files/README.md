# Test Fixtures - Sample Files

This directory contains sample files for testing file upload functionality.

## Files

### Valid Files

**`valid-document.pdf`**
- Type: PDF document
- Size: ~500 bytes
- Purpose: Testing successful PDF upload
- Usage: Unit tests, integration tests

**`valid-image.jpg` (placeholder)**
- Type: JPEG image
- Size: Will be small test image
- Purpose: Testing image upload and preview
- Usage: Image upload tests

### Invalid Files

**`invalid-type.txt`**
- Type: Text file
- Purpose: Testing file type validation (should be rejected)
- Usage: Validation tests

**`too-large.bin` (to be generated)**
- Type: Binary file
- Size: > 10MB
- Purpose: Testing file size validation (should be rejected)
- Usage: Size limit tests

## Usage in Tests

```typescript
// Example usage in tests
import fs from 'fs';
import path from 'path';

// Load test file
const validPDF = fs.readFileSync(
  path.join(__dirname, '../fixtures/files/valid-document.pdf')
);

// Create File object for browser tests
const file = new File([validPDF], 'test.pdf', { type: 'application/pdf' });

// Use in test
await uploadFile(file);
```

## Generating Large Files

To generate a large file for testing:

```bash
# Create 11MB file (should fail validation)
dd if=/dev/zero of=tests/fixtures/files/too-large.bin bs=1M count=11

# Create 5MB file (should pass)
dd if=/dev/zero of=tests/fixtures/files/medium-file.pdf bs=1M count=5
```

## Notes

- All files are for testing purposes only
- Files are NOT real documents
- PDF files contain minimal valid PDF structure
- Images are placeholders for testing
- Do NOT use these files in production
