'use client'

import { useState, useEffect } from 'react'

// Global cache to prevent duplicate API calls
const templateCache = new Map<string, { promise: Promise<any> | null; result: any | null }>()
const getTemplateKey = (theme: string, playerCount: number) => `${theme}-${playerCount}`

interface ThemeSelectorProps {
  themes: string[]
  onComplete: (selectedTheme: string, template?: any) => void
  isVisible: boolean
  playerCount: number
}

export function ThemeSelector({ themes, onComplete, isVisible, playerCount }: ThemeSelectorProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<'spinning' | 'selected' | 'generating' | 'ready'>('spinning')
  const [finalTheme, setFinalTheme] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [generatedTemplate, setGeneratedTemplate] = useState<any>(null)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Get fallback template to use as LLM guide
  const getFallbackTemplate = (theme: string) => {
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
    
    return templates[theme] || templates.adventure
  }

  const themeEmojis: Record<string, string> = {
    adventure: '⚔️',
    school: '🏫',
    space: '🚀',
    food: '🍕',
    animals: '🦁',
    vacation: '🏖️',
    superhero: '🦸',
    mystery: '🔍',
    pirates: '🏴‍☠️',
    work: '💼',
    sports: '⚽',
    music: '🎸'
  }

  const themeColors: Record<string, string> = {
    adventure: 'from-amber-400 to-orange-500',
    school: 'from-blue-400 to-indigo-500',
    space: 'from-purple-400 to-indigo-600',
    food: 'from-red-400 to-pink-500',
    animals: 'from-green-400 to-emerald-500',
    vacation: 'from-cyan-400 to-blue-500',
    superhero: 'from-red-500 to-purple-600',
    mystery: 'from-gray-600 to-gray-800'
  }

  const themeDescriptions: Record<string, string> = {
    adventure: 'Embark on epic quests with heroes and dragons!',
    school: 'Experience the fun and chaos of school life!',
    space: 'Explore the cosmos with astronauts and aliens!',
    food: 'Join culinary adventures with chefs and competitions!',
    animals: 'Discover wildlife in exciting safari adventures!',
    vacation: 'Enjoy tropical paradise and beach fun!',
    superhero: 'Save the world with amazing superpowers!',
    mystery: 'Solve puzzling cases and uncover secrets!',
    pirates: 'Sail the seven seas in search of treasure!',
    work: 'Navigate the hilarious world of office life!',
    sports: 'Compete in thrilling championship games!',
    music: 'Rock out with bands and musical adventures!'
  }

  useEffect(() => {
    console.log('🔍 ThemeSelector: useEffect triggered, isVisible:', isVisible)
    if (!isVisible) return

    // Pre-select the theme immediately (but don't show it yet)
    const selectedTheme = themes[Math.floor(Math.random() * themes.length)]
    const selectedIndex = themes.indexOf(selectedTheme)
    console.log('🔍 ThemeSelector: Selected theme:', selectedTheme)
    setFinalTheme(selectedTheme)

    // Start generating AI template in background immediately
    const generateTemplate = async () => {
      const cacheKey = getTemplateKey(selectedTheme, playerCount)
      const cached = templateCache.get(cacheKey)
      
      // If we already have a result, use it
      if (cached?.result) {
        console.log('🔍 ThemeSelector: Using cached template for:', selectedTheme)
        setGeneratedTemplate(cached.result)
        setLoadingMessage('✨ AI template ready!')
        return
      }
      
      // If there's already a request in progress, wait for it
      if (cached?.promise) {
        console.log('🔍 ThemeSelector: Waiting for existing request for:', selectedTheme)
        try {
          const result = await cached.promise
          setGeneratedTemplate(result)
          setLoadingMessage('✨ AI template ready!')
        } catch (error) {
          setLoadingMessage('📝 Using fallback template')
        }
        return
      }
      
      try {
        console.log('🔍 ThemeSelector: Starting new template generation for theme:', selectedTheme)
        setLoadingMessage('🤖 Generating AI story template...')
        
        // Get the fallback template to use as a guide for the LLM
        const fallbackTemplate = getFallbackTemplate(selectedTheme)
        
        // Create and cache the promise
        const apiPromise = fetch('/api/story/generate-template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            theme: selectedTheme, 
            playerCount,
            exampleTemplate: fallbackTemplate // Use fallback as guide
          })
        }).then(async (response) => {
          if (response.ok) {
            const { template } = await response.json()
            return template
          } else {
            throw new Error('API request failed')
          }
        })
        
        // Cache the promise
        templateCache.set(cacheKey, { promise: apiPromise, result: null })
        
        console.log('🔍 ThemeSelector: Making API call to generate-template')
        const template = await apiPromise
        
        // Cache the result
        templateCache.set(cacheKey, { promise: null, result: template })
        
        setGeneratedTemplate(template)
        setLoadingMessage('✨ AI template ready!')
        
      } catch (error) {
        console.log('AI template generation failed:', error)
        setLoadingMessage('📝 Using fallback template')
        // Remove failed request from cache
        templateCache.delete(cacheKey)
      }
    }

    // Start AI generation immediately
    generateTemplate()

    // Phase 1: Spinning animation (2 seconds)
    setPhase('spinning')
    const spinInterval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % themes.length)
    }, 100)

    const selectTimeout = setTimeout(() => {
      clearInterval(spinInterval)
      
      // Show the pre-selected theme
      setCurrentIndex(selectedIndex)
      setPhase('selected')
      
      // Phase 2: Show selection (1.5 seconds) then go to ready
      setTimeout(() => {
        setPhase('ready')
        
        // Phase 3: Ready state (1.5 seconds) then complete
        setTimeout(() => {
          onComplete(selectedTheme, generatedTemplate)
        }, 1500)
      }, 1500)
    }, 2000)

    return () => {
      clearInterval(spinInterval)
      clearTimeout(selectTimeout)
    }
  }, [isVisible, themes, onComplete, playerCount])

  if (!isVisible) return null

  const currentTheme = themes[currentIndex]
  const emoji = themeEmojis[currentTheme] || '🎲'
  const colorClass = themeColors[currentTheme] || 'from-gray-400 to-gray-600'
  const description = themeDescriptions[currentTheme] || 'Get ready for an amazing story!'

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-8 w-[700px] mx-4 text-center shadow-2xl border-4 border-white min-h-[500px] flex flex-col justify-between">
        
        {/* Phase 1 & 2: Theme Selection */}
        {(phase === 'spinning' || phase === 'selected') && (
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {phase === 'spinning' ? 'Selecting Your Story Theme...' : 'Theme Selected!'}
              </h2>
              <p className="text-gray-600 mb-8">
                {phase === 'spinning' ? 'Let the wheel decide your adventure!' : description}
              </p>
              
              <div className="relative mb-8">
                {/* Spinning wheel */}
                <div className={`w-40 h-40 mx-auto rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-2xl transform transition-all duration-500 ${
                  phase === 'spinning' ? 'animate-spin' : 'scale-110 ring-4 ring-green-400 ring-opacity-50'
                }`}>
                  <div className="text-6xl">
                    {emoji}
                  </div>
                </div>
                
                {/* Theme name */}
                <div className="mt-6">
                  <div className={`text-2xl font-bold transition-all duration-500 ${
                    phase === 'selected' ? 'text-green-600 scale-110' : 'text-gray-700'
                  }`}>
                    {currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)}
                  </div>
                  {phase === 'selected' && (
                    <div className="text-lg text-green-600 mt-2 animate-bounce">
                      ✨ Perfect Choice! ✨
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* All themes preview in 4x3 grid */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-lg mx-auto">
              {themes.map((theme, index) => (
                <div
                  key={theme}
                  className={`px-3 py-2 rounded-lg text-xs text-center transition-all duration-200 ${
                    index === currentIndex
                      ? 'bg-primary-500 text-white scale-105 shadow-lg'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <div className="text-lg mb-1">{themeEmojis[theme]}</div>
                  <div className="capitalize text-xs">{theme}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phase 3: Generating */}
        {phase === 'generating' && finalTheme && (
          <>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Creating Your {finalTheme.charAt(0).toUpperCase() + finalTheme.slice(1)} Story
            </h2>
            <p className="text-gray-600 mb-8">
              {description}
            </p>
            
            <div className="mb-8">
              <div className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-xl animate-pulse`}>
                <div className="text-5xl">
                  {emoji}
                </div>
              </div>
            </div>
            
            {/* Loading bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Generating with AI...</span>
                <span>{Math.round(loadingProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-3 bg-gradient-to-r ${colorClass} rounded-full transition-all duration-300 ease-out`}
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>
            
            {/* Loading messages */}
            <div className="text-sm text-gray-500">
              {loadingMessage || (
                loadingProgress < 30 ? '🤖 Analyzing theme patterns...' :
                loadingProgress < 60 ? '📝 Generating story structure...' :
                loadingProgress < 90 ? '🎨 Crafting unique scenes...' :
                '✨ Finalizing template...'
              )}
            </div>
          </>
        )}

        {/* Phase 3: Ready */}
        {phase === 'ready' && finalTheme && (
          <div className="flex flex-col h-full justify-center">
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-green-600 mb-2">
                Ready to Play!
              </h2>
              <p className="text-gray-600 mb-8">
                Your {finalTheme} story is ready. Let's collect some words!
              </p>
              
              <div className="mb-8">
                <div className={`w-40 h-40 mx-auto rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-xl ring-4 ring-green-400 ring-opacity-50 animate-bounce`}>
                  <div className="text-6xl">
                    {emoji}
                  </div>
                </div>
              </div>
              
              <div className="text-lg text-green-600 font-bold animate-pulse">
                🎉 Let's Begin! 🎉
              </div>
            </div>
            
            {/* Spacer to match grid height */}
            <div className="h-24"></div>
          </div>
        )}
      </div>
    </div>
  )
}