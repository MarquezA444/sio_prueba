export default function SiomaLogo({ className = '', size = 'default' }) {
    const sizeClasses = {
        small: 'h-12',
        default: 'h-16',
        large: 'h-24',
    };

    return (
        <div className={`flex items-center ${className}`}>
            {/* Logo oficial de SIOMA */}
            <img
                src="/images/Adobe Express - file (2).png"
                alt="SIOMA - Sistema de Gestión Agrícola"
                className={`${sizeClasses[size]} w-auto object-contain select-none transition-transform hover:scale-105 duration-300`}
                onError={(e) => {
                    // Fallback: mostrar texto SIOMA si la imagen no carga
                    const fallback = document.createElement('div');
                    fallback.className = 'flex items-center gap-2';
                    fallback.innerHTML = `
                        <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                            </svg>
                        </div>
                        <span class="text-white font-black text-xl sm:text-2xl tracking-tight">SIOMA</span>
                    `;
                    e.currentTarget.parentNode.replaceChild(fallback, e.currentTarget);
                }}
            />
        </div>
    );
}

