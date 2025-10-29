import ApplicationLogo from '@/Components/ApplicationLogo';
import SiomaLogo from '@/Components/SiomaLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
            {/* Header Premium con fondo rojo de Sioma */}
            <nav className="bg-gradient-to-r from-[#A51C24] via-[#8B1538] to-[#A51C24] border-b-4 border-[#8B1538] shadow-2xl sticky top-0 z-50 backdrop-blur-sm animate-fadeInDown">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-20 justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="flex items-center hover:opacity-90 transition-opacity">
                                <SiomaLogo size="default" />
                            </Link>
                            
                            <div className="hidden md:flex items-center gap-1 ml-6">
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                    className="text-white/90 hover:text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                                    activeClassName="bg-white/10 text-white"
                                >
                                    Dashboard
                                </NavLink>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-3">
                            <div className="text-white/80 text-sm">
                                Bienvenido, <span className="font-bold text-white">{user.name}</span>
                            </div>
                            <div className="relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all duration-200 backdrop-blur-sm"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link href={route('profile.edit')} className="flex items-center gap-2">
                                            <span>👤</span> Perfil
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('logout')} method="post" as="button" className="flex items-center gap-2">
                                            <span>🚪</span> Cerrar Sesión
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="flex items-center md:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-xl p-3 text-white transition-all duration-200 hover:bg-white/20"
                            >
                                <svg className="h-7 w-7" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path
                                        className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' md:hidden bg-white/95 backdrop-blur-sm'}>
                    <div className="space-y-1 pb-4 pt-2 px-2">
                        <ResponsiveNavLink
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                            className="text-[var(--brand-primary)] font-semibold"
                        >
                            Dashboard
                        </ResponsiveNavLink>
                    </div>

                    <div className="border-t-2 border-gray-200 pb-2 pt-4">
                        <div className="px-4 mb-3">
                            <div className="text-base font-bold text-[var(--brand-text)]">
                                {user.name}
                            </div>
                            <div className="text-sm font-medium text-[var(--brand-muted)]">
                                {user.email}
                            </div>
                        </div>

                        <div className="space-y-1 px-2">
                            <ResponsiveNavLink href={route('profile.edit')} className="flex items-center gap-2 text-[var(--brand-text)] font-semibold">
                                👤 Perfil
                            </ResponsiveNavLink>
                            <ResponsiveNavLink method="post" href={route('logout')} as="button" className="flex items-center gap-2 text-red-600 font-semibold">
                                🚪 Cerrar Sesión
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10 mb-8">
                    {/* Badge Premium */}
                    <div className="flex justify-center mb-6 animate-fadeInDown delay-100">
                        <div className="badge-premium animate-float">
                            <span className="status-online"></span>
                            <span>✨ Sistema de Gestión Agrícola Premium</span>
                        </div>
                    </div>

                    <div className="hero animate-scaleIn delay-200">
                        <div className="hero-inner">
                            <div className="flex-1 animate-slideInLeft delay-300">
                                <h1 className="hero-title">
                                    {header}
                                </h1>
                                <p className="hero-subtitle">
                                    Supervisa y optimiza tus operaciones de campo con <span className="font-bold text-white">datos confiables y precisos</span>. 
                                    Más de <span className="font-black text-yellow-300">650 fincas</span> en <span className="font-black text-yellow-300">7 países</span> han mejorado su productividad con nuestra tecnología de vanguardia.
                                </p>
                                <div className="flex flex-wrap gap-4 mt-8">
                                    <Link href={route('dashboard')} className="btn-primary group">
                                        <span className="text-xl">🚀</span>
                                        <span>COMENZAR AHORA</span>
                                        <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Link>
                                    <a href="#features" className="btn-secondary group">
                                        <span className="text-xl">📚</span>
                                        <span>Ver Características</span>
                                    </a>
                                </div>
                            </div>
                            
                            <div className="flex-shrink-0 hidden lg:block animate-slideInRight delay-400">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="stats-card hover-lift animate-fadeInUp delay-400">
                                        <div className="stats-number">650+</div>
                                        <div className="stats-label">🌾 Fincas Activas</div>
                                    </div>
                                    <div className="stats-card hover-lift animate-fadeInUp delay-500">
                                        <div className="stats-number">7</div>
                                        <div className="stats-label">🌎 Países</div>
                                    </div>
                                    <div className="stats-card hover-lift animate-fadeInUp delay-600">
                                        <div className="stats-number">120K+</div>
                                        <div className="stats-label">📊 Hectáreas</div>
                                    </div>
                                    <div className="stats-card hover-lift animate-fadeInUp delay-700">
                                        <div className="stats-number">99.9%</div>
                                        <div className="stats-label">✅ Precisión</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Elementos decorativos mejorados */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-48 translate-x-48 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-yellow-500/10 to-transparent rounded-full translate-y-40 -translate-x-40 blur-3xl"></div>
                        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                    </div>
                </header>
            )}

            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">{children}</main>
        </div>
    );
}
