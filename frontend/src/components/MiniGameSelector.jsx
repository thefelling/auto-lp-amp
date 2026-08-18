import React from 'react';

const MiniGameSelector = ({ gameType, position, customSelector, onChange }) => {
  const gameOptions = [
    { value: 'spin', label: '🎰 Spin Wheel' },
    { value: 'slot', label: '🎰 Slot Machine' },
    { value: 'coinflip', label: '🪙 Coin Flip' },
    { value: 'dadu', label: '🎲 Dadu' },
    { value: 'tebak', label: '🔢 Tebak Angka' },
    { value: 'kartu', label: '🃏 Tebak Kartu' },
  ];

  const positionOptions = [
    { value: 'hero', label: 'Di bawah Hero' },
    { value: 'daftar', label: 'Di bawah Daftar' },
    { value: 'faq', label: 'Di bawah FAQ' },
    { value: 'custom', label: 'Custom (pilih selector)' },
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Pilih Game
        </label>
        <select
          value={gameType}
          onChange={(e) => onChange('miniGameType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {gameOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Posisi Game
        </label>
        <select
          value={position}
          onChange={(e) => onChange('miniGamePosition', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {positionOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {position === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Custom Selector (CSS selector)
          </label>
          <input
            type="text"
            value={customSelector}
            onChange={(e) => onChange('miniGameCustomSelector', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder=".my-custom-container"
          />
        </div>
      )}
    </div>
  );
};

export default MiniGameSelector;