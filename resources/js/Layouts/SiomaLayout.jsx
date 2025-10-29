import SiomaLogo from '@/Components/SiomaLogo';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';
import { faFacebookF, faInstagram, faLinkedinIn } from '@fortawesome/free-brands-svg-icons';

export default function SiomaLayout({ children }) {
    const user = usePage().props.auth.user;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white">
            {/* Header Exacto de SIOMA */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#A51C24]">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="flex items-center justify-between h-[70px]">
                        {/* Logo */}
                        <Link href="/dashboard" className="flex items-center">
                            <SiomaLogo size="default" />
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center gap-8">
                            <Link href={route('dashboard')} className="text-white hover:text-white/80 font-black text-[13px] uppercase tracking-wide transition-colors">
                                INICIO
                            </Link>
                            
                            <div className="relative group">
                                <button className="flex items-center gap-1 text-white hover:text-white/80 font-black text-[13px] uppercase tracking-wide transition-colors">
                                    <span>TECNOLOGÍAS</span>
                                    <svg className="w-4 h-4 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            <div className="relative group">
                                <button className="flex items-center gap-1 text-white hover:text-white/80 font-black text-[13px] uppercase tracking-wide transition-colors">
                                    <span>CULTIVOS</span>
                                    <svg className="w-4 h-4 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            <Link href="#testimonios" className="text-white hover:text-white/80 font-black text-[13px] uppercase tracking-wide transition-colors">
                                TESTIMONIOS
                            </Link>

                            <Link href="#quienes-somos" className="text-white hover:text-white/80 font-black text-[13px] uppercase tracking-wide transition-colors">
                                ¿QUIÉNES SOMOS?
                            </Link>

                            <Link href="#blog" className="text-white hover:text-white/80 font-black text-[13px] uppercase tracking-wide transition-colors">
                                BLOG
                            </Link>

                            <Link href="#contacto" className="text-white hover:text-white/80 font-black text-[13px] uppercase tracking-wide transition-colors">
                                CONTACTO
                            </Link>

                            {/* User Menu */}
                            <div className="relative group">
                                <button className="flex items-center gap-1 text-white hover:text-white/80 font-black text-[13px] uppercase tracking-wide transition-colors">
                                    <span>INICIA SESIÓN</span>
                                    <svg className="w-4 h-4 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                
                                <div className="absolute right-0 top-full mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                    <div className="bg-white rounded-lg shadow-2xl py-2 border border-gray-200">
                                        <div className="px-4 py-2 border-b border-gray-100">
                                            <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                        <Link href={route('profile.edit')} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                                            <span>👤</span>
                                            <span className="font-semibold text-sm">Mi Perfil</span>
                                        </Link>
                                        <Link href={route('logout')} method="post" as="button" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors w-full text-left border-t border-gray-100">
                                            <span>🚪</span>
                                            <span className="font-semibold text-sm">Cerrar Sesión</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Language Selector */}
                            <div className="relative group">
                                <button className="flex items-center gap-1 text-white hover:text-white/80 transition-colors">
                                    <span className="text-lg">🇨🇴</span>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            {/* Social Icons */}
                            <div className="flex items-center gap-3 pl-4 border-l border-white/20">
                                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/80 transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                    </svg>
                                </a>
                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/80 transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                    </svg>
                                </a>
                                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/80 transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                    </svg>
                                </a>
                                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/80 transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <button 
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden text-white p-2"
                        >
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden pb-4 space-y-1">
                            <Link href={route('dashboard')} className="block px-4 py-3 text-white hover:bg-white/10 font-bold text-sm uppercase tracking-wide">
                                INICIO
                            </Link>
                            <Link href="#tecnologias" className="block px-4 py-3 text-white hover:bg-white/10 font-bold text-sm uppercase tracking-wide">
                                TECNOLOGÍAS
                            </Link>
                            <Link href="#testimonios" className="block px-4 py-3 text-white hover:bg-white/10 font-bold text-sm uppercase tracking-wide">
                                TESTIMONIOS
                            </Link>
                            <div className="border-t border-white/20 mt-3 pt-3">
                                <div className="px-4 py-2">
                                    <p className="text-white font-bold text-sm">{user.name}</p>
                                    <p className="text-white/70 text-xs">{user.email}</p>
                                </div>
                                <Link href={route('profile.edit')} className="block px-4 py-3 text-white hover:bg-white/10">
                                    👤 Mi Perfil
                                </Link>
                                <Link href={route('logout')} method="post" as="button" className="block w-full text-left px-4 py-3 text-white hover:bg-white/10">
                                    🚪 Cerrar Sesión
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-16 lg:pt-20">
                {children}
            </main>

            {/* Footer Estilo SIOMA */}
            <footer className="bg-[#A51C24] text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="font-black text-xl mb-4">SIOMA</h3>
                            <p className="text-white/80 text-sm leading-relaxed">
                                Tecnología de vanguardia para la agricultura del futuro
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-4">Contacto</h4>
                            <p className="text-white/80 text-sm flex items-center gap-2">
                                <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4" />
                                info@sioma.app
                            </p>
                            <p className="text-white/80 text-sm flex items-center gap-2 mt-2">
                                <FontAwesomeIcon icon={faPhone} className="w-4 h-4" />
                                +57 300 409 7627
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-4">Síguenos</h4>
                            <div className="flex gap-4">
                                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                                    <FontAwesomeIcon icon={faFacebookF} className="w-5 h-5 text-white" />
                                </a>
                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                                    <FontAwesomeIcon icon={faInstagram} className="w-5 h-5 text-white" />
                                </a>
                                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                                    <FontAwesomeIcon icon={faLinkedinIn} className="w-5 h-5 text-white" />
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/80 text-sm">
                        <p>© 2025 SIOMA. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>

            {/* WhatsApp Button */}
            <a 
                href="https://wa.me/573004097627" 
                target="_blank" 
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110"
            >
                <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
            </a>
        </div>
    );
}

