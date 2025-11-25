import api from '@/lib/axios';
import { DashboardData, Medication, Exam, Appointment } from '@/types';

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const response = await api.get<DashboardData>('/dashboard');
    return response.data;
  },

  async getMedications(): Promise<Medication[]> {
    const response = await api.get<Medication[]>('/medications');
    return response.data;
  },

  async getExams(): Promise<Exam[]> {
    const response = await api.get<Exam[]>('/exams');
    return response.data;
  },

  async getAppointments(): Promise<Appointment[]> {
    const response = await api.get<Appointment[]>('/appointments');
    return response.data;
  },
};
