/**
 * StatsTable Component
 *
 * Displays species statistics in tabular format
 */

import type { Stats } from '@/types';

interface StatsTableProps {
  stats: Stats;
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  dexterity: 'Dexterity',
  knowledge: 'Knowledge',
  mechanical: 'Mechanical',
  perception: 'Perception',
  strength: 'Strength',
  technical: 'Technical',
};

export function StatsTable({ stats }: StatsTableProps) {
  return (
    <div className="card">
      <h3 className="text-lg font-heading text-accent-400 mb-4">
        Attributes
      </h3>

      {/* Attribute Dice */}
      <div className="mb-4 p-3 bg-charcoal-800 rounded border border-accent-400/20">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Attribute Dice</span>
          <span className="text-xl text-accent-400 font-heading">
            {stats.attributeDice}
          </span>
        </div>
      </div>

      {/* Attributes Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-accent-400/20">
              <th className="text-left py-2 px-3 text-gray-400 font-heading">
                Attribute
              </th>
              <th className="text-center py-2 px-3 text-gray-400 font-heading">
                Range <span className="text-gray-500 text-xs">(Min – Max)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.attributes).map(([key, range]) => {
              if (!range) return null;
              return (
                <tr
                  key={key}
                  className="border-b border-charcoal-800 hover:bg-charcoal-800/50 transition-colors"
                >
                  <td className="py-2 px-3 text-gray-300">
                    {ATTRIBUTE_LABELS[key] || key}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="text-accent-400 font-mono">
                      {range.min}
                    </span>
                    <span className="text-gray-500 mx-2">–</span>
                    <span className="text-accent-400 font-mono">
                      {range.max}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Additional Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-3 bg-charcoal-800 rounded border border-accent-400/20">
          <div className="text-xs text-gray-500 mb-1">Move</div>
          <div className="text-accent-400 font-mono">{stats.move}</div>
        </div>
        <div className="p-3 bg-charcoal-800 rounded border border-accent-400/20">
          <div className="text-xs text-gray-500 mb-1">Size</div>
          <div className="text-accent-400 text-sm">{stats.size}</div>
        </div>
      </div>
    </div>
  );
}
