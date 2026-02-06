// Global type declarations

declare global {
  interface Window {
    uetq?: Array<unknown>;
    ApplePaySession?: {
      canMakePayments: boolean;
    };
  }
}

export {};
