import { Navigate, Route, Routes } from 'react-router-dom';
import CatalogPage from '@/pages/Catalog';
import SpeciesDetailPage from '@/pages/SpeciesDetail';

function App() {
  return (
    <Routes>
      <Route path='/' element={<CatalogPage />} />
      <Route path='/species/:slug' element={<SpeciesDetailPage />} />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}

export default App;
