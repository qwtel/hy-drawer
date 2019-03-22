/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */


import '@stencil/core';




export namespace Components {

  interface HyDrawer {
    'align': "left" | "right";
    'close': () => void;
    'mouseEvents': boolean;
    'opacity': number;
    'open': () => void;
    'opened': boolean;
    'persistent': boolean;
    'preventDefault': boolean;
    'range': [number, number];
    'threshold': number;
    'toggle': () => void;
    'touchEvents': boolean;
    'translateX': number;
  }
  interface HyDrawerAttributes extends StencilHTMLAttributes {
    'align'?: "left" | "right";
    'mouseEvents'?: boolean;
    'onSlideEnd'?: (event: CustomEvent<boolean>) => void;
    'onSlideStart'?: (event: CustomEvent<boolean>) => void;
    'opacity'?: number;
    'opened'?: boolean;
    'persistent'?: boolean;
    'preventDefault'?: boolean;
    'range'?: [number, number];
    'threshold'?: number;
    'touchEvents'?: boolean;
    'translateX'?: number;
  }
}

declare global {
  interface StencilElementInterfaces {
    'HyDrawer': Components.HyDrawer;
  }

  interface StencilIntrinsicElements {
    'hy-drawer': Components.HyDrawerAttributes;
  }


  interface HTMLHyDrawerElement extends Components.HyDrawer, HTMLStencilElement {}
  var HTMLHyDrawerElement: {
    prototype: HTMLHyDrawerElement;
    new (): HTMLHyDrawerElement;
  };

  interface HTMLElementTagNameMap {
    'hy-drawer': HTMLHyDrawerElement
  }

  interface ElementTagNameMap {
    'hy-drawer': HTMLHyDrawerElement;
  }


  export namespace JSX {
    export interface Element {}
    export interface IntrinsicElements extends StencilIntrinsicElements {
      [tagName: string]: any;
    }
  }
  export interface HTMLAttributes extends StencilHTMLAttributes {}

}
