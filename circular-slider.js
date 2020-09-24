// Helper to build SVG elements / trees
const svg = (tag, attrs = {}, ...children) => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag)
  Object.keys(attrs).forEach(attr => {
    el.setAttributeNS(null, attr, attrs[attr])
  })
  children.forEach(c => {
    if (!c.toString()) return // Skip empty strings
    if (typeof c !== 'object') {
      c = document.createTextNode(c.toString())
    }
    el.appendChild(c)
  })
  return el
}

// Helper to build HTML elements / trees
const html = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag)
  Object.keys(attrs).forEach(attr => {
    el.setAttribute(attr, attrs[attr])
  })
  children.forEach(c => {
    if (!c.toString()) return // Skip empty strings
    if (typeof c !== 'object') {
      c = document.createTextNode(c.toString())
    }
    el.appendChild(c)
  })
  return el
}

// Helper to generate a fallback random color
const randomColor = () => `hsl(${Math.floor(Math.random() * 360)}, 100%, ${Math.floor(Math.random() * 50) + 25}%)`

// Helper to generate a random ID
const randomId = (len = 5) => `_${Math.random().toString(36).substr(2, len)}`

/**
 * Circular Slider
 *
 * Instantiate:
 * cont slider = new CircularSlider(container = Node, sliderConfigs = [], globalConfig = {})
 * - sliderConfigs Array  reqired  Array of config objects for individual sliders
 * - globalConfig  Object optional Aditional configuration for all sliders
 *
 * Slider configuration object:
 * - id        String optional (default: random)
 * - color     String optional (default: random) Color for the slider
 * - min       Number optional (default: 0)
 * - max       Number optional (default: 100)
 * - step      Number optional (default: 1)
 * - value     Number optional (default: 0)
 *
 * Global configuration object:
 * - thickness   Number optional (default: 20) Change the thickness of the sliders
 * - innerRadius Number optional (default: 40) Adjust the inner radius size
 */
class CircularSlider {
  constructor (container, slidersConfigs, globalConfig) {
    this.dom = this._constructContainer(container)
    this.sliders = []
    this.globalConfig = Object.assign({ thickness: 20, innerRadius: 40 }, globalConfig)
    // Initialize default sliders
    slidersConfigs.forEach(sliderConfig => this.appendSlider(sliderConfig))
    // Initialize event handlers on the interactive surface
    this._eventHandlers()
  }

  appendSlider (sliderConfig) {
    if (this.sliders.findIndex(s => s.id === sliderConfig.id) > -1) {
      throw new Error(`Cannot create slider ${sliderConfig.id} (id collision).`)
    }
    this.sliders.push(this._constructSlider(sliderConfig))
  }

  onChange (onChangeCallback) {
    // TODO: Run callback when values change
    onChangeCallback({ id: 'foo', value: 'bar' })
  }

  getValue (sliderId) {
    if (!sliderId) {
      return this.sliders.map(({ id, value }) => ({ id, value }))
    }
    return this.sliders.find(slider => slider.id === sliderId)?.value
  }

  setValue (sliderId, value) {
    const sliderIdx = this.sliders.findIndex(slider => slider.id === sliderId)
    if (sliderIdx < 0) return
    this._updateSliderValue(sliderIdx, value)
  }

  /**
   * Main function that will construct the DOM with the
   * SVG container and the info label area
   */
  _constructContainer (containerNode) {
    // Generate basic DOM for the area with sliders
    const slidersWrapper = html('div', { class: 'cs__sliders' })
    const slidersSvg = svg('svg', { class: 'cs__sliders-gfx', preserveAspectRatio: 'xMidYMid meet' })
    const interactiveSurface = html('div', { class: 'cs__sliders-surface' })
    slidersWrapper.appendChild(slidersSvg)
    slidersWrapper.appendChild(interactiveSurface)

    // Generate basic DOM for the area with color legend and values
    const infoWrapper = html('ul', { class: 'cs__info' })

    // Append all to the container
    const fragments = new DocumentFragment()
    fragments.appendChild(slidersWrapper)
    fragments.appendChild(infoWrapper)
    containerNode.appendChild(fragments)

    // Return references to DOM nodes
    return {
      sliders: slidersSvg,
      info: infoWrapper,
      interactiveSurface
    }
  }

  /**
   * Main function that handles initial rendering of the sliders
   */
  _constructSlider ({
    id = randomId(),
    min = 0,
    max = 100,
    step = 1,
    value = 0,
    color = randomColor()
  }) {
    if (value < min) {
      throw new Error('Provided slider value can not be smaller than min.')
    }
    const [radius, viewBox, valueToArcRatio] = this._calculateRenderProps(min, max)

    // Update the container's viewBox
    this.dom.sliders.setAttributeNS(null, 'viewBox', viewBox)

    // Create new slider arc
    const sliderElement = svg('path', {
      class: 'cs__slider',
      stroke: color,
      'stroke-width': this.globalConfig.thickness,
      d: this._drawArc((value - min) * valueToArcRatio, radius)
    })

    // Create info item
    const infoItem = html('li', { class: 'cs__info-item' },
      html('i', { class: 'cs__info-legend', style: `background-color:${color}` }))
    const valueElement = html('span', { class: 'cs__info-value' }, value)
    infoItem.appendChild(valueElement)

    // Append to DOM
    this.dom.sliders.appendChild(sliderElement)
    this.dom.info.appendChild(infoItem)

    // Return references to DOM nodes with all calculated constants
    return {
      sliderElement,
      valueElement,
      id,
      min,
      max,
      step,
      value,
      valueToArcRatio,
      radius
    }
  }

