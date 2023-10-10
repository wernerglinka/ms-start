const loadLeaflet = (function() {
  const isStylesheetLoaded = (url) => {
    return Array.from(document.styleSheets).some(styleSheet => {
      if (styleSheet.href) {
        return styleSheet.href === url;
      }
      return false;
    });
  }

  const loadStylesheet = (url, integrity, crossOrigin) => {
    if (!isStylesheetLoaded(url)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.integrity = integrity;
      link.crossOrigin = crossOrigin;
      document.head.appendChild(link);
    } else {
      console.log('Stylesheet is already loaded.');
    }
  }

  const loadLeafletScript = () => {
    return new Promise((resolve, reject) => {
        if (typeof L !== 'undefined') {
            resolve();
            return;
        }

        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';

        script.onload = function() {
            resolve();
        };

        script.onerror = function() {
            reject(new Error('Failed to load the Leaflet script.'));
        };

        document.head.appendChild(script);
    });
  }

  const init = () => {
    loadStylesheet('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=', '');

    loadLeafletScript().then((res, err) => {
      const allMaps = document.querySelectorAll(".js-leaflet-map > div");

      allMaps.forEach(map => {
        const mapId = map.getAttribute('id');
        const mapContainer = document.getElementById(mapId);
        const latitute = mapContainer.dataset.latitute;
        const longitude = mapContainer.dataset.longitude;
        const zoom = mapContainer.dataset.zoom;
        const markers = JSON.parse(mapContainer.dataset.markers);
        
        const mapOptions = {
          center: [ latitute, longitude ],
          zoom
        };

        // paint the map
        const thisMap = new L.map(mapId, mapOptions);
        const layer = new L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
        thisMap.addLayer(layer);

        // add markers
        markers.forEach(marker => {

          console.log(JSON.stringify(marker, null, 2));

          const markerTitle = marker.title;
          const markerContent = `
            <h4>${marker.content.title}</h4>
            <p>${marker.content.body}</p>
            <a href="${marker.content.link}" target="_blank" rel="noopener noreferrer">Read more</a>`;
          const thisLatitute = marker.latitute;
          const thisLongitude = marker.longitude;
          const thisMarker = L.marker([thisLatitute, thisLongitude],{title: markerTitle })
            .addTo(thisMap)
            .bindPopup(markerContent);

          const showMarkerInfo = (e) => {
            var popup = e.target.getPopup();
            var content = popup.getContent();
          }
          thisMarker.on('click', showMarkerInfo);
        });

      });

    }).catch(error => {
        console.error(error);
    });
  }


  return { init };
})();

export default loadLeaflet;