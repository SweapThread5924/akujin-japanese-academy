import test from 'node:test';
import assert from 'node:assert/strict';
import {
  configureServiceWorker,
  type CacheStorageLike,
  type ServiceWorkerContainerLike,
} from './serviceWorkerRegistration';

test('configureServiceWorker unregisters existing SWs, clears akujin-offline caches, and skips registration in dev', async () => {
  let registered = false;
  let unregisteredCalls = 0;
  let reloaded = false;
  const deletedKeys: string[] = [];

  const mockSw: ServiceWorkerContainerLike = {
    controller: { scriptURL: '/sw.js' },
    register: async () => {
      registered = true;
      return {
        update: async () => {},
        unregister: async () => true,
      };
    },
    getRegistrations: async () => [
      {
        update: async () => {},
        unregister: async () => {
          unregisteredCalls += 1;
          return true;
        },
      },
    ],
    addEventListener: () => {},
  };

  const mockCaches: CacheStorageLike = {
    keys: async () => ['akujin-offline-v1', 'akujin-offline-v2', 'other-app-cache'],
    delete: async (key) => {
      deletedKeys.push(key);
      return true;
    },
  };

  const result = await configureServiceWorker({
    isDev: true,
    serviceWorker: mockSw,
    cachesStorage: mockCaches,
    onReload: () => {
      reloaded = true;
    },
  });

  assert.equal(result.mode, 'development');
  assert.equal(result.registered, false);
  assert.equal(registered, false);
  assert.equal(unregisteredCalls, 1);
  assert.equal(result.unregisteredCount, 1);
  assert.deepEqual(deletedKeys, ['akujin-offline-v1', 'akujin-offline-v2']);
  assert.deepEqual(result.deletedCaches, ['akujin-offline-v1', 'akujin-offline-v2']);
  assert.equal(reloaded, true);
  assert.equal(result.reloaded, true);
});

test('configureServiceWorker registers with updateViaCache: none and listens for controllerchange in production', async () => {
  let registerArgs: { url: string; options?: RegistrationOptions } | null = null;
  let updated = false;
  let reloadCalls = 0;
  const controllerChangeListeners: Array<() => void> = [];

  const mockSw: ServiceWorkerContainerLike = {
    controller: { scriptURL: '/sw.js' },
    register: async (url, options) => {
      registerArgs = { url, options };
      return {
        update: async () => {
          updated = true;
        },
        unregister: async () => true,
      };
    },
    getRegistrations: async () => [],
    addEventListener: (type, listener) => {
      if (type === 'controllerchange') {
        controllerChangeListeners.push(listener);
      }
    },
  };

  const result = await configureServiceWorker({
    isDev: false,
    serviceWorker: mockSw,
    onReload: () => {
      reloadCalls += 1;
    },
  });

  assert.equal(result.mode, 'production');
  assert.equal(result.registered, true);
  assert.deepEqual(registerArgs, {
    url: '/sw.js',
    options: { updateViaCache: 'none' },
  });
  assert.equal(updated, true);

  assert.equal(controllerChangeListeners.length, 1);
  controllerChangeListeners[0]();
  controllerChangeListeners[0]();
  assert.equal(reloadCalls, 1);
});

test('configureServiceWorker returns unsupported when navigator.serviceWorker is unavailable', async () => {
  const result = await configureServiceWorker({
    isDev: true,
    serviceWorker: null,
  });
  assert.equal(result.mode, 'unsupported');
  assert.equal(result.registered, false);
});
