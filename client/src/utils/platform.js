export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent);
export const isAndroid = () => /Android/.test(navigator.userAgent);
export const isMobile = () => isIOS() || isAndroid();
