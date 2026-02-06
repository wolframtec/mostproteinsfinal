'use client';

import { useEffect } from 'react';
import Intercom from '@intercom/messenger-js-sdk';

export default function IntercomChat() {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_INTERCOM_APP_ID;
    
    if (!appId) {
      console.warn('Intercom: NEXT_PUBLIC_INTERCOM_APP_ID is not set');
      return;
    }

    Intercom({
      app_id: appId,
    });
  }, []);

  return null;
}
