import { axiosAdmin } from './api';

const getPayloadData = (response) => response.data?.data ?? response.data ?? [];

export const getBillingRecords = async (params = {}) => {
  const response = await axiosAdmin.get('/billing', { params });
  return getPayloadData(response);
};

export const getInvoiceById = async (id) => {
  const response = await axiosAdmin.get(`/billing/${id}`);
  return getPayloadData(response);
};

export const createInvoice = async (orderId) => {
  const response = await axiosAdmin.post('/billing', { orderId });
  return getPayloadData(response);
};

export const payInvoice = async (id, paymentMethod) => {
  const response = await axiosAdmin.patch(`/billing/${id}/pay`, { paymentMethod });
  return getPayloadData(response);
};

export const voidInvoice = async (id, reason) => {
  const response = await axiosAdmin.patch(`/billing/${id}/void`, { reason });
  return getPayloadData(response);
};
