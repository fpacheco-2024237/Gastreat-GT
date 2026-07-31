import { axiosAdmin } from './api';

const getPayloadData = (response) => response.data?.data ?? response.data ?? [];

export const getCategories = async (filters = {}) => {
  const response = await axiosAdmin.get('/categories', { params: filters });
  return getPayloadData(response);
};

export const createCategory = async (category) => {
  return await axiosAdmin.post('/categories', category);
};

export const updateCategory = async (id, category) => {
  return await axiosAdmin.put(`/categories/${id}`, category);
};

export const toggleCategoryStatus = async (id, status) => {
  return await axiosAdmin.patch(`/categories/${id}/status`, { status });
};

export const deleteCategory = async (id) => {
  return await axiosAdmin.delete(`/categories/${id}`);
};
