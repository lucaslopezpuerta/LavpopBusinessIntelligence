import { lazy } from 'react';

/**
 * Lazy load with retry — prevents permanent blank screens from transient chunk load failures.
 * On failure, retries once after a short delay.
 *
 * @param {() => Promise} importFn - Dynamic import function
 * @returns {React.LazyExoticComponent} Lazy-loaded component with retry
 */
const lazyRetry = (importFn) =>
  lazy(() =>
    importFn().catch(() =>
      new Promise((resolve, reject) =>
        setTimeout(() => importFn().then(resolve, reject), 1500)
      )
    )
  );

export default lazyRetry;
