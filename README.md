# Circular Slider

Open `index.html` in browser.

There are no dependecies or JS transpilation. Only latest browsers supported.

## How to use

Include `circular-slider.js` and `circular-slider.css`.

Instantiate the sliders:

```js
const slider = new CircularSlider(
  document.getElementById('element'),
  [
    { id: 's1', value: 12 },
    // ...
  ]
)
```

### Configuration

```js
const slider = new CircularSlider(container = Node, sliderConfigs = [], globalConfig = {})
```

**container**

Type: `Node`

An existing DOM node.

**sliderConfigs**

Type: `Array`

An array of slider configs to render. An individual slider's config is an `Object` with the following properties:

* `id` - Used to get the value for a specific slider programatically. Default: random string
* `color` - Define a custom color. Default: random color
* `min` - Minimal value. Default: 0
* `max` - Maximal value. Default: 100
* `step` - Value step size. Default: 1
* `value` - Initial value. Default: 0
* `label` - Label to be shown with the color. Default: empty string

All are optional but if you want to be able to identify individual sliders for use with `getValue` or `onChange` callback, an `id` should be provided.

**globalConfig**

Type: `Object`

Options that affect the appearance of all sliders.

* `thickness` - Thickness of the slider. Default: 20
* `innerRadius` - Radius to the inner most slider. Default: 40

These values are local to the SVG's coordinate system which is unlikely to align with screen pixels because its size is adaptive. For mathematical (performance) reasons, these values should be even numbers.

### Methods

```js
const slider = new CircularSlider(/* ... */)
```

* `slider.appendSlider({ sliderConfig })` - Append an aditional slider.
* `slider.onChange(callback)` - Run the `callback` function every time the value is changed. `callback` receives an object param with the slider ID and its value.
* `slider.getValue('x')` - Get the value for the slider with the ID `x`. If no ID is given, returns all sliders' values.
* `slider.setValue('x', 123)` - Set the value of the slider with ID `x` to `123`.

## Known issues

* No support for Android Firefox due to [PointerEvents](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events#Browser_compatibility). Can be worked around by slightly complicating things with Mouse and Touch events.
* You can not scroll the page down with a swipe if the start point is over the sliders element. Could be worked around by adding an overlay over the empty center that would re-enable touch actions.
* There are major accessibility concerns with the current implementation because there's no way to adjust the values other than dragging over an empty area. This could be fixed by making the values on the side adjustable via hidden `<input>` controls accessible to screen readers. This is not a small task.
* The usability of the sliders solely depends on the use. You can technically add an unlimited number of them but they wouldn't be usable. Especially on mobile devices, the interactive elements get very small real fast. I would not use this type of control in a real product but it's a cool test assignment.

### Nice to have

* Mousewheel over slider to increase/decrease the value.
