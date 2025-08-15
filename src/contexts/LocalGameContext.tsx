'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { GameSession, Player, GameState, StoryTemplate, WordSubmission, Story, WordType, Paragraph, WordBlank } from '@/types'
import { v4 as uuidv4 } from 'uuid'
// Removed direct import - using API routes instead
import { deserializeDates } from '@/utils/dateUtils'

// Quick fallback template so players can start immediately
function createFallbackTemplate(playerCount: number): StoryTemplate {
  // Use a random theme for the fallback too
  const themes = ['adventure', 'school', 'space', 'food', 'animals', 'vacation', 'superhero', 'mystery', 'pirates', 'work', 'sports', 'music']
  const randomTheme = themes[Math.floor(Math.random() * themes.length)]
  return createFallbackTemplateWithTheme(randomTheme, playerCount)
}

function createFallbackTemplateWithTheme(theme: string, playerCount: number): StoryTemplate {

  const templates = {
    adventure: {
      title: "A Simple Adventure",
      paragraphs: [
        {
          text: "Once upon a time, there was a {adjective} hero. The hero lived in a magical kingdom. Every morning they would practice sword fighting. The other knights admired their {noun} skills.",
          imagePrompt: "A heroic character training in a magical kingdom"
        },
        {
          text: "One day, the hero decided to {verb} on a quest. They packed their bag with {plural_noun} for the journey. The path led through a dark forest. Along the way, they met a {color} dragon.",
          imagePrompt: "A hero on a quest meeting a colorful dragon in a forest"
        },
        {
          text: "The dragon was surprisingly {adjective} and friendly. It offered to help the hero find the treasure. Together they {past_tense_verb} to a hidden cave. Inside, they discovered {number} golden coins.",
          imagePrompt: "A hero and dragon discovering treasure in a hidden cave"
        },
        {
          text: "The hero thanked the dragon {adverb} for its help. They shared the treasure with everyone in the {place}. From that day forward, they were known as the most famous {person}. Their story was told for many years in the {adjective} kingdom.",
          imagePrompt: "A celebration scene with the hero being honored in the kingdom"
        }
      ]
    },
    school: {
      title: "A Crazy School Day",
      paragraphs: [
        {
          text: "It was a {adjective} morning at Sunshine Elementary School. The teacher walked into the classroom carrying a mysterious {noun}. All the students looked up with curious eyes. The teacher announced they would have a special lesson today.",
          imagePrompt: "A classroom scene with students and teacher with a mysterious object"
        },
        {
          text: "The first activity was to {verb} around the playground. Everyone grabbed their {plural_noun} and headed outside. The weather was perfect for outdoor activities. The students were excited to try something new.",
          imagePrompt: "Students playing actively on a school playground"
        },
        {
          text: "During lunch, something {adjective} happened in the cafeteria. The lunch lady had prepared a special meal. Everyone {past_tense_verb} when they saw what was on their trays. There were exactly {number} different types of food.",
          imagePrompt: "A school cafeteria with surprised students looking at their lunch trays"
        },
        {
          text: "The day ended {adverb} with everyone gathering in the {place}. The principal made an announcement about the {person} who would visit next week. All the students cheered with {adjective} excitement.",
          imagePrompt: "Students gathered in the school assembly with the principal speaking"
        }
      ]
    },
    space: {
      title: "Space Adventure",
      paragraphs: [
        {
          text: "Captain Zara was a {adjective} astronaut aboard the starship Discovery. She was examining a strange {noun} that had appeared on the radar. The ship's computer was making unusual beeping sounds. The crew gathered on the bridge to investigate.",
          imagePrompt: "An astronaut on a futuristic spaceship bridge examining strange readings"
        },
        {
          text: "The crew decided to {verb} toward the mysterious object. They packed their space suits with essential {plural_noun} for the mission. The journey through the asteroid field was challenging. Soon they spotted a {color} planet in the distance.",
          imagePrompt: "A spaceship traveling through an asteroid field toward a colorful planet"
        },
        {
          text: "The planet's surface was {adjective} and covered with crystal formations. The team carefully {past_tense_verb} onto the alien world. They discovered {number} different types of alien creatures. Each creature was more fascinating than the last.",
          imagePrompt: "Astronauts exploring an alien planet with crystal formations and creatures"
        },
        {
          text: "The mission concluded {adverb} when they returned to their {place}. The crew had made contact with a friendly alien {person}. The discovery would be remembered as the most {adjective} moment in space exploration history.",
          imagePrompt: "Astronauts celebrating their successful mission with alien contact"
        }
      ]
    },
    food: {
      title: "The Great Cooking Adventure",
      paragraphs: [
        {
          text: "Chef Maria was preparing for the most {adjective} cooking competition of her career. She carefully selected her favorite {noun} from the pantry. The kitchen was filled with delicious aromas. Today she would create something truly special.",
          imagePrompt: "A chef in a busy kitchen preparing for a cooking competition"
        },
        {
          text: "The first challenge was to {verb} a mystery ingredient into the dish. She opened the box to find {plural_noun} inside. The judges watched carefully as she worked. The timer was ticking down quickly.",
          imagePrompt: "A chef working intensely with mystery ingredients while judges watch"
        },
        {
          text: "The final dish looked {adjective} and smelled incredible. The judges {past_tense_verb} when they tasted it. They awarded her {number} points out of ten. The crowd erupted in cheers.",
          imagePrompt: "Judges tasting a beautiful dish and reacting with surprise and delight"
        },
        {
          text: "Chef Maria celebrated {adverb} with her team in the {place}. The head judge, a famous {person}, declared it the best dish ever. Her {adjective} creation would be featured in cooking magazines worldwide.",
          imagePrompt: "A celebration scene in a restaurant with the winning chef and her team"
        }
      ]
    },
    animals: {
      title: "Safari Adventure",
      paragraphs: [
        {
          text: "Dr. Sarah was a {adjective} wildlife researcher studying animals in Africa. She spotted a rare {noun} through her binoculars. The morning sun was perfect for animal watching. This could be the discovery of a lifetime.",
          imagePrompt: "A wildlife researcher with binoculars observing animals in an African savanna"
        },
        {
          text: "She decided to {verb} closer to get better photos. Her backpack was filled with {plural_noun} for the expedition. A family of elephants was nearby drinking water. She noticed they had unusual {color} markings.",
          imagePrompt: "A researcher carefully approaching elephants at a watering hole"
        },
        {
          text: "Suddenly, something {adjective} happened near the river. A group of animals {past_tense_verb} together in an unusual way. She counted exactly {number} different species working together. It was unlike anything she had seen before.",
          imagePrompt: "Various African animals gathered together by a river in an unusual scene"
        },
        {
          text: "Dr. Sarah documented everything {adverb} in her field notes back at the {place}. She would share her findings with a renowned {person} at the university. This {adjective} discovery would change wildlife research forever.",
          imagePrompt: "A researcher writing notes at a safari camp with animals in the background"
        }
      ]
    },
    vacation: {
      title: "The Perfect Beach Vacation",
      paragraphs: [
        {
          text: "The Johnson family arrived at the {adjective} beach resort for their dream vacation. Tommy immediately spotted a shiny {noun} buried in the sand. The ocean waves were perfect for swimming. This was going to be an unforgettable week.",
          imagePrompt: "A family arriving at a beautiful beach resort with palm trees and clear water"
        },
        {
          text: "The first day, they decided to {verb} along the shoreline. They collected {plural_noun} as souvenirs from their walk. The sunset painted the sky a brilliant {color}. Other families were enjoying the perfect weather too.",
          imagePrompt: "A family walking along a beach at sunset collecting shells and treasures"
        },
        {
          text: "On the third day, they discovered something {adjective} while snorkeling. Dad {past_tense_verb} when he saw the underwater coral reef. They counted {number} different types of tropical fish. The underwater world was magical.",
          imagePrompt: "A family snorkeling and discovering a colorful coral reef with tropical fish"
        },
        {
          text: "The vacation ended {adverb} with a celebration at the resort's {place}. They met a friendly local {person} who shared stories about the island. Everyone agreed it was the most {adjective} vacation they had ever taken.",
          imagePrompt: "A family celebrating at a beachside restaurant with local people and decorations"
        }
      ]
    },
    superhero: {
      title: "The New Superhero",
      paragraphs: [
        {
          text: "Alex discovered they had {adjective} superpowers on their 16th birthday. Their first power was the ability to control any {noun} with their mind. The city needed a new hero to fight crime. This was their chance to make a difference.",
          imagePrompt: "A teenager discovering their superpowers with objects floating around them"
        },
        {
          text: "Their first mission was to {verb} through the city to stop a robbery. The superhero costume was equipped with special {plural_noun} for protection. The villain was wearing a {color} mask and cape. Citizens watched from their windows in amazement.",
          imagePrompt: "A young superhero flying through a city skyline chasing a colorful villain"
        },
        {
          text: "The final battle was {adjective} and lasted for hours. Alex {past_tense_verb} using their powers in creative ways. They saved {number} people from danger that day. The city was safe once again.",
          imagePrompt: "An epic superhero battle scene with the hero saving people from danger"
        },
        {
          text: "The mayor honored Alex {adverb} at a ceremony in the town {place}. A grateful {person} gave them a key to the city. From that day forward, they were known as the most {adjective} superhero in the world.",
          imagePrompt: "A superhero being honored at a city ceremony with crowds cheering"
        }
      ]
    },
    mystery: {
      title: "The Case of the Missing Treasure",
      paragraphs: [
        {
          text: "Detective Riley was investigating a {adjective} mystery at the old mansion. The only clue was a strange {noun} left behind by the thief. The mansion's owner was very worried. This case would require all of Riley's skills.",
          imagePrompt: "A detective examining clues in a mysterious old mansion"
        },
        {
          text: "The investigation led them to {verb} through secret passages. They found {plural_noun} hidden behind a bookshelf. One of the passages had {color} wallpaper that seemed important. The mystery was getting more complex.",
          imagePrompt: "A detective exploring secret passages with a flashlight in an old mansion"
        },
        {
          text: "In the basement, Riley discovered something {adjective} that changed everything. The evidence {past_tense_verb} to a surprising conclusion. There were {number} different suspects to consider. The truth was finally becoming clear.",
          imagePrompt: "A detective in a basement making an important discovery with evidence scattered around"
        },
        {
          text: "The case was solved {adverb} when they gathered everyone in the {place}. The real culprit was revealed to be the {person} nobody suspected. It was the most {adjective} mystery Riley had ever solved.",
          imagePrompt: "A detective revealing the solution to a group of suspects in a grand room"
        }
      ]
    },
    pirates: {
      title: "Pirate Treasure Hunt",
      paragraphs: [
        {
          text: "Captain Blackbeard was the most {adjective} pirate on the seven seas. He sailed his ship with a crew of loyal {plural_noun}. One day, he found an old treasure map hidden in a {noun}. The map showed the location of legendary pirate gold.",
          imagePrompt: "A fierce pirate captain on a ship deck holding an old treasure map"
        },
        {
          text: "The crew decided to {verb} to the mysterious island marked on the map. They packed their ship with {plural_noun} for the dangerous journey. The island was surrounded by {color} waters and rocky cliffs. Strange sounds echoed from the jungle.",
          imagePrompt: "A pirate ship approaching a mysterious tropical island with rocky cliffs"
        },
        {
          text: "On the island, they discovered something {adjective} buried beneath an old palm tree. The pirates {past_tense_verb} with excitement when they saw the treasure chest. Inside were {number} pieces of ancient gold coins. The treasure was more valuable than they had dreamed.",
          imagePrompt: "Pirates digging up a treasure chest under a palm tree on a tropical beach"
        },
        {
          text: "Captain Blackbeard celebrated {adverb} with his crew at their secret {place}. They shared the treasure with every {person} who had helped them. From that day forward, they were known as the most {adjective} pirates in all the Caribbean.",
          imagePrompt: "Pirates celebrating with treasure and rum at a secret hideout"
        }
      ]
    },
    work: {
      title: "A Day at the Office",
      paragraphs: [
        {
          text: "Sarah arrived at her {adjective} office building for another day of work. She sat down at her desk and noticed a strange {noun} left by her computer. Her coworkers were already busy with their morning tasks. Today would be different from any other workday.",
          imagePrompt: "A professional office environment with workers at their desks and computers"
        },
        {
          text: "The first meeting of the day required everyone to {verb} together as a team. The conference room was filled with {plural_noun} for the big presentation. The boss wore a {color} tie and looked very serious. Everyone knew this project was important.",
          imagePrompt: "A business meeting in a conference room with people presenting charts and graphs"
        },
        {
          text: "During lunch break, something {adjective} happened in the break room. The office manager {past_tense_verb} when they saw the surprise party decorations. It turned out there were {number} different reasons to celebrate that day. The whole team was excited.",
          imagePrompt: "Office workers celebrating in a break room with decorations and cake"
        },
        {
          text: "The workday ended {adverb} with everyone gathering in the main {place}. The CEO announced that a hardworking {person} would receive a special promotion. It had been the most {adjective} day at the office anyone could remember.",
          imagePrompt: "A company celebration with the CEO making an announcement to gathered employees"
        }
      ]
    },
    sports: {
      title: "The Championship Game",
      paragraphs: [
        {
          text: "Coach Martinez was preparing her team for the most {adjective} game of the season. The players were practicing with their {noun} on the field. The crowd was already gathering in the stadium. This championship would determine everything.",
          imagePrompt: "A sports team practicing on a field with a coach giving instructions"
        },
        {
          text: "When the game began, the team decided to {verb} with all their energy. The opposing team brought {plural_noun} to intimidate them. The referee wore a {color} uniform and blew the whistle. The competition was fierce from the start.",
          imagePrompt: "An intense sports game in progress with players competing and a referee"
        },
        {
          text: "In the final quarter, something {adjective} happened that changed the game. The star player {past_tense_verb} across the field with incredible speed. The scoreboard showed {number} points difference. The crowd went wild with excitement.",
          imagePrompt: "A dramatic moment in a sports game with players and cheering crowd"
        },
        {
          text: "The team celebrated {adverb} after winning the championship at the {place}. The MVP trophy was presented by a famous {person} from the sports world. It was the most {adjective} victory in the team's history.",
          imagePrompt: "A championship celebration with trophy presentation and cheering team"
        }
      ]
    },
    music: {
      title: "The Rock Band's Big Break",
      paragraphs: [
        {
          text: "The band 'Electric Dreams' was preparing for their most {adjective} concert ever. Lead singer Jake tuned his {noun} backstage while the crowd gathered. The venue was packed with excited fans. Tonight could change their lives forever.",
          imagePrompt: "A rock band preparing backstage before a big concert with instruments and equipment"
        },
        {
          text: "When they took the stage, the band decided to {verb} their hearts out. The audience waved {plural_noun} in the air enthusiastically. The stage lights flashed in brilliant {color} patterns. The energy was electric throughout the venue.",
          imagePrompt: "A rock band performing on stage with colorful lights and an enthusiastic crowd"
        },
        {
          text: "During their biggest hit, something {adjective} happened with the sound system. The drummer {past_tense_verb} so hard that the beat echoed through the building. The crowd sang along to {number} different songs. It was a magical musical moment.",
          imagePrompt: "A concert crowd singing along with the band in a moment of musical unity"
        },
        {
          text: "After the show, the band celebrated {adverb} with their fans at the local {place}. A famous music {person} offered them a record deal. This {adjective} night would be remembered as their big break in the music industry.",
          imagePrompt: "Band members celebrating with fans and music industry people after a successful show"
        }
      ]
    }
  }

  const selectedTemplate = templates[theme as keyof typeof templates] || templates.adventure

  let globalPosition = 0

  const paragraphs = selectedTemplate.paragraphs.map((p, paragraphIndex) => {
    // Create word blanks based on the actual placeholders in the text
    const wordBlanks: any[] = []

    // Extract word types from the text placeholders
    const placeholders = p.text.match(/\{(\w+)\}/g) || []
    console.log(`Template creation - Paragraph ${paragraphIndex + 1}:`, p.text)
    console.log(`Template creation - Found placeholders:`, placeholders)

    placeholders.forEach((placeholder, placeholderIndex) => {
      const wordType = placeholder.replace(/[{}]/g, '')
      let enumType

      console.log(`🔍 Template Debug: Processing placeholder "${placeholder}", extracted wordType: "${wordType}"`)

      switch (wordType) {
        case 'adjective': enumType = WordType.ADJECTIVE; break
        case 'noun': enumType = WordType.NOUN; break
        case 'verb': enumType = WordType.VERB; break
        case 'adverb': enumType = WordType.ADVERB; break
        case 'plural_noun': enumType = WordType.PLURAL_NOUN; break
        case 'past_tense_verb': enumType = WordType.PAST_TENSE_VERB; break
        case 'color': enumType = WordType.COLOR; break
        case 'number': enumType = WordType.NUMBER; break
        case 'place': enumType = WordType.PLACE; break
        case 'person': enumType = WordType.PERSON; break
        default:
          console.warn(`🚨 Unknown word type: "${wordType}", defaulting to NOUN`)
          enumType = WordType.NOUN
      }

      console.log(`🔍 Template Debug: Mapped "${wordType}" to enum:`, enumType)

      const wordBlank = {
        id: uuidv4(),
        type: enumType,
        position: globalPosition++, // Use continuous position counter
        assignedPlayerId: null
      }

      wordBlanks.push(wordBlank)
      console.log(`Template creation - Created word blank:`, { placeholder, type: enumType, position: wordBlank.position, id: wordBlank.id })
    })

    return {
      id: uuidv4(),
      text: p.text,
      wordBlanks,
      imagePrompt: p.imagePrompt
    }
  })

  const totalWordBlanks = paragraphs.reduce((sum, p) => sum + p.wordBlanks.length, 0)

  return {
    id: uuidv4(),
    title: selectedTemplate.title,
    paragraphs,
    totalWordBlanks,
    theme: theme,
    difficulty: 'easy'
  }
}

