import SiomaLogo from '@/Components/SiomaLogo';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function ModernLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-600/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
            </div>

            {/* Ultra Modern Header */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                scrolled 
                    ? 'bg-black/80 backdrop-blur-xl shadow-2xl shadow-red-600/20' 
                    : 'bg-transparent'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link href="/dashboard" className="flex items-center group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-800 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative bg-gradient-to-r from-red-600 to-red-800 p-3 rounded-2xl shadow-2xl group-hover:scale-105 transition-transform">
                                    <SiomaLogo size="small" />
                                </div>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-6">
                            <Link 
                                href={route('dashboard')} 
                                className="relative px-4 py-2 text-gray-300 hover:text-white transition-colors group"
                            >
                                <span className="relative z-10">Dashboard</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/10 to-red-600/0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </Link>
                            
                            {/* User Menu */}
                            <div className="flex items-center gap-3 ml-4">
                                <div className="text-right hidden lg:block">
                                    <p className="text-sm font-semibold text-white">{user.name}</p>
                                    <p className="text-xs text-gray-400">{user.email}</p>
                                </div>
                                
                                <div className="relative group">
                                    <button className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-red-600/50 hover:shadow-2xl hover:shadow-red-600/70 transition-all hover:scale-110">
                                        {user.name.charAt(0).toUpperCase()}
                                        <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </button>
                                    
                                    {/* Dropdown */}
                                    <div className="absolute right-0 mt-3 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right">
                                        <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/50 border border-gray-800 overflow-hidden">
                                            <Link 
                                                href={route('profile.edit')} 
                                                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-red-600/20 transition-colors"
                                            >
                                                <span className="text-xl">👤</span>
                                                <span className="font-medium">Mi Perfil</span>
                                            </Link>
                                            <Link 
                                                href={route('logout')} 
                                                method="post" 
                                                as="button"
                                                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-red-600/20 transition-colors w-full text-left border-t border-gray-800"
                                            >
                                                <span className="text-xl">🚪</span>
                                                <span className="font-medium">Cerrar Sesión</span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <button 
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden relative w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-xl"
                        >
                            <div className="relative w-6 h-6 flex flex-col justify-center items-center">
                                <span className={`absolute w-6 h-0.5 bg-white transition-all ${mobileMenuOpen ? 'rotate-45' : '-translate-y-2'}`}></span>
                                <span className={`absolute w-6 h-0.5 bg-white transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
                                <span className={`absolute w-6 h-0.5 bg-white transition-all ${mobileMenuOpen ? '-rotate-45' : 'translate-y-2'}`}></span>
                            </div>
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    <div className={`md:hidden transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'max-h-96 pb-6' : 'max-h-0'}`}>
                        <div className="space-y-2 pt-4">
                            <Link 
                                href={route('dashboard')} 
                                className="block px-4 py-3 rounded-xl bg-red-600/10 text-white font-medium hover:bg-red-600/20 transition-colors"
                            >
                                Dashboard
                            </Link>
                            <div className="border-t border-gray-800 pt-4 mt-4">
                                <div className="px-4 py-2">
                                    <p className="text-sm font-semibold text-white">{user.name}</p>
                                    <p className="text-xs text-gray-400">{user.email}</p>
                                </div>
                                <Link 
                                    href={route('profile.edit')} 
                                    className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-red-600/10 transition-colors rounded-xl mt-2"
                                >
                                    👤 Mi Perfil
                                </Link>
                                <Link 
                                    href={route('logout')} 
                                    method="post" 
                                    as="button"
                                    className="block w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-red-600/10 transition-colors rounded-xl"
                                >
                                    🚪 Cerrar Sesión
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Header */}
            {header && (
                <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Premium Badge */}
                        <div className="flex justify-center mb-8 animate-fadeInDown">
                            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-xl border border-blue-500/30 shadow-2xl shadow-blue-600/20">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <span className="text-sm font-bold text-white">✨ Sistema Premium de Gestión Agrícola</span>
                            </div>
                        </div>

                        {/* Main Header */}
                        <div className="text-center mb-12 space-y-6 animate-fadeInUp">
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black">
                                <span className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 bg-clip-text text-transparent">
                                    {header}
                                </span>
                            </h1>
                            <p className="text-xl sm:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
                                Supervisa y optimiza tus operaciones de campo con 
                                <span className="text-white font-bold"> datos precisos en tiempo real</span>.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4 pt-6">
                                <Link 
                                    href="#features" 
                                    className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold shadow-2xl shadow-red-600/50 hover:shadow-red-600/70 transition-all hover:scale-105 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                                    <span className="relative flex items-center gap-2">
                                        🚀 <span>Comenzar Ahora</span>
                                    </span>
                                </Link>
                                <a 
                                    href="#stats" 
                                    className="px-8 py-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white font-bold hover:bg-white/10 transition-all hover:scale-105"
                                >
                                    📊 Ver Estadísticas
                                </a>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div id="stats" className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mt-16">
                            {[
                                { icon: '🌾', value: '650+', label: 'Fincas Activas', color: 'from-emerald-600 to-green-600' },
                                { icon: '🌎', value: '7', label: 'Países', color: 'from-blue-600 to-cyan-600' },
                                { icon: '📊', value: '120K+', label: 'Hectáreas', color: 'from-purple-600 to-pink-600' },
                                { icon: '✅', value: '99.9%', label: 'Precisión', color: 'from-orange-600 to-red-600' }
                            ].map((stat, idx) => (
                                <div 
                                    key={idx} 
                                    className="group relative p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all hover:scale-105 animate-fadeInUp"
                                    style={{animationDelay: `${idx * 100}ms`}}
                                >
                                    <div className="text-center">
                                        <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{stat.icon}</div>
                                        <div className={`text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                                            {stat.value}
                                        </div>
                                        <div className="text-sm font-semibold text-gray-400">{stat.label}</div>
                                    </div>
                                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity blur-xl`}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                {children}
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/10 bg-black/50 backdrop-blur-xl mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center text-gray-400 text-sm">
                        <p className="font-semibold text-white mb-2">SIOMA © 2025</p>
                        <p>Tecnología de vanguardia para la agricultura del futuro</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

