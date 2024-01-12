import "@vaadin/notification";
import type { NotificationLitRenderer } from "@vaadin/notification/lit.js";
import { notificationRenderer } from "@vaadin/notification/lit.js";
import L, { LeafletMouseEvent } from "leaflet";
import { LitElement, css, html, render } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import eventBus from "../../event/eventBus";
import { OrsApi } from "../../ors-api/ors-api";
import "../ors-custom-contextmenu";
import "../ors-progress-bar";
import markerIconGreen from "./assets/img/marker-icon-green.png";
import markerIconRed from "./assets/img/marker-icon-red.png";
import config from "../../ors-api/config";
import { IIsochronesOptions } from "../../ors-api/IIsochronesOptions";

@customElement("ors-map")
export class OrsMap extends LitElement {
  @state() map?: L.Map;
  @state() contextMenu?: L.Popup;
  @state() markerGreen?: L.Marker = new L.Marker([0, 0], {
    opacity: 0,
    draggable: true,
  });
  @state() markerRed?: L.Marker = new L.Marker([0, 0], {
    opacity: 0,
    draggable: true,
  });
  @state() searchMarker: L.Marker = new L.Marker([0, 0], {
    opacity: 0,
  });

  @state() isochronesMarker: L.Marker = new L.Marker([0, 0], { opacity: 0});

  @state() currentLatLng?: L.LatLng;
  @state() orsApi: OrsApi = new OrsApi();
  @state() routeStartLabel: string = "";
  @state() routeStopLabel: string = "";
  @state() searchLabel: string = "";
  @state() routeLayer?: L.GeoJSON = new L.GeoJSON();
  @state() isochronesLayer?: L.GeoJSON = new L.GeoJSON();
  @state() isochronesSearchLabel: string = "";
  @state() currentProfile: string = "driving-car";

  @property({ type: Number }) currentTabIdx: number = 0;
  @property({ type: String }) rangeSliderValue: string = '2000';
  @property({ type: String }) intervalSliderValue: string = '1000';
  @property({type: String}) isochroneRenderingType: string = 'distance';