interface LocalGameState {
  currentGame: GameSession | null
  currentPlayer: Player | null
  currentPlayerIndex: number
  isLoading: boolean
  loadingMessage: string
  error: string | null
  isSelectingTheme: boolean
}

type LocalGameAction =
  | { type: 'START_GAME'; payload: { players: Player[] } }
  | { type: 'SET_CURRENT_PLAYER'; payload: number }
  | { type: 'SUBMIT_WORD'; payload: { word: string; wordType: WordType; wordBlankId: string } }
  | { type: 'SET_STORY_TEMPLATE'; payload: StoryTemplate }
  | { type: 'SET_COMPLETED_STORY'; payload: Story }
  | { type: 'UPDATE_PARAGRAPH_IMAGE'; payload: { paragraphIndex: number; imageUrl: string } }
  | { type: 'UPDATE_STORY_VIDEO'; payload: { videoUrl: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_MESSAGE'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_GAME_STATE'; payload: GameState }
  | { type: 'SET_THEME_SELECTING'; payload: boolean }
  | { type: 'RESET_GAME' }

const initialState: LocalGameState = {
  currentGame: null,
  currentPlayer: null,
  currentPlayerIndex: 0,
  isLoading: false,
  loadingMessage: '',
  error: null,
  isSelectingTheme: false,
}

function localGameReducer(state: LocalGameState, action: LocalGameAction): LocalGameState {
  switch (action.type) {
    case 'START_GAME':
      const gameSession: GameSession = {
        id: uuidv4(),
        roomCode: 'LOCAL',
        hostId: action.payload.players[0].id,
        players: action.payload.players,
        gameState: GameState.COLLECTING_WORDS,
        storyTemplate: null,
        wordSubmissions: [],
        completedStory: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      return {
        ...state,
        currentGame: gameSession,
        currentPlayer: action.payload.players[0],
        currentPlayerIndex: 0,
        error: null
      }

    case 'SET_CURRENT_PLAYER':
      if (!state.currentGame) return state
      return {
        ...state,
        currentPlayer: state.currentGame.players[action.payload] || null,
        currentPlayerIndex: action.payload
      }

    case 'SUBMIT_WORD':
      if (!state.currentGame || !state.currentPlayer) return state

      const newSubmission: WordSubmission = {
        id: uuidv4(),
        wordBlankId: action.payload.wordBlankId,
        playerId: state.currentPlayer.id,
        playerUsername: state.currentPlayer.username,
        word: action.payload.word,
        wordType: action.payload.wordType,
        submittedAt: new Date()
      }

      console.log('Word submission created:', newSubmission)

      const updatedGame = {
        ...state.currentGame,
        wordSubmissions: [...state.currentGame.wordSubmissions, newSubmission],
        players: state.currentGame.players.map(p =>
          p.id === state.currentPlayer!.id
            ? { ...p, wordsContributed: p.wordsContributed + 1 }
            : p
        )
      }

      return {
        ...state,
        currentGame: updatedGame
      }

    case 'SET_STORY_TEMPLATE':
      if (!state.currentGame) return state
      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          storyTemplate: action.payload
        }
      }

    case 'SET_COMPLETED_STORY':
      if (!state.currentGame) return state
      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          completedStory: action.payload,
          gameState: GameState.DISPLAYING_STORY
        }
      }

    case 'UPDATE_PARAGRAPH_IMAGE':
      if (!state.currentGame?.completedStory) return state

      const updatedParagraphs = [...state.currentGame.completedStory.paragraphs]
      updatedParagraphs[action.payload.paragraphIndex] = {
        ...updatedParagraphs[action.payload.paragraphIndex],
        imageUrl: action.payload.imageUrl
      }

      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          completedStory: {
            ...state.currentGame.completedStory,
            paragraphs: updatedParagraphs
          }
        }
      }

    case 'UPDATE_STORY_VIDEO':
      if (!state.currentGame?.completedStory) return state

      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          completedStory: {
            ...state.currentGame.completedStory,
            videoUrl: action.payload.videoUrl
          }
        }
      }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_LOADING_MESSAGE':
      return { ...state, loadingMessage: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }

    case 'SET_GAME_STATE':
      if (!state.currentGame) return state
      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          gameState: action.payload
        }
      }

    case 'SET_THEME_SELECTING':
      return { ...state, isSelectingTheme: action.payload }

    case 'RESET_GAME':
      return initialState

    default:
      return state
  }
}

