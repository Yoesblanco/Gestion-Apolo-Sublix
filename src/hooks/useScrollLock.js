import { useEffect } from 'react';

/**
 * useScrollLock — bloquea el scroll del body mientras algún modal está abierto.
 * @param {boolean} isLocked - true cuando cualquier modal está visible
 */
const useScrollLock = (isLocked) => {
  useEffect(() => {
    if (isLocked) {
      // Guarda la posición actual para no saltar al top al desbloquear
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      // Restaura la posición de scroll exacta
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    // Limpieza por si el componente se desmonta con modal abierto
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isLocked]);
};

export default useScrollLock;
