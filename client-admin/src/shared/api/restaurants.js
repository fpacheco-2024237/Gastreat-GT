import { axiosAdmin } from './api';

export const getRestaurants = async () => {
  return await axiosAdmin.get('/restaurants');
};

export const createRestaurant = async (data) => {
  return await axiosAdmin.post('/restaurants', data);
};

export const updateRestaurant = async (id, data) => {
  return await axiosAdmin.patch(`/restaurants/${id}`, data);
};

export const deleteRestaurant = async (id) => {
  return await axiosAdmin.delete(`/restaurants/${id}`);
};
