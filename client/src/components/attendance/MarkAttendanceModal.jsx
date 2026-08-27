import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Label, Input, Select, FormGroup } from '../ui/FormField';
import * as attendanceService from '../../services/attendanceService';
import { getErrorMessage } from '../../services/api';

export default function MarkAttendanceModal({ open, onClose, employees, onSaved, defaultDate }) {
  const [form, setForm] = useState({
    employee: '',
    date: defaultDate || new Date().toISOString().slice(0, 10),
    status: 'Present',
    overtimeHours: 0,
    remarks: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.employee) {
      toast.error('Please select an employee.');
      return;
    }
    setSaving(true);
    try {
      await attendanceService.markAttendance(form);
      toast.success('Attendance recorded.');
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
      title="Mark Attendance"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>Save</Button>
        </>
      }
    >
      <FormGroup>
        <Label required>Employee</Label>
        <Select value={form.employee} onChange={(e) => setForm((f) => ({ ...f, employee: e.target.value }))}>
          <option value="">Select employee</option>
          {employees.map((e) => (
            <option key={e._id} value={e._id}>{e.firstName} {e.lastName} ({e.employeeId})</option>
          ))}
        </Select>
      </FormGroup>
      <FormGroup>
        <Label required>Date</Label>
        <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
      </FormGroup>
      <FormGroup>
        <Label required>Status</Label>
        <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
          <option>Present</option>
          <option>Absent</option>
          <option>Half Day</option>
          <option>Leave</option>
          <option>Late</option>
        </Select>
      </FormGroup>
      <FormGroup>
        <Label>Overtime Hours</Label>
        <Input type="number" min="0" step="0.5" value={form.overtimeHours} onChange={(e) => setForm((f) => ({ ...f, overtimeHours: e.target.value }))} />
      </FormGroup>
      <FormGroup>
        <Label>Remarks</Label>
        <Input value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} />
      </FormGroup>
    </Modal>
  );
}
