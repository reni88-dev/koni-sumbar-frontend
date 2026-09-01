import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../api/axios';

const STORED_IDS = {
  province: '__stored_province__',
  city: '__stored_city__',
  district: '__stored_district__',
  village: '__stored_village__'
};

const MANUAL_VILLAGE_ID = '__manual_village__';

function createStatus() {
  return {
    province: { loading: false, error: '' },
    city: { loading: false, error: '' },
    district: { loading: false, error: '' },
    village: { loading: false, error: '' }
  };
}

function normalizeName(value) {
  return String(value || '').trim().toLocaleLowerCase('id-ID');
}

function normalizeOptions(data) {
  if (!Array.isArray(data)) return [];
  return data
    .filter((item) => item && item.id !== undefined && item.name)
    .map((item) => ({ id: String(item.id), name: String(item.name).trim() }));
}

function resolveSelectedId(options, storedName, storedId) {
  const normalizedStoredName = normalizeName(storedName);
  if (!normalizedStoredName) return '';
  const match = options.find((option) => normalizeName(option.name) === normalizedStoredName);
  return match?.id || storedId;
}

function isEmsifaId(value) {
  return Boolean(value) && !String(value).startsWith('__');
}

function findOptionName(options, id) {
  return options.find((option) => option.id === id)?.name || '';
}

