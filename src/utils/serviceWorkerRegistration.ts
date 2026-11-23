export interface ServiceWorkerRegistrationLike {
  update: () => Promise<void>;
  unregister: () => Promise<boolean>;
}

export interface ServiceWorkerContainerLike {
  controller: unknown;
  register: (
    scriptURL: string,
    options?: RegistrationOptions
  ) => Promise<ServiceWorkerRegistrationLike>;
  getRegistrations: () => Promise<readonly ServiceWorkerRegistrationLike[]>;
  addEventListener: (type: string, listener: () => void) => void;
}

export interface CacheStorageLike {
  keys: () => Promise<string[]>;
  delete: (cacheName: string) => Promise<boolean>;
}

export interface ConfigureServiceWorkerParams {
  isDev: boolean;
  serviceWorker?: ServiceWorkerContainerLike | null;
  cachesStorage?: CacheStorageLike | null;
  onReload?: () => void;
  swUrl?: string;
}

export interface ConfigureServiceWorkerResult {
  mode: 'development' | 'production' | 'unsupported';
  unregisteredCount: number;
  deletedCaches: string[];
  registered: boolean;
  reloaded: boolean;
}

export async function configureServiceWorker({
  isDev,
  serviceWorker,
  cachesStorage,
  onReload,
  swUrl = '/sw.js',
}: ConfigureServiceWorkerParams): Promise<ConfigureServiceWorkerResult> {
  if (!serviceWorker) {
    return {
      mode: 'unsupported',
      unregisteredCount: 0,
      deletedCaches: [],
      registered: false,
      reloaded: false,
    };
  }

  if (isDev) {
    const hadController = Boolean(serviceWorker.controller);
    let unregisteredCount = 0;
    const deletedCaches: string[] = [];

    try {
      const registrations = await serviceWorker.getRegistrations();
      const results = await Promise.all(
        registrations.map((registration) => registration.unregister().catch(() => false))
      );
      unregisteredCount = results.filter(Boolean).length;
    } catch {
      // Ignore unregister errors in restricted browser contexts
    }

    if (cachesStorage) {
      try {
        const keys = await cachesStorage.keys();
        const targetKeys = keys.filter((key) => key.startsWith('akujin-offline'));
        await Promise.all(
          targetKeys.map(async (key) => {
            const removed = await cachesStorage.delete(key).catch(() => false);
            if (removed) deletedCaches.push(key);
          })
        );
      } catch {
        // Ignore cache storage errors
      }
    }

    let reloaded = false;
    if (hadController && unregisteredCount > 0 && onReload) {
      reloaded = true;
      onReload();
    }

    return {
      mode: 'development',
      unregisteredCount,
      deletedCaches,
      registered: false,
      reloaded,
    };
  }

  const hadController = Boolean(serviceWorker.controller);
  let refreshing = false;

  serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !refreshing) {
      refreshing = true;
      onReload?.();
    }
  });

  try {
    const registration = await serviceWorker.register(swUrl, {
      updateViaCache: 'none',
    });
    await registration.update().catch(() => {});
    return {
      mode: 'production',
      unregisteredCount: 0,
      deletedCaches: [],
      registered: true,
      reloaded: false,
    };
  } catch {
    return {
      mode: 'production',
      unregisteredCount: 0,
      deletedCaches: [],
      registered: false,
      reloaded: false,
    };
  }
}

export function initServiceWorker(isDev: boolean): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const run = () => {
    const cachesStorage = typeof caches !== 'undefined' ? caches : null;
    void configureServiceWorker({
      isDev,
      serviceWorker: navigator.serviceWorker as unknown as ServiceWorkerContainerLike,
      cachesStorage,
      onReload: () => {
        const reloadGuardKey = 'akujin_sw_dev_reloaded';
        try {
          if (isDev && sessionStorage.getItem(reloadGuardKey) === '1') {
            return;
          }
          if (isDev) {
            sessionStorage.setItem(reloadGuardKey, '1');
          }
        } catch {
          // Ignore sessionStorage errors
        }
        window.location.reload();
      },
    });
  };

  if (document.readyState === 'complete') {
    run();
  } else {
    window.addEventListener('load', run, { once: true });
  }
}
