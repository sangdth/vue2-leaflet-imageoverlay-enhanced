<script>
import L from 'leaflet';
import { findRealParent, propsBinder } from 'vue2-leaflet';
import './leafletImageOverlayRotated';

const props = {
  url: {
    type: String,
  },
  latlngs: {
  },
  opacity: {
    type: Number,
    default: 1.0,
  },
  alt: {
    type: String,
    default: '',
  },
  interactive: {
    type: Boolean,
    default: false,
  },
  crossOrigin: {
    type: Boolean,
    default: false,
  },
  errorOverlayUrl: {
    type: String,
    default: '',
  },
  visible: {
    type: Boolean,
    custom: true,
    default: true,
  },
};

export default {
  name: 'LImageOverlayRotated',
  props,

  data() {
    return {
      ready: false,
    };
  },

  mounted() {
    const options = {
      opacity: this.opacity,
      alt: this.alt,
      interactive: this.interactive,
      crossOrigin: this.crossOrigin,
      errorOverlayUrl: this.errorOverlayUrl,
    };

    this.mapObject = L.imageOverlay.rotated(this.url, this.latlngs, options);

    L.DomEvent.on(this.mapObject, this.$listeners);
    propsBinder(this, this.mapObject, props);
    this.parentContainer = findRealParent(this.$parent);
    this.parentContainer.addLayer(this, !this.visible);
  },

  watch: {
    latlngs: {
      deep: true,
      handler(){
        this.mapObject.reposition(this.latlngs)
      }
    }
  },

  beforeDestroy() {
    this.parentContainer.removeLayer(this);
  },

  methods: {
    setVisible(newVal, oldVal) {
      if (newVal === oldVal) return;
      if (this.mapObject) {
        if (newVal) {
          this.parentContainer.addLayer(this);
        }
        else {
          this.parentContainer.removeLayer(this);
        }
      }
    },
    getBounds() {
      return this.mapObject.getBounds();
    },
  },

  render() {
    return null;
  },
};
</script>
