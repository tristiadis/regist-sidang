import { render, screen } from '@testing-library/react'
import { TableSkeleton, CardSkeleton, StatsSkeleton, TimelineSkeleton } from '../LoadingSkeleton'

describe('TableSkeleton Component', () => {
  test('renders with default rows (5)', () => {
    const { container } = render(<TableSkeleton />)

    const rows = container.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(5)
  })

  test('renders with custom number of rows', () => {
    const { container } = render(<TableSkeleton rows={10} />)

    const rows = container.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(10)
  })

  test('renders 7 column headers', () => {
    const { container } = render(<TableSkeleton />)

    const headers = container.querySelectorAll('thead th')
    expect(headers).toHaveLength(7)
  })

  test('each row has 7 cells', () => {
    const { container } = render(<TableSkeleton rows={3} />)

    const firstRow = container.querySelector('tbody tr')
    const cells = firstRow?.querySelectorAll('td')
    expect(cells).toHaveLength(7)
  })

  test('has animate-pulse class for loading animation', () => {
    const { container } = render(<TableSkeleton />)

    const skeletonElements = container.querySelectorAll('.animate-pulse')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })
})

describe('CardSkeleton Component', () => {
  test('renders with default count (3)', () => {
    const { container } = render(<CardSkeleton />)

    const cards = container.querySelectorAll('.card')
    expect(cards).toHaveLength(3)
  })

  test('renders with custom count', () => {
    const { container } = render(<CardSkeleton count={5} />)

    const cards = container.querySelectorAll('.card')
    expect(cards).toHaveLength(5)
  })

  test('each card has animate-pulse class', () => {
    const { container } = render(<CardSkeleton count={2} />)

    const cards = container.querySelectorAll('.card.animate-pulse')
    expect(cards).toHaveLength(2)
  })

  test('each card has skeleton elements', () => {
    const { container } = render(<CardSkeleton count={1} />)

    const card = container.querySelector('.card')
    const skeletonBars = card?.querySelectorAll('.bg-gray-200')
    expect(skeletonBars!.length).toBeGreaterThan(0)
  })
})

describe('StatsSkeleton Component', () => {
  test('renders 4 stat items', () => {
    const { container } = render(<StatsSkeleton />)

    const stats = container.querySelectorAll('.stat')
    expect(stats).toHaveLength(4)
  })

  test('uses grid layout with correct classes', () => {
    const { container } = render(<StatsSkeleton />)

    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('grid-cols-2', 'md:grid-cols-4')
  })

  test('each stat has animate-pulse class', () => {
    const { container } = render(<StatsSkeleton />)

    const stats = container.querySelectorAll('.stat.animate-pulse')
    expect(stats).toHaveLength(4)
  })

  test('each stat has skeleton elements', () => {
    const { container } = render(<StatsSkeleton />)

    const firstStat = container.querySelector('.stat')
    const skeletonBars = firstStat?.querySelectorAll('.bg-gray-200')
    expect(skeletonBars).toHaveLength(2) // Title and value bars
  })
})

describe('TimelineSkeleton Component', () => {
  test('renders with default items (3)', () => {
    const { container } = render(<TimelineSkeleton />)

    const items = container.querySelectorAll('.flex.gap-3')
    expect(items).toHaveLength(3)
  })

  test('renders with custom number of items', () => {
    const { container } = render(<TimelineSkeleton items={5} />)

    const items = container.querySelectorAll('.flex.gap-3')
    expect(items).toHaveLength(5)
  })

  test('each item has animate-pulse class', () => {
    const { container } = render(<TimelineSkeleton items={2} />)

    const animatedItems = container.querySelectorAll('.animate-pulse')
    expect(animatedItems).toHaveLength(2)
  })

  test('timeline dots are rendered correctly', () => {
    const { container } = render(<TimelineSkeleton items={3} />)

    const dots = container.querySelectorAll('.rounded-full.bg-gray-200')
    expect(dots).toHaveLength(3)
  })

  test('last item does not have connector line', () => {
    const { container } = render(<TimelineSkeleton items={3} />)

    const allItems = container.querySelectorAll('.flex.gap-3')
    const lastItem = allItems[allItems.length - 1]
    const connector = lastItem.querySelector('.w-0\\.5')

    expect(connector).not.toBeInTheDocument()
  })

  test('non-last items have connector lines', () => {
    const { container } = render(<TimelineSkeleton items={3} />)

    const allItems = container.querySelectorAll('.flex.gap-3')
    const firstItem = allItems[0]
    const connector = firstItem.querySelector('.w-0\\.5')

    expect(connector).toBeInTheDocument()
  })
})

describe('All Skeleton Components - General', () => {
  test('all skeletons have proper spacing', () => {
    const { container: tableContainer } = render(<TableSkeleton />)
    const { container: cardContainer } = render(<CardSkeleton />)
    const { container: statsContainer } = render(<StatsSkeleton />)
    const { container: timelineContainer } = render(<TimelineSkeleton />)

    // Check that they have spacing classes
    expect(cardContainer.querySelector('.space-y-4')).toBeInTheDocument()
    expect(statsContainer.querySelector('.gap-3, .gap-4')).toBeInTheDocument()
    expect(timelineContainer.querySelector('.space-y-3')).toBeInTheDocument()
  })

  test('all skeletons use gray-200 color for skeleton bars', () => {
    const { container: tableContainer } = render(<TableSkeleton />)
    const { container: cardContainer } = render(<CardSkeleton />)
    const { container: statsContainer } = render(<StatsSkeleton />)
    const { container: timelineContainer } = render(<TimelineSkeleton />)

    expect(tableContainer.querySelectorAll('.bg-gray-200').length).toBeGreaterThan(0)
    expect(cardContainer.querySelectorAll('.bg-gray-200').length).toBeGreaterThan(0)
    expect(statsContainer.querySelectorAll('.bg-gray-200').length).toBeGreaterThan(0)
    expect(timelineContainer.querySelectorAll('.bg-gray-200').length).toBeGreaterThan(0)
  })
})
