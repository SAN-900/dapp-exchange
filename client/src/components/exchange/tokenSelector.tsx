import { TokenInfo } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import LazyTokenImage from "../lazy_image_loading";

type TokenSelectorProps = {
  open: boolean;
  onClose: () => void;
  tokens: TokenInfo[];
  selectedToken: TokenInfo | null;
  onSelect: (token: TokenInfo) => void;
};

export default function TokenSelector({
    open,
    onClose,
    onSelect,
    tokens,
    selectedToken,
}: TokenSelectorProps) {
    const [query, setQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on esc
    useEffect(() => { 
        if(!open) return;
        const onKey = (e: KeyboardEvent) => {
            if(e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    // close on click outside
    useEffect(() => {
        if(!open) return;
        const onClickOutside = (e: MouseEvent) => {
            if(containerRef.current && !containerRef.current.contains(e.target as Node)) onClose();
        }
        window.addEventListener("mousedown", onClickOutside);
        return () => window.removeEventListener("mousedown", onClickOutside);
    }, [open, onClose]);

    // Filter tokens based on query
    const filteredTokens = useMemo(() => {
        const q = query.toLowerCase();
        return tokens.filter((t) => t.symbol.toLowerCase().includes(q) || t.name?.toLowerCase().includes(q));
    }, [query, tokens]);

    if(!open) return null;

return (
    <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={onClose}
        />
        {/* Modal Container */}
        <div className="relative flex items-center justify-center w-full h-full">
            <div ref={containerRef} className="w-[420px] max-h-[80vh] overflow-hidden shadow-2xl rounded-xl">
                {/* Search bar */}
                <div className="bg-transparent">
                    <input
                        placeholder="Search token" 
                        value={query} 
                        onChange={(e) => setQuery(e.target.value)} 
                        className="w-full focus:outline-none focus:ring-0 pl-4 h-16 bg-transparent text-gray-900/75 dark:text-white dark:placeholder:text-gray-400 placeholder:text-gray-900/75"
                    />
                </div>

                {/* Token list */}
                <div className="max-h-[65vh] overflow-y-auto">
                    {filteredTokens.map((token) => {
                        const isSelected = token.id === selectedToken?.id;

                        return (
                            <div 
                                key={token.id}
                                onClick={() => {
                                    onSelect(token);
                                    onClose();
                                }}
                                className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-800 ${isSelected ? "bg-slate-300 dark:bg-slate-800" : ""}`}
                            >
                                <div className="flex items-center gap-2">
                                    <LazyTokenImage
                                        src={token.icon}
                                        alt={token.symbol}
                                    />
                                </div>
                                <div className="flex items-end flex-col font-semibold">
                                    <span className="text-gray-700 dark:text-white">{token.symbol}</span>
                                    <span className="text-gray-400 text-xs">{token.name}</span>
                                </div>
                            </div>
                        );
                    })}
                    {filteredTokens.length === 0 && ( 
                        <div className="px-4 py-6 text-center text-sm text-gray-400">
                            No tokens found
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
)
}