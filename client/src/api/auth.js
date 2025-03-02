import axios from './axios';

export const registerRequest = async (user) =>
  axios.post(`api/auth/register`, user);

export const loginRequest = async (user) => axios.post(`/api/auth/login`, user);

export const verifyTokenRequest = async () => {
  return axios.get(`/api/auth/verify`);
};
