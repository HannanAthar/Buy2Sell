"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronDown, Search, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DesignerSearchBox({
  designers,
  active,
  onChange,
  onSelect,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = designers || [];
    const out = needle
      ? list.filter((d) => d.name.toLowerCase().includes(needle))
      : list;
    // Keep "All" at top if present
    const all = out.find((d) => d.name === "All");
    const rest = out.filter((d) => d.name !== "All");
    return all ? [all, ...rest] : rest;
  }, [designers, q]);

  const handleSelect = (name) => {
    if (onChange) onChange(name);
    if (onSelect) onSelect(name);
    setOpen(false);
    setQ("");
  };

  return (
    <div className="relative w-48" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 h-10 rounded-lg bg-white border border-gray-300 text-gray-800 hover:border-emerald-300 transition-colors shadow-sm"
      >
        <span className="truncate font-medium">{active || "Designer"}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute z-40 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-2 border-b bg-gray-50">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white border focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <Search className="h-4 w-4 text-gray-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search designer..."
                  className="w-full outline-none text-sm bg-transparent"
                  autoFocus
                />
              </div>
            </div>
            <ul className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
              {filtered.map((d) => (
                <li key={d.name}>
                  <button
                    className={`w-full text-left px-4 py-2 hover:bg-emerald-50 transition-colors ${
                      active === d.name
                        ? "bg-emerald-50 text-emerald-700 font-medium"
                        : "text-gray-700"
                    }`}
                    onClick={() => handleSelect(d.name)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="truncate">{d.name}</span>
                      <div className="flex items-center gap-1 ml-2">
                        {d.rating > 0 && (
                          <div className="flex items-center text-xs font-medium text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">
                            <span>{d.rating.toFixed(1)}</span>
                            <Star className="w-3 h-3 fill-amber-500 ml-0.5" />
                          </div>
                        )}
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                          {d.count}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
              {!filtered.length && (
                <li className="px-4 py-8 text-center text-sm text-gray-500">
                  No designer found
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
