import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  GripVertical,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  Settings,
  Type,
  Hash,
  Calendar,
  List,
  CheckSquare,
  FileText,
  Calculator,
  Link as LinkIcon
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import api from '../api/axios';

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'textarea', label: 'Text Area', icon: FileText },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'email', label: 'Email', icon: Type },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'select', label: 'Dropdown', icon: List },
  { value: 'radio', label: 'Radio', icon: CheckSquare },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'model_reference', label: 'Auto-fill dari Model', icon: LinkIcon },
  { value: 'calculated', label: 'Calculated', icon: Calculator },
];

const SECTION_TYPES = [
  { value: 'normal', label: 'Normal' },
  { value: 'table', label: 'Table' },
];

export function FormBuilderCreatePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [modelFields, setModelFields] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    reference_model: '',
    reference_display_field: 'name',
    is_active: true,
    sections: [
      {
        title: 'Section 1',
        type: 'normal',
        table_columns: [],
        fields: []
      }
    ]
  });

  const [expandedSections, setExpandedSections] = useState([0]);
  const [expandedFields, setExpandedFields] = useState({});

  useEffect(() => {
    fetchAvailableModels();
    if (isEdit) {
      fetchTemplate();
    }
  }, [id]);

  // Auto-fetch reference model fields when reference_model changes
  useEffect(() => {
    if (formData.reference_model && !modelFields[formData.reference_model]) {
      fetchModelFields(formData.reference_model);
    }
  }, [formData.reference_model]);

  const fetchAvailableModels = async () => {
    try {
      const res = await api.get('/api/form-builder/models');
      setAvailableModels(res.data);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  const fetchModelFields = async (model) => {
    if (!model) return [];
    if (modelFields[model]) return modelFields[model];
    
    try {
      const res = await api.get(`/api/form-builder/models/${model}/fields`);
      const fields = res.data || [];
      setModelFields(prev => ({ ...prev, [model]: fields }));
      return fields;
    } catch (error) {
      console.error('Failed to fetch model fields:', error);
      return [];
    }
  };

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/form-builder/templates/${id}`);
      const template = res.data;
      
      setFormData({
        name: template.name,
        description: template.description || '',
        reference_model: template.reference_model || '',
        reference_display_field: template.reference_display_field || 'name',
        is_active: template.is_active,
        sections: template.sections.map(section => ({
          id: section.id,
          title: section.title,
          type: section.type,
          table_columns: section.table_columns || [],
          fields: section.fields.map(field => ({
            id: field.id,
            label: field.label,
            name: field.name,
            placeholder: field.placeholder || '',
            type: field.type,
            group_label: field.group_label || '',
            sub_label: field.sub_label || '',
            technique: field.technique || '',
            unit: field.unit || '',
            is_required: field.is_required,
            data_source_type: field.data_source_type || '',
            data_source_model: field.data_source_model || '',
            data_source_value_field: field.data_source_value_field || 'id',
            data_source_label_field: field.data_source_label_field || 'name',
            reference_field: field.reference_field || '',
            linked_to_reference_field: field.linked_to_reference_field || '',
            is_readonly: field.is_readonly || false,
            calculation_formula: field.calculation_formula || '',
            calculation_dependencies: field.calculation_dependencies || [],
            has_grading: field.has_grading || false,
            options: field.options || [],
            grading_rules: field.grading_rules || [],
          }))
        }))
      });

      setExpandedSections(template.sections.map((_, i) => i));
    } catch (error) {
      console.error('Failed to fetch template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEdit) {
        await api.put(`/api/form-builder/templates/${id}`, formData);
      } else {
        await api.post('/api/form-builder/templates', formData);
      }
      navigate('/form-builder');
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Gagal menyimpan form: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  // Section handlers
  const addSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          title: `Section ${prev.sections.length + 1}`,
          type: 'normal',
          table_columns: [],
          fields: []
        }
      ]
    }));
    setExpandedSections(prev => [...prev, formData.sections.length]);
  };

  const removeSection = (index) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  const updateSection = (index, updates) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === index ? { ...section, ...updates } : section
      )
    }));
  };

  // Field handlers
  const addField = (sectionIndex) => {
    const newField = {
      label: '',
      name: '',
      placeholder: '',
      type: 'text',
      group_label: '',
      sub_label: '',
      technique: '',
      unit: '',
      is_required: false,
      data_source_type: '',
      data_source_model: '',
      data_source_value_field: 'id',
      data_source_label_field: 'name',
      reference_field: '',
      linked_to_reference_field: '',
      is_readonly: false,
      calculation_formula: '',
      calculation_dependencies: [],
      has_grading: false,
      options: [],
      grading_rules: [],
    };

    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? { ...section, fields: [...section.fields, newField] }
          : section
      )
    }));

    // Expand the new field
    const fieldKey = `${sectionIndex}-${formData.sections[sectionIndex].fields.length}`;
    setExpandedFields(prev => ({ ...prev, [fieldKey]: true }));
  };

  const removeField = (sectionIndex, fieldIndex) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? { ...section, fields: section.fields.filter((_, fi) => fi !== fieldIndex) }
          : section
      )
    }));
  };

  const updateField = (sectionIndex, fieldIndex, updates) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, si) => 
        si === sectionIndex 
          ? {
              ...section,
              fields: section.fields.map((field, fi) => 
                fi === fieldIndex ? { ...field, ...updates } : field
              )
            }
          : section
      )
    }));
  };

  // Toggle section expand
  const toggleSection = (index) => {
    setExpandedSections(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Toggle field expand
  const toggleField = (sectionIndex, fieldIndex) => {
    const key = `${sectionIndex}-${fieldIndex}`;
    setExpandedFields(prev => ({ ...prev, [key]: !prev[key] }));
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
                <h1 className="text-2xl font-bold text-slate-800">
                  {isEdit ? 'Edit Form' : 'Buat Form Baru'}
                </h1>
                <p className="text-slate-500 mt-1">
                  {isEdit ? 'Ubah konfigurasi form' : 'Konfigurasi form dinamis'}
                </p>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? 'Menyimpan...' : 'Simpan Form'}
            </button>
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Informasi Dasar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Form *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                  placeholder="Contoh: Tes Kondisi Fisik"
                  required
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-red-600"
                />
                <label htmlFor="is_active" className="text-sm text-slate-700">Form Aktif</label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none"
                  rows={2}
                  placeholder="Deskripsi singkat tentang form ini"
                />
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Sections & Fields</h2>
              <button
                type="button"
                onClick={addSection}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tambah Section
              </button>
            </div>

            {formData.sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Section Header */}
                <div 
                  className="flex items-center justify-between p-4 bg-slate-50 cursor-pointer"
                  onClick={() => toggleSection(sectionIndex)}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-5 h-5 text-slate-400" />
                    <div>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-slate-800 bg-transparent border-0 focus:ring-0 p-0"
                        placeholder="Nama Section"
                      />
                      <p className="text-xs text-slate-500">{section.fields.length} field(s)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={section.type}
                      onChange={(e) => updateSection(sectionIndex, { type: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm border border-slate-200 rounded-lg px-2 py-1"
                    >
                      {SECTION_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    {formData.sections.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeSection(sectionIndex); }}
                        className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {expandedSections.includes(sectionIndex) ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Section Content */}
                {expandedSections.includes(sectionIndex) && (
                  <div className="p-4 space-y-3">
                    {/* Fields */}
                    {section.fields.map((field, fieldIndex) => {
                      const fieldKey = `${sectionIndex}-${fieldIndex}`;
                      const isExpanded = expandedFields[fieldKey];
                      const FieldIcon = FIELD_TYPES.find(t => t.value === field.type)?.icon || Type;

                      return (
                        <div 
                          key={fieldIndex} 
                          className="border border-slate-200 rounded-xl overflow-hidden"
                        >
                          {/* Field Header */}
                          <div 
                            className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer"
                            onClick={() => toggleField(sectionIndex, fieldIndex)}
                          >
                            <div className="flex items-center gap-3">
                              <FieldIcon className="w-4 h-4 text-slate-400" />
                              <span className="font-medium text-slate-700">
                                {field.label || 'Field baru'}
                              </span>
                              <span className="text-xs text-slate-400">({field.type})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeField(sectionIndex, fieldIndex); }}
                                className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {/* Field Editor */}
                          {isExpanded && (
                            <div className="p-4 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">Label *</label>
                                  <input
                                    type="text"
                                    value={field.label}
                                    onChange={(e) => updateField(sectionIndex, fieldIndex, { label: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                    placeholder="Label field"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                                  <input
                                    type="text"
                                    value={field.name}
                                    onChange={(e) => updateField(sectionIndex, fieldIndex, { name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                                    placeholder="field_name"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">Tipe</label>
                                  <select
                                    value={field.type}
                                    onChange={(e) => updateField(sectionIndex, fieldIndex, { type: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                  >
                                    {FIELD_TYPES.map(t => (
                                      <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">Unit (opsional)</label>
                                  <input
                                    type="text"
                                    value={field.unit}
                                    onChange={(e) => updateField(sectionIndex, fieldIndex, { unit: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                    placeholder="Kali, cm, dtk"
                                  />
                                </div>
                                <div className="flex items-center gap-4 pt-5">
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={field.is_required}
                                      onChange={(e) => updateField(sectionIndex, fieldIndex, { is_required: e.target.checked })}
                                      className="w-4 h-4 accent-red-600"
                                    />
                                    <span className="text-sm text-slate-700">Required</span>
                                  </label>
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={field.has_grading}
                                      onChange={(e) => updateField(sectionIndex, fieldIndex, { has_grading: e.target.checked })}
                                      className="w-4 h-4 accent-red-600"
                                    />
                                    <span className="text-sm text-slate-700">Auto-grading</span>
                                  </label>
                                </div>
                              </div>

                              {/* Data Source for Select/Radio */}
                              {['select', 'radio', 'checkbox'].includes(field.type) && (
                                <div className="pt-2 border-t border-slate-100">
                                  <label className="block text-xs font-medium text-slate-600 mb-2">Data Source</label>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <select
                                      value={field.data_source_type || ''}
                                      onChange={(e) => updateField(sectionIndex, fieldIndex, { 
                                        data_source_type: e.target.value,
                                        options: e.target.value ? [] : (field.options || [])
                                      })}
                                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                    >
                                      <option value="">Custom Options</option>
                                      <option value="model">From Database</option>
                                    </select>
                                    {field.data_source_type === 'model' && (
                                      <>
                                        <select
                                          value={field.data_source_model}
                                          onChange={(e) => {
                                            updateField(sectionIndex, fieldIndex, { data_source_model: e.target.value });
                                            if (e.target.value) fetchModelFields(e.target.value);
                                          }}
                                          className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                        >
                                          <option value="">Pilih Model</option>
                                          {availableModels.map(m => (
                                            <option key={m.key} value={m.key}>{m.name}</option>
                                          ))}
                                        </select>
                                        {/* Linked Field - auto-fill dari reference model */}
                                        {formData.reference_model && field.data_source_model && (
                                          <select
                                            value={field.linked_to_reference_field || ''}
                                            onChange={(e) => updateField(sectionIndex, fieldIndex, { linked_to_reference_field: e.target.value })}
                                            className="px-3 py-2 border border-blue-200 rounded-lg text-sm bg-blue-50"
                                            title="Link ke field reference model"
                                          >
                                            <option value="">-- Link otomatis (opsional) --</option>
                                            {(modelFields[formData.reference_model] || []).map(f => (
                                              <option key={f} value={f}>{f}</option>
                                            ))}
                                          </select>
                                        )}
                                      </>
                                    )}
                                  </div>
                                  
                                  {/* Custom Options Editor */}
                                  {(!field.data_source_type || field.data_source_type === '') && (
                                    <div className="mt-3 space-y-2">
                                      <label className="block text-xs font-medium text-slate-500">Opsi:</label>
                                      {(field.options || []).map((opt, optIndex) => (
                                        <div key={optIndex} className="flex items-center gap-2">
                                          <input
                                            type="text"
                                            value={opt.label}
                                            onChange={(e) => {
                                              const newOptions = [...(field.options || [])];
                                              newOptions[optIndex] = { 
                                                ...newOptions[optIndex], 
                                                label: e.target.value,
                                                value: e.target.value.toLowerCase().replace(/\s+/g, '_')
                                              };
                                              updateField(sectionIndex, fieldIndex, { options: newOptions });
                                            }}
                                            placeholder="Label opsi"
                                            className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newOptions = (field.options || []).filter((_, i) => i !== optIndex);
                                              updateField(sectionIndex, fieldIndex, { options: newOptions });
                                            }}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newOptions = [...(field.options || []), { label: '', value: '' }];
                                          updateField(sectionIndex, fieldIndex, { options: newOptions });
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                      >
                                        <Plus className="w-3 h-3" /> Tambah Opsi
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Model Reference Field - Per-field model selection */}
                              {field.type === 'model_reference' && (
                                <div className="pt-2 border-t border-slate-100 space-y-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Source Model
                                      </label>
                                      <select
                                        value={field.data_source_model || ''}
                                        onChange={(e) => {
                                          updateField(sectionIndex, fieldIndex, { 
                                            data_source_model: e.target.value,
                                            reference_field: '' // Reset field when model changes
                                          });
                                          if (e.target.value) fetchModelFields(e.target.value);
                                        }}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                      >
                                        <option value="">Pilih Model</option>
                                        {availableModels.map(m => (
                                          <option key={m.key} value={m.key}>{m.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Field to Auto-fill
                                      </label>
                                      {!field.data_source_model ? (
                                        <p className="text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-lg">
                                          Pilih Source Model terlebih dahulu
                                        </p>
                                      ) : (
                                        <select
                                          value={field.reference_field || ''}
                                          onChange={(e) => updateField(sectionIndex, fieldIndex, { reference_field: e.target.value })}
                                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                        >
                                          <option value="">Pilih Field</option>
                                          {(modelFields[field.data_source_model] || []).length === 0 ? (
                                            <option disabled>Loading...</option>
                                          ) : (
                                            (modelFields[field.data_source_model] || []).map(f => (
                                              <option key={f} value={f}>{f}</option>
                                            ))
                                          )}
                                        </select>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`readonly_${sectionIndex}_${fieldIndex}`}
                                      checked={field.is_readonly || false}
                                      onChange={(e) => updateField(sectionIndex, fieldIndex, { is_readonly: e.target.checked })}
                                      className="w-4 h-4 accent-red-600"
                                    />
                                    <label htmlFor={`readonly_${sectionIndex}_${fieldIndex}`} className="text-xs text-slate-600">
                                      Read-only (tidak bisa diedit saat mengisi form)
                                    </label>
                                  </div>
                                </div>
                              )}

                              {/* Table section fields */}
                              {section.type === 'table' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Group Label</label>
                                    <input
                                      type="text"
                                      value={field.group_label}
                                      onChange={(e) => updateField(sectionIndex, fieldIndex, { group_label: e.target.value })}
                                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                      placeholder="KEKUATAN"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Sub Label</label>
                                    <input
                                      type="text"
                                      value={field.sub_label}
                                      onChange={(e) => updateField(sectionIndex, fieldIndex, { sub_label: e.target.value })}
                                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                      placeholder="Otot Perut"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Technique</label>
                                    <input
                                      type="text"
                                      value={field.technique}
                                      onChange={(e) => updateField(sectionIndex, fieldIndex, { technique: e.target.value })}
                                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                      placeholder="Sit up"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add Field Button */}
                    <button
                      type="button"
                      onClick={() => addField(sectionIndex)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-red-300 hover:text-red-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah Field
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </form>
    </DashboardLayout>
  );
}
