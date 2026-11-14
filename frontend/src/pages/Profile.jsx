import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, History, Trash2, ArrowRight, User, Clock, MapPin, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../api/services';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const [favRes, histRes] = await Promise.all([
        userService.getFavorites(),
        userService.getHistory()
      ]);
      setFavorites(favRes.favorites || []);
      setHistory(histRes.history || []);
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleDeleteFavorite = async (id) => {
    try {
      await userService.removeFavorite(id);
      setFavorites(favorites.filter(f => f.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all your recent search history?')) return;
    try {
      await userService.clearHistory();
      setHistory([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLaunchSearch = (sourceId, destId, sourceName, destName) => {
    navigate('/journey-results', {
      state: {
        sourceId,
        destId,
        sourceName,
        destName,
        departureTime: '08:00',
        dayOfWeek: 'Mon'
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Profile Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-brand-600 to-navy-900 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="text-center sm:text-left space-y-1">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <h1 className="text-2xl font-extrabold text-slate-900">{user?.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 capitalize">
              {user?.role || 'Commuter'}
            </span>
          </div>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <p className="text-xs text-slate-400">
            Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Favorites Column */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                Saved Favorite Journeys ({favorites.length})
              </h3>
            </div>

            {favorites.length > 0 ? (
              <div className="space-y-3">
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    className="p-4 bg-slate-50 hover:bg-brand-50/60 rounded-2xl border border-slate-200/80 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                        <span>{fav.source_stop_name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-brand-600" />
                        <span>{fav.destination_stop_name}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Saved on {new Date(fav.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLaunchSearch(fav.source_stop_id, fav.destination_stop_id, fav.source_stop_name, fav.destination_stop_name)}
                        className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
                      >
                        <span>Find Buses</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFavorite(fav.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                No saved journeys yet. Click the heart icon on any journey result to save it here!
              </div>
            )}
          </div>

          {/* Search History Column */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <History className="w-5 h-5 text-brand-600" />
                Recent Search History ({history.length})
              </h3>

              {history.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                >
                  Clear History
                </button>
              )}
            </div>

            {history.length > 0 ? (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLaunchSearch(item.source_stop_id, item.destination_stop_id, item.source_stop_name, item.destination_stop_name)}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 flex items-center justify-between text-xs cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-800">
                          {item.source_stop_name} ➔ {item.destination_stop_name}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(item.searched_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                No recent searches logged.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
