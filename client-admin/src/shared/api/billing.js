import { axiosAdmin } from './api';

const getPayloadData = (response) => response.data?.data ?? response.data ?? [];

export const getBillingRecords = async () => {
  const response = await axiosAdmin.get('/billing');
  return getPayloadData(response);
};

export const getBillingByOrderId = async (orderId) => {
  const response = await axiosAdmin.get(`/billing/${orderId}`);
  return getPayloadData(response);
};

export const payBilling = async (payload) => {
  return await axiosAdmin.post('/billing/pay', payload);
};
