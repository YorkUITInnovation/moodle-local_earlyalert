import React, { useState, useEffect } from 'react';
import { Bell, Vibrate, MapPin, Calendar, Users, TrendingUp, AlertTriangle } from 'lucide-react';

const MobileAlertWidget = ({ alerts, userLocation }) => {
  const [nearbyAlerts, setNearbyAlerts] = useState([]);
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }

    // Filter alerts by proximity if location available
    if (userLocation && alerts) {
      const nearby = alerts.filter(alert => 
        alert.campus && calculateDistance(userLocation, alert.campusLocation) < 1000 // 1km radius
      );
      setNearbyAlerts(nearby);
    }
  }, [alerts, userLocation]);

  const calculateDistance = (pos1, pos2) => {
    // Simplified distance calculation (Haversine formula would be more accurate)
    const R = 6371e3; // Earth's radius in meters
    const φ1 = pos1.lat * Math.PI/180;
    const φ2 = pos2.lat * Math.PI/180;
    const Δφ = (pos2.lat-pos1.lat) * Math.PI/180;
    const Δλ = (pos2.lng-pos1.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const sendPushNotification = (title, message) => {
    if (notificationPermission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'early-alert',
        requireInteraction: true,
        actions: [
          { action: 'view', title: 'View Dashboard' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      });

      // Vibration for mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 md:hidden">
      {/* Quick Stats Widget */}
      <div className="bg-white rounded-lg shadow-lg border p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <Bell className="w-4 h-4 mr-2 text-blue-600" />
            Quick Alerts
          </h3>
          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
            {alerts?.filter(a => a.priority === 'High').length || 0} High Priority
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-50 rounded p-2">
            <div className="text-lg font-bold text-blue-600">{alerts?.length || 0}</div>
            <div className="text-xs text-blue-600">Total</div>
          </div>
          <div className="bg-yellow-50 rounded p-2">
            <div className="text-lg font-bold text-yellow-600">
              {alerts?.filter(a => a.status === 'In Progress').length || 0}
            </div>
            <div className="text-xs text-yellow-600">Active</div>
          </div>
          <div className="bg-green-50 rounded p-2">
            <div className="text-lg font-bold text-green-600">
              {nearbyAlerts.length}
            </div>
            <div className="text-xs text-green-600">Nearby</div>
          </div>
        </div>
      </div>

      {/* Location-based Alerts */}
      {nearbyAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center mb-2">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="font-semibold">Nearby Alerts</span>
          </div>
          <div className="text-sm opacity-90">
            {nearbyAlerts.length} student(s) need attention in your area
          </div>
          <button className="mt-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors">
            View Details
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileAlertWidget;
