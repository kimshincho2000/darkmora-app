import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'https://darkmora.uz';

export const toAbsoluteUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (path.startsWith('/')) {
    return `${BASE_URL}${path}`;
  }
  return `${BASE_URL}/${path}`;
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = await AsyncStorage.getItem('darkmora_token');
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers,
  });

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { ok: false, error: 'Server javobida xatolik', raw: text };
  }
};

export const api = {
  getHome: async () => {
    const res = await apiRequest('/api?action=home');
    return res?.data || { featured: [], trending: [], latest: [], topRated: [], top10: [] };
  },

  getCatalog: async ({ page = 1, genre = '', year = '', status = '', sort = 'popular', q = '' } = {}) => {
    const params = new URLSearchParams();
    params.set('action', 'catalog');
    if (page) params.set('page', String(page));
    if (genre) params.set('genre', genre);
    if (year) params.set('year', year);
    if (status) params.set('status', status);
    if (sort) params.set('sort', sort);
    if (q) params.set('q', q);

    const res = await apiRequest(`/api?${params.toString()}`);
    return res?.data || { items: [], total: 0, total_pages: 1 };
  },

  getGenres: async () => {
    const res = await apiRequest('/api?action=genres');
    return res?.data?.genres || [];
  },

  getAnimeDetail: async (slugOrId) => {
    const res = await apiRequest(`/api?action=anime&slug=${encodeURIComponent(slugOrId)}`);
    return res;
  },

  search: async (query) => {
    if (!query || query.trim().length === 0) return [];
    const res = await apiRequest(`/api?action=search&q=${encodeURIComponent(query.trim())}`);
    return res?.data?.items || res?.data || [];
  },

  login: async (username, password) => {
    const res = await apiRequest('/api?action=login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (res?.ok && res?.data?.token) {
      await AsyncStorage.setItem('darkmora_token', res.data.token);
    }
    return res;
  },

  register: async (username, email, password) => {
    const res = await apiRequest('/api?action=register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    if (res?.ok && res?.data?.token) {
      await AsyncStorage.setItem('darkmora_token', res.data.token);
    }
    return res;
  },

  getCurrentUser: async () => {
    const res = await apiRequest('/api?action=user');
    return res?.data?.user || null;
  },

  logout: async () => {
    await AsyncStorage.removeItem('darkmora_token');
  }
};
