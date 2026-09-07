import { Route, Routes } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import AdminLoginPage from '../pages/AdminLoginPage'
import AdminDashboard from '../pages/AdminDashboard'
import HomePage from '../pages/HomePage'
import ExplorePage from '../pages/ExplorePage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import NotFoundPage from '../pages/NotFoundPage'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
        <Route path="/admin/login" element={<AdminLoginPage/>} />
        <Route path="/admin/dashboard" element={<AdminDashboard/>} />
      </Route>
    </Routes>
  )
}

export default AppRoutes