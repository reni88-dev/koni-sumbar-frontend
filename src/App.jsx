import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/master/Users';
import { RolesPage } from './pages/master/Roles';
import { CaborsPage } from './pages/master/Cabors';
import { EducationLevelsPage } from './pages/master/EducationLevels';
import { EventsPage } from './pages/Events';
import { EventDetailPage } from './pages/EventDetail';
import { AthletesPage } from './pages/Athletes';
import { FormBuilderPage } from './pages/FormBuilder';
import { FormBuilderCreatePage } from './pages/FormBuilderCreate';
import { FormFillPage } from './pages/FormFill';
import { FormSubmissionsPage } from './pages/FormSubmissions';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Athletes Route */}
      <Route
        path="/atlet"
        element={
          <ProtectedRoute>
            <AthletesPage />
          </ProtectedRoute>
        }
      />

      {/* Event Routes */}
      <Route
        path="/event"
        element={
          <ProtectedRoute>
            <EventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/event/:id"
        element={
          <ProtectedRoute>
            <EventDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Form Builder Routes */}
      <Route
        path="/form-builder"
        element={
          <ProtectedRoute>
            <FormBuilderPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/form-builder/create"
        element={
          <ProtectedRoute>
            <FormBuilderCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/form-builder/:id/edit"
        element={
          <ProtectedRoute>
            <FormBuilderCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/form-builder/:id/fill"
        element={
          <ProtectedRoute>
            <FormFillPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/form-builder/:id/submissions"
        element={
          <ProtectedRoute>
            <FormSubmissionsPage />
          </ProtectedRoute>
        }
      />

      {/* Master Data Routes */}
      <Route
        path="/master/users"
        element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/master/roles"
        element={
          <ProtectedRoute>
            <RolesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/master/cabors"
        element={
          <ProtectedRoute>
            <CaborsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/master/education-levels"
        element={
          <ProtectedRoute>
            <EducationLevelsPage />
          </ProtectedRoute>
        }
      />

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 - Redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
