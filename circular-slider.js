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

class CircularSlider {
  constructor (container, slidersConfigs) {
    this.dom = this._constructContainer(container)
    this.sliders = []
    slidersConfigs.forEach(sliderConfig => this.appendSlider(sliderConfig))
  }

  appendSlider (sliderConfig) {
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
    const { value } = this.sliders.find(slider => slider.id === sliderId)
    return value
  }

  setValue (sliderId, value) {
    const sliderIdx = this.sliders.findIndex(slider => slider.id === sliderId)
    if (sliderIdx < 0) return
    this._updateSliderValue(sliderIdx, value)
  }

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
      info: infoWrapper
    }
  }

  _constructSlider ({ id, color, min = 0, max = 100, step = 1, value = 0}) {
    // Create SVG circle
    const [r, viewBox] = this._recalculateDimensions()
    this.dom.sliders.setAttributeNS(null, 'viewBox', viewBox)
    /**
     * SVG arc:
     * M 0,-300               # Starting point: x = 0, y = -r
     * A 300,300 0 0 1 0,300  # Draw half arc: r,r angle irrelevant clockwise end-point
     * A 300,300 0 0 1 0,-300 # Draw other half: r,r angle, irrelevant clockwise, end-point
     */
    const sliderElement = svg('path', {
      class: 'cs__slider',
      d: `M0,${-r}A${r},${r} 0 0 1 0,${r}A${r},${r} 0 0 1 0,${-r}`,
      stroke: color
    })

    // Create info item
    const infoItem = html('li', { class: 'cs__info-item' },
      html('i', { class: 'cs__info-legend', style: `background-color:${color}` }))
    const valueElement = html('span', { class: 'cs__info-value' }, value)
    infoItem.appendChild(valueElement)

    // Append to DOM
    this.dom.sliders.appendChild(sliderElement)
    this.dom.info.appendChild(infoItem)

    // Return references to DOM nodes
    return {
      sliderElement,
      valueElement,
      id,
      value
    }
  }

  _recalculateDimensions () {
    const radius = 100 * (this.sliders.length + 1)
    const size = radius * 2 + 20
    const offset = size / -2
    return [radius, `${offset} ${offset} ${size} ${size}`]
  }

  _updateSliderValue (sliderIdx, value) {
    this.sliders[sliderIdx].value = value
    this.sliders[sliderIdx].valueElement.value = value
    // TODO: change also slider element
  }
}
