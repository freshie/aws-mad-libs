import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ImageGallery } from '@/components/ImageGallery'
import { CompletedParagraph } from '@/types'

describe('ImageGallery', () => {
  const mockParagraphs: CompletedParagraph[] = [
    {
      id: 'para-1',
      text: 'First paragraph text',
      imageUrl: 'https://example.com/image1.jpg',
      wordHighlights: []
    },
    {
      id: 'para-2',
      text: 'Second paragraph text',
      imageUrl: 'https://example.com/image2.jpg',
      wordHighlights: []
    },
    {
      id: 'para-3',
      text: 'Third paragraph text',
      imageUrl: null,
      wordHighlights: []
    }
  ]

  const mockOnImageClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render images in grid layout', () => {
    render(<ImageGallery paragraphs={mockParagraphs} onImageClick={mockOnImageClick} />)
    
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2) // Only paragraphs with imageUrl
    
    expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg')
    expect(images[0]).toHaveAttribute('alt', 'Story illustration 1')
    expect(images[1]).toHaveAttribute('src', 'https://example.com/image2.jpg')
    expect(images[1]).toHaveAttribute('alt', 'Story illustration 2')
  })

  it('should highlight current image', () => {
    render(<ImageGallery paragraphs={mockParagraphs} currentIndex={1} onImageClick={mockOnImageClick} />)
    
    const imageContainers = document.querySelectorAll('[class*="ring-4"]')
    expect(imageContainers).toHaveLength(1) // Only second image should be highlighted
  })

  it('should show loading placeholder for paragraphs without images', () => {
    render(<ImageGallery paragraphs={mockParagraphs} onImageClick={mockOnImageClick} />)
    
    expect(screen.getByText('Image loading...')).toBeInTheDocument()
    expect(screen.getByText('🖼️')).toBeInTheDocument()
  })

  it('should handle image click', () => {
    render(<ImageGallery paragraphs={mockParagraphs} onImageClick={mockOnImageClick} />)
    
    const firstImage = screen.getAllByRole('img')[0]
    fireEvent.click(firstImage.closest('div')!)
    
    expect(mockOnImageClick).toHaveBeenCalledWith(0)
  })

  it('should open modal when image is clicked', () => {
    render(<ImageGallery paragraphs={mockParagraphs} />)
    
    const firstImage = screen.getAllByRole('img')[0]
    fireEvent.click(firstImage.closest('div')!)
    
    // Modal should be visible
    expect(screen.getByText('Paragraph 1')).toBeInTheDocument()
    expect(screen.getByText(/First paragraph text/)).toBeInTheDocument()
  })

  it('should close modal when close button is clicked', () => {
    render(<ImageGallery paragraphs={mockParagraphs} />)
    
    // Open modal
    const firstImage = screen.getAllByRole('img')[0]
    fireEvent.click(firstImage.closest('div')!)
    
    // Close modal
    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)
    
    // Modal should be closed
    expect(screen.queryByText('Paragraph 1')).not.toBeInTheDocument()
  })

  it('should navigate between images in modal', () => {
    render(<ImageGallery paragraphs={mockParagraphs} />)
    
    // Open modal with first image
    const firstImage = screen.getAllByRole('img')[0]
    fireEvent.click(firstImage.closest('div')!)
    
    expect(screen.getByText('Paragraph 1')).toBeInTheDocument()
    
    // Navigate to next image
    const nextButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg path[d*="M9 5l7 7-7 7"]')
    )
    fireEvent.click(nextButton!)
    
    expect(screen.getByText('Paragraph 2')).toBeInTheDocument()
    
    // Navigate to previous image
    const prevButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg path[d*="M15 19l-7-7 7-7"]')
    )
    fireEvent.click(prevButton!)
    
    expect(screen.getByText('Paragraph 1')).toBeInTheDocument()
  })

  it('should handle image load errors', async () => {
    render(<ImageGallery paragraphs={mockParagraphs} />)
    
    const firstImage = screen.getAllByRole('img')[0]
    
    // Simulate image load error
    fireEvent.error(firstImage)
    
    await waitFor(() => {
      // Image should be hidden after error
      expect(screen.getAllByRole('img')).toHaveLength(1) // Only second image remains
    })
  })

  it('should show empty state when no images are available', () => {
    const paragraphsWithoutImages = mockParagraphs.map(p => ({ ...p, imageUrl: null }))
    
    render(<ImageGallery paragraphs={paragraphsWithoutImages} />)
    
    expect(screen.getByText('Images are being generated...')).toBeInTheDocument()
    expect(screen.getByText('🎨')).toBeInTheDocument()
  })

  it('should show paragraph labels', () => {
    render(<ImageGallery paragraphs={mockParagraphs} />)
    
    expect(screen.getByText('Paragraph 1')).toBeInTheDocument()
    expect(screen.getByText('Paragraph 2')).toBeInTheDocument()
  })

  it('should handle hover effects', () => {
    render(<ImageGallery paragraphs={mockParagraphs} />)
    
    const imageContainer = screen.getAllByRole('img')[0].closest('div')!
    
    // Should have hover classes
    expect(imageContainer).toHaveClass('hover:shadow-md', 'hover:scale-105')
  })
})