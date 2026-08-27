import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Calculator, PlayCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Select } from '../../components/ui/FormField';
import * as payrollService from '../../services/payrollService';
import * as departmentService from '../../services/departmentService';
import { formatCurrency, MONTH_NAMES } from '../../utils/format';
import { getErrorMessage } from '../../services/api';

export default function Payroll() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);

  const [previews, setPreviews] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [calculating, setCalculating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  useEffect(() => {
    departmentService.getDepartments().then((res) => setDepartments(res.data.data)).catch(() => {});
  }, []);

  const handleCalculate = async () => {
    setCalculating(true);
    setResults(null);
    try {
      const res = await payrollService.calculatePayrollPreview({ month, year, department: department || undefined });
      setPreviews(res.data.data);
      setSelected(new Set(res.data.data.filter((p) => !p.alreadyProcessed && !p.error).map((p) => p.employee._id)));
    } catch (err) {
      toast.error(getErrorMessage(err));
      setPreviews(null);
    } finally {
      setCalculating(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const res = await payrollService.processPayroll({ month, year, employeeIds: Array.from(selected) });
      setResults(res.data.data);
      toast.success(`Processed payroll for ${res.data.data.processed.length} employee(s).`);
      setConfirmOpen(false);
      handleCalculate();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  const eligibleCount = previews?.filter((p) => !p.alreadyProcessed && !p.error).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Payroll Processing</h1>
        <p className="text-sm text-gray-500">Calculate and process monthly payroll based on attendance, salary structure, and deductions.</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Month</label>
            <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-40">
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Year</label>
            <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28">
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Department</label>
            <Select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-56">
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </Select>
          </div>
          <Button icon={Calculator} loading={calculating} onClick={handleCalculate}>
            Calculate Preview
          </Button>
        </div>
      </Card>

      {calculating ? (
        <Spinner label="Calculating payroll..." />
      ) : previews === null ? (
        <EmptyState title="No preview yet" message="Choose a month/year and click Calculate Preview to see payroll before processing." />
      ) : previews.length === 0 ? (
        <EmptyState title="No active employees found" />
      ) : (
        <Card noPadding
          title={`Payroll Preview — ${MONTH_NAMES[month - 1]} ${year}`}
          actions={
            <Button icon={PlayCircle} disabled={selected.size === 0} onClick={() => setConfirmOpen(true)}>
              Process Payroll ({selected.size})
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-5 py-3"><input type="checkbox" disabled className="rounded" checked={selected.size === eligibleCount && eligibleCount > 0} readOnly /></th>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3 text-right">Basic</th>
                  <th className="px-5 py-3 text-right">Earnings</th>
                  <th className="px-5 py-3 text-right">Deductions</th>
                  <th className="px-5 py-3 text-right">Gross</th>
                  <th className="px-5 py-3 text-right">Net Salary</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {previews.map((p) => {
                  const totalEarnings = p.error
                    ? 0
                    : Object.values(p.earnings).reduce((a, b) => a + b, 0);
                  return (
                    <tr key={p.employee._id} className={p.error ? 'bg-red-50/40' : 'hover:bg-gray-50'}>
                      <td className="px-5 py-3">
                        {!p.error && !p.alreadyProcessed && (
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={selected.has(p.employee._id)}
                            onChange={() => toggleSelect(p.employee._id)}
                          />
                        )}
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-800">
                        {p.employee.firstName} {p.employee.lastName}
                        <div className="text-xs font-normal text-gray-400">{p.employee.employeeId} &middot; {p.employee.department?.name}</div>
                      </td>
                      {p.error ? (
                        <td colSpan={5} className="px-5 py-3 text-sm text-red-600">{p.error}</td>
                      ) : (
                        <>
                          <td className="px-5 py-3 text-right text-gray-600">{formatCurrency(p.basicSalary)}</td>
                          <td className="px-5 py-3 text-right text-gray-600">{formatCurrency(totalEarnings)}</td>
                          <td className="px-5 py-3 text-right text-red-500">{formatCurrency(p.totalDeductions)}</td>
                          <td className="px-5 py-3 text-right text-gray-700">{formatCurrency(p.grossSalary)}</td>
                          <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(p.netSalary)}</td>
                        </>
                      )}
                      <td className="px-5 py-3">
                        {p.alreadyProcessed ? <Badge status="Processed">Already Processed</Badge> : p.error ? <Badge color="red">Error</Badge> : <Badge color="gray">Ready</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {results && (
        <Card title="Last Processing Result">
          <p className="text-sm text-emerald-700">Processed: {results.processed.length}</p>
          {results.skipped.length > 0 && (
            <div className="mt-2 text-sm text-amber-700">
              Skipped:
              <ul className="mt-1 list-inside list-disc">
                {results.skipped.map((s, i) => (
                  <li key={i}>{s.employee}: {s.reason}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleProcess}
        loading={processing}
        variant="primary"
        title="Process payroll?"
        message={`This will process payroll for ${selected.size} employee(s) for ${MONTH_NAMES[month - 1]} ${year}. This action cannot be undone.`}
        confirmLabel="Process Payroll"
      />
    </div>
  );
}
