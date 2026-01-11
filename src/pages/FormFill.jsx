import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Save,
  Loader2,
  User,
  CheckCircle
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import api from '../api/axios';

export function FormFillPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState(null);
  const [referenceOptions, setReferenceOptions] = useState([]);
  const [selectedReference, setSelectedReference] = useState('');
  const [referenceData, setReferenceData] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/form-builder/templates/${id}`);
      setTemplate(res.data);

      // Fetch reference options if template has reference model
      if (res.data.reference_model) {
        try {
          const recordsRes = await api.get(`/api/form-builder/models/${res.data.reference_model}/records`);
          setReferenceOptions(recordsRes.data || []);
        } catch (err) {
          console.error('Failed to fetch reference records:', err);
        }
      }
    } catch (error) {
      console.error('Failed to fetch template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReferenceChange = async (refId) => {
    setSelectedReference(refId);
    if (!refId) {
      setReferenceData(null);
      // Clear only model_reference fields that match template.reference_model
      const newValues = { ...formValues };
      template?.sections.forEach(section => {
        section.fields.forEach(field => {
          if (field.type === 'model_reference') {
            // Only clear if field has no specific source model, or matches template's reference_model
            const fieldSourceModel = field.data_source_model || template.reference_model;
            if (!field.data_source_model || field.data_source_model === template.reference_model) {
              delete newValues[field.id];
            }
          }
        });
      });
      setFormValues(newValues);
      return;
    }

    try {
      const res = await api.get(`/api/form-builder/templates/${id}/reference/${refId}`);
      setReferenceData(res.data);

      // Auto-populate ONLY model_reference fields that:
      // 1. Have no specific data_source_model (inherit from template.reference_model)
      // 2. OR have data_source_model matching template.reference_model
      const newValues = { ...formValues };
      template.sections.forEach(section => {
        section.fields.forEach(field => {
          if (field.type === 'model_reference') {
            // Skip fields that have a different data_source_model
            if (field.data_source_model && field.data_source_model !== template.reference_model) {
              return; // Don't auto-fill this field from the global reference
            }
            
            // Use field.reference_field if configured, otherwise use field.name
            const refField = field.reference_field || field.name;
            if (res.data[refField] !== undefined) {
              newValues[field.id] = res.data[refField];
            }
          }
        });
      });
      setFormValues(newValues);
    } catch (error) {
      console.error('Failed to fetch reference data:', error);
    }
  };

  const updateValue = (fieldId, value) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
  };

  // Calculate computed fields
  const computedValues = useMemo(() => {
    const computed = {};
    if (!template) return computed;

    template.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.type === 'calculated' && field.calculation_formula) {
          try {
            // Replace field names with actual values
            let formula = field.calculation_formula;
            (field.calculation_dependencies || []).forEach(dep => {
              const depField = template.sections
                .flatMap(s => s.fields)
                .find(f => f.name === dep);
              if (depField) {
                const value = formValues[depField.id] || referenceData?.[dep] || 0;
                formula = formula.replace(new RegExp(dep, 'g'), value);
              }
            });
            // Safely evaluate
            const result = Function('"use strict"; return (' + formula + ')')();
            computed[field.id] = isNaN(result) ? 0 : result.toFixed(2);
          } catch (e) {
            computed[field.id] = 'Error';
          }
        }
      });
    });

    return computed;
  }, [template, formValues, referenceData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const values = [];
      template.sections.forEach(section => {
        section.fields.forEach(field => {
          let value = formValues[field.id];
          if (field.type === 'calculated') {
            value = computedValues[field.id];
          }
          values.push({
            field_id: field.id,
            value: value ?? '',
          });
        });
      });

      await api.post(`/api/form-builder/templates/${id}/submissions`, {
        reference_id: selectedReference || null,
        values,
      });

      setSuccess(true);
      setTimeout(() => navigate('/form-builder'), 1500);
    } catch (error) {
      console.error('Failed to submit form:', error);
      alert('Gagal submit form: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (success) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4"
          >
            <CheckCircle className="w-10 h-10 text-green-600" />
          </motion.div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Form Berhasil Disimpan!</h2>
          <p className="text-slate-500">Mengalihkan ke halaman form builder...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/form-builder')}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{template?.name}</h1>
                <p className="text-slate-500 mt-1">{template?.description || 'Isi formulir'}</p>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'Menyimpan...' : 'Submit'}
            </button>
          </div>

          {/* Reference Selector - Single dropdown for selecting the reference record */}
          {template?.reference_model && referenceOptions.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Pilih {template.reference_model.charAt(0).toUpperCase() + template.reference_model.slice(1)}
              </label>
              <select
                value={selectedReference}
                onChange={(e) => handleReferenceChange(e.target.value)}
                className="w-full md:w-1/2 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
              >
                <option value="">-- Pilih --</option>
                {referenceOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name || opt.title || opt.label || `ID: ${opt.id}`}
                  </option>
                ))}
              </select>
              {selectedReference && referenceData && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ Data {template.reference_model} berhasil dimuat
                </p>
              )}
            </div>
          )}

          {/* Sections */}
          {template?.sections.map((section, sectionIndex) => (
            <div key={section.id || sectionIndex} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800">{section.title}</h2>
              </div>

              {section.type === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Komponen</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Teknik</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Skor</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Kategori</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {section.fields.map((field, fieldIndex) => (
                        <tr key={field.id || fieldIndex}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">{field.group_label}</div>
                            <div className="text-sm text-slate-500">{field.sub_label}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 italic">{field.technique}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={formValues[field.id] || ''}
                                onChange={(e) => updateValue(field.id, e.target.value)}
                                className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                placeholder="..."
                              />
                              {field.unit && <span className="text-sm text-slate-500">{field.unit}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {/* Category will be auto-calculated on backend */}
                            <span className="text-slate-400">Auto</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {section.fields.map((field, fieldIndex) => (
                    <div key={field.id || fieldIndex}>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {field.label}
                        {field.is_required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderField(field, formValues, computedValues, referenceData, updateValue, template)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </form>
    </DashboardLayout>
  );
}

function renderField(field, formValues, computedValues, referenceData, updateValue, template) {
  const value = formValues[field.id] || '';

  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          value={value}
          onChange={(e) => updateValue(field.id, e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none"
          rows={3}
          placeholder={field.placeholder}
          required={field.is_required}
        />
      );

    case 'number':
      return (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => updateValue(field.id, e.target.value)}
            className="w-full md:w-1/3 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
            placeholder={field.placeholder}
            required={field.is_required}
          />
          {field.unit && <span className="text-sm text-slate-500">{field.unit}</span>}
        </div>
      );

    case 'date':
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => updateValue(field.id, e.target.value)}
          className="w-full md:w-1/3 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
          required={field.is_required}
        />
      );

    case 'select':
      const selectOptions = field.options_data || field.options || [];
      return (
        <select
          value={value}
          onChange={(e) => updateValue(field.id, e.target.value)}
          className="w-full md:w-1/2 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
          required={field.is_required}
        >
          <option value="">-- Pilih --</option>
          {selectOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );

    case 'radio':
      const radioOptions = field.options_data || field.options || [];
      return (
        <div className="flex flex-wrap gap-4">
          {radioOptions.map(opt => (
            <label key={opt.value} className="flex items-center gap-2">
              <input
                type="radio"
                name={`field_${field.id}`}
                value={opt.value}
                checked={value === opt.value}
                onChange={(e) => updateValue(field.id, e.target.value)}
                className="w-4 h-4 accent-red-600"
                required={field.is_required}
              />
              <span className="text-sm text-slate-700">{opt.label}</span>
            </label>
          ))}
        </div>
      );

    case 'checkbox':
      const checkboxOptions = field.options_data || field.options || [];
      const checkedValues = Array.isArray(value) ? value : (value ? [value] : []);
      return (
        <div className="flex flex-wrap gap-4">
          {checkboxOptions.map(opt => (
            <label key={opt.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                value={opt.value}
                checked={checkedValues.includes(opt.value)}
                onChange={(e) => {
                  let newValues;
                  if (e.target.checked) {
                    newValues = [...checkedValues, opt.value];
                  } else {
                    newValues = checkedValues.filter(v => v !== opt.value);
                  }
                  updateValue(field.id, newValues);
                }}
                className="w-4 h-4 accent-red-600"
              />
              <span className="text-sm text-slate-700">{opt.label}</span>
            </label>
          ))}
        </div>
      );

    case 'model_reference':
      // Check if this field has a different source model than the template's reference_model
      const hasOwnSourceModel = field.data_source_model && field.data_source_model !== template?.reference_model;
      
      if (hasOwnSourceModel) {
        // Field has its own source model - show as dropdown with ModelReferenceField
        return (
          <ModelReferenceField 
            field={field} 
            value={value}
            onChange={(val) => updateValue(field.id, val)}
          />
        );
      }
      
      // Field uses template's reference_model - show as readonly auto-filled value
      return (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value || ''}
            readOnly
            className="w-full md:w-1/2 px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-600 outline-none"
            placeholder="Pilih referensi di atas..."
          />
          {field.unit && <span className="text-sm text-slate-500">{field.unit}</span>}
        </div>
      );

    case 'calculated':
      return (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={computedValues[field.id] || ''}
            readOnly
            className="w-full md:w-1/3 px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-600 outline-none"
          />
          {field.unit && <span className="text-sm text-slate-500">{field.unit}</span>}
        </div>
      );

    default:
      return (
        <input
          type={field.type === 'email' ? 'email' : 'text'}
          value={value}
          onChange={(e) => updateValue(field.id, e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
          placeholder={field.placeholder}
          required={field.is_required}
        />
      );
  }
}

// Component for model_reference fields - allows selecting a record and auto-filling value
function ModelReferenceField({ field, value, onChange, fallbackModel }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState('');

  // Use field's data_source_model or fallback to template's reference_model
  const sourceModel = field.data_source_model || fallbackModel;

  useEffect(() => {
    if (sourceModel) {
      fetchOptions();
    }
  }, [sourceModel]);

  const fetchOptions = async () => {
    if (!sourceModel) return;
    setLoading(true);
    try {
      // Fetch all records from the model
      const res = await api.get(`/api/form-builder/models/${sourceModel}/records`);
      setOptions(res.data || []);
    } catch (error) {
      console.error('Failed to fetch model records:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordSelect = (recordId) => {
    setSelectedRecordId(recordId);
    
    if (!recordId) {
      onChange('');
      return;
    }

    // Find the selected record and extract the reference field value
    const record = options.find(r => String(r.id) === String(recordId));
    // Use field.reference_field or fallback to field.name
    const refField = field.reference_field || field.name;
    if (record && refField) {
      const fieldValue = record[refField];
      onChange(fieldValue ?? '');
    }
  };

  if (!sourceModel) {
    return <p className="text-sm text-slate-400 italic">Model belum dikonfigurasi</p>;
  }

  return (
    <div className="space-y-2">
      {/* Record selector */}
      <div className="flex items-center gap-3">
        <select
          value={selectedRecordId}
          onChange={(e) => handleRecordSelect(e.target.value)}
          disabled={field.is_readonly}
          className="w-full md:w-1/2 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
        >
          <option value="">{loading ? 'Loading...' : `-- Pilih ${sourceModel} --`}</option>
          {options.map(opt => (
            <option key={opt.id} value={opt.id}>
              {opt.name || opt.title || opt.label || `ID: ${opt.id}`}
            </option>
          ))}
        </select>
      </div>
      
      {/* Auto-filled value display */}
      {value !== undefined && value !== '' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Nilai:</span>
          <span className={`px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm ${
            field.is_readonly ? 'text-slate-600' : 'text-slate-800'
          }`}>
            {value}
            {field.unit && <span className="text-slate-400 ml-1">{field.unit}</span>}
          </span>
        </div>
      )}
    </div>
  );
}
