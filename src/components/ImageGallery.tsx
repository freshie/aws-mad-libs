'use client'

import { useState } from 'react'
import { CompletedParagraph } from '@/types'

interface ImageGalleryProps {
  paragraphs: CompletedParagraph[]
  currentIndex?: number
  onImageClick?: (index: number) => void
}

export function ImageGallery({ paragraphs, currentIndex = 0, onImageClick }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set())

  const handleImageError = (index: number) => {
    setImageLoadErrors(prev => new Set(prev).add(index))
  }

  const handleImageClick = (index: number) => {
    setSelectedImage(index)
    onImageClick?.(index)
  }

  const closeModal = () => {
    setSelectedImage(null)
  }

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImage === null) return
    
    const newIndex = direction === 'prev' 
      ? (selectedImage - 1 + paragraphs.length) % paragraphs.length
      : (selectedImage + 1) % paragraphs.length
    
    setSelectedImage(newIndex)
  }

  const imagesWithUrls = paragraphs.filter(p => p.imageUrl && !imageLoadErrors.has(paragraphs.indexOf(p)))

  if (imagesWithUrls.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-2">🎨</div>
        <p className="text-gray-500">Images are being generated...</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paragraphs.map((paragraph, index) => (
          <div key={paragraph.id} className="relative group">
            {paragraph.imageUrl && !imageLoadErrors.has(index) ? (
              <div
                className={`relative overflow-hidden rounded-lg cursor-pointer transition-all duration-200 ${
                  index === currentIndex 
                    ? 'ring-4 ring-primary-500 shadow-lg' 
                    : 'hover:shadow-md hover:scale-105'
                }`}
                onClick={() => handleImageClick(index)}
              >
                <img
                  src={paragraph.imageUrl}
                  alt={`Story illustration ${index + 1}`}
                  className="w-full h-48 object-cover"
                  onError={() => handleImageError(index)}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="bg-white bg-opacity-90 rounded-full p-2">
                      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                  <p className="text-white text-sm font-medium">
                    Paragraph {index + 1}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 text-2xl mb-2">🖼️</div>
                  <p className="text-gray-500 text-sm">Image loading...</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImage !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <img
              src={paragraphs[selectedImage].imageUrl!}
              alt={`Story illustration ${selectedImage + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />

            {/* Navigation arrows */}
            {paragraphs.length > 1 && (
              <>
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Image info */}
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg">
              <h3 className="font-bold mb-2">Paragraph {selectedImage + 1}</h3>
              <p className="text-sm opacity-90">
                {paragraphs[selectedImage].text.substring(0, 150)}
                {paragraphs[selectedImage].text.length > 150 ? '...' : ''}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}