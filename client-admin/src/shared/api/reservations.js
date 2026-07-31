import { axiosAdmin } from './api';

const getPayloadData = (response) => response.data?.data ?? response.data ?? [];

export const getReservations = async (params = {}) => {
  const response = await axiosAdmin.get('/reservations', { params });
  return getPayloadData(response);
};

export const getPendingReservations = async () => {
  const response = await axiosAdmin.get('/reservations/pending');
  return getPayloadData(response);
};

export const getReservationById = async (id) => {
  const response = await axiosAdmin.get(`/reservations/${id}`);
  return getPayloadData(response);
};

export const confirmReservation = async (id) => {
  return await axiosAdmin.put(`/reservations/${id}/confirm`);
};

export const cancelReservation = async (id, cancelReason) => {
  return await axiosAdmin.put(`/reservations/${id}/cancel`, { cancelReason });
};
