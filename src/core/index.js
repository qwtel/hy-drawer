// Copyright (C) 2017  Florian Klampfer
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

/* eslint-disable
import/no-extraneous-dependencies,
import/no-unresolved,
import/extensions,
no-else-return,
no-console,
*/

// const JS_FEATURES = [
//   'fn/array/find',
//   'fn/array/for-each',
//   'fn/array/reduce',
//   'fn/function/bind',
//   'fn/number/constructor',
//   'fn/object/assign',
//   'fn/object/define-property',
//   'fn/object/keys',
// ];
//
// const MODERNIZR_TESTS = [
//   'customevent',
//   'eventlistener',
//   'queryselector',
//   'requestanimationframe',
//   'classlist',
//   'opacity',
//   'csstransforms',
//   'csspointerevents',
// ];

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { defer } from 'rxjs/observable/defer';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { merge } from 'rxjs/observable/merge';
// import { never } from 'rxjs/observable/never';

import { _catch as recover } from 'rxjs/operator/catch';
import { _do as effect } from 'rxjs/operator/do';
import { filter } from 'rxjs/operator/filter';
import { map } from 'rxjs/operator/map';
import { mergeMap } from 'rxjs/operator/mergeMap';
import { pairwise } from 'rxjs/operator/pairwise';
import { scan } from 'rxjs/operator/scan';
import { share } from 'rxjs/operator/share';
import { skipWhile } from 'rxjs/operator/skipWhile';
import { startWith } from 'rxjs/operator/startWith';
import { switchMap } from 'rxjs/operator/switchMap';
import { take } from 'rxjs/operator/take';
import { takeUntil } from 'rxjs/operator/takeUntil';
import { timestamp } from 'rxjs/operator/timestamp';
import { withLatestFrom } from 'rxjs/operator/withLatestFrom';

import componentCore from 'y-component/src/component-core';

import { createTween, linearTween } from '../common';

// const Symbol = global.Symbol || (x => `_${x}`);
//
// const IDLE = Symbol('idle');
// const TOUCHING = Symbol('touching');
// const START_ANIMATING = Symbol('startAnimating');
// const ANIMATING = Symbol('animating');

const VELOCITY_THRESHOLD = 0.2; // px/ms
const VELOCITY_LINEAR_COMBINATION = 0.8;
const SLIDE_THRESHOLD = 10;

const abs = ::Math.abs;
const sqrt = ::Math.sqrt;
const min = ::Math.min;
const max = ::Math.max;
const assign = ::Object.assign;

// function pauseWith(pauser$) {
//   return this::withLatestFrom(pauser$)
//       ::filter(([, paused]) => paused === false)
//       ::map(([x]) => x);
// }

// function pauseWith(pauser$) {
//   return pauser$::switchMap(paused => (paused ? Observable::never() : this));
// }

function cacheDOMElements() {
  this.scrim = this.root.querySelector('.y-drawer-scrim');
  this.content = this.root.querySelector('.y-drawer-content');
}

function velocityReducer(velocity, [prevSnowball, snowball]) {
  const { value: { pageX: prevPageX }, timestamp: prevTime } = prevSnowball;
  const { value: { pageX }, timestamp: time } = snowball;

  const pageXDiff = pageX - prevPageX;
  const timeDiff = time - prevTime;

  return (VELOCITY_LINEAR_COMBINATION * (pageXDiff / timeDiff)) +
         ((1 - VELOCITY_LINEAR_COMBINATION) * velocity);
}

function isInSlideRange(pageX, sliderWidth, opened) {
  return opened || (pageX > this.nativeMargin && pageX < sliderWidth);
}

// TODO: rename
function calcOpened(velocity, translateX, sliderWidth) {
  if (velocity > VELOCITY_THRESHOLD) {
    return true;
  } else if (velocity < -VELOCITY_THRESHOLD) {
    return false;
  } else if (translateX >= sliderWidth / 2) {
    return true;
  } else {
    return false;
  }
}

function calcTranslateX(startX, pageX, startTranslateX, sliderWidth) {
  const deltaX = pageX - startX;
  const translateX = startTranslateX + deltaX;
  return max(0, min(sliderWidth, translateX));
}

