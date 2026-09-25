// ResellerCard.jsx — Legacy stub. All products now use the unified catalog.
import { Link } from 'react-router-dom';

export default function ResellerCard({ product }) {
  if (!product) return null;
  const img = product.images?.[0] || product.imageUrl || '';
  return (
    <Link
      to={`/product/${product._id}`}
      className="block rounded-xl overflow-hidden shadow hover:shadow-lg transition group"
    >
      <div className="aspect-square bg-gray-100 overflow-hidden">
        {img && (
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm text-gray-800 truncate">{product.name}</p>
        <p className="text-xs text-gray-500">PKR {product.sellingPrice ?? product.price ?? '—'}</p>
      </div>
    </Link>
  );
}
