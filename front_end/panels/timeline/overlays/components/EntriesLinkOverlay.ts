
// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../../../../core/i18n/i18n.js';
import * as ComponentHelpers from '../../../../ui/components/helpers/helpers.js';
import * as IconButton from '../../../../ui/components/icon_button/icon_button.js';
import * as ThemeSupport from '../../../../ui/legacy/theme_support/theme_support.js';
import * as LitHtml from '../../../../ui/lit-html/lit-html.js';

const UIStrings = {
  /**
   *@description Accessible label used to explain to a user that they are viewing an arrow representing a link between two entries.
   */
  diagram: 'Links bteween entries',
};
const str_ = i18n.i18n.registerUIStrings('panels/timeline/overlays/components/EntriesLinkOverlay.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

import styles from './entriesLinkOverlay.css.js';
import {type EntriesLink} from '../OverlaysImpl.js';

export enum CreateState {
  INITIAL = 'INITIAL',
  BUTTON_TO_CREATE = 'BUTTON_TO_CREATE',
  CREATING = 'CREATING',
  CREATED = 'CREATED',
}

export class CreateEntriesLinkRemoveEvent extends Event {
  static readonly eventName = 'createentrieslinkremoveevent';

  constructor() {
    super(CreateEntriesLinkRemoveEvent.eventName);
  }
}

export class EntriesLinkOverlay extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-entries-link-overlay`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  readonly #boundRender = this.#render.bind(this);
  #coordinateFrom: {x: number, y: number};
  #fromEntryDimentions: {width: number, height: number};
  #coordinateTo: {x: number, y: number};
  #toEntryDimentions: {width: number, height: number}|null = null;
  // #connectorLineContainer: SVGAElement|null = null;
  // #connector: SVGLineElement|null = null;
  // #entryFromWrapper: SVGLineElement|null = null;
  // #entryToWrapper: SVGLineElement|null = null;
  #entryFromVisible: boolean = true;
  #entryToVisible: boolean = true;

  // These flags let us know if the entry we are drawing from/to are the
  // originals, or if they are the parent, which can happen if an entry is
  // collapsed. We care about this because if the entry is not the source, we
  // draw the border as dashed, not solid.
  #fromEntryIsSource: boolean = true;
  #toEntryIsSource: boolean = true;

  #createState: CreateState = CreateState.INITIAL;

  constructor(
      overlay: EntriesLink,
      initialFromEntryCoordinateAndDimentions: {x: number, y: number, width: number, height: number}) {
    super();
    this.#render();
    this.#coordinateFrom = {x: initialFromEntryCoordinateAndDimentions.x, y: initialFromEntryCoordinateAndDimentions.y};
    this.#fromEntryDimentions = {
      width: initialFromEntryCoordinateAndDimentions.width,
      height: initialFromEntryCoordinateAndDimentions.height,
    };
    this.#coordinateTo = {x: initialFromEntryCoordinateAndDimentions.x, y: initialFromEntryCoordinateAndDimentions.y};
    this.createState = overlay.state;

    const createLinkIcon = this.#shadow.querySelector<HTMLElement>('.crate-connection-icon') ?? null;
    createLinkIcon?.addEventListener('click', () => {
      console.assert(this.#createState === CreateState.BUTTON_TO_CREATE);
      this.#createState = CreateState.CREATING;
      overlay.state = CreateState.CREATING;
      this.dispatchEvent(new CreateEntriesLinkRemoveEvent());
      // this.#render();
      // this.red
    });
  }

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [styles];
  }

  /**
   * If one entry that is linked is in a collapsed track, we show the outlines
   * but hide only the arrow.
   */
  set hideArrow(shouldHide: boolean) {
    const connectorLineContainer = this.#shadow.querySelector<SVGAElement>('.connectorContainer') ?? null;
    const connector = connectorLineContainer?.querySelector('line') ?? null;
    if (connector) {
      connector.style.display = shouldHide ? 'none' : 'block';
    }
  }

  set fromEntryCoordinateAndDimentions(fromEntryParams: {x: number, y: number, length: number, height: number}) {
    this.#coordinateFrom = {x: fromEntryParams.x, y: fromEntryParams.y};
    this.#fromEntryDimentions = {width: fromEntryParams.length, height: fromEntryParams.height};
    this.#redrawConnectionArrow();
  }

  set entriesVisibility(entriesVisibility: {fromEntryVisibility: boolean, toEntryVisibility: boolean}) {
    this.#entryFromVisible = entriesVisibility.fromEntryVisibility;
    this.#entryToVisible = entriesVisibility.toEntryVisibility;
  }

  // The arrow might be pointing either to an entry or an empty space.
  // If the dimentions are not passed, it is pointing at an empty space.
  set toEntryCoordinateAndDimentions(toEntryParams: {x: number, y: number, length?: number, height?: number}) {
    this.#coordinateTo = {x: toEntryParams.x, y: toEntryParams.y};
    if (toEntryParams.length && toEntryParams.height) {
      this.#toEntryDimentions = {width: toEntryParams.length, height: toEntryParams.height};
    } else {
      this.#toEntryDimentions = null;
    }

    this.#redrawConnectionArrow();
  }

  set fromEntryIsSource(x: boolean) {
    if (x === this.#fromEntryIsSource) {
      return;
    }
    this.#fromEntryIsSource = x;
    this.#render();
  }

  set toEntryIsSource(x: boolean) {
    if (x === this.#toEntryIsSource) {
      return;
    }
    this.#toEntryIsSource = x;
    this.#render();
  }

  set createState(createState: CreateState) {
    // if(this.#createState === createState){
    //   return;
    // }
    this.#createState = createState;
    this.#render();
  }

  #redrawConnectionArrow(): void {
    const connectorLineContainer = this.#shadow.querySelector<SVGAElement>('.connectorContainer') ?? null;
    const connector = connectorLineContainer?.querySelector('line') ?? null;
    const entryFromWrapper = connectorLineContainer?.querySelector('.entryFromWrapper') ?? null;
    const entryToWrapper = connectorLineContainer?.querySelector('.entryToWrapper') ?? null;
    const createLinkIcon = this.#shadow.querySelector<HTMLElement>('.crate-connection-icon') ?? null;
    if (!connector || !entryFromWrapper || !entryToWrapper) {
      console.error('`connector` element is missing.');
      return;
    }

    if (createLinkIcon) {
      createLinkIcon.style.left = `${this.#coordinateFrom.x + this.#fromEntryDimentions.width}px`;
      createLinkIcon.style.top = `${this.#coordinateFrom.y}px`;
    }

    // If the entry is visible, the entry arrow starts from the end on the X axis and middle of the Y axis.
    // If not, draw it to the same y point without the entry height offset and the box around the entry.
    // This way it will be attached to the track edge.
    if (this.#entryFromVisible) {
      const halfEntryHeight = this.#fromEntryDimentions.height / 2;
      connector.setAttribute('x1', (this.#coordinateFrom.x + this.#fromEntryDimentions.width).toString());
      connector.setAttribute('y1', (this.#coordinateFrom.y + Number(halfEntryHeight)).toString());

      entryFromWrapper.setAttribute('visibility', 'visible');
      entryFromWrapper.setAttribute('x', this.#coordinateFrom.x.toString());
      entryFromWrapper.setAttribute('y', this.#coordinateFrom.y.toString());
      entryFromWrapper.setAttribute('width', this.#fromEntryDimentions.width.toString());
      entryFromWrapper.setAttribute('height', this.#fromEntryDimentions.height.toString());
    } else {
      connector.setAttribute('x1', (this.#coordinateFrom.x + this.#fromEntryDimentions.width).toString());
      connector.setAttribute('y1', this.#coordinateFrom.y.toString());
      entryFromWrapper.setAttribute('visibility', 'hidden');
    }

    // If the arrow is pointing to the entry, point it to the middle of the entry and draw a box around the entry.
    // If the arrow is pointing to an entry, but it is not visible, the coordinates are for the edge of the track
    // and we don't need the half entry height offset.
    // Otherwise, thhe arrow is following the mouse so we assign it to the provided coordinates.
    if (this.#toEntryDimentions) {
      if (this.#entryToVisible) {
        entryToWrapper.setAttribute('visibility', 'visible');
        entryToWrapper.setAttribute('x', this.#coordinateTo.x.toString());
        entryToWrapper.setAttribute('y', this.#coordinateTo.y.toString());
        entryToWrapper.setAttribute('width', this.#toEntryDimentions.width.toString());
        entryToWrapper.setAttribute('height', this.#toEntryDimentions.height.toString());

        connector.setAttribute('x2', this.#coordinateTo.x.toString());
        connector.setAttribute('y2', (this.#coordinateTo.y + this.#toEntryDimentions.height / 2).toString());

      } else {
        entryToWrapper.setAttribute('visibility', 'hidden');
        connector.setAttribute('x2', this.#coordinateTo.x.toString());
        connector.setAttribute('y2', (this.#coordinateTo.y).toString());
      }

    } else {
      entryToWrapper.setAttribute('visibility', 'hidden');
      connector.setAttribute('x2', this.#coordinateTo.x.toString());
      connector.setAttribute('y2', this.#coordinateTo.y.toString());
    }

    const arrowColor = ThemeSupport.ThemeSupport.instance().getComputedValue('--color-text-primary');
    connector.setAttribute('stroke', arrowColor);
    connector.setAttribute('stroke-width', '2');

    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  /*
  The entries link overlay is an arrow connecting 2 entries.
  The Entries are drawn by Flamechart and this Overlay is only drawing the arrow between them.
   _________
  |__entry__|\
              \
               \          <-- arrow connecting the sides of entries drawn by this overlay
                \   ________________
                 ➘ |_____entry______|
  */
  #render(): void {
    const arrowColor = ThemeSupport.ThemeSupport.instance().getComputedValue('--color-text-primary');
    // clang-format off
    LitHtml.render(
        LitHtml.html`
          <div class="wrapper">
            <svg class="connectorContainer" width="100%" height="100%" role="region" aria-label=${i18nString(UIStrings.diagram)}>
              <defs>
                <marker
                  id='arrow'
                  orient="auto"
                  markerWidth='3'
                  markerHeight='4'
                  refX='4'
                  refY='2'>
                  <path d='M0,0 V4 L4,2 Z' fill=${arrowColor} />
                </marker>
              </defs>
              <line marker-end='url(#arrow)'/>
              <rect class="entryFromWrapper" fill="none" stroke=${arrowColor} stroke-dasharray=${this.#fromEntryIsSource ? 'none' : DASHED_STROKE_AMOUNT} />
              <rect class="entryToWrapper" fill="none" stroke=${arrowColor} stroke-dasharray=${this.#toEntryIsSource ? 'none' : DASHED_STROKE_AMOUNT} />
              
            </svg>
            ${this.#createState === CreateState.BUTTON_TO_CREATE ? LitHtml.html`
              <${IconButton.Icon.Icon.litTagName}
                class='crate-connection-icon'
                name='play'>
              </${IconButton.Icon.Icon.litTagName}>
            `: LitHtml.html`
              <!-- <${IconButton.Icon.Icon.litTagName}
                class='crate-connection-icon'
                name='plus'>
              </${IconButton.Icon.Icon.litTagName}> -->
            `}
          </div>
        `,
        this.#shadow, {host: this});
    // clang-format on
  }
}

// Defines the gap in the border when we are drawing a dashed outline.
// https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray
const DASHED_STROKE_AMOUNT = 4;

customElements.define('devtools-entries-link-overlay', EntriesLinkOverlay);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-entries-link-overlay': EntriesLinkOverlay;
  }
}