interface LocalGameContextValue extends LocalGameState {
  startGame: (players: Player[]) => Promise<void>
  startThemeSelection: (players: Player[]) => void
  completeThemeSelection: (selectedTheme: string, players: Player[], aiTemplate?: any) => Promise<void>
  submitWord: (word: string) => Promise<void>
  generateStory: () => Promise<void>
  regenerateStory: () => Promise<void>
  resetGame: () => void
  getCurrentWordPrompt: () => { wordType: WordType; playerName: string; position: number; wordBlankId: string } | null
}

const LocalGameContext = createContext<LocalGameContextValue | undefined>(undefined)

interface LocalGameProviderProps {
  children: ReactNode
}

export function LocalGameProvider({ children }: LocalGameProviderProps) {
  const [state, dispatch] = useReducer(localGameReducer, initialState)

  // Watch for when all words are collected and trigger story generation
  useEffect(() => {
    if (state.currentGame &&
      state.currentGame.storyTemplate &&
      state.currentGame.gameState === GameState.COLLECTING_WORDS) {

      const template = state.currentGame.storyTemplate
      const totalNeeded = template.paragraphs.flatMap(p => p.wordBlanks).length
      const currentCount = state.currentGame.wordSubmissions.length

      console.log('Word collection check:', { currentCount, totalNeeded })

      if (currentCount >= totalNeeded) {
        console.log('All words collected! Generating story...')
        generateStory()
      }
    }
  }, [state.currentGame?.wordSubmissions.length])

  const startThemeSelection = (players: Player[]) => {
    dispatch({ type: 'START_GAME', payload: { players } })
    dispatch({ type: 'SET_THEME_SELECTING', payload: true })
  }

  const completeThemeSelection = async (selectedTheme: string, players: Player[], aiTemplate?: any): Promise<void> => {
    dispatch({ type: 'SET_THEME_SELECTING', payload: false })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      // Use AI template if available, otherwise fallback
      let templateToUse
      if (aiTemplate) {
        console.log('🤖 Using AI-generated template with theme:', selectedTheme)
        templateToUse = aiTemplate
      } else {
        console.log('📝 Using fallback template with selected theme:', selectedTheme)
        templateToUse = createFallbackTemplateWithTheme(selectedTheme, players.length)
      }

      dispatch({ type: 'SET_STORY_TEMPLATE', payload: templateToUse })
      dispatch({ type: 'SET_GAME_STATE', payload: GameState.COLLECTING_WORDS })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to start game' })
    }
  }

  const startGame = async (players: Player[]): Promise<void> => {
    // For backward compatibility, start theme selection
    startThemeSelection(players)
  }

  const getCurrentWordPrompt = () => {
    if (!state.currentGame || !state.currentGame.storyTemplate || !state.currentPlayer) {
      return null
    }

    const template = state.currentGame.storyTemplate
    const submittedWords = state.currentGame.wordSubmissions

    // Combine all paragraph texts to find the first unfilled placeholder
    const fullStoryText = template.paragraphs.map(p => p.text).join(' ')

    // Find all placeholders in the story
    const placeholderRegex = /\{(\w+)\}/g
    const placeholders: Array<{ match: string; type: string; index: number }> = []
    let match

    while ((match = placeholderRegex.exec(fullStoryText)) !== null) {
      placeholders.push({
        match: match[0], // e.g., "{adjective}"
        type: match[1],  // e.g., "adjective"
        index: match.index
      })
    }

    // Removed verbose logging

    if (submittedWords.length >= placeholders.length) {
      return null // All words collected
    }

    // Get the next unfilled placeholder
    const nextPlaceholder = placeholders[submittedWords.length]

    // Convert string type to WordType enum
    const wordTypeMap: Record<string, WordType> = {
      'noun': WordType.NOUN,
      'verb': WordType.VERB,
      'adjective': WordType.ADJECTIVE,
      'adverb': WordType.ADVERB,
      'plural_noun': WordType.PLURAL_NOUN,
      'past_tense_verb': WordType.PAST_TENSE_VERB,
      'color': WordType.COLOR,
      'number': WordType.NUMBER,
      'place': WordType.PLACE,
      'person': WordType.PERSON
    }

    const wordType = wordTypeMap[nextPlaceholder.type] || WordType.NOUN

    // Next word prompt ready

    return {
      wordType,
      playerName: state.currentPlayer.username,
      position: submittedWords.length + 1,
      wordBlankId: `placeholder-${submittedWords.length}` // Simple ID based on position
    }
  }

  const submitWord = async (word: string): Promise<void> => {
    const prompt = getCurrentWordPrompt()
    if (!prompt) return

    dispatch({
      type: 'SUBMIT_WORD', payload: {
        word,
        wordType: prompt.wordType,
        wordBlankId: prompt.wordBlankId
      }
    })

    // Move to next player
    if (state.currentGame) {
      const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.currentGame.players.length
      dispatch({ type: 'SET_CURRENT_PLAYER', payload: nextPlayerIndex })
    }
  }

  const splitFilledTextIntoParagraphs = (filledText: string, originalTexts: string[], highlights: any[]) => {
    // Simple approach: split by approximate word count
    const words = filledText.split(/\s+/)
    let wordIndex = 0

    return originalTexts.map((originalText, paragraphIndex) => {
      const originalWordCount = originalText.split(/\s+/).length
      const paragraphWords = words.slice(wordIndex, wordIndex + originalWordCount)
      const paragraphText = paragraphWords.join(' ')

      // Calculate highlights for this paragraph
      const paragraphStart = words.slice(0, wordIndex).join(' ').length + (wordIndex > 0 ? 1 : 0)
      const paragraphHighlights = highlights.filter(h =>
        h.startIndex >= paragraphStart && h.startIndex < paragraphStart + paragraphText.length
      ).map(h => ({
        ...h,
        startIndex: h.startIndex - paragraphStart,
        endIndex: h.endIndex - paragraphStart
      }))

      wordIndex += originalWordCount

      return {
        id: `paragraph-${paragraphIndex}`,
        text: paragraphText,
        imageUrl: null,
        wordHighlights: paragraphHighlights
      }
    })
  }

  const createPlayerContributions = (wordSubmissions: any[]) => {
    const contributionMap = new Map()

    wordSubmissions.forEach(submission => {
      if (!contributionMap.has(submission.playerId)) {
        contributionMap.set(submission.playerId, {
          playerId: submission.playerId,
          playerUsername: submission.playerUsername,
          wordsContributed: []
        })
      }
      contributionMap.get(submission.playerId).wordsContributed.push(submission.word)
    })

    return Array.from(contributionMap.values())
  }

  const createImagePromptFromText = (filledText: string, wordSubmissions: any[] = []): string => {
    console.log('🎨 Creating image prompt from filled text:', filledText)
    console.log('📝 Word submissions for emphasis:', wordSubmissions)
    
    // Clean up the text and create a simple, direct prompt
    const cleanText = filledText
      .replace(/[{}]/g, '') // Remove any remaining template markers
      .trim()
    
    // Extract user words for emphasis
    const userWords = wordSubmissions.map(submission => submission.word).filter(word => word && word.trim())
    console.log('🔍 User words to emphasize:', userWords)
    
    // Create the base prompt
    let imagePrompt = `A scene showing: ${cleanText}`
    
    // Add emphasis for user's words if we have any
    if (userWords.length > 0) {
      // Add emphasis instructions to make sure the AI model pays attention to user words
      imagePrompt += `. Make sure to prominently feature and emphasize: ${userWords.join(', ')}`
      
      // Add extra emphasis for the most important words (first few)
      const keyWords = userWords.slice(0, 3) // Take first 3 words as most important
      if (keyWords.length > 0) {
        imagePrompt += `. Pay special attention to: ${keyWords.join(', ')}`
      }
    }
    
    console.log('✨ Generated image prompt with emphasis:', imagePrompt)
    return imagePrompt
  }

  const generateStoryVideo = async (story: any) => {
    console.log('🎬 Starting story video generation...')
    
    try {
      // Prepare story input for video generation
      const storyVideoInput = {
        images: story.paragraphs.map((paragraph: any, index: number) => ({
          url: paragraph.imageUrl,
          text: paragraph.text,
          duration: 4 // 4 seconds per scene
        })).filter((img: any) => img.url), // Only include paragraphs with images
        title: story.title,
        overallNarrative: story.paragraphs.map((p: any) => p.text).join(' ')
      }

      console.log('🎬 Video input prepared:', {
        title: storyVideoInput.title,
        imageCount: storyVideoInput.images.length,
        narrativeLength: storyVideoInput.overallNarrative.length
      })

      // Call video generation API
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyInput: storyVideoInput
        })
      })

      if (response.ok) {
        const responseData = await response.json()
        console.log('🎬 Video generation response:', responseData)
        
        if (responseData.success && responseData.result && responseData.result.url) {
          console.log('✅ Story video generated:', responseData.result.url)
          
          // Update story with video URL
          dispatch({
            type: 'UPDATE_STORY_VIDEO',
            payload: { videoUrl: responseData.result.url }
          })
          
          return responseData.result
        } else {
          console.error('❌ Video generation failed:', responseData)
        }
      } else {
        const error = await response.json()
        console.error('❌ Video generation API error:', error)
      }
    } catch (error) {
      console.error('❌ Failed to generate story video:', error)
    }
  }

  const generateRemainingImagesInBackground = async (story: any, template: any) => {
    console.log('🎨 Starting background generation for remaining images...')

    // Generate images for paragraphs 2, 3, 4, etc. (skip the first one)
    for (let i = 1; i < template.paragraphs.length; i++) {
      const templateParagraph = template.paragraphs[i]

      if (templateParagraph?.imagePrompt) {
        try {
          console.log(`🎨 Background: Generating image ${i + 1}/${template.paragraphs.length}`)

          // Use the actual filled paragraph text as the image prompt with user word emphasis
          const storyParagraph = story.paragraphs[i]
          const imagePrompt = createImagePromptFromText(storyParagraph.text, story.wordSubmissions || [])
          console.log(`🎭 Using paragraph text as prompt with emphasis: ${imagePrompt}`)

          // Use first image as reference for character consistency
          const referenceImageUrl = story.paragraphs[0]?.imageUrl
          console.log(`🖼️ Using reference image for consistency: ${referenceImageUrl}`)

          // Call API through CloudFront to avoid CORS issues
          const response = await fetch('/api/image/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: imagePrompt,
              style: 'cartoon',
              referenceImageUrl: referenceImageUrl // Add reference image for character consistency
            })
          })

          if (response.ok) {
            const responseData = await response.json()
            console.log(`🔍 Background image ${i + 1} full response:`, JSON.stringify(responseData, null, 2))

            // Lambda returns { success: true, result: ImageResult }
            if (responseData.success && responseData.result && responseData.result.url) {
              const imageUrl = responseData.result.url
              console.log(`✅ Background image ${i + 1} URL: ${imageUrl}`)

              // Update the story with the new image
              dispatch({
                type: 'UPDATE_PARAGRAPH_IMAGE',
                payload: { paragraphIndex: i, imageUrl: imageUrl }
              })
            } else {
              console.error(`❌ Background image ${i + 1} missing URL. Response:`, responseData)
            }

          } else {
            const error = await response.json()
            console.error(`❌ Failed to generate background image ${i + 1}:`, error)
          }

          // Add delay between background images to avoid overwhelming AWS
          if (i < template.paragraphs.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000))
          }

        } catch (error) {
          console.error(`❌ Failed to generate background image ${i + 1}:`, error)
        }
      }
    }

    console.log('🎨 Background image generation completed')
    
    // Generate story video after all images are complete
    console.log('🎬 Starting story video generation...')
    await generateStoryVideo(story)
  }

  const generateStory = async (): Promise<void> => {
    if (!state.currentGame || !state.currentGame.storyTemplate) return

    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_LOADING_MESSAGE', payload: 'Creating your story...' })

    try {
      const template = state.currentGame.storyTemplate
      const wordSubmissions = state.currentGame.wordSubmissions

      // Step 1: Generate story text
      console.log('📝 Generating story text...')
      let fullStoryText = template.paragraphs.map(p => p.text).join(' ')
      const wordHighlights: Array<{ word: string; playerUsername: string; wordType: string; startIndex: number; endIndex: number }> = []

      // Replace placeholders with submitted words
      wordSubmissions.forEach((submission) => {
        const placeholderMatch = fullStoryText.match(/\{(\w+)\}/)
        if (placeholderMatch) {
          const placeholder = placeholderMatch[0]
          const startIndex = fullStoryText.indexOf(placeholder)

          wordHighlights.push({
            word: submission.word,
            playerUsername: submission.playerUsername,
            wordType: submission.wordType,
            startIndex,
            endIndex: startIndex + submission.word.length
          })

          fullStoryText = fullStoryText.replace(placeholder, submission.word)
        }
      })

      // Split back into paragraphs
      const originalTexts = template.paragraphs.map(p => p.text)
      const filledParagraphs = splitFilledTextIntoParagraphs(fullStoryText, originalTexts, wordHighlights)

      // Step 2: Generate ONLY the first image before showing story
      console.log('🎨 Generating first image for immediate display...')
      dispatch({ type: 'SET_LOADING_MESSAGE', payload: 'Generating first image...' })

      // Generate only the first paragraph image
      if (template.paragraphs[0]?.imagePrompt) {
        try {
          console.log('🎨 Generating first image:', template.paragraphs[0].imagePrompt)

          // Use the actual filled paragraph text as the image prompt with user word emphasis
          const imagePrompt = createImagePromptFromText(filledParagraphs[0].text, wordSubmissions)
          console.log(`🎭 Using paragraph text as prompt for first image with emphasis: ${imagePrompt}`)

          // Call API through CloudFront to avoid CORS issues
          const response = await fetch('/api/image/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: imagePrompt,
              style: 'cartoon' // Lambda expects just the style string, not an object
            })
          })

          if (response.ok) {
            const responseData = await response.json()
            // Lambda returns { success: true, result: ImageResult }
            if (responseData.success && responseData.result && responseData.result.url) {
              filledParagraphs[0].imageUrl = responseData.result.url
              console.log('✅ First image generated:', responseData.result.url)
            } else {
              console.error('❌ First image missing URL. Response:', responseData)
            }
          } else {
            const error = await response.json()
            console.error('❌ Failed to generate first image:', error)
          }

        } catch (error) {
          console.error('❌ Failed to generate first image:', error)
        }
      }

      // Step 3: Create final story object
      const story = {
        id: `story-${Date.now()}`,
        title: template.title,
        theme: template.theme,
        paragraphs: filledParagraphs,
        playerContributions: createPlayerContributions(wordSubmissions),
        createdAt: new Date()
      }

      console.log('✅ Story and first image generated successfully!')
      dispatch({ type: 'SET_COMPLETED_STORY', payload: story })

      // Generate remaining images in background after story is displayed
      generateRemainingImagesInBackground(story, template)

    } catch (error) {
      console.error('Error generating story:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to generate story' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const regenerateStory = async (): Promise<void> => {
    console.log('🔄 Regenerating story with same words...')
    await generateStory()
  }

  const resetGame = () => {
    dispatch({ type: 'RESET_GAME' })
  }

  const contextValue: LocalGameContextValue = {
    ...state,
    startGame,
    startThemeSelection,
    completeThemeSelection,
    submitWord,
    generateStory,
    regenerateStory,
    resetGame,
    getCurrentWordPrompt,
  }

  return (
    <LocalGameContext.Provider value={contextValue}>
      {children}
    </LocalGameContext.Provider>
  )
}

export function useLocalGame(): LocalGameContextValue {
  const context = useContext(LocalGameContext)
  if (context === undefined) {
    throw new Error('useLocalGame must be used within a LocalGameProvider')
  }
  return context
}