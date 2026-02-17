import { useState } from "react";
import { Heart, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthCheck } from "../../hooks/useAuthCheck";
import CloudinaryImage from "../common/CloudinaryImage";
import withOptimization from "../common/withOptimization";

const ProductCard = ({ item, isLiked, onToggleWishlist }) => {
  const [heartAnim, setHeartAnim] = useState(false);
  const navigate = useNavigate();
  const { checkAuth } = useAuthCheck();

  const triggerHeart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!checkAuth("add to wishlist")) {
      return;
    }
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 1000);
    onToggleWishlist({
      ...item,
      id: `custom-${item.id}`,
      title: item.name,
      description: item.description || "Custom Your Style - Handpicked Goods",
      image: item.front,
      imageUrls: [item.front, item.back].filter(Boolean),
      isCustom: true,
      source: "custom",
    });
  };

  const handleCardClick = (e) => {
    e.preventDefault();
    const detailState = {
      ...item,
      title: item.name,
      imageUrls: [item.front, item.back].filter(Boolean),
      sellingPrice: item.price,
      brandName: "Buy2Sell Custom",
      description: "Custom Your Style - Handpicked Goods",
      isCustom: true,
      source: "custom-shirt",
      customPreview: item.front,
    };
    navigate("/product-detail", { state: detailState });
  };

  return (
    <div
      tabIndex="0"
      className="bg-white rounded-xl shadow-sm transition-all duration-300 ease-out group relative cursor-pointer h-full flex flex-col hover:shadow-xl overflow-hidden outline-none"
      onClick={handleCardClick}
    >
      <div className="absolute top-3 right-3 z-20 transition-transform duration-300 group-hover:-translate-y-1">
        <button
          onClick={triggerHeart}
          className={`p-2 rounded-full transition-all duration-300 shadow-md ${
            isLiked
              ? "bg-red-500 text-white transform scale-110"
              : "bg-white/90 backdrop-blur-sm text-gray-600 hover:text-red-500 hover:bg-red-50"
          }`}
          aria-label="Toggle wishlist"
        >
          <Heart
            className={`h-4 w-4 transition-transform ${
              isLiked ? "fill-current" : ""
            } ${heartAnim ? "animate-heart-beat" : "hover:scale-110"}`}
          />
        </button>
      </div>

      <div className="relative w-full aspect-[4/5] overflow-hidden rounded-t-xl bg-gray-100">
        <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105">
           <CloudinaryImage
              src={item.front}
              alt={item.name}
              className="w-full h-full object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
        </div>

        <div className={`absolute inset-0 transition-all duration-300 ease-out group-hover:scale-105 ${item.back ? "opacity-0 group-hover:opacity-100" : "hidden"}`}>
           <CloudinaryImage
              src={item.back || item.front}
              alt={`${item.name} - Back`}
              className="w-full h-full object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/5" />
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 pointer-events-none bg-white relative z-10">
        <div className="text-[10px] lg:text-sm text-emerald-600 font-semibold mb-1 tracking-wide uppercase whitespace-nowrap overflow-visible">
          Custom Cloth
        </div>

        <h3 className="text-sm lg:text-lg font-bold text-gray-900 mb-3 leading-tight group-hover:text-emerald-700 transition-colors lg:whitespace-nowrap lg:overflow-hidden lg:text-ellipsis">
          <span className="hidden lg:inline">{item.name}</span>
          <span className="lg:hidden">
            {(() => {
               const title = item.name;
               const t = title.split(' ');
               if (t.length <= 3) return title;
               return t.slice(0, 3).join(' ') + '...';
            })()}
          </span>
        </h3>

        <div className="flex flex-row items-center justify-between mt-auto">
          <div className="flex items-center gap-1 font-extrabold text-gray-900 text-xl">
             <span className="text-sm">Rs</span>
             <span>{item.price}</span>
          </div>

          <button
            onClick={handleCardClick}
            className="product-card-btn bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 pointer-events-auto z-20 flex items-center justify-center shrink-0
            opacity-100 translate-y-0
            lg:opacity-0 lg:translate-y-8 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
            aria-label={`View ${item.name} details`}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductCardExport = withOptimization(ProductCard);
export default ProductCardExport;