function prepInteraction() {
  this.content.style.willChange = 'transform';
  this.scrim.style.willChange = 'opacity';
  this.content.classList.remove('y-drawer-opened');
  // this.sliderWidth = this.getMovableSliderWidth();
}

function cleanupInteraction(opened) {
  if (opened) {
    // document.body.style.overflowY = 'hidden';
    this.scrim.style.pointerEvents = 'all';
    this.content.classList.add('y-drawer-opened');
  } else {
    // document.body.style.overflowY = '';
    this.scrim.style.pointerEvents = '';
  }

  this.content.style.willChange = '';
  this.scrim.style.willChange = '';

  this.fireEvent('transitioned');
}

function getMovableSliderWidth() {
  // Since part of the slider could be visible,
  // the width that is "movable" is less than the complete slider width
  // and given by
  return -this.content.offsetLeft;
}

function updateDOM(translateX, sliderWidth) {
  this.content.style.transform = `translateX(${translateX}px)`;
  this.scrim.style.opacity = translateX / sliderWidth;
}

function setupObservables() {
  const { find } = Array.prototype;

  // const scrimClick$ = Observable::fromEvent(this.scrim, 'click');
  // window.addEventListener('touchmove', () => {});

  this.opened$ = new Subject();
  this.persistent$ = new Subject();

  // TODO: recalculate on change!? let user provide width?
  const sliderWidth = this::getMovableSliderWidth();

  // TODO: only do htis on iOS / when preventDefault is enabled
  // NOTE: it is important to keep a permanent subscription to `touchmove`,
  // as `preventDefault` will not work on iOS if it is called on a
  // event from a subscription that occured after `touchstart`.
  // yeah, this is strange...
  const tm$ = Observable::fromEvent(document, 'touchmove', { passive: !this.preventDefault })
    ::share();
  // TODO: find better way to ensure that touchmove never get's unsubscribed
  tm$.subscribe(() => {});

  const te$ = Observable::fromEvent(document, 'touchend', { passive: !this.preventDefault })
    ::share();
  // TODO: find better way to ensure that touchend never get's unsubscribed
  te$.subscribe(() => {});

  this.translateX$ = Observable::defer(() =>
    Observable::fromEvent(document, 'touchstart', {
      passive: !this.preventDefault,
    })
      // ::pauseWith(this.persistent$::startWith(false))
      ::filter(({ touches }) => touches.length === 1)
      ::map(({ touches }) => touches[0])
      ::withLatestFrom(this.translateX$::startWith({ translateX: 0, opened: false }))
      ::filter(([{ pageX }, { opened }]) => this::isInSlideRange(pageX, sliderWidth, opened))
      ::effect(this::prepInteraction)
      ::switchMap(([startTouch, { translateX: startTranslateX }]) => {
        const { pageX: startX, pageY: startY, identifier: startIdentifier } = startTouch;

        const touchmove$ = tm$
          ::map(e => assign(e.touches::find(t => t.identifier === startIdentifier), { e }))
          ::share();

        const isScrolling$ = touchmove$
          ::skipWhile(({ pageX, pageY }) =>
            sqrt((abs(startY - pageY) ** 2) + (abs(startX - pageX) ** 2)) < SLIDE_THRESHOLD)
          ::take(1)
          ::map(({ pageX, pageY }) => abs(startY - pageY) > abs(startX - pageX))
          ::startWith(undefined)
          ::share();

        isScrolling$
          ::effect((isScrolling) => {
            if (isScrolling === false) {
              document.body.style.overflowY = 'hidden';
              document.body.classList.add('modal-open');
            }
          })
          .subscribe();

        const touchend$ = te$::withLatestFrom(isScrolling$)
          ::filter(([e, isScrolling]) => isScrolling === false && e.touches.length === 0)
          ::share();

        // TODO: rename
        const touchmove2$ = touchmove$::takeUntil(touchend$)
          ::withLatestFrom(isScrolling$)
          ::effect(([{ e }, isScrolling]) => {
            if (isScrolling === false) {
              console.log('preventDefault');
              e.preventDefault();
            }
          })
          ::filter(([, isScrolling]) => isScrolling === false)
          ::map(([snowball]) => {
            const { pageX } = snowball;
            const translateX = this::calcTranslateX(startX, pageX, startTranslateX, sliderWidth);
            return assign(snowball, { translateX });
          })
          ::share();

        const velocity$ = touchmove2$::startWith(startTouch)
          ::timestamp()
          ::pairwise()
          ::scan(this::velocityReducer, 0);

        const anim$ = touchend$
          ::withLatestFrom(touchmove2$::startWith(null), velocity$::startWith(null))
          ::filter(([, a, b]) => a != null && b != null)
          ::map(([, snowball, velocity]) => {
            const { translateX } = snowball;
            const opened = this::calcOpened(velocity, translateX, sliderWidth);
            return assign(snowball, { opened });
          })
          ::effect(() => {
            // if (this.touching) {
            //   if (this.isScrolling || e.touches.length > 0) {
            //     return;
            //   }
            // if (this.startedMoving) {
            //   this.updateMenuOpen();
            // }
            if (this.opened) {
              this.scrim.style.pointerEvents = 'all';
            } else {
              this.scrim.style.pointerEvents = '';
            }
            // }
          })
          // ::merge(this.opened$
          //   ::withLatestFrom(this.translateX$))
          //   ::map(([opened, { translateX }]) => ({ translateX, opened }))
          ::take(1) // TODO: better way to close the outer observable?
          ::mergeMap((snowball) => {
            const { translateX, opened } = snowball;

            const endTranslateX = (opened ? 1 : 0) * sliderWidth;
            const diffTranslateX = endTranslateX - translateX;

            return createTween(linearTween, translateX, diffTranslateX, this.transitionDuration)
              ::map(sample => assign(snowball, { translateX: sample }))
              ::effect(null, null, () => this::cleanupInteraction(opened))
              ::effect(null, null, () => {
                if (!opened) {
                  document.body.style.overflowY = '';
                  document.body.classList.remove('modal-open');
                }
              });
          });

        return Observable::merge(touchmove2$, anim$);
      }),
    )
    ::share();

  this.translateX$
    ::effect(({ translateX }) => this::updateDOM(translateX, sliderWidth), ::console.error)
    ::recover((e, c) => c)
    .subscribe();
}

