import React, { useState, useEffect } from 'react';
import { Download, Wifi, WifiOff, RefreshCw, Bell, X } from 'lucide-react';

const PWAManager = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);
  const [offlineData, setOfflineData] = useState([]);
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    registerServiceWorker();
    setupPWAListeners();
    checkIfInstalled();
    handleURLParams();
  }, []);

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        setSwRegistration(registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        });

        // Handle service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'OFFLINE_DATA_SYNC') {
            console.log('📤 Syncing offline data...');
          }
        });

      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  };

  const setupPWAListeners = () => {
    // Online/Offline detection
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineIndicator(false);
      console.log('🌐 Back online!');
      
      // Trigger background sync if available
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.sync.register('background-sync-alerts');
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineIndicator(true);
      console.log('📵 Gone offline');
    };

    // Install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // App installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('🎉 PWA installed successfully!');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  };

  const checkIfInstalled = () => {
    // Check if running as PWA
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isInFullScreen = window.navigator.standalone === true;
    
    if (isInStandaloneMode || isInFullScreen) {
      setIsInstalled(true);
    }
  };

  const handleURLParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const shortcut = urlParams.get('shortcut');
    
    if (shortcut) {
      // Handle app shortcuts
      switch (shortcut) {
        case 'alerts':
          // Navigate to alerts section
          document.querySelector('[data-section="alerts"]')?.scrollIntoView();
          break;
        case 'analytics':
          // Navigate to analytics section
          document.querySelector('[data-section="analytics"]')?.scrollIntoView();
          break;
        case 'aura':
          // Open AI assistant
          window.dispatchEvent(new CustomEvent('openAura'));
          break;
      }
    }
  };

  const installPWA = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        
        if (result.outcome === 'accepted') {
          console.log('✅ User accepted PWA installation');
        } else {
          console.log('❌ User dismissed PWA installation');
        }
        
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      } catch (error) {
        console.error('❌ PWA installation failed:', error);
      }
    }
  };

  const updateApp = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    // Remember user's choice for 7 days
    localStorage.setItem('pwa-install-dismissed', Date.now() + (7 * 24 * 60 * 60 * 1000));
  };

  const shouldShowInstallPrompt = () => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed && Date.now() < parseInt(dismissed)) {
      return false;
    }
    return showInstallPrompt && !isInstalled;
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        
        // Subscribe to push notifications
        const registration = await navigator.serviceWorker.ready;
        if ('PushManager' in window) {
          try {
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
            });
            
            // Send subscription to server
            console.log('📱 Push subscription created:', subscription);
          } catch (error) {
            console.error('❌ Push subscription failed:', error);
          }
        }
      }
    }
  };

  return (
    <>
      {/* Offline Indicator */}
      {showOfflineIndicator && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 text-center text-sm z-50 flex items-center justify-center space-x-2">
          <WifiOff className="w-4 h-4" />
          <span>You're offline. Some features may be limited.</span>
          {isOnline && (
            <button
              onClick={() => window.location.reload()}
              className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs transition-colors"
            >
              Refresh
            </button>
          )}
        </div>
      )}

      {/* Install Prompt */}
      {shouldShowInstallPrompt() && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 animate-slide-up">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                Install Early Alerts Dashboard
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Get faster access and work offline by installing this app on your device.
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={installPWA}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                >
                  Install
                </button>
                <button
                  onClick={dismissInstallPrompt}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={dismissInstallPrompt}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Update Available */}
      {updateAvailable && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-80 bg-green-600 text-white rounded-lg p-4 z-50 animate-slide-up">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-5 h-5" />
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Update Available</h3>
              <p className="text-sm opacity-90 mb-3">
                A new version is ready to install.
              </p>
              <button
                onClick={updateApp}
                className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded text-sm transition-colors"
              >
                Update Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Status Indicator (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-xs z-50 flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="w-3 h-3 text-green-400" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-400" />
          )}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
          {isInstalled && <span className="bg-green-600 px-2 py-1 rounded text-xs">PWA</span>}
        </div>
      )}

      {/* Notification Permission Request */}
      {isInstalled && (
        <div className="fixed bottom-20 right-4 z-40">
          <button
            onClick={requestNotificationPermission}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110"
            title="Enable notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
};

export default PWAManager;
