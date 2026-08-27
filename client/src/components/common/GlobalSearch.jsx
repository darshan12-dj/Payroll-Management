import { useEffect, useRef, useState } from 'react';
import { Search, Loader2, Users, Building2, FileText, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { globalSearch } from '../../services/searchService';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(query, 350);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!debounced.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    globalSearch(debounced)
      .then((res) => setResults(res.data.data))
      .catch(() => setResults(null))
      .finally(() => setLoading(false));
  }, [debounced]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasResults =
    results && (results.employees.length || results.departments.length || results.payroll.length || results.payslips.length);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search employees, departments, payroll, payslips..."
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />}
      </div>

      {open && query.trim() && (
        <div className="absolute z-30 mt-2 w-full rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          {!loading && !hasResults && <p className="px-3 py-4 text-center text-sm text-gray-500">No results for "{query}"</p>}

          {results?.employees?.length > 0 && (
            <ResultSection title="Employees" icon={Users}>
              {results.employees.map((e) => (
                <ResultRow
                  key={e._id}
                  label={`${e.firstName} ${e.lastName}`}
                  sub={e.employeeId}
                  onClick={() => {
                    navigate(`/employees/${e._id}`);
                    setOpen(false);
                  }}
                />
              ))}
            </ResultSection>
          )}

          {results?.departments?.length > 0 && (
            <ResultSection title="Departments" icon={Building2}>
              {results.departments.map((d) => (
                <ResultRow
                  key={d._id}
                  label={d.name}
                  sub={d.code}
                  onClick={() => {
                    navigate('/departments');
                    setOpen(false);
                  }}
                />
              ))}
            </ResultSection>
          )}

          {results?.payroll?.length > 0 && (
            <ResultSection title="Payroll Records" icon={Banknote}>
              {results.payroll.map((p) => (
                <ResultRow
                  key={p._id}
                  label={`${p.employee?.firstName || ''} ${p.employee?.lastName || ''}`}
                  sub={`${p.month}/${p.year} - ${p.status}`}
                  onClick={() => {
                    navigate('/payroll-history');
                    setOpen(false);
                  }}
                />
              ))}
            </ResultSection>
          )}

          {results?.payslips?.length > 0 && (
            <ResultSection title="Payslips" icon={FileText}>
              {results.payslips.map((p) => (
                <ResultRow
                  key={p._id}
                  label={p.payslipNumber}
                  sub={`${p.employee?.firstName || ''} ${p.employee?.lastName || ''}`}
                  onClick={() => {
                    navigate('/payslips');
                    setOpen(false);
                  }}
                />
              ))}
            </ResultSection>
          )}
        </div>
      )}
    </div>
  );
}

function ResultSection({ title, icon: Icon, children }) {
  return (
    <div className="mb-1 last:mb-0">
      <p className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        <Icon className="h-3 w-3" /> {title}
      </p>
      <div>{children}</div>
    </div>
  );
}

function ResultRow({ label, sub, onClick }) {
  return (
    <button onClick={onClick} className="flex w-full flex-col items-start rounded-md px-3 py-2 text-left hover:bg-gray-50">
      <span className="text-sm font-medium text-gray-800">{label}</span>
      <span className="text-xs text-gray-400">{sub}</span>
    </button>
  );
}
