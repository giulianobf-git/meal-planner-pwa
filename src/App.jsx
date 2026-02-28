import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import PlannerPage from '@/pages/PlannerPage';
import RecipesPage from '@/pages/RecipesPage';
import RecipeFormPage from '@/pages/RecipeFormPage';
import GroceryPage from '@/pages/GroceryPage';
import ContiPage from '@/pages/ContiPage';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import SfidaPage from '@/pages/SfidaPage';

function ProtectedRoute({ children }) {
    const { currentUser, authChecked } = useAuth();
    useRealtimeSync(); // Single WebSocket — syncs data between users in real-time
    if (!authChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    if (!currentUser) return <Navigate to="/login" replace />;
    return children;
}

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<PlannerPage />} />
                    <Route path="recipes" element={<RecipesPage />} />
                    <Route path="recipes/new" element={<RecipeFormPage />} />
                    <Route path="recipes/:id/edit" element={<RecipeFormPage />} />
                    <Route path="grocery" element={<GroceryPage />} />
                    <Route path="conti" element={<ContiPage />} />
                    <Route path="conti/:id" element={<ProjectDetailPage />} />
                    <Route path="sfida" element={<SfidaPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthProvider>
    );
}
