import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./components/Toast";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Quests from "./pages/Quests";
import Character from "./pages/Character";
import Shop from "./pages/Shop";
import Inventory from "./pages/Inventory";
import Achievements from "./pages/Achievements";
import Notifications from "./pages/Notifications";
import History from "./pages/History";
import Settings from "./pages/Settings";
import BossBattle from "./pages/BossBattle";
import AdventureMap from "./pages/AdventureMap";
import SkillTree from "./pages/SkillTree";
import FocusMode from "./pages/FocusMode";
import BrainGames from "./pages/BrainGames";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
                <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/quests" element={<Quests />} />
                  <Route path="/brain-games" element={<BrainGames />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/boss" element={<BossBattle />} />
                  <Route path="/adventure" element={<AdventureMap />} />
                  <Route path="/skills" element={<SkillTree />} />
                  <Route path="/focus" element={<FocusMode />} />
                  <Route path="/character" element={<Character />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/achievements" element={<Achievements />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Routes>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
