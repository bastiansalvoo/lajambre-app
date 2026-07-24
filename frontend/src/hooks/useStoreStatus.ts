import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';

// Estado de apertura del local (cierre manual del admin, ademas del horario
// automatico). Se revalida cada 30s para detectar un cierre mientras el
// cliente ya esta navegando el menu/carrito.
export function useStoreStatus() {
  const { data, isLoading } = useQuery({
    queryKey: ['store-status'],
    queryFn: async () => {
      const response = await api.get('/store/status');
      return response.data as { isOpen: boolean };
    },
    refetchInterval: 30000,
  });

  return { isOpen: data?.isOpen ?? true, isLoading };
}
