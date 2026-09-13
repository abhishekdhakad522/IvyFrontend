import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Login from './pages/Login';
import Browse from './pages/Browse';
import ListingDetail from './pages/ListingDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Saved from './pages/Saved';

// A layout wrapper that includes the Navbar for protected routes
const AppLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AppLayout><Browse defaultType="buy" /></AppLayout>} />
            <Route path="/buy" element={<AppLayout><Browse defaultType="buy" /></AppLayout>} />
            <Route path="/rent" element={<AppLayout><Browse defaultType="rent" /></AppLayout>} />
            <Route path="/projects" element={<AppLayout><Projects /></AppLayout>} />
            <Route path="/saved" element={<AppLayout><Saved /></AppLayout>} />
            <Route path="/listing/:id" element={<AppLayout><ListingDetail /></AppLayout>} />
            <Route path="/project/:id" element={<AppLayout><ProjectDetail /></AppLayout>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
