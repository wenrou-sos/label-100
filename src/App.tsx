import { Navigate, Route, Routes } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { AppLayout } from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import MatronsList from '@/pages/MatronsList';
import MatronDetail from '@/pages/MatronDetail';
import CustomersList from '@/pages/CustomersList';
import CustomerDetail from '@/pages/CustomerDetail';
import OrderForm from '@/pages/OrderForm';
import OrdersList from '@/pages/OrdersList';
import Matching from '@/pages/Matching';
import ContractsList from '@/pages/ContractsList';
import ContractDetail from '@/pages/ContractDetail';
import Payments from '@/pages/Payments';
import Interviews from '@/pages/Interviews';
import ServiceProgress from '@/pages/ServiceProgress';
import Checkin from '@/pages/Checkin';
import ScheduleCalendar from '@/pages/ScheduleCalendar';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/matrons" element={<MatronsList />} />
        <Route path="/matrons/:id" element={<MatronDetail />} />
        <Route path="/customers" element={<CustomersList />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/schedule" element={<ScheduleCalendar />} />
        <Route path="/orders" element={<OrdersList />} />
        <Route path="/orders/new" element={<OrderForm />} />
        <Route path="/matching/:orderId" element={<Matching />} />
        <Route path="/contracts" element={<ContractsList />} />
        <Route path="/contracts/:orderId" element={<ContractDetail />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/interviews" element={<Interviews />} />
        <Route path="/service/:orderId" element={<ServiceProgress />} />
        <Route path="/checkin" element={<Checkin />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function NotFound() {
  return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Typography variant="h2">404</Typography>
      <Typography color="text.secondary">页面不存在</Typography>
    </Box>
  );
}