  @state() basemap: L.TileLayer = new L.TileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: "OpenStreetMap",
    }
  );

  @state() startIcon = new L.Icon({
    iconUrl: markerIconGreen,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  @state() endIcon = new L.Icon({
    iconUrl: markerIconRed,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  @state() routeStyle = {
    color: "#ff7800",
    weight: 5,
    opacity: 0.65,
  };

  initMap = (): void => {
    this.map = new L.Map("map", {
      center: new L.LatLng(51.236525, 22.4998601),
      zoom: 18,
    });
  };

  renderer: NotificationLitRenderer = () => html`
    <vaadin-horizontal-layout theme="spacing" style="align-items: center;">
      <div>Odległość pomiędzy punktami jest większa niż 600km</div>
    </vaadin-horizontal-layout>
  `;

  renderNotification = () => {
    render(
      html`<vaadin-notification
        class="notification"
        theme="error"
        duration="3000"
        position="bottom-center"
        ?opened=${true}
        ${notificationRenderer(this.renderer, [])}
      ></vaadin-notification>`,
      document.body
    );
  };

  // connectionError: NotificationLitRenderer = (error) => ;

  renderConnectionNotification = (error) => {
    render(
      html`<vaadin-notification
        class="notification"
        theme="error"
        duration="3000"
        position="bottom-center"
        ?opened=${true}
        ${notificationRenderer(
          () => html`
            <vaadin-horizontal-layout
              theme="spacing"
              style="align-items: center;"
            >
              <div>${error}</div>
            </vaadin-horizontal-layout>
          `
        )}
      ></vaadin-notification>`,
      document.body
    );
  };

  routeService = async (type?): Promise<void> => {
    if (
      this.markerGreen!.options.opacity === 1 &&
      this.markerRed!.options.opacity === 1
    ) {
      if (
        this.markerGreen!.getLatLng().distanceTo(this.markerRed!.getLatLng()) <
        700000
      ) {
        try {
          const feature = await this.orsApi.route(
            this.markerGreen!.getLatLng(),
            this.markerRed!.getLatLng(),
            this.currentProfile
          );
          if ((feature as any).error) {
            throw new Error((feature as any).error.message);
          }

          this.routeLayer!.clearLayers().addData(feature as any);
          render(html``, document.body);
        } catch (e: any) {
          this.renderConnectionNotification(e);
        }
      } else if (
        this.markerGreen!.getLatLng().distanceTo(this.markerRed!.getLatLng()) >=
        700000
      ) {
        this.routeLayer!.clearLayers();
        this.renderNotification();
      }
    } else {
      render(html``, document.body);
    }
  };

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has("currentTabIdx")) {
      if (this.currentLatLng) {
        this.updateContextMenu();
      }
      this.routeLayer?.clearLayers();
      this.routeStartLabel = "";
      this.routeStopLabel = "";
      this.searchLabel = "";
      this.isochronesSearchLabel = "";
    }
    
  }

  updateContextMenu = (): void => {
    let orsContextMenuContainer = document.createElement("div");

    render(
      html`<ors-custom-contextmenu
        .currentTabIdx=${this.currentTabIdx}
      ></ors-custom-contextmenu>`,
      orsContextMenuContainer
    );

    this.contextMenu
      ?.setLatLng(this.currentLatLng!)
      .bindPopup(orsContextMenuContainer, {
        closeButton: false,
        minWidth: 250,
      })
      .addTo(this.map!)
      .openPopup();
  };

  addListeners = (): void => {
    this.map!.on("contextmenu", (e: LeafletMouseEvent) => {
      this.currentLatLng = e.latlng;
      this.updateContextMenu();
    });

    this.markerGreen!.on("moveend", (e) => {
      this.currentLatLng = e.target.getLatLng();

      eventBus.dispatch("add-marker", { type: "start" });
      this.routeService();
    });

    this.markerRed!.on("moveend", (e) => {
      this.currentLatLng = e.target.getLatLng();
      eventBus.dispatch("add-marker", { type: "end" });
      this.routeService();
    });

    eventBus.on("range-change", async (data) => { 
      this.rangeSliderValue = data.value;
      this.isValid(parseInt(this.rangeSliderValue), parseInt(this.intervalSliderValue)) ? this.routeIsochrones() : ''; 
    })

    eventBus.on("interval-change", async (data) => {
      this.intervalSliderValue = data.value;
      this.isValid(parseInt(this.rangeSliderValue), parseInt(this.intervalSliderValue)) ? this.routeIsochrones() : ''; 
    })

    eventBus.on("isochrone-render-change", async (data) => {
      this.isochroneRenderingType = data.value;
    })

    eventBus.on("change-profile", async (data) => {
      this.currentProfile = data.profileName;
    })

    eventBus.on("add-marker", async (data) => {
      render(
        html`<progress-bar-request></progress-bar-request>`,
        document.body
      );

      switch (data.type) {
        case "start":
          this.markerGreen?.setOpacity(0);

          this.routeStartLabel = await this.orsApi.reverseGeocode(
            this.currentLatLng!
          );

          this.markerGreen!.setLatLng(this.currentLatLng!).setOpacity(1);
          break;
        case "end":
          this.markerRed?.setOpacity(0);

          this.routeStopLabel = await this.orsApi.reverseGeocode(
            this.currentLatLng!
          );
          this.markerRed!.setLatLng(this.currentLatLng!).setOpacity(1);
          break;
        case "search":
          this.searchMarker?.setOpacity(0);
          this.searchLabel  = await this.orsApi.reverseGeocode(
            this.currentLatLng!
          );
          this.searchMarker!.setLatLng(this.currentLatLng!).setOpacity(1);
          break;

        case "isochrones":
        this.isochronesMarker?.setOpacity(0);
        this.isochronesSearchLabel = await this.orsApi.reverseGeocode(this.currentLatLng!)
        this.isochronesMarker!.setLatLng(this.currentLatLng!).setOpacity(1);
        this.isValid(parseInt(this.rangeSliderValue), parseInt(this.intervalSliderValue)) ? this.routeIsochrones() : '';
          break;
      }

      this.contextMenu?.close();
      // this.currentLatLng = undefined;
      this.routeService(data.type); 
    });

    eventBus.on("add-marker-geocode", async (data) => {
      const coords = new L.LatLng(data.coords[1], data.coords[0])!;

      switch (data.type) {
        case "start":
          this.markerGreen!.setLatLng(coords).setOpacity(1);
          this.routeStartLabel = data.label
          break;
        case "end":
          this.markerRed!.setLatLng(coords).setOpacity(1);
          this.routeStopLabel = data.label
          break;
        case "search":
          this.searchMarker!.setLatLng(coords).setOpacity(1);
          this.searchLabel = data.label
          break;

        case "isochrones":
          this.isochronesMarker!.setLatLng(coords).setOpacity(1);
          this.isochronesSearchLabel = data.label;
      }
      this.contextMenu?.close();
      // this.currentLatLng = undefined;
      this.routeService(data.type);
    });

    eventBus.on("hide-marker", async (data) => {
      switch (data.type) {
        case "start":
          this.markerGreen!.setOpacity(0);
          break;
        case "end":
          this.markerRed!.setOpacity(0);
          break;
        case "search":
          this.searchMarker!.setOpacity(0);
          break;
        case "isochrones":
          this.isochronesMarker!.setOpacity(0);
      }
      this.contextMenu?.close();
      // this.currentLatLng = undefined;
      this.routeLayer!.clearLayers();
    });
  };

  firstUpdated(props: any) {
    super.firstUpdated(props);

    this.initMap();
    this.basemap?.addTo(this.map!);
    this.contextMenu = new L.Popup();
    this.routeLayer!.setStyle(this.routeStyle).addTo(this.map!);
    this.markerGreen?.addTo(this.map!).setIcon(this.startIcon);
    this.markerRed?.addTo(this.map!).setIcon(this.endIcon);
    this.searchMarker?.addTo(this.map!).setIcon(this.startIcon);
    this.isochronesMarker?.addTo(this.map!).setIcon(this.endIcon);
    this.addListeners();
  }

  // routeIsochrones = async (type?): Promise<void> => {}

  async routeIsochrones(profileType = this.currentProfile):Promise<void>{
    console.warn('Function [routeIsochrones] triggered')

    const { isochrones } = config;

    const isochronesOptions: IIsochronesOptions = {
      location: this.isochronesMarker!.getLatLng(),
      interval: parseInt(this.intervalSliderValue),
      range: parseInt(this.rangeSliderValue),
      renderingType: this.isochroneRenderingType
    }

    await this.orsApi.addIsochrones(`${isochrones}/${profileType}`, isochronesOptions).then(r => {
      console.log(r);

      this.isochronesLayer!.clearLayers();
      const defaultIsochroneColors = [
        '#2b83ba',
        '#64abb0',
        '#9dd3a7',
        '#c7e9ad',
        '#edf8b9',
        '#ffedaa',
        '#fec980',
        '#f99e59',
        '#e85b3a',
        '#d7191c'
        ]
  
      r.features.forEach((feature, index) => {
        this.isochronesLayer!.addData(feature)
        this.isochronesLayer!.setStyle({opacity: 0.6, color: defaultIsochroneColors[index]});
        this.isochronesLayer!.addTo(this.map!);
      })
      });

  }

  isValid(range, interval){
    const isRangeMoreThanInterval = range > interval;
    const isIsochronesNumberOk = (range/interval) <=10
    
    return isRangeMoreThanInterval && isIsochronesNumberOk;
  }



  static styles? = css`
    .notification {
      display: flex !important;
      align-items: center;
      justify-content: center;
      height: calc(100vh - var(--docs-space-l) * 2);
    }
  `;
}
