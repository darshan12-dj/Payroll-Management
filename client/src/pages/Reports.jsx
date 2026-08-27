import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FileDown, BarChart3 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import StatCard from '../components/dashboard/StatCard';
import { Select } from '../components/ui/FormField';
import * as reportService from '../services/reportService';
import * as departmentService from '../services/departmentService';
import { formatCurrency, MONTH_NAMES } from '../utils/format';
import { getErrorMessage } from '../services/api';

const REPORT_TYPES = [
  { value: 'payroll', label: 'Payroll Report' },
  { value: 'attendance', label: 'Attendance Report' },
  { value: 'salary', label: 'Salary Report' },
  { value: 'deduction', label: 'Deduction Report' },
];

export default function Reports() {
  const now = new Date();
  const [type, setType] = useState('payroll');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState('');

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const needsPeriod = type === 'payroll' || type === 'attendance' || type === 'deduction';

  useEffect(() => {
    departmentService.getDepartments().then((res) => setDepartments(res.data.data)).catch(() => {});
  }, []);

  const buildParams = () => {
    const params = {};
    if (needsPeriod) {
      params.month = month;
      params.year = year;
    }
    if (department && type !== 'salary') params.department = department;
    return params;
  };

  const handleGenerate = () => {
    setLoading(true);
    reportService
      .getReport(type, buildParams())
      .then((res) => setReport(res.data.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(handleGenerate, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = async (format) => {
    setExporting(format);
    try {
      await reportService.exportReport(type, buildParams(), format);
      toast.success(`${format.toUpperCase()} export downloaded.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExporting('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">Generate and export payroll, attendance, salary, and deduction reports.</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Report Type</label>
            <Select value={type} onChange={(e) => setType(e.target.value)} className="w-48">
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </div>
          {needsPeriod && (
            <>
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
            </>
          )}
          {type !== 'salary' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Department</label>
              <Select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-56">
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </Select>
            </div>
          )}
          <Button icon={BarChart3} loading={loading} onClick={handleGenerate}>
            Generate Report
          </Button>
        </div>
      </Card>

      {loading ? (
        <Spinner label="Generating report..." />
      ) : !report ? (
        <EmptyState title="No report generated yet" />
      ) : report.rows.length === 0 ? (
        <EmptyState title="No data available" message="No records match the selected filters." />
      ) : (
        <>
          {report.summary && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Object.entries(report.summary).map(([key, value]) => (
                <StatCard
                  key={key}
                  label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                  value={typeof value === 'number' && key.toLowerCase().includes('total') && key !== 'totalRecords' ? formatCurrency(value) : typeof value === 'number' && /salary|gross|deduction|pf|tds|other/i.test(key) ? formatCurrency(value) : value}
                  icon={BarChart3}
                  color="brand"
                />
              ))}
            </div>
          )}

          <Card
            title={report.title}
            noPadding
            actions={
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" icon={FileDown} loading={exporting === 'csv'} onClick={() => handleExport('csv')}>CSV</Button>
                <Button size="sm" variant="secondary" icon={FileDown} loading={exporting === 'excel'} onClick={() => handleExport('excel')}>Excel</Button>
                <Button size="sm" variant="secondary" icon={FileDown} loading={exporting === 'pdf'} onClick={() => handleExport('pdf')}>PDF</Button>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <tr>
                    {report.columns.map((c) => (
                      <th key={c.key} className="whitespace-nowrap px-5 py-3">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {report.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {report.columns.map((c) => (
                        <td key={c.key} className="whitespace-nowrap px-5 py-3 text-gray-600">{row[c.key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
