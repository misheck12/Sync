import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface SearchResult {
  homework: any[];
  resources: any[];
  forums: any[];
  topics: any[];
  announcements: any[];
  students: any[];
}

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (query.length >= 2) {
        performSearch();
      } else {
        setResults(null);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [query]);

  const performSearch = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
      setResults(response.data.results);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (type: string, id: string) => {
    setShowResults(false);
    setQuery('');
    
    switch (type) {
      case 'homework':
        navigate(`/teacher/homework`);
        break;
      case 'resource':
        navigate(`/teacher/resources`);
        break;
      case 'forum':
        navigate(`/forums/${id}`);
        break;
      case 'topic':
        navigate(`/forums/topics/${id}`);
        break;
      case 'announcement':
        navigate(`/announcements/${id}`);
        break;
      case 'student':
        navigate(`/students/${id}`);
        break;
    }
  };

  const getTotalResults = () => {
    if (!results) return 0;
    return Object.values(results).reduce((acc, arr) => acc + arr.length, 0);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder="Search homework, forums, announcements..."
          className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults(null);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader className="w-5 h-5 text-blue-600 animate-spin" />
          </div>
        )}
      </div>

      {/* Search Results */}
      {showResults && results && getTotalResults() > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {/* Homework */}
          {results.homework.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                Homework ({results.homework.length})
              </p>
              {results.homework.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleResultClick('homework', item.id)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded"
                >
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-600">
                    {item.subjectContent.class.name} • {item.subjectContent.subject.name}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Resources */}
          {results.resources.length > 0 && (
            <div className="p-2 border-t">
              <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                Resources ({results.resources.length})
              </p>
              {results.resources.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleResultClick('resource', item.id)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded"
                >
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-600">{item.type}</p>
                </button>
              ))}
            </div>
          )}

          {/* Forums */}
          {results.forums.length > 0 && (
            <div className="p-2 border-t">
              <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                Forums ({results.forums.length})
              </p>
              {results.forums.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleResultClick('forum', item.id)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded"
                >
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-600">{item.type}</p>
                </button>
              ))}
            </div>
          )}

          {/* Topics */}
          {results.topics.length > 0 && (
            <div className="p-2 border-t">
              <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                Topics ({results.topics.length})
              </p>
              {results.topics.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleResultClick('topic', item.id)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded"
                >
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-600">
                    {item.forum.name} • by {item.createdBy.fullName}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Announcements */}
          {results.announcements.length > 0 && (
            <div className="p-2 border-t">
              <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                Announcements ({results.announcements.length})
              </p>
              {results.announcements.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleResultClick('announcement', item.id)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded"
                >
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-600">
                    {item.category} • {item.priority}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {showResults && results && getTotalResults() === 0 && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-white border rounded-lg shadow-lg p-4 z-50">
          <p className="text-center text-slate-500">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
