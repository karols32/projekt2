import "@vaadin/icon";
import "@vaadin/icons";
import "@vaadin/text-field";
import "@vaadin/tabsheet";
import "@vaadin/tabs";
import L from "leaflet";
import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "../ors-search"
import "../ors-route-tab"
import "../ors-select"
import eventBus from "../../event/eventBus";

@customElement("ors-panel")
export class OrsPanel extends LitElement {

  @property({type:String }) isochronesSearchLabel: string = "";
  @property({ type: Object }) map?: L.Map;
  @property({ type: String}) routeStartLabel: string = "";
  @property({ type: String }) routeStopLabel: string = "";
  @property({ type: String }) searchLabel: string = "";
  @property({ type: Number }) currentTabIdx: number = 0;

  @property({type: Number}) minInterval: number = 1000;
  @property({type: Number}) minRange: number = 2000;

  @property({type: String}) value: string = 'distance';
  @property({type: Boolean}) isDistance: boolean = true;


  firstUpdated(props: any) {
    super.firstUpdated(props);
  }

  searchTab = () => {
    return  html`<vaadin-text-field
    id="searchAddress"
    theme="small"
    clear-button-visible
    placeholder="Konstantynów 1A-1E, Lublin,LU,Polska"
    label="Wpisz adres:"
  >
    <vaadin-icon
      icon="vaadin:search"
      slot="suffix"
      @click=${(e) => {
        console.log("klik");
      }}
    ></vaadin-icon>
  </vaadin-text-field>`
  }

  routeTab = () => {
    return ;
  };

  render() {
    return html`
      <h4>Open Route Service - sample</h4>
      <ors-select
      @vaadin-select-changed=${(e) => {
            const { detail } = e;
            const profileName = detail.value;
            eventBus.dispatch("change-profile", 
            {profileName: profileName});
          }}
      ></ors-select>
      <vaadin-tabsheet>
        <vaadin-tabs
          slot="tabs"
          @selected-changed=${(e) => {
            const { value } = e.detail;
            this.currentTabIdx = value;
            this.dispatchEvent(
              new CustomEvent("tab-index-changed", {
                detail: {
                  idx: value,
                },
              })
            );
          }}
        >
          <vaadin-tab id="find-tab">Wyszukaj</vaadin-tab>
          <vaadin-tab id="route-tab">Trasa</vaadin-tab>
          <vaadin-tab id="reach-tab">Izochrony</vaadin-tab>
        </vaadin-tabs>

        <div tab="find-tab"><ors-search .type=${"search"} .searchTerm=${this.searchLabel}> </ors-search></div>
        <div tab="route-tab"><ors-route-tab .routeStartLabel=${this.routeStartLabel}
         routeStopLabel=${this.routeStopLabel} ></ors-route-tab></div>
        <div tab="reach-tab">Sprawdź dostępność izochron
        <ors-search
        .searchTerm=${this.isochronesSearchLabel}
        .type=${"isochrones"}
        .label=${"Adres centrum izochrony"}
      ></ors-search>
      <p>Ustaw opcje generowania izochron</p>
      <vaadin-list-box selected="1"  @click=${(e) => { 
        if(e.target.value !== this.value){
          this.value = e.target.value

          eventBus.dispatch("isochrone-render-change", 
          {value: e.target.value});
          this.isDistance = !this.isDistance;
        }

        }        
      }>
          <vaadin-item value="time">Czas</vaadin-item>
          <vaadin-item value="distance">Dystans</vaadin-item>
      </vaadin-list-box>

      <div style="display: ${this.isDistance ? '' : 'none'}">
      <p>Zasięg</p>
      <p>${this.minRange/1000} km</p>
      <input style="width: 100%" type="range" min="2000" max="15000" value="2000" step="1000" @change=${(e) => {
          const value = e.target.value
          this.minRange = value;
          eventBus.dispatch("range-change", 
          {value: value});
        }}>

        <p>Intervał</p>
        <p>${this.minInterval/1000} km</p>

        <input style="width: 100%" type="range" min="1000" max="10000" value="1000" step="1000" @change=${(e) => {
          const value = e.target.value
          this.minInterval = value;
          eventBus.dispatch("interval-change", 
          {value: value});
        }}>
        </div>


      <div style="display: ${this.isDistance ? 'none' : ''}">
      <p>Zasięg</p>
      <p ?hidden="${this.isDistance}">${this.minRange} minut</p>
      <input style="width: 100%" type="range" min="100" max="3600" value="100" step="100" @change=${(e) => {
          const value = e.target.value
          this.minRange = value;
          eventBus.dispatch("range-change", 
          {value: value});
        }}>

        <p>Intervał</p>
        <p ?hidden="${this.isDistance}">${this.minInterval} minut</p>

        <input style="width: 100%" type="range" min="100" max="3600" value="100" step="100" @change=${(e) => {
          const value = e.target.value
          this.minInterval = value;
          eventBus.dispatch("interval-change", 
          {value: value});
        }}>
        </div>



        </div>
      </vaadin-tabsheet>
    `;
  }

  static styles? = css`
    :host {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 10px;
      background-color: rgba(255, 255, 255, 0.9);
      width: 400px;
      height: 94%;
      overflow: auto;
    }

    h4 {
      text-align: center;
    }
    vaadin-text-field {
      width: 100%;
    }
    vaadin-tabsheet {
      height: 93%;
    }
    input[type="range"] {
    /* removing default appearance */
    -webkit-appearance: none;
    appearance: none; 
    /* creating a custom design */
    width: 100%;
    cursor: pointer;
    outline: none;
    /*  slider progress trick  */
    overflow: hidden;
    border-radius: 16px;
  }
  
  /* Track: webkit browsers */
  input[type="range"]::-webkit-slider-runnable-track {
    height: 15px;
    background: #ccc;
    border-radius: 16px;
  }
  
  /* Track: Mozilla Firefox */
  input[type="range"]::-moz-range-track {
    height: 15px;
    background: #ccc;
    border-radius: 16px;
  }
  
  /* Thumb: webkit */
  input[type="range"]::-webkit-slider-thumb {
    /* removing default appearance */
    -webkit-appearance: none;
    appearance: none; 
    /* creating a custom design */
    height: 15px;
    width: 15px;
    background-color: #fff;
    border-radius: 50%;
    border: 2px solid #f50;
    /*  slider progress trick  */
    box-shadow: -407px 0 0 400px #f50;
  }
  
  
  /* Thumb: Firefox */
  input[type="range"]::-moz-range-thumb {
    height: 15px;
    width: 15px;
    background-color: #fff;
    border-radius: 50%;
    border: 1px solid #f50;
    /*  slider progress trick  */
    box-shadow: -407px 0 0 400px #f50;
  }
  `;
}
