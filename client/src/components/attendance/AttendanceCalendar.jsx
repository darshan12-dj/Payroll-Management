const STATUS_COLORS = {
  Present: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Absent: 'bg-red-100 text-red-700 border-red-200',
  'Half Day': 'bg-purple-100 text-purple-700 border-purple-200',
  Leave: 'bg-blue-100 text-blue-700 border-blue-200',
  Late: 'bg-amber-100 text-amber-700 border-amber-200',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AttendanceCalendar({ month, year, records }) {
  const recordsByDay = new Map();
  records.forEach((r) => {
    const d = new Date(r.date);
    recordsByDay.set(d.getDate(), r);
  });

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startOffset = firstDay.getDay();

  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const record = recordsByDay.get(day);
          const colorClass = record ? STATUS_COLORS[record.status] : 'bg-gray-50 text-gray-300 border-gray-100';
          return (
            <div
              key={day}
              title={record ? `${record.status}${record.overtimeHours ? ` (+${record.overtimeHours}h OT)` : ''}` : 'No record'}
              className={`flex aspect-square flex-col items-center justify-center rounded-md border text-xs font-medium ${colorClass}`}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        {Object.entries(STATUS_COLORS).map(([status, cls]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded border ${cls}`} /> {status}
          </span>
        ))}
      </div>
    </div>
  );
}
