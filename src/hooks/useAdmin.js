import { useEffect, useState } from 'react';

/**
 * Determina si el usuario es administrador usando:
 * 1. El custom claim `admin` del token.
 * 2. El campo `role` del documento del usuario (fallback).
 *
 * `rolDocumento` evita una lectura extra si App ya cargó el perfil.
 */
export function useAdmin(user, rolDocumento) {
    const [estado, setEstado] = useState(() => ({
        esAdmin: rolDocumento === 'admin',
        esAdminClaim: false,
        verificando: Boolean(user),
    }));

    useEffect(() => {
        let activo = true;

        if (!user) {
            setEstado({ esAdmin: false, esAdminClaim: false, verificando: false });
            return undefined;
        }

        setEstado((previo) => ({
            esAdmin: rolDocumento === 'admin' || previo.esAdmin,
            esAdminClaim: previo.esAdminClaim,
            verificando: true,
        }));

        user.getIdTokenResult()
            .then((token) => {
                if (!activo) return;
                const claim = token.claims?.admin === true;
                setEstado({
                    esAdmin: claim || rolDocumento === 'admin',
                    esAdminClaim: claim,
                    verificando: false,
                });
            })
            .catch(() => {
                if (!activo) return;
                setEstado({
                    esAdmin: rolDocumento === 'admin',
                    esAdminClaim: false,
                    verificando: false,
                });
            });

        return () => { activo = false; };
    }, [user, rolDocumento]);

    return estado;
}
