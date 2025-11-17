import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import ConfirmDialog, { useConfirm } from '../ConfirmDialog'

describe('ConfirmDialog Component', () => {
  const mockOnConfirm = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders dialog when isOpen is true', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('Delete Item')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument()
  })

  test('does not render when isOpen is false', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="Delete Item"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.queryByText('Delete Item')).not.toBeInTheDocument()
  })

  test('calls onConfirm when confirm button is clicked', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm Action"
        message="Please confirm"
        confirmText="Yes, Delete"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const confirmButton = screen.getByRole('button', { name: 'Yes, Delete' })
    fireEvent.click(confirmButton)

    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
  })

  test('calls onCancel when cancel button is clicked', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm Action"
        message="Please confirm"
        cancelText="No, Keep"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByRole('button', { name: 'No, Keep' })
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  test('uses default button text when not provided', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByRole('button', { name: 'Konfirmasi' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Batal' })).toBeInTheDocument()
  })

  test('applies correct color classes based on confirmColor prop', () => {
    const { rerender } = render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm"
        message="Test"
        confirmColor="error"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    let confirmButton = screen.getByRole('button', { name: 'Konfirmasi' })
    expect(confirmButton).toHaveClass('btn-error')

    rerender(
      <ConfirmDialog
        isOpen={true}
        title="Confirm"
        message="Test"
        confirmColor="primary"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    confirmButton = screen.getByRole('button', { name: 'Konfirmasi' })
    expect(confirmButton).toHaveClass('btn-primary')
  })

  test('has backdrop overlay with correct classes', () => {
    const { container } = render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm"
        message="Test"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const backdrop = container.querySelector('.fixed.inset-0')
    expect(backdrop).toBeInTheDocument()
    expect(backdrop).toHaveClass('bg-black', 'bg-opacity-50', 'z-50')
  })
})

describe('useConfirm Hook', () => {
  test('returns confirm function and ConfirmDialogComponent', () => {
    const { result } = renderHook(() => useConfirm())

    expect(result.current.confirm).toBeDefined()
    expect(result.current.ConfirmDialogComponent).toBeDefined()
  })

  test('confirm function opens dialog with correct props', async () => {
    function TestComponent() {
      const { confirm, ConfirmDialogComponent } = useConfirm()

      return (
        <div>
          <button
            onClick={() => {
              confirm({
                title: 'Delete',
                message: 'Are you sure?',
                confirmText: 'Yes',
              })
            }}
          >
            Open Dialog
          </button>
          <ConfirmDialogComponent />
        </div>
      )
    }

    render(<TestComponent />)

    const openButton = screen.getByText('Open Dialog')
    fireEvent.click(openButton)

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument()
      expect(screen.getByText('Are you sure?')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument()
    })
  })

  test('confirm function returns promise that resolves on confirm', async () => {
    let resolvedValue: boolean | undefined

    function TestComponent() {
      const { confirm, ConfirmDialogComponent } = useConfirm()

      const handleClick = async () => {
        resolvedValue = await confirm({
          title: 'Test',
          message: 'Test message',
        })
      }

      return (
        <div>
          <button onClick={handleClick}>Open Dialog</button>
          <ConfirmDialogComponent />
        </div>
      )
    }

    render(<TestComponent />)

    const openButton = screen.getByText('Open Dialog')
    fireEvent.click(openButton)

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole('button', { name: 'Konfirmasi' })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(resolvedValue).toBe(true)
    })
  })
})
