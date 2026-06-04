import { axiosAdmin } from './api';

const getPayloadData = (response) => response.data?.data ?? response.data ?? [];

export const getTables = async () => {
  const response = await axiosAdmin.get('/tables');
  return getPayloadData(response);
};

export const createTable = async (table) => {
  return await axiosAdmin.post('/tables', table);
};

export const updateTable = async (id, table) => {
  return await axiosAdmin.put(`/tables/${id}`, table);
};

export const toggleTableStatus = async (id, status) => {
  return await axiosAdmin.patch(`/tables/${id}/status`, { status });
};

export const deleteTable = async (id) => {
  return await axiosAdmin.delete(`/tables/${id}`);
};
