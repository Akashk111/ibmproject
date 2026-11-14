import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, SlidersHorizontal, MapPin, Clock, AlertTriangle, RefreshCw, Bus, Compass, ChevronRight } from 'lucide-react';
import SearchCard from '../components/SearchCard';
import JourneyCard from '../components/JourneyCard';
import LeafletMap from '../components/LeafletMap';
import DemoDataNotice from '../components/DemoDataNotice';
import { journeyService } from '../api/services';

export default function JourneyResults() {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useState(location.state || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [showModifySearch, setShowModifySearch] = useState(false);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'DIRECT', 'TRANSFER'

  const executeSearch = async (params) => {
    if (!params || !params.sourceId || !params.destId) {
      setError('Please provide starting and destination bus stops to search.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await journeyService.search(
        params.sourceId,
        params.destId,
        params.departureTime,
        params.dayOfWeek
      );
      setSearchResult(res);
      if (res.journeys && res.journeys.length > 0) {
        setSelectedJourney(res.journeys[0]);
      } else {
        setSelectedJourney(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to search journeys. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state) {
      setSearchParams(location.state);
      executeSearch(location.state);
    } else {
      // Default sample search: State Bank to Surathkal
      const defaultState = {
        sourceId: 1,
        destId: 13,
        sourceName: 'State Bank',
        destName: 'Surathkal',
        departureTime: '08:00',
        dayOfWeek: 'Mon'
      };
      setSearchParams(defaultState);
      executeSearch(defaultState);
    }
  }, [location.state]);

  const handleModifySearch = (newParams) => {
    const updated = {
      sourceId: newParams.sourceStop.id,
      destId: newParams.destStop.id,
      sourceName: newParams.sourceStop.name,
      destName: newParams.destStop.name,
      departureTime: newParams.departureTime,
      dayOfWeek: newParams.dayOfWeek
    };
    setSearchParams(updated);
    setShowModifySearch(false);
    executeSearch(updated);
  };

  const filteredJourneys = (searchResult?.journeys || []).filter(j => {
    if (filterType === 'DIRECT') return j.journey_type === 'DIRECT';
    if (filterType === 'TRANSFER') return j.journey_type !== 'DIRECT';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
            <span>{searchParams?.sourceName || 'Starting Point'}</span>
            <span className="text-brand-600">➔</span>
            <span>{searchParams?.destName || 'Destination'}</span>
          </h1>

          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Departing: {searchParams?.departureTime || 'Now'} ({searchParams?.dayOfWeek || 'Today'})</span>
            <span className="text-slate-300">•</span>
            <span>{searchResult?.journeys?.length || 0} Journey Options Found</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModifySearch(!showModifySearch)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-sm transition-all self-start sm:self-auto"
        >
          <SlidersHorizontal className="w-4 h-4 text-brand-600" />
          <span>{showModifySearch ? 'Close Search Bar' : 'Modify Search'}</span>
        </button>
      </div>

      {/* Modify Search Drawer */}
      {showModifySearch && (
        <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm animate-fadeIn">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
            Change Departure or Destination
          </h3>
          <SearchCard
            initialSource={searchParams?.sourceName}
            initialDest={searchParams?.destName}
            onSearch={handleModifySearch}
            compact
          />
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium text-sm">
            Searching direct buses and connecting routes in Mangaluru transit graph...
          </p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-2">
          <h3 className="font-bold flex items-center gap-2 text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            Error Searching Journey
          </h3>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => executeSearch(searchParams)}
            className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Search
          </button>
        </div>
      )}

      {/* No Route Found Fallback (Stage 4) */}
      {!loading && !error && searchResult && !searchResult.success && (
        <div className="space-y-8 animate-fadeIn">
          <div className="bg-white p-8 rounded-2xl border border-amber-200 shadow-sm text-center max-w-3xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Compass className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {searchResult.message}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
              No direct or 1-transfer bus schedule was found departing at {searchResult.departure_time_requested} on {searchResult.day_requested} between {searchResult.source_stop?.name} and {searchResult.destination_stop?.name}.
            </p>
            {searchResult.suggestions?.advice && (
              <p className="text-xs font-semibold text-brand-700 bg-brand-50 py-2 px-4 rounded-full inline-block">
                💡 Advice: {searchResult.suggestions.advice}
              </p>
            )}
          </div>

          {/* Suggestions Cards */}
          {searchResult.suggestions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Nearby Boarding Points */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Nearby Alternative Boarding Points
                </h3>
                <div className="space-y-2">
                  {searchResult.suggestions.nearby_boarding_stops?.map((item) => (
                    <div
                      key={item.stop.id}
                      className="p-3 bg-slate-50 hover:bg-brand-50 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer"
                      onClick={() => {
                        const newP = { ...searchParams, sourceId: item.stop.id, sourceName: item.stop.name };
                        setSearchParams(newP);
                        executeSearch(newP);
                      }}
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{item.stop.name}</span>
                        <span className="text-slate-500">{item.stop.location_description}</span>
                      </div>
                      <span className="text-brand-600 font-semibold">{item.distance_km} km away ➔</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nearby Destination Points */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-600" />
                  Nearby Alternative Dropping Points
                </h3>
                <div className="space-y-2">
                  {searchResult.suggestions.nearby_destination_stops?.map((item) => (
                    <div
                      key={item.stop.id}
                      className="p-3 bg-slate-50 hover:bg-brand-50 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer"
                      onClick={() => {
                        const newP = { ...searchParams, destId: item.stop.id, destName: item.stop.name };
                        setSearchParams(newP);
                        executeSearch(newP);
                      }}
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{item.stop.name}</span>
                        <span className="text-slate-500">{item.stop.location_description}</span>
                      </div>
                      <span className="text-brand-600 font-semibold">{item.distance_km} km away ➔</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Successful Results View */}
      {!loading && !error && searchResult && searchResult.success && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Journey Cards list & Filters */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Filter Tabs */}
            <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-xl text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  filterType === 'ALL' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'hover:text-slate-900'
                }`}
              >
                All Options ({searchResult.journeys.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('DIRECT')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  filterType === 'DIRECT' ? 'bg-white text-emerald-800 shadow-sm font-bold' : 'hover:text-slate-900'
                }`}
              >
                Direct Only ({searchResult.journeys.filter(j => j.journey_type === 'DIRECT').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('TRANSFER')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  filterType === 'TRANSFER' ? 'bg-white text-amber-900 shadow-sm font-bold' : 'hover:text-slate-900'
                }`}
              >
                1-Transfer ({searchResult.journeys.filter(j => j.journey_type !== 'DIRECT').length})
              </button>
            </div>

            {/* Notice */}
            <DemoDataNotice />

            {/* Journey Cards */}
            <div className="space-y-4">
              {filteredJourneys.length > 0 ? (
                filteredJourneys.map((journey, idx) => (
                  <JourneyCard
                    key={idx}
                    journey={journey}
                    isSelected={selectedJourney === journey}
                    onSelect={(j) => setSelectedJourney(j)}
                  />
                ))
              ) : (
                <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-sm text-slate-500">
                  No journeys matching the selected filter. Try switching to "All Options".
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Sticky Interactive Leaflet Map */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-600" />
                  Route Map & Stops Sequence
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {selectedJourney?.journey_type === 'DIRECT' ? 'Direct Line' : 'Transfer Line'}
                </span>
              </div>

              {/* Map */}
              <LeafletMap journey={selectedJourney} />

              {selectedJourney && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">
                    Selected: Option {selectedJourney.rank}
                  </span>
                  <span className="font-bold text-brand-700">
                    {selectedJourney.summary}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
