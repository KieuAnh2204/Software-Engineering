/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USER_API: string;
  readonly VITE_PRODUCT_API: string;
  readonly VITE_ORDER_API: string;
  readonly VITE_PAYMENT_API?: string;
  readonly VITE_PAY_SERVICE_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
