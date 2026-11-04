/**
 * CYB!RM - Cyberdeck Rotary Knob Component
 * Hardware-style interactive knob with drag, scroll wheel,
 * fine tuning with Shift, double-click to reset, and SVG/CSS neon glow.
 */

export class CyberKnob {
  constructor(element, options = {}) {
    this.el = element;
    this.label = options.label || '';
    this.min = options.min !== undefined ? options.min : 0;
    this.max = options.max !== undefined ? options.max : 1;
    this.value = options.value !== undefined ? options.value : this.min;
    this.defaultValue = this.value;
    this.step = options.step || 0.01;
    this.unit = options.unit || '';
    this.decimals = options.decimals !== undefined ? options.decimals : 2;
    this.onChange = options.onChange || null;

    this.isDragging = false;
    this.startY = 0;
    this.startVal = 0;

    this.render();
    this.bindEvents();
    this.updateUI();
  }

  render() {
    this.el.classList.add('cyber-knob-container');
    this.el.innerHTML = `
      ${this.label ? `<div class="knob-label">${this.label}</div>` : ''}
      <div class="knob-body">
        <div class="knob-dial">
          <div class="knob-pointer"></div>
        </div>
      </div>
      <div class="knob-val-display">${this.formatValue(this.value)}</div>
    `;
    this.dialEl = this.el.querySelector('.knob-dial');
    this.valEl = this.el.querySelector('.knob-val-display');
  }

  formatValue(v) {
    if (this.unit === 'Hz') {
      return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}Hz`;
    }
    if (this.unit === '%') {
      return `${Math.round(v * 100)}%`;
    }
    if (this.unit === 'ms') {
      return `${Math.round(v * 1000)}ms`;
    }
    return `${Number(v).toFixed(this.decimals)}${this.unit}`;
  }

  bindEvents() {
    this.el.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.el.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    this.el.addEventListener('dblclick', () => this.resetDefault());

    // Touch support for tablets/mobiles
    this.el.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
  }

  onMouseDown(e) {
    e.preventDefault();
    this.isDragging = true;
    this.startY = e.clientY;
    this.startVal = this.value;

    const onMouseMove = (moveEvent) => {
      if (!this.isDragging) return;
      const deltaY = this.startY - moveEvent.clientY;
      const range = this.max - this.min;
      const speed = moveEvent.shiftKey ? 0.001 : 0.006;
      let nextVal = this.startVal + deltaY * range * speed;
      this.setValue(nextVal, true);
    };

    const onMouseUp = () => {
      this.isDragging = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  onTouchStart(e) {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    this.isDragging = true;
    this.startY = e.touches[0].clientY;
    this.startVal = this.value;

    const onTouchMove = (moveEvent) => {
      if (!this.isDragging || moveEvent.touches.length !== 1) return;
      const deltaY = this.startY - moveEvent.touches[0].clientY;
      const range = this.max - this.min;
      let nextVal = this.startVal + deltaY * range * 0.006;
      this.setValue(nextVal, true);
    };

    const onTouchEnd = () => {
      this.isDragging = false;
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };

    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
  }

  onWheel(e) {
    e.preventDefault();
    const range = this.max - this.min;
    const stepAmount = range * 0.04;
    const delta = e.deltaY < 0 ? stepAmount : -stepAmount;
    this.setValue(this.value + delta, true);
  }

  resetDefault() {
    this.setValue(this.defaultValue, true);
  }

  setValue(val, triggerCallback = false) {
    const clamped = Math.max(this.min, Math.min(this.max, val));
    this.value = clamped;
    this.updateUI();

    if (triggerCallback && this.onChange) {
      this.onChange(this.value);
    }
  }

  updateUI() {
    const normalized = (this.value - this.min) / (this.max - this.min);
    // Angle: -135deg to +135deg (total 270 deg)
    const angle = -135 + normalized * 270;
    if (this.dialEl) {
      this.dialEl.style.transform = `rotate(${angle}deg)`;
    }
    if (this.valEl) {
      this.valEl.textContent = this.formatValue(this.value);
    }
  }
}
