// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../../../../core/platform/platform.js';
import * as UI from '../../legacy.js';

import {BezierUI} from './BezierUI.js';

import {type AnimationTimingModel} from './AnimationTimingModel.js';
import {CSSLinearEasingModel} from './CSSLinearEasingModel.js';

type Params = {
  container: Element,
  bezier: UI.Geometry.CubicBezier,
  onBezierChange: (bezier: UI.Geometry.CubicBezier) => void,
};

class BezierCurveUI {
  #curveUI: BezierUI;
  #bezier: UI.Geometry.CubicBezier;
  #curve: Element;
  #mouseDownPosition?: UI.Geometry.Point;
  #controlPosition?: UI.Geometry.Point;
  #selectedPoint?: number;
  #onBezierChange: (bezier: UI.Geometry.CubicBezier) => void;

  constructor({bezier, container, onBezierChange}: Params) {
    this.#bezier = bezier;
    this.#curveUI = new BezierUI({
      width: 150,
      height: 250,
      marginTop: 50,
      controlPointRadius: 7,
      shouldDrawLine: true,
    });

    this.#curve = UI.UIUtils.createSVGChild(container, 'svg', 'bezier-curve');
    this.#onBezierChange = onBezierChange;

    UI.UIUtils.installDragHandle(
        this.#curve, this.dragStart.bind(this), this.dragMove.bind(this), this.dragEnd.bind(this), 'default');
  }

  private dragStart(event: MouseEvent): boolean {
    this.#mouseDownPosition = new UI.Geometry.Point(event.x, event.y);
    const ui = this.#curveUI;
    this.#controlPosition = new UI.Geometry.Point(
        Platform.NumberUtilities.clamp((event.offsetX - ui.radius) / ui.curveWidth(), 0, 1),
        (ui.curveHeight() + ui.marginTop + ui.radius - event.offsetY) / ui.curveHeight());

    const firstControlPointIsCloser = this.#controlPosition.distanceTo(this.#bezier.controlPoints[0]) <
        this.#controlPosition.distanceTo(this.#bezier.controlPoints[1]);
    this.#selectedPoint = firstControlPointIsCloser ? 0 : 1;

    this.#bezier.controlPoints[this.#selectedPoint] = this.#controlPosition;
    this.#onBezierChange(this.#bezier);

    event.consume(true);
    return true;
  }

  private updateControlPosition(mouseX: number, mouseY: number): void {
    if (this.#mouseDownPosition === undefined || this.#controlPosition === undefined ||
        this.#selectedPoint === undefined) {
      return;
    }
    const deltaX = (mouseX - this.#mouseDownPosition.x) / this.#curveUI.curveWidth();
    const deltaY = (mouseY - this.#mouseDownPosition.y) / this.#curveUI.curveHeight();
    const newPosition = new UI.Geometry.Point(
        Platform.NumberUtilities.clamp(this.#controlPosition.x + deltaX, 0, 1), this.#controlPosition.y - deltaY);
    this.#bezier.controlPoints[this.#selectedPoint] = newPosition;
  }

  private dragMove(event: MouseEvent): void {
    this.updateControlPosition(event.x, event.y);
    this.#onBezierChange(this.#bezier);
  }

  private dragEnd(event: MouseEvent): void {
    this.updateControlPosition(event.x, event.y);
    this.#onBezierChange(this.#bezier);
  }

  setBezier(bezier: UI.Geometry.CubicBezier): void {
    this.#bezier = bezier;
    this.draw();
  }

  draw(): void {
    this.#curveUI.drawCurve(this.#bezier, this.#curve);
  }
}

type Point = {input: number, output: number};
type Position = {x: number, y: number};
class LinearEasingUI {
    #model: CSSLinearEasingModel;
    #onChange: (model: CSSLinearEasingModel) => void;

    #selectedPointIndex?: number;
    #doubleClickTimer?: number;
    #lastClickedPointIndex?: number;
    #mouseDownPosition?: { x: number, y: number };
    #renderedPositions?: {x:number, y: number}[];

    #width: number;
    #height: number;
    #radius: number;
    #marginTop: number;

    #svg: Element;

    constructor({
        model,
        container,
        onChange,
    }: {
        model: CSSLinearEasingModel,
        container: HTMLElement,
        onChange: (model: CSSLinearEasingModel) => void,
    }) {
        this.#model = model;
        this.#onChange = onChange;

        this.#width = 150;
        this.#height = 250;
        this.#radius = 7;
        this.#marginTop = 50;

        this.#svg = UI.UIUtils.createSVGChild(container, 'svg', 'bezier-curve linear');

        UI.UIUtils.installDragHandle(
            this.#svg, this.#dragStart.bind(this), this.#dragMove.bind(this), this.#dragEnd.bind(this), 'default');
    }

    #curveWidth(): number {
      return this.#width - this.#radius * 2;
    }

    #curveHeight(): number {
      return this.#height - this.#radius * 2 - this.#marginTop * 2;
    }

    #handleLineClick(event: MouseEvent, target: SVGElement): void {
      const newPoint = this.#positionToTimingPoint({x: event.offsetX, y: event.offsetY});
      this.#model.addPoint(newPoint, Number(target.dataset.lineIndex));
      this.#selectedPointIndex = undefined;
      this.#mouseDownPosition = undefined;
    }

    #handleControlPointClick(event: MouseEvent, target: SVGElement): void {
      this.#selectedPointIndex = Number(target.dataset.pointIndex);
      this.#mouseDownPosition = {x: event.x, y: event.y};

      clearTimeout(this.#doubleClickTimer);
      if (this.#lastClickedPointIndex === this.#selectedPointIndex) {
        this.#model.removePoint(this.#selectedPointIndex);
        this.#lastClickedPointIndex = undefined;
        this.#selectedPointIndex = undefined;
        this.#mouseDownPosition = undefined;
        return;
      }

      this.#lastClickedPointIndex = this.#selectedPointIndex;
      this.#doubleClickTimer = window.setTimeout(() => {
        this.#lastClickedPointIndex = undefined;
      }, 300);
    }

    #dragStart(event: MouseEvent): boolean {
      if (!(event.target instanceof SVGElement)) {
        return false;
      }

      if (event.target.dataset.lineIndex !== undefined) {
        this.#handleLineClick(event, event.target);
        event.consume(true);
        return true;
      }

      if (event.target.dataset.pointIndex !== undefined) {
        this.#handleControlPointClick(event, event.target);
        event.consume(true);
        return true;
      }

      return false;
    }

    #updatePointPosition(mouseX: number, mouseY: number): void {
      if (this.#selectedPointIndex === undefined || this.#mouseDownPosition === undefined) {
        return;
      }

      const controlPosition = this.#renderedPositions?.[this.#selectedPointIndex];
      if (!controlPosition) {
        return;
      }

      const deltaX = mouseX - this.#mouseDownPosition.x;
      const deltaY = mouseY - this.#mouseDownPosition.y;

      this.#mouseDownPosition = {
        x: mouseX,
        y: mouseY,
      };

      const newPoint = {
        x: controlPosition.x + deltaX,
        y: controlPosition.y + deltaY,
      };

      this.#model.setPoint(this.#selectedPointIndex, this.#positionToTimingPoint(newPoint));
    }

    #dragMove(event: MouseEvent): void {
      this.#updatePointPosition(event.x, event.y);
      this.#onChange(this.#model);
    }

    #dragEnd(event: MouseEvent): void {
      this.#updatePointPosition(event.x, event.y);
      this.#onChange(this.#model);
    }

    #drawControlPoint(parentElement: Element, controlX: number, controlY: number, index: number): void {
        const circle = UI.UIUtils.createSVGChild(parentElement, 'circle', 'bezier-control-circle');
        circle.setAttribute('data-point-index', String(index));
        circle.setAttribute('cx', String(controlX));
        circle.setAttribute('cy', String(controlY));
        circle.setAttribute('r', String(this.#radius));
    }

    #timingPointToPosition(point: Point): Position {
      return {
        x: (point.input / 100) * this.#curveWidth(),
        y: (1 - point.output) * this.#curveHeight(),
      };
    }

    #positionToTimingPoint(position: Position): Point {
      return {
        input: (position.x / this.#curveWidth()) * 100,
        output: 1 - position.y / this.#curveHeight(),
      };
    }

    setCSSLinearEasingModel(model: CSSLinearEasingModel): void {
        this.#model = model;
        this.draw();
    }

    draw(): void {
        this.#svg.setAttribute('width', String(this.#curveWidth()));
        this.#svg.setAttribute('height', String(this.#curveHeight()));
        this.#svg.removeChildren();
        const group = UI.UIUtils.createSVGChild(this.#svg, 'g');

        const positions = this.#model.points().map(point => this.#timingPointToPosition(point));
        this.#renderedPositions = positions;

        let startingPoint = positions[0];
        for (let i = 1; i < positions.length; i++) {
          const position = positions[i];
          const line = UI.UIUtils.createSVGChild(group, 'path', 'bezier-path linear-path');
          line.setAttribute('d', `M ${startingPoint.x} ${startingPoint.y} L ${position.x} ${position.y}`);
          line.setAttribute('data-line-index', String(i));
          startingPoint = position;
        }

        for (let i = 0; i < positions.length; i++) {
            const point = positions[i];
            this.#drawControlPoint(group, point.x, point.y, i);
        }
    }
}

