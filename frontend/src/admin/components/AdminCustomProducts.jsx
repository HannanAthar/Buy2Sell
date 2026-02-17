import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    Edit2,
    Trash2,
    Eye,
    Loader2,
    Palette,
    Search,
} from "lucide-react";
import api from "../../api/axios";
import { useDialog } from "../../context/DialogContext";
import SlideOver from "./SlideOver";
import ConfirmModal from "../../components/common/ConfirmModal";

import CloudinaryImage from "../../components/common/CloudinaryImage";




export default function AdminCustomProducts() {
    const navigate = useNavigate();
    const dialog = useDialog();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
    const [deleting, setDeleting] = useState(false);

    const loadProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get("/admin/custom-products");
            setProducts(Array.isArray(data) ? data : data?.products || []);
        } catch (error) {
            console.error("Failed to load custom products:", error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to load custom products";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const filteredProducts = products.filter((p) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openDetails = (product) => {
        setSelectedProduct(product);
        setDetailsOpen(true);
    };

    const handleDelete = (id) => {
        setDeleteModal({ open: true, id });
    };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;

        setDeleting(true);
        try {
            await api.delete(`/admin/custom-products/${deleteModal.id}`);
            dialog.alert("Custom product deleted successfully", {
                title: "Success",
            });
            setDeleteModal({ open: false, id: null });
            setDetailsOpen(false);
            loadProducts();
        } catch (error) {
            console.error("Delete error:", error);
            dialog.alert("Failed to delete custom product", { title: "Error" });
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] grid place-items-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-gray-200"></div>
                        <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin absolute top-0 left-0"></div>
                    </div>
                    <p className="text-gray-600 font-medium">
                        Loading custom products...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-3xl p-8 shadow-xl text-white">
                    <h1 className="text-3xl font-bold">Custom Products</h1>
                </div>

                {/* Error Message */}
                <div className="bg-white rounded-2xl shadow-lg border border-red-200 overflow-hidden">
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Products</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={loadProducts}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
                        >
                            <Loader2 className="w-5 h-5" />
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 rounded-3xl p-10 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-3">
                            <Palette className="w-5 h-5" />
                            <span className="text-sm font-semibold">
                                Custom Products Management
                            </span>
                        </div>
                        <h1 className="text-4xl font-bold mb-2 text-white">
                            Custom Product Templates
                        </h1>
                        <p className="text-emerald-50 opacity-90">
                            Manage custom design templates for the store
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
                            <input
                                className="pl-12 pr-4 py-3 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-md text-white placeholder-white/60 focus:outline-none focus:ring-4 focus:ring-white/40 focus:bg-white/20 focus:border-white/50 transition-all w-64 shadow-lg"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => navigate("/admin/custom-products/upload")}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-emerald-700 font-semibold hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Upload New Product
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-6 sm:grid-cols-2">
                <div className="group relative overflow-hidden bg-white rounded-3xl shadow-xl border border-gray-100/50 hover:shadow-2xl transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 opacity-5 group-hover:opacity-10 transition-opacity"></div>
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"></div>

                    <div className="relative p-8">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                                        Total Products
                                    </span>
                                </div>
                                <p className="text-5xl font-black bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
                                    {products.length}
                                </p>
                                <p className="text-sm font-semibold text-gray-600">
                                    Custom Templates
                                </p>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-xl group-hover:scale-110 transition-transform duration-300">
                                    <Palette className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-white rounded-3xl shadow-xl border border-gray-100/50 hover:shadow-2xl transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 opacity-5 group-hover:opacity-10 transition-opacity"></div>
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"></div>

                    <div className="relative p-8">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                                        Visible on Homepage
                                    </span>
                                </div>
                                <p className="text-5xl font-black bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
                                    {Math.min(products.length, 8)}
                                </p>
                                <p className="text-sm font-semibold text-gray-600">
                                    Featured Products
                                </p>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl group-hover:scale-110 transition-transform duration-300">
                                    <Eye className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium mb-2">
                            {searchQuery
                                ? "No products found matching your search"
                                : "No custom products yet"}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => navigate("/admin/custom-products/upload")}
                                className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Upload First Product
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                        {filteredProducts.map((product, index) => (
                            <div
                                key={product._id}
                                className="group relative bg-white rounded-2xl border-2 border-gray-100 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
                            >
                                {/* Featured Badge for first 8 */}
                                {index < 8 && (
                                    <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg">
                                        Featured
                                    </div>
                                )}

                                {/* Image */}
                                <div className="relative h-48 bg-gray-50 overflow-hidden">
                                    <CloudinaryImage
                                        src={product.images?.[0]}
                                        alt={product.name}
                                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 mb-1 truncate">
                                        {product.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                                        {product.description}
                                    </p>
                                    <p className="text-lg font-bold text-emerald-600 mb-3">
                                        PKR {product.price?.toLocaleString()}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">
                                            Size: {product.size}
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openDetails(product)}
                                                className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => navigate(`/admin/custom-products/edit/${product._id}`)}
                                                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                                title="Edit Product"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product._id)}
                                                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Details SlideOver */}
            <SlideOver
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                title="Product Details"
                footer={
                    <div className="flex justify-between w-full">
                        <button
                            onClick={() => handleDelete(selectedProduct?._id)}
                            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                        >
                            <Trash2 size={16} />
                            Delete
                        </button>
                        <button
                            onClick={() => setDetailsOpen(false)}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                }
            >
                {selectedProduct && (
                    <div className="space-y-6">
                        <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-200">
                            <h3 className="font-bold text-lg text-gray-900 mb-2">
                                {selectedProduct.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {selectedProduct.description}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Price
                            </label>
                            <span className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-lg">
                                PKR {selectedProduct.price?.toLocaleString()}
                            </span>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sizes
                            </label>
                            <span className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-semibold">
                                {selectedProduct.size}
                            </span>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Product Images
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                {selectedProduct.images?.map((img, idx) => (
                                    <div key={idx} className="relative">
                                        <CloudinaryImage
                                            src={img}
                                            alt={`Product ${idx + 1}`}
                                            className="w-full h-48 object-contain rounded-xl border bg-gray-50"
                                            sizes="(max-width: 640px) 100vw, 300px"
                                        />
                                        <span className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-white/90 text-xs font-semibold text-gray-700">
                                            {idx === 0 ? "Front" : "Back"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Created</span>
                                <span className="font-medium">
                                    {new Date(selectedProduct.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </SlideOver>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, id: null })}
                onConfirm={confirmDelete}
                title="Delete Custom Product"
                message="Are you sure you want to delete this custom product? This action cannot be undone."
                confirmText="Delete Product"
                isDestructive={true}
                isLoading={deleting}
            />
        </div>
    );
}
