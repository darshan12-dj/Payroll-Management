import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Label, Input, Select, Textarea, FormGroup, FieldError } from '../ui/FormField';
import * as leaveService from '../../services/leaveService';
import { getErrorMessage } from '../../services/api';

export default function ApplyLeaveModal({ open, onClose, employeeId, onSaved }) {
  const [form, setForm] = useState({ leaveType: 'Casual Leave', startDate: '', endDate: '', reason: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const next = {};
    if (!form.startDate) next.startDate = 'Start date is required.';
    if (!form.endDate) next.endDate = 'End date is required.';
    if (form.startDate && form.endDate && form.endDate < form.startDate) next.endDate = 'End date cannot be before start date.';
    if (!form.reason.trim()) next.reason = 'Reason is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await leaveService.applyLeave({ ...form, employee: employeeId });
      toast.success('Leave request submitted.');
      setForm({ leaveType: 'Casual Leave', startDate: '', endDate: '', reason: '' });
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Apply for Leave"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>Submit Request</Button>
        </>
      }
    >
      <FormGroup>
        <Label required>Leave Type</Label>
        <Select value={form.leaveType} onChange={(e) => setForm((f) => ({ ...f, leaveType: e.target.value }))}>
          <option>Casual Leave</option>
          <option>Sick Leave</option>
          <option>Earned Leave</option>
          <option>Unpaid Leave</option>
        </Select>
      </FormGroup>
      <div className="grid grid-cols-2 gap-3">
        <FormGroup>
          <Label required>Start Date</Label>
          <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} error={errors.startDate} />
          <FieldError>{errors.startDate}</FieldError>
        </FormGroup>
        <FormGroup>
          <Label required>End Date</Label>
          <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} error={errors.endDate} />
          <FieldError>{errors.endDate}</FieldError>
        </FormGroup>
      </div>
      <FormGroup>
        <Label required>Reason</Label>
        <Textarea rows={3} value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} error={errors.reason} />
        <FieldError>{errors.reason}</FieldError>
      </FormGroup>
    </Modal>
  );
}
