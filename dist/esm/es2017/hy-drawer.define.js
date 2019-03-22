
// HyDrawer: Custom Elements Define Library, ES Module/es2017 Target

import { defineCustomElement } from './hy-drawer.core.js';
import { COMPONENTS } from './hy-drawer.components.js';

export function defineCustomElements(win, opts) {
  return defineCustomElement(win, COMPONENTS, opts);
}
