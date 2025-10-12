import { Link } from 'react-router-dom';
import {} from 'react';

interface Category {
  title: string;
  description: string;
  path: string;
  iconPath: string;
}

const categories: Category[] = [
  {
    title: 'Species',
    description: 'Browse alien species from across the Star Wars galaxy',
    path: '/species',
    iconPath: `${import.meta.env.BASE_URL}icons/Species.png`,
  },
  {
    title: 'Starships',
    description: 'Explore starfighters, transports, and capital ships',
    path: '/starships',
    iconPath: `${import.meta.env.BASE_URL}icons/StarShips.png`,
  },
  {
    title: 'Characters',
    description: 'Create and manage player characters',
    path: '/characters',
    iconPath: `${import.meta.env.BASE_URL}icons/Characters.png`,
  },
];

export default function Home() {
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

      {/* Header with glow effect */}
      <header className="relative border-b-2 border-yellow-400/50 bg-gray-950/80 backdrop-blur-sm shadow-[0_0_30px_rgba(250,204,21,0.15)]">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="flex items-center gap-8">
            {/* Main Logo */}
            <img
              src={`${import.meta.env.BASE_URL}icons/mainLogo.png`}
              alt="Star Wars d6 Logo"
              className="h-48 w-auto drop-shadow-[0_0_30px_rgba(250,204,21,0.4)] animate-pulse flex-shrink-0"
            />

            {/* Text Content */}
            <div>
              <h1 className="text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 drop-shadow-[0_0_25px_rgba(250,204,21,0.5)] animate-pulse">
                Star Wars d6 Holocron
              </h1>
              <p className="text-xl text-gray-300/90 font-light tracking-wide">
                A comprehensive database for the Star Wars d6 RPG system
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Categories Grid */}
      <main className="relative max-w-7xl mx-auto px-8 py-20">
        <h2 className="text-4xl font-bold mb-12 text-yellow-400 tracking-wider drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]">
          Browse Categories
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {categories.map((category, index) => (
            <Link
              key={category.path}
              to={category.path}
              className="group block"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-2 border-yellow-400/20 rounded-xl p-10 overflow-hidden backdrop-blur-sm transition-all duration-500 ease-out h-full hover:border-yellow-400/80 hover:shadow-[0_0_40px_rgba(250,204,21,0.25)] hover:scale-105 hover:-translate-y-2">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -translate-x-full group-hover:translate-x-full" style={{ transition: 'transform 1s ease-out' }} />

                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-400/10 blur-3xl rounded-full group-hover:bg-yellow-400/20 transition-all duration-500" />

                <div className="relative flex items-center mb-6">
                  <div className="relative mr-6 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
                    <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full" />
                    <img
                      src={category.iconPath}
                      alt={category.title}
                      className="relative w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]"
                    />
                  </div>
                  <h3 className="text-4xl font-bold text-yellow-400 group-hover:text-yellow-300 transition-colors duration-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                    {category.title}
                  </h3>
                </div>

                <p className="relative text-gray-300 text-lg leading-relaxed mb-6">
                  {category.description}
                </p>

                <div className="relative flex items-center text-yellow-400 group-hover:text-yellow-300 font-semibold text-lg transition-all duration-300 group-hover:translate-x-2">
                  <span className="mr-2">Explore</span>
                  <span className="transform transition-transform duration-300 group-hover:translate-x-2">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Attribution */}
        <footer className="mt-16 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>
            Content sourced from{' '}
            <a
              href="http://d6holocron.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-400 hover:text-yellow-300 underline"
            >
              d6 Holocron
            </a>
            {' • '}
            Licensed under{' '}
            <a
              href="https://creativecommons.org/licenses/by-sa/3.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-400 hover:text-yellow-300 underline"
            >
              CC BY-SA 3.0
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
