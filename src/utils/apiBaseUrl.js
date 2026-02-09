const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL?.trim();

const apiBaseUrl = configuredBackendUrl
    ? configuredBackendUrl.replace(/\/+$/, '')
    : '/api';

export default apiBaseUrl;
