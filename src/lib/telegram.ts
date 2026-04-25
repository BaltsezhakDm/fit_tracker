const WebApp = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : undefined;

export const isTWA = !!WebApp?.initData;

// Fallback for local testing
export const MockWebApp = {
  initData: '',
  initDataUnsafe: {},
  ready: () => console.log('WebApp Ready'),
  expand: () => console.log('WebApp Expanded'),
  close: () => console.log('WebApp Closed'),
  MainButton: {
    text: '',
    color: '',
    textColor: '',
    isVisible: false,
    isActive: false,
    setText: (text: string) => console.log('MainButton text:', text),
    show: () => console.log('MainButton shown'),
    hide: () => console.log('MainButton hidden'),
    onClick: (cb: () => void) => console.log('MainButton click handler added'),
    offClick: (cb: () => void) => console.log('MainButton click handler removed'),
  },
  HapticFeedback: {
    impactOccurred: (style: string) => console.log('Haptic impact:', style),
    notificationOccurred: (type: string) => console.log('Haptic notification:', type),
    selectionChanged: () => console.log('Haptic selection changed'),
  }
};

export default WebApp || MockWebApp;
