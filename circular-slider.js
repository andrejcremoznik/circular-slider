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
 * const slider = new CircularSlider(container = Node, sliderConfigs = [], globalConfig = {})
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
 * - label     String optional (default: '')
 *
 * Global configuration object:
 * - thickness   Number optional (default: 20) Change the thickness of the sliders
 * - innerRadius Number optional (default: 40) Adjust the inner radius size
 */
class CircularSlider {
  constructor (container, slidersConfigs, globalConfig) {
    this.uid = randomId()
    this.pi2 = 2 * Math.PI
    this.globalConfig = Object.assign({ thickness: 20, innerRadius: 40 }, globalConfig)
    this.interactiveSurfaceProps = [0, 0, 1] // center x and y offsets, px to svg coords ratio
    this.sliders = []
    this.dom = this._constructContainer(container)
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
    // this._updateSliderValue(sliderIdx, value)
  }

  /**
   * Main function that will construct the DOM with the
   * SVG container and the info label area
   */
  _constructContainer (containerNode) {
    // Generate basic DOM for the area with sliders
    const slidersWrapper = html('div', { class: 'cs__sliders' })
    const slidersSvg = svg('svg', { class: 'cs__sliders-gfx', preserveAspectRatio: 'xMidYMid meet' })

    const dragHandleSize = Math.ceil(this.globalConfig.thickness / 2)
    const slidersDragHandle = svg('defs', {}, svg('marker', {
      id: `cs-handle${this.uid}`,
      class: 'cs__slider-handle',
      viewBox: `0 0 ${dragHandleSize * 2 + 2} ${dragHandleSize * 2 + 2}`,
      refX: dragHandleSize + 1,
      refY: dragHandleSize + 1,
      markerWidth: dragHandleSize * 2 + 6,
      markerHeight: dragHandleSize * 2 + 6,
      markerUnits: 'userSpaceOnUse'
    }, svg('circle', { cx: dragHandleSize + 1, cy: dragHandleSize + 1, r: dragHandleSize })))
    slidersSvg.appendChild(slidersDragHandle)

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
    color = randomColor(),
    label = ''
  }) {
    if (value < min) {
      throw new Error('Provided slider value can not be smaller than min.')
    }
    const [
      radius,
      size,
      viewBox,
      valueToArcRatio,
      stepToArcRatio,
      arcToValueRatio,
      value0,
      strokeDashArray,
      stepDecimals
    ] = this._calculateRenderProps(value, min, max, step)

    // Update the container's viewBox
    this.dom.sliders.setAttributeNS(null, 'viewBox', viewBox)
    this._updateInteractiveSurfaceProps(size)


    // Create new slider arc
    const sliderElement = svg('path', {
      class: 'cs__slider',
      stroke: color,
      'stroke-width': this.globalConfig.thickness,
      'marker-end': `url(#cs-handle${this.uid})`,
      d: this._drawArc(this._valueToRadians(value0, valueToArcRatio), radius)
    })
    // Create background circle circle decoration
    const sliderDecor = svg('path', {
      class: 'cs__slider-decor',
      'stroke-width': this.globalConfig.thickness,
      'stroke-dasharray': strokeDashArray,
      d: this._drawArc(this.pi2, radius)
    })
    const sliderFragments = new DocumentFragment()
    sliderFragments.appendChild(sliderDecor)
    sliderFragments.appendChild(sliderElement)

    // Create info item
    const infoItem = html('li', { class: 'cs__info-item' },
      html('i', { class: 'cs__info-legend', style: `background-color:${color}` }),
      label && html('span', { class: 'cs__info-label' }, label)
    )
    const valueElement = html('span', { class: 'cs__info-value' }, value.toFixed(stepDecimals))
    infoItem.appendChild(valueElement)

    // Append to DOM
    this.dom.sliders.appendChild(sliderFragments)
    this.dom.info.appendChild(infoItem)

    // Return references to DOM nodes with all calculated constants
    return {
      sliderElement,
      valueElement,
      id,
      min,
      max,
      step,
      stepDecimals,
      value,
      valueToArcRatio,
      stepToArcRatio,
      arcToValueRatio,
      radius
    }
  }

  // Precalculate as many constants as possible for each new slider added to the drawing
  _calculateRenderProps (value, min, max, step) {
    // Each slider will have a radius of:
    // (thickness + <distance between tracks>) * (number of sliders + 1) + innerRadius
    const radius = (this.globalConfig.thickness + 20) * (this.sliders.length + 1) + this.globalConfig.innerRadius
    // Based on that calculate the SVG's coords system with 0,0 being the center of the sliders
    const size = (radius + this.globalConfig.thickness) * 2
    const offset = size / -2
    const viewBox = `${offset} ${offset} ${size} ${size}`
    // Zero-adjusted values
    const value0 = value - min
    const max0 = max - min
    // Calculate the constant for value and step adjusted radians
    const valueToArcRatio = this.pi2 / max0
    const stepToArcRatio = this.pi2 / (max0 / step)
    const arcToValueRatio = max0 / this.pi2
    // Calculate dasharray value to render step size on the arc
    const stepDash = stepToArcRatio * radius
    // If stepDash is really short, multiply it by 10 for appearance reasons
    const strokeDashArray = `${((stepDash < 10 ? stepDash * 10 : stepDash) - 1).toFixed(5)} 1`
    // Count number of step decimals to be used to round the value for display
    const stepDecimals = step.toString().split('.')[1]?.length || 0
    return [radius, size, viewBox, valueToArcRatio, stepToArcRatio, arcToValueRatio, value0, strokeDashArray, stepDecimals]
  }

  /**
   * The interactive surface is a div covering the SVG with the sliders. All events are intercepted there.
   * In order to map trigger points to the underlying SVG, the div's coordinate system needs to be matched
   * to the SVGs local coordinate system. This changes every time a new slider is added or the graphic rescales.
   */
  _updateInteractiveSurfaceProps (svgSize) {
    if (!svgSize) {
      svgSize = Number.parseInt(this.dom.sliders.getAttribute('viewBox').split(' ').pop(), 10)
    }
    window.requestAnimationFrame(() => {
      const r = this.dom.interactiveSurface.getBoundingClientRect()
      const halfSize = Math.round(r.width / 2)
      // Left and top offsets to the center of the interactive surface
      const leftOffset = Math.round(r.x) + halfSize
      const topOffset = Math.round(r.y) + halfSize
      // Browser pixels to SVG coords ratio
      const pxToSvgRatio = svgSize / (halfSize * 2)
      this.interactiveSurfaceProps = [leftOffset, topOffset, pxToSvgRatio]
    })
  }

  // Convert the value adjusted by the min offset to angle
  _valueToRadians (value0, valueToArcRatio) {
    return value0 * valueToArcRatio
  }

  // Convert a touch/pointer coordinates to angle
  _coordsToRadians (x, y) {
    const tan = Math.atan2(x, y)
    return x < 0 ? this.pi2 + tan : tan
  }

  // Convert angle to coordinates on the arc
  _radiansToArcCoords (angle, radius) {
    return [Math.sin(angle) * radius, -(Math.cos(angle) * radius)]
  }

  // Adjust any angle to the closest step multiplier
  _radiansToStepAngle (angle, stepToArcRatio) {
    const overhead = angle % stepToArcRatio
    const adjustedAngle = angle - overhead
    return overhead > stepToArcRatio / 2
      ? Math.min(adjustedAngle + stepToArcRatio, this.pi2)
      : Math.max(adjustedAngle, 0.001) // Need a value > 0 to avoid a rendering bug
  }

  // Convert angle to value
  _radiansToValue (angle, arcToValueRatio, min, stepDecimals) {
    const value0 = angle === 0.001 ? 0 : angle * arcToValueRatio
    return (value0 + min).toFixed(stepDecimals)
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

  // Main drawing function
  _moveSlider (sliderIdx, angle) {
    const { sliderElement, radius, stepToArcRatio, arcToValueRatio, min, stepDecimals } = this.sliders[sliderIdx]
    const snapAngle = this._radiansToStepAngle(angle, stepToArcRatio)
    const snapValue = this._radiansToValue(snapAngle, arcToValueRatio, min, stepDecimals)
    const arc = this._drawArc(snapAngle, radius)
    this.sliders[sliderIdx].angle = angle
    this.sliders[sliderIdx].value = Number.parseFloat(snapValue)
    sliderElement.setAttributeNS(null, 'd', arc)
    this.sliders[sliderIdx].valueElement.textContent = snapValue
  }

  /**
   * All event handlers are bound to the interacive surface - a div covering the SVG graphic
   */
  _eventHandlers () {
    const state = { activeSlider: -1 }
    // Interactive area should be slightly thicker than the stroke of the arc
    // as this is calculated from the center of the stroke, we only need half of it
    const thickness = this.globalConfig.thickness / 2 + 5

    const start = e => {
      // Determine active slider:
      // Click X and Y adjusted to interactive surface
      const x = e.clientX - this.interactiveSurfaceProps[0]
      const y = -(e.clientY - this.interactiveSurfaceProps[1])
      // Longest side of this triangle is equal to radius: h^2 = x^2 + y^2
      const h = Math.sqrt(Math.pow(Math.abs(x), 2) + Math.pow(Math.abs(y), 2))
      // Adjust the radius form browser pixels to the SVGs local coords
      const r = h * this.interactiveSurfaceProps[2]
      // The click will activate the slider if the radius is within the arc's stroke
      state.activeSlider = this.sliders.findIndex(({ radius }) =>
        radius - thickness < r && radius + thickness > r)
      // If a slider stroke is clicked, move arc to it
      if (state.activeSlider > -1) {
        const angle = this._coordsToRadians(x, y)
        this._moveSlider(state.activeSlider, angle)
      }
    }

    const stop = () => { state.activeSlider = -1 }

    const move = e => {
      e.stopPropagation()
      window.requestAnimationFrame(() => {
        if (state.activeSlider < 0) return
        const x = e.clientX - this.interactiveSurfaceProps[0]
        const y = -(e.clientY - this.interactiveSurfaceProps[1])
        // Prevent the slider from jumping from 100% to 0% or back when dragged over the end
        const lockedX = y > 0
          ? this.sliders[state.activeSlider].angle > Math.PI
            ? Math.min(-1, x)
            : Math.max(1, x)
          : x
        const angle = this._coordsToRadians(lockedX, y)
        this._moveSlider(state.activeSlider, angle)
      })
    }

    // Bind only necessary listeners
    const evtOpts = { passive: true }
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
        this._updateInteractiveSurfaceProps()
      })
    }, evtOpts)
  }
}
