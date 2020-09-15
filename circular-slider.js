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
    // TODO: Return value for specified slider
    console.log(`Get value for ${sliderId}`)
  }

  setValue (sliderId, value) {
    // TODO: Set value for specified slider
    console.log(`Set value ${value} for ${sliderId}`)
  }

  _constructContainer (containerNode) {
    // TODO: generate DOM
    return {
      sliders: '', // TODO: SVG
      info: '' // TODO: color legend and values
    }
  }

  _constructSlider ({ id, color, min = 0, max = 100, step = 1, value = 0}) {
    // TODO: generate DOM for slider =>
    const sliderElement = ''
    // this.dom.sliders.append(sliderElement)

    // TODO: generate DOM for legend and value =>
    const valueElement = ''
    // this.dom.info.append()

    // Return references to DOM nodes
    return {
      sliderElement,
      valueElement,
      id,
      value
    }
  }
}
