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

  sendEmailCode: async (email) => {
    return await apiRequest('/api?action=send_email_code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  emailRegister: async ({ email, code, password, displayName, username }) => {
    const res = await apiRequest('/api?action=email_register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        code,
        password,
        display_name: displayName,
        username: username || (email ? email.split('@')[0] : ''),
      }),
    });
    if (res?.ok && res?.data?.token) {
      await AsyncStorage.setItem('darkmora_token', res.data.token);
    }
    return res;
  },

  initPhoneRegister: async ({ phone, username, password }) => {
    return await apiRequest('/api?action=init_phone_register', {
      method: 'POST',
      body: JSON.stringify({ phone, username, password }),
    });
  },

  checkPhoneStatus: async (token) => {
    return await apiRequest(`/api?action=check_phone_status&token=${encodeURIComponent(token)}`);
  },

  verifyPhoneRegister: async ({ token, code }) => {
    const res = await apiRequest('/api?action=verify_phone_register', {
      method: 'POST',
      body: JSON.stringify({ token, code }),
    });
    if (res?.ok && res?.data?.token) {
      await AsyncStorage.setItem('darkmora_token', res.data.token);
    }
    return res;
  },

  sendResetCode: async (identifier) => {
    return await apiRequest('/api?action=send_reset_code', {
      method: 'POST',
      body: JSON.stringify({ identifier, email: identifier, phone: identifier }),
    });
  },

  resetPassword: async ({ identifier, code, newPassword, token }) => {
    return await apiRequest('/api?action=reset_password', {
      method: 'POST',
      body: JSON.stringify({
        identifier,
        email: identifier,
        phone: identifier,
        code,
        password: newPassword,
        new_password: newPassword,
        token,
      }),
    });
  },

  updateProfile: async ({ displayName, photoUrl, photoBase64, password }) => {
    const body = {};
    if (displayName !== undefined) body.display_name = displayName;
    if (photoUrl !== undefined) body.photo_url = photoUrl;
    if (photoBase64 !== undefined) body.photo_base64 = photoBase64;
    if (password) body.new_password = password;

    return await apiRequest('/api?action=update_profile', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getCurrentUser: async () => {
    const res = await apiRequest('/api?action=user');
    return res?.data?.user || null;
  },

  getAppConfig: async () => {
    return await apiRequest('/api?action=get_config');
  },

  logout: async () => {
    await AsyncStorage.removeItem('darkmora_token');
  }
};
