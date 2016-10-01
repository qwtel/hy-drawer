/*
 * Copyright (c) 2016 Florian Klampfer
 * Licensed under MIT
 */
import htmlElement from 'y-component/src/htmlElement';

import drawerCore from '../core';

export default class HTMLYDrawerElement extends drawerCore(htmlElement(HTMLElement)) {
  createdCallback() {
    this.createdConnected();
  }

  // @override
  setupDOM(el) {
    const shadowRoot = el.createShadowRoot();
    const instance = this.getTemplateInstance();
    shadowRoot.appendChild(instance);
    return shadowRoot;
  }

  getTemplateInstance() {
    // TODO: better why to get template?
    return (
      document.getElementById('y-drawer-template') ||
      document.querySelector('link[href$="v0/index.html"]')
        .import
        .getElementById('y-drawer-template'))
      .content
      .cloneNode(true);
  }
}
