import React, { useState } from 'react';
import { auth, db } from '../firebaseConfig';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function LoginModal({ user, onClose }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [mensajeExito, setMensajeExito] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMensajeExito('');
        setLoading(true);

        try {
            if (isResetting) {
                await sendPasswordResetEmail(auth, email);
                setMensajeExito('¡Correo enviado! Revisa tu bandeja de entrada para restablecer tu contraseña.');
                setLoading(false);
                return;
            } else if (isRegistering) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const newUser = userCredential.user;

                await setDoc(doc(db, 'usuarios', newUser.uid), {
                    email: newUser.email,
                    totopos: 0,
                    avatar: 'default',
                    createdAt: new Date()
                });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            onClose();
        } catch (err) {
            console.error(err);
            if (isResetting) {
                setError('No se pudo enviar el correo. Verifica que el correo esté registrado.');
            } else {
                setError('Ocurrió un error. Verifica tus datos o contraseña.');
            }
        } finally {
            if (!isResetting) {
                setLoading(false);
            }
        }
    };

    // 🌟 Google Login con Popup optimizado para capturar el error exacto si ocurre
    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        const provider = new GoogleAuthProvider();
        
        // Forzar selección de cuenta para evitar problemas de caché en móviles
        provider.setCustomParameters({
            prompt: 'select_account'
        });

        try {
            const result = await signInWithPopup(auth, provider);
            const googleUser = result.user;

            const userDocRef = doc(db, 'usuarios', googleUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                await setDoc(userDocRef, {
                    email: googleUser.email,
                    totopos: 0,
                    avatar: 'default',
                    createdAt: new Date()
                });
            }

            onClose();
        } catch (err) {
            console.error("Error detallado en Google Login:", err);
            
            // Mensajes personalizados basados en el error real de Firebase
            if (err.code === 'auth/popup-blocked') {
                setError('El navegador bloqueó la ventana emergente. Permite las ventanas emergentes para iniciar sesión.');
            } else if (err.code === 'auth/popup-closed-by-user') {
                setError('Ventana cerrada. Cancelaste el inicio de sesión.');
            } else if (err.code === 'auth/unauthorized-domain') {
                setError('Dominio no autorizado en Firebase. Agrega tu dominio actual en la consola de Firebase.');
            } else {
                setError(`Error de Google (${err.code || 'desconocido'}): ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            onClose();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-amber-50 rounded-2xl shadow-2xl border-4 border-amber-600 w-full max-w-md p-6 relative animate-fade-in">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-amber-800 hover:text-amber-950 font-bold text-xl w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                    ✕
                </button>

                {user ? (
                    <div className="text-center py-6">
                        <div className="w-20 h-20 bg-amber-600 rounded-full mx-auto flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-md">
                            {user.email ? user.email[0].toUpperCase() : 'U'}
                        </div>
                        <h2 className="text-2xl font-bold text-amber-900 mb-1">¡Hola de nuevo!</h2>
                        <p className="text-amber-700 text-sm mb-6">{user.email}</p>

                        <div className="bg-amber-100 rounded-xl p-4 mb-6 border border-amber-300">
                            <p className="text-amber-800 font-semibold">Tus Totopos acumulados:</p>
                            <p className="text-3xl font-black text-amber-600 mt-1">🌽 0</p>
                            <p className="text-xs text-amber-600 mt-1">(Próximamente tienda de avatares y colores)</p>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform transform active:scale-95 cursor-pointer"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                ) : (
                    <div>
                        <h2 className="text-2xl font-black text-amber-900 text-center mb-2">
                            {isResetting
                                ? 'Recuperar Contraseña 🔑'
                                : isRegistering
                                ? 'Crear Cuenta 🌽'
                                : 'Iniciar Sesión 🌽'}
                        </h2>
                        <p className="text-amber-700 text-center text-sm mb-6">
                            {isResetting
                                ? 'Introduce tu correo electrónico y te enviaremos un enlace para cambiar tu contraseña.'
                                : isRegistering
                                ? 'Regístrate para guardar tu progreso y ganar totopos en cada juego.'
                                : 'Accede a tu perfil para conservar tus logros y personalizar tu experiencia.'}
                        </p>

                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        {mensajeExito && (
                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
                                {mensajeExito}
                            </div>
                        )}

                        {/* 🌟 BOTÓN DE GOOGLE */}
                        {!isResetting && (
                            <div className="mb-4">
                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-3 bg-white border-2 border-amber-300 hover:bg-amber-100 text-amber-900 font-bold py-3 px-4 rounded-xl shadow-sm transition-transform transform active:scale-95 text-sm cursor-pointer disabled:opacity-50"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                    </svg>
                                    Continuar con Google
                                </button>

                                <div className="relative flex py-3 items-center">
                                    <div className="flex-grow border-t border-amber-300"></div>
                                    <span className="flex-shrink mx-4 text-amber-700 text-xs font-bold uppercase">o con correo</span>
                                    <div className="flex-grow border-t border-amber-300"></div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-amber-900 font-semibold text-sm mb-1">Correo electrónico</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-600 bg-white text-amber-900"
                                    placeholder="tucorreo@ejemplo.com"
                                />
                            </div>

                            {!isResetting && (
                                <div>
                                    <label className="block text-amber-900 font-semibold text-sm mb-1">Contraseña</label>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-600 bg-white text-amber-900"
                                        placeholder="••••••••"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform transform active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                {loading
                                    ? 'Enviando...'
                                    : isResetting
                                    ? 'Enviar Enlace de Recuperación'
                                    : isRegistering
                                    ? 'Registrarse'
                                    : 'Entrar'}
                            </button>
                        </form>

                        <div className="mt-6 flex flex-col gap-2 text-center text-sm">
                            {!isResetting && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsResetting(true);
                                        setError('');
                                        setMensajeExito('');
                                    }}
                                    className="text-amber-800 hover:text-amber-950 font-semibold underline cursor-pointer"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    if (isResetting) {
                                        setIsResetting(false);
                                    } else {
                                        setIsRegistering(!isRegistering);
                                    }
                                    setError('');
                                    setMensajeExito('');
                                }}
                                className="text-amber-800 hover:text-amber-950 font-semibold underline cursor-pointer"
                            >
                                {isResetting
                                    ? '← Volver al inicio de sesión'
                                    : isRegistering
                                    ? '¿Ya tienes cuenta? Inicia sesión'
                                    : '¿No tienes cuenta? Regístrate aquí'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}