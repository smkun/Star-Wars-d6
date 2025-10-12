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
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-yellow-400">
      {/* Animated background stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '10%', left: '15%', animationDelay: '0s' }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '20%', left: '80%', animationDelay: '1s' }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '60%', left: '25%', animationDelay: '2s' }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '80%', left: '70%', animationDelay: '1.5s' }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '40%', left: '90%', animationDelay: '0.5s' }} />
      </div>

      {/* Header */}
      <header className="relative border-b-2 border-yellow-400/50 bg-gray-950/80 backdrop-blur-sm shadow-[0_0_30px_rgba(250,204,21,0.15)]">
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
              <h1 className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 drop-shadow-[0_0_25px_rgba(250,204,21,0.5)]">
                Starship Database
              </h1>
              <p className="text-xl text-gray-300/90">
                Browse starfighters, transports, and capital ships from across the galaxy
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Categories Grid */}
      <main className="relative max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-bold mb-8 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]">
          Browse by Category
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link
              key={category.path}
              to={category.path}
              className="group block"
            >
              <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-2 border-yellow-400/20 rounded-xl p-8 overflow-hidden backdrop-blur-sm transition-all duration-500 ease-out h-full hover:border-yellow-400/80 hover:shadow-[0_0_40px_rgba(250,204,21,0.25)] hover:scale-105 hover:-translate-y-2">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -translate-x-full group-hover:translate-x-full" style={{ transition: 'transform 1s ease-out' }} />

                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-400/10 blur-3xl rounded-full group-hover:bg-yellow-400/20 transition-all duration-500" />

                <div className="relative flex flex-col items-center mb-4">
                  <div className="relative transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12 mb-4">
                    <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full" />
                    <img
                      src={category.iconPath}
                      alt={category.title}
                      className="relative w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-yellow-400 group-hover:text-yellow-300 text-center transition-colors duration-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                    {category.title}
                  </h3>
                </div>
                <p className="relative text-gray-300 text-center">
                  {category.description}
                </p>
                <div className="relative mt-6 text-yellow-400 group-hover:text-yellow-300 font-semibold text-center transition-all duration-300 group-hover:translate-x-2">
                  <span>Explore</span>
                  <span className="inline-block ml-2 transform transition-transform duration-300 group-hover:translate-x-2">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
