import { Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import AdminAppointments from '../pages/admin/Appointments';
import AdminDashboard from '../pages/admin/Dashboard';
import AdminDepartments from '../pages/admin/Departments';
import AdminDoctors from '../pages/admin/Doctors';
import AdminMedications from '../pages/admin/Medications';
import AdminPatients from '../pages/admin/Patients';
import AdminReports from '../pages/admin/Reports';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import DoctorAppointments from '../pages/doctor/Appointments';
import AppointmentWorkspace from '../pages/doctor/AppointmentWorkspace';
import DoctorAvailability from '../pages/doctor/Availability';
import DoctorConsultations from '../pages/doctor/Consultations';
import DoctorDashboard from '../pages/doctor/Dashboard';
import DoctorPatientDetail from '../pages/doctor/PatientDetail';
import DoctorPatients from '../pages/doctor/Patients';
import DoctorPrescriptions from '../pages/doctor/Prescriptions';
import DoctorProfile from '../pages/doctor/Profile';
import BookAppointment from '../pages/patient/BookAppointment';
import PatientConsultations from '../pages/patient/Consultations';
import PatientDashboard from '../pages/patient/Dashboard';
import DoctorDetail from '../pages/patient/DoctorDetail';
import DoctorSearch from '../pages/patient/DoctorSearch';
import MedicalRecords from '../pages/patient/MedicalRecords';
import MyAppointments from '../pages/patient/MyAppointments';
import PatientPrescriptions from '../pages/patient/Prescriptions';
import PatientProfile from '../pages/patient/Profile';
import Forbidden from '../pages/shared/Forbidden';
import NotFound from '../pages/shared/NotFound';
import Notifications from '../pages/shared/Notifications';
import { HomeRedirect } from './HomeRedirect';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

/** public: /login and /register. Everything else: ProtectedRoute -> RoleRoute -> DashboardLayout -> page. */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/notifications" element={<Notifications />} />

          <Route element={<RoleRoute allow={['PATIENT']} />}>
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/patient/profile" element={<PatientProfile />} />
            <Route path="/patient/doctors" element={<DoctorSearch />} />
            <Route path="/patient/doctors/:id" element={<DoctorDetail />} />
            <Route path="/patient/appointments" element={<MyAppointments />} />
            <Route path="/patient/appointments/book" element={<BookAppointment />} />
            <Route path="/patient/consultations" element={<PatientConsultations />} />
            <Route path="/patient/prescriptions" element={<PatientPrescriptions />} />
            <Route path="/patient/medical-records" element={<MedicalRecords />} />
          </Route>

          <Route element={<RoleRoute allow={['DOCTOR']} />}>
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/profile" element={<DoctorProfile />} />
            <Route path="/doctor/availability" element={<DoctorAvailability />} />
            <Route path="/doctor/appointments" element={<DoctorAppointments />} />
            <Route path="/doctor/appointments/:id" element={<AppointmentWorkspace />} />
            <Route path="/doctor/patients" element={<DoctorPatients />} />
            <Route path="/doctor/patients/:id" element={<DoctorPatientDetail />} />
            <Route path="/doctor/consultations" element={<DoctorConsultations />} />
            <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />
          </Route>

          <Route element={<RoleRoute allow={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/doctors" element={<AdminDoctors />} />
            <Route path="/admin/patients" element={<AdminPatients />} />
            <Route path="/admin/appointments" element={<AdminAppointments />} />
            <Route path="/admin/departments" element={<AdminDepartments />} />
            <Route path="/admin/medications" element={<AdminMedications />} />
            <Route path="/admin/reports" element={<AdminReports />} />
          </Route>
        </Route>
      </Route>

      <Route path="/403" element={<Forbidden />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
