import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

// ============================================
// EVENT HOOKS (Admin)
// ============================================

// List monev events with filters
export function useMonevEvents() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });

  const fetchData = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (params.page) query.set('page', params.page);
      if (params.per_page) query.set('per_page', params.per_page);
      if (params.search) query.set('search', params.search);
      if (params.status) query.set('status', params.status);

      const res = await api.get(`/api/monev/events?${query.toString()}`);
      const result = res.data;
      setData(result.data || []);
      setPagination({
        current_page: result.current_page || 1,
        last_page: result.last_page || 1,
        total: result.total || 0,
        per_page: result.per_page || 15,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat data event monev');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, pagination, fetchData };
}

// Get single event detail
export function useMonevEventDetail(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/monev/events/${id}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Event tidak ditemukan');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  return { data, loading, error };
}

// Create event
export function useMonevEventCreate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/monev/events', payload);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Gagal membuat event monev';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

// Update event
export function useMonevEventUpdate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = async (id, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put(`/api/monev/events/${id}`, payload);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Gagal mengupdate event monev';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
}

// Delete event
export function useMonevEventDelete() {
  const [loading, setLoading] = useState(false);

  const remove = async (id) => {
    setLoading(true);
    try {
      await api.delete(`/api/monev/events/${id}`);
      return true;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Gagal menghapus event monev');
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading };
}

// ============================================
// MY EVENTS HOOK (Pemonev)
// ============================================

export function useMonevMyEvents() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/monev/my-events');
      setData(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat event monev');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ============================================
// SUBMISSION HOOKS (Pemonev)
// ============================================

// List submissions
export function useMonevSubmissions() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });

  const fetchData = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (params.page) query.set('page', params.page);
      if (params.per_page) query.set('per_page', params.per_page);
      if (params.event_id) query.set('event_id', params.event_id);
      if (params.search) query.set('search', params.search);
      if (params.cabor_id) query.set('cabor_id', params.cabor_id);
      if (params.created_by) query.set('created_by', params.created_by);

      const res = await api.get(`/api/monev/submissions?${query.toString()}`);
      const result = res.data;
      setData(result.data || []);
      setPagination({
        current_page: result.current_page || 1,
        last_page: result.last_page || 1,
        total: result.total || 0,
        per_page: result.per_page || 15,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat data submission');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, pagination, fetchData };
}

// Get single submission detail
export function useMonevSubmissionDetail(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/monev/submissions/${id}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Submission tidak ditemukan');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Create submission
export function useMonevSubmissionCreate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/monev/submissions', payload);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Gagal menyimpan monitoring';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

// Update submission
export function useMonevSubmissionUpdate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = async (id, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put(`/api/monev/submissions/${id}`, payload);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Gagal mengupdate monitoring';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
}

// Delete submission
export function useMonevSubmissionDelete() {
  const [loading, setLoading] = useState(false);

  const remove = async (id) => {
    setLoading(true);
    try {
      await api.delete(`/api/monev/submissions/${id}`);
      return true;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Gagal menghapus submission');
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading };
}

// ============================================
// HELPER HOOKS
// ============================================

export function useAssignableUsers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/monev/assignable-users')
      .then(r => setData(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
