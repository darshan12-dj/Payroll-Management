import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Wallet } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { Label, Input, Select, FormGroup } from '../components/ui/FormField';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import * as employeeService from '../services/employeeService';
import * as salaryStructureService from '../services/salaryStructureService';
import { formatCurrency } from '../utils/format';
import { getErrorMessage } from '../services/api';

const DEFAULT_FORM = {
  basicSalary: '',
  earnings: { hra: 0, transportAllowance: 0, medicalAllowance: 0, specialAllowance: 0, bonus: 0, overtimeRatePerHour: 0 },
  deductions: { pfPercent: 12, professionalTax: 0, tdsPercent: 0, insurance: 0, loanDeduction: 0, otherDeductions: 0 },
};

export default function SalaryStructure() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const debouncedForm = useDebounce(form, 500);

  useEffect(() => {
    employeeService
      .getEmployees({ limit: 100, status: 'Active' })
      .then((res) => setEmployees(res.data.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoadingEmployees(false));
  }, []);

  useEffect(() => {
    if (!selectedEmployee) return;
    setLoadingStructure(true);
    const emp = employees.find((e) => e._id === selectedEmployee);
    salaryStructureService
      .getSalaryStructureForEmployee(selectedEmployee)
      .then((res) => {
        const s = res.data.data;
        setForm({ basicSalary: s.basicSalary, earnings: s.earnings, deductions: s.deductions });
      })
      .catch(() => {
        setForm({ ...DEFAULT_FORM, basicSalary: emp?.basicSalary || '' });
      })
      .finally(() => setLoadingStructure(false));
  }, [selectedEmployee]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedEmployee || !debouncedForm.basicSalary) {
      setPreview(null);
      return;
    }
    setPreviewLoading(true);
    salaryStructureService
      .previewCalculation({
        basicSalary: Number(debouncedForm.basicSalary),
        earnings: debouncedForm.earnings,
        deductions: debouncedForm.deductions,
        attendanceSummary: { present: 22, totalWorkingDays: 22 },
      })
      .then((res) => setPreview(res.data.data))
      .catch(() => setPreview(null))
      .finally(() => setPreviewLoading(false));
  }, [debouncedForm, selectedEmployee]);

  const updateEarning = (key, value) => setForm((f) => ({ ...f, earnings: { ...f.earnings, [key]: value } }));
  const updateDeduction = (key, value) => setForm((f) => ({ ...f, deductions: { ...f.deductions, [key]: value } }));

  const handleSave = async () => {
    if (!selectedEmployee) return;
    if (!form.basicSalary || Number(form.basicSalary) < 0) {
      toast.error('Basic salary must be a positive number.');
      return;
    }
    setSaving(true);
    try {
      await salaryStructureService.upsertSalaryStructure({
        employee: selectedEmployee,
        basicSalary: Number(form.basicSalary),
        earnings: form.earnings,
        deductions: form.deductions,
      });
      toast.success('Salary structure saved.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loadingEmployees) return <Spinner fullHeight label="Loading employees..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Salary Structure</h1>
        <p className="text-sm text-gray-500">Configure earnings and deductions for each employee. Calculations are always verified on the server.</p>
      </div>

      <Card>
        <FormGroup className="max-w-sm">
          <Label required>Select Employee</Label>
          <Select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
            <option value="">Choose an employee</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>{e.firstName} {e.lastName} ({e.employeeId})</option>
            ))}
          </Select>
        </FormGroup>
      </Card>

      {!selectedEmployee ? (
        <EmptyState icon={Wallet} title="Select an employee" message="Choose an employee above to view or configure their salary structure." />
      ) : loadingStructure ? (
        <Spinner label="Loading salary structure..." />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card title="Earnings">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormGroup>
                  <Label required>Basic Salary</Label>
                  <Input type="number" min="0" value={form.basicSalary} onChange={(e) => setForm((f) => ({ ...f, basicSalary: e.target.value }))} />
                </FormGroup>
                <FormGroup>
                  <Label>HRA</Label>
                  <Input type="number" min="0" value={form.earnings.hra} onChange={(e) => updateEarning('hra', e.target.value)} />
                </FormGroup>
                <FormGroup>
                  <Label>Transport Allowance</Label>
                  <Input type="number" min="0" value={form.earnings.transportAllowance} onChange={(e) => updateEarning('transportAllowance', e.target.value)} />
                </FormGroup>
                <FormGroup>
                  <Label>Medical Allowance</Label>
                  <Input type="number" min="0" value={form.earnings.medicalAllowance} onChange={(e) => updateEarning('medicalAllowance', e.target.value)} />
                </FormGroup>
                <FormGroup>
                  <Label>Special Allowance</Label>
                  <Input type="number" min="0" value={form.earnings.specialAllowance} onChange={(e) => updateEarning('specialAllowance', e.target.value)} />
                </FormGroup>
                <FormGroup>
                  <Label>Bonus</Label>
                  <Input type="number" min="0" value={form.earnings.bonus} onChange={(e) => updateEarning('bonus', e.target.value)} />
                </FormGroup>
                <FormGroup>
                  <Label>Overtime Rate (per hour)</Label>
                  <Input type="number" min="0" value={form.earnings.overtimeRatePerHour} onChange={(e) => updateEarning('overtimeRatePerHour', e.target.value)} />
                </FormGroup>
              </div>
            </Card>

            <Card title="Deductions">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormGroup>
                  <Label>PF (%)</Label>
                  <Input type="number" min="0" max="100" value={form.deductions.pfPercent} onChange={(e) => updateDeduction('pfPercent', e.target.value)} />
                </FormGroup>
                <FormGroup>
                  <Label>Professional Tax</Label>
                  <Input type="number" min="0" value={form.deductions.professionalTax} onChange={(e) => updateDeduction('professionalTax', e.target.value)} />
                </FormGroup>
                <FormGroup>
                  <Label>TDS (%)</Label>
                  <Input type="number" min="0" max="100" value={form.deductions.tdsPercent} onChange={(e) => updateDeduction('tdsPercent', e.target.value)} />
                </FormGroup>
                <FormGroup>
                  <Label>Insurance</Label>
                  <Input type="number" min="0" value={form.deductions.insurance} onChange={(e) => updateDeduction('insurance', e.target.value)} />
                </FormGroup>
                <FormGroup>
                  <Label>Loan Deduction</Label>
                  <Input type="number" min="0" value={form.deductions.loanDeduction} onChange={(e) => updateDeduction('loanDeduction', e.target.value)} />
                </FormGroup>
                <FormGroup>
                  <Label>Other Deductions</Label>
                  <Input type="number" min="0" value={form.deductions.otherDeductions} onChange={(e) => updateDeduction('otherDeductions', e.target.value)} />
                </FormGroup>
              </div>
            </Card>

            {user.role === 'admin' && (
              <div className="flex justify-end">
                <Button icon={Save} loading={saving} onClick={handleSave}>
                  Save Salary Structure
                </Button>
              </div>
            )}
          </div>

          <div>
            <Card title="Live Preview (Full Attendance)" className="sticky top-20">
              {previewLoading ? (
                <Spinner label="Calculating..." />
              ) : !preview ? (
                <p className="text-sm text-gray-400">Enter a basic salary to see the calculated breakdown.</p>
              ) : (
                <div className="space-y-3 text-sm">
                  <PreviewRow label="Basic Salary" value={preview.basicSalary} />
                  <PreviewRow label="HRA" value={preview.earnings.hra} />
                  <PreviewRow label="Transport" value={preview.earnings.transportAllowance} />
                  <PreviewRow label="Medical" value={preview.earnings.medicalAllowance} />
                  <PreviewRow label="Special Allowance" value={preview.earnings.specialAllowance} />
                  <PreviewRow label="Bonus" value={preview.earnings.bonus} />
                  <PreviewRow label="Overtime" value={preview.earnings.overtime} />
                  <div className="border-t border-gray-100 pt-2">
                    <PreviewRow label="Gross Salary" value={preview.grossSalary} bold />
                  </div>
                  <PreviewRow label="PF" value={-preview.deductions.pf} negative />
                  <PreviewRow label="Professional Tax" value={-preview.deductions.professionalTax} negative />
                  <PreviewRow label="TDS" value={-preview.deductions.tds} negative />
                  <PreviewRow label="Insurance" value={-preview.deductions.insurance} negative />
                  <PreviewRow label="Loan Deduction" value={-preview.deductions.loanDeduction} negative />
                  <PreviewRow label="Other" value={-preview.deductions.otherDeductions} negative />
                  <div className="border-t border-gray-100 pt-2">
                    <PreviewRow label="Total Deductions" value={-preview.totalDeductions} negative bold />
                  </div>
                  <div className="mt-2 rounded-lg bg-brand-600 px-4 py-3 text-white">
                    <p className="text-xs uppercase tracking-wide text-brand-100">Net Salary</p>
                    <p className="text-xl font-bold">{formatCurrency(preview.netSalary)}</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewRow({ label, value, negative, bold }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? 'font-semibold text-gray-800' : 'text-gray-500'}>{label}</span>
      <span className={`${bold ? 'font-semibold text-gray-900' : negative ? 'text-red-500' : 'text-gray-700'}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}
