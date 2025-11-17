import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FileUploadWithPreview from '../FileUploadWithPreview'

// Mock toast
jest.mock('@/lib/toast', () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
}))

import { showError } from '@/lib/toast'

describe('FileUploadWithPreview Component', () => {
  const mockOnFileSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders with default props', () => {
    render(<FileUploadWithPreview onFileSelect={mockOnFileSelect} />)

    expect(screen.getByText('Upload File')).toBeInTheDocument()
    expect(screen.getByText('Max 10MB')).toBeInTheDocument()
    expect(screen.getByText(/Drag & drop file atau klik untuk memilih/)).toBeInTheDocument()
  })

  test('renders with custom label and maxSize', () => {
    render(
      <FileUploadWithPreview
        onFileSelect={mockOnFileSelect}
        label="Upload Document"
        maxSize={5}
      />
    )

    expect(screen.getByText('Upload Document')).toBeInTheDocument()
    expect(screen.getByText('Max 5MB')).toBeInTheDocument()
    expect(screen.getByText(/Ukuran maksimal: 5MB/)).toBeInTheDocument()
  })

  test('shows required asterisk when required is true', () => {
    render(
      <FileUploadWithPreview
        onFileSelect={mockOnFileSelect}
        label="Document"
        required={true}
      />
    )

    const asterisk = screen.getByText('*')
    expect(asterisk).toBeInTheDocument()
    expect(asterisk).toHaveClass('text-red-500')
  })

  test('handles file selection via input', async () => {
    const { container } = render(<FileUploadWithPreview onFileSelect={mockOnFileSelect} />)

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    })

    fireEvent.change(input)

    expect(mockOnFileSelect).toHaveBeenCalledWith(file)
  })

  test('shows error for file larger than maxSize', async () => {
    const { container } = render(<FileUploadWithPreview onFileSelect={mockOnFileSelect} maxSize={1} />)

    // Create a 2MB file
    const largeFile = new File(['a'.repeat(2 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    })

    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    Object.defineProperty(input, 'files', {
      value: [largeFile],
      writable: false,
    })

    fireEvent.change(input)

    expect(showError).toHaveBeenCalledWith('File terlalu besar! Maksimal 1MB')
    expect(mockOnFileSelect).not.toHaveBeenCalled()
  })

  test('displays file preview for images', async () => {
    const { container } = render(<FileUploadWithPreview onFileSelect={mockOnFileSelect} />)

    const imageFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    Object.defineProperty(input, 'files', {
      value: [imageFile],
      writable: false,
    })

    fireEvent.change(input)

    expect(mockOnFileSelect).toHaveBeenCalledWith(imageFile)

    // Note: Preview will use mocked FileReader from jest.setup.js
  })

  test('shows file icon for non-image files', async () => {
    const { rerender } = render(
      <FileUploadWithPreview
        onFileSelect={mockOnFileSelect}
        currentFile={new File(['content'], 'test.pdf', { type: 'application/pdf' })}
      />
    )

    expect(screen.getByText('📄')).toBeInTheDocument()
    expect(screen.getByText('test.pdf')).toBeInTheDocument()

    rerender(
      <FileUploadWithPreview
        onFileSelect={mockOnFileSelect}
        currentFile={new File(['content'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })}
      />
    )

    expect(screen.getByText('📝')).toBeInTheDocument()

    rerender(
      <FileUploadWithPreview
        onFileSelect={mockOnFileSelect}
        currentFile={new File(['content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })}
      />
    )

    expect(screen.getByText('📊')).toBeInTheDocument()
  })

  test('formats file size correctly', () => {
    render(
      <FileUploadWithPreview
        onFileSelect={mockOnFileSelect}
        currentFile={new File(['a'.repeat(1024)], 'test.txt', { type: 'text/plain' })}
      />
    )

    expect(screen.getByText('1 KB')).toBeInTheDocument()
  })

  test('handles drag and drop events', () => {
    render(<FileUploadWithPreview onFileSelect={mockOnFileSelect} />)

    const dropZone = screen.getByText(/Drag & drop file atau klik untuk memilih/).parentElement!

    // Drag over
    fireEvent.dragOver(dropZone)
    expect(screen.getByText('Drop file di sini')).toBeInTheDocument()
    expect(screen.getByText('📥')).toBeInTheDocument()

    // Drag leave
    fireEvent.dragLeave(dropZone)
    expect(screen.getByText('📤')).toBeInTheDocument()

    // Drop file
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file],
      },
    })

    expect(mockOnFileSelect).toHaveBeenCalledWith(file)
  })

  test('opens file picker when drop zone is clicked', () => {
    const { container } = render(<FileUploadWithPreview onFileSelect={mockOnFileSelect} />)

    const dropZone = screen.getByText(/Drag & drop file atau klik untuk memilih/).parentElement!
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    const clickSpy = jest.spyOn(input, 'click')

    fireEvent.click(dropZone)

    expect(clickSpy).toHaveBeenCalled()
  })

  test('can replace existing file', () => {
    const { container } = render(
      <FileUploadWithPreview
        onFileSelect={mockOnFileSelect}
        currentFile={new File(['old'], 'old.pdf', { type: 'application/pdf' })}
      />
    )

    const replaceButton = screen.getByTitle('Ganti file')
    expect(replaceButton).toBeInTheDocument()

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const clickSpy = jest.spyOn(input, 'click')

    fireEvent.click(replaceButton)

    expect(clickSpy).toHaveBeenCalled()
  })

  test('can remove selected file', () => {
    render(
      <FileUploadWithPreview
        onFileSelect={mockOnFileSelect}
        currentFile={new File(['content'], 'test.pdf', { type: 'application/pdf' })}
      />
    )

    const removeButton = screen.getByTitle('Hapus file')
    fireEvent.click(removeButton)

    expect(mockOnFileSelect).toHaveBeenCalledWith(null)
  })

  test('clears input value when file is removed', () => {
    const { container } = render(
      <FileUploadWithPreview
        onFileSelect={mockOnFileSelect}
        currentFile={new File(['content'], 'test.pdf', { type: 'application/pdf' })}
      />
    )

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const removeButton = screen.getByTitle('Hapus file')

    fireEvent.click(removeButton)

    expect(input.value).toBe('')
  })

  test('respects accept prop for file input', () => {
    const { container } = render(
      <FileUploadWithPreview
        onFileSelect={mockOnFileSelect}
        accept="image/*"
      />
    )

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toHaveAttribute('accept', 'image/*')
  })
})
