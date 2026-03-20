'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bell, BellOff, X } from 'lucide-react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export default function PushNotificationManager() {
    const { user } = useAuth();
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
            if (Notification.permission === 'default') {
                const timer = setTimeout(() => setShowPrompt(true), 5000);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribeToPush = async () => {
        if (!user || !VAPID_PUBLIC_KEY) return;
        setIsSubscribing(true);

        try {
            const permission = await Notification.requestPermission();
            setPermission(permission);

            if (permission !== 'granted') {
                setShowPrompt(false);
                return;
            }

            const registration = await navigator.serviceWorker.register('/sw.js');
            
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            // Parse subscription for the backend
            const subJSON = JSON.parse(JSON.stringify(subscription));

            const res = await fetch('/api/notifications/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: {
                        endpoint: subJSON.endpoint,
                        keys: subJSON.keys
                    },
                    userId: user.id
                })
            });

            if (res.ok) {
                console.log('Push subscription successful');
                setShowPrompt(false);
            } else {
                console.error('Failed to register subscription on backend');
            }

        } catch (error) {
            console.error('Push subscription error:', error);
        } finally {
            setIsSubscribing(false);
        }
    };

    if (!showPrompt || permission === 'granted' || permission === 'denied') return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-80 bg-white rounded-2xl shadow-2xl border border-purple-100 p-5 z-50 animate-in slide-in-from-bottom-5 duration-500">
            <button 
                onClick={() => setShowPrompt(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
                <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bell className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Don't miss a message!</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Enable notifications to get real-time alerts for chats and pet updates.
                    </p>
                </div>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={() => setShowPrompt(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    Maybe Later
                </button>
                <button 
                    disabled={isSubscribing}
                    onClick={subscribeToPush}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
                >
                    {isSubscribing ? 'Enabling...' : 'Enable Now'}
                </button>
            </div>
        </div>
    );
}
