import { initials } from '../../utils/format';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export default function Avatar({ src, firstName = '', lastName = '', size = 40 }) {
  const style = { width: size, height: size, fontSize: size * 0.38 };
  if (src) {
    const fullSrc = src.startsWith('http') ? src : `${API_ORIGIN}${src}`;
    return <img src={fullSrc} alt={`${firstName} ${lastName}`} style={style} className="rounded-full object-cover" />;
  }
  return (
    <div
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700"
    >
      {initials(firstName, lastName)}
    </div>
  );
}
