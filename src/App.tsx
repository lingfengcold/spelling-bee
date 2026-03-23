import React, { useState, useEffect, useMemo } from 'react';

// Reverting to enable1.txt as requested by the user to include more words (e.g., undeluded)
const DICTIONARY_URL = 'https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt';

interface WordGroup {
  length: number;
  words: string[];
}

function App() {
  const [dictionary, setDictionary] = useState<Set<string> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [centerLetter, setCenterLetter] = useState<string>('');
  const [otherLetters, setOtherLetters] = useState<string>('');
  
  const [results, setResults] = useState<WordGroup[]>([]);
  const [solving, setSolving] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  useEffect(() => {
    const fetchDictionary = async () => {
      try {
        const response = await fetch(DICTIONARY_URL);
        if (!response.ok) throw new Error('Failed to load dictionary');
        const text = await response.text();
        const words = new Set(text.split(/\r?\n/).map(w => w.trim().toLowerCase()).filter(w => w.length >= 4));
        setDictionary(words);
        setLoading(false);
      } catch (err) {
        setError('Could not load dictionary. Please refresh or try again later.');
        setLoading(false);
      }
    };

    fetchDictionary();
  }, []);

  const handleCenterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z]/g, '').toLowerCase().slice(0, 1);
    setCenterLetter(val);
  };

  const handleOtherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z]/g, '').toLowerCase().slice(0, 6);
    setOtherLetters(val);
  };

  const isValid = useMemo(() => {
    if (!centerLetter) return false;
    if (otherLetters.length !== 6) return false;
    
    // Check for uniqueness
    const all = centerLetter + otherLetters;
    const set = new Set(all.split(''));
    return set.size === 7;
  }, [centerLetter, otherLetters]);

  const solve = () => {
    if (!dictionary || !isValid) return;
    setSolving(true);
    setResults([]);
    setHasSearched(true);

    // Run in a timeout to allow UI to update to "solving" state
    setTimeout(() => {
      const allowed = new Set((centerLetter + otherLetters).split(''));
      const foundWords: string[] = [];

      for (const word of dictionary) {
        if (word.length < 4) continue;
        if (!word.includes(centerLetter)) continue;
        
        let validWord = true;
        for (const char of word) {
          if (!allowed.has(char)) {
            validWord = false;
            break;
          }
        }
        
        if (validWord) {
          foundWords.push(word);
        }
      }

      // Group by length
      const grouped: Record<number, string[]> = {};
      foundWords.forEach(w => {
        const len = w.length;
        if (!grouped[len]) grouped[len] = [];
        grouped[len].push(w);
      });

      const sortedGroups: WordGroup[] = Object.keys(grouped)
        .map(lenStr => {
          const len = parseInt(lenStr);
          return {
            length: len,
            words: grouped[len].sort()
          };
        })
        .sort((a, b) => a.length - b.length); // Ascending length? Prompt says "按照单词长度顺序", typically ascending or descending.
                                              // Usually for help, shortest first is easier, or longest is "better".
                                              // Let's do ascending length (shortest first).

      setResults(sortedGroups);
      setSolving(false);
    }, 100);
  };

  const isPangram = (word: string) => {
    const wordSet = new Set(word.split(''));
    return wordSet.size === 7;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="text-xl font-bold text-yellow-800 animate-pulse">Loading Dictionary...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-xl font-bold text-red-800">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 flex flex-col items-center">
      <h1 className="text-4xl font-extrabold text-yellow-600 mb-2 drop-shadow-sm">Spelling Bee Solver</h1>
      <div className="text-center mb-8">
        <p className="text-gray-600 font-medium">Using standard word game dictionary (ENABLE1)</p>
        <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
          Note: This list is widely used in word games and includes words like "undeluded".
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md mb-8">
        <div className="flex flex-col gap-4">
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Center Letter</label>
              <input
                type="text"
                value={centerLetter}
                onChange={handleCenterChange}
                onKeyDown={(e) => e.key === 'Enter' && solve()}
                className="w-full text-center text-2xl font-bold p-3 border-2 border-yellow-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 uppercase bg-yellow-50"
                placeholder="A"
                maxLength={1}
              />
            </div>
            <div className="flex-[3]">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Other 6 Letters</label>
              <input
                type="text"
                value={otherLetters}
                onChange={handleOtherChange}
                onKeyDown={(e) => e.key === 'Enter' && solve()}
                className="w-full text-center text-2xl font-bold p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase tracking-widest"
                placeholder="BCDEFG"
                maxLength={6}
              />
            </div>
          </div>

          <div className="text-sm text-gray-500">
            {!isValid && (
              <p className="text-red-500">Please enter exactly 7 unique letters.</p>
            )}
            {isValid && (
              <p className="text-green-600">Ready to solve!</p>
            )}
          </div>

          <button
            onClick={solve}
            disabled={!isValid || solving}
            className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
              !isValid || solving 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-yellow-500 hover:bg-yellow-600 shadow-md'
            }`}
          >
            {solving ? 'Solving...' : 'Solve'}
          </button>
        </div>
      </div>

      {!solving && hasSearched && results.length === 0 && (
        <div className="w-full max-w-2xl bg-white p-6 rounded-xl shadow-lg text-center text-gray-500">
          No words found. Try different letters!
        </div>
      )}

      {results.length > 0 && (
        <div className="w-full max-w-2xl bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Results</h2>
            <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
              {results.reduce((acc, g) => acc + g.words.length, 0)} words found
            </span>
          </div>
          
          <div className="space-y-6">
            {results.map((group) => (
              <div key={group.length} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {group.length} Letters <span className="text-gray-400 text-sm">({group.words.length})</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {group.words.map((word) => {
                    const pangram = isPangram(word);
                    return (
                      <span 
                        key={word} 
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          pangram 
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {word}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