export function useRegionCascade({ values, onChange, allowManualVillage = false }) {
  const controllersRef = useRef({});
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [selected, setSelected] = useState({
    province: '',
    city: '',
    district: '',
    village: ''
  });
  const [status, setStatus] = useState(createStatus);

  const abortLevel = useCallback((level) => {
    controllersRef.current[level]?.abort();
    delete controllersRef.current[level];
  }, []);

  const abortAll = useCallback(() => {
    Object.keys(controllersRef.current).forEach(abortLevel);
  }, [abortLevel]);

  const resetLevel = useCallback((level, setOptions) => {
    abortLevel(level);
    setOptions([]);
    setStatus((previous) => ({
      ...previous,
      [level]: { loading: false, error: '' }
    }));
  }, [abortLevel]);

  const loadOptions = useCallback(async (level, path, setOptions) => {
    abortLevel(level);
    const controller = new AbortController();
    controllersRef.current[level] = controller;
    setOptions([]);
    setStatus((previous) => ({
      ...previous,
      [level]: { loading: true, error: '' }
    }));

    try {
      const response = await api.get(path, { signal: controller.signal });
      if (!controller.signal.aborted) {
        setOptions(normalizeOptions(response.data));
      }
    } catch (error) {
      if (controller.signal.aborted || error.code === 'ERR_CANCELED') return;
      setOptions([]);
      setStatus((previous) => ({
        ...previous,
        [level]: { loading: false, error: 'Gagal memuat data wilayah dari EMSIFA.' }
      }));
    } finally {
      if (controllersRef.current[level] === controller) {
        delete controllersRef.current[level];
        setStatus((previous) => ({
          ...previous,
          [level]: { ...previous[level], loading: false }
        }));
      }
    }
  }, [abortLevel]);

  const loadProvinces = useCallback(() => {
    loadOptions('province', '/api/wilayah/provinces.json', setProvinces);
  }, [loadOptions]);
  const loadCities = useCallback((provinceId) => {
    loadOptions('city', `/api/wilayah/regencies/${provinceId}.json`, setCities);
  }, [loadOptions]);
  const loadDistricts = useCallback((cityId) => {
    loadOptions('district', `/api/wilayah/districts/${cityId}.json`, setDistricts);
  }, [loadOptions]);
  const loadVillages = useCallback((districtId) => {
    loadOptions('village', `/api/wilayah/villages/${districtId}.json`, setVillages);
  }, [loadOptions]);

  useEffect(() => {
    loadProvinces();
    return abortAll;
  }, [abortAll, loadProvinces]);

  useEffect(() => {
    setSelected((previous) => ({
      ...previous,
      province: resolveSelectedId(provinces, values.province, STORED_IDS.province)
    }));
  }, [provinces, values.province]);

  useEffect(() => {
    setSelected((previous) => ({
      ...previous,
      city: resolveSelectedId(cities, values.city, STORED_IDS.city)
    }));
  }, [cities, values.city]);

  useEffect(() => {
    setSelected((previous) => ({
      ...previous,
      district: resolveSelectedId(districts, values.district, STORED_IDS.district)
    }));
  }, [districts, values.district]);

  useEffect(() => {
    setSelected((previous) => {
      if (allowManualVillage && previous.village === MANUAL_VILLAGE_ID && !values.village) {
        return previous;
      }
      return {
        ...previous,
        village: resolveSelectedId(
          villages,
          values.village,
          allowManualVillage ? MANUAL_VILLAGE_ID : STORED_IDS.village
        )
      };
    });
  }, [allowManualVillage, values.village, villages]);

  useEffect(() => {
    if (!isEmsifaId(selected.province)) {
      resetLevel('city', setCities);
      return undefined;
    }
    loadCities(selected.province);
    return () => abortLevel('city');
  }, [abortLevel, loadCities, resetLevel, selected.province]);

  useEffect(() => {
    if (!isEmsifaId(selected.city)) {
      resetLevel('district', setDistricts);
      return undefined;
    }
    loadDistricts(selected.city);
    return () => abortLevel('district');
  }, [abortLevel, loadDistricts, resetLevel, selected.city]);

  useEffect(() => {
    if (!isEmsifaId(selected.district)) {
      resetLevel('village', setVillages);
      return undefined;
    }
    loadVillages(selected.district);
    return () => abortLevel('village');
  }, [abortLevel, loadVillages, resetLevel, selected.district]);

  const clearDescendants = useCallback((level) => {
    if (level === 'province') {
      onChange('city', '');
      onChange('district', '');
      onChange('village', '');
      setSelected((previous) => ({ ...previous, city: '', district: '', village: '' }));
      resetLevel('city', setCities);
      resetLevel('district', setDistricts);
      resetLevel('village', setVillages);
    } else if (level === 'city') {
      onChange('district', '');
      onChange('village', '');
      setSelected((previous) => ({ ...previous, district: '', village: '' }));
      resetLevel('district', setDistricts);
      resetLevel('village', setVillages);
    } else if (level === 'district') {
      onChange('village', '');
      setSelected((previous) => ({ ...previous, village: '' }));
      resetLevel('village', setVillages);
    }
  }, [onChange, resetLevel]);

  const changeProvince = useCallback((id) => {
    if (id === STORED_IDS.province) return;
    setSelected((previous) => ({ ...previous, province: id }));
    onChange('province', findOptionName(provinces, id));
    clearDescendants('province');
  }, [clearDescendants, onChange, provinces]);

  const changeCity = useCallback((id) => {
    if (id === STORED_IDS.city) return;
    setSelected((previous) => ({ ...previous, city: id }));
    onChange('city', findOptionName(cities, id));
    clearDescendants('city');
  }, [cities, clearDescendants, onChange]);

  const changeDistrict = useCallback((id) => {
    if (id === STORED_IDS.district) return;
    setSelected((previous) => ({ ...previous, district: id }));
    onChange('district', findOptionName(districts, id));
    clearDescendants('district');
  }, [clearDescendants, districts, onChange]);

  const changeVillage = useCallback((id) => {
    if (id === STORED_IDS.village) return;
    setSelected((previous) => ({ ...previous, village: id }));
    if (allowManualVillage && id === MANUAL_VILLAGE_ID) {
      onChange('village', '');
      return;
    }
    onChange('village', findOptionName(villages, id));
  }, [allowManualVillage, onChange, villages]);
  const changeManualVillage = useCallback((value) => {
    onChange('village', value);
  }, [onChange]);

  const retryCity = useCallback(() => {
    if (isEmsifaId(selected.province)) loadCities(selected.province);
  }, [loadCities, selected.province]);
  const retryDistrict = useCallback(() => {
    if (isEmsifaId(selected.city)) loadDistricts(selected.city);
  }, [loadDistricts, selected.city]);
  const retryVillage = useCallback(() => {
    if (isEmsifaId(selected.district)) loadVillages(selected.district);
  }, [loadVillages, selected.district]);

  return {
    province: {
      value: selected.province,
      storedValue: values.province,
      storedOnly: selected.province === STORED_IDS.province,
      storedId: STORED_IDS.province,
      options: provinces,
      status: status.province,
      disabled: status.province.loading || provinces.length === 0,
      onChange: changeProvince,
      onRetry: loadProvinces
    },
    city: {
      value: selected.city,
      storedValue: values.city,
      storedOnly: selected.city === STORED_IDS.city,
      storedId: STORED_IDS.city,
      options: cities,
      status: status.city,
      disabled: !isEmsifaId(selected.province) || status.city.loading || cities.length === 0,
      onChange: changeCity,
      onRetry: retryCity
    },
    district: {
      value: selected.district,
      storedValue: values.district,
      storedOnly: selected.district === STORED_IDS.district,
      storedId: STORED_IDS.district,
      options: districts,
      status: status.district,
      disabled: !isEmsifaId(selected.city) || status.district.loading || districts.length === 0,
      onChange: changeDistrict,
      onRetry: retryDistrict
    },
    village: {
      value: selected.village,
      storedValue: values.village,
      storedOnly: selected.village === STORED_IDS.village,
      storedId: STORED_IDS.village,
      options: villages,
      status: status.village,
      disabled: !isEmsifaId(selected.district) ||
        status.village.loading ||
        (!allowManualVillage && villages.length === 0),
      allowManual: allowManualVillage,
      manual: selected.village === MANUAL_VILLAGE_ID,
      manualId: MANUAL_VILLAGE_ID,
      manualValue: values.village || '',
      onChange: changeVillage,
      onManualChange: changeManualVillage,
      onRetry: retryVillage
    }
  };
}
