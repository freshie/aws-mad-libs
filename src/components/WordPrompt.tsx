'use client'

import { useState } from 'react'
import { WordType } from '@/types'
import { validateWord } from '@/utils/validation'
import { LoadingSpinner } from './LoadingSpinner'

interface WordPromptProps {
  wordType: WordType
  position: number
  totalWords: number
  playerName: string
  onSubmit: (word: string) => Promise<void>
  isLoading?: boolean
  usedWords?: string[]
}

export function WordPrompt({ 
  wordType, 
  position, 
  totalWords, 
  playerName, 
  onSubmit, 
  isLoading = false,
  usedWords = []
}: WordPromptProps) {
  const [word, setWord] = useState('')
  const [error, setError] = useState('')

  const getWordTypeDisplay = (type: WordType): string => {
    switch (type) {
      case WordType.NOUN: return 'Noun'
      case WordType.VERB: return 'Verb'
      case WordType.ADJECTIVE: return 'Adjective'
      case WordType.ADVERB: return 'Adverb'
      case WordType.PLURAL_NOUN: return 'Plural Noun'
      case WordType.PAST_TENSE_VERB: return 'Past Tense Verb'
      case WordType.COLOR: return 'Color'
      case WordType.NUMBER: return 'Number'
      case WordType.PLACE: return 'Place'
      case WordType.PERSON: return 'Person'
      default: return type
    }
  }

  const getWordTypeExample = (type: WordType): string => {
    switch (type) {
      case WordType.NOUN: return 'cat, house, book'
      case WordType.VERB: return 'run, jump, sing'
      case WordType.ADJECTIVE: return 'funny, big, red'
      case WordType.ADVERB: return 'quickly, loudly, carefully'
      case WordType.PLURAL_NOUN: return 'cats, houses, books'
      case WordType.PAST_TENSE_VERB: return 'ran, jumped, sang'
      case WordType.COLOR: return 'blue, green, purple'
      case WordType.NUMBER: return '5, 100, 42'
      case WordType.PLACE: return 'park, school, Mars'
      case WordType.PERSON: return 'teacher, superhero, friend'
      default: return ''
    }
  }

  const getRandomWord = (type: WordType): string => {
    const wordLists = {
      [WordType.NOUN]: [
        'dragon', 'pizza', 'robot', 'unicorn', 'spaceship', 'banana', 'castle', 'dinosaur', 'wizard', 'sandwich',
        'elephant', 'computer', 'bicycle', 'telephone', 'butterfly', 'hamburger', 'rainbow', 'volcano', 'treasure',
        'monster', 'rocket', 'pickle', 'toothbrush', 'umbrella', 'pancake', 'octopus', 'guitar', 'submarine',
        'helicopter', 'chocolate', 'tornado', 'penguin', 'mushroom', 'telescope', 'dinosaur', 'spaceship', 'cookie'
      ],
      [WordType.VERB]: [
        'dance', 'fly', 'giggle', 'bounce', 'wiggle', 'zoom', 'sparkle', 'tumble', 'whisper', 'gallop',
        'sprint', 'crawl', 'swim', 'climb', 'jump', 'skip', 'hop', 'slide', 'roll', 'spin',
        'march', 'sneak', 'float', 'dive', 'swing', 'twist', 'stretch', 'bend', 'flip', 'soar'
      ],
      [WordType.ADJECTIVE]: [
        'silly', 'sparkly', 'enormous', 'tiny', 'magical', 'fuzzy', 'slimy', 'bouncy', 'mysterious', 'colorful',
        'gigantic', 'microscopic', 'fluffy', 'sticky', 'smooth', 'rough', 'shiny', 'dull', 'bright', 'dark',
        'loud', 'quiet', 'fast', 'slow', 'hot', 'cold', 'sweet', 'sour', 'funny', 'serious', 'crazy', 'calm'
      ],
      [WordType.ADVERB]: [
        'quickly', 'silently', 'gracefully', 'wildly', 'carefully', 'loudly', 'smoothly', 'frantically', 'gently', 'boldly',
        'slowly', 'rapidly', 'quietly', 'noisily', 'elegantly', 'clumsily', 'bravely', 'nervously', 'happily', 'sadly',
        'angrily', 'peacefully', 'mysteriously', 'obviously', 'suddenly', 'gradually', 'perfectly', 'terribly'
      ],
      [WordType.PLURAL_NOUN]: [
        'cookies', 'butterflies', 'rockets', 'bubbles', 'monsters', 'rainbows', 'jellybeans', 'puppies', 'stars', 'flowers',
        'elephants', 'computers', 'bicycles', 'telephones', 'hamburgers', 'volcanoes', 'treasures', 'pickles', 'umbrellas',
        'pancakes', 'octopi', 'guitars', 'submarines', 'helicopters', 'chocolates', 'tornadoes', 'penguins', 'mushrooms'
      ],
      [WordType.PAST_TENSE_VERB]: [
        'jumped', 'laughed', 'exploded', 'melted', 'transformed', 'disappeared', 'glowed', 'bounced', 'whispered', 'danced',
        'sprinted', 'crawled', 'swam', 'climbed', 'skipped', 'hopped', 'slid', 'rolled', 'spun', 'marched',
        'sneaked', 'floated', 'dove', 'swung', 'twisted', 'stretched', 'bent', 'flipped', 'soared', 'galloped'
      ],
      [WordType.COLOR]: [
        'purple', 'turquoise', 'magenta', 'lime', 'coral', 'golden', 'silver', 'rainbow', 'neon', 'sparkly',
        'crimson', 'emerald', 'sapphire', 'amber', 'violet', 'indigo', 'chartreuse', 'fuchsia', 'teal', 'maroon',
        'burgundy', 'navy', 'olive', 'tan', 'beige', 'ivory', 'pearl', 'bronze', 'copper', 'platinum'
      ],
      [WordType.NUMBER]: [
        '7', '42', '100', '3', '99', '13', '777', '21', '88', '5',
        '11', '25', '50', '75', '123', '456', '789', '1000', '2024', '365',
        '12', '24', '36', '48', '60', '72', '84', '96', '144', '200'
      ],
      [WordType.PLACE]: [
        'Mars', 'castle', 'jungle', 'moon', 'volcano', 'beach', 'cave', 'forest', 'spaceship', 'playground',
        'library', 'kitchen', 'bathroom', 'garage', 'attic', 'basement', 'garden', 'park', 'school', 'hospital',
        'restaurant', 'museum', 'theater', 'stadium', 'airport', 'train station', 'mall', 'office', 'factory'
      ],
      [WordType.PERSON]: [
        'superhero', 'pirate', 'wizard', 'chef', 'astronaut', 'ninja', 'princess', 'robot', 'detective', 'artist',
        'teacher', 'doctor', 'firefighter', 'police officer', 'scientist', 'musician', 'dancer', 'athlete', 'pilot',
        'sailor', 'farmer', 'baker', 'mechanic', 'librarian', 'photographer', 'writer', 'actor', 'singer', 'clown'
      ]
    }
    
    const allWords = wordLists[type] || ['mystery']
    
    // Filter out words that have already been used
    const availableWords = allWords.filter(word => 
      !usedWords?.some(usedWord => usedWord.toLowerCase() === word.toLowerCase())
    )
    
    // If all words are used, fall back to the full list
    const wordsToUse = availableWords.length > 0 ? availableWords : allWords
    
    return wordsToUse[Math.floor(Math.random() * wordsToUse.length)]
  }

  const getAvailableWordCount = (type: WordType): number => {
    const wordLists = {
      [WordType.NOUN]: [
        'dragon', 'pizza', 'robot', 'unicorn', 'spaceship', 'banana', 'castle', 'dinosaur', 'wizard', 'sandwich',
        'elephant', 'computer', 'bicycle', 'telephone', 'butterfly', 'hamburger', 'rainbow', 'volcano', 'treasure',
        'monster', 'rocket', 'pickle', 'toothbrush', 'umbrella', 'pancake', 'octopus', 'guitar', 'submarine',
        'helicopter', 'chocolate', 'tornado', 'penguin', 'mushroom', 'telescope', 'dinosaur', 'spaceship', 'cookie'
      ],
      [WordType.VERB]: [
        'dance', 'fly', 'giggle', 'bounce', 'wiggle', 'zoom', 'sparkle', 'tumble', 'whisper', 'gallop',
        'sprint', 'crawl', 'swim', 'climb', 'jump', 'skip', 'hop', 'slide', 'roll', 'spin',
        'march', 'sneak', 'float', 'dive', 'swing', 'twist', 'stretch', 'bend', 'flip', 'soar'
      ],
      [WordType.ADJECTIVE]: [
        'silly', 'sparkly', 'enormous', 'tiny', 'magical', 'fuzzy', 'slimy', 'bouncy', 'mysterious', 'colorful',
        'gigantic', 'microscopic', 'fluffy', 'sticky', 'smooth', 'rough', 'shiny', 'dull', 'bright', 'dark',
        'loud', 'quiet', 'fast', 'slow', 'hot', 'cold', 'sweet', 'sour', 'funny', 'serious', 'crazy', 'calm'
      ],
      [WordType.ADVERB]: [
        'quickly', 'silently', 'gracefully', 'wildly', 'carefully', 'loudly', 'smoothly', 'frantically', 'gently', 'boldly',
        'slowly', 'rapidly', 'quietly', 'noisily', 'elegantly', 'clumsily', 'bravely', 'nervously', 'happily', 'sadly',
        'angrily', 'peacefully', 'mysteriously', 'obviously', 'suddenly', 'gradually', 'perfectly', 'terribly'
      ],
      [WordType.PLURAL_NOUN]: [
        'cookies', 'butterflies', 'rockets', 'bubbles', 'monsters', 'rainbows', 'jellybeans', 'puppies', 'stars', 'flowers',
        'elephants', 'computers', 'bicycles', 'telephones', 'hamburgers', 'volcanoes', 'treasures', 'pickles', 'umbrellas',
        'pancakes', 'octopi', 'guitars', 'submarines', 'helicopters', 'chocolates', 'tornadoes', 'penguins', 'mushrooms'
      ],
      [WordType.PAST_TENSE_VERB]: [
        'jumped', 'laughed', 'exploded', 'melted', 'transformed', 'disappeared', 'glowed', 'bounced', 'whispered', 'danced',
        'sprinted', 'crawled', 'swam', 'climbed', 'skipped', 'hopped', 'slid', 'rolled', 'spun', 'marched',
        'sneaked', 'floated', 'dove', 'swung', 'twisted', 'stretched', 'bent', 'flipped', 'soared', 'galloped'
      ],
      [WordType.COLOR]: [
        'purple', 'turquoise', 'magenta', 'lime', 'coral', 'golden', 'silver', 'rainbow', 'neon', 'sparkly',
        'crimson', 'emerald', 'sapphire', 'amber', 'violet', 'indigo', 'chartreuse', 'fuchsia', 'teal', 'maroon',
        'burgundy', 'navy', 'olive', 'tan', 'beige', 'ivory', 'pearl', 'bronze', 'copper', 'platinum'
      ],
      [WordType.NUMBER]: [
        '7', '42', '100', '3', '99', '13', '777', '21', '88', '5',
        '11', '25', '50', '75', '123', '456', '789', '1000', '2024', '365',
        '12', '24', '36', '48', '60', '72', '84', '96', '144', '200'
      ],
      [WordType.PLACE]: [
        'Mars', 'castle', 'jungle', 'moon', 'volcano', 'beach', 'cave', 'forest', 'spaceship', 'playground',
        'library', 'kitchen', 'bathroom', 'garage', 'attic', 'basement', 'garden', 'park', 'school', 'hospital',
        'restaurant', 'museum', 'theater', 'stadium', 'airport', 'train station', 'mall', 'office', 'factory'
      ],
      [WordType.PERSON]: [
        'superhero', 'pirate', 'wizard', 'chef', 'astronaut', 'ninja', 'princess', 'robot', 'detective', 'artist',
        'teacher', 'doctor', 'firefighter', 'police officer', 'scientist', 'musician', 'dancer', 'athlete', 'pilot',
        'sailor', 'farmer', 'baker', 'mechanic', 'librarian', 'photographer', 'writer', 'actor', 'singer', 'clown'
      ]
    }
    
    const allWords = wordLists[type] || ['mystery']
    const availableWords = allWords.filter(word => 
      !usedWords?.some(usedWord => usedWord.toLowerCase() === word.toLowerCase())
    )
    
    return availableWords.length
  }

  const getWordTypeDefinition = (type: WordType): string => {
    switch (type) {
      case WordType.NOUN: return 'A person, place, or thing'
      case WordType.VERB: return 'An action word'
      case WordType.ADJECTIVE: return 'A word that describes something'
      case WordType.ADVERB: return 'A word that describes how something is done'
      case WordType.PLURAL_NOUN: return 'More than one person, place, or thing'
      case WordType.PAST_TENSE_VERB: return 'An action that already happened'
      case WordType.COLOR: return 'Any color you can think of'
      case WordType.NUMBER: return 'Any number (just digits)'
      case WordType.PLACE: return 'A location or destination'
      case WordType.PERSON: return 'Someone real or imaginary'
      default: return ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedWord = word.trim()
    
    if (!trimmedWord) {
      setError('Please enter a word')
      return
    }

    if (!validateWord(trimmedWord, wordType)) {
      if (wordType === WordType.NUMBER) {
        setError('Please enter a valid number (digits only)')
      } else {
        setError('Please enter a valid word (letters, spaces, hyphens, and apostrophes only)')
      }
      return
    }

    try {
      await onSubmit(trimmedWord)
      setWord('')
      setError('')
    } catch (err) {
      setError('Failed to submit word. Please try again.')
    }
  }

  const handleWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setWord(value)
    
    if (error) {
      setError('')
    }
  }

  return (
    <div className="card max-w-md mx-auto">
      <div className="text-center mb-6">

        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {playerName}'s Turn
        </h2>
        
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-bold text-primary-700 mb-1">
            {getWordTypeDisplay(wordType)}
          </h3>
          <p className="text-sm text-primary-600 mb-2">
            {getWordTypeDefinition(wordType)}
          </p>
          <p className="text-xs text-primary-500">
            Examples: {getWordTypeExample(wordType)}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setWord(getRandomWord(wordType))}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-primary-600 transition-colors hover:scale-110"
              title={`Get random word (${getAvailableWordCount(wordType)} available)`}
              disabled={isLoading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <input
              type="text"
              value={word}
              onChange={handleWordChange}
              placeholder={`Enter a ${getWordTypeDisplay(wordType).toLowerCase()}...`}
              className={`input-field text-center text-lg pl-12 ${error ? 'input-error' : ''}`}
              disabled={isLoading}
              maxLength={50}
              autoFocus
            />
          </div>
          {error && (
            <p className="error-message text-center">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!word.trim() || isLoading}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" color="white" />
              <span>Submitting...</span>
            </>
          ) : (
            <span>Submit Word</span>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Your word will be used to create a hilarious story!
        </p>
      </div>
    </div>
  )
}