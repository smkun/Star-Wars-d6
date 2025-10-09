import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from '@/pages/Home';
import CatalogPage from '@/pages/Catalog';
import SpeciesDetailPage from '@/pages/SpeciesDetail';
import StarshipsPage from '@/pages/Starships';
import StarfightersPage from '@/pages/Starfighters';
import TransportsPage from '@/pages/Transports';
import CapitalShipsPage from '@/pages/CapitalShips';
import StarshipFamilyPage from '@/pages/StarshipFamily';
import StarshipDetailPage from '@/pages/StarshipDetail';

function App() {
  return (
    <Routes>
      <Route path='/' element={<HomePage />} />
      <Route path='/species' element={<CatalogPage />} />
      <Route path='/species/:slug' element={<SpeciesDetailPage />} />
      <Route path='/starships' element={<StarshipsPage />} />
      <Route path='/starfighters' element={<StarfightersPage />} />
      <Route path='/transports' element={<TransportsPage />} />
      <Route path='/capital-ships' element={<CapitalShipsPage />} />
      <Route path='/starships/family/:family' element={<StarshipFamilyPage />} />
      <Route path='/starships/:id' element={<StarshipDetailPage />} />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}

export default App;
