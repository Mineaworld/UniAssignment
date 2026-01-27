import { Workbox } from 'workbox-window';

export interface UpdateNotification {
  show: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export function registerServiceWorker(
  onUpdateAvailable: (notification: UpdateNotification) => void
): void {
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers are not supported in this browser');
    return;
  }

  const wb = new Workbox('/sw.js');
  let shouldReloadOnControl = false;
  let hasReloaded = false;

  wb.addEventListener('controlling', () => {
    if (shouldReloadOnControl && !hasReloaded) {
      hasReloaded = true;
      window.location.reload();
    }
  });

  wb.addEventListener('waiting', () => {
    console.log('Service worker update available');
    onUpdateAvailable({
      show: true,
      onUpdate: () => {
        shouldReloadOnControl = true;
        wb.messageSkipWaiting();
        // Fallback: if "controlling" doesn't fire for some reason, reload anyway.
        window.setTimeout(() => {
          if (shouldReloadOnControl && !hasReloaded) {
            hasReloaded = true;
            window.location.reload();
          }
        }, 3000);
      },
      onDismiss: () => {
        console.log('Update dismissed by user');
      }
    });
  });

  wb.addEventListener('activated', (event) => {
    if (event.isUpdate) {
      console.log('Service worker updated successfully');
    } else {
      console.log('Service worker activated for the first time');
    }
  });

  wb.register()
    .then(() => {
      console.log('Service worker registered successfully');
    })
    .catch((error) => {
      console.error('Service worker registration failed:', error);
    });
}
