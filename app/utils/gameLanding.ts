export type GameLandingId = 'league' | 'tft' | 'valorant' | 'hots' | 'wow'

export interface GameLanding {
  id: GameLandingId
  name: string
  genre: string
  tagline: string
  description: string
  accent: string
  accentSoft: string
  image: string
  imagePosition: string
  video: string
  encyclopediaHref: string
  encyclopediaLabel: string
  encyclopediaDescription: string
  encyclopediaPreview: readonly string[]
}

export const gameLandings: Record<GameLandingId, GameLanding> = {
  league: {
    id: 'league',
    name: 'League of Legends',
    genre: 'MOBA',
    tagline: 'La Faille, mieux comprise.',
    description:
      'Retrouvez les informations essentielles pour préparer vos parties et le compagnon RiftVision pour les suivre en direct.',
    accent: '#d9bc7b',
    accentSoft: '#5c4a27',
    image: '/assets/images/league-ahri-splash.jpg',
    imagePosition: 'center 28%',
    video: '/assets/videos/league.mp4',
    encyclopediaHref: '/league/champions',
    encyclopediaLabel: 'Explorer les champions',
    encyclopediaDescription:
      'Champions, objets, runes et notes de patch pour trouver l’information utile avant la partie.',
    encyclopediaPreview: ['Champions et compétences', 'Objets et runes', 'Notes de patch'],
  },
  tft: {
    id: 'tft',
    name: 'Teamfight Tactics',
    genre: 'STRATÉGIE',
    tagline: 'Chaque composition a son plan.',
    description:
      'Composez avec les bonnes informations : unités, traits, objets et mises à jour du set en cours.',
    accent: '#d4b4ff',
    accentSoft: '#4d386e',
    image: '/assets/images/game-tft-banner.webp',
    imagePosition: 'center 17%',
    video: '/assets/videos/tft.mp4',
    encyclopediaHref: '/tft/units',
    encyclopediaLabel: 'Explorer les unités',
    encyclopediaDescription:
      'Parcourez les unités, traits et objets pour composer, ajuster et comprendre vos options.',
    encyclopediaPreview: ['Unités du set', 'Traits et synergies', 'Objets et effets'],
  },
  valorant: {
    id: 'valorant',
    name: 'Valorant',
    genre: 'FPS TACTIQUE',
    tagline: 'Chaque round se prépare.',
    description:
      'Accédez aux données de jeu pour mieux connaître les agents, les armes, les cartes et les évolutions du patch.',
    accent: '#ff969b',
    accentSoft: '#71343d',
    image: '/assets/images/game-valorant.webp',
    imagePosition: 'center 16%',
    video: '/assets/videos/valorant.mp4',
    encyclopediaHref: '/valorant/agents',
    encyclopediaLabel: 'Explorer les agents',
    encyclopediaDescription:
      'Agents, compétences, armes et cartes réunis dans un espace conçu pour préparer le prochain round.',
    encyclopediaPreview: ['Agents et compétences', 'Armes et caractéristiques', 'Cartes et plans'],
  },
  hots: {
    id: 'hots',
    name: 'Heroes of the Storm',
    genre: 'MOBA',
    tagline: 'Le Nexus en un regard.',
    description:
      'Retrouvez les héros, leurs talents, les champs de bataille et les dernières mises à jour du Nexus.',
    accent: '#bba8ff',
    accentSoft: '#403c78',
    image: '/assets/images/game-hots.webp',
    imagePosition: 'center 43%',
    video: '/assets/videos/hots.mp4',
    encyclopediaHref: '/hots/heroes',
    encyclopediaLabel: 'Explorer les héros',
    encyclopediaDescription:
      'Héros, compétences, talents et champs de bataille pour aborder chaque objectif avec le bon plan.',
    encyclopediaPreview: ['Héros et talents', 'Compétences', 'Champs de bataille'],
  },
  wow: {
    id: 'wow',
    name: 'World of Warcraft',
    genre: 'MMORPG',
    tagline: 'Votre classe, votre aventure.',
    description:
      'Explorez les classes, spécialisations, races et notes de patch de World of Warcraft Retail.',
    accent: '#e2b765',
    accentSoft: '#68431e',
    image: '/assets/images/game-wow.webp',
    imagePosition: 'center 16%',
    video: '/assets/videos/wow.mp4',
    encyclopediaHref: '/wow/classes',
    encyclopediaLabel: 'Explorer les classes',
    encyclopediaDescription:
      'Classes, spécialisations, races et mises à jour pour retrouver les informations utiles à votre personnage.',
    encyclopediaPreview: ['Classes et spécialisations', 'Races disponibles', 'Notes de patch'],
  },
}
