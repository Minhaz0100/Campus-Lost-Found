import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Items from './pages/Items';
import ItemDetail from './pages/ItemDetail';
import ReportItem from './pages/ReportItem';
import Profile from './pages/Profile';
import MyClaims from './pages/MyClaims';
import MapView from './pages/MapView';
import AIMatch from './pages/AIMatch';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminItems from './pages/admin/Items';
import AdminClaims from './pages/admin/Claims';
import AdminReports from './pages/admin/Reports';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="verify-email" element={<VerifyEmail />} />
        <Route path="items" element={<Items />} />
        <Route path="items/:id" element={<ItemDetail />} />
        <Route path="map" element={<MapView />} />
        <Route path="ai-match" element={<AIMatch />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="contact" element={<Contact />} />

        <Route element={<ProtectedRoute />}>
          <Route path="report" element={<ReportItem />} />
          <Route path="profile" element={<Profile />} />
          <Route path="my-claims" element={<MyClaims />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/items" element={<AdminItems />} />
          <Route path="admin/claims" element={<AdminClaims />} />
          <Route path="admin/reports" element={<AdminReports />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
