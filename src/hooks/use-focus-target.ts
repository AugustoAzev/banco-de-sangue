'use client';

import { useEffect, useState } from 'react';

/**
 * Move o foco para o elemento com o `id` informado depois da próxima renderização.
 *
 * Usado ao abrir um formulário (foco no primeiro campo) e ao fechá-lo (foco de volta
 * no botão que o abriu). Sem isso, quem navega por teclado ou leitor de tela fica com
 * o foco "perdido" no topo da página quando o elemento focado some (WCAG 2.4.3).
 */
export function useFocusTarget(): (id: string) => void {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    document.getElementById(target)?.focus();
    setTarget(null);
  }, [target]);

  return setTarget;
}