  // Precalculate as many constants as possible for each new slider added to the drawing
  _calculateRenderProps (min, max) {
    // Each slider will have a radius of idx*100
    const radius = (this.globalConfig.thickness + 20) * (this.sliders.length + 1) + this.globalConfig.innerRadius
    // Based on that calculate the SVG's coords system
    // with 0,0 being the center of the sliders
    const size = (radius + this.globalConfig.thickness) * 2
    const offset = size / -2
    const viewBox = `${offset} ${offset} ${size} ${size}`
    // Also calculate the constant for value adjusted radians
    const valueToArcRatio = 2 * Math.PI / (max - min)
    return [radius, viewBox, valueToArcRatio]
  }

  // Convert the value adjusted by the min offset to angle
  _valueToRadians (value0, valueToArcRatio) {
    return value0 * valueToArcRatio
  }

  // Convert a touch/pointer coordinates to angle
  _coordsToRadians (x, y) {
    const tan = Math.atan2(x, y)
    return x < 0 ? 2 * Math.PI + tan : tan
  }

  // Convert angle to coordinates on the arc
  _radiansToArcCoords (angle, radius) {
    return [Math.sin(angle) * radius, -(Math.cos(angle) * radius)]
  }

  // Return the SVG path of the arc
  _drawArc (angle, radius) {
    const [x, y] = this._radiansToArcCoords(angle, radius)
    // Example (radius = 100):
    // M 0 -100
    //   ^ Start drawing the arc at coordinate 0 -100 at 12 o'clock (Y axis is inverted)
    // A 100 100 0 0 1 0 100
    //   ^ A = arc, 100 100 = circle, 0 = irrelevant, 0 = irrelevant, 1 = clockwise, 0 100 = coords opposite of the starting point at 6 o'clock.
    //   ^ Result is half-circle from 12 o'clock 0,-100 to 6 o'clock 0,100
    // A 10 10 0 0 1 -100 0
    //   ^ Continue a new arc on the other side from 6 o'clock 0,100 to 9'oclock -100,0
    //   ^ Result is an arc that is 3/4 of a circle.
    return x > 0
      ? `M0 ${-radius}A${radius} ${radius} 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`
      : `M0 ${-radius}A${radius} ${radius} 0 0 1 0 ${radius}A${radius},${radius} 0 0 1 ${x.toFixed(2)},${y.toFixed(2)}`
  }

  _moveSlider (sliderIdx, angle) {
    const { sliderElement, radius } = this.sliders[sliderIdx]
    const arc = this._drawArc(angle, radius)
    sliderElement.setAttributeNS(null, 'd', arc)
  }

  _getInteractiveSurfaceCenter () {
    const r = this.dom.interactiveSurface.getBoundingClientRect()
    const w = Math.round(r.width)
    const h = Math.round(r.height)
    // X and Y are adjusted for the center of the sliders
    const x = Math.round(r.x + r.width / 2)
    const y = Math.round(r.y + r.height / 2)
    return [x, y]
  }

  _eventHandlers () {
    const state = {
      isMoving: false,
      center: this._getInteractiveSurfaceCenter()
    }
    const evtOpts = { passive: true }

    const start = e => {
      // TODO: determine active slider
      state.isMoving = true
    }

    const stop = () => { state.isMoving = false }

    const move = e => {
      if (!state.isMoving) return
      e.stopPropagation()
      window.requestAnimationFrame(() => {
        const angle = this._coordsToRadians(e.clientX - state.center[0], -(e.clientY - state.center[1]))
        this._moveSlider(1, angle)
      })
    }

    // Bind only necessary listeners
    if ('onmousemove' in window) {
      this.dom.interactiveSurface.addEventListener('mousedown', start, evtOpts)
      this.dom.interactiveSurface.addEventListener('mouseup', stop, evtOpts)
      this.dom.interactiveSurface.addEventListener('mouseleave', stop, evtOpts)
      this.dom.interactiveSurface.addEventListener('mousemove', move, evtOpts)
    }
    if ('ontouchmove' in window) {
      this.dom.interactiveSurface.addEventListener('touchmove', move, evtOpts)
      this.dom.interactiveSurface.addEventListener('touchstart', start, evtOpts)
      this.dom.interactiveSurface.addEventListener('touchend', stop, evtOpts)
      this.dom.interactiveSurface.addEventListener('touchcancel', stop, evtOpts)
    }

    // If window resizes, recalculate the interactive surface DOMRect
    window.addEventListener('resize', () => {
      window.requestAnimationFrame(() => {
        state.center = this._getInteractiveSurfaceCenter()
      })
    }, evtOpts)
  }

  _updateSliderValue (sliderIdx, value) {
    this.sliders[sliderIdx].value = value
    this.sliders[sliderIdx].valueElement.value = value
    // TODO: change also slider element
  }
}
