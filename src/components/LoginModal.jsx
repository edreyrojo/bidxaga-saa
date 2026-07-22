import React, { useState } from 'react';
import { auth, db } from '../firebaseConfig';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function LoginModal({ user, onClose }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [isResetting, setIsResetting] = useState(false); // 🔑 Estado para el panel de recuperación
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
                // Enviar correo de recuperación de contraseña
                await sendPasswordResetEmail(auth, email);
                setMensajeExito('¡Correo enviado! Revisa tu bandeja de entrada para restablecer tu contraseña.');
                setLoading(false);
                return;
            } else if (isRegistering) {
                // Registrar nuevo usuario
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const newUser = userCredential.user;

                // Crear documento inicial en Firestore para su economía virtual (Totopos)
                await setDoc(doc(db, 'usuarios', newUser.uid), {
                    email: newUser.email,
                    totopos: 0,
                    avatar: 'default',
                    createdAt: new Date()
                });
            } else {
                // Iniciar sesión
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
                    className="absolute top-4 right-4 text-amber-800 hover:text-amber-950 font-bold text-xl w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center transition-colors"
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
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform transform active:scale-95"
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
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform transform active:scale-95 disabled:opacity-50"
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
                                    className="text-amber-800 hover:text-amber-950 font-semibold underline"
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
                                className="text-amber-800 hover:text-amber-950 font-semibold underline"
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