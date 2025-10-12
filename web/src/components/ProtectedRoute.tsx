import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '@/utils/firebase';
import type { User as FirebaseUser } from 'firebase/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [user, setUser] = useState<FirebaseUser | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Still loading
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gray-900 text-yellow-400 flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated
  return <>{children}</>;
}
