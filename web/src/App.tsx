import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from '@/pages/Home';
import CatalogPage from '@/pages/Catalog';
import SpeciesDetailPage from '@/pages/SpeciesDetail';
import StarshipsPage from '@/pages/Starships';

function App() {
  return (
    <Routes>
      <Route path='/' element={<HomePage />} />
      <Route path='/species' element={<CatalogPage />} />
      <Route path='/species/:slug' element={<SpeciesDetailPage />} />
      <Route path='/starships' element={<StarshipsPage />} />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}

export default App;
