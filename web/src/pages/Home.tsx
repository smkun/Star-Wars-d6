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
  // no header auth UI (handled in-app elsewhere)

  return (
    <div className="min-h-screen bg-gray-900 text-yellow-400">
      {/* Header */}
      <header className="border-b-2 border-yellow-400 bg-gray-950">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <h1 className="text-6xl font-bold mb-4">Star Wars d6 Holocron</h1>
          <p className="text-xl text-gray-400">
            A comprehensive database for the Star Wars d6 RPG system
          </p>
          {/* intentionally removed Characters link and test login UI */}
        </div>
      </header>

      {/* Categories Grid */}
      <main className="max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-bold mb-8 text-yellow-400">
          Browse Categories
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((category) => (
            <Link
              key={category.path}
              to={category.path}
              className="group block"
            >
              <div className="bg-gray-800 border-2 border-yellow-400/30 rounded-lg p-8 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-400/20 transition-all duration-300 h-full">
                <div className="flex items-center mb-4">
                  <img
                    src={category.iconPath}
                    alt={category.title}
                    className="w-20 h-20 mr-4 object-contain"
                  />
                  <h3 className="text-3xl font-bold text-yellow-400 group-hover:text-yellow-300">
                    {category.title}
                  </h3>
                </div>
                <p className="text-gray-400 text-lg">{category.description}</p>
                <div className="mt-6 text-yellow-400 group-hover:text-yellow-300 font-semibold">
                  Explore →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Attribution */}
        <div className="mt-16 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
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
          </p>
          <p className="mt-2">
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
        </div>
      </main>
    </div>
  );
}
