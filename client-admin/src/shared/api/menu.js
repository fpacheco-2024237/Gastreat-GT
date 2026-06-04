import { axiosAdmin } from './api';

const getPayloadData = (response) => response.data?.data ?? response.data ?? [];

export const getMenuItems = async (filters = {}) => {
  const response = await axiosAdmin.get('/menu', { params: filters });
  return getPayloadData(response);
};

export const createMenuItem = async (menuItem) => {
  const formData = new FormData();
  Object.entries(menuItem).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  return await axiosAdmin.post('/menu', formData);
};

export const updateMenuItem = async (id, menuItem) => {
  const formData = new FormData();
  Object.entries(menuItem).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  return await axiosAdmin.put(`/menu/${id}`, formData);
};

export const toggleMenuItemStatus = async (id, status) => {
  return await axiosAdmin.patch(`/menu/${id}/status`, { status });
};

export const deleteMenuItem = async (id) => {
  return await axiosAdmin.delete(`/menu/${id}`);
};
