/**
 * Comparte texto con la Web Share API y, si no está disponible,
 * copia el mensaje con enlace al portapapeles.
 *
 * Devuelve: 'compartido' | 'copiado' | 'cancelado' | 'no-disponible'.
 */
export const compartirTexto = async ({ titulo, texto, url }) => {
    const enlace = url ?? (typeof window !== 'undefined' ? window.location.origin : '');
    const mensaje = enlace ? `${texto}\n${enlace}` : texto;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
            await navigator.share({ title: titulo, text: texto, url: enlace });
            return 'compartido';
        } catch (error) {
            if (error?.name === 'AbortError') return 'cancelado';
            // Si el navegador rechaza compartir, se intenta copiar.
        }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        const enfocado = typeof document === 'undefined' || document.hasFocus();
        if (enfocado) {
            try {
                await Promise.race([
                    navigator.clipboard.writeText(mensaje),
                    new Promise((_, rechazar) => setTimeout(() => rechazar(new Error('tiempo agotado')), 1500)),
                ]);
                return 'copiado';
            } catch {
                // Sin permisos de portapapeles o sin foco.
            }
        }
    }

    return 'no-disponible';
};
