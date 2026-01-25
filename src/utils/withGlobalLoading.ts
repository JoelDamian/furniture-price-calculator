import { useLoadingStore } from '../store/loadingStore';

export async function withGlobalLoading<T>(fn: () => Promise<T>): Promise<T> {
  const { startLoading, stopLoading } = useLoadingStore.getState();
  startLoading();
  try {
    return await fn();
  } finally {
    stopLoading();
  }
}

