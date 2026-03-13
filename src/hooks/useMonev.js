import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

// List monev entries with filters
export function useMonevList() {
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
      if (params.cabor_id) query.set('cabor_id', params.cabor_id);
      if (params.venue_id) query.set('venue_id', params.venue_id);
      if (params.created_by) query.set('created_by', params.created_by);
      if (params.date_from) query.set('date_from', params.date_from);
      if (params.date_to) query.set('date_to', params.date_to);

      const res = await api.get(`/api/monev?${query.toString()}`);
      const result = res.data?.data ? res.data : res.data;
      setData(result.data || []);
      setPagination({
        current_page: result.current_page || 1,
        last_page: result.last_page || 1,
        total: result.total || 0,
        per_page: result.per_page || 15,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat data monitoring');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, pagination, fetchData };
}

// Get single monev entry
export function useMonevDetail(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/monev/${id}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Data tidak ditemukan');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  return { data, loading, error };
}

// Create monev entry
export function useMonevCreate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/monev', formData);
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

// Update monev entry
export function useMonevUpdate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = async (id, formData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put(`/api/monev/${id}`, formData);
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

// Delete monev entry
export function useMonevDelete() {
  const [loading, setLoading] = useState(false);

  const remove = async (id) => {
    setLoading(true);
    try {
      await api.delete(`/api/monev/${id}`);
      return true;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Gagal menghapus monitoring');
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading };
}
