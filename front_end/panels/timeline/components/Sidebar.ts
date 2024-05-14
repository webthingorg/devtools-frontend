import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import sidebarStyles from './sidebar.css.js';

const {html, Decorators, LitElement} = LitHtml;
const {customElement} = Decorators;

declare global {
    interface HTMLElementTagNameMap {
      'devtools-sidebar': Sidebar;
    }
  }

@customElement('custom-greeting')
 export class Sidebar extends LitElement {
  static override styles = [sidebarStyles];

constructor() {
    super();
}

  override render() {
    return html`<p class="sidebar">Hello, cutie!</p>`;
  }
}