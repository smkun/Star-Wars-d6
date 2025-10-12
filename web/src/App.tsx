import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from '@/pages/Home';
import CatalogPage from '@/pages/Catalog';
import SpeciesDetailPage from '@/pages/SpeciesDetail';
import StarshipsPage from '@/pages/Starships';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import CharactersList from '@/pages/CharactersList';
import CharacterNew from '@/pages/CharacterNew';
import CharacterEdit from '@/pages/CharacterEdit';
import CharacterPrint from '@/pages/CharacterPrint';
import StarfightersPage from '@/pages/Starfighters';
import TransportsPage from '@/pages/Transports';
import CapitalShipsPage from '@/pages/CapitalShips';
import StarshipFamilyPage from '@/pages/StarshipFamily';
import StarshipDetailPage from '@/pages/StarshipDetail';
import CharacterDetail from '@/pages/CharacterDetail';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/species" element={<CatalogPage />} />
      <Route path="/species/:slug" element={<SpeciesDetailPage />} />
      <Route path="/starships" element={<StarshipsPage />} />
      <Route path="/starfighters" element={<StarfightersPage />} />
      <Route path="/transports" element={<TransportsPage />} />
      <Route path="/capital-ships" element={<CapitalShipsPage />} />
      <Route
        path="/starships/family/:family"
        element={<StarshipFamilyPage />}
      />
      <Route path="/starships/:id" element={<StarshipDetailPage />} />

      {/* Protected character routes */}
      <Route
        path="/characters"
        element={
          <ProtectedRoute>
            <CharactersList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/characters/new"
        element={
          <ProtectedRoute>
            <CharacterNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/characters/:id"
        element={
          <ProtectedRoute>
            <CharacterDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/characters/:id/edit"
        element={
          <ProtectedRoute>
            <CharacterEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/characters/:id/print"
        element={
          <ProtectedRoute>
            <CharacterPrint />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