// defProperties() {
//   this.startX = 0;
//   this.startY = 0;
//   this.pageX = 0;
//   this.pageY = 0;
//   this.lastPageX = 0;
//   this.lastPageY = 0;
//   this.isScrolling = true;
//   this.startedMoving = false;
//   this.loopState = IDLE;
//   this.velocity = 0;
//   this.startTranslateX = 0;
//   this.translateX = 0;
//   this.animationFrameRequested = false;
//   this.touching = false;
//   this.lastTime = true;
//   this.sliderWidth = true;
//   this.animation = true;
// }
//
// bindCallbacks() {
//   this.touchStartCallback = this.touchStartCallback.bind(this);
//   this.touchMoveCallback = this.touchMoveCallback.bind(this);
//   this.touchEndCallback = this.touchEndCallback.bind(this);
//   this.scrimClickCallback = this.scrimClickCallback.bind(this);
//   this.animationFrameCallback = this.animationFrameCallback.bind(this);
// }
//
// addEventListeners() {
//   document.addEventListener('touchstart', this.touchStartCallback, { passive: false });
//   document.addEventListener('touchmove', this.touchMoveCallback, { passive: false });
//   document.addEventListener('touchend', this.touchEndCallback, { passive: false });
//
//   this.scrim.addEventListener('click', this.scrimClickCallback);
// }


