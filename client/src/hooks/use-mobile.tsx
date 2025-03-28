import * as React from "react"
import { DeviceInfo, useDevice } from "@/components/DeviceContext"

const MOBILE_BREAKPOINT = 768

/**
 * Simple hook to check if the current device is mobile based on screen width.
 * This is a standalone hook that doesn't rely on DeviceContext for backward compatibility.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

/**
 * Hook that re-exports useDevice from DeviceContext
 * @deprecated Use useDevice from '@/components/DeviceContext' directly
 */
export function useDeviceInfo(): DeviceInfo {
  return useDevice();
}
