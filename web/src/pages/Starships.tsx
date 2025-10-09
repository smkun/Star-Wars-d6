import { Link, useNavigate } from 'react-router-dom';

interface Category {
  title: string;
  description: string;
  path: string;
  iconPath: string;
}

const categories: Category[] = [
  {
    title: 'Starfighters',
    description: 'Fast, agile spacecraft designed for dogfighting and tactical combat',
    path: '/starfighters',
    iconPath: '/d6StarWars/icons/Starfighters.png'
  },
  {
    title: 'Transports',
    description: 'Freighters, cargo haulers, and passenger vessels',
    path: '/transports',
    iconPath: '/d6StarWars/icons/SpaceTransports.png'
  },
  {
    title: 'Capital Ships',
    description: 'Massive warships, cruisers, and dreadnoughts',
    path: '/capital-ships',
    iconPath: '/d6StarWars/icons/CapitalShips.png'
  }
];

export default function Starships() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 text-yellow-400">
      {/* Header */}
      <header className="border-b-2 border-yellow-400 bg-gray-950">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className='flex items-start gap-6'>
            <img
              src='/d6StarWars/icons/StarShips.png'
              alt='Starships'
              className='w-36 h-36 sm:w-48 sm:h-48 object-contain opacity-90 flex-shrink-0'
            />
            <div>
              <button
                type='button'
                className='mb-6 text-sm text-yellow-400/80 hover:text-yellow-400 transition-colors'
                onClick={() => navigate('/')}
              >
                ← Back to Home
              </button>
              <h1 className="text-6xl font-bold mb-4">
                Starship Database
              </h1>
              <p className="text-xl text-gray-400">
                Browse starfighters, transports, and capital ships from across the galaxy
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Categories Grid */}
      <main className="max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-bold mb-8 text-yellow-400">
          Browse by Category
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link
              key={category.path}
              to={category.path}
              className="group block"
            >
              <div className="bg-gray-800 border-2 border-yellow-400/30 rounded-lg p-8 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-400/20 transition-all duration-300 h-full">
                <div className="flex flex-col items-center mb-4">
                  <img
                    src={category.iconPath}
                    alt={category.title}
                    className="w-20 h-20 mb-4 object-contain"
                  />
                  <h3 className="text-2xl font-bold text-yellow-400 group-hover:text-yellow-300 text-center">
                    {category.title}
                  </h3>
                </div>
                <p className="text-gray-400 text-center">
                  {category.description}
                </p>
                <div className="mt-6 text-yellow-400 group-hover:text-yellow-300 font-semibold text-center">
                  Explore →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
