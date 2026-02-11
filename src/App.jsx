import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/master/Users';
import { RolesPage } from './pages/master/Roles';
import { CaborsPage } from './pages/master/Cabors';
import { EducationLevelsPage } from './pages/master/EducationLevels';
import { CompetitionClassesPage } from './pages/master/CompetitionClasses';
import { RegionsPage } from './pages/master/Regions';
import { OrganizationsPage } from './pages/master/Organizations';
import { CoachAthletesPage } from './pages/CoachAthletes';
import { EventsPage } from './pages/Events';
import { EventDetailPage } from './pages/EventDetail';
import { AthletesPage } from './pages/Athletes';
import { CoachesPage } from './pages/Coaches';
import { FormBuilderPage } from './pages/FormBuilder';
import { FormBuilderCreatePage } from './pages/FormBuilderCreate';
import { FormFillPage } from './pages/FormFill';
import { FormSubmissionsPage } from './pages/FormSubmissions';
import { ActivityLogsPage } from './pages/ActivityLogs';
import { AthletePortal } from './pages/AthletePortal';
import { CoachPortal } from './pages/CoachPortal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

// Smart Dashboard that redirects based on user role
function SmartDashboard() {
  const { user } = useAuth();
  
  // Redirect athletes to their portal
  if (user?.role?.name === 'athlete') {
    return <Navigate to="/portal/atlet" replace />;
  }
  
  // Redirect coaches to their portal
  if (user?.role?.name === 'coach') {
    return <Navigate to="/portal/pelatih" replace />;
  }
  
  // For admins and other roles, show the regular dashboard
  return <Dashboard />;
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ProtectedRoute><ResetPassword /></ProtectedRoute>} />      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <SmartDashboard />
          </ProtectedRoute>
        }
      />

      {/* Portal Routes */}
      <Route
        path="/portal/atlet"
        element={
          <ProtectedRoute>
            <AthletePortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/pelatih"
        element={
          <ProtectedRoute>
            <CoachPortal />
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

      {/* Coaches Route */}
      <Route
        path="/pelatih"
        element={
          <ProtectedRoute>
            <CoachesPage />
          </ProtectedRoute>
        }
      />

      {/* Coach-Athletes Route */}
      <Route
        path="/coach-athletes"
        element={
          <ProtectedRoute>
            <CoachAthletesPage />
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
      <Route
        path="/master/competition-classes"
        element={
          <ProtectedRoute>
            <CompetitionClassesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/master/regions"
        element={
          <ProtectedRoute>
            <RegionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/master/organizations"
        element={
          <ProtectedRoute>
            <OrganizationsPage />
          </ProtectedRoute>
        }
      />

      {/* Activity Logs Route (Super Admin only - enforced on backend) */}
      <Route
        path="/activity-logs"
        element={
          <ProtectedRoute>
            <ActivityLogsPage />
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

