import api from './api';

class OffboardingService {
    async initiateExit(data) {
        const res = await api.post('/offboarding/initiate', data);
        return res;
    }

    async getAllExits() {
        const res = await api.get('/offboarding/exits');
        return res;
    }

    async getExitById(exitId) {
        const res = await api.get(`/offboarding/exits/${exitId}`);
        return res;
    }

    async getMyExit() {
        const res = await api.get('/offboarding/my-exit');
        return res;
    }

    async getExitClearances(exitId) {
        const res = await api.get(`/offboarding/exits/${exitId}/clearances`);
        return res;
    }

    async approveClearance(clearanceId, status, comments) {
        const res = await api.post(`/offboarding/clearances/${clearanceId}/approve`, { status, comments });
        return res;
    }

    async getInterview(exitId) {
        const res = await api.get(`/offboarding/exits/${exitId}/interview`);
        return res;
    }

    async saveInterview(exitId, data) {
        const res = await api.post(`/offboarding/exits/${exitId}/interview`, data);
        return res;
    }

    async getSettlement(exitId) {
        const res = await api.get(`/offboarding/exits/${exitId}/settlement`);
        return res;
    }

    async processSettlement(exitId, data) {
        const res = await api.post(`/offboarding/exits/${exitId}/settlement`, data);
        return res;
    }

    async completeExit(exitId) {
        const res = await api.post(`/offboarding/exits/${exitId}/complete`);
        return res;
    }

    async deleteExit(exitId) {
        const res = await api.delete(`/offboarding/exits/${exitId}`);
        return res;
    }
}

export default new OffboardingService();
