/*
 * 🍂 class ImageOverlay.Rotated
 * 🍂 inherits ImageOverlay
 *
 * Like `ImageOverlay`, but rotates and skews the image. This is done by using
 * *three* control points instead of *two*.
 *
 * @example
 *
 * ```
 * var latlngs = {};
 * latlngs.topleft    = L.latLng(40.52256691873593, -3.7743186950683594),
 * latlngs.topright   = L.latLng(40.5210255066156, -3.7734764814376835),
 * latlngs.bottomleft = L.latLng(40.52180437272552, -3.7768453359603886);
 *
 * var overlay = L.imageOverlay.rotated("./palacio.jpg", latlngs, {
 *   opacity: 0.4,
 *   interactive: true,
 *   attribution: "&copy; <a href='http://www.ign.es'>Instituto Geográfico Nacional de España</a>"
 * });
 * ```
 */
import L from 'leaflet';

L.ImageOverlay.Rotated = L.ImageOverlay.extend({
  initialize(image, latlngs, options) {
    if (typeof (image) === 'string') {
      this._url = image;
    }
    else {
      // Assume that the first parameter is an instance of HTMLImage or HTMLCanvas
      this._rawImage = image;
    }

    this._topLeft = L.latLng(latlngs.topleft);
    this._topRight = L.latLng(latlngs.topright);
    this._bottomLeft = L.latLng(latlngs.bottomleft);

    L.setOptions(this, options);
  },

  onAdd(map) {
    if (!this._image) {
      this._initImage();

      if (this.options.opacity < 1) {
        this._updateOpacity();
      }
    }

    if (this.options.interactive) {
      L.DomUtil.addClass(this._rawImage, 'leaflet-interactive');
      this.addInteractiveTarget(this._rawImage);
    }

    map.on('zoomend resetview', this._reset, this);

    this.getPane().appendChild(this._image);
    this._reset();
  },

  onRemove(map) {
    map.off('zoomend resetview', this._reset, this);
    L.ImageOverlay.prototype.onRemove.call(this, map);
  },

  _initImage() {
    let img = this._rawImage;
    if (this._url) {
      img = L.DomUtil.create('img');
      img.style.display = 'none';
      // Hide while the first transform (zero or one frames) is being done

      if (this.options.crossOrigin) {
        img.crossOrigin = '';
      }

      img.src = this._url;
      this._rawImage = img;
    }
    L.DomUtil.addClass(img, 'leaflet-image-layer');

    // this._image is reused by some of the methods of the parent class and
    // must keep the name, even if it is counter-intuitive.
    this._image = L.DomUtil.create(
      'div',
      `leaflet-image-layer ${this._zoomAnimated ? 'leaflet-zoom-animated' : ''}`,
    );

    const div = this._image;

    this._updateZIndex(); // apply z-index style setting to the div (if defined)

    div.appendChild(img);

    div.onselectstart = L.Util.falseFn;
    div.onmousemove = L.Util.falseFn;

    img.onload = function onload() {
      this._reset();
      img.style.display = 'block';
      this.fire('load');
    }.bind(this);

    img.alt = this.options.alt;
  },

  _reset() {
    const div = this._image;

    // Project control points to container-pixel coordinates
    const pxTopLeft = this._map.latLngToLayerPoint(this._topLeft);
    const pxTopRight = this._map.latLngToLayerPoint(this._topRight);
    const pxBottomLeft = this._map.latLngToLayerPoint(this._bottomLeft);

    // Infer coordinate of bottom right
    const pxBottomRight = pxTopRight.subtract(pxTopLeft).add(pxBottomLeft);

    // pxBounds is mostly for positioning the <div> container
    const pxBounds = L.bounds([pxTopLeft, pxTopRight, pxBottomLeft, pxBottomRight]);
    const size = pxBounds.getSize();
    const pxTopLeftInDiv = pxTopLeft.subtract(pxBounds.min);

    // Calculate the skew angles, both in X and Y
    const vectorX = pxTopRight.subtract(pxTopLeft);
    const vectorY = pxBottomLeft.subtract(pxTopLeft);
    const skewX = Math.atan2(vectorX.y, vectorX.x);
    const skewY = Math.atan2(vectorY.x, vectorY.y);

    // LatLngBounds used for animations
    this._bounds = L.latLngBounds(
      this._map.layerPointToLatLng(pxBounds.min),
      this._map.layerPointToLatLng(pxBounds.max),
    );

    L.DomUtil.setPosition(div, pxBounds.min);

    div.style.width = `${size.x}px`;
    div.style.height = `${size.y}px`;

    const imgW = this._rawImage.width;
    const imgH = this._rawImage.height;
    if (!imgW || !imgH) {
      return;
    // Probably because the image hasn't loaded yet.
    }

    const scaleX = pxTopLeft.distanceTo(pxTopRight) / (imgW * Math.cos(skewX));
    const scaleY = pxTopLeft.distanceTo(pxBottomLeft) / (imgH * Math.cos(skewY));

    this._rawImage.style.transformOrigin = '0 0';

    this._rawImage.style.transform = `translate(${pxTopLeftInDiv.x}px, ${pxTopLeftInDiv.y}px)`
      + `skew(${skewY}rad, ${skewX}rad) `
      + `scale(${scaleX}, ${scaleY}) `;
  },

  reposition(topleft, topright, bottomleft) {
    this._topLeft = L.latLng(topleft);
    this._topRight = L.latLng(topright);
    this._bottomLeft = L.latLng(bottomleft);
    this._reset();
  },

  setUrl(url) {
    this._url = url;

    if (this._rawImage) {
      this._rawImage.src = url;
    }
    return this;
  },
});

/* 🍂factory imageOverlay.rotated(imageUrl: String|HTMLImageElement|HTMLCanvasElement,
 * latlngs: Object, options?: ImageOverlay options)
 * Instantiates a rotated/skewed image overlay, given the image URL and
 * the `LatLng`s of three of its corners.
 *
 * Alternatively to specifying the URL of the image, an existing instance of `HTMLImageElement`
 * or `HTMLCanvasElement` can be used.
 */

L.imageOverlay.rotated = function rotated(imgSrc, latlngs, options) {
  return new L.ImageOverlay.Rotated(imgSrc, latlngs, options);
};
