import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Building2, Users } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Label, Input, Textarea, Select, FormGroup, FieldError } from '../components/ui/FormField';
import * as departmentService from '../services/departmentService';
import * as employeeService from '../services/employeeService';
import { getErrorMessage } from '../services/api';

const EMPTY_FORM = { name: '', code: '', description: '', head: '' };

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    departmentService
      .getDepartments()
      .then((res) => setDepartments(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    employeeService.getEmployees({ limit: 100 }).then((res) => setEmployees(res.data.data)).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (dept) => {
    setEditing(dept);
    setForm({ name: dept.name, code: dept.code, description: dept.description || '', head: dept.head?._id || '' });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Department name is required.';
    if (!form.code.trim()) next.code = 'Department code is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, head: form.head || null };
      if (editing) {
        await departmentService.updateDepartment(editing._id, payload);
        toast.success('Department updated.');
      } else {
        await departmentService.createDepartment(payload);
        toast.success('Department created.');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await departmentService.deleteDepartment(deleteTarget._id);
      toast.success('Department deleted.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Departments</h1>
          <p className="text-sm text-gray-500">Organize your workforce into departments.</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>
          Add Department
        </Button>
      </div>

      {loading ? (
        <Spinner label="Loading departments..." />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : departments.length === 0 ? (
        <EmptyState icon={Building2} title="No departments yet" message="Create your first department to get started." actionLabel="Add Department" onAction={openCreate} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => (
            <Card key={d._id}>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(d)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(d)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="mt-3 text-base font-semibold text-gray-900">{d.name}</h3>
              <p className="text-xs font-mono text-gray-400">{d.code}</p>
              {d.description && <p className="mt-2 text-sm text-gray-500">{d.description}</p>}
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
                <span className="flex items-center gap-1.5 text-gray-500">
                  <Users className="h-4 w-4" /> {d.employeeCount} employee{d.employeeCount === 1 ? '' : 's'}
                </span>
                {d.head && <span className="text-xs text-gray-400">Head: {d.head.firstName} {d.head.lastName}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Department' : 'Add Department'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Save Changes' : 'Create Department'}</Button>
          </>
        }
      >
        <FormGroup>
          <Label required>Department Name</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} />
          <FieldError>{errors.name}</FieldError>
        </FormGroup>
        <FormGroup>
          <Label required>Department Code</Label>
          <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} error={errors.code} />
          <FieldError>{errors.code}</FieldError>
        </FormGroup>
        <FormGroup>
          <Label>Description</Label>
          <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </FormGroup>
        <FormGroup>
          <Label>Department Head</Label>
          <Select value={form.head} onChange={(e) => setForm((f) => ({ ...f, head: e.target.value }))}>
            <option value="">None</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>{e.firstName} {e.lastName}</option>
            ))}
          </Select>
        </FormGroup>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete department?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
