import React from 'react';
export default function SeccionColapsable({ icono, titulo, abierto, setAbierto, badge, children }) {
    return (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
            <button
                type="button"
                onClick={() => setAbierto(!abierto)}
                aria-expanded={abierto}
                className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-2 bg-amber-100/50 hover:bg-amber-100 active:bg-amber-200/60 transition-colors cursor-pointer"
            >
                <span className="font-black text-amber-900 text-sm sm:text-base flex items-center gap-2 min-w-0">
                    {icono && (
                        <img
                            src={icono}
                            alt=""
                            className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    )}
                    <span className="truncate">{titulo}</span>
                    {badge !== undefined && badge !== null && (
                        <span className="text-[10px] sm:text-[11px] bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                            {badge}
                        </span>
                    )}
                </span>
                <span className="text-amber-950 flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-white border border-amber-200 shadow-sm">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`}
                    >
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </span>
            </button>

            {abierto && (
                <div className="border-t border-amber-200 bg-amber-50/40 animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );
}