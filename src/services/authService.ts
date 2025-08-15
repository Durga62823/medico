import { authAPI } from './api';
import type { LoginPayload, SignupPayload, AuthResponse } from './api';

export const signIn = async (data: LoginPayload): Promise<AuthResponse> => {
  const res = await authAPI.login(data);
  const { token, user } = res.data;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  return res.data;
};

export const signUp = async (data: SignupPayload): Promise<AuthResponse> => {
  const res = await authAPI.signup(data);
  const { token, user } = res.data;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  return res.data;
};
