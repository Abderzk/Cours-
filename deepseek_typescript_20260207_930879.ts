// components/features/results/FrenchResultsSection.tsx
import React, { useState, useEffect } from 'react';
import { FrenchResultsService } from '../../../services/results/frenchResultsService';
import { FrenchRaceResult } from '../../../types/raceResults';
import './FrenchResultsSection.css';

const FrenchResultsSection: React.FC = () => {
  const [results, setResults] = useState<FrenchRaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedHippodrome, setSelectedHippodrome] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'analysis' | 'stats'>('list');
  const [selectedRace, setSelectedRace] = useState<FrenchRaceResult | null>(null);

  const resultsService = new FrenchResultsService();

  useEffect(() => {
    loadTodayResults();
  }, []);

  const loadTodayResults = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayResults = await resultsService.getFrenchResults(today);
      setResults(todayResults);
    } catch (error) {
      console.error('خطأ في تحميل النتائج:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResultsByDate = async (date: string) => {
    setLoading(true);
    try {
      const dateResults = await resultsService.getFrenchResults(date);
      setResults(dateResults);
      setSelectedDate(date);
    } catch (error) {
      console.error('خطأ في تحميل النتائج:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    if (date) {
      loadResultsByDate(date);
    }
  };

  const filteredResults = results.filter(race => {
    if (selectedHippodrome !== 'all' && race.hippodrome !== selectedHippodrome) {
      return false;
    }
    return true;
  });

  const hippodromes = [...new Set(results.map(race => race.hippodrome || 'غير معروف'))];

  return (
    <div className="french-results-section">
      <div className="results-header">
        <h2>🏁 نتائج سباقات فرنسا</h2>
        <div className="controls">
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="date-picker"
          />
          <select
            value={selectedHippodrome}
            onChange={(e) => setSelectedHippodrome(e.target.value)}
            className="hippodrome-select"
          >
            <option value="all">جميع الميادين</option>
            {hippodromes.map(hippo => (
              <option key={hippo} value={hippo}>{hippo}</option>
            ))}
          </select>
          <button onClick={loadTodayResults} className="btn-refresh">
            ↻ تحديث
          </button>
        </div>
      </div>

      <div className="view-tabs">
        <button 
          className={viewMode === 'list' ? 'active' : ''}
          onClick={() => setViewMode('list')}
        >
          📋 قائمة النتائج
        </button>
        <button 
          className={viewMode === 'analysis' ? 'active' : ''}
          onClick={() => setViewMode('analysis')}
          disabled={!selectedRace}
        >
          📊 التحليل
        </button>
        <button 
          className={viewMode === 'stats' ? 'active' : ''}
          onClick={() => setViewMode('stats')}
        >
          📈 الإحصائيات
        </button>
      </div>

      {loading ? (
        <div className="loading">جاري تحميل النتائج...</div>
      ) : viewMode === 'list' ? (
        <ResultsList 
          results={filteredResults}
          onSelectRace={setSelectedRace}
          selectedRace={selectedRace}
        />
      ) : viewMode === 'analysis' && selectedRace ? (
        <RaceAnalysis race={selectedRace} />
      ) : viewMode === 'stats' ? (
        <StatisticsView results={results} />
      ) : null}
    </div>
  );
};

// مكون عرض قائمة النتائج
const ResultsList: React.FC<{
  results: FrenchRaceResult[];
  onSelectRace: (race: FrenchRaceResult) => void;
  selectedRace: FrenchRaceResult | null;
}> = ({ results, onSelectRace, selectedRace }) => {
  if (results.length === 0) {
    return (
      <div className="no-results">
        <p>لا توجد نتائج لهذا التاريخ</p>
      </div>
    );
  }

  return (
    <div className="results-list">
      {results.map(race => (
        <div 
          key={race.id}
          className={`race-result-card ${selectedRace?.id === race.id ? 'selected' : ''}`}
          onClick={() => onSelectRace(race)}
        >
          <div className="race-result-header">
            <div className="race-info">
              <h3>{race.raceName}</h3>
              <div className="race-details">
                <span>🏟️ {race.hippodrome}</span>
                <span>⏰ {race.time}</span>
                <span>📏 {race.distance}m</span>
                <span className={`status ${race.raceType}`}>
                  {getRaceTypeLabel(race.raceType)}
                </span>
              </div>
            </div>
            <div className="race-stats">
              <span>🏇 {race.totalRunners} حصان</span>
              <span>💰 {race.statistics.totalPrizeMoney.toLocaleString()} €</span>
              <span className={race.statistics.favoriteWon ? 'favorite-won' : 'favorite-lost'}>
                {race.statistics.favoriteWon ? '✔ المفضل فاز' : '✘ المفضل خسر'}
              </span>
            </div>
          </div>

          <div className="podium-results">
            <h4>المراكز الثلاثة الأولى:</h4>
            <div className="podium">
              {race.results.slice(0, 3).map(horse => (
                <div key={horse.horseId} className="podium-item">
                  <div className={`position position-${horse.finalPosition}`}>
                    {getPositionMedal(horse.finalPosition)}
                  </div>
                  <div className="horse-info">
                    <div className="horse-name">{horse.name}</div>
                    <div className="horse-details">
                      <span>الجوكي: {horse.jockey}</span>
                      <span>المدرب: {horse.trainer}</span>
                      <span>الاحتمالات: {horse.startingPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="result-summary">
            <span>الفائز: {race.results[0]?.name || 'غير معروف'}</span>
            <span>الوقت: {race.results[0]?.performance?.finishingTime || 'غير معروف'}</span>
            <span>الفارق: {race.statistics.margin}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// مكون التحليل التفصيلي
const RaceAnalysis: React.FC<{ race: FrenchRaceResult }> = ({ race }) => {
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    const service = new FrenchResultsService();
    const raceAnalysis = service.generateRaceAnalysis(race);
    setAnalysis(raceAnalysis);
  }, [race]);

  if (!analysis) return <div>جاري تحليل النتائج...</div>;

  return (
    <div className="race-analysis">
      <h3>📊 تحليل تفصيلي للسباق</h3>
      
      <div className="analysis-section">
        <h4>ملخص السباق:</h4>
        <p>{analysis.summary}</p>
      </div>

      <div className="analysis-section">
        <h4>رؤى رئيسية:</h4>
        <ul>
          {analysis.keyInsights.map((insight: string, index: number) => (
            <li key={index}>{insight}</li>
          ))}
        </ul>
      </div>

      <div className="analysis-section