// removeEventListeners() {
//   document.removeEventListener('touchstart', this.touchStartCallback, { passive: false });
//   document.removeEventListener('touchmove', this.touchMoveCallback, { passive: false });
//   document.removeEventListener('touchend', this.touchEndCallback, { passive: false });
//
//   this.scrim.removeEventListener('click', this.scrimClickCallback);
// }
//
// requestAnimationLoop() {
//   if (!this.animationFrameRequested) {
//     this.animationFrameRequested = true;
//     requestAnimationFrame(this.animationFrameCallback);
//   }
// }
//
// getNearestTouch(touches) {
//   if (touches.length === 1) return touches[0];
//   return Array.prototype.reduce.call(touches, (acc, touch) => {
//     const dist = pageDist(this, touch);
//     return (dist < acc.dist) ? {
//       dist,
//       touch,
//     } : acc;
//   }, {
//     dist: Number.POSITIVE_INFINITY,
//     touch: null,
//   }).touch;
// }
//
// touchStartCallback(e) {
//   if (e.touches.length === 1) {
//     this.isScrolling = undefined;
//
//     const touch = e.touches[0];
//     this.startX = touch.pageX;
//     this.startY = touch.pageY;
//     this.pageX = touch.pageX;
//     this.pageY = touch.pageY;
//     this.lastPageX = touch.pageX;
//     this.lastPageY = touch.pageY;
//
//     if (this.opened || (this.pageX < window.innerWidth / 3)) {
//       this.prepInteraction();
//       this.touching = true;
//       this.loopState = TOUCHING;
//     }
//   }
// }
//
// touchMoveCallback(e) {
//   if (this.touching) {
//     const touch = this.getNearestTouch(e.touches);
//     this.pageX = touch.pageX;
//     this.pageY = touch.pageY;
//
//     if (typeof this.isScrolling === 'undefined' && this.startedMoving) {
//       this.isScrolling = Math.abs(this.startY - this.pageY) > Math.abs(this.startX - this.pageX);
//       if (!this.isScrolling) {
//         this.loopState = TOUCHING;
//         this.requestAnimationLoop();
//       }
//     }
//
//     if (this.isScrolling) {
//       return;
//     }
//
//     e.preventDefault();
//
//     this.startedMoving = true;
//   }
// }
//
// updateMenuOpen() {
//   if (this.velocity > VELOCITY_THRESHOLD) {
//     this.setState('opened', true);
//   } else if (this.velocity < -VELOCITY_THRESHOLD) {
//     this.setState('opened', false);
//   } else if (this.translateX >= this.sliderWidth / 2) {
//     this.setState('opened', true);
//   } else {
//     this.setState('opened', false);
//   }
// }
//
// touchEndCallback(e) {
//   if (this.touching) {
//     if (this.isScrolling || e.touches.length > 0) {
//       return;
//     }
//
//     if (this.startedMoving) {
//       this.updateMenuOpen();
//     }
//
//     if (this.opened) {
//       this.scrim.style.pointerEvents = 'all';
//     } else {
//       this.scrim.style.pointerEvents = '';
//     }
//
//     this.loopState = START_ANIMATING;
//     this.startedMoving = false;
//     this.touching = false;
//   }
// }
//
// scrimClickCallback() {
//   this.close();
// }
//
// animateTo(opened) {
//   this.prepInteraction();
//   this.setState('opened', opened);
//   this.loopState = START_ANIMATING;
//   this.requestAnimationLoop();
// }
//
// jumpTo(opened) {
//   this.prepInteraction();
//   this.setState('opened', opened);
//   this.loopState = IDLE;
//   this.startTranslateX = opened * this.sliderWidth;
//   this.endAnimating();
//   this.updateDOM(this.startTranslateX, this.sliderWidth);
// }
//
// updateTranslateX() {
//   const deltaX = this.pageX - this.startX;
//   this.translateX = this.startTranslateX + deltaX;
//   this.translateX = Math.max(0, Math.min(this.sliderWidth, this.translateX));
//   return deltaX;
// }
//
// animationFrameCallback(time) {
//   switch (this.loopState) {
//     case TOUCHING: {
//       this.touchingFrame(time);
//       break;
//     }
//
//     case START_ANIMATING: {
//       this.startAnimatingFrame(time);
//       this.loopState = ANIMATING;
//       this.animationFrameCallback(time); // jump to next case block
//       break;
//     }
//
//     case ANIMATING: {
//       this.animatingFrame(time);
//       break;
//     }
//
//     default: {
//       break;
//     }
//   }
// }
//
// touchingFrame(time) {
//   const timeDiff = time - this.lastTime;
//
//   if (timeDiff > 0) {
//     const pageXDiff = this.pageX - this.lastPageX;
//     this.velocity = (VELOCITY_LINEAR_COMBINATION * (pageXDiff / timeDiff)) +
//                     ((1 - VELOCITY_LINEAR_COMBINATION) * this.velocity);
//   }
//
//   this.updateTranslateX();
//   this.updateDOM(this.translateX, this.sliderWidth);
//
//   this.lastTime = time;
//   this.lastPageX = this.pageX;
//   this.lastPageY = this.pageY;
//
//   requestAnimationFrame(this.animationFrameCallback);
// }
//
// startAnimatingFrame(time) {
//   this.updateTranslateX();
//
//   // store all animation related data in this object,
//   // delete after animation is completed
//   const animation = {};
//   animation.startX = this.translateX;
//   animation.endX = (this.opened ? 1 : 0) * this.sliderWidth;
//   animation.changeInValue = animation.endX - animation.startX;
//   animation.startTime = time;
//   this.animation = animation;
// }
//
// animatingFrame(time) {
//   const timeInAnimation = time - this.animation.startTime;
//
//   if (timeInAnimation < this.transitionDuration) {
//     this.animatingCont(timeInAnimation);
//   } else {
//     this.animatingEnd();
//   }
//
//   this.updateDOM(this.startTranslateX, this.sliderWidth);
// }
//
// animatingCont(timeInAnimation) {
//   const startValue = this.animation.startX;
//   const changeInValue = this.animation.changeInValue;
//   this.startTranslateX = linearTween(timeInAnimation, startValue, changeInValue,
//     this.transitionDuration);
//   requestAnimationFrame(this.animationFrameCallback);
// }
//
// animatingEnd() {
//   // end animation
//   this.startTranslateX = this.animation.endX;
//   delete this.animation;
//   this.endAnimating();
// }
//
// endAnimating() {
//   this.animationFrameRequested = false;
//   this.loopState = IDLE;
//   this.velocity = 0;
//
//   if (this.opened) {
//     // document.body.style.overflowY = 'hidden';
//     this.scrim.style.pointerEvents = 'all';
//     this.content.classList.add('y-drawer-opened');
//   } else {
//     // document.body.style.overflowY = '';
//     this.scrim.style.pointerEvents = '';
//   }
//
//   this.content.style.willChange = '';
//   this.scrim.style.willChange = '';
//
//   this.fireEvent('transitioned');
// }

