import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Compass, MapPin, Bus, Search, ExternalLink, Sparkles, Navigation, 
  Umbrella, Landmark, Trees, ShoppingBag, Eye, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { placeService } from '../api/services';

export default function ExploreMangaluru() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      const data = await placeService.getAll();
      setPlaces(data || []);
    } catch (err) {
      console.error('Failed to load places:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'ALL', label: 'All Destinations', icon: Compass },
    { id: 'Beach', label: 'Beaches & Coast', icon: Umbrella },
    { id: 'Temple', label: 'Temples & Heritage', icon: Landmark },
    { id: 'Park', label: 'Eco & Parks', icon: Trees },
    { id: 'Shopping', label: 'Shopping & Malls', icon: ShoppingBag },
  ];

  const filteredPlaces = places.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nearest_stop_name && p.nearest_stop_name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'Beach') return p.category.includes('Beach');
    if (selectedCategory === 'Temple') return p.category.includes('Temple') || p.category.includes('Heritage');
    if (selectedCategory === 'Park') return p.category.includes('Park') || p.category.includes('Wildlife') || p.category.includes('Eco');
    if (selectedCategory === 'Shopping') return p.category.includes('Shopping') || p.category.includes('Mall') || p.category.includes('Cinema');

    return true;
  });

  const handlePlanBus = (place) => {
    if (place.nearest_stop_name) {
      navigate(`/plan?destination=${encodeURIComponent(place.nearest_stop_name)}&destId=${place.nearest_stop_id || ''}`);
    } else {
      navigate(`/plan?destination=${encodeURIComponent(place.name)}`);
    }
  };

  const handleViewOnMap = (place) => {
    navigate(`/map?lat=${place.latitude}&lng=${place.longitude}&title=${encodeURIComponent(place.name)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-navy-950 via-slate-900 to-blue-950 text-white p-8 sm:p-12 mb-10 shadow-2xl border border-slate-800">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Kudla City Tourism & Transit Guide
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
              Explore Mangaluru By Bus
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              Discover pristine Arabian Sea beaches, centuries-old sacred temples, lush eco-parks, and vibrant modern shopping centers. Every destination is mapped to its nearest verified Mangaluru city bus stop.
            </p>

            {/* Search Input Bar */}
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Panambur Beach, Kadri Temple, Pilikula, Malls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
            <Compass className="w-96 h-96 text-white" />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2.5 mb-8">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm ${
                  active
                    ? 'bg-brand-600 text-white shadow-brand-500/30 shadow-md scale-105'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Destinations Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto shadow-sm">
            <Compass className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No destinations found</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Try searching for something else like "Beach", "Temple", or "Mall".
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
              className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredPlaces.map((place) => (
              <div
                key={place.id}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Destination Image */}
                <div className="relative h-52 overflow-hidden bg-slate-900">
                  <img
                    src={place.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'}
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
                  
                  {/* Category Badge */}
                  <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold border border-white/20">
                    {place.category}
                  </div>

                  {/* Title Over Image Bottom */}
                  <div className="absolute bottom-3.5 left-3.5 right-3.5">
                    <h3 className="text-xl font-black text-white tracking-tight drop-shadow-md">
                      {place.name}
                    </h3>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4 line-clamp-3">
                      {place.description}
                    </p>

                    {/* Nearest Bus Stop Badge */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                          <Bus className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                            Nearest Bus Stop
                          </p>
                          <p className="text-xs sm:text-sm font-extrabold text-slate-800">
                            {place.nearest_stop_name || 'Mangaluru Central Hub'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Verified
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleViewOnMap(place)}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <span>View Map</span>
                    </button>

                    <button
                      onClick={() => handlePlanBus(place)}
                      className="px-3 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
                    >
                      <span>Find Buses</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mangaluru Commuter Tip Card */}
        <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Bus className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900">
                Are you looking for city express timetable departures?
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Reserve your bus seats online for coastal lines or search direct schedules by date and time.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/schedules')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 flex-shrink-0 shadow-md"
          >
            <span>View Bus Schedules</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
