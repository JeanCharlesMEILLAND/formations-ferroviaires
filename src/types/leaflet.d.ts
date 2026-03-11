import "leaflet";

declare module "leaflet" {
  interface MarkerClusterGroupOptions {
    chunkedLoading?: boolean;
    maxClusterRadius?: number;
    spiderfyOnMaxZoom?: boolean;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    singleMarkerMode?: boolean;
    disableClusteringAtZoom?: number;
    removeOutsideVisibleBounds?: boolean;
    animate?: boolean;
    animateAddingMarkers?: boolean;
    iconCreateFunction?: (cluster: MarkerCluster) => L.Icon | L.DivIcon;
  }

  interface MarkerCluster extends L.Marker {
    getChildCount(): number;
    getAllChildMarkers(): L.Marker[];
    getBounds(): L.LatLngBounds;
  }

  class MarkerClusterGroup extends L.FeatureGroup {
    constructor(options?: MarkerClusterGroupOptions);
    addLayer(layer: L.Layer): this;
    removeLayer(layer: L.Layer): this;
    clearLayers(): this;
    getVisibleParent(marker: L.Marker): L.Marker;
    refreshClusters(markers?: L.Marker[]): this;
    hasLayer(layer: L.Layer): boolean;
  }

  function markerClusterGroup(
    options?: MarkerClusterGroupOptions
  ): MarkerClusterGroup;
}

declare module "leaflet.markercluster" {
  // Module augmentation is in "leaflet" above
}
