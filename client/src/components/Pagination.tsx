import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="flex items-center justify-center gap-2 py-8">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-12 h-12 glass rounded-xl flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-secondary transition-all"
            >
                <ChevronLeft size={20} />
            </button>

            {pages.map(page => {
                // Show first, last, and current +/- 1
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={cn(
                                "w-12 h-12 rounded-xl transition-all font-black text-sm",
                                currentPage === page
                                    ? "bg-primary text-white shadow-xl shadow-primary/30"
                                    : "glass hover:bg-secondary"
                            )}
                        >
                            {page}
                        </button>
                    );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2 font-black text-muted-foreground">...</span>;
                }
                return null;
            })}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-12 h-12 glass rounded-xl flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-secondary transition-all"
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
};

export default Pagination;
