import React, { createContext, useContext, useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: DeviceType;
  isAndroid: boolean;
  isIOS: boolean;
  isTouchDevice: boolean;
  isStandalone: boolean; // Installed as PWA
  orientation: 'portrait' | 'landscape';
}

export function useDeviceInfo(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    deviceType: 'desktop',
    isAndroid: false,
    isIOS: false,
    isTouchDevice: false,
    isStandalone: false,
    orientation: 'portrait'
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const isMobile = width < MOBILE_BREAKPOINT;
      const isTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
      const isDesktop = width >= TABLET_BREAKPOINT;
      
      let deviceType: DeviceType = 'desktop';
      if (isMobile) deviceType = 'mobile';
      else if (isTablet) deviceType = 'tablet';
      
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Check if app is in standalone mode (installed as PWA)
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true;
      
      const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      
      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        deviceType,
        isAndroid,
        isIOS,
        isTouchDevice,
        isStandalone,
        orientation
      });
    };
    
    // Initial check
    updateDeviceInfo();
    
    // Add event listeners
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);
    
    // Check for display-mode changes (PWA install)
    const mediaQueryList = window.matchMedia('(display-mode: standalone)');
    mediaQueryList.addEventListener('change', updateDeviceInfo);
    
    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
      mediaQueryList.removeEventListener('change', updateDeviceInfo);
    };
  }, []);
  
  return deviceInfo;
}

// Create the context with a default value
const DeviceContext = createContext<DeviceInfo>({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  deviceType: 'desktop',
  isAndroid: false,
  isIOS: false,
  isTouchDevice: false,
  isStandalone: false,
  orientation: 'portrait'
});

// Custom hook to use the device context
export const useDevice = () => useContext(DeviceContext);

// Provider component
export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceInfo = useDeviceInfo();
  
  return (
    <DeviceContext.Provider value={deviceInfo}>
      {children}
    </DeviceContext.Provider>
  );
};

// Higher-order component for conditional rendering based on device type
export function withDeviceDetection<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    mobileComponent?: React.ComponentType<P>;
    tabletComponent?: React.ComponentType<P>;
    desktopComponent?: React.ComponentType<P>;
  }
): React.FC<P> {
  return (props: P) => {
    const deviceInfo = useDevice();
    
    if (deviceInfo.isMobile && options?.mobileComponent) {
      const MobileComponent = options.mobileComponent;
      return <MobileComponent {...props} />;
    }
    
    if (deviceInfo.isTablet && options?.tabletComponent) {
      const TabletComponent = options.tabletComponent;
      return <TabletComponent {...props} />;
    }
    
    if (deviceInfo.isDesktop && options?.desktopComponent) {
      const DesktopComponent = options.desktopComponent;
      return <DesktopComponent {...props} />;
    }
    
    return <Component {...props} />;
  };
}

// Custom hook for device-specific styles
export const useDeviceStyles = (styles: {
  mobile?: React.CSSProperties;
  tablet?: React.CSSProperties;
  desktop?: React.CSSProperties;
  android?: React.CSSProperties;
  ios?: React.CSSProperties;
  portrait?: React.CSSProperties;
  landscape?: React.CSSProperties;
  touchDevice?: React.CSSProperties;
  pwa?: React.CSSProperties;
}): React.CSSProperties => {
  const deviceInfo = useDevice();
  
  return {
    ...(deviceInfo.isMobile ? styles.mobile : {}),
    ...(deviceInfo.isTablet ? styles.tablet : {}),
    ...(deviceInfo.isDesktop ? styles.desktop : {}),
    ...(deviceInfo.isAndroid ? styles.android : {}),
    ...(deviceInfo.isIOS ? styles.ios : {}),
    ...(deviceInfo.orientation === 'portrait' ? styles.portrait : {}),
    ...(deviceInfo.orientation === 'landscape' ? styles.landscape : {}),
    ...(deviceInfo.isTouchDevice ? styles.touchDevice : {}),
    ...(deviceInfo.isStandalone ? styles.pwa : {}),
  };
};