interface AnimationTimingUIParams {
  model: AnimationTimingModel;
  onChange: (model: AnimationTimingModel) => void;
}
export class AnimationTimingUI {
  #container: HTMLElement;
  #bezierContainer: HTMLElement;
  #linearEasingContainer: HTMLElement;
  #model: AnimationTimingModel;
  #onChange: (model: AnimationTimingModel) => void;
  #bezierCurveUI?: BezierCurveUI;
  #linearEasingUI?: LinearEasingUI;

  constructor({model, onChange}: AnimationTimingUIParams) {
    this.#container = document.createElement('div');
    this.#container.className = 'animation-timing-ui';
    this.#container.style.width = '150px';
    this.#container.style.height = '250px';

    this.#bezierContainer = document.createElement('div');
    this.#linearEasingContainer = document.createElement('div');

    this.#container.appendChild(this.#bezierContainer);
    this.#container.appendChild(this.#linearEasingContainer);

    this.#model = model;
    this.#onChange = onChange;

    if (this.#model instanceof UI.Geometry.CubicBezier) {
      this.#bezierCurveUI =
          new BezierCurveUI({bezier: this.#model, container: this.#bezierContainer, onBezierChange: this.#onChange});
    } else if (this.#model instanceof CSSLinearEasingModel) {
      this.#linearEasingUI = new LinearEasingUI({
        model: this.#model,
        container: this.#linearEasingContainer,
        onChange: this.#onChange,
      });
    }
  }

  element(): Element {
    return this.#container;
  }

  setModel(model: AnimationTimingModel): void {
    this.#model = model;
    if (this.#model instanceof UI.Geometry.CubicBezier) {
      if (this.#bezierCurveUI) {
        this.#bezierCurveUI.setBezier(this.#model);
      } else {
        this.#bezierCurveUI =
            new BezierCurveUI({bezier: this.#model, container: this.#bezierContainer, onBezierChange: this.#onChange});
      }

      this.#linearEasingContainer.classList.add('hidden');
      this.#bezierContainer.classList.remove('hidden');
    } else if (this.#model instanceof CSSLinearEasingModel) {
      if (this.#linearEasingUI) {
        this.#linearEasingUI.setCSSLinearEasingModel(this.#model);
      } else {
        this.#linearEasingUI = new LinearEasingUI({model: this.#model, container: this.#linearEasingContainer, onChange: this.#onChange});
      }

      this.#linearEasingContainer.classList.remove('hidden');
      this.#bezierContainer.classList.add('hidden');
    }

    this.draw();
  }

  draw(): void {
    if (this.#bezierCurveUI) {
      this.#bezierCurveUI.draw();
    }

    if (this.#linearEasingUI) {
      this.#linearEasingUI.draw();
    }
  }
}
