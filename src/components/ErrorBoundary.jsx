import React from 'react';
import Icono from './Icono.jsx';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('Error no controlado en la app:', error, info);
    }

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <div className="min-h-screen bg-orange-50 flex items-center justify-center p-6">
                <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-amber-300 p-6 text-center shadow-xl">
                    <div className="flex justify-center mb-3">
                        <Icono nombre="alert" className="w-10 h-10 text-red-600" />
                    </div>
                    <h1 className="text-xl font-black text-amber-950">Algo salió mal</h1>
                    <p className="text-xs text-amber-800 mt-2 mb-5 leading-relaxed">
                        La app encontró un error inesperado. Tu progreso guardado no se pierde.
                    </p>

                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 rounded-2xl text-sm shadow-md cursor-pointer"
                        >
                            Recargar la app
                        </button>
                        <button
                            type="button"
                            onClick={() => { window.location.href = '/'; }}
                            className="w-full bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold py-3 rounded-2xl border border-amber-300 text-sm cursor-pointer"
                        >
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
