// services/notificationService.ts
import type { Notification } from "../context/NotificationProvider";

class NotificationService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnecting = false;
  private pushSubscription: PushSubscription | null = null;
  private onNotificationCallback:
    | ((notification: Notification) => void)
    | null = null;
  private onConnectionStatusCallback: ((isConnected: boolean) => void) | null =
    null;
  private get apiBaseUrl(): string {
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api/v1";
    // Ensure the URL ends with a trailing slash
    return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  }
  private getAuthToken(): string | null {
    // Get token from localStorage, sessionStorage, or your auth context
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getAuthToken();
    return {
      Authorization: token ? `Bearer ${token}` : "",
      "Cache-Control": "no-cache",
    };
  }
  connect(
    onNotification: (notification: Notification) => void,
    onConnectionStatus: (isConnected: boolean) => void
  ): void {
    if (
      this.isConnecting ||
      this.eventSource?.readyState === EventSource.OPEN
    ) {
      console.log("Already connected or connecting to notifications");
      return;
    }

    const token = this.getAuthToken();
    if (!token) {
      console.warn("No auth token found, cannot connect to notifications");
      onConnectionStatus(false);
      return;
    }

    this.onNotificationCallback = onNotification;
    this.onConnectionStatusCallback = onConnectionStatus;
    this.isConnecting = true;

    try {
      // Make sure we're using the same domain as the current page to avoid CORS issues
      let subscribeUrl = `${this.apiBaseUrl}notifications/subscribe`;

      // If we're on a production domain, ensure we use the same domain for API calls
      if (window.location.hostname.includes("rns-apps.dk")) {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        subscribeUrl = `${protocol}//${hostname}/api/v1/notifications/subscribe`;
      }

      const url = new URL(subscribeUrl);
      url.searchParams.append("token", token);

      console.log(`Connecting to notification stream at: ${url.toString()}`);
      this.eventSource = new EventSource(url.toString(), {
        withCredentials: true,
      });

      this.eventSource.onopen = () => {
        console.log("Connected to notification stream");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        onConnectionStatus(true);
      };

      this.eventSource.onmessage = (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          console.log("Received notification:", notification);
          onNotification(notification);
        } catch (error) {
          console.error("Error parsing notification:", error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error("EventSource error:", error);
        this.isConnecting = false;
        onConnectionStatus(false);

        if (this.eventSource?.readyState === EventSource.CLOSED) {
          this.handleReconnect();
        }
      };
    } catch (error) {
      console.error("Error creating EventSource:", error);
      this.isConnecting = false;
      onConnectionStatus(false);
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      if (this.onNotificationCallback && this.onConnectionStatusCallback) {
        this.connect(
          this.onNotificationCallback,
          this.onConnectionStatusCallback
        );
      }
    }, delay);
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.onNotificationCallback = null;
    if (this.onConnectionStatusCallback) {
      this.onConnectionStatusCallback(false);
    }
    this.onConnectionStatusCallback = null;
    console.log("Disconnected from notification stream");
  }
  async sendTestNotification(): Promise<void> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error("No auth token found");
    }

    // Get appropriate URL based on environment
    let testUrl = `${this.apiBaseUrl}notifications/test`;

    // If we're on a production domain, ensure we use the same domain for API calls
    if (window.location.hostname.includes("rns-apps.dk")) {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      testUrl = `${protocol}//${hostname}/api/v1/notifications/test`;
    }

    const response = await fetch(testUrl, {
      method: "POST",
      headers: {
        ...this.getAuthHeaders(),
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to send test notification: ${response.statusText}`
      );
    }

    return response.json();
  }

  async testMatchNotification(): Promise<void> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error("No auth token found");
    }

    // Get appropriate URL based on environment
    let testUrl = `${this.apiBaseUrl}notifications/test-match`;

    // If we're on a production domain, ensure we use the same domain for API calls
    if (window.location.hostname.includes("rns-apps.dk")) {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      testUrl = `${protocol}//${hostname}/api/v1/notifications/test-match`;
    }

    const response = await fetch(testUrl, {
      method: "POST",
      headers: {
        ...this.getAuthHeaders(),
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to send match test notification: ${response.statusText}`
      );
    }

    return response.json();
  }
  async sendNotification(notification: {
    username?: string;
    usernames?: string[];
    title: string;
    message: string;
    type?: "info" | "success" | "warning" | "error";
    link?: string;
    route?: string;
    data?: any;
  }): Promise<void> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error("No auth token found");
    }

    // Get appropriate URL based on environment
    let sendUrl = `${this.apiBaseUrl}notifications/send`;

    // If we're on a production domain, ensure we use the same domain for API calls
    if (window.location.hostname.includes("rns-apps.dk")) {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      sendUrl = `${protocol}//${hostname}/api/v1/notifications/send`;
    }

    console.log(`Sending notification to: ${sendUrl}`);

    const response = await fetch(sendUrl, {
      method: "POST",
      headers: {
        ...this.getAuthHeaders(),
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(notification),
    });

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`);
    }

    return response.json();
  }
  async getStatus(): Promise<{
    activeSubscribers: number;
    isUserOnline: boolean;
  }> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error("No auth token found");
    }

    // Get appropriate URL based on environment
    let statusUrl = `${this.apiBaseUrl}notifications/status`;

    // If we're on a production domain, ensure we use the same domain for API calls
    if (window.location.hostname.includes("rns-apps.dk")) {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      statusUrl = `${protocol}//${hostname}/api/v1/notifications/status`;
    }

    const response = await fetch(statusUrl, {
      headers: this.getAuthHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }

    return response.json();
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  // Push notification methods
  async subscribeToPushNotifications(): Promise<boolean> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push messaging is not supported");
      return false;
    }
    try {
      // Get VAPID public key from environment or server
      let publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        // Get appropriate URL based on environment
        let vapidKeyUrl = `${this.apiBaseUrl}notifications/vapid-public-key`;

        // If we're on a production domain, ensure we use the same domain for API calls
        if (window.location.hostname.includes("rns-apps.dk")) {
          const protocol = window.location.protocol;
          const hostname = window.location.hostname;
          vapidKeyUrl = `${protocol}//${hostname}/api/v1/notifications/vapid-public-key`;
        }

        const response = await fetch(vapidKeyUrl, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to get VAPID public key");
        }
        const result = await response.json();
        publicKey = result.publicKey;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Check if already subscribed
      const existingSubscription =
        await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log("Already subscribed to push notifications");
        return true;
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to server
      const token = this.getAuthToken();
      if (!token) {
        throw new Error("No auth token found");
      }

      // Get appropriate URL based on environment
      let subscribePushUrl = `${this.apiBaseUrl}notifications/subscribe-push`;

      // If we're on a production domain, ensure we use the same domain for API calls
      if (window.location.hostname.includes("rns-apps.dk")) {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        subscribePushUrl = `${protocol}//${hostname}/api/v1/notifications/subscribe-push`;
      }

      const subscribeResponse = await fetch(subscribePushUrl, {
        method: "POST",
        headers: {
          ...this.getAuthHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });

      if (!subscribeResponse.ok) {
        throw new Error("Failed to subscribe to push notifications on server");
      }

      console.log("Successfully subscribed to push notifications");
      return true;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      return false;
    }
  }

  async unsubscribeFromPushNotifications(): Promise<boolean> {
    try {
      if (!("serviceWorker" in navigator)) {
        return false;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        return false;
      }

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        return false;
      }

      // Unsubscribe from browser
      await subscription.unsubscribe();

      // Notify server
      const token = this.getAuthToken();
      if (token) {
        // Get appropriate URL based on environment
        let unsubscribeUrl = `${this.apiBaseUrl}notifications/unsubscribe-push`;

        // If we're on a production domain, ensure we use the same domain for API calls
        if (window.location.hostname.includes("rns-apps.dk")) {
          const protocol = window.location.protocol;
          const hostname = window.location.hostname;
          unsubscribeUrl = `${protocol}//${hostname}/api/v1/notifications/unsubscribe-push`;
        }

        await fetch(unsubscribeUrl, {
          method: "POST",
          headers: this.getAuthHeaders(),
          credentials: "include",
        });
      }

      console.log("Successfully unsubscribed from push notifications");
      return true;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      return false;
    }
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return "denied";
    }

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

export const notificationService = new NotificationService();
