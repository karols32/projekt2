
import { html, LitElement, render } from 'lit';
import { customElement } from 'lit/decorators.js';
import { guard } from 'lit/directives/guard.js';
import '@vaadin/select';
import '@vaadin/list-box';
import '@vaadin/item';
// import { applyTheme } from 'Frontend/generated/theme';

@customElement('ors-select')
export class Example extends LitElement {
  protected createRenderRoot() {
    const root = super.createRenderRoot();
    // Apply custom theme (only supported if your app uses one)
    return root;
  }

  render() {
    return html`
      <vaadin-select
        label="Wybierz profil:"
        value="driving-car"
        @change=${(e) => {
            this.dispatchEvent(new CustomEvent('vaadin-select-changed', {
                detail: {
                  value: e.target.value,
                },
              }))
        }}
        .renderer="${guard(
          [],
          () => (root: HTMLElement) =>
            render(
              html`
                <vaadin-list-box>
                  <vaadin-item value="cycling-regular">Rower</vaadin-item>
                  <vaadin-item value="foot-walking">Pieszo</vaadin-item>
                  <vaadin-item selected value="driving-car">Samochód</vaadin-item>
                </vaadin-list-box>
              `,
              root
            )
        )}"
      ></vaadin-select>
    `;
  }
}
