import { axiosAdmin } from './api';

const getPayloadData = (response) => response.data?.data ?? response.data ?? [];

export const getOrders = async () => {
  const response = await axiosAdmin.get('/orders');
  return getPayloadData(response);
};

export const getPendingOrders = async () => {
  const response = await axiosAdmin.get('/orders/pending');
  return getPayloadData(response);
};

export const updateOrderStatus = async (id, status) => {
  return await axiosAdmin.patch(`/orders/${id}/status`, { status });
};

export const cancelOrder = async (id) => {
  return await axiosAdmin.delete(`/orders/${id}`);
};