export default C => class extends componentCore(C) {

  // @override
  getComponentName() {
    return 'y-drawer';
  }

  // @override
  defaults() {
    return {
      opened: false,
      transitionDuration: 250,
      persistent: false,
      nativeMargin: 0,
      preventDefault: true,
    };
  }

  // @override
  sideEffects() {
    return {
      opened: x => this.opened$.next(x),
      persistent: x => this.persistent$.next(x),
    };
  }

  // @override
  setupComponent(el, props) {
    super.setupComponent(el, props);

    this::cacheDOMElements();
    this::setupObservables();
    // this.defProperties();
    // this.bindCallbacks();

    // this.jumpTo(this.opened);
    // if (!this.persistent) this.addEventListeners();
    if (this.persistent) this.scrim.style.display = 'none';

    return this;
  }

  close() {
    this.animateTo(false);
    return this;
  }

  open() {
    this.animateTo(true);
    return this;
  }

  toggle() {
    if (this.opened) {
      this.close();
    } else {
      this.open();
    }
    return this;
  }

  persist() {
    this.scrim.style.display = 'none';
    // this.removeEventListeners();
    this.setState('persistent', true);
  }

  unpersist() {
    this.scrim.style.display = '';
    // this.addEventListeners();
    this.setState('persistent', false);
  }

  animateTo() {
    // this.prepInteraction();
    // this.setState('opened', opened);
    // this.loopState = START_ANIMATING;
    // this.requestAnimationLoop();
  }

  jumpTo() {
    // this.prepInteraction();
    // this.setState('opened', opened);
    // this.loopState = IDLE;
    // this.startTranslateX = opened * this.sliderWidth;
    // this.endAnimating();
    // this.updateDOM(this.startTranslateX, this.sliderWidth);
  }
};
