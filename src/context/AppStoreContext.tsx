import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Snackbar, type AlertColor } from '@mui/material';
import { matronApi, orderApi, contractApi, paymentApi, interviewApi } from '@/services/api';
import type { Contract, Interview, Matron, Order, Payment } from '@/types';

interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface AppStoreValue {
  matrons: Matron[];
  orders: Order[];
  contracts: Contract[];
  payments: Payment[];
  interviews: Interview[];
  loading: boolean;
  refreshMatrons: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshContracts: () => Promise<void>;
  refreshPayments: () => Promise<void>;
  refreshInterviews: () => Promise<void>;
  refreshAll: () => Promise<void>;
  notify: (message: string, severity?: AlertColor) => void;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [matrons, setMatrons] = useState<Matron[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>({ open: false, message: '', severity: 'success' });

  const refreshMatrons = useCallback(async () => {
    const res = await matronApi.list();
    setMatrons(res.data);
  }, []);
  const refreshOrders = useCallback(async () => {
    const res = await orderApi.list();
    setOrders(res.data);
  }, []);
  const refreshContracts = useCallback(async () => {
    const res = await contractApi.list();
    setContracts(res.data);
  }, []);
  const refreshPayments = useCallback(async () => {
    const res = await paymentApi.list();
    setPayments(res.data);
  }, []);
  const refreshInterviews = useCallback(async () => {
    const res = await interviewApi.list();
    setInterviews(res.data);
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshMatrons(), refreshOrders(), refreshContracts(), refreshPayments(), refreshInterviews()]);
  }, [refreshMatrons, refreshOrders, refreshContracts, refreshPayments, refreshInterviews]);

  const notify = useCallback((message: string, severity: AlertColor = 'success') => {
    setToast({ open: true, message, severity });
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshAll();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => setToast((t) => ({ ...t, open: false }));

  const value: AppStoreValue = {
    matrons,
    orders,
    contracts,
    payments,
    interviews,
    loading,
    refreshMatrons,
    refreshOrders,
    refreshContracts,
    refreshPayments,
    refreshInterviews,
    refreshAll,
    notify,
  };

  return (
    <AppStoreContext.Provider value={value}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={3200}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={toast.severity} variant="filled" sx={{ borderRadius: 2, boxShadow: 6 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </AppStoreContext.Provider>
  );
}

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore 必须在 AppStoreProvider 内使用');
  return ctx;
}
