# Testing Plan - Sistem Sidang Workflow

## Daftar Isi
1. [Testing Strategy Overview](#testing-strategy-overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Unit Testing Plan](#unit-testing-plan)
4. [Integration Testing Plan](#integration-testing-plan)
5. [End-to-End Testing Plan](#end-to-end-testing-plan)
6. [Manual Testing Checklist](#manual-testing-checklist)
7. [Security Testing](#security-testing)
8. [Performance Testing](#performance-testing)
9. [Accessibility Testing](#accessibility-testing)
10. [Test Data & Test Users](#test-data--test-users)

---

## Testing Strategy Overview

### Testing Pyramid

```
        /\
       /  \        E2E Tests (10%)
      /____\       - Critical user journeys
     /      \      - Full workflow testing
    /        \
   /  Integ.  \    Integration Tests (30%)
  /____________\   - API endpoints
 /              \  - Database operations
/   Unit Tests   \ Unit Tests (60%)
\________________/ - Components
                   - Utilities
                   - Business logic
```

### Testing Types

| Type | Tools | Coverage Target | Priority |
|------|-------|-----------------|----------|
| **Unit** | Jest, React Testing Library | 80%+ | High |
| **Integration** | Jest, Supertest | 70%+ | High |
| **E2E** | Playwright/Cypress | Critical paths | Medium |
| **Manual** | Checklist | All features | High |
| **Security** | OWASP ZAP, Manual | All endpoints | High |
| **Performance** | Lighthouse, k6 | Load scenarios | Medium |
| **Accessibility** | axe-core, Manual | WCAG 2.1 AA | Medium |

### Test Environments

```
Development → Staging → Production
    ↓            ↓           ↓
  Unit Tests   Integration  Smoke Tests
  Integration  E2E Tests    Monitoring
               UAT
```

---

## Test Environment Setup

### Prerequisites

```bash
# Install dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event
npm install --save-dev @playwright/test
npm install --save-dev supertest
npm install --save-dev @axe-core/react

# Setup test database
createdb regist_sidang_test
```

### Configuration Files

**jest.config.js**:
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80,
    },
  },
};
```

**playwright.config.ts**:
```typescript
export default {
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'webkit' },
  ],
};
```

### Test Database Seed

```typescript
// tests/seed.ts
export async function seedTestData() {
  // Clear existing data
  await prisma.revisiNote.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.requirementFulfillment.deleteMany();
  await prisma.request.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.workflowStep.deleteMany();
  await prisma.user.deleteMany();
  await prisma.sidangType.deleteMany();

  // Create test users
  const admin = await prisma.user.create({
    data: {
      email: 'test.admin@test.com',
      password: await bcrypt.hash('test123', 10),
      name: 'Test Admin',
      role: 'admin',
    },
  });

  const mahasiswa = await prisma.user.create({
    data: {
      email: 'test.mhs@test.com',
      password: await bcrypt.hash('test123', 10),
      name: 'Test Mahasiswa',
      role: 'mahasiswa',
      nim: '12345678',
    },
  });

  // ... seed other data
}
```

---

## Unit Testing Plan

### 1. Component Testing

#### A. EmptyState Component

**File**: `src/components/EmptyState.test.tsx`

```typescript
describe('EmptyState Component', () => {
  test('renders icon, title and description', () => {
    render(
      <EmptyState
        icon="📭"
        title="No data"
        description="Description text"
      />
    );
    expect(screen.getByText('📭')).toBeInTheDocument();
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  test('renders action button with href', () => {
    render(
      <EmptyState
        icon="📭"
        title="No data"
        action={{ label: 'Click me', href: '/test' }}
      />
    );
    const link = screen.getByRole('link', { name: 'Click me' });
    expect(link).toHaveAttribute('href', '/test');
  });

  test('renders action button with onClick', () => {
    const handleClick = jest.fn();
    render(
      <EmptyState
        icon="📭"
        title="No data"
        action={{ label: 'Click me', onClick: handleClick }}
      />
    );
    const button = screen.getByRole('button', { name: 'Click me' });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('renders without action button', () => {
    render(<EmptyState icon="📭" title="No data" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  test('icon has bounce animation class', () => {
    const { container } = render(
      <EmptyState icon="📭" title="No data" />
    );
    const iconElement = container.querySelector('.animate-bounce');
    expect(iconElement).toBeInTheDocument();
  });
});
```

**Test Cases**: 5
**Priority**: Medium
**Coverage Target**: 100%

---

#### B. ConfirmDialog Component

**File**: `src/components/ConfirmDialog.test.tsx`

```typescript
describe('ConfirmDialog Component', () => {
  test('does not render when isOpen is false', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="Delete"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  test('renders when isOpen is true', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  test('calls onConfirm when confirm button clicked', () => {
    const onConfirm = jest.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete"
        message="Are you sure?"
        confirmText="Yes, Delete"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText('Yes, Delete'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('calls onCancel when cancel button clicked', () => {
    const onCancel = jest.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByText('Batal'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('applies correct color class based on confirmColor', () => {
    const { rerender } = render(
      <ConfirmDialog
        isOpen={true}
        title="Delete"
        message="Test"
        confirmColor="error"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByText('Konfirmasi')).toHaveClass('btn-error');

    rerender(
      <ConfirmDialog
        isOpen={true}
        title="Delete"
        message="Test"
        confirmColor="warning"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByText('Konfirmasi')).toHaveClass('btn-warning');
  });

  test('custom button text is displayed', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete"
        message="Test"
        confirmText="Custom Confirm"
        cancelText="Custom Cancel"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByText('Custom Confirm')).toBeInTheDocument();
    expect(screen.getByText('Custom Cancel')).toBeInTheDocument();
  });
});
```

**Test Cases**: 6
**Priority**: High
**Coverage Target**: 100%

---

#### C. FileUploadWithPreview Component

**File**: `src/components/FileUploadWithPreview.test.tsx`

```typescript
describe('FileUploadWithPreview Component', () => {
  test('renders drop zone when no file selected', () => {
    render(
      <FileUploadWithPreview
        onFileSelect={jest.fn()}
        label="Upload File"
      />
    );
    expect(screen.getByText(/drag & drop file/i)).toBeInTheDocument();
  });

  test('calls onFileSelect when file is selected via input', () => {
    const onFileSelect = jest.fn();
    render(<FileUploadWithPreview onFileSelect={onFileSelect} />);

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByRole('input', { hidden: true });

    fireEvent.change(input, { target: { files: [file] } });
    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  test('shows error for file too large', () => {
    render(
      <FileUploadWithPreview
        onFileSelect={jest.fn()}
        maxSize={1} // 1MB
      />
    );

    const largeFile = new File(['a'.repeat(2 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    });
    const input = screen.getByRole('input', { hidden: true });

    fireEvent.change(input, { target: { files: [largeFile] } });
    // Toast error should be called
  });

  test('displays file preview for current file', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    render(
      <FileUploadWithPreview
        onFileSelect={jest.fn()}
        currentFile={file}
      />
    );
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
  });

  test('displays correct file icon based on extension', () => {
    const pdfFile = new File([''], 'doc.pdf', { type: 'application/pdf' });
    const { rerender } = render(
      <FileUploadWithPreview onFileSelect={jest.fn()} currentFile={pdfFile} />
    );
    expect(screen.getByText('📄')).toBeInTheDocument();

    const docFile = new File([''], 'doc.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    rerender(
      <FileUploadWithPreview onFileSelect={jest.fn()} currentFile={docFile} />
    );
    expect(screen.getByText('📝')).toBeInTheDocument();
  });

  test('remove button clears file', () => {
    const onFileSelect = jest.fn();
    const file = new File([''], 'test.pdf', { type: 'application/pdf' });
    render(
      <FileUploadWithPreview onFileSelect={onFileSelect} currentFile={file} />
    );

    const removeButton = screen.getByTitle('Hapus file');
    fireEvent.click(removeButton);
    expect(onFileSelect).toHaveBeenCalledWith(null);
  });

  test('shows image preview for image files', async () => {
    const imageFile = new File([''], 'image.jpg', { type: 'image/jpeg' });
    Object.defineProperty(imageFile, 'size', { value: 1024 });

    const onFileSelect = jest.fn();
    render(<FileUploadWithPreview onFileSelect={onFileSelect} />);

    const input = screen.getByRole('input', { hidden: true });
    fireEvent.change(input, { target: { files: [imageFile] } });

    // Preview should be generated
    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  test('drag over changes visual state', () => {
    const { container } = render(
      <FileUploadWithPreview onFileSelect={jest.fn()} />
    );

    const dropZone = container.querySelector('.cursor-pointer');
    fireEvent.dragOver(dropZone);

    expect(screen.getByText('Drop file di sini')).toBeInTheDocument();
  });

  test('drag leave reverts visual state', () => {
    const { container } = render(
      <FileUploadWithPreview onFileSelect={jest.fn()} />
    );

    const dropZone = container.querySelector('.cursor-pointer');
    fireEvent.dragOver(dropZone);
    fireEvent.dragLeave(dropZone);

    expect(screen.getByText(/drag & drop file atau klik/i)).toBeInTheDocument();
  });
});
```

**Test Cases**: 9
**Priority**: High
**Coverage Target**: 90%

---

#### D. LoadingSkeleton Components

**File**: `src/components/LoadingSkeleton.test.tsx`

```typescript
describe('LoadingSkeleton Components', () => {
  describe('TableSkeleton', () => {
    test('renders correct number of rows', () => {
      const { container } = render(<TableSkeleton rows={5} />);
      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(5);
    });

    test('renders default 5 rows when rows prop not provided', () => {
      const { container } = render(<TableSkeleton />);
      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(5);
    });

    test('has pulse animation class', () => {
      const { container } = render(<TableSkeleton />);
      const animatedElements = container.querySelectorAll('.animate-pulse');
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });

  describe('CardSkeleton', () => {
    test('renders correct number of cards', () => {
      const { container } = render(<CardSkeleton count={3} />);
      const cards = container.querySelectorAll('.card');
      expect(cards).toHaveLength(3);
    });

    test('has pulse animation', () => {
      const { container } = render(<CardSkeleton />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('StatsSkeleton', () => {
    test('renders 4 stat cards', () => {
      const { container } = render(<StatsSkeleton />);
      const stats = container.querySelectorAll('.stat');
      expect(stats).toHaveLength(4);
    });

    test('uses grid layout', () => {
      const { container } = render(<StatsSkeleton />);
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-2', 'md:grid-cols-4');
    });
  });

  describe('TimelineSkeleton', () => {
    test('renders correct number of timeline items', () => {
      const { container } = render(<TimelineSkeleton items={5} />);
      const items = container.querySelectorAll('.flex.gap-3');
      expect(items).toHaveLength(5);
    });

    test('default renders 3 items', () => {
      const { container } = render(<TimelineSkeleton />);
      const items = container.querySelectorAll('.flex.gap-3');
      expect(items).toHaveLength(3);
    });
  });
});
```

**Test Cases**: 8
**Priority**: Low
**Coverage Target**: 80%

---

### 2. Utility Function Testing

#### A. Date Utils

**File**: `src/lib/dateUtils.test.ts`

```typescript
describe('dateUtils', () => {
  describe('getRelativeTime', () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-17T12:00:00'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    test('returns "Baru saja" for < 1 minute', () => {
      const date = new Date('2025-01-17T11:59:30');
      expect(getRelativeTime(date)).toBe('Baru saja');
    });

    test('returns minutes for < 1 hour', () => {
      const date = new Date('2025-01-17T11:45:00');
      expect(getRelativeTime(date)).toBe('15 menit yang lalu');
    });

    test('returns hours for < 1 day', () => {
      const date = new Date('2025-01-17T09:00:00');
      expect(getRelativeTime(date)).toBe('3 jam yang lalu');
    });

    test('returns days for < 1 week', () => {
      const date = new Date('2025-01-15T12:00:00');
      expect(getRelativeTime(date)).toBe('2 hari yang lalu');
    });

    test('returns weeks for < 1 month', () => {
      const date = new Date('2025-01-03T12:00:00');
      expect(getRelativeTime(date)).toBe('2 minggu yang lalu');
    });

    test('returns months for < 1 year', () => {
      const date = new Date('2024-11-17T12:00:00');
      expect(getRelativeTime(date)).toBe('2 bulan yang lalu');
    });

    test('returns years for >= 1 year', () => {
      const date = new Date('2023-01-17T12:00:00');
      expect(getRelativeTime(date)).toBe('2 tahun yang lalu');
    });

    test('handles string dates', () => {
      const dateString = '2025-01-17T11:45:00';
      expect(getRelativeTime(dateString)).toBe('15 menit yang lalu');
    });
  });

  describe('formatDateWithRelative', () => {
    test('returns both relative and absolute dates', () => {
      const date = new Date('2025-01-17T10:00:00');
      const result = formatDateWithRelative(date);

      expect(result.relative).toBeTruthy();
      expect(result.absolute).toBeTruthy();
      expect(result.absolute).toContain('Januari');
      expect(result.absolute).toContain('2025');
    });
  });

  describe('formatDate', () => {
    test('formats date in Indonesian short format', () => {
      const date = new Date('2025-01-17');
      const formatted = formatDate(date);

      expect(formatted).toContain('Jan');
      expect(formatted).toContain('2025');
      expect(formatted).toContain('17');
    });
  });
});
```

**Test Cases**: 11
**Priority**: High
**Coverage Target**: 100%

---

#### B. Toast Utils

**File**: `src/lib/toast.test.ts`

```typescript
import toast from 'react-hot-toast';
import { showSuccess, showError, showLoading, showInfo } from './toast';

jest.mock('react-hot-toast');

describe('toast utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('showSuccess calls toast.success with message', () => {
    showSuccess('Test success');
    expect(toast.success).toHaveBeenCalledWith('Test success', expect.any(Object));
  });

  test('showSuccess sets green background', () => {
    showSuccess('Test');
    const options = (toast.success as jest.Mock).mock.calls[0][1];
    expect(options.style.background).toBe('#10B981');
  });

  test('showError calls toast.error with message', () => {
    showError('Test error');
    expect(toast.error).toHaveBeenCalledWith('Test error', expect.any(Object));
  });

  test('showError sets red background', () => {
    showError('Test');
    const options = (toast.error as jest.Mock).mock.calls[0][1];
    expect(options.style.background).toBe('#EF4444');
  });

  test('showLoading calls toast.loading', () => {
    showLoading('Loading...');
    expect(toast.loading).toHaveBeenCalledWith('Loading...');
  });

  test('showInfo calls toast with custom icon', () => {
    showInfo('Info message');
    expect(toast).toHaveBeenCalledWith('Info message', expect.objectContaining({
      icon: 'ℹ️',
    }));
  });

  test('toast durations are correctly set', () => {
    showSuccess('Test');
    expect((toast.success as jest.Mock).mock.calls[0][1].duration).toBe(3000);

    showError('Test');
    expect((toast.error as jest.Mock).mock.calls[0][1].duration).toBe(4000);
  });
});
```

**Test Cases**: 7
**Priority**: Medium
**Coverage Target**: 100%

---

### 3. Hook Testing

#### A. useKeyboardShortcut Hook

**File**: `src/hooks/useKeyboardShortcut.test.ts`

```typescript
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcut } from './useKeyboardShortcut';

describe('useKeyboardShortcut', () => {
  test('calls callback when matching key is pressed', () => {
    const callback = jest.fn();
    renderHook(() =>
      useKeyboardShortcut([
        { key: 'k', ctrlKey: true, callback },
      ])
    );

    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
    window.dispatchEvent(event);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('does not call callback when different key pressed', () => {
    const callback = jest.fn();
    renderHook(() =>
      useKeyboardShortcut([
        { key: 'k', ctrlKey: true, callback },
      ])
    );

    const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
    window.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
  });

  test('does not call callback when modifier key does not match', () => {
    const callback = jest.fn();
    renderHook(() =>
      useKeyboardShortcut([
        { key: 'k', ctrlKey: true, callback },
      ])
    );

    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: false });
    window.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
  });

  test('does not trigger in input fields', () => {
    const callback = jest.fn();
    renderHook(() =>
      useKeyboardShortcut([
        { key: 'a', callback },
      ])
    );

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    input.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  test('Ctrl+K works even in input fields', () => {
    const callback = jest.fn();
    renderHook(() =>
      useKeyboardShortcut([
        { key: 'k', ctrlKey: true, callback },
      ])
    );

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: input, enumerable: true });
    window.dispatchEvent(event);

    expect(callback).toHaveBeenCalled();
    document.body.removeChild(input);
  });

  test('cleanup removes event listener', () => {
    const callback = jest.fn();
    const { unmount } = renderHook(() =>
      useKeyboardShortcut([
        { key: 'k', callback },
      ])
    );

    unmount();

    const event = new KeyboardEvent('keydown', { key: 'k' });
    window.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
  });
});
```

**Test Cases**: 6
**Priority**: High
**Coverage Target**: 90%

---

#### B. useConfirm Hook

**File**: `src/components/ConfirmDialog.test.tsx` (continued)

```typescript
describe('useConfirm hook', () => {
  test('returns confirm function and component', () => {
    const { result } = renderHook(() => useConfirm());
    expect(result.current.confirm).toBeInstanceOf(Function);
    expect(result.current.ConfirmDialogComponent).toBeDefined();
  });

  test('confirm returns promise that resolves to true on confirm', async () => {
    const { result } = renderHook(() => useConfirm());

    const confirmPromise = result.current.confirm({
      title: 'Test',
      message: 'Test message',
    });

    // Simulate confirm button click
    await act(async () => {
      const confirmButton = await screen.findByText('Konfirmasi');
      fireEvent.click(confirmButton);
    });

    const confirmed = await confirmPromise;
    expect(confirmed).toBe(true);
  });

  test('closing dialog resolves promise to undefined', async () => {
    const { result } = renderHook(() => useConfirm());

    const confirmPromise = result.current.confirm({
      title: 'Test',
      message: 'Test message',
    });

    await act(async () => {
      const cancelButton = await screen.findByText('Batal');
      fireEvent.click(cancelButton);
    });

    const confirmed = await confirmPromise;
    expect(confirmed).toBeUndefined();
  });
});
```

**Test Cases**: 3
**Priority**: High
**Coverage Target**: 85%

---

## Integration Testing Plan

### 1. API Endpoints Testing

#### A. Authentication API

**File**: `tests/integration/auth.test.ts`

```typescript
import { POST } from '@/app/api/auth/[...nextauth]/route';

describe('POST /api/auth/signin', () => {
  test('returns session for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/callback/credentials')
      .send({
        email: 'test.admin@test.com',
        password: 'test123',
      });

    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty('email');
    expect(res.body.user).toHaveProperty('role');
  });

  test('returns error for invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/callback/credentials')
      .send({
        email: 'test@test.com',
        password: 'wrong',
      });

    expect(res.status).toBe(401);
  });

  test('returns error for non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/callback/credentials')
      .send({
        email: 'nonexistent@test.com',
        password: 'test123',
      });

    expect(res.status).toBe(401);
  });
});
```

**Test Cases**: 3
**Priority**: Critical

---

#### B. Workflow Steps API

**File**: `tests/integration/workflow-steps.test.ts`

```typescript
describe('GET /api/workflow-steps', () => {
  test('returns workflow steps for sidang type', async () => {
    const res = await request(app)
      .get('/api/workflow-steps?sidangTypeId=1')
      .set('Cookie', adminSession);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('stepOrder');
    expect(res.body[0]).toHaveProperty('role');
  });

  test('returns steps sorted by stepOrder', async () => {
    const res = await request(app)
      .get('/api/workflow-steps?sidangTypeId=1')
      .set('Cookie', adminSession);

    const stepOrders = res.body.map((s: any) => s.stepOrder);
    const sorted = [...stepOrders].sort((a, b) => a - b);
    expect(stepOrders).toEqual(sorted);
  });

  test('requires authentication', async () => {
    const res = await request(app)
      .get('/api/workflow-steps?sidangTypeId=1');

    expect(res.status).toBe(401);
  });
});

describe('POST /api/workflow-steps', () => {
  test('creates new workflow step', async () => {
    const res = await request(app)
      .post('/api/workflow-steps')
      .set('Cookie', adminSession)
      .send({
        sidangTypeId: 1,
        role: 'dosen_pembimbing_3',
        description: 'Third supervisor',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.role).toBe('dosen_pembimbing_3');
  });

  test('auto-increments stepOrder', async () => {
    // Create first step
    const res1 = await request(app)
      .post('/api/workflow-steps')
      .set('Cookie', adminSession)
      .send({ sidangTypeId: 2, role: 'dosen_1' });

    expect(res1.body.stepOrder).toBe(1);

    // Create second step
    const res2 = await request(app)
      .post('/api/workflow-steps')
      .set('Cookie', adminSession)
      .send({ sidangTypeId: 2, role: 'dosen_2' });

    expect(res2.body.stepOrder).toBe(2);
  });

  test('requires admin role', async () => {
    const res = await request(app)
      .post('/api/workflow-steps')
      .set('Cookie', dosenSession)
      .send({ sidangTypeId: 1, role: 'test' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/workflow-steps/:id', () => {
  test('deletes workflow step', async () => {
    const step = await prisma.workflowStep.create({
      data: { sidangTypeId: 1, stepOrder: 99, role: 'test' },
    });

    const res = await request(app)
      .delete(`/api/workflow-steps/${step.id}`)
      .set('Cookie', adminSession);

    expect(res.status).toBe(200);

    const deleted = await prisma.workflowStep.findUnique({
      where: { id: step.id },
    });
    expect(deleted).toBeNull();
  });

  test('requires admin role', async () => {
    const res = await request(app)
      .delete('/api/workflow-steps/1')
      .set('Cookie', mahasiswaSession);

    expect(res.status).toBe(403);
  });
});
```

**Test Cases**: 7
**Priority**: High

---

#### C. Requirements API

**File**: `tests/integration/requirements.test.ts`

```typescript
describe('GET /api/requirements', () => {
  test('returns requirements filtered by sidangType and role', async () => {
    const res = await request(app)
      .get('/api/requirements?sidangTypeId=1&role=akademik')
      .set('Cookie', akademikSession);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((req: any) => {
      expect(req.sidangTypeId).toBe(1);
      expect(req.role).toBe('akademik');
    });
  });

  test('GET /api/requirements/all returns all requirements', async () => {
    const res = await request(app)
      .get('/api/requirements/all?sidangTypeId=1')
      .set('Cookie', mahasiswaSession);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Should include requirements from all roles
  });
});

describe('POST /api/requirements', () => {
  test('creates new requirement', async () => {
    const res = await request(app)
      .post('/api/requirements')
      .set('Cookie', akademikSession)
      .send({
        role: 'akademik',
        sidangTypeId: 1,
        name: 'Test Requirement',
        description: 'Test description',
        needsFile: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Test Requirement');
    expect(res.body.needsFile).toBe(true);
  });

  test('requires akademik or admin role', async () => {
    const res = await request(app)
      .post('/api/requirements')
      .set('Cookie', mahasiswaSession)
      .send({
        role: 'akademik',
        sidangTypeId: 1,
        name: 'Test',
      });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/requirements/:id', () => {
  test('deletes requirement', async () => {
    const req = await prisma.requirement.create({
      data: {
        role: 'akademik',
        sidangTypeId: 1,
        name: 'To Delete',
        needsFile: false,
      },
    });

    const res = await request(app)
      .delete(`/api/requirements/${req.id}`)
      .set('Cookie', akademikSession);

    expect(res.status).toBe(200);

    const deleted = await prisma.requirement.findUnique({
      where: { id: req.id },
    });
    expect(deleted).toBeNull();
  });
});
```

**Test Cases**: 5
**Priority**: High

---

#### D. Requests API

**File**: `tests/integration/requests.test.ts`

```typescript
describe('POST /api/requests', () => {
  test('creates new request with first workflow step', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('Cookie', mahasiswaSession)
      .send({ sidangTypeId: 1 });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pending');
    expect(res.body.currentStepId).toBeDefined();
    expect(res.body.mahasiswaId).toBe(testMahasiswa.id);
  });

  test('requires mahasiswa role', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('Cookie', dosenSession)
      .send({ sidangTypeId: 1 });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/requests', () => {
  test('admin can get all requests', async () => {
    const res = await request(app)
      .get('/api/requests?all=true')
      .set('Cookie', adminSession);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('filters by status', async () => {
    const res = await request(app)
      .get('/api/requests?status=waiting_admin')
      .set('Cookie', adminSession);

    expect(res.status).toBe(200);
    res.body.forEach((req: any) => {
      expect(req.status).toBe('waiting_admin');
    });
  });

  test('non-admin cannot get all requests', async () => {
    const res = await request(app)
      .get('/api/requests?all=true')
      .set('Cookie', mahasiswaSession);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/requests/my-requests', () => {
  test('mahasiswa gets own requests only', async () => {
    const res = await request(app)
      .get('/api/requests/my-requests')
      .set('Cookie', mahasiswaSession);

    expect(res.status).toBe(200);
    res.body.forEach((req: any) => {
      expect(req.mahasiswaId).toBe(testMahasiswa.id);
    });
  });

  test('includes related data', async () => {
    const res = await request(app)
      .get('/api/requests/my-requests')
      .set('Cookie', mahasiswaSession);

    const request = res.body[0];
    expect(request).toHaveProperty('sidangType');
    expect(request).toHaveProperty('approvals');
    expect(request).toHaveProperty('fulfillments');
    expect(request).toHaveProperty('revisiNotes');
  });

  test('requires mahasiswa role', async () => {
    const res = await request(app)
      .get('/api/requests/my-requests')
      .set('Cookie', dosenSession);

    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/requests/:id/status', () => {
  test('admin can update status', async () => {
    const request = await createTestRequest();

    const res = await request(app)
      .patch(`/api/requests/${request.id}/status`)
      .set('Cookie', adminSession)
      .send({ status: 'sidang_berlangsung' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('sidang_berlangsung');
  });

  test('requires admin role', async () => {
    const request = await createTestRequest();

    const res = await request(app)
      .patch(`/api/requests/${request.id}/status`)
      .set('Cookie', mahasiswaSession)
      .send({ status: 'done' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/requests/:id', () => {
  test('soft deletes request', async () => {
    const request = await createTestRequest();

    const res = await request(app)
      .delete(`/api/requests/${request.id}`)
      .set('Cookie', adminSession);

    expect(res.status).toBe(200);

    const deleted = await prisma.request.findUnique({
      where: { id: request.id },
    });
    expect(deleted?.deletedAt).not.toBeNull();
  });

  test('requires admin role', async () => {
    const request = await createTestRequest();

    const res = await request(app)
      .delete(`/api/requests/${request.id}`)
      .set('Cookie', mahasiswaSession);

    expect(res.status).toBe(403);
  });
});
```

**Test Cases**: 10
**Priority**: Critical

---

#### E. Approvals API

**File**: `tests/integration/approvals.test.ts`

```typescript
describe('GET /api/approvals/pending-dashboard', () => {
  beforeEach(async () => {
    await seedApprovalTestData();
  });

  test('returns requests for current workflow step role', async () => {
    const res = await request(app)
      .get('/api/approvals/pending-dashboard?role=dosen')
      .set('Cookie', dosenSession);

    expect(res.status).toBe(200);
    res.body.forEach((req: any) => {
      expect(req.currentStep.role).toContain('dosen');
    });
  });

  test('requires authentication', async () => {
    const res = await request(app)
      .get('/api/approvals/pending-dashboard?role=dosen');

    expect(res.status).toBe(401);
  });
});

describe('POST /api/approvals/action', () => {
  test('approve moves to next step', async () => {
    const request = await createPendingRequest();

    const res = await request(app)
      .post('/api/approvals/action')
      .set('Cookie', dosenSession)
      .send({
        requestId: request.id,
        action: 'approve',
        notes: 'Looks good',
      });

    expect(res.status).toBe(200);

    // Check request updated
    const updated = await prisma.request.findUnique({
      where: { id: request.id },
      include: { currentStep: true },
    });

    expect(updated?.currentStep?.stepOrder).toBe(
      request.currentStep.stepOrder + 1
    );

    // Check approval created
    const approval = await prisma.approval.findFirst({
      where: { requestId: request.id },
    });
    expect(approval).toBeDefined();
    expect(approval?.action).toBe('approve');
  });

  test('approve on last step sets status to waiting_admin', async () => {
    const request = await createRequestAtLastStep();

    const res = await request(app)
      .post('/api/approvals/action')
      .set('Cookie', akademikSession)
      .send({
        requestId: request.id,
        action: 'approve',
      });

    expect(res.status).toBe(200);

    const updated = await prisma.request.findUnique({
      where: { id: request.id },
    });

    expect(updated?.status).toBe('waiting_admin');
    expect(updated?.currentStepId).toBeNull();
  });

  test('reject sets status to rejected', async () => {
    const request = await createPendingRequest();

    const res = await request(app)
      .post('/api/approvals/action')
      .set('Cookie', dosenSession)
      .send({
        requestId: request.id,
        action: 'reject',
        notes: 'Document incomplete',
      });

    expect(res.status).toBe(200);

    const updated = await prisma.request.findUnique({
      where: { id: request.id },
    });

    expect(updated?.status).toBe('rejected');

    const approval = await prisma.approval.findFirst({
      where: { requestId: request.id },
    });
    expect(approval?.action).toBe('reject');
    expect(approval?.notes).toBe('Document incomplete');
  });

  test('requires dosen or akademik role', async () => {
    const request = await createPendingRequest();

    const res = await request(app)
      .post('/api/approvals/action')
      .set('Cookie', mahasiswaSession)
      .send({
        requestId: request.id,
        action: 'approve',
      });

    expect(res.status).toBe(403);
  });
});
```

**Test Cases**: 5
**Priority**: Critical

---

#### F. File Upload API

**File**: `tests/integration/upload.test.ts`

```typescript
describe('POST /api/upload', () => {
  test('uploads file successfully', async () => {
    const request = await createTestRequest();
    const requirement = await createTestRequirement();

    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', mahasiswaSession)
      .attach('file', Buffer.from('test content'), 'test.pdf')
      .field('requestId', request.id.toString())
      .field('requirementId', requirement.id.toString());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.path).toBeDefined();

    // Check fulfillment created
    const fulfillment = await prisma.requirementFulfillment.findFirst({
      where: {
        requestId: request.id,
        requirementId: requirement.id,
      },
    });
    expect(fulfillment).toBeDefined();
    expect(fulfillment?.fileUrl).toBeDefined();
  });

  test('rejects file larger than 10MB', async () => {
    const request = await createTestRequest();
    const requirement = await createTestRequirement();

    const largeFile = Buffer.alloc(11 * 1024 * 1024); // 11MB

    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', mahasiswaSession)
      .attach('file', largeFile, 'large.pdf')
      .field('requestId', request.id.toString())
      .field('requirementId', requirement.id.toString());

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('terlalu besar');
  });

  test('rejects invalid file types', async () => {
    const request = await createTestRequest();
    const requirement = await createTestRequirement();

    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', mahasiswaSession)
      .attach('file', Buffer.from('test'), 'virus.exe')
      .field('requestId', request.id.toString())
      .field('requirementId', requirement.id.toString());

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('tidak didukung');
  });

  test('requires authentication', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from('test'), 'test.pdf')
      .field('requestId', '1')
      .field('requirementId', '1');

    expect(res.status).toBe(401);
  });

  test('validates required fields', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', mahasiswaSession)
      .attach('file', Buffer.from('test'), 'test.pdf');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('tidak lengkap');
  });
});
```

**Test Cases**: 5
**Priority**: High

---

#### G. Revision Notes API

**File**: `tests/integration/revisi.test.ts`

```typescript
describe('POST /api/revisi', () => {
  test('creates revision note with text only', async () => {
    const request = await createTestRequest();

    const res = await request(app)
      .post('/api/revisi')
      .set('Cookie', dosenSession)
      .field('requestId', request.id.toString())
      .field('catatan', 'Please fix chapter 3');

    expect(res.status).toBe(200);

    const revisi = await prisma.revisiNote.findFirst({
      where: { requestId: request.id },
    });
    expect(revisi?.catatan).toBe('Please fix chapter 3');
    expect(revisi?.dosenId).toBe(testDosen.id);
  });

  test('creates revision note with file attachment', async () => {
    const request = await createTestRequest();

    const res = await request(app)
      .post('/api/revisi')
      .set('Cookie', dosenSession)
      .field('requestId', request.id.toString())
      .field('catatan', 'See attached corrections')
      .attach('file', Buffer.from('corrections'), 'corrections.pdf');

    expect(res.status).toBe(200);

    const revisi = await prisma.revisiNote.findFirst({
      where: { requestId: request.id },
    });
    expect(revisi?.fileUrl).toBeDefined();
    expect(revisi?.fileUrl).toContain('/uploads/revisi/');
  });

  test('requires catatan field', async () => {
    const request = await createTestRequest();

    const res = await request(app)
      .post('/api/revisi')
      .set('Cookie', dosenSession)
      .field('requestId', request.id.toString());

    expect(res.status).toBe(400);
  });

  test('requires dosen role', async () => {
    const request = await createTestRequest();

    const res = await request(app)
      .post('/api/revisi')
      .set('Cookie', mahasiswaSession)
      .field('requestId', request.id.toString())
      .field('catatan', 'Test');

    expect(res.status).toBe(403);
  });
});
```

**Test Cases**: 4
**Priority**: Medium

---

### Total Integration Tests

**API Endpoints Covered**: 15+
**Total Test Cases**: ~50
**Priority Distribution**:
- Critical: 15 tests
- High: 25 tests
- Medium: 10 tests

**Coverage Target**: 80%+ for all API routes

---

## End-to-End Testing Plan

### E2E Test Scenarios

#### Scenario 1: Complete Sidang Workflow (Happy Path)

**File**: `e2e/complete-workflow.spec.ts`

```typescript
test('complete sidang workflow from submission to completion', async ({ page, context }) => {
  // 1. Mahasiswa Login & Submit Request
  await page.goto('/login');
  await page.fill('[name="email"]', 'test.mhs@test.com');
  await page.fill('[name="password"]', 'test123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/mahasiswa/request');

  // 2. Select Sidang Type
  await page.selectOption('select', '1'); // Sidang Proposal
  await page.waitForSelector('.card');

  // 3. Upload Required Files
  const fileInputs = await page.locator('input[type="file"]').all();
  for (const input of fileInputs) {
    await input.setInputFiles('tests/fixtures/test-document.pdf');
  }

  // 4. Submit Request
  await page.click('button:has-text("Submit Pengajuan")');
  await expect(page.locator('.toast-success')).toBeVisible();

  // 5. Check Status Tracker
  await page.goto('/mahasiswa/tracker');
  await expect(page.locator('.card-title')).toContainText('Sidang Proposal');
  await expect(page.locator('.badge-warning')).toContainText('PENDING');

  // 6. Dosen Login & Approve (Step 1)
  const dosenPage = await context.newPage();
  await dosenPage.goto('/login');
  await dosenPage.fill('[name="email"]', 'test.dosen1@test.com');
  await dosenPage.fill('[name="password"]', 'test123');
  await dosenPage.click('button[type="submit"]');

  await dosenPage.goto('/dosen/approvals');
  await dosenPage.click('button:has-text("Setuju")');
  await expect(dosenPage.locator('.toast-success')).toBeVisible();

  // 7. Second Dosen Approve (Step 2)
  const dosen2Page = await context.newPage();
  await dosen2Page.goto('/login');
  await dosen2Page.fill('[name="email"]', 'test.dosen2@test.com');
  await dosen2Page.fill('[name="password"]', 'test123');
  await dosen2Page.click('button[type="submit"]');

  await dosen2Page.goto('/dosen/approvals');
  await dosen2Page.click('button:has-text("Setuju")');
  await expect(dosen2Page.locator('.toast-success')).toBeVisible();

  // 8. Akademik Approve (Step 3)
  const akademikPage = await context.newPage();
  await akademikPage.goto('/login');
  await akademikPage.fill('[name="email"]', 'test.akademik@test.com');
  await akademikPage.fill('[name="password"]', 'test123');
  await akademikPage.click('button[type="submit"]');

  await akademikPage.goto('/akademik/approvals');
  await akademikPage.click('button:has-text("Setuju")');
  await expect(akademikPage.locator('.toast-success')).toBeVisible();

  // 9. Check Mahasiswa Tracker - Should be "Waiting Admin"
  await page.reload();
  await expect(page.locator('.badge-info')).toContainText('MENUNGGU ADMIN');

  // 10. Admin Start Sidang
  const adminPage = await context.newPage();
  await adminPage.goto('/login');
  await adminPage.fill('[name="email"]', 'test.admin@test.com');
  await adminPage.fill('[name="password"]', 'test123');
  await adminPage.click('button[type="submit"]');

  await adminPage.goto('/admin/sidang-day');
  await adminPage.click('button:has-text("Sidang Berlangsung")');
  await expect(adminPage.locator('.toast-success')).toBeVisible();

  // 11. Dosen Input Revision Notes
  await dosenPage.goto('/dosen/approvals');
  await dosenPage.click('button:has-text("Input Revisi")');

  await dosenPage.fill('textarea', 'Please fix formatting in chapter 2');
  await dosenPage.setInputFiles('input[type="file"]', 'tests/fixtures/revision.pdf');
  await dosenPage.click('button:has-text("Simpan Catatan")');
  await expect(dosenPage.locator('.toast-success')).toBeVisible();

  // 12. Admin Complete Sidang
  await adminPage.click('button:has-text("Sidang Selesai")');
  await expect(adminPage.locator('.toast-success')).toBeVisible();

  // 13. Mahasiswa Check Final Status & Revisions
  await page.reload();
  await expect(page.locator('.badge-success')).toContainText('SIDANG SELESAI');
  await expect(page.locator('text=Please fix formatting')).toBeVisible();
  await expect(page.locator('a:has-text("Lihat File")')).toBeVisible();
});
```

**Duration**: ~2 minutes
**Priority**: Critical

---

#### Scenario 2: Rejection Flow

**File**: `e2e/rejection-flow.spec.ts`

```typescript
test('dosen rejects request with notes', async ({ page }) => {
  // Setup: Create pending request
  const request = await createTestRequest();

  // 1. Dosen Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test.dosen@test.com');
  await page.fill('[name="password"]', 'test123');
  await page.click('button[type="submit"]');

  // 2. Go to Approvals
  await page.goto('/dosen/approvals');
  await expect(page.locator('.card')).toBeVisible();

  // 3. Click Reject
  await page.click('button:has-text("Tolak")');

  // 4. Custom confirm dialog should appear
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await expect(page.locator('text=Hapus Request?')).toBeVisible();

  // 5. Enter rejection notes in prompt (this might be a prompt, needs handling)
  page.on('dialog', async (dialog) => {
    expect(dialog.type()).toBe('prompt');
    await dialog.accept('Documents are incomplete');
  });

  await page.click('button:has-text("Ya")');

  // 6. Success toast
  await expect(page.locator('.toast-success')).toBeVisible();

  // 7. Verify in mahasiswa tracker
  await page.goto('/login');
  await page.fill('[name="email"]', 'test.mhs@test.com');
  await page.fill('[name="password"]', 'test123');
  await page.click('button[type="submit"]');

  await page.goto('/mahasiswa/tracker');
  await expect(page.locator('.badge-error')).toContainText('DITOLAK');
  await expect(page.locator('text=Documents are incomplete')).toBeVisible();
});
```

**Duration**: ~1 minute
**Priority**: High

---

#### Scenario 3: Admin Workflow Configuration

**File**: `e2e/admin-workflow-config.spec.ts`

```typescript
test('admin creates custom workflow', async ({ page }) => {
  // 1. Admin Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test.admin@test.com');
  await page.fill('[name="password"]', 'test123');
  await page.click('button[type="submit"]');

  // 2. Go to Workflow Builder
  await page.goto('/admin/workflow');

  // 3. Select Sidang Type
  await page.selectOption('select', '1');
  await page.waitForSelector('.card');

  // 4. Add First Step
  await page.fill('input[placeholder*="Role"]', 'dosen_pembimbing_1');
  await page.fill('input[placeholder*="Deskripsi"]', 'First supervisor approval');
  await page.click('button:has-text("Tambah Step")');

  await expect(page.locator('text=Step 1')).toBeVisible();
  await expect(page.locator('text=dosen_pembimbing_1')).toBeVisible();

  // 5. Add Second Step
  await page.fill('input[placeholder*="Role"]', 'dosen_pembimbing_2');
  await page.fill('input[placeholder*="Deskripsi"]', 'Second supervisor approval');
  await page.click('button:has-text("Tambah Step")');

  await expect(page.locator('text=Step 2')).toBeVisible();

  // 6. Add Third Step
  await page.fill('input[placeholder*="Role"]', 'akademik');
  await page.click('button:has-text("Tambah Step")');

  await expect(page.locator('text=Step 3')).toBeVisible();

  // 7. Delete Middle Step
  const deleteButtons = await page.locator('button:has-text("Hapus")').all();
  await deleteButtons[1].click(); // Delete step 2

  // Confirm deletion
  await page.click('button:has-text("Ya, Hapus")');
  await expect(page.locator('.toast-success')).toBeVisible();

  // 8. Verify final workflow
  const steps = await page.locator('.card .badge').allTextContents();
  expect(steps).toContain('Step 1');
  expect(steps).toContain('Step 2'); // Was step 3, now renumbered
  expect(steps.length).toBe(2);
});
```

**Duration**: ~1.5 minutes
**Priority**: High

---

#### Scenario 4: File Upload & Preview

**File**: `e2e/file-upload.spec.ts`

```typescript
test('mahasiswa uploads files with drag & drop', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test.mhs@test.com');
  await page.fill('[name="password"]', 'test123');
  await page.click('button[type="submit"]');

  // 2. Go to Request Page
  await page.goto('/mahasiswa/request');
  await page.selectOption('select', '1');
  await page.waitForSelector('.file-input');

  // 3. Drag & Drop File
  const dropZone = page.locator('.cursor-pointer').first();

  const buffer = await fs.readFile('tests/fixtures/test-image.jpg');
  const dataTransfer = await page.evaluateHandle((data) => {
    const dt = new DataTransfer();
    const file = new File([new Uint8Array(data)], 'test-image.jpg', {
      type: 'image/jpeg',
    });
    dt.items.add(file);
    return dt;
  }, Array.from(buffer));

  await dropZone.dispatchEvent('drop', { dataTransfer });

  // 4. Verify Preview Appears
  await expect(page.locator('img[alt="Preview"]')).toBeVisible();
  await expect(page.locator('text=test-image.jpg')).toBeVisible();

  // 5. Verify File Size Display
  await expect(page.locator('text=/\\d+(\\.\\d+)? (KB|MB)/')).toBeVisible();

  // 6. Test Remove Button
  await page.click('button[title="Hapus file"]');
  await expect(page.locator('img[alt="Preview"]')).not.toBeVisible();
  await expect(page.locator('text=/drag & drop/i')).toBeVisible();

  // 7. Upload via Click
  await dropZone.click();
  await page.setInputFiles('input[type="file"]', 'tests/fixtures/test-document.pdf');

  // 8. Verify PDF Icon
  await expect(page.locator('text=📄')).toBeVisible();
  await expect(page.locator('text=test-document.pdf')).toBeVisible();

  // 9. Test File Too Large Error
  const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
  await page.setInputFiles('input[type="file"]', {
    name: 'large.pdf',
    mimeType: 'application/pdf',
    buffer: largeBuffer,
  });

  await expect(page.locator('.toast-error')).toBeVisible();
  await expect(page.locator('text=/terlalu besar/i')).toBeVisible();
});
```

**Duration**: ~2 minutes
**Priority**: Medium

---

#### Scenario 5: Keyboard Shortcuts

**File**: `e2e/keyboard-shortcuts.spec.ts`

```typescript
test('keyboard shortcuts work correctly', async ({ page }) => {
  // 1. Admin Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test.admin@test.com');
  await page.fill('[name="password"]', 'test123');
  await page.click('button[type="submit"]');

  // 2. Go to Dashboard
  await page.goto('/admin/dashboard');
  await page.waitForSelector('input[placeholder*="Cari"]');

  // 3. Test Ctrl+K (Focus Search)
  await page.keyboard.press('Control+k');
  const searchInput = page.locator('input[placeholder*="Cari"]');
  await expect(searchInput).toBeFocused();

  // 4. Type Search Query
  await searchInput.fill('test');
  await expect(searchInput).toHaveValue('test');

  // 5. Clear search
  await searchInput.clear();

  // 6. Go to page 2 (if available)
  const nextButton = page.locator('button:has-text("Next")');
  if (await nextButton.isEnabled()) {
    // 7. Test Ctrl+→ (Next Page)
    await page.keyboard.press('Control+ArrowRight');
    await expect(page.locator('.btn-primary:has-text("2")')).toBeVisible();

    // 8. Test Ctrl+← (Previous Page)
    await page.keyboard.press('Control+ArrowLeft');
    await expect(page.locator('.btn-primary:has-text("1")')).toBeVisible();
  }

  // 9. Test Ctrl+R (Refresh) - Should reload data
  const initialData = await page.locator('tbody tr').count();
  await page.keyboard.press('Control+r');
  await page.waitForTimeout(500);
  const afterRefresh = await page.locator('tbody tr').count();
  expect(afterRefresh).toBe(initialData);

  // 10. Verify Shortcuts Help Panel
  await expect(page.locator('text=⌨️ Shortcuts')).toBeVisible();
  await expect(page.locator('text=Ctrl + K - Search')).toBeVisible();
});
```

**Duration**: ~1 minute
**Priority**: Low

---

#### Scenario 6: Mobile Responsive

**File**: `e2e/mobile-responsive.spec.ts`

```typescript
test('mobile responsive design works', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  // 1. Login on Mobile
  await page.goto('/login');
  await page.fill('[name="email"]', 'test.admin@test.com');
  await page.fill('[name="password"]', 'test123');
  await page.click('button[type="submit"]');

  // 2. Verify Mobile Navigation
  await expect(page.locator('.navbar')).toBeVisible(); // Mobile navbar
  await expect(page.locator('.drawer-side')).not.toBeVisible(); // Desktop sidebar hidden

  // 3. Open Mobile Menu
  await page.click('[aria-label="Open menu"]'); // Hamburger
  await expect(page.locator('.drawer-side')).toBeVisible();

  // 4. Navigate via Mobile Menu
  await page.click('a:has-text("Dashboard")');
  await expect(page).toHaveURL('/admin/dashboard');

  // 5. Check Mobile Table
  await expect(page.locator('.overflow-x-auto')).toBeVisible();

  // Table should be scrollable horizontally
  const table = page.locator('table');
  const scrollWidth = await table.evaluate((el) => el.scrollWidth);
  const clientWidth = await table.evaluate((el) => el.clientWidth);
  expect(scrollWidth).toBeGreaterThan(clientWidth);

  // 6. Check Stats Cards (2 per row on mobile)
  const statsContainer = page.locator('.grid.grid-cols-2');
  await expect(statsContainer).toBeVisible();

  // 7. Check Filter Stacking
  const filterGrid = page.locator('.grid.grid-cols-1');
  await expect(filterGrid).toBeVisible();

  // 8. Check Search Input Full Width
  const searchInput = page.locator('input[placeholder*="Cari"]');
  const inputWidth = await searchInput.evaluate((el) => el.offsetWidth);
  const parentWidth = await searchInput.evaluate((el) => el.parentElement?.offsetWidth);
  expect(inputWidth).toBeGreaterThan(300); // Full width on mobile

  // 9. Shortcuts Panel Should Be Hidden
  await expect(page.locator('text=⌨️ Shortcuts')).not.toBeVisible();

  // 10. Test Touch Interactions
  await page.locator('tbody tr').first().tap();
  // Should not cause issues
});
```

**Duration**: ~1.5 minutes
**Priority**: Medium

---

### E2E Testing Summary

| Scenario | Priority | Duration | Tests |
|----------|----------|----------|-------|
| Complete Workflow | Critical | 2 min | 1 |
| Rejection Flow | High | 1 min | 1 |
| Admin Workflow Config | High | 1.5 min | 1 |
| File Upload & Preview | Medium | 2 min | 1 |
| Keyboard Shortcuts | Low | 1 min | 1 |
| Mobile Responsive | Medium | 1.5 min | 1 |

**Total E2E Tests**: 6 scenarios
**Total Duration**: ~9 minutes
**Browsers**: Chromium, Firefox, WebKit

---

## Manual Testing Checklist

### Role-Based Manual Testing

#### Mahasiswa Role Testing

##### 1. Login & Registration
- [ ] Login with valid credentials
- [ ] Login with invalid credentials shows error
- [ ] Logout redirects to login page
- [ ] Session persists on page refresh
- [ ] Session expires after timeout

##### 2. Dashboard
- [ ] Stats cards show correct counts (waiting approval, approved, revisi)
- [ ] Request status tracker displays accurately
- [ ] Empty state shows when no requests
- [ ] Quick access buttons navigate correctly
- [ ] Recent activity timeline shows latest updates

##### 3. Create New Request
- [ ] Page loads with sidang type selector
- [ ] Can select different sidang types
- [ ] Requirements list loads based on selected type
- [ ] Can upload files for each requirement
- [ ] File preview works (PDF, images)
- [ ] File validation works (max 10MB, valid types)
- [ ] Can remove uploaded files
- [ ] Form submission validates all required files
- [ ] Success toast shows after submission
- [ ] Redirects to status tracker after submission

##### 4. Status Tracker
- [ ] Shows all user's requests
- [ ] Status labels display correctly (waiting, approved, rejected, revisi)
- [ ] Timeline shows workflow progress
- [ ] Current step highlighted in timeline
- [ ] Can view request details
- [ ] Can view uploaded files
- [ ] Can download files
- [ ] Shows rejection reason if rejected
- [ ] Shows revision notes after sidang

##### 5. Revision Notes View
- [ ] Only visible for completed sidang
- [ ] Shows notes from each dosen
- [ ] Notes display in correct order
- [ ] Empty state if no notes
- [ ] Can print/export notes

##### 6. File Management
- [ ] Can view all uploaded files
- [ ] File preview modal works
- [ ] Can download individual files
- [ ] File metadata displays (size, upload date)

---

#### Dosen Role Testing

##### 1. Login & Dashboard
- [ ] Login with dosen credentials
- [ ] Dashboard shows pending approvals count
- [ ] Shows active sidang count
- [ ] Recent activity timeline accurate

##### 2. Approval Queue
- [ ] Lists all requests awaiting dosen's approval
- [ ] Filters work (sidang type, date)
- [ ] Search works (by student name, NIM)
- [ ] Pagination works
- [ ] Can sort by date, priority

##### 3. Request Review
- [ ] Can view student details (name, NIM, prodi)
- [ ] Can view sidang type
- [ ] Can view all uploaded files
- [ ] File preview modal works
- [ ] Can download files for offline review
- [ ] Timeline shows workflow progress
- [ ] Current step highlighted

##### 4. Approval Actions
- [ ] Approve button works
- [ ] Confirmation dialog shows before approval
- [ ] Success message after approval
- [ ] Request moves to next step
- [ ] Reject button works
- [ ] Rejection reason required
- [ ] Rejection reason validates (min 10 chars)
- [ ] Student receives rejection notification
- [ ] Can cancel action in confirmation dialog

##### 5. Active Sidang
- [ ] Lists all ongoing sidang sessions
- [ ] Can view sidang details
- [ ] Can add revision notes
- [ ] Notes autosave
- [ ] Can edit notes before submission
- [ ] Can submit final notes
- [ ] Confirmation before submission

##### 6. Keyboard Shortcuts
- [ ] `Ctrl+K`: Open keyboard shortcuts panel
- [ ] `A`: Approve (on review page)
- [ ] `R`: Reject (on review page)
- [ ] `/`: Focus search input
- [ ] `Esc`: Close modals

---

#### Akademik Role Testing

##### 1. Login & Dashboard
- [ ] Login with akademik credentials
- [ ] Dashboard shows comprehensive stats
- [ ] All sidang types stats visible
- [ ] Charts render correctly
- [ ] Date filters work

##### 2. Approval Queue
- [ ] Shows requests that passed all dosen approvals
- [ ] Filters by sidang type work
- [ ] Search by student details works
- [ ] Batch actions available (if implemented)
- [ ] Export to Excel works

##### 3. Final Approval
- [ ] Can review complete workflow history
- [ ] Can see all previous approvals
- [ ] Can view all uploaded documents
- [ ] Approve button works
- [ ] Reject button works (with reason)
- [ ] After approval, status changes to "Waiting Admin"

##### 4. Reports & Analytics
- [ ] Can view approval statistics
- [ ] Can filter by date range
- [ ] Can filter by sidang type
- [ ] Can export reports
- [ ] Charts display accurate data

---

#### Admin Role Testing

##### 1. Login & Dashboard
- [ ] Login with admin credentials
- [ ] Comprehensive stats displayed
- [ ] All roles' activities visible
- [ ] System health indicators work

##### 2. Workflow Configuration
- [ ] Can view all sidang types
- [ ] Can create new sidang type
- [ ] Can edit sidang type name
- [ ] Can delete sidang type (with confirmation)
- [ ] Can view workflow steps for each type
- [ ] Can add new workflow step
- [ ] Can edit step order
- [ ] Can edit step role
- [ ] Can delete step (with confirmation)
- [ ] Step order auto-increments
- [ ] Changes reflect immediately

##### 3. Requirements Management
- [ ] Can view all requirements
- [ ] Grouped by sidang type
- [ ] Can add new requirement
- [ ] Can edit requirement name
- [ ] Can delete requirement (with confirmation)
- [ ] Can toggle requirement active/inactive

##### 4. Sidang Management
- [ ] Can view all requests waiting for admin
- [ ] Can start sidang session
- [ ] Select date and time for sidang
- [ ] Select location/room
- [ ] Assign dosen examiners
- [ ] System validates dosen availability
- [ ] Can view ongoing sidang
- [ ] Can complete sidang
- [ ] Completion requires all dosen notes
- [ ] Can cancel sidang (with reason)

##### 5. User Management
- [ ] Can view all users
- [ ] Can filter by role
- [ ] Can search users
- [ ] Can create new user
- [ ] Can edit user details
- [ ] Can deactivate user
- [ ] Can reset user password

##### 6. File Management
- [ ] Can view all uploaded files
- [ ] Can filter by request
- [ ] Can filter by upload date
- [ ] Can download files
- [ ] Can delete files (with confirmation)
- [ ] Storage usage stats displayed

---

### Cross-Browser Testing

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Login | ✓ | ✓ | ✓ | ✓ |
| File Upload | ✓ | ✓ | ✓ | ✓ |
| PDF Preview | ✓ | ✓ | ✓ | ✓ |
| Keyboard Shortcuts | ✓ | ✓ | ✓ | ✓ |
| Date Picker | ✓ | ✓ | ✓ | ✓ |
| Toast Notifications | ✓ | ✓ | ✓ | ✓ |
| Modals | ✓ | ✓ | ✓ | ✓ |

---

### Mobile Testing

#### iOS Safari
- [ ] Login works
- [ ] Touch interactions smooth
- [ ] File upload from camera works
- [ ] File upload from library works
- [ ] Navigation drawer works
- [ ] Tables scroll horizontally
- [ ] Forms are usable
- [ ] Text is readable (min 16px)

#### Android Chrome
- [ ] Login works
- [ ] Touch interactions smooth
- [ ] File upload works
- [ ] Navigation drawer works
- [ ] Tables scroll horizontally
- [ ] Forms are usable
- [ ] Text is readable

#### Responsive Breakpoints
- [ ] Mobile (< 640px): Single column, stacked stats
- [ ] Tablet (640px - 1024px): 2 columns, condensed tables
- [ ] Desktop (> 1024px): Full layout, sidebar visible

---

## Security Testing

### OWASP Top 10 Testing

#### 1. Authentication Security

**Test Cases**:

```typescript
// tests/security/auth.security.test.ts
describe('Authentication Security', () => {
  test('prevents brute force attacks with rate limiting', async () => {
    const attempts = [];

    // Try 10 failed login attempts
    for (let i = 0; i < 10; i++) {
      attempts.push(
        request(app)
          .post('/api/auth/login')
          .send({ email: 'test@test.com', password: 'wrong' })
      );
    }

    const results = await Promise.all(attempts);

    // Should start blocking after 5 attempts
    const blocked = results.filter(r => r.status === 429);
    expect(blocked.length).toBeGreaterThan(0);
  });

  test('password stored as hash, never plaintext', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'security@test.com',
        password: await bcrypt.hash('test123', 10),
        name: 'Security Test',
        role: 'mahasiswa',
      },
    });

    // Password in DB should be hashed
    expect(user.password).not.toBe('test123');
    expect(user.password.length).toBeGreaterThan(50);
    expect(user.password.startsWith('$2')).toBe(true); // bcrypt hash
  });

  test('session cookies have secure flags', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'test123' });

    const cookies = res.headers['set-cookie'];
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain('SameSite=Strict');
    // In production:
    // expect(cookies[0]).toContain('Secure');
  });

  test('prevents session fixation', async () => {
    // Get session before login
    const res1 = await request(app).get('/');
    const sessionBefore = res1.headers['set-cookie'];

    // Login
    const res2 = await request(app)
      .post('/api/auth/login')
      .set('Cookie', sessionBefore)
      .send({ email: 'test@test.com', password: 'test123' });

    const sessionAfter = res2.headers['set-cookie'];

    // Session ID should change after login
    expect(sessionBefore[0]).not.toBe(sessionAfter[0]);
  });
});
```

---

#### 2. Authorization Security

```typescript
describe('Authorization Security', () => {
  test('IDOR: cannot access other user\'s request', async () => {
    const mahasiswa1 = await createMahasiswaSession();
    const mahasiswa2 = await createMahasiswaSession();

    // Create request as mahasiswa1
    const request1 = await prisma.request.create({
      data: {
        userId: mahasiswa1.userId,
        sidangTypeId: 1,
        status: 'waiting_approval',
      },
    });

    // Try to access as mahasiswa2
    const res = await request(app)
      .get(`/api/requests/${request1.id}`)
      .set('Cookie', mahasiswa2.session);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('tidak memiliki akses');
  });

  test('privilege escalation: mahasiswa cannot approve', async () => {
    const mahasiswaSession = await createMahasiswaSession();
    const testRequest = await createTestRequest();

    const res = await request(app)
      .post('/api/approvals/action')
      .set('Cookie', mahasiswaSession)
      .send({
        requestId: testRequest.id,
        action: 'approve',
      });

    expect(res.status).toBe(403);
  });

  test('horizontal privilege escalation prevented', async () => {
    const dosen1 = await createDosenSession();
    const dosen2 = await createDosenSession();

    // Create approval for dosen1
    const approval = await prisma.approval.create({
      data: {
        requestId: 1,
        stepId: 1,
        approverId: dosen1.userId,
        status: 'pending',
      },
    });

    // Try to approve as dosen2
    const res = await request(app)
      .post('/api/approvals/action')
      .set('Cookie', dosen2.session)
      .send({
        requestId: 1,
        action: 'approve',
      });

    expect(res.status).toBe(403);
  });
});
```

---

#### 3. SQL Injection Prevention

```typescript
describe('SQL Injection Prevention', () => {
  test('search input sanitized', async () => {
    const maliciousInput = "'; DROP TABLE users; --";

    const res = await request(app)
      .get('/api/requests')
      .query({ search: maliciousInput })
      .set('Cookie', adminSession);

    // Should not cause SQL error
    expect(res.status).not.toBe(500);

    // Table should still exist
    const users = await prisma.user.findMany();
    expect(users).toBeDefined();
  });

  test('parameterized queries used', async () => {
    // This is ensured by Prisma ORM
    // Manual queries should use parameters
    const userInput = "1' OR '1'='1";

    const res = await request(app)
      .get(`/api/users/${userInput}`)
      .set('Cookie', adminSession);

    expect(res.status).toBe(400); // Invalid ID format
  });
});
```

---

#### 4. XSS Prevention

```typescript
describe('XSS Prevention', () => {
  test('user input escaped in output', async () => {
    const xssPayload = '<script>alert("XSS")</script>';

    // Create requirement with XSS payload
    await prisma.requirement.create({
      data: {
        sidangTypeId: 1,
        name: xssPayload,
      },
    });

    const res = await request(app)
      .get('/api/requirements')
      .set('Cookie', adminSession);

    // Response should escape HTML
    const jsonString = JSON.stringify(res.body);
    expect(jsonString).not.toContain('<script>');
    // Should be escaped or sanitized
  });

  test('file upload content-type validated', async () => {
    const htmlFile = Buffer.from('<html><script>alert("XSS")</script></html>');

    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', mahasiswaSession)
      .attach('file', htmlFile, 'evil.html')
      .field('requestId', '1')
      .field('requirementId', '1');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('tidak didukung');
  });
});
```

---

#### 5. CSRF Prevention

```typescript
describe('CSRF Prevention', () => {
  test('state-changing requests require valid session', async () => {
    // Try to make request without session
    const res = await request(app)
      .post('/api/approvals/action')
      .send({
        requestId: 1,
        action: 'approve',
      });

    expect(res.status).toBe(401);
  });

  test('SameSite cookie attribute set', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'test123' });

    const cookies = res.headers['set-cookie'];
    expect(cookies[0]).toContain('SameSite=Strict');
  });
});
```

---

#### 6. File Upload Security

```typescript
describe('File Upload Security', () => {
  test('validates file MIME type', async () => {
    const exeFile = Buffer.from('MZ'); // EXE magic bytes

    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', mahasiswaSession)
      .attach('file', exeFile, 'virus.pdf') // Fake extension
      .field('requestId', '1')
      .field('requirementId', '1');

    expect(res.status).toBe(400);
  });

  test('enforces file size limit', async () => {
    const hugeFile = Buffer.alloc(11 * 1024 * 1024); // 11MB

    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', mahasiswaSession)
      .attach('file', hugeFile, 'huge.pdf')
      .field('requestId', '1')
      .field('requirementId', '1');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('terlalu besar');
  });

  test('sanitizes filename', async () => {
    const maliciousFilename = '../../../etc/passwd';

    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', mahasiswaSession)
      .attach('file', Buffer.from('test'), maliciousFilename)
      .field('requestId', '1')
      .field('requirementId', '1');

    if (res.status === 200) {
      // Filename should be sanitized
      expect(res.body.path).not.toContain('..');
      expect(res.body.path).not.toContain('etc/passwd');
    }
  });

  test('stores files outside web root', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', mahasiswaSession)
      .attach('file', Buffer.from('test'), 'test.pdf')
      .field('requestId', '1')
      .field('requirementId', '1');

    if (res.status === 200) {
      // Should use /uploads or similar, not /public
      expect(res.body.path).toContain('uploads');
      expect(res.body.path).not.toContain('public');
    }
  });
});
```

---

### Security Testing Tools

#### OWASP ZAP Scan

```bash
# Run OWASP ZAP automated scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000 \
  -r zap-report.html

# Check for:
# - Missing security headers
# - Vulnerable JavaScript libraries
# - Cookie security issues
# - SQL injection points
# - XSS vulnerabilities
```

#### Security Headers Check

```typescript
describe('Security Headers', () => {
  test('has Content-Security-Policy header', async () => {
    const res = await request(app).get('/');

    expect(res.headers['content-security-policy']).toBeDefined();
  });

  test('has X-Frame-Options header', async () => {
    const res = await request(app).get('/');

    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  test('has X-Content-Type-Options header', async () => {
    const res = await request(app).get('/');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  test('has Strict-Transport-Security header', async () => {
    const res = await request(app).get('/');

    // In production only
    if (process.env.NODE_ENV === 'production') {
      expect(res.headers['strict-transport-security']).toBeDefined();
    }
  });
});
```

---

## Performance Testing

### Lighthouse Testing

**Target Scores**:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

```bash
# Run Lighthouse audit
lighthouse http://localhost:3000 \
  --output html \
  --output-path ./lighthouse-report.html \
  --chrome-flags="--headless"

# Key metrics:
# - First Contentful Paint (FCP): < 1.8s
# - Largest Contentful Paint (LCP): < 2.5s
# - Time to Interactive (TTI): < 3.8s
# - Total Blocking Time (TBT): < 200ms
# - Cumulative Layout Shift (CLS): < 0.1
```

---

### Load Testing with k6

**File**: `tests/load/basic-load.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '3m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '3m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

export default function () {
  // Login
  const loginRes = http.post('http://localhost:3000/api/auth/login', {
    email: 'test@test.com',
    password: 'test123',
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  sleep(1);

  // Get dashboard
  const dashboardRes = http.get('http://localhost:3000/api/dashboard', {
    headers: {
      Cookie: loginRes.headers['Set-Cookie'],
    },
  });

  check(dashboardRes, {
    'dashboard loaded': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 500,
  });

  sleep(2);

  // Get requests list
  const requestsRes = http.get('http://localhost:3000/api/requests', {
    headers: {
      Cookie: loginRes.headers['Set-Cookie'],
    },
  });

  check(requestsRes, {
    'requests loaded': (r) => r.status === 200,
  });

  sleep(1);
}
```

**Run load test**:

```bash
k6 run tests/load/basic-load.js
```

---

### Stress Testing

**File**: `tests/load/stress-test.js`

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Plateau
    { duration: '2m', target: 200 },  // Spike
    { duration: '5m', target: 200 },  // Plateau
    { duration: '2m', target: 300 },  // Beyond capacity
    { duration: '5m', target: 300 },  // Plateau
    { duration: '2m', target: 0 },    // Ramp down
  ],
};

export default function () {
  const res = http.get('http://localhost:3000/api/requests');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 1s': (r) => r.timings.duration < 1000,
  });
}
```

---

### Database Query Performance

```typescript
describe('Database Performance', () => {
  test('requests list query < 100ms', async () => {
    const start = Date.now();

    await prisma.request.findMany({
      where: { userId: 1 },
      include: {
        sidangType: true,
        approvals: {
          include: {
            step: true,
            approver: true,
          },
        },
      },
      take: 20,
    });

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });

  test('dashboard stats query < 200ms', async () => {
    const start = Date.now();

    await Promise.all([
      prisma.request.count({ where: { status: 'waiting_approval' } }),
      prisma.request.count({ where: { status: 'approved' } }),
      prisma.request.count({ where: { status: 'rejected' } }),
      prisma.sidang.count({ where: { status: 'ongoing' } }),
    ]);

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(200);
  });

  test('approval queue query with filters < 150ms', async () => {
    const start = Date.now();

    await prisma.approval.findMany({
      where: {
        approverId: 1,
        status: 'pending',
        request: {
          sidangTypeId: 1,
        },
      },
      include: {
        request: {
          include: {
            user: true,
            sidangType: true,
          },
        },
        step: true,
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(150);
  });
});
```

---

### API Response Time Benchmarks

| Endpoint | Target | Acceptable | Poor |
|----------|--------|------------|------|
| GET /api/dashboard | < 200ms | < 500ms | > 500ms |
| GET /api/requests | < 150ms | < 400ms | > 400ms |
| POST /api/requests | < 300ms | < 800ms | > 800ms |
| POST /api/approvals/action | < 250ms | < 600ms | > 600ms |
| POST /api/upload | < 1000ms | < 3000ms | > 3000ms |
| GET /api/workflow-steps | < 100ms | < 300ms | > 300ms |

---

## Accessibility Testing

### WCAG 2.1 AA Compliance

#### Automated Testing with axe-core

```typescript
// tests/accessibility/a11y.test.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('dashboard page has no accessibility violations', async ({ page }) => {
    await page.goto('/admin/dashboard');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login page has no accessibility violations', async ({ page }) => {
    await page.goto('/login');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('forms have proper labels', async ({ page }) => {
    await page.goto('/mahasiswa/request/new');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/admin/workflow-config');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['button-name'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['image-alt'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

---

### Manual Accessibility Testing

#### Keyboard Navigation
- [ ] Can tab through all interactive elements
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] Can activate buttons with Enter/Space
- [ ] Can dismiss modals with Escape
- [ ] Can navigate dropdowns with arrow keys
- [ ] No keyboard traps

#### Screen Reader Testing (NVDA/JAWS)
- [ ] All headings announced correctly
- [ ] Form labels announced
- [ ] Error messages announced
- [ ] Button purposes clear
- [ ] Table headers associated with cells
- [ ] Status messages announced (aria-live)
- [ ] Modal focus trapped correctly

#### Color Contrast
- [ ] Text meets 4.5:1 contrast ratio (WCAG AA)
- [ ] Large text meets 3:1 contrast ratio
- [ ] Focus indicators meet 3:1 contrast
- [ ] UI components meet 3:1 contrast
- [ ] Error messages distinguishable without color alone

#### Text & Typography
- [ ] Minimum font size 16px for body text
- [ ] Text is resizable up to 200%
- [ ] Line height at least 1.5
- [ ] Paragraph spacing at least 2x font size
- [ ] No horizontal scrolling at 320px width

---

### Accessibility Checklist by Component

#### EmptyState Component
- [x] Icon has `aria-hidden="true"`
- [x] Title is `<h2>` or appropriate heading level
- [x] Action button has descriptive text
- [x] Color contrast > 4.5:1

#### ConfirmDialog Component
- [x] Dialog has `role="dialog"`
- [x] Dialog has `aria-labelledby` pointing to title
- [x] Dialog has `aria-describedby` pointing to message
- [x] Focus trapped inside dialog
- [x] Focus returns to trigger on close
- [x] Escapable with Escape key
- [x] Buttons have clear labels

#### FileUploadWithPreview Component
- [x] File input has label (even if visually hidden)
- [x] Drag-drop area has keyboard alternative
- [x] Error messages announced via aria-live
- [x] File preview has accessible name
- [x] Remove button has accessible name

#### StatusTracker Component
- [x] Timeline has semantic structure
- [x] Current step has `aria-current="step"`
- [x] Status icons have text alternatives
- [x] Progress conveyed to screen readers

---

## Test Data & Test Users

### Database Seeding

**File**: `prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.revisionNote.deleteMany();
  await prisma.sidang.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.requirementFulfillment.deleteMany();
  await prisma.request.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.workflowStep.deleteMany();
  await prisma.sidangType.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const hashedPassword = await bcrypt.hash('test123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: hashedPassword,
      name: 'Admin Test',
      role: 'admin',
    },
  });

  const akademik = await prisma.user.create({
    data: {
      email: 'akademik@test.com',
      password: hashedPassword,
      name: 'Akademik Test',
      role: 'akademik',
    },
  });

  const dosen1 = await prisma.user.create({
    data: {
      email: 'dosen1@test.com',
      password: hashedPassword,
      name: 'Prof. Dr. Dosen Satu',
      role: 'dosen',
    },
  });

  const dosen2 = await prisma.user.create({
    data: {
      email: 'dosen2@test.com',
      password: hashedPassword,
      name: 'Dr. Dosen Dua, M.Kom',
      role: 'dosen',
    },
  });

  const dosen3 = await prisma.user.create({
    data: {
      email: 'dosen3@test.com',
      password: hashedPassword,
      name: 'Dr. Dosen Tiga, M.T',
      role: 'dosen',
    },
  });

  const mahasiswa1 = await prisma.user.create({
    data: {
      email: 'mahasiswa1@test.com',
      password: hashedPassword,
      name: 'Budi Santoso',
      role: 'mahasiswa',
      nim: '1234567890',
      prodi: 'Teknik Informatika',
    },
  });

  const mahasiswa2 = await prisma.user.create({
    data: {
      email: 'mahasiswa2@test.com',
      password: hashedPassword,
      name: 'Siti Nurhaliza',
      role: 'mahasiswa',
      nim: '0987654321',
      prodi: 'Sistem Informasi',
    },
  });

  console.log('✅ Users created');

  // Create Sidang Types
  const skripsi = await prisma.sidangType.create({
    data: {
      name: 'Sidang Skripsi',
    },
  });

  const proposal = await prisma.sidangType.create({
    data: {
      name: 'Sidang Proposal',
    },
  });

  const kompre = await prisma.sidangType.create({
    data: {
      name: 'Sidang Komprehensif',
    },
  });

  console.log('✅ Sidang types created');

  // Create Workflow Steps for Skripsi
  const skripsiStep1 = await prisma.workflowStep.create({
    data: {
      sidangTypeId: skripsi.id,
      role: 'dosen',
      stepOrder: 1,
    },
  });

  const skripsiStep2 = await prisma.workflowStep.create({
    data: {
      sidangTypeId: skripsi.id,
      role: 'dosen',
      stepOrder: 2,
    },
  });

  const skripsiStep3 = await prisma.workflowStep.create({
    data: {
      sidangTypeId: skripsi.id,
      role: 'akademik',
      stepOrder: 3,
    },
  });

  // Create Workflow Steps for Proposal
  await prisma.workflowStep.createMany({
    data: [
      { sidangTypeId: proposal.id, role: 'dosen', stepOrder: 1 },
      { sidangTypeId: proposal.id, role: 'akademik', stepOrder: 2 },
    ],
  });

  // Create Workflow Steps for Kompre
  await prisma.workflowStep.createMany({
    data: [
      { sidangTypeId: kompre.id, role: 'dosen', stepOrder: 1 },
      { sidangTypeId: kompre.id, role: 'dosen', stepOrder: 2 },
      { sidangTypeId: kompre.id, role: 'dosen', stepOrder: 3 },
      { sidangTypeId: kompre.id, role: 'akademik', stepOrder: 4 },
    ],
  });

  console.log('✅ Workflow steps created');

  // Create Requirements
  await prisma.requirement.createMany({
    data: [
      // Skripsi requirements
      { sidangTypeId: skripsi.id, name: 'Lembar Persetujuan Pembimbing' },
      { sidangTypeId: skripsi.id, name: 'Draft Skripsi' },
      { sidangTypeId: skripsi.id, name: 'Kartu Bimbingan' },
      { sidangTypeId: skripsi.id, name: 'Transkrip Nilai' },
      { sidangTypeId: skripsi.id, name: 'Sertifikat TOEFL' },
      { sidangTypeId: skripsi.id, name: 'Bukti Pembayaran UKT' },

      // Proposal requirements
      { sidangTypeId: proposal.id, name: 'Proposal Penelitian' },
      { sidangTypeId: proposal.id, name: 'Lembar Persetujuan Pembimbing' },
      { sidangTypeId: proposal.id, name: 'Transkrip Nilai Sementara' },

      // Kompre requirements
      { sidangTypeId: kompre.id, name: 'Transkrip Nilai Lengkap' },
      { sidangTypeId: kompre.id, name: 'Sertifikat Kompetensi' },
      { sidangTypeId: kompre.id, name: 'Bukti Pembayaran' },
    ],
  });

  console.log('✅ Requirements created');

  // Create sample requests
  const request1 = await prisma.request.create({
    data: {
      userId: mahasiswa1.id,
      sidangTypeId: skripsi.id,
      status: 'waiting_approval',
      currentStepId: skripsiStep1.id,
    },
  });

  const request2 = await prisma.request.create({
    data: {
      userId: mahasiswa2.id,
      sidangTypeId: proposal.id,
      status: 'approved',
      currentStepId: null,
    },
  });

  const request3 = await prisma.request.create({
    data: {
      userId: mahasiswa1.id,
      sidangTypeId: proposal.id,
      status: 'rejected',
      currentStepId: null,
    },
  });

  console.log('✅ Sample requests created');

  // Create approvals
  await prisma.approval.create({
    data: {
      requestId: request1.id,
      stepId: skripsiStep1.id,
      approverId: dosen1.id,
      status: 'pending',
    },
  });

  await prisma.approval.create({
    data: {
      requestId: request2.id,
      stepId: skripsiStep1.id,
      approverId: dosen1.id,
      status: 'approved',
      notes: 'Disetujui, sudah sesuai.',
      approvedAt: new Date(),
    },
  });

  console.log('✅ Approvals created');

  // Create a sidang session
  const sidang1 = await prisma.sidang.create({
    data: {
      requestId: request2.id,
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      location: 'Ruang Sidang 301',
      status: 'scheduled',
    },
  });

  console.log('✅ Sidang session created');

  console.log('🎉 Seeding completed!');
  console.log('\nTest Users:');
  console.log('Admin:', admin.email, '/ test123');
  console.log('Akademik:', akademik.email, '/ test123');
  console.log('Dosen 1:', dosen1.email, '/ test123');
  console.log('Dosen 2:', dosen2.email, '/ test123');
  console.log('Dosen 3:', dosen3.email, '/ test123');
  console.log('Mahasiswa 1:', mahasiswa1.email, '/ test123');
  console.log('Mahasiswa 2:', mahasiswa2.email, '/ test123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Run seeding**:

```bash
npx prisma db seed
```

---

### Test User Credentials

| Role | Email | Password | Name | NIM/ID |
|------|-------|----------|------|--------|
| Admin | admin@test.com | test123 | Admin Test | - |
| Akademik | akademik@test.com | test123 | Akademik Test | - |
| Dosen 1 | dosen1@test.com | test123 | Prof. Dr. Dosen Satu | - |
| Dosen 2 | dosen2@test.com | test123 | Dr. Dosen Dua, M.Kom | - |
| Dosen 3 | dosen3@test.com | test123 | Dr. Dosen Tiga, M.T | - |
| Mahasiswa 1 | mahasiswa1@test.com | test123 | Budi Santoso | 1234567890 |
| Mahasiswa 2 | mahasiswa2@test.com | test123 | Siti Nurhaliza | 0987654321 |

---

### Test Files

**Location**: `tests/fixtures/files/`

```bash
# Create test fixture files
mkdir -p tests/fixtures/files

# Valid PDF (1MB)
dd if=/dev/zero of=tests/fixtures/files/valid-document.pdf bs=1M count=1

# Valid Image (500KB)
convert -size 1920x1080 xc:white tests/fixtures/files/valid-image.jpg

# Large file (11MB - should fail)
dd if=/dev/zero of=tests/fixtures/files/too-large.pdf bs=1M count=11

# Invalid file type
echo "test" > tests/fixtures/files/invalid.txt
```

---

## Test Execution Plan

### Daily Testing (CI/CD)

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:unit
      - run: npm run test:coverage

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx prisma migrate deploy
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install
      - run: npm run test:e2e
```

---

### Weekly Testing

- [ ] Full regression test suite
- [ ] Security scan with OWASP ZAP
- [ ] Performance testing with k6
- [ ] Accessibility audit with axe
- [ ] Cross-browser testing
- [ ] Mobile device testing

---

### Pre-Release Testing

- [ ] Complete manual testing checklist
- [ ] Load testing with production-like data
- [ ] Stress testing
- [ ] Security penetration testing
- [ ] Full accessibility audit
- [ ] Performance benchmarking
- [ ] User acceptance testing (UAT)

---

## Test Metrics & Reporting

### Coverage Goals

| Type | Target | Current |
|------|--------|---------|
| Unit Tests | 80% | TBD |
| Integration Tests | 70% | TBD |
| E2E Critical Paths | 100% | TBD |
| Security Tests | 100% | TBD |

### Test Report Template

```markdown
# Test Report - [Date]

## Summary
- Total Tests: X
- Passed: X
- Failed: X
- Skipped: X
- Duration: X minutes

## Coverage
- Lines: X%
- Branches: X%
- Functions: X%
- Statements: X%

## Failed Tests
1. [Test Name] - [Reason]
2. ...

## Performance Metrics
- Average Response Time: Xms
- 95th Percentile: Xms
- Failed Requests: X%

## Security Issues
- High: X
- Medium: X
- Low: X

## Action Items
1. [ ] Fix failing test X
2. [ ] Improve coverage for module Y
3. ...
```

---

## Conclusion

This comprehensive testing plan covers:

✅ **Unit Testing** - 9 test suites, 50+ test cases, 80%+ coverage target
✅ **Integration Testing** - 7 API test suites, 50+ test cases, 70%+ coverage target
✅ **E2E Testing** - 6 critical scenarios, ~9 minutes total duration
✅ **Manual Testing** - Complete checklists for all 4 roles
✅ **Security Testing** - OWASP Top 10 coverage, automated security scans
✅ **Performance Testing** - Load testing, stress testing, query optimization
✅ **Accessibility Testing** - WCAG 2.1 AA compliance, keyboard nav, screen readers
✅ **Test Data** - Complete seed data, 7 test users, fixture files

**Total Estimated Testing Time**:
- Unit Tests: ~2 minutes
- Integration Tests: ~3 minutes
- E2E Tests: ~9 minutes
- Manual Testing: ~4 hours (full checklist)
- Security Testing: ~30 minutes (automated)
- Performance Testing: ~15 minutes
- Accessibility Testing: ~30 minutes

**Next Steps**:
1. Set up test environment
2. Implement test suites incrementally
3. Integrate with CI/CD pipeline
4. Monitor test metrics
5. Maintain and update tests as features evolve

---

**Document Version**: 1.0
**Last Updated**: 2025-11-17
**Total Test Cases**: 200+
**Coverage Target**: 80% overall
