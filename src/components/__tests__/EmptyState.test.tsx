import { render, screen, fireEvent } from '@testing-library/react'
import EmptyState from '../EmptyState'

describe('EmptyState Component', () => {
  test('renders with icon, title and description', () => {
    render(
      <EmptyState
        icon="📭"
        title="No data found"
        description="There are no items to display"
      />
    )

    expect(screen.getByText('📭')).toBeInTheDocument()
    expect(screen.getByText('No data found')).toBeInTheDocument()
    expect(screen.getByText('There are no items to display')).toBeInTheDocument()
  })

  test('renders with default icon when not provided', () => {
    render(<EmptyState title="Empty" />)

    expect(screen.getByText('📭')).toBeInTheDocument()
    expect(screen.getByText('Empty')).toBeInTheDocument()
  })

  test('renders without description when not provided', () => {
    render(<EmptyState title="No items" />)

    expect(screen.getByText('No items')).toBeInTheDocument()
    expect(screen.queryByText(/There are no/)).not.toBeInTheDocument()
  })

  test('renders action button with href link', () => {
    render(
      <EmptyState
        title="Empty"
        action={{
          label: 'Create New',
          href: '/create',
        }}
      />
    )

    const link = screen.getByRole('link', { name: 'Create New' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/create')
    expect(link).toHaveClass('btn-primary')
  })

  test('renders action button with onClick handler', () => {
    const handleClick = jest.fn()

    render(
      <EmptyState
        title="Empty"
        action={{
          label: 'Add Item',
          onClick: handleClick,
        }}
      />
    )

    const button = screen.getByRole('button', { name: 'Add Item' })
    expect(button).toBeInTheDocument()

    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('does not render action when not provided', () => {
    render(<EmptyState title="No action" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  test('applies correct CSS classes', () => {
    const { container } = render(
      <EmptyState
        icon="🎉"
        title="Test"
        description="Test description"
      />
    )

    const wrapper = container.querySelector('div')
    expect(wrapper).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center')

    const icon = screen.getByText('🎉')
    expect(icon).toHaveClass('animate-bounce')
  })
})
