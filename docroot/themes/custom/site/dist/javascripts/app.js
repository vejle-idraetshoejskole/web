'use strict';

/* ========================================================================
 * Bootstrap: tab.js v3.3.7
 * http://getbootstrap.com/javascript/#tabs
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+function ($) {
  'use strict';

  // TAB CLASS DEFINITION
  // ====================

  var Tab = function Tab(element) {
    // jscs:disable requireDollarBeforejQueryAssignment
    this.element = $(element);
    // jscs:enable requireDollarBeforejQueryAssignment
  };

  Tab.VERSION = '3.3.7';

  Tab.TRANSITION_DURATION = 150;

  Tab.prototype.show = function () {
    var $this = this.element;
    var $ul = $this.closest('ul:not(.dropdown-menu)');
    var selector = $this.data('target');

    if (!selector) {
      selector = $this.attr('href');
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, ''); // strip for ie7
    }

    if ($this.parent('li').hasClass('active')) return;

    var $previous = $ul.find('.active:last a');
    var hideEvent = $.Event('hide.bs.tab', {
      relatedTarget: $this[0]
    });
    var showEvent = $.Event('show.bs.tab', {
      relatedTarget: $previous[0]
    });

    $previous.trigger(hideEvent);
    $this.trigger(showEvent);

    if (showEvent.isDefaultPrevented() || hideEvent.isDefaultPrevented()) return;

    var $target = $(selector);

    this.activate($this.closest('li'), $ul);
    this.activate($target, $target.parent(), function () {
      $previous.trigger({
        type: 'hidden.bs.tab',
        relatedTarget: $this[0]
      });
      $this.trigger({
        type: 'shown.bs.tab',
        relatedTarget: $previous[0]
      });
    });
  };

  Tab.prototype.activate = function (element, container, callback) {
    var $active = container.find('> .active');
    var transition = callback && $.support.transition && ($active.length && $active.hasClass('fade') || !!container.find('> .fade').length);

    function next() {
      $active.removeClass('active').find('> .dropdown-menu > .active').removeClass('active').end().find('[data-toggle="tab"]').attr('aria-expanded', false);

      element.addClass('active').find('[data-toggle="tab"]').attr('aria-expanded', true);

      if (transition) {
        element[0].offsetWidth; // reflow for transition
        element.addClass('in');
      } else {
        element.removeClass('fade');
      }

      if (element.parent('.dropdown-menu').length) {
        element.closest('li.dropdown').addClass('active').end().find('[data-toggle="tab"]').attr('aria-expanded', true);
      }

      callback && callback();
    }

    $active.length && transition ? $active.one('bsTransitionEnd', next).emulateTransitionEnd(Tab.TRANSITION_DURATION) : next();

    $active.removeClass('in');
  };

  // TAB PLUGIN DEFINITION
  // =====================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.tab');

      if (!data) $this.data('bs.tab', data = new Tab(this));
      if (typeof option == 'string') data[option]();
    });
  }

  var old = $.fn.tab;

  $.fn.tab = Plugin;
  $.fn.tab.Constructor = Tab;

  // TAB NO CONFLICT
  // ===============

  $.fn.tab.noConflict = function () {
    $.fn.tab = old;
    return this;
  };

  // TAB DATA-API
  // ============

  var clickHandler = function clickHandler(e) {
    e.preventDefault();
    Plugin.call($(this), 'show');
  };

  $(document).on('click.bs.tab.data-api', '[data-toggle="tab"]', clickHandler).on('click.bs.tab.data-api', '[data-toggle="pill"]', clickHandler);
}(jQuery);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* ========================================================================
 * Bootstrap: collapse.js v3.3.7
 * http://getbootstrap.com/javascript/#collapse
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

/* jshint latedef: false */

+function ($) {
  'use strict';

  // COLLAPSE PUBLIC CLASS DEFINITION
  // ================================

  var Collapse = function Collapse(element, options) {
    this.$element = $(element);
    this.options = $.extend({}, Collapse.DEFAULTS, options);
    this.$trigger = $('[data-toggle="collapse"][href="#' + element.id + '"],' + '[data-toggle="collapse"][data-target="#' + element.id + '"]');
    this.transitioning = null;

    if (this.options.parent) {
      this.$parent = this.getParent();
    } else {
      this.addAriaAndCollapsedClass(this.$element, this.$trigger);
    }

    if (this.options.toggle) this.toggle();
  };

  Collapse.VERSION = '3.3.7';

  Collapse.TRANSITION_DURATION = 350;

  Collapse.DEFAULTS = {
    toggle: true
  };

  Collapse.prototype.dimension = function () {
    var hasWidth = this.$element.hasClass('width');
    return hasWidth ? 'width' : 'height';
  };

  Collapse.prototype.show = function () {
    if (this.transitioning || this.$element.hasClass('in')) return;

    var activesData;
    var actives = this.$parent && this.$parent.children('.panel').children('.in, .collapsing');

    if (actives && actives.length) {
      activesData = actives.data('bs.collapse');
      if (activesData && activesData.transitioning) return;
    }

    var startEvent = $.Event('show.bs.collapse');
    this.$element.trigger(startEvent);
    if (startEvent.isDefaultPrevented()) return;

    if (actives && actives.length) {
      Plugin.call(actives, 'hide');
      activesData || actives.data('bs.collapse', null);
    }

    var dimension = this.dimension();

    this.$element.removeClass('collapse').addClass('collapsing')[dimension](0).attr('aria-expanded', true);

    this.$trigger.removeClass('collapsed').attr('aria-expanded', true);

    this.transitioning = 1;

    var complete = function complete() {
      this.$element.removeClass('collapsing').addClass('collapse in')[dimension]('');
      this.transitioning = 0;
      this.$element.trigger('shown.bs.collapse');
    };

    if (!$.support.transition) return complete.call(this);

    var scrollSize = $.camelCase(['scroll', dimension].join('-'));

    this.$element.one('bsTransitionEnd', $.proxy(complete, this)).emulateTransitionEnd(Collapse.TRANSITION_DURATION)[dimension](this.$element[0][scrollSize]);
  };

  Collapse.prototype.hide = function () {
    if (this.transitioning || !this.$element.hasClass('in')) return;

    var startEvent = $.Event('hide.bs.collapse');
    this.$element.trigger(startEvent);
    if (startEvent.isDefaultPrevented()) return;

    var dimension = this.dimension();

    this.$element[dimension](this.$element[dimension]())[0].offsetHeight;

    this.$element.addClass('collapsing').removeClass('collapse in').attr('aria-expanded', false);

    this.$trigger.addClass('collapsed').attr('aria-expanded', false);

    this.transitioning = 1;

    var complete = function complete() {
      this.transitioning = 0;
      this.$element.removeClass('collapsing').addClass('collapse').trigger('hidden.bs.collapse');
    };

    if (!$.support.transition) return complete.call(this);

    this.$element[dimension](0).one('bsTransitionEnd', $.proxy(complete, this)).emulateTransitionEnd(Collapse.TRANSITION_DURATION);
  };

  Collapse.prototype.toggle = function () {
    this[this.$element.hasClass('in') ? 'hide' : 'show']();
  };

  Collapse.prototype.getParent = function () {
    return $(this.options.parent).find('[data-toggle="collapse"][data-parent="' + this.options.parent + '"]').each($.proxy(function (i, element) {
      var $element = $(element);
      this.addAriaAndCollapsedClass(getTargetFromTrigger($element), $element);
    }, this)).end();
  };

  Collapse.prototype.addAriaAndCollapsedClass = function ($element, $trigger) {
    var isOpen = $element.hasClass('in');

    $element.attr('aria-expanded', isOpen);
    $trigger.toggleClass('collapsed', !isOpen).attr('aria-expanded', isOpen);
  };

  function getTargetFromTrigger($trigger) {
    var href;
    var target = $trigger.attr('data-target') || (href = $trigger.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, ''); // strip for ie7

    return $(target);
  }

  // COLLAPSE PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.collapse');
      var options = $.extend({}, Collapse.DEFAULTS, $this.data(), (typeof option === 'undefined' ? 'undefined' : _typeof(option)) == 'object' && option);

      if (!data && options.toggle && /show|hide/.test(option)) options.toggle = false;
      if (!data) $this.data('bs.collapse', data = new Collapse(this, options));
      if (typeof option == 'string') data[option]();
    });
  }

  var old = $.fn.collapse;

  $.fn.collapse = Plugin;
  $.fn.collapse.Constructor = Collapse;

  // COLLAPSE NO CONFLICT
  // ====================

  $.fn.collapse.noConflict = function () {
    $.fn.collapse = old;
    return this;
  };

  // COLLAPSE DATA-API
  // =================

  $(document).on('click.bs.collapse.data-api', '[data-toggle="collapse"]', function (e) {
    var $this = $(this);

    if (!$this.attr('data-target')) e.preventDefault();

    var $target = getTargetFromTrigger($this);
    var data = $target.data('bs.collapse');
    var option = data ? 'toggle' : $this.data();

    Plugin.call($target, option);
  });
}(jQuery);
'use strict';

/* ========================================================================
 * Bootstrap: transition.js v3.3.7
 * http://getbootstrap.com/javascript/#transitions
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+function ($) {
  'use strict';

  // CSS TRANSITION SUPPORT (Shoutout: http://www.modernizr.com/)
  // ============================================================

  function transitionEnd() {
    var el = document.createElement('bootstrap');

    var transEndEventNames = {
      WebkitTransition: 'webkitTransitionEnd',
      MozTransition: 'transitionend',
      OTransition: 'oTransitionEnd otransitionend',
      transition: 'transitionend'
    };

    for (var name in transEndEventNames) {
      if (el.style[name] !== undefined) {
        return { end: transEndEventNames[name] };
      }
    }

    return false; // explicit for ie8 (  ._.)
  }

  // http://blog.alexmaccaw.com/css-transitions
  $.fn.emulateTransitionEnd = function (duration) {
    var called = false;
    var $el = this;
    $(this).one('bsTransitionEnd', function () {
      called = true;
    });
    var callback = function callback() {
      if (!called) $($el).trigger($.support.transition.end);
    };
    setTimeout(callback, duration);
    return this;
  };

  $(function () {
    $.support.transition = transitionEnd();

    if (!$.support.transition) return;

    $.event.special.bsTransitionEnd = {
      bindType: $.support.transition.end,
      delegateType: $.support.transition.end,
      handle: function handle(e) {
        if ($(e.target).is(this)) return e.handleObj.handler.apply(this, arguments);
      }
    };
  });
}(jQuery);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* ========================================================================
 * Bootstrap: tooltip.js v3.3.7
 * http://getbootstrap.com/javascript/#tooltip
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+function ($) {
  'use strict';

  // TOOLTIP PUBLIC CLASS DEFINITION
  // ===============================

  var Tooltip = function Tooltip(element, options) {
    this.type = null;
    this.options = null;
    this.enabled = null;
    this.timeout = null;
    this.hoverState = null;
    this.$element = null;
    this.inState = null;

    this.init('tooltip', element, options);
  };

  Tooltip.VERSION = '3.3.7';

  Tooltip.TRANSITION_DURATION = 150;

  Tooltip.DEFAULTS = {
    animation: true,
    placement: 'top',
    selector: false,
    template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
    trigger: 'hover focus',
    title: '',
    delay: 0,
    html: false,
    container: false,
    viewport: {
      selector: 'body',
      padding: 0
    }
  };

  Tooltip.prototype.init = function (type, element, options) {
    this.enabled = true;
    this.type = type;
    this.$element = $(element);
    this.options = this.getOptions(options);
    this.$viewport = this.options.viewport && $($.isFunction(this.options.viewport) ? this.options.viewport.call(this, this.$element) : this.options.viewport.selector || this.options.viewport);
    this.inState = { click: false, hover: false, focus: false };

    if (this.$element[0] instanceof document.constructor && !this.options.selector) {
      throw new Error('`selector` option must be specified when initializing ' + this.type + ' on the window.document object!');
    }

    var triggers = this.options.trigger.split(' ');

    for (var i = triggers.length; i--;) {
      var trigger = triggers[i];

      if (trigger == 'click') {
        this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this));
      } else if (trigger != 'manual') {
        var eventIn = trigger == 'hover' ? 'mouseenter' : 'focusin';
        var eventOut = trigger == 'hover' ? 'mouseleave' : 'focusout';

        this.$element.on(eventIn + '.' + this.type, this.options.selector, $.proxy(this.enter, this));
        this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this));
      }
    }

    this.options.selector ? this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' }) : this.fixTitle();
  };

  Tooltip.prototype.getDefaults = function () {
    return Tooltip.DEFAULTS;
  };

  Tooltip.prototype.getOptions = function (options) {
    options = $.extend({}, this.getDefaults(), this.$element.data(), options);

    if (options.delay && typeof options.delay == 'number') {
      options.delay = {
        show: options.delay,
        hide: options.delay
      };
    }

    return options;
  };

  Tooltip.prototype.getDelegateOptions = function () {
    var options = {};
    var defaults = this.getDefaults();

    this._options && $.each(this._options, function (key, value) {
      if (defaults[key] != value) options[key] = value;
    });

    return options;
  };

  Tooltip.prototype.enter = function (obj) {
    var self = obj instanceof this.constructor ? obj : $(obj.currentTarget).data('bs.' + this.type);

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions());
      $(obj.currentTarget).data('bs.' + this.type, self);
    }

    if (obj instanceof $.Event) {
      self.inState[obj.type == 'focusin' ? 'focus' : 'hover'] = true;
    }

    if (self.tip().hasClass('in') || self.hoverState == 'in') {
      self.hoverState = 'in';
      return;
    }

    clearTimeout(self.timeout);

    self.hoverState = 'in';

    if (!self.options.delay || !self.options.delay.show) return self.show();

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'in') self.show();
    }, self.options.delay.show);
  };

  Tooltip.prototype.isInStateTrue = function () {
    for (var key in this.inState) {
      if (this.inState[key]) return true;
    }

    return false;
  };

  Tooltip.prototype.leave = function (obj) {
    var self = obj instanceof this.constructor ? obj : $(obj.currentTarget).data('bs.' + this.type);

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions());
      $(obj.currentTarget).data('bs.' + this.type, self);
    }

    if (obj instanceof $.Event) {
      self.inState[obj.type == 'focusout' ? 'focus' : 'hover'] = false;
    }

    if (self.isInStateTrue()) return;

    clearTimeout(self.timeout);

    self.hoverState = 'out';

    if (!self.options.delay || !self.options.delay.hide) return self.hide();

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'out') self.hide();
    }, self.options.delay.hide);
  };

  Tooltip.prototype.show = function () {
    var e = $.Event('show.bs.' + this.type);

    if (this.hasContent() && this.enabled) {
      this.$element.trigger(e);

      var inDom = $.contains(this.$element[0].ownerDocument.documentElement, this.$element[0]);
      if (e.isDefaultPrevented() || !inDom) return;
      var that = this;

      var $tip = this.tip();

      var tipId = this.getUID(this.type);

      this.setContent();
      $tip.attr('id', tipId);
      this.$element.attr('aria-describedby', tipId);

      if (this.options.animation) $tip.addClass('fade');

      var placement = typeof this.options.placement == 'function' ? this.options.placement.call(this, $tip[0], this.$element[0]) : this.options.placement;

      var autoToken = /\s?auto?\s?/i;
      var autoPlace = autoToken.test(placement);
      if (autoPlace) placement = placement.replace(autoToken, '') || 'top';

      $tip.detach().css({ top: 0, left: 0, display: 'block' }).addClass(placement).data('bs.' + this.type, this);

      this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element);
      this.$element.trigger('inserted.bs.' + this.type);

      var pos = this.getPosition();
      var actualWidth = $tip[0].offsetWidth;
      var actualHeight = $tip[0].offsetHeight;

      if (autoPlace) {
        var orgPlacement = placement;
        var viewportDim = this.getPosition(this.$viewport);

        placement = placement == 'bottom' && pos.bottom + actualHeight > viewportDim.bottom ? 'top' : placement == 'top' && pos.top - actualHeight < viewportDim.top ? 'bottom' : placement == 'right' && pos.right + actualWidth > viewportDim.width ? 'left' : placement == 'left' && pos.left - actualWidth < viewportDim.left ? 'right' : placement;

        $tip.removeClass(orgPlacement).addClass(placement);
      }

      var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight);

      this.applyPlacement(calculatedOffset, placement);

      var complete = function complete() {
        var prevHoverState = that.hoverState;
        that.$element.trigger('shown.bs.' + that.type);
        that.hoverState = null;

        if (prevHoverState == 'out') that.leave(that);
      };

      $.support.transition && this.$tip.hasClass('fade') ? $tip.one('bsTransitionEnd', complete).emulateTransitionEnd(Tooltip.TRANSITION_DURATION) : complete();
    }
  };

  Tooltip.prototype.applyPlacement = function (offset, placement) {
    var $tip = this.tip();
    var width = $tip[0].offsetWidth;
    var height = $tip[0].offsetHeight;

    // manually read margins because getBoundingClientRect includes difference
    var marginTop = parseInt($tip.css('margin-top'), 10);
    var marginLeft = parseInt($tip.css('margin-left'), 10);

    // we must check for NaN for ie 8/9
    if (isNaN(marginTop)) marginTop = 0;
    if (isNaN(marginLeft)) marginLeft = 0;

    offset.top += marginTop;
    offset.left += marginLeft;

    // $.fn.offset doesn't round pixel values
    // so we use setOffset directly with our own function B-0
    $.offset.setOffset($tip[0], $.extend({
      using: function using(props) {
        $tip.css({
          top: Math.round(props.top),
          left: Math.round(props.left)
        });
      }
    }, offset), 0);

    $tip.addClass('in');

    // check to see if placing tip in new offset caused the tip to resize itself
    var actualWidth = $tip[0].offsetWidth;
    var actualHeight = $tip[0].offsetHeight;

    if (placement == 'top' && actualHeight != height) {
      offset.top = offset.top + height - actualHeight;
    }

    var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight);

    if (delta.left) offset.left += delta.left;else offset.top += delta.top;

    var isVertical = /top|bottom/.test(placement);
    var arrowDelta = isVertical ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight;
    var arrowOffsetPosition = isVertical ? 'offsetWidth' : 'offsetHeight';

    $tip.offset(offset);
    this.replaceArrow(arrowDelta, $tip[0][arrowOffsetPosition], isVertical);
  };

  Tooltip.prototype.replaceArrow = function (delta, dimension, isVertical) {
    this.arrow().css(isVertical ? 'left' : 'top', 50 * (1 - delta / dimension) + '%').css(isVertical ? 'top' : 'left', '');
  };

  Tooltip.prototype.setContent = function () {
    var $tip = this.tip();
    var title = this.getTitle();

    $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title);
    $tip.removeClass('fade in top bottom left right');
  };

  Tooltip.prototype.hide = function (callback) {
    var that = this;
    var $tip = $(this.$tip);
    var e = $.Event('hide.bs.' + this.type);

    function complete() {
      if (that.hoverState != 'in') $tip.detach();
      if (that.$element) {
        // TODO: Check whether guarding this code with this `if` is really necessary.
        that.$element.removeAttr('aria-describedby').trigger('hidden.bs.' + that.type);
      }
      callback && callback();
    }

    this.$element.trigger(e);

    if (e.isDefaultPrevented()) return;

    $tip.removeClass('in');

    $.support.transition && $tip.hasClass('fade') ? $tip.one('bsTransitionEnd', complete).emulateTransitionEnd(Tooltip.TRANSITION_DURATION) : complete();

    this.hoverState = null;

    return this;
  };

  Tooltip.prototype.fixTitle = function () {
    var $e = this.$element;
    if ($e.attr('title') || typeof $e.attr('data-original-title') != 'string') {
      $e.attr('data-original-title', $e.attr('title') || '').attr('title', '');
    }
  };

  Tooltip.prototype.hasContent = function () {
    return this.getTitle();
  };

  Tooltip.prototype.getPosition = function ($element) {
    $element = $element || this.$element;

    var el = $element[0];
    var isBody = el.tagName == 'BODY';

    var elRect = el.getBoundingClientRect();
    if (elRect.width == null) {
      // width and height are missing in IE8, so compute them manually; see https://github.com/twbs/bootstrap/issues/14093
      elRect = $.extend({}, elRect, { width: elRect.right - elRect.left, height: elRect.bottom - elRect.top });
    }
    var isSvg = window.SVGElement && el instanceof window.SVGElement;
    // Avoid using $.offset() on SVGs since it gives incorrect results in jQuery 3.
    // See https://github.com/twbs/bootstrap/issues/20280
    var elOffset = isBody ? { top: 0, left: 0 } : isSvg ? null : $element.offset();
    var scroll = { scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop() };
    var outerDims = isBody ? { width: $(window).width(), height: $(window).height() } : null;

    return $.extend({}, elRect, scroll, outerDims, elOffset);
  };

  Tooltip.prototype.getCalculatedOffset = function (placement, pos, actualWidth, actualHeight) {
    return placement == 'bottom' ? { top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2 } : placement == 'top' ? { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2 } : placement == 'left' ? { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth } :
    /* placement == 'right' */{ top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width };
  };

  Tooltip.prototype.getViewportAdjustedDelta = function (placement, pos, actualWidth, actualHeight) {
    var delta = { top: 0, left: 0 };
    if (!this.$viewport) return delta;

    var viewportPadding = this.options.viewport && this.options.viewport.padding || 0;
    var viewportDimensions = this.getPosition(this.$viewport);

    if (/right|left/.test(placement)) {
      var topEdgeOffset = pos.top - viewportPadding - viewportDimensions.scroll;
      var bottomEdgeOffset = pos.top + viewportPadding - viewportDimensions.scroll + actualHeight;
      if (topEdgeOffset < viewportDimensions.top) {
        // top overflow
        delta.top = viewportDimensions.top - topEdgeOffset;
      } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) {
        // bottom overflow
        delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset;
      }
    } else {
      var leftEdgeOffset = pos.left - viewportPadding;
      var rightEdgeOffset = pos.left + viewportPadding + actualWidth;
      if (leftEdgeOffset < viewportDimensions.left) {
        // left overflow
        delta.left = viewportDimensions.left - leftEdgeOffset;
      } else if (rightEdgeOffset > viewportDimensions.right) {
        // right overflow
        delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset;
      }
    }

    return delta;
  };

  Tooltip.prototype.getTitle = function () {
    var title;
    var $e = this.$element;
    var o = this.options;

    title = $e.attr('data-original-title') || (typeof o.title == 'function' ? o.title.call($e[0]) : o.title);

    return title;
  };

  Tooltip.prototype.getUID = function (prefix) {
    do {
      prefix += ~~(Math.random() * 1000000);
    } while (document.getElementById(prefix));
    return prefix;
  };

  Tooltip.prototype.tip = function () {
    if (!this.$tip) {
      this.$tip = $(this.options.template);
      if (this.$tip.length != 1) {
        throw new Error(this.type + ' `template` option must consist of exactly 1 top-level element!');
      }
    }
    return this.$tip;
  };

  Tooltip.prototype.arrow = function () {
    return this.$arrow = this.$arrow || this.tip().find('.tooltip-arrow');
  };

  Tooltip.prototype.enable = function () {
    this.enabled = true;
  };

  Tooltip.prototype.disable = function () {
    this.enabled = false;
  };

  Tooltip.prototype.toggleEnabled = function () {
    this.enabled = !this.enabled;
  };

  Tooltip.prototype.toggle = function (e) {
    var self = this;
    if (e) {
      self = $(e.currentTarget).data('bs.' + this.type);
      if (!self) {
        self = new this.constructor(e.currentTarget, this.getDelegateOptions());
        $(e.currentTarget).data('bs.' + this.type, self);
      }
    }

    if (e) {
      self.inState.click = !self.inState.click;
      if (self.isInStateTrue()) self.enter(self);else self.leave(self);
    } else {
      self.tip().hasClass('in') ? self.leave(self) : self.enter(self);
    }
  };

  Tooltip.prototype.destroy = function () {
    var that = this;
    clearTimeout(this.timeout);
    this.hide(function () {
      that.$element.off('.' + that.type).removeData('bs.' + that.type);
      if (that.$tip) {
        that.$tip.detach();
      }
      that.$tip = null;
      that.$arrow = null;
      that.$viewport = null;
      that.$element = null;
    });
  };

  // TOOLTIP PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.tooltip');
      var options = (typeof option === 'undefined' ? 'undefined' : _typeof(option)) == 'object' && option;

      if (!data && /destroy|hide/.test(option)) return;
      if (!data) $this.data('bs.tooltip', data = new Tooltip(this, options));
      if (typeof option == 'string') data[option]();
    });
  }

  var old = $.fn.tooltip;

  $.fn.tooltip = Plugin;
  $.fn.tooltip.Constructor = Tooltip;

  // TOOLTIP NO CONFLICT
  // ===================

  $.fn.tooltip.noConflict = function () {
    $.fn.tooltip = old;
    return this;
  };
}(jQuery);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* ========================================================================
 * Bootstrap: popover.js v3.3.7
 * http://getbootstrap.com/javascript/#popovers
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+function ($) {
  'use strict';

  // POPOVER PUBLIC CLASS DEFINITION
  // ===============================

  var Popover = function Popover(element, options) {
    this.init('popover', element, options);
  };

  if (!$.fn.tooltip) throw new Error('Popover requires tooltip.js');

  Popover.VERSION = '3.3.7';

  Popover.DEFAULTS = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, {
    placement: 'right',
    trigger: 'click',
    content: '',
    template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
  });

  // NOTE: POPOVER EXTENDS tooltip.js
  // ================================

  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype);

  Popover.prototype.constructor = Popover;

  Popover.prototype.getDefaults = function () {
    return Popover.DEFAULTS;
  };

  Popover.prototype.setContent = function () {
    var $tip = this.tip();
    var title = this.getTitle();
    var content = this.getContent();

    $tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title);
    $tip.find('.popover-content').children().detach().end()[// we use append for html objects to maintain js events
    this.options.html ? typeof content == 'string' ? 'html' : 'append' : 'text'](content);

    $tip.removeClass('fade top bottom left right in');

    // IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
    // this manually by checking the contents.
    if (!$tip.find('.popover-title').html()) $tip.find('.popover-title').hide();
  };

  Popover.prototype.hasContent = function () {
    return this.getTitle() || this.getContent();
  };

  Popover.prototype.getContent = function () {
    var $e = this.$element;
    var o = this.options;

    return $e.attr('data-content') || (typeof o.content == 'function' ? o.content.call($e[0]) : o.content);
  };

  Popover.prototype.arrow = function () {
    return this.$arrow = this.$arrow || this.tip().find('.arrow');
  };

  // POPOVER PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.popover');
      var options = (typeof option === 'undefined' ? 'undefined' : _typeof(option)) == 'object' && option;

      if (!data && /destroy|hide/.test(option)) return;
      if (!data) $this.data('bs.popover', data = new Popover(this, options));
      if (typeof option == 'string') data[option]();
    });
  }

  var old = $.fn.popover;

  $.fn.popover = Plugin;
  $.fn.popover.Constructor = Popover;

  // POPOVER NO CONFLICT
  // ===================

  $.fn.popover.noConflict = function () {
    $.fn.popover = old;
    return this;
  };
}(jQuery);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* ========================================================================
 * Bootstrap: modal.js v3.3.7
 * http://getbootstrap.com/javascript/#modals
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+function ($) {
  'use strict';

  // MODAL CLASS DEFINITION
  // ======================

  var Modal = function Modal(element, options) {
    this.options = options;
    this.$body = $(document.body);
    this.$element = $(element);
    this.$dialog = this.$element.find('.modal-dialog');
    this.$backdrop = null;
    this.isShown = null;
    this.originalBodyPad = null;
    this.scrollbarWidth = 0;
    this.ignoreBackdropClick = false;

    if (this.options.remote) {
      this.$element.find('.modal-content').load(this.options.remote, $.proxy(function () {
        this.$element.trigger('loaded.bs.modal');
      }, this));
    }
  };

  Modal.VERSION = '3.3.7';

  Modal.TRANSITION_DURATION = 300;
  Modal.BACKDROP_TRANSITION_DURATION = 150;

  Modal.DEFAULTS = {
    backdrop: true,
    keyboard: true,
    show: true
  };

  Modal.prototype.toggle = function (_relatedTarget) {
    return this.isShown ? this.hide() : this.show(_relatedTarget);
  };

  Modal.prototype.show = function (_relatedTarget) {
    var that = this;
    var e = $.Event('show.bs.modal', { relatedTarget: _relatedTarget });

    this.$element.trigger(e);

    if (this.isShown || e.isDefaultPrevented()) return;

    this.isShown = true;

    this.checkScrollbar();
    this.setScrollbar();
    this.$body.addClass('modal-open');

    this.escape();
    this.resize();

    this.$element.on('click.dismiss.bs.modal', '[data-dismiss="modal"]', $.proxy(this.hide, this));

    this.$dialog.on('mousedown.dismiss.bs.modal', function () {
      that.$element.one('mouseup.dismiss.bs.modal', function (e) {
        if ($(e.target).is(that.$element)) that.ignoreBackdropClick = true;
      });
    });

    this.backdrop(function () {
      var transition = $.support.transition && that.$element.hasClass('fade');

      if (!that.$element.parent().length) {
        that.$element.appendTo(that.$body); // don't move modals dom position
      }

      that.$element.show().scrollTop(0);

      that.adjustDialog();

      if (transition) {
        that.$element[0].offsetWidth; // force reflow
      }

      that.$element.addClass('in');

      that.enforceFocus();

      var e = $.Event('shown.bs.modal', { relatedTarget: _relatedTarget });

      transition ? that.$dialog // wait for modal to slide in
      .one('bsTransitionEnd', function () {
        that.$element.trigger('focus').trigger(e);
      }).emulateTransitionEnd(Modal.TRANSITION_DURATION) : that.$element.trigger('focus').trigger(e);
    });
  };

  Modal.prototype.hide = function (e) {
    if (e) e.preventDefault();

    e = $.Event('hide.bs.modal');

    this.$element.trigger(e);

    if (!this.isShown || e.isDefaultPrevented()) return;

    this.isShown = false;

    this.escape();
    this.resize();

    $(document).off('focusin.bs.modal');

    this.$element.removeClass('in').off('click.dismiss.bs.modal').off('mouseup.dismiss.bs.modal');

    this.$dialog.off('mousedown.dismiss.bs.modal');

    $.support.transition && this.$element.hasClass('fade') ? this.$element.one('bsTransitionEnd', $.proxy(this.hideModal, this)).emulateTransitionEnd(Modal.TRANSITION_DURATION) : this.hideModal();
  };

  Modal.prototype.enforceFocus = function () {
    $(document).off('focusin.bs.modal') // guard against infinite focus loop
    .on('focusin.bs.modal', $.proxy(function (e) {
      if (document !== e.target && this.$element[0] !== e.target && !this.$element.has(e.target).length) {
        this.$element.trigger('focus');
      }
    }, this));
  };

  Modal.prototype.escape = function () {
    if (this.isShown && this.options.keyboard) {
      this.$element.on('keydown.dismiss.bs.modal', $.proxy(function (e) {
        e.which == 27 && this.hide();
      }, this));
    } else if (!this.isShown) {
      this.$element.off('keydown.dismiss.bs.modal');
    }
  };

  Modal.prototype.resize = function () {
    if (this.isShown) {
      $(window).on('resize.bs.modal', $.proxy(this.handleUpdate, this));
    } else {
      $(window).off('resize.bs.modal');
    }
  };

  Modal.prototype.hideModal = function () {
    var that = this;
    this.$element.hide();
    this.backdrop(function () {
      that.$body.removeClass('modal-open');
      that.resetAdjustments();
      that.resetScrollbar();
      that.$element.trigger('hidden.bs.modal');
    });
  };

  Modal.prototype.removeBackdrop = function () {
    this.$backdrop && this.$backdrop.remove();
    this.$backdrop = null;
  };

  Modal.prototype.backdrop = function (callback) {
    var that = this;
    var animate = this.$element.hasClass('fade') ? 'fade' : '';

    if (this.isShown && this.options.backdrop) {
      var doAnimate = $.support.transition && animate;

      this.$backdrop = $(document.createElement('div')).addClass('modal-backdrop ' + animate).appendTo(this.$body);

      this.$element.on('click.dismiss.bs.modal', $.proxy(function (e) {
        if (this.ignoreBackdropClick) {
          this.ignoreBackdropClick = false;
          return;
        }
        if (e.target !== e.currentTarget) return;
        this.options.backdrop == 'static' ? this.$element[0].focus() : this.hide();
      }, this));

      if (doAnimate) this.$backdrop[0].offsetWidth; // force reflow

      this.$backdrop.addClass('in');

      if (!callback) return;

      doAnimate ? this.$backdrop.one('bsTransitionEnd', callback).emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) : callback();
    } else if (!this.isShown && this.$backdrop) {
      this.$backdrop.removeClass('in');

      var callbackRemove = function callbackRemove() {
        that.removeBackdrop();
        callback && callback();
      };
      $.support.transition && this.$element.hasClass('fade') ? this.$backdrop.one('bsTransitionEnd', callbackRemove).emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) : callbackRemove();
    } else if (callback) {
      callback();
    }
  };

  // these following methods are used to handle overflowing modals

  Modal.prototype.handleUpdate = function () {
    this.adjustDialog();
  };

  Modal.prototype.adjustDialog = function () {
    var modalIsOverflowing = this.$element[0].scrollHeight > document.documentElement.clientHeight;

    this.$element.css({
      paddingLeft: !this.bodyIsOverflowing && modalIsOverflowing ? this.scrollbarWidth : '',
      paddingRight: this.bodyIsOverflowing && !modalIsOverflowing ? this.scrollbarWidth : ''
    });
  };

  Modal.prototype.resetAdjustments = function () {
    this.$element.css({
      paddingLeft: '',
      paddingRight: ''
    });
  };

  Modal.prototype.checkScrollbar = function () {
    var fullWindowWidth = window.innerWidth;
    if (!fullWindowWidth) {
      // workaround for missing window.innerWidth in IE8
      var documentElementRect = document.documentElement.getBoundingClientRect();
      fullWindowWidth = documentElementRect.right - Math.abs(documentElementRect.left);
    }
    this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth;
    this.scrollbarWidth = this.measureScrollbar();
  };

  Modal.prototype.setScrollbar = function () {
    var bodyPad = parseInt(this.$body.css('padding-right') || 0, 10);
    this.originalBodyPad = document.body.style.paddingRight || '';
    if (this.bodyIsOverflowing) this.$body.css('padding-right', bodyPad + this.scrollbarWidth);
  };

  Modal.prototype.resetScrollbar = function () {
    this.$body.css('padding-right', this.originalBodyPad);
  };

  Modal.prototype.measureScrollbar = function () {
    // thx walsh
    var scrollDiv = document.createElement('div');
    scrollDiv.className = 'modal-scrollbar-measure';
    this.$body.append(scrollDiv);
    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    this.$body[0].removeChild(scrollDiv);
    return scrollbarWidth;
  };

  // MODAL PLUGIN DEFINITION
  // =======================

  function Plugin(option, _relatedTarget) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.modal');
      var options = $.extend({}, Modal.DEFAULTS, $this.data(), (typeof option === 'undefined' ? 'undefined' : _typeof(option)) == 'object' && option);

      if (!data) $this.data('bs.modal', data = new Modal(this, options));
      if (typeof option == 'string') data[option](_relatedTarget);else if (options.show) data.show(_relatedTarget);
    });
  }

  var old = $.fn.modal;

  $.fn.modal = Plugin;
  $.fn.modal.Constructor = Modal;

  // MODAL NO CONFLICT
  // =================

  $.fn.modal.noConflict = function () {
    $.fn.modal = old;
    return this;
  };

  // MODAL DATA-API
  // ==============

  $(document).on('click.bs.modal.data-api', '[data-toggle="modal"]', function (e) {
    var $this = $(this);
    var href = $this.attr('href');
    var $target = $($this.attr('data-target') || href && href.replace(/.*(?=#[^\s]+$)/, '')); // strip for ie7
    var option = $target.data('bs.modal') ? 'toggle' : $.extend({ remote: !/#/.test(href) && href }, $target.data(), $this.data());

    if ($this.is('a')) e.preventDefault();

    $target.one('show.bs.modal', function (showEvent) {
      if (showEvent.isDefaultPrevented()) return; // only register focus restorer if modal will actually get shown
      $target.one('hidden.bs.modal', function () {
        $this.is(':visible') && $this.trigger('focus');
      });
    });
    Plugin.call($target, option, this);
  });
}(jQuery);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*!
 * JavaScript Cookie v2.2.0
 * https://github.com/js-cookie/js-cookie
 *
 * Copyright 2006, 2015 Klaus Hartl & Fagner Brack
 * Released under the MIT license
 */
;(function (factory) {
	var registeredInModuleLoader = false;
	if (typeof define === 'function' && define.amd) {
		define(factory);
		registeredInModuleLoader = true;
	}
	if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
		module.exports = factory();
		registeredInModuleLoader = true;
	}
	if (!registeredInModuleLoader) {
		var OldCookies = window.Cookies;
		var api = window.Cookies = factory();
		api.noConflict = function () {
			window.Cookies = OldCookies;
			return api;
		};
	}
})(function () {
	function extend() {
		var i = 0;
		var result = {};
		for (; i < arguments.length; i++) {
			var attributes = arguments[i];
			for (var key in attributes) {
				result[key] = attributes[key];
			}
		}
		return result;
	}

	function init(converter) {
		function api(key, value, attributes) {
			var result;
			if (typeof document === 'undefined') {
				return;
			}

			// Write

			if (arguments.length > 1) {
				attributes = extend({
					path: '/'
				}, api.defaults, attributes);

				if (typeof attributes.expires === 'number') {
					var expires = new Date();
					expires.setMilliseconds(expires.getMilliseconds() + attributes.expires * 864e+5);
					attributes.expires = expires;
				}

				// We're using "expires" because "max-age" is not supported by IE
				attributes.expires = attributes.expires ? attributes.expires.toUTCString() : '';

				try {
					result = JSON.stringify(value);
					if (/^[\{\[]/.test(result)) {
						value = result;
					}
				} catch (e) {}

				if (!converter.write) {
					value = encodeURIComponent(String(value)).replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);
				} else {
					value = converter.write(value, key);
				}

				key = encodeURIComponent(String(key));
				key = key.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent);
				key = key.replace(/[\(\)]/g, escape);

				var stringifiedAttributes = '';

				for (var attributeName in attributes) {
					if (!attributes[attributeName]) {
						continue;
					}
					stringifiedAttributes += '; ' + attributeName;
					if (attributes[attributeName] === true) {
						continue;
					}
					stringifiedAttributes += '=' + attributes[attributeName];
				}
				return document.cookie = key + '=' + value + stringifiedAttributes;
			}

			// Read

			if (!key) {
				result = {};
			}

			// To prevent the for loop in the first place assign an empty array
			// in case there are no cookies at all. Also prevents odd result when
			// calling "get()"
			var cookies = document.cookie ? document.cookie.split('; ') : [];
			var rdecode = /(%[0-9A-Z]{2})+/g;
			var i = 0;

			for (; i < cookies.length; i++) {
				var parts = cookies[i].split('=');
				var cookie = parts.slice(1).join('=');

				if (!this.json && cookie.charAt(0) === '"') {
					cookie = cookie.slice(1, -1);
				}

				try {
					var name = parts[0].replace(rdecode, decodeURIComponent);
					cookie = converter.read ? converter.read(cookie, name) : converter(cookie, name) || cookie.replace(rdecode, decodeURIComponent);

					if (this.json) {
						try {
							cookie = JSON.parse(cookie);
						} catch (e) {}
					}

					if (key === name) {
						result = cookie;
						break;
					}

					if (!key) {
						result[name] = cookie;
					}
				} catch (e) {}
			}

			return result;
		}

		api.set = api;
		api.get = function (key) {
			return api.call(api, key);
		};
		api.getJSON = function () {
			return api.apply({
				json: true
			}, [].slice.call(arguments));
		};
		api.defaults = {};

		api.remove = function (key, attributes) {
			api(key, '', extend(attributes, {
				expires: -1
			}));
		};

		api.withConverter = init;

		return api;
	}

	return init(function () {});
});
'use strict';

/*
 * Slinky
 * A light-weight, responsive, mobile-like navigation menu plugin for jQuery
 * Built by Ali Zahid <ali.zahid@live.com>
 * Published under the MIT license
 */

;(function ($) {
    var lastClick;

    $.fn.slinky = function (options) {
        var settings = $.extend({
            label: 'Back',
            title: false,
            speed: 300,
            resize: true,
            activeClass: 'active',
            headerClass: 'header',
            headingTag: '<h2>',
            backFirst: false
        }, options);

        var menu = $(this),
            root = menu.children().first();

        menu.addClass('slinky-menu');

        var move = function move(depth, callback) {
            var left = Math.round(parseInt(root.get(0).style.left)) || 0;

            root.css('left', left - depth * 100 + '%');

            if (typeof callback === 'function') {
                setTimeout(callback, settings.speed);
            }
        };

        var resize = function resize(content) {
            menu.height(content.outerHeight());
        };

        var transition = function transition(speed) {
            menu.css('transition-duration', speed + 'ms');
            root.css('transition-duration', speed + 'ms');
        };

        transition(settings.speed);

        $('a + ul', menu).prev().addClass('next');

        $('li > ul', menu).prepend('<li class="' + settings.headerClass + '">');

        if (settings.title === true) {
            $('li > ul', menu).each(function () {
                var $link = $(this).parent().find('a').first(),
                    label = $link.text(),
                    title = $('<a>').addClass('title').text(label).attr('href', $link.attr('href'));

                $('> .' + settings.headerClass, this).append(title);
            });
        }

        if (!settings.title && settings.label === true) {
            $('li > ul', menu).each(function () {
                var label = $(this).parent().find('a').first().text(),
                    backLink = $('<a>').text(label).prop('href', '#').addClass('back');

                if (settings.backFirst) {
                    $('> .' + settings.headerClass, this).prepend(backLink);
                } else {
                    $('> .' + settings.headerClass, this).append(backLink);
                }
            });
        } else {
            var backLink = $('<a>').text(settings.label).prop('href', '#').addClass('back');

            if (settings.backFirst) {
                $('.' + settings.headerClass, menu).prepend(backLink);
            } else {
                $('.' + settings.headerClass, menu).append(backLink);
            }
        }

        $('a', menu).on('click', function (e) {
            if (lastClick + settings.speed > Date.now()) {
                return false;
            }

            lastClick = Date.now();

            var a = $(this);

            if (a.hasClass('next') || a.hasClass('back')) {
                e.preventDefault();
            }

            if (a.hasClass('next')) {
                menu.find('.' + settings.activeClass).removeClass(settings.activeClass);

                a.next().show().addClass(settings.activeClass);

                move(1);

                if (settings.resize) {
                    resize(a.next());
                }
            } else if (a.hasClass('back')) {
                move(-1, function () {
                    menu.find('.' + settings.activeClass).removeClass(settings.activeClass);

                    a.parent().parent().hide().parentsUntil(menu, 'ul').first().addClass(settings.activeClass);
                });

                if (settings.resize) {
                    resize(a.parent().parent().parentsUntil(menu, 'ul'));
                }
            }
        });

        this.jump = function (to, animate) {
            to = $(to);

            var active = menu.find('.' + settings.activeClass);

            if (active.length > 0) {
                active = active.parentsUntil(menu, 'ul').length;
            } else {
                active = 0;
            }

            menu.find('ul').removeClass(settings.activeClass).hide();

            var menus = to.parentsUntil(menu, 'ul');

            menus.show();
            to.show().addClass(settings.activeClass);

            if (animate === false) {
                transition(0);
            }

            move(menus.length - active);

            if (settings.resize) {
                resize(to);
            }

            if (animate === false) {
                transition(settings.speed);
            }
        };

        this.home = function (animate) {
            if (animate === false) {
                transition(0);
            }

            var active = menu.find('.' + settings.activeClass),
                count = active.parentsUntil(menu, 'li').length;

            if (count > 0) {
                move(-count, function () {
                    active.removeClass(settings.activeClass);
                });

                if (settings.resize) {
                    resize($(active.parentsUntil(menu, 'li').get(count - 1)).parent());
                }
            }

            if (animate === false) {
                transition(settings.speed);
            }
        };

        this.destroy = function () {
            $('.' + settings.headerClass, menu).remove();
            $('a', menu).removeClass('next').off('click');

            menu.removeClass('slinky-menu').css('transition-duration', '');
            root.css('transition-duration', '');
        };

        var active = menu.find('.' + settings.activeClass);

        if (active.length > 0) {
            active.removeClass(settings.activeClass);

            this.jump(active, false);
        }

        return this;
    };
})(jQuery);
'use strict';

// |--------------------------------------------------------------------------
// | Layout
// |--------------------------------------------------------------------------
// |
// | This jQuery script is written by
// |
// | Morten Nissen
// | hjemmesidekongen.dk
// |
var layout = function ($) {
    'use strict';

    var pub = {},
        $layout__header = $('.layout__header'),
        $layout__document = $('.layout__document'),
        layout_classes = {
        'layout__wrapper': '.layout__wrapper',
        'layout__drawer': '.layout__drawer',
        'layout__header': '.layout__header',
        'layout__obfuscator': '.layout__obfuscator',
        'layout__document': '.layout__document',

        'wrapper_is_upgraded': 'is-upgraded',
        'wrapper_has_drawer': 'has-drawer',
        'wrapper_has_scrolling_header': 'has-scrolling-header',
        'header_scroll': 'layout__header--scroll',
        'header_is_compact': 'is-compact',
        'header_waterfall': 'layout__header--waterfall',
        'drawer_is_visible': 'is-visible',
        'obfuscator_is_visible': 'is-visible'
    };

    /**
     * Instantiate
     */
    pub.init = function (options) {
        registerEventHandlers();
        registerBootEventHandlers();
    };

    /**
     * Register boot event handlers
     */
    function registerBootEventHandlers() {

        // Add classes to elements
        addElementClasses();
    }

    /**
     * Register event handlers
     */
    function registerEventHandlers() {

        // Toggle drawer
        $('[data-toggle-drawer]').add($(layout_classes.layout__obfuscator)).on('click touchstart', function (event) {
            event.preventDefault();
            var $element = $(this);

            toggleDrawer($element);
        });

        // Waterfall header
        if ($layout__header.hasClass(layout_classes.header_waterfall)) {

            $layout__document.on('touchmove scroll', function (event) {
                var $document = $(this);

                waterfallHeader($document);
            });
        }
    }

    /**
     * Toggle drawer
     */
    function toggleDrawer($element) {
        var $wrapper = $element.closest(layout_classes.layout__wrapper),
            $obfuscator = $wrapper.children(layout_classes.layout__obfuscator),
            $drawer = $wrapper.children(layout_classes.layout__drawer);

        // Toggle visible state
        $obfuscator.toggleClass(layout_classes.obfuscator_is_visible);
        $drawer.toggleClass(layout_classes.drawer_is_visible);

        // Alter aria-hidden status
        $drawer.attr('aria-hidden', $drawer.hasClass(layout_classes.drawer_is_visible) ? false : true);
    }

    /**
     * Waterfall header
     */
    function waterfallHeader($document) {
        var $wrapper = $document.closest(layout_classes.layout__wrapper),
            $header = $wrapper.children(layout_classes.layout__header),
            distance = $document.scrollTop();

        if (distance > 0) {
            $header.addClass(layout_classes.header_is_compact);
        } else {
            $header.removeClass(layout_classes.header_is_compact);
        }
    }

    /**
     * Add classes to elements, based on attached classes
     */
    function addElementClasses() {

        $(layout_classes.layout__wrapper).each(function (index, element) {
            var $wrapper = $(this),
                $header = $wrapper.children(layout_classes.layout__header),
                $drawer = $wrapper.children(layout_classes.layout__drawer);

            // Scroll header
            if ($header.hasClass(layout_classes.header_scroll)) {
                $wrapper.addClass(layout_classes.wrapper_has_scrolling_header);
            }

            // Drawer
            if ($drawer.length > 0) {
                $wrapper.addClass(layout_classes.wrapper_has_drawer);
            }

            // Upgraded
            if ($wrapper.length > 0) {
                $wrapper.addClass(layout_classes.wrapper_is_upgraded);
            }
        });
    }

    return pub;
}(jQuery);
'use strict';

// Document ready
(function ($) {
  'use strict';

  // Flatten structure of modals, so they are not nested.
  // Ex. .modal > .modal > .modal

  var $modals = $('.modal');
  $('body').append($modals);

  // Enable layout
  layout.init();

  // Slinky
  $('.slinky-menu').find('ul, li, a').removeClass();

  $('.region-mobile-header-navigation .slinky-menu').slinky({
    title: true,
    label: ''
  });

  // Table
  $('.layout__content').find('table').addClass('table table-striped table-hover');

  // Notify
  var $notifications = $('.notify');
  if ($notifications.length) {

    $notifications.each(function (index, val) {
      var $document = $('.layout__document'),
          $region = $('.region-notify'),
          $element = $(this),
          cookie_id = 'notify_id_' + $element.attr('id'),
          $close = $element.find('.notify__close');

      // Flex magic - fixing display: block on fadeIn (see: https://stackoverflow.com/questions/28904698/how-fade-in-a-flex-box)
      $element.css('display', 'flex').hide();

      // No cookie has been set yet
      if (!Cookies.get(cookie_id)) {

        // Fade the element in
        $element.delay(2000).fadeIn(function () {
          var height = $region.outerHeight(true);

          $document.css('padding-bottom', height);
        });
      }

      // Closed
      $close.on('click', function (event) {
        $element.fadeOut(function () {
          $document.css('padding-bottom', 0);
        });

        // Set a cookie, to stop this notification from being displayed again
        Cookies.set(cookie_id, true);
      });
    });
  }

  $("#toggle_mobile_menu").click(function (event) {
    $('#main-menu').toggleClass('mobile-menu-open');
    $('.layout__document').toggleClass('mobile-menu-open');
  });

  //Show search form block
  $(".search-button").click(function (event) {
    if ($("#search-form-popover").hasClass("hidden")) {
      $("#search-form-popover").removeClass('hidden');
      $(".form-control").focus();
    }
  });

  //Hide search form block
  $(document).click(function (event) {
    if (!$(event.target).closest('#search-form-popover').length && !$(event.target).closest('.search-button').length) {
      if (!$("#search-form-popover").hasClass("hidden")) {
        $("#search-form-popover").addClass('hidden');
      }
    }
  });

  //Improving usability for menudropdowns for mobile devices
  if (!!('ontouchstart' in window)) {
    //check for touch device
    $('li.dropdown.layout-navigation__dropdown').find('> a').click(function (e) {
      if ($(this).parent().hasClass("expanded")) {
        //$(this).parent().removeClass("expanded");
      } else {
        e.preventDefault();
        $(this).parent().addClass("expanded");
      }
    });
  } else {
    //keeping it compatible with desktop devices
    $('li.dropdown.layout-navigation__dropdown').hover(function (e) {
      $(this).addClass("expanded");
    }, function (e) {
      $(this).removeClass("expanded");
    });
  }

  // Toggler
  $('[data-toggler]').on('click', function (event) {
    event.preventDefault();

    var $element = $(this),
        target = $element.attr('data-toggler'),
        $parent = $element.parents('.toggler'),
        $target = $parent.find(target),
        $all_toggle_buttons = $parent.find('[data-toggler]'),
        $toggle_button = $parent.find('[data-toggler="' + target + '"]'),
        $all_content = $parent.find('.toggler__content');

    // Remove all active togglers
    $all_toggle_buttons.parent().removeClass('active');

    $all_content.removeClass('active');

    // Show
    $toggle_button.parent().addClass('active');
    $target.addClass('active');
  });

  $(".toggler").each(function (index) {
    $(this).find('.toggler__button').first().trigger('click');
  });

  // Use multiple modals (http://jsfiddle.net/likhi1/wtj6nacd/)
  $(document).on({
    'show.bs.modal': function showBsModal() {
      var zIndex = 1040 + 10 * $('.modal:visible').length;
      $(this).css('z-index', zIndex);
      setTimeout(function () {
        $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
      }, 0);
    },
    'hidden.bs.modal': function hiddenBsModal() {
      if ($('.modal:visible').length > 0) {
        // restore the modal-open class to the body element, so that scrolling
        // works properly after de-stacking a modal.
        setTimeout(function () {
          $(document.body).addClass('modal-open');
        }, 0);
      }
    }
  }, '.modal');
})(jQuery);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRhYi5qcyIsImNvbGxhcHNlLmpzIiwidHJhbnNpdGlvbi5qcyIsInRvb2x0aXAuanMiLCJwb3BvdmVyLmpzIiwibW9kYWwuanMiLCJqcy5jb29raWUuanMiLCJjdXN0b20tc2xpbmt5LmpzIiwibGF5b3V0LmpzIiwiYXBwLmpzIl0sIm5hbWVzIjpbIiQiLCJUYWIiLCJlbGVtZW50IiwiVkVSU0lPTiIsIlRSQU5TSVRJT05fRFVSQVRJT04iLCJwcm90b3R5cGUiLCJzaG93IiwiJHRoaXMiLCIkdWwiLCJjbG9zZXN0Iiwic2VsZWN0b3IiLCJkYXRhIiwiYXR0ciIsInJlcGxhY2UiLCJwYXJlbnQiLCJoYXNDbGFzcyIsIiRwcmV2aW91cyIsImZpbmQiLCJoaWRlRXZlbnQiLCJFdmVudCIsInJlbGF0ZWRUYXJnZXQiLCJzaG93RXZlbnQiLCJ0cmlnZ2VyIiwiaXNEZWZhdWx0UHJldmVudGVkIiwiJHRhcmdldCIsImFjdGl2YXRlIiwidHlwZSIsImNvbnRhaW5lciIsImNhbGxiYWNrIiwiJGFjdGl2ZSIsInRyYW5zaXRpb24iLCJzdXBwb3J0IiwibGVuZ3RoIiwibmV4dCIsInJlbW92ZUNsYXNzIiwiZW5kIiwiYWRkQ2xhc3MiLCJvZmZzZXRXaWR0aCIsIm9uZSIsImVtdWxhdGVUcmFuc2l0aW9uRW5kIiwiUGx1Z2luIiwib3B0aW9uIiwiZWFjaCIsIm9sZCIsImZuIiwidGFiIiwiQ29uc3RydWN0b3IiLCJub0NvbmZsaWN0IiwiY2xpY2tIYW5kbGVyIiwiZSIsInByZXZlbnREZWZhdWx0IiwiY2FsbCIsImRvY3VtZW50Iiwib24iLCJqUXVlcnkiLCJDb2xsYXBzZSIsIm9wdGlvbnMiLCIkZWxlbWVudCIsImV4dGVuZCIsIkRFRkFVTFRTIiwiJHRyaWdnZXIiLCJpZCIsInRyYW5zaXRpb25pbmciLCIkcGFyZW50IiwiZ2V0UGFyZW50IiwiYWRkQXJpYUFuZENvbGxhcHNlZENsYXNzIiwidG9nZ2xlIiwiZGltZW5zaW9uIiwiaGFzV2lkdGgiLCJhY3RpdmVzRGF0YSIsImFjdGl2ZXMiLCJjaGlsZHJlbiIsInN0YXJ0RXZlbnQiLCJjb21wbGV0ZSIsInNjcm9sbFNpemUiLCJjYW1lbENhc2UiLCJqb2luIiwicHJveHkiLCJoaWRlIiwib2Zmc2V0SGVpZ2h0IiwiaSIsImdldFRhcmdldEZyb21UcmlnZ2VyIiwiaXNPcGVuIiwidG9nZ2xlQ2xhc3MiLCJocmVmIiwidGFyZ2V0IiwidGVzdCIsImNvbGxhcHNlIiwidHJhbnNpdGlvbkVuZCIsImVsIiwiY3JlYXRlRWxlbWVudCIsInRyYW5zRW5kRXZlbnROYW1lcyIsIldlYmtpdFRyYW5zaXRpb24iLCJNb3pUcmFuc2l0aW9uIiwiT1RyYW5zaXRpb24iLCJuYW1lIiwic3R5bGUiLCJ1bmRlZmluZWQiLCJkdXJhdGlvbiIsImNhbGxlZCIsIiRlbCIsInNldFRpbWVvdXQiLCJldmVudCIsInNwZWNpYWwiLCJic1RyYW5zaXRpb25FbmQiLCJiaW5kVHlwZSIsImRlbGVnYXRlVHlwZSIsImhhbmRsZSIsImlzIiwiaGFuZGxlT2JqIiwiaGFuZGxlciIsImFwcGx5IiwiYXJndW1lbnRzIiwiVG9vbHRpcCIsImVuYWJsZWQiLCJ0aW1lb3V0IiwiaG92ZXJTdGF0ZSIsImluU3RhdGUiLCJpbml0IiwiYW5pbWF0aW9uIiwicGxhY2VtZW50IiwidGVtcGxhdGUiLCJ0aXRsZSIsImRlbGF5IiwiaHRtbCIsInZpZXdwb3J0IiwicGFkZGluZyIsImdldE9wdGlvbnMiLCIkdmlld3BvcnQiLCJpc0Z1bmN0aW9uIiwiY2xpY2siLCJob3ZlciIsImZvY3VzIiwiY29uc3RydWN0b3IiLCJFcnJvciIsInRyaWdnZXJzIiwic3BsaXQiLCJldmVudEluIiwiZXZlbnRPdXQiLCJlbnRlciIsImxlYXZlIiwiX29wdGlvbnMiLCJmaXhUaXRsZSIsImdldERlZmF1bHRzIiwiZ2V0RGVsZWdhdGVPcHRpb25zIiwiZGVmYXVsdHMiLCJrZXkiLCJ2YWx1ZSIsIm9iaiIsInNlbGYiLCJjdXJyZW50VGFyZ2V0IiwidGlwIiwiY2xlYXJUaW1lb3V0IiwiaXNJblN0YXRlVHJ1ZSIsImhhc0NvbnRlbnQiLCJpbkRvbSIsImNvbnRhaW5zIiwib3duZXJEb2N1bWVudCIsImRvY3VtZW50RWxlbWVudCIsInRoYXQiLCIkdGlwIiwidGlwSWQiLCJnZXRVSUQiLCJzZXRDb250ZW50IiwiYXV0b1Rva2VuIiwiYXV0b1BsYWNlIiwiZGV0YWNoIiwiY3NzIiwidG9wIiwibGVmdCIsImRpc3BsYXkiLCJhcHBlbmRUbyIsImluc2VydEFmdGVyIiwicG9zIiwiZ2V0UG9zaXRpb24iLCJhY3R1YWxXaWR0aCIsImFjdHVhbEhlaWdodCIsIm9yZ1BsYWNlbWVudCIsInZpZXdwb3J0RGltIiwiYm90dG9tIiwicmlnaHQiLCJ3aWR0aCIsImNhbGN1bGF0ZWRPZmZzZXQiLCJnZXRDYWxjdWxhdGVkT2Zmc2V0IiwiYXBwbHlQbGFjZW1lbnQiLCJwcmV2SG92ZXJTdGF0ZSIsIm9mZnNldCIsImhlaWdodCIsIm1hcmdpblRvcCIsInBhcnNlSW50IiwibWFyZ2luTGVmdCIsImlzTmFOIiwic2V0T2Zmc2V0IiwidXNpbmciLCJwcm9wcyIsIk1hdGgiLCJyb3VuZCIsImRlbHRhIiwiZ2V0Vmlld3BvcnRBZGp1c3RlZERlbHRhIiwiaXNWZXJ0aWNhbCIsImFycm93RGVsdGEiLCJhcnJvd09mZnNldFBvc2l0aW9uIiwicmVwbGFjZUFycm93IiwiYXJyb3ciLCJnZXRUaXRsZSIsInJlbW92ZUF0dHIiLCIkZSIsImlzQm9keSIsInRhZ05hbWUiLCJlbFJlY3QiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJpc1N2ZyIsIndpbmRvdyIsIlNWR0VsZW1lbnQiLCJlbE9mZnNldCIsInNjcm9sbCIsInNjcm9sbFRvcCIsImJvZHkiLCJvdXRlckRpbXMiLCJ2aWV3cG9ydFBhZGRpbmciLCJ2aWV3cG9ydERpbWVuc2lvbnMiLCJ0b3BFZGdlT2Zmc2V0IiwiYm90dG9tRWRnZU9mZnNldCIsImxlZnRFZGdlT2Zmc2V0IiwicmlnaHRFZGdlT2Zmc2V0IiwibyIsInByZWZpeCIsInJhbmRvbSIsImdldEVsZW1lbnRCeUlkIiwiJGFycm93IiwiZW5hYmxlIiwiZGlzYWJsZSIsInRvZ2dsZUVuYWJsZWQiLCJkZXN0cm95Iiwib2ZmIiwicmVtb3ZlRGF0YSIsInRvb2x0aXAiLCJQb3BvdmVyIiwiY29udGVudCIsImdldENvbnRlbnQiLCJwb3BvdmVyIiwiTW9kYWwiLCIkYm9keSIsIiRkaWFsb2ciLCIkYmFja2Ryb3AiLCJpc1Nob3duIiwib3JpZ2luYWxCb2R5UGFkIiwic2Nyb2xsYmFyV2lkdGgiLCJpZ25vcmVCYWNrZHJvcENsaWNrIiwicmVtb3RlIiwibG9hZCIsIkJBQ0tEUk9QX1RSQU5TSVRJT05fRFVSQVRJT04iLCJiYWNrZHJvcCIsImtleWJvYXJkIiwiX3JlbGF0ZWRUYXJnZXQiLCJjaGVja1Njcm9sbGJhciIsInNldFNjcm9sbGJhciIsImVzY2FwZSIsInJlc2l6ZSIsImFkanVzdERpYWxvZyIsImVuZm9yY2VGb2N1cyIsImhpZGVNb2RhbCIsImhhcyIsIndoaWNoIiwiaGFuZGxlVXBkYXRlIiwicmVzZXRBZGp1c3RtZW50cyIsInJlc2V0U2Nyb2xsYmFyIiwicmVtb3ZlQmFja2Ryb3AiLCJyZW1vdmUiLCJhbmltYXRlIiwiZG9BbmltYXRlIiwiY2FsbGJhY2tSZW1vdmUiLCJtb2RhbElzT3ZlcmZsb3dpbmciLCJzY3JvbGxIZWlnaHQiLCJjbGllbnRIZWlnaHQiLCJwYWRkaW5nTGVmdCIsImJvZHlJc092ZXJmbG93aW5nIiwicGFkZGluZ1JpZ2h0IiwiZnVsbFdpbmRvd1dpZHRoIiwiaW5uZXJXaWR0aCIsImRvY3VtZW50RWxlbWVudFJlY3QiLCJhYnMiLCJjbGllbnRXaWR0aCIsIm1lYXN1cmVTY3JvbGxiYXIiLCJib2R5UGFkIiwic2Nyb2xsRGl2IiwiY2xhc3NOYW1lIiwiYXBwZW5kIiwicmVtb3ZlQ2hpbGQiLCJtb2RhbCIsImZhY3RvcnkiLCJyZWdpc3RlcmVkSW5Nb2R1bGVMb2FkZXIiLCJkZWZpbmUiLCJhbWQiLCJleHBvcnRzIiwibW9kdWxlIiwiT2xkQ29va2llcyIsIkNvb2tpZXMiLCJhcGkiLCJyZXN1bHQiLCJhdHRyaWJ1dGVzIiwiY29udmVydGVyIiwicGF0aCIsImV4cGlyZXMiLCJEYXRlIiwic2V0TWlsbGlzZWNvbmRzIiwiZ2V0TWlsbGlzZWNvbmRzIiwidG9VVENTdHJpbmciLCJKU09OIiwic3RyaW5naWZ5Iiwid3JpdGUiLCJlbmNvZGVVUklDb21wb25lbnQiLCJTdHJpbmciLCJkZWNvZGVVUklDb21wb25lbnQiLCJzdHJpbmdpZmllZEF0dHJpYnV0ZXMiLCJhdHRyaWJ1dGVOYW1lIiwiY29va2llIiwiY29va2llcyIsInJkZWNvZGUiLCJwYXJ0cyIsInNsaWNlIiwianNvbiIsImNoYXJBdCIsInJlYWQiLCJwYXJzZSIsInNldCIsImdldCIsImdldEpTT04iLCJ3aXRoQ29udmVydGVyIiwibGFzdENsaWNrIiwic2xpbmt5Iiwic2V0dGluZ3MiLCJsYWJlbCIsInNwZWVkIiwiYWN0aXZlQ2xhc3MiLCJoZWFkZXJDbGFzcyIsImhlYWRpbmdUYWciLCJiYWNrRmlyc3QiLCJtZW51Iiwicm9vdCIsImZpcnN0IiwibW92ZSIsImRlcHRoIiwib3V0ZXJIZWlnaHQiLCJwcmV2IiwicHJlcGVuZCIsIiRsaW5rIiwidGV4dCIsImJhY2tMaW5rIiwicHJvcCIsIm5vdyIsImEiLCJwYXJlbnRzVW50aWwiLCJqdW1wIiwidG8iLCJhY3RpdmUiLCJtZW51cyIsImhvbWUiLCJjb3VudCIsImxheW91dCIsInB1YiIsIiRsYXlvdXRfX2hlYWRlciIsIiRsYXlvdXRfX2RvY3VtZW50IiwibGF5b3V0X2NsYXNzZXMiLCJyZWdpc3RlckV2ZW50SGFuZGxlcnMiLCJyZWdpc3RlckJvb3RFdmVudEhhbmRsZXJzIiwiYWRkRWxlbWVudENsYXNzZXMiLCJhZGQiLCJsYXlvdXRfX29iZnVzY2F0b3IiLCJ0b2dnbGVEcmF3ZXIiLCJoZWFkZXJfd2F0ZXJmYWxsIiwiJGRvY3VtZW50Iiwid2F0ZXJmYWxsSGVhZGVyIiwiJHdyYXBwZXIiLCJsYXlvdXRfX3dyYXBwZXIiLCIkb2JmdXNjYXRvciIsIiRkcmF3ZXIiLCJsYXlvdXRfX2RyYXdlciIsIm9iZnVzY2F0b3JfaXNfdmlzaWJsZSIsImRyYXdlcl9pc192aXNpYmxlIiwiJGhlYWRlciIsImxheW91dF9faGVhZGVyIiwiZGlzdGFuY2UiLCJoZWFkZXJfaXNfY29tcGFjdCIsImluZGV4IiwiaGVhZGVyX3Njcm9sbCIsIndyYXBwZXJfaGFzX3Njcm9sbGluZ19oZWFkZXIiLCJ3cmFwcGVyX2hhc19kcmF3ZXIiLCJ3cmFwcGVyX2lzX3VwZ3JhZGVkIiwiJG1vZGFscyIsIiRub3RpZmljYXRpb25zIiwidmFsIiwiJHJlZ2lvbiIsImNvb2tpZV9pZCIsIiRjbG9zZSIsImZhZGVJbiIsImZhZGVPdXQiLCJwYXJlbnRzIiwiJGFsbF90b2dnbGVfYnV0dG9ucyIsIiR0b2dnbGVfYnV0dG9uIiwiJGFsbF9jb250ZW50IiwiekluZGV4Iiwibm90Il0sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7OztBQVNBLENBQUMsVUFBVUEsQ0FBVixFQUFhO0FBQ1o7O0FBRUE7QUFDQTs7QUFFQSxNQUFJQyxNQUFNLFNBQU5BLEdBQU0sQ0FBVUMsT0FBVixFQUFtQjtBQUMzQjtBQUNBLFNBQUtBLE9BQUwsR0FBZUYsRUFBRUUsT0FBRixDQUFmO0FBQ0E7QUFDRCxHQUpEOztBQU1BRCxNQUFJRSxPQUFKLEdBQWMsT0FBZDs7QUFFQUYsTUFBSUcsbUJBQUosR0FBMEIsR0FBMUI7O0FBRUFILE1BQUlJLFNBQUosQ0FBY0MsSUFBZCxHQUFxQixZQUFZO0FBQy9CLFFBQUlDLFFBQVcsS0FBS0wsT0FBcEI7QUFDQSxRQUFJTSxNQUFXRCxNQUFNRSxPQUFOLENBQWMsd0JBQWQsQ0FBZjtBQUNBLFFBQUlDLFdBQVdILE1BQU1JLElBQU4sQ0FBVyxRQUFYLENBQWY7O0FBRUEsUUFBSSxDQUFDRCxRQUFMLEVBQWU7QUFDYkEsaUJBQVdILE1BQU1LLElBQU4sQ0FBVyxNQUFYLENBQVg7QUFDQUYsaUJBQVdBLFlBQVlBLFNBQVNHLE9BQVQsQ0FBaUIsZ0JBQWpCLEVBQW1DLEVBQW5DLENBQXZCLENBRmEs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QUFpRCxPQUFqRDtBQUNILEdBRkQ7O0FBSUE7QUFDQXRCLElBQUVvRCxRQUFGLEVBQVlDLEVBQVosQ0FBZTtBQUNiLHFCQUFpQix1QkFBWTtBQUMzQixVQUFJNFYsU0FBUyxPQUFRLEtBQUtqWixFQUFFLGdCQUFGLEVBQW9CZ0MsTUFBOUM7QUFDQWhDLFFBQUUsSUFBRixFQUFRdUssR0FBUixDQUFZLFNBQVosRUFBdUIwTyxNQUF2QjtBQUNBNVMsaUJBQVcsWUFBWTtBQUNyQnJHLFVBQUUsaUJBQUYsRUFBcUJrWixHQUFyQixDQUF5QixjQUF6QixFQUF5QzNPLEdBQXpDLENBQTZDLFNBQTdDLEVBQXdEME8sU0FBUyxDQUFqRSxFQUFvRTdXLFFBQXBFLENBQTZFLGFBQTdFO0FBQ0QsT0FGRCxFQUVHLENBRkg7QUFHRCxLQVBZO0FBUWIsdUJBQW1CLHlCQUFZO0FBQzdCLFVBQUlwQyxFQUFFLGdCQUFGLEVBQW9CZ0MsTUFBcEIsR0FBNkIsQ0FBakMsRUFBb0M7QUFDbEM7QUFDQTtBQUNBcUUsbUJBQVcsWUFBWTtBQUNyQnJHLFlBQUVvRCxTQUFTcUssSUFBWCxFQUFpQnJMLFFBQWpCLENBQTBCLFlBQTFCO0FBQ0QsU0FGRCxFQUVHLENBRkg7QUFHRDtBQUNGO0FBaEJZLEdBQWYsRUFpQkcsUUFqQkg7QUFtQkQsQ0E1SkQsRUE0SkdrQixNQTVKSCIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogdGFiLmpzIHYzLjMuN1xuICogaHR0cDovL2dldGJvb3RzdHJhcC5jb20vamF2YXNjcmlwdC8jdGFic1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE2IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIFRBQiBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09XG5cbiAgdmFyIFRhYiA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgLy8ganNjczpkaXNhYmxlIHJlcXVpcmVEb2xsYXJCZWZvcmVqUXVlcnlBc3NpZ25tZW50XG4gICAgdGhpcy5lbGVtZW50ID0gJChlbGVtZW50KVxuICAgIC8vIGpzY3M6ZW5hYmxlIHJlcXVpcmVEb2xsYXJCZWZvcmVqUXVlcnlBc3NpZ25tZW50XG4gIH1cblxuICBUYWIuVkVSU0lPTiA9ICczLjMuNydcblxuICBUYWIuVFJBTlNJVElPTl9EVVJBVElPTiA9IDE1MFxuXG4gIFRhYi5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJHRoaXMgICAgPSB0aGlzLmVsZW1lbnRcbiAgICB2YXIgJHVsICAgICAgPSAkdGhpcy5jbG9zZXN0KCd1bDpub3QoLmRyb3Bkb3duLW1lbnUpJylcbiAgICB2YXIgc2VsZWN0b3IgPSAkdGhpcy5kYXRhKCd0YXJnZXQnKVxuXG4gICAgaWYgKCFzZWxlY3Rvcikge1xuICAgICAgc2VsZWN0b3IgPSAkdGhpcy5hdHRyKCdocmVmJylcbiAgICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgJiYgc2VsZWN0b3IucmVwbGFjZSgvLiooPz0jW15cXHNdKiQpLywgJycpIC8vIHN0cmlwIGZvciBpZTdcbiAgICB9XG5cbiAgICBpZiAoJHRoaXMucGFyZW50KCdsaScpLmhhc0NsYXNzKCdhY3RpdmUnKSkgcmV0dXJuXG5cbiAgICB2YXIgJHByZXZpb3VzID0gJHVsLmZpbmQoJy5hY3RpdmU6bGFzdCBhJylcbiAgICB2YXIgaGlkZUV2ZW50ID0gJC5FdmVudCgnaGlkZS5icy50YWInLCB7XG4gICAgICByZWxhdGVkVGFyZ2V0OiAkdGhpc1swXVxuICAgIH0pXG4gICAgdmFyIHNob3dFdmVudCA9ICQuRXZlbnQoJ3Nob3cuYnMudGFiJywge1xuICAgICAgcmVsYXRlZFRhcmdldDogJHByZXZpb3VzWzBdXG4gICAgfSlcblxuICAgICRwcmV2aW91cy50cmlnZ2VyKGhpZGVFdmVudClcbiAgICAkdGhpcy50cmlnZ2VyKHNob3dFdmVudClcblxuICAgIGlmIChzaG93RXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkgfHwgaGlkZUV2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgIHZhciAkdGFyZ2V0ID0gJChzZWxlY3RvcilcblxuICAgIHRoaXMuYWN0aXZhdGUoJHRoaXMuY2xvc2VzdCgnbGknKSwgJHVsKVxuICAgIHRoaXMuYWN0aXZhdGUoJHRhcmdldCwgJHRhcmdldC5wYXJlbnQoKSwgZnVuY3Rpb24gKCkge1xuICAgICAgJHByZXZpb3VzLnRyaWdnZXIoe1xuICAgICAgICB0eXBlOiAnaGlkZGVuLmJzLnRhYicsXG4gICAgICAgIHJlbGF0ZWRUYXJnZXQ6ICR0aGlzWzBdXG4gICAgICB9KVxuICAgICAgJHRoaXMudHJpZ2dlcih7XG4gICAgICAgIHR5cGU6ICdzaG93bi5icy50YWInLFxuICAgICAgICByZWxhdGVkVGFyZ2V0OiAkcHJldmlvdXNbMF1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIFRhYi5wcm90b3R5cGUuYWN0aXZhdGUgPSBmdW5jdGlvbiAoZWxlbWVudCwgY29udGFpbmVyLCBjYWxsYmFjaykge1xuICAgIHZhciAkYWN0aXZlICAgID0gY29udGFpbmVyLmZpbmQoJz4gLmFjdGl2ZScpXG4gICAgdmFyIHRyYW5zaXRpb24gPSBjYWxsYmFja1xuICAgICAgJiYgJC5zdXBwb3J0LnRyYW5zaXRpb25cbiAgICAgICYmICgkYWN0aXZlLmxlbmd0aCAmJiAkYWN0aXZlLmhhc0NsYXNzKCdmYWRlJykgfHwgISFjb250YWluZXIuZmluZCgnPiAuZmFkZScpLmxlbmd0aClcblxuICAgIGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICAkYWN0aXZlXG4gICAgICAgIC5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgICAgICAgLmZpbmQoJz4gLmRyb3Bkb3duLW1lbnUgPiAuYWN0aXZlJylcbiAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAgIC5lbmQoKVxuICAgICAgICAuZmluZCgnW2RhdGEtdG9nZ2xlPVwidGFiXCJdJylcbiAgICAgICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIGZhbHNlKVxuXG4gICAgICBlbGVtZW50XG4gICAgICAgIC5hZGRDbGFzcygnYWN0aXZlJylcbiAgICAgICAgLmZpbmQoJ1tkYXRhLXRvZ2dsZT1cInRhYlwiXScpXG4gICAgICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCB0cnVlKVxuXG4gICAgICBpZiAodHJhbnNpdGlvbikge1xuICAgICAgICBlbGVtZW50WzBdLm9mZnNldFdpZHRoIC8vIHJlZmxvdyBmb3IgdHJhbnNpdGlvblxuICAgICAgICBlbGVtZW50LmFkZENsYXNzKCdpbicpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbGVtZW50LnJlbW92ZUNsYXNzKCdmYWRlJylcbiAgICAgIH1cblxuICAgICAgaWYgKGVsZW1lbnQucGFyZW50KCcuZHJvcGRvd24tbWVudScpLmxlbmd0aCkge1xuICAgICAgICBlbGVtZW50XG4gICAgICAgICAgLmNsb3Nlc3QoJ2xpLmRyb3Bkb3duJylcbiAgICAgICAgICAgIC5hZGRDbGFzcygnYWN0aXZlJylcbiAgICAgICAgICAuZW5kKClcbiAgICAgICAgICAuZmluZCgnW2RhdGEtdG9nZ2xlPVwidGFiXCJdJylcbiAgICAgICAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgdHJ1ZSlcbiAgICAgIH1cblxuICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soKVxuICAgIH1cblxuICAgICRhY3RpdmUubGVuZ3RoICYmIHRyYW5zaXRpb24gP1xuICAgICAgJGFjdGl2ZVxuICAgICAgICAub25lKCdic1RyYW5zaXRpb25FbmQnLCBuZXh0KVxuICAgICAgICAuZW11bGF0ZVRyYW5zaXRpb25FbmQoVGFiLlRSQU5TSVRJT05fRFVSQVRJT04pIDpcbiAgICAgIG5leHQoKVxuXG4gICAgJGFjdGl2ZS5yZW1vdmVDbGFzcygnaW4nKVxuICB9XG5cblxuICAvLyBUQUIgUExVR0lOIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbikge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgID0gJHRoaXMuZGF0YSgnYnMudGFiJylcblxuICAgICAgaWYgKCFkYXRhKSAkdGhpcy5kYXRhKCdicy50YWInLCAoZGF0YSA9IG5ldyBUYWIodGhpcykpKVxuICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ3N0cmluZycpIGRhdGFbb3B0aW9uXSgpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLnRhYlxuXG4gICQuZm4udGFiICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4udGFiLkNvbnN0cnVjdG9yID0gVGFiXG5cblxuICAvLyBUQUIgTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09XG5cbiAgJC5mbi50YWIubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAkLmZuLnRhYiA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIFRBQiBEQVRBLUFQSVxuICAvLyA9PT09PT09PT09PT1cblxuICB2YXIgY2xpY2tIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBQbHVnaW4uY2FsbCgkKHRoaXMpLCAnc2hvdycpXG4gIH1cblxuICAkKGRvY3VtZW50KVxuICAgIC5vbignY2xpY2suYnMudGFiLmRhdGEtYXBpJywgJ1tkYXRhLXRvZ2dsZT1cInRhYlwiXScsIGNsaWNrSGFuZGxlcilcbiAgICAub24oJ2NsaWNrLmJzLnRhYi5kYXRhLWFwaScsICdbZGF0YS10b2dnbGU9XCJwaWxsXCJdJywgY2xpY2tIYW5kbGVyKVxuXG59KGpRdWVyeSk7XG4iLCIvKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogY29sbGFwc2UuanMgdjMuMy43XG4gKiBodHRwOi8vZ2V0Ym9vdHN0cmFwLmNvbS9qYXZhc2NyaXB0LyNjb2xsYXBzZVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE2IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuLyoganNoaW50IGxhdGVkZWY6IGZhbHNlICovXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gQ09MTEFQU0UgUFVCTElDIENMQVNTIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgQ29sbGFwc2UgPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgICAgICA9ICQoZWxlbWVudClcbiAgICB0aGlzLm9wdGlvbnMgICAgICAgPSAkLmV4dGVuZCh7fSwgQ29sbGFwc2UuREVGQVVMVFMsIG9wdGlvbnMpXG4gICAgdGhpcy4kdHJpZ2dlciAgICAgID0gJCgnW2RhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIl1baHJlZj1cIiMnICsgZWxlbWVudC5pZCArICdcIl0sJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAnW2RhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIl1bZGF0YS10YXJnZXQ9XCIjJyArIGVsZW1lbnQuaWQgKyAnXCJdJylcbiAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBudWxsXG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnBhcmVudCkge1xuICAgICAgdGhpcy4kcGFyZW50ID0gdGhpcy5nZXRQYXJlbnQoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFkZEFyaWFBbmRDb2xsYXBzZWRDbGFzcyh0aGlzLiRlbGVtZW50LCB0aGlzLiR0cmlnZ2VyKVxuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMudG9nZ2xlKSB0aGlzLnRvZ2dsZSgpXG4gIH1cblxuICBDb2xsYXBzZS5WRVJTSU9OICA9ICczLjMuNydcblxuICBDb2xsYXBzZS5UUkFOU0lUSU9OX0RVUkFUSU9OID0gMzUwXG5cbiAgQ29sbGFwc2UuREVGQVVMVFMgPSB7XG4gICAgdG9nZ2xlOiB0cnVlXG4gIH1cblxuICBDb2xsYXBzZS5wcm90b3R5cGUuZGltZW5zaW9uID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBoYXNXaWR0aCA9IHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ3dpZHRoJylcbiAgICByZXR1cm4gaGFzV2lkdGggPyAnd2lkdGgnIDogJ2hlaWdodCdcbiAgfVxuXG4gIENvbGxhcHNlLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnRyYW5zaXRpb25pbmcgfHwgdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaW4nKSkgcmV0dXJuXG5cbiAgICB2YXIgYWN0aXZlc0RhdGFcbiAgICB2YXIgYWN0aXZlcyA9IHRoaXMuJHBhcmVudCAmJiB0aGlzLiRwYXJlbnQuY2hpbGRyZW4oJy5wYW5lbCcpLmNoaWxkcmVuKCcuaW4sIC5jb2xsYXBzaW5nJylcblxuICAgIGlmIChhY3RpdmVzICYmIGFjdGl2ZXMubGVuZ3RoKSB7XG4gICAgICBhY3RpdmVzRGF0YSA9IGFjdGl2ZXMuZGF0YSgnYnMuY29sbGFwc2UnKVxuICAgICAgaWYgKGFjdGl2ZXNEYXRhICYmIGFjdGl2ZXNEYXRhLnRyYW5zaXRpb25pbmcpIHJldHVyblxuICAgIH1cblxuICAgIHZhciBzdGFydEV2ZW50ID0gJC5FdmVudCgnc2hvdy5icy5jb2xsYXBzZScpXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKHN0YXJ0RXZlbnQpXG4gICAgaWYgKHN0YXJ0RXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgaWYgKGFjdGl2ZXMgJiYgYWN0aXZlcy5sZW5ndGgpIHtcbiAgICAgIFBsdWdpbi5jYWxsKGFjdGl2ZXMsICdoaWRlJylcbiAgICAgIGFjdGl2ZXNEYXRhIHx8IGFjdGl2ZXMuZGF0YSgnYnMuY29sbGFwc2UnLCBudWxsKVxuICAgIH1cblxuICAgIHZhciBkaW1lbnNpb24gPSB0aGlzLmRpbWVuc2lvbigpXG5cbiAgICB0aGlzLiRlbGVtZW50XG4gICAgICAucmVtb3ZlQ2xhc3MoJ2NvbGxhcHNlJylcbiAgICAgIC5hZGRDbGFzcygnY29sbGFwc2luZycpW2RpbWVuc2lvbl0oMClcbiAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgdHJ1ZSlcblxuICAgIHRoaXMuJHRyaWdnZXJcbiAgICAgIC5yZW1vdmVDbGFzcygnY29sbGFwc2VkJylcbiAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgdHJ1ZSlcblxuICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IDFcblxuICAgIHZhciBjb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdjb2xsYXBzaW5nJylcbiAgICAgICAgLmFkZENsYXNzKCdjb2xsYXBzZSBpbicpW2RpbWVuc2lvbl0oJycpXG4gICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSAwXG4gICAgICB0aGlzLiRlbGVtZW50XG4gICAgICAgIC50cmlnZ2VyKCdzaG93bi5icy5jb2xsYXBzZScpXG4gICAgfVxuXG4gICAgaWYgKCEkLnN1cHBvcnQudHJhbnNpdGlvbikgcmV0dXJuIGNvbXBsZXRlLmNhbGwodGhpcylcblxuICAgIHZhciBzY3JvbGxTaXplID0gJC5jYW1lbENhc2UoWydzY3JvbGwnLCBkaW1lbnNpb25dLmpvaW4oJy0nKSlcblxuICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsICQucHJveHkoY29tcGxldGUsIHRoaXMpKVxuICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKENvbGxhcHNlLlRSQU5TSVRJT05fRFVSQVRJT04pW2RpbWVuc2lvbl0odGhpcy4kZWxlbWVudFswXVtzY3JvbGxTaXplXSlcbiAgfVxuXG4gIENvbGxhcHNlLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnRyYW5zaXRpb25pbmcgfHwgIXRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2luJykpIHJldHVyblxuXG4gICAgdmFyIHN0YXJ0RXZlbnQgPSAkLkV2ZW50KCdoaWRlLmJzLmNvbGxhcHNlJylcbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoc3RhcnRFdmVudClcbiAgICBpZiAoc3RhcnRFdmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgcmV0dXJuXG5cbiAgICB2YXIgZGltZW5zaW9uID0gdGhpcy5kaW1lbnNpb24oKVxuXG4gICAgdGhpcy4kZWxlbWVudFtkaW1lbnNpb25dKHRoaXMuJGVsZW1lbnRbZGltZW5zaW9uXSgpKVswXS5vZmZzZXRIZWlnaHRcblxuICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5hZGRDbGFzcygnY29sbGFwc2luZycpXG4gICAgICAucmVtb3ZlQ2xhc3MoJ2NvbGxhcHNlIGluJylcbiAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgZmFsc2UpXG5cbiAgICB0aGlzLiR0cmlnZ2VyXG4gICAgICAuYWRkQ2xhc3MoJ2NvbGxhcHNlZCcpXG4gICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIGZhbHNlKVxuXG4gICAgdGhpcy50cmFuc2l0aW9uaW5nID0gMVxuXG4gICAgdmFyIGNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gMFxuICAgICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2NvbGxhcHNpbmcnKVxuICAgICAgICAuYWRkQ2xhc3MoJ2NvbGxhcHNlJylcbiAgICAgICAgLnRyaWdnZXIoJ2hpZGRlbi5icy5jb2xsYXBzZScpXG4gICAgfVxuXG4gICAgaWYgKCEkLnN1cHBvcnQudHJhbnNpdGlvbikgcmV0dXJuIGNvbXBsZXRlLmNhbGwodGhpcylcblxuICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgIFtkaW1lbnNpb25dKDApXG4gICAgICAub25lKCdic1RyYW5zaXRpb25FbmQnLCAkLnByb3h5KGNvbXBsZXRlLCB0aGlzKSlcbiAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChDb2xsYXBzZS5UUkFOU0lUSU9OX0RVUkFUSU9OKVxuICB9XG5cbiAgQ29sbGFwc2UucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzW3RoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2luJykgPyAnaGlkZScgOiAnc2hvdyddKClcbiAgfVxuXG4gIENvbGxhcHNlLnByb3RvdHlwZS5nZXRQYXJlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICQodGhpcy5vcHRpb25zLnBhcmVudClcbiAgICAgIC5maW5kKCdbZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiXVtkYXRhLXBhcmVudD1cIicgKyB0aGlzLm9wdGlvbnMucGFyZW50ICsgJ1wiXScpXG4gICAgICAuZWFjaCgkLnByb3h5KGZ1bmN0aW9uIChpLCBlbGVtZW50KSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQoZWxlbWVudClcbiAgICAgICAgdGhpcy5hZGRBcmlhQW5kQ29sbGFwc2VkQ2xhc3MoZ2V0VGFyZ2V0RnJvbVRyaWdnZXIoJGVsZW1lbnQpLCAkZWxlbWVudClcbiAgICAgIH0sIHRoaXMpKVxuICAgICAgLmVuZCgpXG4gIH1cblxuICBDb2xsYXBzZS5wcm90b3R5cGUuYWRkQXJpYUFuZENvbGxhcHNlZENsYXNzID0gZnVuY3Rpb24gKCRlbGVtZW50LCAkdHJpZ2dlcikge1xuICAgIHZhciBpc09wZW4gPSAkZWxlbWVudC5oYXNDbGFzcygnaW4nKVxuXG4gICAgJGVsZW1lbnQuYXR0cignYXJpYS1leHBhbmRlZCcsIGlzT3BlbilcbiAgICAkdHJpZ2dlclxuICAgICAgLnRvZ2dsZUNsYXNzKCdjb2xsYXBzZWQnLCAhaXNPcGVuKVxuICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBpc09wZW4pXG4gIH1cblxuICBmdW5jdGlvbiBnZXRUYXJnZXRGcm9tVHJpZ2dlcigkdHJpZ2dlcikge1xuICAgIHZhciBocmVmXG4gICAgdmFyIHRhcmdldCA9ICR0cmlnZ2VyLmF0dHIoJ2RhdGEtdGFyZ2V0JylcbiAgICAgIHx8IChocmVmID0gJHRyaWdnZXIuYXR0cignaHJlZicpKSAmJiBocmVmLnJlcGxhY2UoLy4qKD89I1teXFxzXSskKS8sICcnKSAvLyBzdHJpcCBmb3IgaWU3XG5cbiAgICByZXR1cm4gJCh0YXJnZXQpXG4gIH1cblxuXG4gIC8vIENPTExBUFNFIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbikge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzICAgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSAgICA9ICR0aGlzLmRhdGEoJ2JzLmNvbGxhcHNlJylcbiAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoe30sIENvbGxhcHNlLkRFRkFVTFRTLCAkdGhpcy5kYXRhKCksIHR5cGVvZiBvcHRpb24gPT0gJ29iamVjdCcgJiYgb3B0aW9uKVxuXG4gICAgICBpZiAoIWRhdGEgJiYgb3B0aW9ucy50b2dnbGUgJiYgL3Nob3d8aGlkZS8udGVzdChvcHRpb24pKSBvcHRpb25zLnRvZ2dsZSA9IGZhbHNlXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLmNvbGxhcHNlJywgKGRhdGEgPSBuZXcgQ29sbGFwc2UodGhpcywgb3B0aW9ucykpKVxuICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ3N0cmluZycpIGRhdGFbb3B0aW9uXSgpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLmNvbGxhcHNlXG5cbiAgJC5mbi5jb2xsYXBzZSAgICAgICAgICAgICA9IFBsdWdpblxuICAkLmZuLmNvbGxhcHNlLkNvbnN0cnVjdG9yID0gQ29sbGFwc2VcblxuXG4gIC8vIENPTExBUFNFIE5PIENPTkZMSUNUXG4gIC8vID09PT09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi5jb2xsYXBzZS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4uY29sbGFwc2UgPSBvbGRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cblxuICAvLyBDT0xMQVBTRSBEQVRBLUFQSVxuICAvLyA9PT09PT09PT09PT09PT09PVxuXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljay5icy5jb2xsYXBzZS5kYXRhLWFwaScsICdbZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiXScsIGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyICR0aGlzICAgPSAkKHRoaXMpXG5cbiAgICBpZiAoISR0aGlzLmF0dHIoJ2RhdGEtdGFyZ2V0JykpIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgdmFyICR0YXJnZXQgPSBnZXRUYXJnZXRGcm9tVHJpZ2dlcigkdGhpcylcbiAgICB2YXIgZGF0YSAgICA9ICR0YXJnZXQuZGF0YSgnYnMuY29sbGFwc2UnKVxuICAgIHZhciBvcHRpb24gID0gZGF0YSA/ICd0b2dnbGUnIDogJHRoaXMuZGF0YSgpXG5cbiAgICBQbHVnaW4uY2FsbCgkdGFyZ2V0LCBvcHRpb24pXG4gIH0pXG5cbn0oalF1ZXJ5KTtcbiIsIi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiB0cmFuc2l0aW9uLmpzIHYzLjMuN1xuICogaHR0cDovL2dldGJvb3RzdHJhcC5jb20vamF2YXNjcmlwdC8jdHJhbnNpdGlvbnNcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxNiBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBDU1MgVFJBTlNJVElPTiBTVVBQT1JUIChTaG91dG91dDogaHR0cDovL3d3dy5tb2Rlcm5penIuY29tLylcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gdHJhbnNpdGlvbkVuZCgpIHtcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdib290c3RyYXAnKVxuXG4gICAgdmFyIHRyYW5zRW5kRXZlbnROYW1lcyA9IHtcbiAgICAgIFdlYmtpdFRyYW5zaXRpb24gOiAnd2Via2l0VHJhbnNpdGlvbkVuZCcsXG4gICAgICBNb3pUcmFuc2l0aW9uICAgIDogJ3RyYW5zaXRpb25lbmQnLFxuICAgICAgT1RyYW5zaXRpb24gICAgICA6ICdvVHJhbnNpdGlvbkVuZCBvdHJhbnNpdGlvbmVuZCcsXG4gICAgICB0cmFuc2l0aW9uICAgICAgIDogJ3RyYW5zaXRpb25lbmQnXG4gICAgfVxuXG4gICAgZm9yICh2YXIgbmFtZSBpbiB0cmFuc0VuZEV2ZW50TmFtZXMpIHtcbiAgICAgIGlmIChlbC5zdHlsZVtuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB7IGVuZDogdHJhbnNFbmRFdmVudE5hbWVzW25hbWVdIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2UgLy8gZXhwbGljaXQgZm9yIGllOCAoICAuXy4pXG4gIH1cblxuICAvLyBodHRwOi8vYmxvZy5hbGV4bWFjY2F3LmNvbS9jc3MtdHJhbnNpdGlvbnNcbiAgJC5mbi5lbXVsYXRlVHJhbnNpdGlvbkVuZCA9IGZ1bmN0aW9uIChkdXJhdGlvbikge1xuICAgIHZhciBjYWxsZWQgPSBmYWxzZVxuICAgIHZhciAkZWwgPSB0aGlzXG4gICAgJCh0aGlzKS5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIGZ1bmN0aW9uICgpIHsgY2FsbGVkID0gdHJ1ZSB9KVxuICAgIHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uICgpIHsgaWYgKCFjYWxsZWQpICQoJGVsKS50cmlnZ2VyKCQuc3VwcG9ydC50cmFuc2l0aW9uLmVuZCkgfVxuICAgIHNldFRpbWVvdXQoY2FsbGJhY2ssIGR1cmF0aW9uKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAkKGZ1bmN0aW9uICgpIHtcbiAgICAkLnN1cHBvcnQudHJhbnNpdGlvbiA9IHRyYW5zaXRpb25FbmQoKVxuXG4gICAgaWYgKCEkLnN1cHBvcnQudHJhbnNpdGlvbikgcmV0dXJuXG5cbiAgICAkLmV2ZW50LnNwZWNpYWwuYnNUcmFuc2l0aW9uRW5kID0ge1xuICAgICAgYmluZFR5cGU6ICQuc3VwcG9ydC50cmFuc2l0aW9uLmVuZCxcbiAgICAgIGRlbGVnYXRlVHlwZTogJC5zdXBwb3J0LnRyYW5zaXRpb24uZW5kLFxuICAgICAgaGFuZGxlOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAoJChlLnRhcmdldCkuaXModGhpcykpIHJldHVybiBlLmhhbmRsZU9iai5oYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbn0oalF1ZXJ5KTtcbiIsIi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiB0b29sdGlwLmpzIHYzLjMuN1xuICogaHR0cDovL2dldGJvb3RzdHJhcC5jb20vamF2YXNjcmlwdC8jdG9vbHRpcFxuICogSW5zcGlyZWQgYnkgdGhlIG9yaWdpbmFsIGpRdWVyeS50aXBzeSBieSBKYXNvbiBGcmFtZVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE2IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIFRPT0xUSVAgUFVCTElDIENMQVNTIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIHZhciBUb29sdGlwID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLnR5cGUgICAgICAgPSBudWxsXG4gICAgdGhpcy5vcHRpb25zICAgID0gbnVsbFxuICAgIHRoaXMuZW5hYmxlZCAgICA9IG51bGxcbiAgICB0aGlzLnRpbWVvdXQgICAgPSBudWxsXG4gICAgdGhpcy5ob3ZlclN0YXRlID0gbnVsbFxuICAgIHRoaXMuJGVsZW1lbnQgICA9IG51bGxcbiAgICB0aGlzLmluU3RhdGUgICAgPSBudWxsXG5cbiAgICB0aGlzLmluaXQoJ3Rvb2x0aXAnLCBlbGVtZW50LCBvcHRpb25zKVxuICB9XG5cbiAgVG9vbHRpcC5WRVJTSU9OICA9ICczLjMuNydcblxuICBUb29sdGlwLlRSQU5TSVRJT05fRFVSQVRJT04gPSAxNTBcblxuICBUb29sdGlwLkRFRkFVTFRTID0ge1xuICAgIGFuaW1hdGlvbjogdHJ1ZSxcbiAgICBwbGFjZW1lbnQ6ICd0b3AnLFxuICAgIHNlbGVjdG9yOiBmYWxzZSxcbiAgICB0ZW1wbGF0ZTogJzxkaXYgY2xhc3M9XCJ0b29sdGlwXCIgcm9sZT1cInRvb2x0aXBcIj48ZGl2IGNsYXNzPVwidG9vbHRpcC1hcnJvd1wiPjwvZGl2PjxkaXYgY2xhc3M9XCJ0b29sdGlwLWlubmVyXCI+PC9kaXY+PC9kaXY+JyxcbiAgICB0cmlnZ2VyOiAnaG92ZXIgZm9jdXMnLFxuICAgIHRpdGxlOiAnJyxcbiAgICBkZWxheTogMCxcbiAgICBodG1sOiBmYWxzZSxcbiAgICBjb250YWluZXI6IGZhbHNlLFxuICAgIHZpZXdwb3J0OiB7XG4gICAgICBzZWxlY3RvcjogJ2JvZHknLFxuICAgICAgcGFkZGluZzogMFxuICAgIH1cbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAodHlwZSwgZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuZW5hYmxlZCAgID0gdHJ1ZVxuICAgIHRoaXMudHlwZSAgICAgID0gdHlwZVxuICAgIHRoaXMuJGVsZW1lbnQgID0gJChlbGVtZW50KVxuICAgIHRoaXMub3B0aW9ucyAgID0gdGhpcy5nZXRPcHRpb25zKG9wdGlvbnMpXG4gICAgdGhpcy4kdmlld3BvcnQgPSB0aGlzLm9wdGlvbnMudmlld3BvcnQgJiYgJCgkLmlzRnVuY3Rpb24odGhpcy5vcHRpb25zLnZpZXdwb3J0KSA/IHRoaXMub3B0aW9ucy52aWV3cG9ydC5jYWxsKHRoaXMsIHRoaXMuJGVsZW1lbnQpIDogKHRoaXMub3B0aW9ucy52aWV3cG9ydC5zZWxlY3RvciB8fCB0aGlzLm9wdGlvbnMudmlld3BvcnQpKVxuICAgIHRoaXMuaW5TdGF0ZSAgID0geyBjbGljazogZmFsc2UsIGhvdmVyOiBmYWxzZSwgZm9jdXM6IGZhbHNlIH1cblxuICAgIGlmICh0aGlzLiRlbGVtZW50WzBdIGluc3RhbmNlb2YgZG9jdW1lbnQuY29uc3RydWN0b3IgJiYgIXRoaXMub3B0aW9ucy5zZWxlY3Rvcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdgc2VsZWN0b3JgIG9wdGlvbiBtdXN0IGJlIHNwZWNpZmllZCB3aGVuIGluaXRpYWxpemluZyAnICsgdGhpcy50eXBlICsgJyBvbiB0aGUgd2luZG93LmRvY3VtZW50IG9iamVjdCEnKVxuICAgIH1cblxuICAgIHZhciB0cmlnZ2VycyA9IHRoaXMub3B0aW9ucy50cmlnZ2VyLnNwbGl0KCcgJylcblxuICAgIGZvciAodmFyIGkgPSB0cmlnZ2Vycy5sZW5ndGg7IGktLTspIHtcbiAgICAgIHZhciB0cmlnZ2VyID0gdHJpZ2dlcnNbaV1cblxuICAgICAgaWYgKHRyaWdnZXIgPT0gJ2NsaWNrJykge1xuICAgICAgICB0aGlzLiRlbGVtZW50Lm9uKCdjbGljay4nICsgdGhpcy50eXBlLCB0aGlzLm9wdGlvbnMuc2VsZWN0b3IsICQucHJveHkodGhpcy50b2dnbGUsIHRoaXMpKVxuICAgICAgfSBlbHNlIGlmICh0cmlnZ2VyICE9ICdtYW51YWwnKSB7XG4gICAgICAgIHZhciBldmVudEluICA9IHRyaWdnZXIgPT0gJ2hvdmVyJyA/ICdtb3VzZWVudGVyJyA6ICdmb2N1c2luJ1xuICAgICAgICB2YXIgZXZlbnRPdXQgPSB0cmlnZ2VyID09ICdob3ZlcicgPyAnbW91c2VsZWF2ZScgOiAnZm9jdXNvdXQnXG5cbiAgICAgICAgdGhpcy4kZWxlbWVudC5vbihldmVudEluICArICcuJyArIHRoaXMudHlwZSwgdGhpcy5vcHRpb25zLnNlbGVjdG9yLCAkLnByb3h5KHRoaXMuZW50ZXIsIHRoaXMpKVxuICAgICAgICB0aGlzLiRlbGVtZW50Lm9uKGV2ZW50T3V0ICsgJy4nICsgdGhpcy50eXBlLCB0aGlzLm9wdGlvbnMuc2VsZWN0b3IsICQucHJveHkodGhpcy5sZWF2ZSwgdGhpcykpXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5vcHRpb25zLnNlbGVjdG9yID9cbiAgICAgICh0aGlzLl9vcHRpb25zID0gJC5leHRlbmQoe30sIHRoaXMub3B0aW9ucywgeyB0cmlnZ2VyOiAnbWFudWFsJywgc2VsZWN0b3I6ICcnIH0pKSA6XG4gICAgICB0aGlzLmZpeFRpdGxlKClcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldERlZmF1bHRzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBUb29sdGlwLkRFRkFVTFRTXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5nZXRPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gJC5leHRlbmQoe30sIHRoaXMuZ2V0RGVmYXVsdHMoKSwgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpXG5cbiAgICBpZiAob3B0aW9ucy5kZWxheSAmJiB0eXBlb2Ygb3B0aW9ucy5kZWxheSA9PSAnbnVtYmVyJykge1xuICAgICAgb3B0aW9ucy5kZWxheSA9IHtcbiAgICAgICAgc2hvdzogb3B0aW9ucy5kZWxheSxcbiAgICAgICAgaGlkZTogb3B0aW9ucy5kZWxheVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvcHRpb25zXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5nZXREZWxlZ2F0ZU9wdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG9wdGlvbnMgID0ge31cbiAgICB2YXIgZGVmYXVsdHMgPSB0aGlzLmdldERlZmF1bHRzKClcblxuICAgIHRoaXMuX29wdGlvbnMgJiYgJC5lYWNoKHRoaXMuX29wdGlvbnMsIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICBpZiAoZGVmYXVsdHNba2V5XSAhPSB2YWx1ZSkgb3B0aW9uc1trZXldID0gdmFsdWVcbiAgICB9KVxuXG4gICAgcmV0dXJuIG9wdGlvbnNcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmVudGVyID0gZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciBzZWxmID0gb2JqIGluc3RhbmNlb2YgdGhpcy5jb25zdHJ1Y3RvciA/XG4gICAgICBvYmogOiAkKG9iai5jdXJyZW50VGFyZ2V0KS5kYXRhKCdicy4nICsgdGhpcy50eXBlKVxuXG4gICAgaWYgKCFzZWxmKSB7XG4gICAgICBzZWxmID0gbmV3IHRoaXMuY29uc3RydWN0b3Iob2JqLmN1cnJlbnRUYXJnZXQsIHRoaXMuZ2V0RGVsZWdhdGVPcHRpb25zKCkpXG4gICAgICAkKG9iai5jdXJyZW50VGFyZ2V0KS5kYXRhKCdicy4nICsgdGhpcy50eXBlLCBzZWxmKVxuICAgIH1cblxuICAgIGlmIChvYmogaW5zdGFuY2VvZiAkLkV2ZW50KSB7XG4gICAgICBzZWxmLmluU3RhdGVbb2JqLnR5cGUgPT0gJ2ZvY3VzaW4nID8gJ2ZvY3VzJyA6ICdob3ZlciddID0gdHJ1ZVxuICAgIH1cblxuICAgIGlmIChzZWxmLnRpcCgpLmhhc0NsYXNzKCdpbicpIHx8IHNlbGYuaG92ZXJTdGF0ZSA9PSAnaW4nKSB7XG4gICAgICBzZWxmLmhvdmVyU3RhdGUgPSAnaW4nXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjbGVhclRpbWVvdXQoc2VsZi50aW1lb3V0KVxuXG4gICAgc2VsZi5ob3ZlclN0YXRlID0gJ2luJ1xuXG4gICAgaWYgKCFzZWxmLm9wdGlvbnMuZGVsYXkgfHwgIXNlbGYub3B0aW9ucy5kZWxheS5zaG93KSByZXR1cm4gc2VsZi5zaG93KClcblxuICAgIHNlbGYudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHNlbGYuaG92ZXJTdGF0ZSA9PSAnaW4nKSBzZWxmLnNob3coKVxuICAgIH0sIHNlbGYub3B0aW9ucy5kZWxheS5zaG93KVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuaXNJblN0YXRlVHJ1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5pblN0YXRlKSB7XG4gICAgICBpZiAodGhpcy5pblN0YXRlW2tleV0pIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5sZWF2ZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgc2VsZiA9IG9iaiBpbnN0YW5jZW9mIHRoaXMuY29uc3RydWN0b3IgP1xuICAgICAgb2JqIDogJChvYmouY3VycmVudFRhcmdldCkuZGF0YSgnYnMuJyArIHRoaXMudHlwZSlcblxuICAgIGlmICghc2VsZikge1xuICAgICAgc2VsZiA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKG9iai5jdXJyZW50VGFyZ2V0LCB0aGlzLmdldERlbGVnYXRlT3B0aW9ucygpKVxuICAgICAgJChvYmouY3VycmVudFRhcmdldCkuZGF0YSgnYnMuJyArIHRoaXMudHlwZSwgc2VsZilcbiAgICB9XG5cbiAgICBpZiAob2JqIGluc3RhbmNlb2YgJC5FdmVudCkge1xuICAgICAgc2VsZi5pblN0YXRlW29iai50eXBlID09ICdmb2N1c291dCcgPyAnZm9jdXMnIDogJ2hvdmVyJ10gPSBmYWxzZVxuICAgIH1cblxuICAgIGlmIChzZWxmLmlzSW5TdGF0ZVRydWUoKSkgcmV0dXJuXG5cbiAgICBjbGVhclRpbWVvdXQoc2VsZi50aW1lb3V0KVxuXG4gICAgc2VsZi5ob3ZlclN0YXRlID0gJ291dCdcblxuICAgIGlmICghc2VsZi5vcHRpb25zLmRlbGF5IHx8ICFzZWxmLm9wdGlvbnMuZGVsYXkuaGlkZSkgcmV0dXJuIHNlbGYuaGlkZSgpXG5cbiAgICBzZWxmLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChzZWxmLmhvdmVyU3RhdGUgPT0gJ291dCcpIHNlbGYuaGlkZSgpXG4gICAgfSwgc2VsZi5vcHRpb25zLmRlbGF5LmhpZGUpXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBlID0gJC5FdmVudCgnc2hvdy5icy4nICsgdGhpcy50eXBlKVxuXG4gICAgaWYgKHRoaXMuaGFzQ29udGVudCgpICYmIHRoaXMuZW5hYmxlZCkge1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKGUpXG5cbiAgICAgIHZhciBpbkRvbSA9ICQuY29udGFpbnModGhpcy4kZWxlbWVudFswXS5vd25lckRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgdGhpcy4kZWxlbWVudFswXSlcbiAgICAgIGlmIChlLmlzRGVmYXVsdFByZXZlbnRlZCgpIHx8ICFpbkRvbSkgcmV0dXJuXG4gICAgICB2YXIgdGhhdCA9IHRoaXNcblxuICAgICAgdmFyICR0aXAgPSB0aGlzLnRpcCgpXG5cbiAgICAgIHZhciB0aXBJZCA9IHRoaXMuZ2V0VUlEKHRoaXMudHlwZSlcblxuICAgICAgdGhpcy5zZXRDb250ZW50KClcbiAgICAgICR0aXAuYXR0cignaWQnLCB0aXBJZClcbiAgICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1kZXNjcmliZWRieScsIHRpcElkKVxuXG4gICAgICBpZiAodGhpcy5vcHRpb25zLmFuaW1hdGlvbikgJHRpcC5hZGRDbGFzcygnZmFkZScpXG5cbiAgICAgIHZhciBwbGFjZW1lbnQgPSB0eXBlb2YgdGhpcy5vcHRpb25zLnBsYWNlbWVudCA9PSAnZnVuY3Rpb24nID9cbiAgICAgICAgdGhpcy5vcHRpb25zLnBsYWNlbWVudC5jYWxsKHRoaXMsICR0aXBbMF0sIHRoaXMuJGVsZW1lbnRbMF0pIDpcbiAgICAgICAgdGhpcy5vcHRpb25zLnBsYWNlbWVudFxuXG4gICAgICB2YXIgYXV0b1Rva2VuID0gL1xccz9hdXRvP1xccz8vaVxuICAgICAgdmFyIGF1dG9QbGFjZSA9IGF1dG9Ub2tlbi50ZXN0KHBsYWNlbWVudClcbiAgICAgIGlmIChhdXRvUGxhY2UpIHBsYWNlbWVudCA9IHBsYWNlbWVudC5yZXBsYWNlKGF1dG9Ub2tlbiwgJycpIHx8ICd0b3AnXG5cbiAgICAgICR0aXBcbiAgICAgICAgLmRldGFjaCgpXG4gICAgICAgIC5jc3MoeyB0b3A6IDAsIGxlZnQ6IDAsIGRpc3BsYXk6ICdibG9jaycgfSlcbiAgICAgICAgLmFkZENsYXNzKHBsYWNlbWVudClcbiAgICAgICAgLmRhdGEoJ2JzLicgKyB0aGlzLnR5cGUsIHRoaXMpXG5cbiAgICAgIHRoaXMub3B0aW9ucy5jb250YWluZXIgPyAkdGlwLmFwcGVuZFRvKHRoaXMub3B0aW9ucy5jb250YWluZXIpIDogJHRpcC5pbnNlcnRBZnRlcih0aGlzLiRlbGVtZW50KVxuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdpbnNlcnRlZC5icy4nICsgdGhpcy50eXBlKVxuXG4gICAgICB2YXIgcG9zICAgICAgICAgID0gdGhpcy5nZXRQb3NpdGlvbigpXG4gICAgICB2YXIgYWN0dWFsV2lkdGggID0gJHRpcFswXS5vZmZzZXRXaWR0aFxuICAgICAgdmFyIGFjdHVhbEhlaWdodCA9ICR0aXBbMF0ub2Zmc2V0SGVpZ2h0XG5cbiAgICAgIGlmIChhdXRvUGxhY2UpIHtcbiAgICAgICAgdmFyIG9yZ1BsYWNlbWVudCA9IHBsYWNlbWVudFxuICAgICAgICB2YXIgdmlld3BvcnREaW0gPSB0aGlzLmdldFBvc2l0aW9uKHRoaXMuJHZpZXdwb3J0KVxuXG4gICAgICAgIHBsYWNlbWVudCA9IHBsYWNlbWVudCA9PSAnYm90dG9tJyAmJiBwb3MuYm90dG9tICsgYWN0dWFsSGVpZ2h0ID4gdmlld3BvcnREaW0uYm90dG9tID8gJ3RvcCcgICAgOlxuICAgICAgICAgICAgICAgICAgICBwbGFjZW1lbnQgPT0gJ3RvcCcgICAgJiYgcG9zLnRvcCAgICAtIGFjdHVhbEhlaWdodCA8IHZpZXdwb3J0RGltLnRvcCAgICA/ICdib3R0b20nIDpcbiAgICAgICAgICAgICAgICAgICAgcGxhY2VtZW50ID09ICdyaWdodCcgICYmIHBvcy5yaWdodCAgKyBhY3R1YWxXaWR0aCAgPiB2aWV3cG9ydERpbS53aWR0aCAgPyAnbGVmdCcgICA6XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlbWVudCA9PSAnbGVmdCcgICAmJiBwb3MubGVmdCAgIC0gYWN0dWFsV2lkdGggIDwgdmlld3BvcnREaW0ubGVmdCAgID8gJ3JpZ2h0JyAgOlxuICAgICAgICAgICAgICAgICAgICBwbGFjZW1lbnRcblxuICAgICAgICAkdGlwXG4gICAgICAgICAgLnJlbW92ZUNsYXNzKG9yZ1BsYWNlbWVudClcbiAgICAgICAgICAuYWRkQ2xhc3MocGxhY2VtZW50KVxuICAgICAgfVxuXG4gICAgICB2YXIgY2FsY3VsYXRlZE9mZnNldCA9IHRoaXMuZ2V0Q2FsY3VsYXRlZE9mZnNldChwbGFjZW1lbnQsIHBvcywgYWN0dWFsV2lkdGgsIGFjdHVhbEhlaWdodClcblxuICAgICAgdGhpcy5hcHBseVBsYWNlbWVudChjYWxjdWxhdGVkT2Zmc2V0LCBwbGFjZW1lbnQpXG5cbiAgICAgIHZhciBjb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHByZXZIb3ZlclN0YXRlID0gdGhhdC5ob3ZlclN0YXRlXG4gICAgICAgIHRoYXQuJGVsZW1lbnQudHJpZ2dlcignc2hvd24uYnMuJyArIHRoYXQudHlwZSlcbiAgICAgICAgdGhhdC5ob3ZlclN0YXRlID0gbnVsbFxuXG4gICAgICAgIGlmIChwcmV2SG92ZXJTdGF0ZSA9PSAnb3V0JykgdGhhdC5sZWF2ZSh0aGF0KVxuICAgICAgfVxuXG4gICAgICAkLnN1cHBvcnQudHJhbnNpdGlvbiAmJiB0aGlzLiR0aXAuaGFzQ2xhc3MoJ2ZhZGUnKSA/XG4gICAgICAgICR0aXBcbiAgICAgICAgICAub25lKCdic1RyYW5zaXRpb25FbmQnLCBjb21wbGV0ZSlcbiAgICAgICAgICAuZW11bGF0ZVRyYW5zaXRpb25FbmQoVG9vbHRpcC5UUkFOU0lUSU9OX0RVUkFUSU9OKSA6XG4gICAgICAgIGNvbXBsZXRlKClcbiAgICB9XG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5hcHBseVBsYWNlbWVudCA9IGZ1bmN0aW9uIChvZmZzZXQsIHBsYWNlbWVudCkge1xuICAgIHZhciAkdGlwICAgPSB0aGlzLnRpcCgpXG4gICAgdmFyIHdpZHRoICA9ICR0aXBbMF0ub2Zmc2V0V2lkdGhcbiAgICB2YXIgaGVpZ2h0ID0gJHRpcFswXS5vZmZzZXRIZWlnaHRcblxuICAgIC8vIG1hbnVhbGx5IHJlYWQgbWFyZ2lucyBiZWNhdXNlIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBpbmNsdWRlcyBkaWZmZXJlbmNlXG4gICAgdmFyIG1hcmdpblRvcCA9IHBhcnNlSW50KCR0aXAuY3NzKCdtYXJnaW4tdG9wJyksIDEwKVxuICAgIHZhciBtYXJnaW5MZWZ0ID0gcGFyc2VJbnQoJHRpcC5jc3MoJ21hcmdpbi1sZWZ0JyksIDEwKVxuXG4gICAgLy8gd2UgbXVzdCBjaGVjayBmb3IgTmFOIGZvciBpZSA4LzlcbiAgICBpZiAoaXNOYU4obWFyZ2luVG9wKSkgIG1hcmdpblRvcCAgPSAwXG4gICAgaWYgKGlzTmFOKG1hcmdpbkxlZnQpKSBtYXJnaW5MZWZ0ID0gMFxuXG4gICAgb2Zmc2V0LnRvcCAgKz0gbWFyZ2luVG9wXG4gICAgb2Zmc2V0LmxlZnQgKz0gbWFyZ2luTGVmdFxuXG4gICAgLy8gJC5mbi5vZmZzZXQgZG9lc24ndCByb3VuZCBwaXhlbCB2YWx1ZXNcbiAgICAvLyBzbyB3ZSB1c2Ugc2V0T2Zmc2V0IGRpcmVjdGx5IHdpdGggb3VyIG93biBmdW5jdGlvbiBCLTBcbiAgICAkLm9mZnNldC5zZXRPZmZzZXQoJHRpcFswXSwgJC5leHRlbmQoe1xuICAgICAgdXNpbmc6IGZ1bmN0aW9uIChwcm9wcykge1xuICAgICAgICAkdGlwLmNzcyh7XG4gICAgICAgICAgdG9wOiBNYXRoLnJvdW5kKHByb3BzLnRvcCksXG4gICAgICAgICAgbGVmdDogTWF0aC5yb3VuZChwcm9wcy5sZWZ0KVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0sIG9mZnNldCksIDApXG5cbiAgICAkdGlwLmFkZENsYXNzKCdpbicpXG5cbiAgICAvLyBjaGVjayB0byBzZWUgaWYgcGxhY2luZyB0aXAgaW4gbmV3IG9mZnNldCBjYXVzZWQgdGhlIHRpcCB0byByZXNpemUgaXRzZWxmXG4gICAgdmFyIGFjdHVhbFdpZHRoICA9ICR0aXBbMF0ub2Zmc2V0V2lkdGhcbiAgICB2YXIgYWN0dWFsSGVpZ2h0ID0gJHRpcFswXS5vZmZzZXRIZWlnaHRcblxuICAgIGlmIChwbGFjZW1lbnQgPT0gJ3RvcCcgJiYgYWN0dWFsSGVpZ2h0ICE9IGhlaWdodCkge1xuICAgICAgb2Zmc2V0LnRvcCA9IG9mZnNldC50b3AgKyBoZWlnaHQgLSBhY3R1YWxIZWlnaHRcbiAgICB9XG5cbiAgICB2YXIgZGVsdGEgPSB0aGlzLmdldFZpZXdwb3J0QWRqdXN0ZWREZWx0YShwbGFjZW1lbnQsIG9mZnNldCwgYWN0dWFsV2lkdGgsIGFjdHVhbEhlaWdodClcblxuICAgIGlmIChkZWx0YS5sZWZ0KSBvZmZzZXQubGVmdCArPSBkZWx0YS5sZWZ0XG4gICAgZWxzZSBvZmZzZXQudG9wICs9IGRlbHRhLnRvcFxuXG4gICAgdmFyIGlzVmVydGljYWwgICAgICAgICAgPSAvdG9wfGJvdHRvbS8udGVzdChwbGFjZW1lbnQpXG4gICAgdmFyIGFycm93RGVsdGEgICAgICAgICAgPSBpc1ZlcnRpY2FsID8gZGVsdGEubGVmdCAqIDIgLSB3aWR0aCArIGFjdHVhbFdpZHRoIDogZGVsdGEudG9wICogMiAtIGhlaWdodCArIGFjdHVhbEhlaWdodFxuICAgIHZhciBhcnJvd09mZnNldFBvc2l0aW9uID0gaXNWZXJ0aWNhbCA/ICdvZmZzZXRXaWR0aCcgOiAnb2Zmc2V0SGVpZ2h0J1xuXG4gICAgJHRpcC5vZmZzZXQob2Zmc2V0KVxuICAgIHRoaXMucmVwbGFjZUFycm93KGFycm93RGVsdGEsICR0aXBbMF1bYXJyb3dPZmZzZXRQb3NpdGlvbl0sIGlzVmVydGljYWwpXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5yZXBsYWNlQXJyb3cgPSBmdW5jdGlvbiAoZGVsdGEsIGRpbWVuc2lvbiwgaXNWZXJ0aWNhbCkge1xuICAgIHRoaXMuYXJyb3coKVxuICAgICAgLmNzcyhpc1ZlcnRpY2FsID8gJ2xlZnQnIDogJ3RvcCcsIDUwICogKDEgLSBkZWx0YSAvIGRpbWVuc2lvbikgKyAnJScpXG4gICAgICAuY3NzKGlzVmVydGljYWwgPyAndG9wJyA6ICdsZWZ0JywgJycpXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5zZXRDb250ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciAkdGlwICA9IHRoaXMudGlwKClcbiAgICB2YXIgdGl0bGUgPSB0aGlzLmdldFRpdGxlKClcblxuICAgICR0aXAuZmluZCgnLnRvb2x0aXAtaW5uZXInKVt0aGlzLm9wdGlvbnMuaHRtbCA/ICdodG1sJyA6ICd0ZXh0J10odGl0bGUpXG4gICAgJHRpcC5yZW1vdmVDbGFzcygnZmFkZSBpbiB0b3AgYm90dG9tIGxlZnQgcmlnaHQnKVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgIHZhciAkdGlwID0gJCh0aGlzLiR0aXApXG4gICAgdmFyIGUgICAgPSAkLkV2ZW50KCdoaWRlLmJzLicgKyB0aGlzLnR5cGUpXG5cbiAgICBmdW5jdGlvbiBjb21wbGV0ZSgpIHtcbiAgICAgIGlmICh0aGF0LmhvdmVyU3RhdGUgIT0gJ2luJykgJHRpcC5kZXRhY2goKVxuICAgICAgaWYgKHRoYXQuJGVsZW1lbnQpIHsgLy8gVE9ETzogQ2hlY2sgd2hldGhlciBndWFyZGluZyB0aGlzIGNvZGUgd2l0aCB0aGlzIGBpZmAgaXMgcmVhbGx5IG5lY2Vzc2FyeS5cbiAgICAgICAgdGhhdC4kZWxlbWVudFxuICAgICAgICAgIC5yZW1vdmVBdHRyKCdhcmlhLWRlc2NyaWJlZGJ5JylcbiAgICAgICAgICAudHJpZ2dlcignaGlkZGVuLmJzLicgKyB0aGF0LnR5cGUpXG4gICAgICB9XG4gICAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygpXG4gICAgfVxuXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKGUpXG5cbiAgICBpZiAoZS5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgcmV0dXJuXG5cbiAgICAkdGlwLnJlbW92ZUNsYXNzKCdpbicpXG5cbiAgICAkLnN1cHBvcnQudHJhbnNpdGlvbiAmJiAkdGlwLmhhc0NsYXNzKCdmYWRlJykgP1xuICAgICAgJHRpcFxuICAgICAgICAub25lKCdic1RyYW5zaXRpb25FbmQnLCBjb21wbGV0ZSlcbiAgICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKFRvb2x0aXAuVFJBTlNJVElPTl9EVVJBVElPTikgOlxuICAgICAgY29tcGxldGUoKVxuXG4gICAgdGhpcy5ob3ZlclN0YXRlID0gbnVsbFxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmZpeFRpdGxlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciAkZSA9IHRoaXMuJGVsZW1lbnRcbiAgICBpZiAoJGUuYXR0cigndGl0bGUnKSB8fCB0eXBlb2YgJGUuYXR0cignZGF0YS1vcmlnaW5hbC10aXRsZScpICE9ICdzdHJpbmcnKSB7XG4gICAgICAkZS5hdHRyKCdkYXRhLW9yaWdpbmFsLXRpdGxlJywgJGUuYXR0cigndGl0bGUnKSB8fCAnJykuYXR0cigndGl0bGUnLCAnJylcbiAgICB9XG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5oYXNDb250ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmdldFRpdGxlKClcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldFBvc2l0aW9uID0gZnVuY3Rpb24gKCRlbGVtZW50KSB7XG4gICAgJGVsZW1lbnQgICA9ICRlbGVtZW50IHx8IHRoaXMuJGVsZW1lbnRcblxuICAgIHZhciBlbCAgICAgPSAkZWxlbWVudFswXVxuICAgIHZhciBpc0JvZHkgPSBlbC50YWdOYW1lID09ICdCT0RZJ1xuXG4gICAgdmFyIGVsUmVjdCAgICA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgaWYgKGVsUmVjdC53aWR0aCA9PSBudWxsKSB7XG4gICAgICAvLyB3aWR0aCBhbmQgaGVpZ2h0IGFyZSBtaXNzaW5nIGluIElFOCwgc28gY29tcHV0ZSB0aGVtIG1hbnVhbGx5OyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2lzc3Vlcy8xNDA5M1xuICAgICAgZWxSZWN0ID0gJC5leHRlbmQoe30sIGVsUmVjdCwgeyB3aWR0aDogZWxSZWN0LnJpZ2h0IC0gZWxSZWN0LmxlZnQsIGhlaWdodDogZWxSZWN0LmJvdHRvbSAtIGVsUmVjdC50b3AgfSlcbiAgICB9XG4gICAgdmFyIGlzU3ZnID0gd2luZG93LlNWR0VsZW1lbnQgJiYgZWwgaW5zdGFuY2VvZiB3aW5kb3cuU1ZHRWxlbWVudFxuICAgIC8vIEF2b2lkIHVzaW5nICQub2Zmc2V0KCkgb24gU1ZHcyBzaW5jZSBpdCBnaXZlcyBpbmNvcnJlY3QgcmVzdWx0cyBpbiBqUXVlcnkgMy5cbiAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2lzc3Vlcy8yMDI4MFxuICAgIHZhciBlbE9mZnNldCAgPSBpc0JvZHkgPyB7IHRvcDogMCwgbGVmdDogMCB9IDogKGlzU3ZnID8gbnVsbCA6ICRlbGVtZW50Lm9mZnNldCgpKVxuICAgIHZhciBzY3JvbGwgICAgPSB7IHNjcm9sbDogaXNCb2R5ID8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCB8fCBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCA6ICRlbGVtZW50LnNjcm9sbFRvcCgpIH1cbiAgICB2YXIgb3V0ZXJEaW1zID0gaXNCb2R5ID8geyB3aWR0aDogJCh3aW5kb3cpLndpZHRoKCksIGhlaWdodDogJCh3aW5kb3cpLmhlaWdodCgpIH0gOiBudWxsXG5cbiAgICByZXR1cm4gJC5leHRlbmQoe30sIGVsUmVjdCwgc2Nyb2xsLCBvdXRlckRpbXMsIGVsT2Zmc2V0KVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZ2V0Q2FsY3VsYXRlZE9mZnNldCA9IGZ1bmN0aW9uIChwbGFjZW1lbnQsIHBvcywgYWN0dWFsV2lkdGgsIGFjdHVhbEhlaWdodCkge1xuICAgIHJldHVybiBwbGFjZW1lbnQgPT0gJ2JvdHRvbScgPyB7IHRvcDogcG9zLnRvcCArIHBvcy5oZWlnaHQsICAgbGVmdDogcG9zLmxlZnQgKyBwb3Mud2lkdGggLyAyIC0gYWN0dWFsV2lkdGggLyAyIH0gOlxuICAgICAgICAgICBwbGFjZW1lbnQgPT0gJ3RvcCcgICAgPyB7IHRvcDogcG9zLnRvcCAtIGFjdHVhbEhlaWdodCwgbGVmdDogcG9zLmxlZnQgKyBwb3Mud2lkdGggLyAyIC0gYWN0dWFsV2lkdGggLyAyIH0gOlxuICAgICAgICAgICBwbGFjZW1lbnQgPT0gJ2xlZnQnICAgPyB7IHRvcDogcG9zLnRvcCArIHBvcy5oZWlnaHQgLyAyIC0gYWN0dWFsSGVpZ2h0IC8gMiwgbGVmdDogcG9zLmxlZnQgLSBhY3R1YWxXaWR0aCB9IDpcbiAgICAgICAgLyogcGxhY2VtZW50ID09ICdyaWdodCcgKi8geyB0b3A6IHBvcy50b3AgKyBwb3MuaGVpZ2h0IC8gMiAtIGFjdHVhbEhlaWdodCAvIDIsIGxlZnQ6IHBvcy5sZWZ0ICsgcG9zLndpZHRoIH1cblxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZ2V0Vmlld3BvcnRBZGp1c3RlZERlbHRhID0gZnVuY3Rpb24gKHBsYWNlbWVudCwgcG9zLCBhY3R1YWxXaWR0aCwgYWN0dWFsSGVpZ2h0KSB7XG4gICAgdmFyIGRlbHRhID0geyB0b3A6IDAsIGxlZnQ6IDAgfVxuICAgIGlmICghdGhpcy4kdmlld3BvcnQpIHJldHVybiBkZWx0YVxuXG4gICAgdmFyIHZpZXdwb3J0UGFkZGluZyA9IHRoaXMub3B0aW9ucy52aWV3cG9ydCAmJiB0aGlzLm9wdGlvbnMudmlld3BvcnQucGFkZGluZyB8fCAwXG4gICAgdmFyIHZpZXdwb3J0RGltZW5zaW9ucyA9IHRoaXMuZ2V0UG9zaXRpb24odGhpcy4kdmlld3BvcnQpXG5cbiAgICBpZiAoL3JpZ2h0fGxlZnQvLnRlc3QocGxhY2VtZW50KSkge1xuICAgICAgdmFyIHRvcEVkZ2VPZmZzZXQgICAgPSBwb3MudG9wIC0gdmlld3BvcnRQYWRkaW5nIC0gdmlld3BvcnREaW1lbnNpb25zLnNjcm9sbFxuICAgICAgdmFyIGJvdHRvbUVkZ2VPZmZzZXQgPSBwb3MudG9wICsgdmlld3BvcnRQYWRkaW5nIC0gdmlld3BvcnREaW1lbnNpb25zLnNjcm9sbCArIGFjdHVhbEhlaWdodFxuICAgICAgaWYgKHRvcEVkZ2VPZmZzZXQgPCB2aWV3cG9ydERpbWVuc2lvbnMudG9wKSB7IC8vIHRvcCBvdmVyZmxvd1xuICAgICAgICBkZWx0YS50b3AgPSB2aWV3cG9ydERpbWVuc2lvbnMudG9wIC0gdG9wRWRnZU9mZnNldFxuICAgICAgfSBlbHNlIGlmIChib3R0b21FZGdlT2Zmc2V0ID4gdmlld3BvcnREaW1lbnNpb25zLnRvcCArIHZpZXdwb3J0RGltZW5zaW9ucy5oZWlnaHQpIHsgLy8gYm90dG9tIG92ZXJmbG93XG4gICAgICAgIGRlbHRhLnRvcCA9IHZpZXdwb3J0RGltZW5zaW9ucy50b3AgKyB2aWV3cG9ydERpbWVuc2lvbnMuaGVpZ2h0IC0gYm90dG9tRWRnZU9mZnNldFxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbGVmdEVkZ2VPZmZzZXQgID0gcG9zLmxlZnQgLSB2aWV3cG9ydFBhZGRpbmdcbiAgICAgIHZhciByaWdodEVkZ2VPZmZzZXQgPSBwb3MubGVmdCArIHZpZXdwb3J0UGFkZGluZyArIGFjdHVhbFdpZHRoXG4gICAgICBpZiAobGVmdEVkZ2VPZmZzZXQgPCB2aWV3cG9ydERpbWVuc2lvbnMubGVmdCkgeyAvLyBsZWZ0IG92ZXJmbG93XG4gICAgICAgIGRlbHRhLmxlZnQgPSB2aWV3cG9ydERpbWVuc2lvbnMubGVmdCAtIGxlZnRFZGdlT2Zmc2V0XG4gICAgICB9IGVsc2UgaWYgKHJpZ2h0RWRnZU9mZnNldCA+IHZpZXdwb3J0RGltZW5zaW9ucy5yaWdodCkgeyAvLyByaWdodCBvdmVyZmxvd1xuICAgICAgICBkZWx0YS5sZWZ0ID0gdmlld3BvcnREaW1lbnNpb25zLmxlZnQgKyB2aWV3cG9ydERpbWVuc2lvbnMud2lkdGggLSByaWdodEVkZ2VPZmZzZXRcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGVsdGFcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldFRpdGxlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0aXRsZVxuICAgIHZhciAkZSA9IHRoaXMuJGVsZW1lbnRcbiAgICB2YXIgbyAgPSB0aGlzLm9wdGlvbnNcblxuICAgIHRpdGxlID0gJGUuYXR0cignZGF0YS1vcmlnaW5hbC10aXRsZScpXG4gICAgICB8fCAodHlwZW9mIG8udGl0bGUgPT0gJ2Z1bmN0aW9uJyA/IG8udGl0bGUuY2FsbCgkZVswXSkgOiAgby50aXRsZSlcblxuICAgIHJldHVybiB0aXRsZVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZ2V0VUlEID0gZnVuY3Rpb24gKHByZWZpeCkge1xuICAgIGRvIHByZWZpeCArPSB+fihNYXRoLnJhbmRvbSgpICogMTAwMDAwMClcbiAgICB3aGlsZSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocHJlZml4KSlcbiAgICByZXR1cm4gcHJlZml4XG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS50aXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLiR0aXApIHtcbiAgICAgIHRoaXMuJHRpcCA9ICQodGhpcy5vcHRpb25zLnRlbXBsYXRlKVxuICAgICAgaWYgKHRoaXMuJHRpcC5sZW5ndGggIT0gMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IodGhpcy50eXBlICsgJyBgdGVtcGxhdGVgIG9wdGlvbiBtdXN0IGNvbnNpc3Qgb2YgZXhhY3RseSAxIHRvcC1sZXZlbCBlbGVtZW50IScpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLiR0aXBcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmFycm93ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy4kYXJyb3cgPSB0aGlzLiRhcnJvdyB8fCB0aGlzLnRpcCgpLmZpbmQoJy50b29sdGlwLWFycm93JykpXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5lbmFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5lbmFibGVkID0gdHJ1ZVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZGlzYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUudG9nZ2xlRW5hYmxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmVuYWJsZWQgPSAhdGhpcy5lbmFibGVkXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbiAoZSkge1xuICAgIHZhciBzZWxmID0gdGhpc1xuICAgIGlmIChlKSB7XG4gICAgICBzZWxmID0gJChlLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ2JzLicgKyB0aGlzLnR5cGUpXG4gICAgICBpZiAoIXNlbGYpIHtcbiAgICAgICAgc2VsZiA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKGUuY3VycmVudFRhcmdldCwgdGhpcy5nZXREZWxlZ2F0ZU9wdGlvbnMoKSlcbiAgICAgICAgJChlLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ2JzLicgKyB0aGlzLnR5cGUsIHNlbGYpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGUpIHtcbiAgICAgIHNlbGYuaW5TdGF0ZS5jbGljayA9ICFzZWxmLmluU3RhdGUuY2xpY2tcbiAgICAgIGlmIChzZWxmLmlzSW5TdGF0ZVRydWUoKSkgc2VsZi5lbnRlcihzZWxmKVxuICAgICAgZWxzZSBzZWxmLmxlYXZlKHNlbGYpXG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGYudGlwKCkuaGFzQ2xhc3MoJ2luJykgPyBzZWxmLmxlYXZlKHNlbGYpIDogc2VsZi5lbnRlcihzZWxmKVxuICAgIH1cbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dClcbiAgICB0aGlzLmhpZGUoZnVuY3Rpb24gKCkge1xuICAgICAgdGhhdC4kZWxlbWVudC5vZmYoJy4nICsgdGhhdC50eXBlKS5yZW1vdmVEYXRhKCdicy4nICsgdGhhdC50eXBlKVxuICAgICAgaWYgKHRoYXQuJHRpcCkge1xuICAgICAgICB0aGF0LiR0aXAuZGV0YWNoKClcbiAgICAgIH1cbiAgICAgIHRoYXQuJHRpcCA9IG51bGxcbiAgICAgIHRoYXQuJGFycm93ID0gbnVsbFxuICAgICAgdGhhdC4kdmlld3BvcnQgPSBudWxsXG4gICAgICB0aGF0LiRlbGVtZW50ID0gbnVsbFxuICAgIH0pXG4gIH1cblxuXG4gIC8vIFRPT0xUSVAgUExVR0lOIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgICAgPSAkdGhpcy5kYXRhKCdicy50b29sdGlwJylcbiAgICAgIHZhciBvcHRpb25zID0gdHlwZW9mIG9wdGlvbiA9PSAnb2JqZWN0JyAmJiBvcHRpb25cblxuICAgICAgaWYgKCFkYXRhICYmIC9kZXN0cm95fGhpZGUvLnRlc3Qob3B0aW9uKSkgcmV0dXJuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLnRvb2x0aXAnLCAoZGF0YSA9IG5ldyBUb29sdGlwKHRoaXMsIG9wdGlvbnMpKSlcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnKSBkYXRhW29wdGlvbl0oKVxuICAgIH0pXG4gIH1cblxuICB2YXIgb2xkID0gJC5mbi50b29sdGlwXG5cbiAgJC5mbi50b29sdGlwICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4udG9vbHRpcC5Db25zdHJ1Y3RvciA9IFRvb2x0aXBcblxuXG4gIC8vIFRPT0xUSVAgTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT09PVxuXG4gICQuZm4udG9vbHRpcC5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4udG9vbHRpcCA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxufShqUXVlcnkpO1xuIiwiLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IHBvcG92ZXIuanMgdjMuMy43XG4gKiBodHRwOi8vZ2V0Ym9vdHN0cmFwLmNvbS9qYXZhc2NyaXB0LyNwb3BvdmVyc1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE2IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIFBPUE9WRVIgUFVCTElDIENMQVNTIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIHZhciBQb3BvdmVyID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLmluaXQoJ3BvcG92ZXInLCBlbGVtZW50LCBvcHRpb25zKVxuICB9XG5cbiAgaWYgKCEkLmZuLnRvb2x0aXApIHRocm93IG5ldyBFcnJvcignUG9wb3ZlciByZXF1aXJlcyB0b29sdGlwLmpzJylcblxuICBQb3BvdmVyLlZFUlNJT04gID0gJzMuMy43J1xuXG4gIFBvcG92ZXIuREVGQVVMVFMgPSAkLmV4dGVuZCh7fSwgJC5mbi50b29sdGlwLkNvbnN0cnVjdG9yLkRFRkFVTFRTLCB7XG4gICAgcGxhY2VtZW50OiAncmlnaHQnLFxuICAgIHRyaWdnZXI6ICdjbGljaycsXG4gICAgY29udGVudDogJycsXG4gICAgdGVtcGxhdGU6ICc8ZGl2IGNsYXNzPVwicG9wb3ZlclwiIHJvbGU9XCJ0b29sdGlwXCI+PGRpdiBjbGFzcz1cImFycm93XCI+PC9kaXY+PGgzIGNsYXNzPVwicG9wb3Zlci10aXRsZVwiPjwvaDM+PGRpdiBjbGFzcz1cInBvcG92ZXItY29udGVudFwiPjwvZGl2PjwvZGl2PidcbiAgfSlcblxuXG4gIC8vIE5PVEU6IFBPUE9WRVIgRVhURU5EUyB0b29sdGlwLmpzXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgUG9wb3Zlci5wcm90b3R5cGUgPSAkLmV4dGVuZCh7fSwgJC5mbi50b29sdGlwLkNvbnN0cnVjdG9yLnByb3RvdHlwZSlcblxuICBQb3BvdmVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBvcG92ZXJcblxuICBQb3BvdmVyLnByb3RvdHlwZS5nZXREZWZhdWx0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gUG9wb3Zlci5ERUZBVUxUU1xuICB9XG5cbiAgUG9wb3Zlci5wcm90b3R5cGUuc2V0Q29udGVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJHRpcCAgICA9IHRoaXMudGlwKClcbiAgICB2YXIgdGl0bGUgICA9IHRoaXMuZ2V0VGl0bGUoKVxuICAgIHZhciBjb250ZW50ID0gdGhpcy5nZXRDb250ZW50KClcblxuICAgICR0aXAuZmluZCgnLnBvcG92ZXItdGl0bGUnKVt0aGlzLm9wdGlvbnMuaHRtbCA/ICdodG1sJyA6ICd0ZXh0J10odGl0bGUpXG4gICAgJHRpcC5maW5kKCcucG9wb3Zlci1jb250ZW50JykuY2hpbGRyZW4oKS5kZXRhY2goKS5lbmQoKVsgLy8gd2UgdXNlIGFwcGVuZCBmb3IgaHRtbCBvYmplY3RzIHRvIG1haW50YWluIGpzIGV2ZW50c1xuICAgICAgdGhpcy5vcHRpb25zLmh0bWwgPyAodHlwZW9mIGNvbnRlbnQgPT0gJ3N0cmluZycgPyAnaHRtbCcgOiAnYXBwZW5kJykgOiAndGV4dCdcbiAgICBdKGNvbnRlbnQpXG5cbiAgICAkdGlwLnJlbW92ZUNsYXNzKCdmYWRlIHRvcCBib3R0b20gbGVmdCByaWdodCBpbicpXG5cbiAgICAvLyBJRTggZG9lc24ndCBhY2NlcHQgaGlkaW5nIHZpYSB0aGUgYDplbXB0eWAgcHNldWRvIHNlbGVjdG9yLCB3ZSBoYXZlIHRvIGRvXG4gICAgLy8gdGhpcyBtYW51YWxseSBieSBjaGVja2luZyB0aGUgY29udGVudHMuXG4gICAgaWYgKCEkdGlwLmZpbmQoJy5wb3BvdmVyLXRpdGxlJykuaHRtbCgpKSAkdGlwLmZpbmQoJy5wb3BvdmVyLXRpdGxlJykuaGlkZSgpXG4gIH1cblxuICBQb3BvdmVyLnByb3RvdHlwZS5oYXNDb250ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmdldFRpdGxlKCkgfHwgdGhpcy5nZXRDb250ZW50KClcbiAgfVxuXG4gIFBvcG92ZXIucHJvdG90eXBlLmdldENvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICRlID0gdGhpcy4kZWxlbWVudFxuICAgIHZhciBvICA9IHRoaXMub3B0aW9uc1xuXG4gICAgcmV0dXJuICRlLmF0dHIoJ2RhdGEtY29udGVudCcpXG4gICAgICB8fCAodHlwZW9mIG8uY29udGVudCA9PSAnZnVuY3Rpb24nID9cbiAgICAgICAgICAgIG8uY29udGVudC5jYWxsKCRlWzBdKSA6XG4gICAgICAgICAgICBvLmNvbnRlbnQpXG4gIH1cblxuICBQb3BvdmVyLnByb3RvdHlwZS5hcnJvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuJGFycm93ID0gdGhpcy4kYXJyb3cgfHwgdGhpcy50aXAoKS5maW5kKCcuYXJyb3cnKSlcbiAgfVxuXG5cbiAgLy8gUE9QT1ZFUiBQTFVHSU4gREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbikge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzICAgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSAgICA9ICR0aGlzLmRhdGEoJ2JzLnBvcG92ZXInKVxuICAgICAgdmFyIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09ICdvYmplY3QnICYmIG9wdGlvblxuXG4gICAgICBpZiAoIWRhdGEgJiYgL2Rlc3Ryb3l8aGlkZS8udGVzdChvcHRpb24pKSByZXR1cm5cbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMucG9wb3ZlcicsIChkYXRhID0gbmV3IFBvcG92ZXIodGhpcywgb3B0aW9ucykpKVxuICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ3N0cmluZycpIGRhdGFbb3B0aW9uXSgpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLnBvcG92ZXJcblxuICAkLmZuLnBvcG92ZXIgICAgICAgICAgICAgPSBQbHVnaW5cbiAgJC5mbi5wb3BvdmVyLkNvbnN0cnVjdG9yID0gUG9wb3ZlclxuXG5cbiAgLy8gUE9QT1ZFUiBOTyBDT05GTElDVFxuICAvLyA9PT09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi5wb3BvdmVyLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi5wb3BvdmVyID0gb2xkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG59KGpRdWVyeSk7XG4iLCIvKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogbW9kYWwuanMgdjMuMy43XG4gKiBodHRwOi8vZ2V0Ym9vdHN0cmFwLmNvbS9qYXZhc2NyaXB0LyNtb2RhbHNcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxNiBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBNT0RBTCBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgTW9kYWwgPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyAgICAgICAgICAgICA9IG9wdGlvbnNcbiAgICB0aGlzLiRib2R5ICAgICAgICAgICAgICAgPSAkKGRvY3VtZW50LmJvZHkpXG4gICAgdGhpcy4kZWxlbWVudCAgICAgICAgICAgID0gJChlbGVtZW50KVxuICAgIHRoaXMuJGRpYWxvZyAgICAgICAgICAgICA9IHRoaXMuJGVsZW1lbnQuZmluZCgnLm1vZGFsLWRpYWxvZycpXG4gICAgdGhpcy4kYmFja2Ryb3AgICAgICAgICAgID0gbnVsbFxuICAgIHRoaXMuaXNTaG93biAgICAgICAgICAgICA9IG51bGxcbiAgICB0aGlzLm9yaWdpbmFsQm9keVBhZCAgICAgPSBudWxsXG4gICAgdGhpcy5zY3JvbGxiYXJXaWR0aCAgICAgID0gMFxuICAgIHRoaXMuaWdub3JlQmFja2Ryb3BDbGljayA9IGZhbHNlXG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnJlbW90ZSkge1xuICAgICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAuZmluZCgnLm1vZGFsLWNvbnRlbnQnKVxuICAgICAgICAubG9hZCh0aGlzLm9wdGlvbnMucmVtb3RlLCAkLnByb3h5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2xvYWRlZC5icy5tb2RhbCcpXG4gICAgICAgIH0sIHRoaXMpKVxuICAgIH1cbiAgfVxuXG4gIE1vZGFsLlZFUlNJT04gID0gJzMuMy43J1xuXG4gIE1vZGFsLlRSQU5TSVRJT05fRFVSQVRJT04gPSAzMDBcbiAgTW9kYWwuQkFDS0RST1BfVFJBTlNJVElPTl9EVVJBVElPTiA9IDE1MFxuXG4gIE1vZGFsLkRFRkFVTFRTID0ge1xuICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgIGtleWJvYXJkOiB0cnVlLFxuICAgIHNob3c6IHRydWVcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbiAoX3JlbGF0ZWRUYXJnZXQpIHtcbiAgICByZXR1cm4gdGhpcy5pc1Nob3duID8gdGhpcy5oaWRlKCkgOiB0aGlzLnNob3coX3JlbGF0ZWRUYXJnZXQpXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIChfcmVsYXRlZFRhcmdldCkge1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgIHZhciBlICAgID0gJC5FdmVudCgnc2hvdy5icy5tb2RhbCcsIHsgcmVsYXRlZFRhcmdldDogX3JlbGF0ZWRUYXJnZXQgfSlcblxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcihlKVxuXG4gICAgaWYgKHRoaXMuaXNTaG93biB8fCBlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgIHRoaXMuaXNTaG93biA9IHRydWVcblxuICAgIHRoaXMuY2hlY2tTY3JvbGxiYXIoKVxuICAgIHRoaXMuc2V0U2Nyb2xsYmFyKClcbiAgICB0aGlzLiRib2R5LmFkZENsYXNzKCdtb2RhbC1vcGVuJylcblxuICAgIHRoaXMuZXNjYXBlKClcbiAgICB0aGlzLnJlc2l6ZSgpXG5cbiAgICB0aGlzLiRlbGVtZW50Lm9uKCdjbGljay5kaXNtaXNzLmJzLm1vZGFsJywgJ1tkYXRhLWRpc21pc3M9XCJtb2RhbFwiXScsICQucHJveHkodGhpcy5oaWRlLCB0aGlzKSlcblxuICAgIHRoaXMuJGRpYWxvZy5vbignbW91c2Vkb3duLmRpc21pc3MuYnMubW9kYWwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGF0LiRlbGVtZW50Lm9uZSgnbW91c2V1cC5kaXNtaXNzLmJzLm1vZGFsJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKCQoZS50YXJnZXQpLmlzKHRoYXQuJGVsZW1lbnQpKSB0aGF0Lmlnbm9yZUJhY2tkcm9wQ2xpY2sgPSB0cnVlXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICB0aGlzLmJhY2tkcm9wKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciB0cmFuc2l0aW9uID0gJC5zdXBwb3J0LnRyYW5zaXRpb24gJiYgdGhhdC4kZWxlbWVudC5oYXNDbGFzcygnZmFkZScpXG5cbiAgICAgIGlmICghdGhhdC4kZWxlbWVudC5wYXJlbnQoKS5sZW5ndGgpIHtcbiAgICAgICAgdGhhdC4kZWxlbWVudC5hcHBlbmRUbyh0aGF0LiRib2R5KSAvLyBkb24ndCBtb3ZlIG1vZGFscyBkb20gcG9zaXRpb25cbiAgICAgIH1cblxuICAgICAgdGhhdC4kZWxlbWVudFxuICAgICAgICAuc2hvdygpXG4gICAgICAgIC5zY3JvbGxUb3AoMClcblxuICAgICAgdGhhdC5hZGp1c3REaWFsb2coKVxuXG4gICAgICBpZiAodHJhbnNpdGlvbikge1xuICAgICAgICB0aGF0LiRlbGVtZW50WzBdLm9mZnNldFdpZHRoIC8vIGZvcmNlIHJlZmxvd1xuICAgICAgfVxuXG4gICAgICB0aGF0LiRlbGVtZW50LmFkZENsYXNzKCdpbicpXG5cbiAgICAgIHRoYXQuZW5mb3JjZUZvY3VzKClcblxuICAgICAgdmFyIGUgPSAkLkV2ZW50KCdzaG93bi5icy5tb2RhbCcsIHsgcmVsYXRlZFRhcmdldDogX3JlbGF0ZWRUYXJnZXQgfSlcblxuICAgICAgdHJhbnNpdGlvbiA/XG4gICAgICAgIHRoYXQuJGRpYWxvZyAvLyB3YWl0IGZvciBtb2RhbCB0byBzbGlkZSBpblxuICAgICAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoYXQuJGVsZW1lbnQudHJpZ2dlcignZm9jdXMnKS50cmlnZ2VyKGUpXG4gICAgICAgICAgfSlcbiAgICAgICAgICAuZW11bGF0ZVRyYW5zaXRpb25FbmQoTW9kYWwuVFJBTlNJVElPTl9EVVJBVElPTikgOlxuICAgICAgICB0aGF0LiRlbGVtZW50LnRyaWdnZXIoJ2ZvY3VzJykudHJpZ2dlcihlKVxuICAgIH0pXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUpIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgZSA9ICQuRXZlbnQoJ2hpZGUuYnMubW9kYWwnKVxuXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKGUpXG5cbiAgICBpZiAoIXRoaXMuaXNTaG93biB8fCBlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgIHRoaXMuaXNTaG93biA9IGZhbHNlXG5cbiAgICB0aGlzLmVzY2FwZSgpXG4gICAgdGhpcy5yZXNpemUoKVxuXG4gICAgJChkb2N1bWVudCkub2ZmKCdmb2N1c2luLmJzLm1vZGFsJylcblxuICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5yZW1vdmVDbGFzcygnaW4nKVxuICAgICAgLm9mZignY2xpY2suZGlzbWlzcy5icy5tb2RhbCcpXG4gICAgICAub2ZmKCdtb3VzZXVwLmRpc21pc3MuYnMubW9kYWwnKVxuXG4gICAgdGhpcy4kZGlhbG9nLm9mZignbW91c2Vkb3duLmRpc21pc3MuYnMubW9kYWwnKVxuXG4gICAgJC5zdXBwb3J0LnRyYW5zaXRpb24gJiYgdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnZmFkZScpID9cbiAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgJC5wcm94eSh0aGlzLmhpZGVNb2RhbCwgdGhpcykpXG4gICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChNb2RhbC5UUkFOU0lUSU9OX0RVUkFUSU9OKSA6XG4gICAgICB0aGlzLmhpZGVNb2RhbCgpXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuZW5mb3JjZUZvY3VzID0gZnVuY3Rpb24gKCkge1xuICAgICQoZG9jdW1lbnQpXG4gICAgICAub2ZmKCdmb2N1c2luLmJzLm1vZGFsJykgLy8gZ3VhcmQgYWdhaW5zdCBpbmZpbml0ZSBmb2N1cyBsb29wXG4gICAgICAub24oJ2ZvY3VzaW4uYnMubW9kYWwnLCAkLnByb3h5KGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmIChkb2N1bWVudCAhPT0gZS50YXJnZXQgJiZcbiAgICAgICAgICAgIHRoaXMuJGVsZW1lbnRbMF0gIT09IGUudGFyZ2V0ICYmXG4gICAgICAgICAgICAhdGhpcy4kZWxlbWVudC5oYXMoZS50YXJnZXQpLmxlbmd0aCkge1xuICAgICAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignZm9jdXMnKVxuICAgICAgICB9XG4gICAgICB9LCB0aGlzKSlcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5lc2NhcGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuaXNTaG93biAmJiB0aGlzLm9wdGlvbnMua2V5Ym9hcmQpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQub24oJ2tleWRvd24uZGlzbWlzcy5icy5tb2RhbCcsICQucHJveHkoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZS53aGljaCA9PSAyNyAmJiB0aGlzLmhpZGUoKVxuICAgICAgfSwgdGhpcykpXG4gICAgfSBlbHNlIGlmICghdGhpcy5pc1Nob3duKSB7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9mZigna2V5ZG93bi5kaXNtaXNzLmJzLm1vZGFsJylcbiAgICB9XG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUucmVzaXplID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmlzU2hvd24pIHtcbiAgICAgICQod2luZG93KS5vbigncmVzaXplLmJzLm1vZGFsJywgJC5wcm94eSh0aGlzLmhhbmRsZVVwZGF0ZSwgdGhpcykpXG4gICAgfSBlbHNlIHtcbiAgICAgICQod2luZG93KS5vZmYoJ3Jlc2l6ZS5icy5tb2RhbCcpXG4gICAgfVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLmhpZGVNb2RhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICB0aGlzLiRlbGVtZW50LmhpZGUoKVxuICAgIHRoaXMuYmFja2Ryb3AoZnVuY3Rpb24gKCkge1xuICAgICAgdGhhdC4kYm9keS5yZW1vdmVDbGFzcygnbW9kYWwtb3BlbicpXG4gICAgICB0aGF0LnJlc2V0QWRqdXN0bWVudHMoKVxuICAgICAgdGhhdC5yZXNldFNjcm9sbGJhcigpXG4gICAgICB0aGF0LiRlbGVtZW50LnRyaWdnZXIoJ2hpZGRlbi5icy5tb2RhbCcpXG4gICAgfSlcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5yZW1vdmVCYWNrZHJvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLiRiYWNrZHJvcCAmJiB0aGlzLiRiYWNrZHJvcC5yZW1vdmUoKVxuICAgIHRoaXMuJGJhY2tkcm9wID0gbnVsbFxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLmJhY2tkcm9wID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzXG4gICAgdmFyIGFuaW1hdGUgPSB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdmYWRlJykgPyAnZmFkZScgOiAnJ1xuXG4gICAgaWYgKHRoaXMuaXNTaG93biAmJiB0aGlzLm9wdGlvbnMuYmFja2Ryb3ApIHtcbiAgICAgIHZhciBkb0FuaW1hdGUgPSAkLnN1cHBvcnQudHJhbnNpdGlvbiAmJiBhbmltYXRlXG5cbiAgICAgIHRoaXMuJGJhY2tkcm9wID0gJChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSlcbiAgICAgICAgLmFkZENsYXNzKCdtb2RhbC1iYWNrZHJvcCAnICsgYW5pbWF0ZSlcbiAgICAgICAgLmFwcGVuZFRvKHRoaXMuJGJvZHkpXG5cbiAgICAgIHRoaXMuJGVsZW1lbnQub24oJ2NsaWNrLmRpc21pc3MuYnMubW9kYWwnLCAkLnByb3h5KGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmICh0aGlzLmlnbm9yZUJhY2tkcm9wQ2xpY2spIHtcbiAgICAgICAgICB0aGlzLmlnbm9yZUJhY2tkcm9wQ2xpY2sgPSBmYWxzZVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIGlmIChlLnRhcmdldCAhPT0gZS5jdXJyZW50VGFyZ2V0KSByZXR1cm5cbiAgICAgICAgdGhpcy5vcHRpb25zLmJhY2tkcm9wID09ICdzdGF0aWMnXG4gICAgICAgICAgPyB0aGlzLiRlbGVtZW50WzBdLmZvY3VzKClcbiAgICAgICAgICA6IHRoaXMuaGlkZSgpXG4gICAgICB9LCB0aGlzKSlcblxuICAgICAgaWYgKGRvQW5pbWF0ZSkgdGhpcy4kYmFja2Ryb3BbMF0ub2Zmc2V0V2lkdGggLy8gZm9yY2UgcmVmbG93XG5cbiAgICAgIHRoaXMuJGJhY2tkcm9wLmFkZENsYXNzKCdpbicpXG5cbiAgICAgIGlmICghY2FsbGJhY2spIHJldHVyblxuXG4gICAgICBkb0FuaW1hdGUgP1xuICAgICAgICB0aGlzLiRiYWNrZHJvcFxuICAgICAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIGNhbGxiYWNrKVxuICAgICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChNb2RhbC5CQUNLRFJPUF9UUkFOU0lUSU9OX0RVUkFUSU9OKSA6XG4gICAgICAgIGNhbGxiYWNrKClcblxuICAgIH0gZWxzZSBpZiAoIXRoaXMuaXNTaG93biAmJiB0aGlzLiRiYWNrZHJvcCkge1xuICAgICAgdGhpcy4kYmFja2Ryb3AucmVtb3ZlQ2xhc3MoJ2luJylcblxuICAgICAgdmFyIGNhbGxiYWNrUmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGF0LnJlbW92ZUJhY2tkcm9wKClcbiAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soKVxuICAgICAgfVxuICAgICAgJC5zdXBwb3J0LnRyYW5zaXRpb24gJiYgdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnZmFkZScpID9cbiAgICAgICAgdGhpcy4kYmFja2Ryb3BcbiAgICAgICAgICAub25lKCdic1RyYW5zaXRpb25FbmQnLCBjYWxsYmFja1JlbW92ZSlcbiAgICAgICAgICAuZW11bGF0ZVRyYW5zaXRpb25FbmQoTW9kYWwuQkFDS0RST1BfVFJBTlNJVElPTl9EVVJBVElPTikgOlxuICAgICAgICBjYWxsYmFja1JlbW92ZSgpXG5cbiAgICB9IGVsc2UgaWYgKGNhbGxiYWNrKSB7XG4gICAgICBjYWxsYmFjaygpXG4gICAgfVxuICB9XG5cbiAgLy8gdGhlc2UgZm9sbG93aW5nIG1ldGhvZHMgYXJlIHVzZWQgdG8gaGFuZGxlIG92ZXJmbG93aW5nIG1vZGFsc1xuXG4gIE1vZGFsLnByb3RvdHlwZS5oYW5kbGVVcGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5hZGp1c3REaWFsb2coKVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLmFkanVzdERpYWxvZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbW9kYWxJc092ZXJmbG93aW5nID0gdGhpcy4kZWxlbWVudFswXS5zY3JvbGxIZWlnaHQgPiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0XG5cbiAgICB0aGlzLiRlbGVtZW50LmNzcyh7XG4gICAgICBwYWRkaW5nTGVmdDogICF0aGlzLmJvZHlJc092ZXJmbG93aW5nICYmIG1vZGFsSXNPdmVyZmxvd2luZyA/IHRoaXMuc2Nyb2xsYmFyV2lkdGggOiAnJyxcbiAgICAgIHBhZGRpbmdSaWdodDogdGhpcy5ib2R5SXNPdmVyZmxvd2luZyAmJiAhbW9kYWxJc092ZXJmbG93aW5nID8gdGhpcy5zY3JvbGxiYXJXaWR0aCA6ICcnXG4gICAgfSlcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5yZXNldEFkanVzdG1lbnRzID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuJGVsZW1lbnQuY3NzKHtcbiAgICAgIHBhZGRpbmdMZWZ0OiAnJyxcbiAgICAgIHBhZGRpbmdSaWdodDogJydcbiAgICB9KVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLmNoZWNrU2Nyb2xsYmFyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBmdWxsV2luZG93V2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aFxuICAgIGlmICghZnVsbFdpbmRvd1dpZHRoKSB7IC8vIHdvcmthcm91bmQgZm9yIG1pc3Npbmcgd2luZG93LmlubmVyV2lkdGggaW4gSUU4XG4gICAgICB2YXIgZG9jdW1lbnRFbGVtZW50UmVjdCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgZnVsbFdpbmRvd1dpZHRoID0gZG9jdW1lbnRFbGVtZW50UmVjdC5yaWdodCAtIE1hdGguYWJzKGRvY3VtZW50RWxlbWVudFJlY3QubGVmdClcbiAgICB9XG4gICAgdGhpcy5ib2R5SXNPdmVyZmxvd2luZyA9IGRvY3VtZW50LmJvZHkuY2xpZW50V2lkdGggPCBmdWxsV2luZG93V2lkdGhcbiAgICB0aGlzLnNjcm9sbGJhcldpZHRoID0gdGhpcy5tZWFzdXJlU2Nyb2xsYmFyKClcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5zZXRTY3JvbGxiYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGJvZHlQYWQgPSBwYXJzZUludCgodGhpcy4kYm9keS5jc3MoJ3BhZGRpbmctcmlnaHQnKSB8fCAwKSwgMTApXG4gICAgdGhpcy5vcmlnaW5hbEJvZHlQYWQgPSBkb2N1bWVudC5ib2R5LnN0eWxlLnBhZGRpbmdSaWdodCB8fCAnJ1xuICAgIGlmICh0aGlzLmJvZHlJc092ZXJmbG93aW5nKSB0aGlzLiRib2R5LmNzcygncGFkZGluZy1yaWdodCcsIGJvZHlQYWQgKyB0aGlzLnNjcm9sbGJhcldpZHRoKVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLnJlc2V0U2Nyb2xsYmFyID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuJGJvZHkuY3NzKCdwYWRkaW5nLXJpZ2h0JywgdGhpcy5vcmlnaW5hbEJvZHlQYWQpXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUubWVhc3VyZVNjcm9sbGJhciA9IGZ1bmN0aW9uICgpIHsgLy8gdGh4IHdhbHNoXG4gICAgdmFyIHNjcm9sbERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgc2Nyb2xsRGl2LmNsYXNzTmFtZSA9ICdtb2RhbC1zY3JvbGxiYXItbWVhc3VyZSdcbiAgICB0aGlzLiRib2R5LmFwcGVuZChzY3JvbGxEaXYpXG4gICAgdmFyIHNjcm9sbGJhcldpZHRoID0gc2Nyb2xsRGl2Lm9mZnNldFdpZHRoIC0gc2Nyb2xsRGl2LmNsaWVudFdpZHRoXG4gICAgdGhpcy4kYm9keVswXS5yZW1vdmVDaGlsZChzY3JvbGxEaXYpXG4gICAgcmV0dXJuIHNjcm9sbGJhcldpZHRoXG4gIH1cblxuXG4gIC8vIE1PREFMIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbiwgX3JlbGF0ZWRUYXJnZXQpIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgICAgPSAkdGhpcy5kYXRhKCdicy5tb2RhbCcpXG4gICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBNb2RhbC5ERUZBVUxUUywgJHRoaXMuZGF0YSgpLCB0eXBlb2Ygb3B0aW9uID09ICdvYmplY3QnICYmIG9wdGlvbilcblxuICAgICAgaWYgKCFkYXRhKSAkdGhpcy5kYXRhKCdicy5tb2RhbCcsIChkYXRhID0gbmV3IE1vZGFsKHRoaXMsIG9wdGlvbnMpKSlcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnKSBkYXRhW29wdGlvbl0oX3JlbGF0ZWRUYXJnZXQpXG4gICAgICBlbHNlIGlmIChvcHRpb25zLnNob3cpIGRhdGEuc2hvdyhfcmVsYXRlZFRhcmdldClcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4ubW9kYWxcblxuICAkLmZuLm1vZGFsICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4ubW9kYWwuQ29uc3RydWN0b3IgPSBNb2RhbFxuXG5cbiAgLy8gTU9EQUwgTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT1cblxuICAkLmZuLm1vZGFsLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi5tb2RhbCA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIE1PREFMIERBVEEtQVBJXG4gIC8vID09PT09PT09PT09PT09XG5cbiAgJChkb2N1bWVudCkub24oJ2NsaWNrLmJzLm1vZGFsLmRhdGEtYXBpJywgJ1tkYXRhLXRvZ2dsZT1cIm1vZGFsXCJdJywgZnVuY3Rpb24gKGUpIHtcbiAgICB2YXIgJHRoaXMgICA9ICQodGhpcylcbiAgICB2YXIgaHJlZiAgICA9ICR0aGlzLmF0dHIoJ2hyZWYnKVxuICAgIHZhciAkdGFyZ2V0ID0gJCgkdGhpcy5hdHRyKCdkYXRhLXRhcmdldCcpIHx8IChocmVmICYmIGhyZWYucmVwbGFjZSgvLiooPz0jW15cXHNdKyQpLywgJycpKSkgLy8gc3RyaXAgZm9yIGllN1xuICAgIHZhciBvcHRpb24gID0gJHRhcmdldC5kYXRhKCdicy5tb2RhbCcpID8gJ3RvZ2dsZScgOiAkLmV4dGVuZCh7IHJlbW90ZTogIS8jLy50ZXN0KGhyZWYpICYmIGhyZWYgfSwgJHRhcmdldC5kYXRhKCksICR0aGlzLmRhdGEoKSlcblxuICAgIGlmICgkdGhpcy5pcygnYScpKSBlLnByZXZlbnREZWZhdWx0KClcblxuICAgICR0YXJnZXQub25lKCdzaG93LmJzLm1vZGFsJywgZnVuY3Rpb24gKHNob3dFdmVudCkge1xuICAgICAgaWYgKHNob3dFdmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgcmV0dXJuIC8vIG9ubHkgcmVnaXN0ZXIgZm9jdXMgcmVzdG9yZXIgaWYgbW9kYWwgd2lsbCBhY3R1YWxseSBnZXQgc2hvd25cbiAgICAgICR0YXJnZXQub25lKCdoaWRkZW4uYnMubW9kYWwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICR0aGlzLmlzKCc6dmlzaWJsZScpICYmICR0aGlzLnRyaWdnZXIoJ2ZvY3VzJylcbiAgICAgIH0pXG4gICAgfSlcbiAgICBQbHVnaW4uY2FsbCgkdGFyZ2V0LCBvcHRpb24sIHRoaXMpXG4gIH0pXG5cbn0oalF1ZXJ5KTtcbiIsIi8qIVxuICogSmF2YVNjcmlwdCBDb29raWUgdjIuMi4wXG4gKiBodHRwczovL2dpdGh1Yi5jb20vanMtY29va2llL2pzLWNvb2tpZVxuICpcbiAqIENvcHlyaWdodCAyMDA2LCAyMDE1IEtsYXVzIEhhcnRsICYgRmFnbmVyIEJyYWNrXG4gKiBSZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqL1xuOyhmdW5jdGlvbiAoZmFjdG9yeSkge1xuXHR2YXIgcmVnaXN0ZXJlZEluTW9kdWxlTG9hZGVyID0gZmFsc2U7XG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcblx0XHRkZWZpbmUoZmFjdG9yeSk7XG5cdFx0cmVnaXN0ZXJlZEluTW9kdWxlTG9hZGVyID0gdHJ1ZTtcblx0fVxuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdFx0cmVnaXN0ZXJlZEluTW9kdWxlTG9hZGVyID0gdHJ1ZTtcblx0fVxuXHRpZiAoIXJlZ2lzdGVyZWRJbk1vZHVsZUxvYWRlcikge1xuXHRcdHZhciBPbGRDb29raWVzID0gd2luZG93LkNvb2tpZXM7XG5cdFx0dmFyIGFwaSA9IHdpbmRvdy5Db29raWVzID0gZmFjdG9yeSgpO1xuXHRcdGFwaS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0d2luZG93LkNvb2tpZXMgPSBPbGRDb29raWVzO1xuXHRcdFx0cmV0dXJuIGFwaTtcblx0XHR9O1xuXHR9XG59KGZ1bmN0aW9uICgpIHtcblx0ZnVuY3Rpb24gZXh0ZW5kICgpIHtcblx0XHR2YXIgaSA9IDA7XG5cdFx0dmFyIHJlc3VsdCA9IHt9O1xuXHRcdGZvciAoOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgYXR0cmlidXRlcyA9IGFyZ3VtZW50c1sgaSBdO1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIGF0dHJpYnV0ZXMpIHtcblx0XHRcdFx0cmVzdWx0W2tleV0gPSBhdHRyaWJ1dGVzW2tleV07XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH1cblxuXHRmdW5jdGlvbiBpbml0IChjb252ZXJ0ZXIpIHtcblx0XHRmdW5jdGlvbiBhcGkgKGtleSwgdmFsdWUsIGF0dHJpYnV0ZXMpIHtcblx0XHRcdHZhciByZXN1bHQ7XG5cdFx0XHRpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vIFdyaXRlXG5cblx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuXHRcdFx0XHRhdHRyaWJ1dGVzID0gZXh0ZW5kKHtcblx0XHRcdFx0XHRwYXRoOiAnLydcblx0XHRcdFx0fSwgYXBpLmRlZmF1bHRzLCBhdHRyaWJ1dGVzKTtcblxuXHRcdFx0XHRpZiAodHlwZW9mIGF0dHJpYnV0ZXMuZXhwaXJlcyA9PT0gJ251bWJlcicpIHtcblx0XHRcdFx0XHR2YXIgZXhwaXJlcyA9IG5ldyBEYXRlKCk7XG5cdFx0XHRcdFx0ZXhwaXJlcy5zZXRNaWxsaXNlY29uZHMoZXhwaXJlcy5nZXRNaWxsaXNlY29uZHMoKSArIGF0dHJpYnV0ZXMuZXhwaXJlcyAqIDg2NGUrNSk7XG5cdFx0XHRcdFx0YXR0cmlidXRlcy5leHBpcmVzID0gZXhwaXJlcztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFdlJ3JlIHVzaW5nIFwiZXhwaXJlc1wiIGJlY2F1c2UgXCJtYXgtYWdlXCIgaXMgbm90IHN1cHBvcnRlZCBieSBJRVxuXHRcdFx0XHRhdHRyaWJ1dGVzLmV4cGlyZXMgPSBhdHRyaWJ1dGVzLmV4cGlyZXMgPyBhdHRyaWJ1dGVzLmV4cGlyZXMudG9VVENTdHJpbmcoKSA6ICcnO1xuXG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0cmVzdWx0ID0gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xuXHRcdFx0XHRcdGlmICgvXltcXHtcXFtdLy50ZXN0KHJlc3VsdCkpIHtcblx0XHRcdFx0XHRcdHZhbHVlID0gcmVzdWx0O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBjYXRjaCAoZSkge31cblxuXHRcdFx0XHRpZiAoIWNvbnZlcnRlci53cml0ZSkge1xuXHRcdFx0XHRcdHZhbHVlID0gZW5jb2RlVVJJQ29tcG9uZW50KFN0cmluZyh2YWx1ZSkpXG5cdFx0XHRcdFx0XHQucmVwbGFjZSgvJSgyM3wyNHwyNnwyQnwzQXwzQ3wzRXwzRHwyRnwzRnw0MHw1Qnw1RHw1RXw2MHw3Qnw3RHw3QykvZywgZGVjb2RlVVJJQ29tcG9uZW50KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR2YWx1ZSA9IGNvbnZlcnRlci53cml0ZSh2YWx1ZSwga2V5KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGtleSA9IGVuY29kZVVSSUNvbXBvbmVudChTdHJpbmcoa2V5KSk7XG5cdFx0XHRcdGtleSA9IGtleS5yZXBsYWNlKC8lKDIzfDI0fDI2fDJCfDVFfDYwfDdDKS9nLCBkZWNvZGVVUklDb21wb25lbnQpO1xuXHRcdFx0XHRrZXkgPSBrZXkucmVwbGFjZSgvW1xcKFxcKV0vZywgZXNjYXBlKTtcblxuXHRcdFx0XHR2YXIgc3RyaW5naWZpZWRBdHRyaWJ1dGVzID0gJyc7XG5cblx0XHRcdFx0Zm9yICh2YXIgYXR0cmlidXRlTmFtZSBpbiBhdHRyaWJ1dGVzKSB7XG5cdFx0XHRcdFx0aWYgKCFhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdKSB7XG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0c3RyaW5naWZpZWRBdHRyaWJ1dGVzICs9ICc7ICcgKyBhdHRyaWJ1dGVOYW1lO1xuXHRcdFx0XHRcdGlmIChhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdID09PSB0cnVlKSB7XG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0c3RyaW5naWZpZWRBdHRyaWJ1dGVzICs9ICc9JyArIGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIChkb2N1bWVudC5jb29raWUgPSBrZXkgKyAnPScgKyB2YWx1ZSArIHN0cmluZ2lmaWVkQXR0cmlidXRlcyk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFJlYWRcblxuXHRcdFx0aWYgKCFrZXkpIHtcblx0XHRcdFx0cmVzdWx0ID0ge307XG5cdFx0XHR9XG5cblx0XHRcdC8vIFRvIHByZXZlbnQgdGhlIGZvciBsb29wIGluIHRoZSBmaXJzdCBwbGFjZSBhc3NpZ24gYW4gZW1wdHkgYXJyYXlcblx0XHRcdC8vIGluIGNhc2UgdGhlcmUgYXJlIG5vIGNvb2tpZXMgYXQgYWxsLiBBbHNvIHByZXZlbnRzIG9kZCByZXN1bHQgd2hlblxuXHRcdFx0Ly8gY2FsbGluZyBcImdldCgpXCJcblx0XHRcdHZhciBjb29raWVzID0gZG9jdW1lbnQuY29va2llID8gZG9jdW1lbnQuY29va2llLnNwbGl0KCc7ICcpIDogW107XG5cdFx0XHR2YXIgcmRlY29kZSA9IC8oJVswLTlBLVpdezJ9KSsvZztcblx0XHRcdHZhciBpID0gMDtcblxuXHRcdFx0Zm9yICg7IGkgPCBjb29raWVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHZhciBwYXJ0cyA9IGNvb2tpZXNbaV0uc3BsaXQoJz0nKTtcblx0XHRcdFx0dmFyIGNvb2tpZSA9IHBhcnRzLnNsaWNlKDEpLmpvaW4oJz0nKTtcblxuXHRcdFx0XHRpZiAoIXRoaXMuanNvbiAmJiBjb29raWUuY2hhckF0KDApID09PSAnXCInKSB7XG5cdFx0XHRcdFx0Y29va2llID0gY29va2llLnNsaWNlKDEsIC0xKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0dmFyIG5hbWUgPSBwYXJ0c1swXS5yZXBsYWNlKHJkZWNvZGUsIGRlY29kZVVSSUNvbXBvbmVudCk7XG5cdFx0XHRcdFx0Y29va2llID0gY29udmVydGVyLnJlYWQgP1xuXHRcdFx0XHRcdFx0Y29udmVydGVyLnJlYWQoY29va2llLCBuYW1lKSA6IGNvbnZlcnRlcihjb29raWUsIG5hbWUpIHx8XG5cdFx0XHRcdFx0XHRjb29raWUucmVwbGFjZShyZGVjb2RlLCBkZWNvZGVVUklDb21wb25lbnQpO1xuXG5cdFx0XHRcdFx0aWYgKHRoaXMuanNvbikge1xuXHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0Y29va2llID0gSlNPTi5wYXJzZShjb29raWUpO1xuXHRcdFx0XHRcdFx0fSBjYXRjaCAoZSkge31cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoa2V5ID09PSBuYW1lKSB7XG5cdFx0XHRcdFx0XHRyZXN1bHQgPSBjb29raWU7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoIWtleSkge1xuXHRcdFx0XHRcdFx0cmVzdWx0W25hbWVdID0gY29va2llO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBjYXRjaCAoZSkge31cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHR9XG5cblx0XHRhcGkuc2V0ID0gYXBpO1xuXHRcdGFwaS5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG5cdFx0XHRyZXR1cm4gYXBpLmNhbGwoYXBpLCBrZXkpO1xuXHRcdH07XG5cdFx0YXBpLmdldEpTT04gPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gYXBpLmFwcGx5KHtcblx0XHRcdFx0anNvbjogdHJ1ZVxuXHRcdFx0fSwgW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKTtcblx0XHR9O1xuXHRcdGFwaS5kZWZhdWx0cyA9IHt9O1xuXG5cdFx0YXBpLnJlbW92ZSA9IGZ1bmN0aW9uIChrZXksIGF0dHJpYnV0ZXMpIHtcblx0XHRcdGFwaShrZXksICcnLCBleHRlbmQoYXR0cmlidXRlcywge1xuXHRcdFx0XHRleHBpcmVzOiAtMVxuXHRcdFx0fSkpO1xuXHRcdH07XG5cblx0XHRhcGkud2l0aENvbnZlcnRlciA9IGluaXQ7XG5cblx0XHRyZXR1cm4gYXBpO1xuXHR9XG5cblx0cmV0dXJuIGluaXQoZnVuY3Rpb24gKCkge30pO1xufSkpO1xuIiwiLypcbiAqIFNsaW5reVxuICogQSBsaWdodC13ZWlnaHQsIHJlc3BvbnNpdmUsIG1vYmlsZS1saWtlIG5hdmlnYXRpb24gbWVudSBwbHVnaW4gZm9yIGpRdWVyeVxuICogQnVpbHQgYnkgQWxpIFphaGlkIDxhbGkuemFoaWRAbGl2ZS5jb20+XG4gKiBQdWJsaXNoZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG4gKi9cblxuOyhmdW5jdGlvbigkKVxue1xuICAgIHZhciBsYXN0Q2xpY2s7XG5cbiAgICAkLmZuLnNsaW5reSA9IGZ1bmN0aW9uKG9wdGlvbnMpXG4gICAge1xuICAgICAgICB2YXIgc2V0dGluZ3MgPSAkLmV4dGVuZFxuICAgICAgICAoe1xuICAgICAgICAgICAgbGFiZWw6ICdCYWNrJyxcbiAgICAgICAgICAgIHRpdGxlOiBmYWxzZSxcbiAgICAgICAgICAgIHNwZWVkOiAzMDAsXG4gICAgICAgICAgICByZXNpemU6IHRydWUsXG4gICAgICAgICAgICBhY3RpdmVDbGFzczogJ2FjdGl2ZScsXG4gICAgICAgICAgICBoZWFkZXJDbGFzczogJ2hlYWRlcicsXG4gICAgICAgICAgICBoZWFkaW5nVGFnOiAnPGgyPicsXG4gICAgICAgICAgICBiYWNrRmlyc3Q6IGZhbHNlLFxuICAgICAgICB9LCBvcHRpb25zKTtcblxuICAgICAgICB2YXIgbWVudSA9ICQodGhpcyksXG4gICAgICAgICAgICByb290ID0gbWVudS5jaGlsZHJlbigpLmZpcnN0KCk7XG5cbiAgICAgICAgbWVudS5hZGRDbGFzcygnc2xpbmt5LW1lbnUnKTtcblxuICAgICAgICB2YXIgbW92ZSA9IGZ1bmN0aW9uKGRlcHRoLCBjYWxsYmFjaylcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIGxlZnQgPSBNYXRoLnJvdW5kKHBhcnNlSW50KHJvb3QuZ2V0KDApLnN0eWxlLmxlZnQpKSB8fCAwO1xuXG4gICAgICAgICAgICByb290LmNzcygnbGVmdCcsIGxlZnQgLSAoZGVwdGggKiAxMDApICsgJyUnKTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNhbGxiYWNrLCBzZXR0aW5ncy5zcGVlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHJlc2l6ZSA9IGZ1bmN0aW9uKGNvbnRlbnQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIG1lbnUuaGVpZ2h0KGNvbnRlbnQub3V0ZXJIZWlnaHQoKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHRyYW5zaXRpb24gPSBmdW5jdGlvbihzcGVlZClcbiAgICAgICAge1xuICAgICAgICAgICAgbWVudS5jc3MoJ3RyYW5zaXRpb24tZHVyYXRpb24nLCBzcGVlZCArICdtcycpO1xuICAgICAgICAgICAgcm9vdC5jc3MoJ3RyYW5zaXRpb24tZHVyYXRpb24nLCBzcGVlZCArICdtcycpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRyYW5zaXRpb24oc2V0dGluZ3Muc3BlZWQpO1xuXG4gICAgICAgICQoJ2EgKyB1bCcsIG1lbnUpLnByZXYoKS5hZGRDbGFzcygnbmV4dCcpO1xuXG4gICAgICAgICQoJ2xpID4gdWwnLCBtZW51KS5wcmVwZW5kKCc8bGkgY2xhc3M9XCInICsgc2V0dGluZ3MuaGVhZGVyQ2xhc3MgKyAnXCI+Jyk7XG5cbiAgICAgICAgaWYgKHNldHRpbmdzLnRpdGxlID09PSB0cnVlKVxuICAgICAgICB7XG4gICAgICAgICAgICAkKCdsaSA+IHVsJywgbWVudSkuZWFjaChmdW5jdGlvbigpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdmFyICRsaW5rID0gJCh0aGlzKS5wYXJlbnQoKS5maW5kKCdhJykuZmlyc3QoKSxcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgPSAkbGluay50ZXh0KCksXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlID0gJCgnPGE+JykuYWRkQ2xhc3MoJ3RpdGxlJykudGV4dChsYWJlbCkuYXR0cignaHJlZicsICRsaW5rLmF0dHIoJ2hyZWYnKSk7XG5cbiAgICAgICAgICAgICAgICAkKCc+IC4nICsgc2V0dGluZ3MuaGVhZGVyQ2xhc3MsIHRoaXMpLmFwcGVuZCh0aXRsZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc2V0dGluZ3MudGl0bGUgJiYgc2V0dGluZ3MubGFiZWwgPT09IHRydWUpXG4gICAgICAgIHtcbiAgICAgICAgICAgICQoJ2xpID4gdWwnLCBtZW51KS5lYWNoKGZ1bmN0aW9uKClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2YXIgbGFiZWwgPSAkKHRoaXMpLnBhcmVudCgpLmZpbmQoJ2EnKS5maXJzdCgpLnRleHQoKSxcbiAgICAgICAgICAgICAgICAgICAgYmFja0xpbmsgPSAkKCc8YT4nKS50ZXh0KGxhYmVsKS5wcm9wKCdocmVmJywgJyMnKS5hZGRDbGFzcygnYmFjaycpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHNldHRpbmdzLmJhY2tGaXJzdClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICQoJz4gLicgKyBzZXR0aW5ncy5oZWFkZXJDbGFzcywgdGhpcykucHJlcGVuZChiYWNrTGluayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICQoJz4gLicgKyBzZXR0aW5ncy5oZWFkZXJDbGFzcywgdGhpcykuYXBwZW5kKGJhY2tMaW5rKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciBiYWNrTGluayA9ICQoJzxhPicpLnRleHQoc2V0dGluZ3MubGFiZWwpLnByb3AoJ2hyZWYnLCAnIycpLmFkZENsYXNzKCdiYWNrJyk7XG5cbiAgICAgICAgICAgIGlmIChzZXR0aW5ncy5iYWNrRmlyc3QpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgJCgnLicgKyBzZXR0aW5ncy5oZWFkZXJDbGFzcywgbWVudSkucHJlcGVuZChiYWNrTGluayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgJCgnLicgKyBzZXR0aW5ncy5oZWFkZXJDbGFzcywgbWVudSkuYXBwZW5kKGJhY2tMaW5rKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgICQoJ2EnLCBtZW51KS5vbignY2xpY2snLCBmdW5jdGlvbihlKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAoKGxhc3RDbGljayArIHNldHRpbmdzLnNwZWVkKSA+IERhdGUubm93KCkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsYXN0Q2xpY2sgPSBEYXRlLm5vdygpO1xuXG4gICAgICAgICAgICB2YXIgYSA9ICQodGhpcyk7XG5cbiAgICAgICAgICAgIGlmIChhLmhhc0NsYXNzKCduZXh0JykgfHwgYS5oYXNDbGFzcygnYmFjaycpKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGEuaGFzQ2xhc3MoJ25leHQnKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZW51LmZpbmQoJy4nICsgc2V0dGluZ3MuYWN0aXZlQ2xhc3MpLnJlbW92ZUNsYXNzKHNldHRpbmdzLmFjdGl2ZUNsYXNzKTtcblxuICAgICAgICAgICAgICAgIGEubmV4dCgpLnNob3coKS5hZGRDbGFzcyhzZXR0aW5ncy5hY3RpdmVDbGFzcyk7XG5cbiAgICAgICAgICAgICAgICBtb3ZlKDEpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHNldHRpbmdzLnJlc2l6ZSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJlc2l6ZShhLm5leHQoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoYS5oYXNDbGFzcygnYmFjaycpKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1vdmUoLTEsIGZ1bmN0aW9uKClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG1lbnUuZmluZCgnLicgKyBzZXR0aW5ncy5hY3RpdmVDbGFzcykucmVtb3ZlQ2xhc3Moc2V0dGluZ3MuYWN0aXZlQ2xhc3MpO1xuXG4gICAgICAgICAgICAgICAgICAgIGEucGFyZW50KCkucGFyZW50KCkuaGlkZSgpLnBhcmVudHNVbnRpbChtZW51LCAndWwnKS5maXJzdCgpLmFkZENsYXNzKHNldHRpbmdzLmFjdGl2ZUNsYXNzKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmIChzZXR0aW5ncy5yZXNpemUpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXNpemUoYS5wYXJlbnQoKS5wYXJlbnQoKS5wYXJlbnRzVW50aWwobWVudSwgJ3VsJykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5qdW1wID0gZnVuY3Rpb24odG8sIGFuaW1hdGUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRvID0gJCh0byk7XG5cbiAgICAgICAgICAgIHZhciBhY3RpdmUgPSBtZW51LmZpbmQoJy4nICsgc2V0dGluZ3MuYWN0aXZlQ2xhc3MpO1xuXG4gICAgICAgICAgICBpZiAoYWN0aXZlLmxlbmd0aCA+IDApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYWN0aXZlID0gYWN0aXZlLnBhcmVudHNVbnRpbChtZW51LCAndWwnKS5sZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYWN0aXZlID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbWVudS5maW5kKCd1bCcpLnJlbW92ZUNsYXNzKHNldHRpbmdzLmFjdGl2ZUNsYXNzKS5oaWRlKCk7XG5cbiAgICAgICAgICAgIHZhciBtZW51cyA9IHRvLnBhcmVudHNVbnRpbChtZW51LCAndWwnKTtcblxuICAgICAgICAgICAgbWVudXMuc2hvdygpO1xuICAgICAgICAgICAgdG8uc2hvdygpLmFkZENsYXNzKHNldHRpbmdzLmFjdGl2ZUNsYXNzKTtcblxuICAgICAgICAgICAgaWYgKGFuaW1hdGUgPT09IGZhbHNlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRyYW5zaXRpb24oMCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG1vdmUobWVudXMubGVuZ3RoIC0gYWN0aXZlKTtcblxuICAgICAgICAgICAgaWYgKHNldHRpbmdzLnJlc2l6ZSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXNpemUodG8pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYW5pbWF0ZSA9PT0gZmFsc2UpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbihzZXR0aW5ncy5zcGVlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5ob21lID0gZnVuY3Rpb24oYW5pbWF0ZSlcbiAgICAgICAge1xuICAgICAgICAgICAgaWYgKGFuaW1hdGUgPT09IGZhbHNlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRyYW5zaXRpb24oMCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBhY3RpdmUgPSBtZW51LmZpbmQoJy4nICsgc2V0dGluZ3MuYWN0aXZlQ2xhc3MpLFxuICAgICAgICAgICAgICAgIGNvdW50ID0gYWN0aXZlLnBhcmVudHNVbnRpbChtZW51LCAnbGknKS5sZW5ndGg7XG5cbiAgICAgICAgICAgIGlmIChjb3VudCA+IDApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbW92ZSgtY291bnQsIGZ1bmN0aW9uKClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZS5yZW1vdmVDbGFzcyhzZXR0aW5ncy5hY3RpdmVDbGFzcyk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3MucmVzaXplKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzaXplKCQoYWN0aXZlLnBhcmVudHNVbnRpbChtZW51LCAnbGknKS5nZXQoY291bnQgLSAxKSkucGFyZW50KCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGFuaW1hdGUgPT09IGZhbHNlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRyYW5zaXRpb24oc2V0dGluZ3Muc3BlZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uKClcbiAgICAgICAge1xuICAgICAgICAgICAgJCgnLicgKyBzZXR0aW5ncy5oZWFkZXJDbGFzcywgbWVudSkucmVtb3ZlKCk7XG4gICAgICAgICAgICAkKCdhJywgbWVudSkucmVtb3ZlQ2xhc3MoJ25leHQnKS5vZmYoJ2NsaWNrJyk7XG5cbiAgICAgICAgICAgIG1lbnUucmVtb3ZlQ2xhc3MoJ3NsaW5reS1tZW51JykuY3NzKCd0cmFuc2l0aW9uLWR1cmF0aW9uJywgJycpO1xuICAgICAgICAgICAgcm9vdC5jc3MoJ3RyYW5zaXRpb24tZHVyYXRpb24nLCAnJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGFjdGl2ZSA9IG1lbnUuZmluZCgnLicgKyBzZXR0aW5ncy5hY3RpdmVDbGFzcyk7XG5cbiAgICAgICAgaWYgKGFjdGl2ZS5sZW5ndGggPiAwKVxuICAgICAgICB7XG4gICAgICAgICAgICBhY3RpdmUucmVtb3ZlQ2xhc3Moc2V0dGluZ3MuYWN0aXZlQ2xhc3MpO1xuXG4gICAgICAgICAgICB0aGlzLmp1bXAoYWN0aXZlLCBmYWxzZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xufShqUXVlcnkpKTtcbiIsIi8vIHwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gfCBMYXlvdXRcbi8vIHwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gfFxuLy8gfCBUaGlzIGpRdWVyeSBzY3JpcHQgaXMgd3JpdHRlbiBieVxuLy8gfFxuLy8gfCBNb3J0ZW4gTmlzc2VuXG4vLyB8IGhqZW1tZXNpZGVrb25nZW4uZGtcbi8vIHxcbnZhciBsYXlvdXQgPSAoZnVuY3Rpb24gKCQpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgcHViID0ge30sXG4gICAgICAgICRsYXlvdXRfX2hlYWRlciA9ICQoJy5sYXlvdXRfX2hlYWRlcicpLFxuICAgICAgICAkbGF5b3V0X19kb2N1bWVudCA9ICQoJy5sYXlvdXRfX2RvY3VtZW50JyksXG4gICAgICAgIGxheW91dF9jbGFzc2VzID0ge1xuICAgICAgICAgICAgJ2xheW91dF9fd3JhcHBlcic6ICcubGF5b3V0X193cmFwcGVyJyxcbiAgICAgICAgICAgICdsYXlvdXRfX2RyYXdlcic6ICcubGF5b3V0X19kcmF3ZXInLFxuICAgICAgICAgICAgJ2xheW91dF9faGVhZGVyJzogJy5sYXlvdXRfX2hlYWRlcicsXG4gICAgICAgICAgICAnbGF5b3V0X19vYmZ1c2NhdG9yJzogJy5sYXlvdXRfX29iZnVzY2F0b3InLFxuICAgICAgICAgICAgJ2xheW91dF9fZG9jdW1lbnQnOiAnLmxheW91dF9fZG9jdW1lbnQnLFxuXG4gICAgICAgICAgICAnd3JhcHBlcl9pc191cGdyYWRlZCc6ICdpcy11cGdyYWRlZCcsXG4gICAgICAgICAgICAnd3JhcHBlcl9oYXNfZHJhd2VyJzogJ2hhcy1kcmF3ZXInLFxuICAgICAgICAgICAgJ3dyYXBwZXJfaGFzX3Njcm9sbGluZ19oZWFkZXInOiAnaGFzLXNjcm9sbGluZy1oZWFkZXInLFxuICAgICAgICAgICAgJ2hlYWRlcl9zY3JvbGwnOiAnbGF5b3V0X19oZWFkZXItLXNjcm9sbCcsXG4gICAgICAgICAgICAnaGVhZGVyX2lzX2NvbXBhY3QnOiAnaXMtY29tcGFjdCcsXG4gICAgICAgICAgICAnaGVhZGVyX3dhdGVyZmFsbCc6ICdsYXlvdXRfX2hlYWRlci0td2F0ZXJmYWxsJyxcbiAgICAgICAgICAgICdkcmF3ZXJfaXNfdmlzaWJsZSc6ICdpcy12aXNpYmxlJyxcbiAgICAgICAgICAgICdvYmZ1c2NhdG9yX2lzX3Zpc2libGUnOiAnaXMtdmlzaWJsZSdcbiAgICAgICAgfTtcblxuICAgIC8qKlxuICAgICAqIEluc3RhbnRpYXRlXG4gICAgICovXG4gICAgcHViLmluaXQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICByZWdpc3RlckV2ZW50SGFuZGxlcnMoKTtcbiAgICAgICAgcmVnaXN0ZXJCb290RXZlbnRIYW5kbGVycygpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBib290IGV2ZW50IGhhbmRsZXJzXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVnaXN0ZXJCb290RXZlbnRIYW5kbGVycygpIHtcblxuICAgICAgICAvLyBBZGQgY2xhc3NlcyB0byBlbGVtZW50c1xuICAgICAgICBhZGRFbGVtZW50Q2xhc3NlcygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyIGV2ZW50IGhhbmRsZXJzXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVnaXN0ZXJFdmVudEhhbmRsZXJzKCkge1xuXG4gICAgICAgIC8vIFRvZ2dsZSBkcmF3ZXJcbiAgICAgICAgJCgnW2RhdGEtdG9nZ2xlLWRyYXdlcl0nKS5hZGQoJChsYXlvdXRfY2xhc3Nlcy5sYXlvdXRfX29iZnVzY2F0b3IpKS5vbignY2xpY2sgdG91Y2hzdGFydCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gJCh0aGlzKTtcblxuICAgICAgICAgICAgdG9nZ2xlRHJhd2VyKCRlbGVtZW50KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gV2F0ZXJmYWxsIGhlYWRlclxuICAgICAgICBpZiAoJGxheW91dF9faGVhZGVyLmhhc0NsYXNzKGxheW91dF9jbGFzc2VzLmhlYWRlcl93YXRlcmZhbGwpKSB7XG5cbiAgICAgICAgICAgICRsYXlvdXRfX2RvY3VtZW50Lm9uKCd0b3VjaG1vdmUgc2Nyb2xsJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgJGRvY3VtZW50ID0gJCh0aGlzKTtcblxuICAgICAgICAgICAgICAgIHdhdGVyZmFsbEhlYWRlcigkZG9jdW1lbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGUgZHJhd2VyXG4gICAgICovXG4gICAgZnVuY3Rpb24gdG9nZ2xlRHJhd2VyKCRlbGVtZW50KSB7XG4gICAgICAgIHZhciAkd3JhcHBlciA9ICRlbGVtZW50LmNsb3Nlc3QobGF5b3V0X2NsYXNzZXMubGF5b3V0X193cmFwcGVyKSxcbiAgICAgICAgICAgICRvYmZ1c2NhdG9yID0gJHdyYXBwZXIuY2hpbGRyZW4obGF5b3V0X2NsYXNzZXMubGF5b3V0X19vYmZ1c2NhdG9yKSxcbiAgICAgICAgICAgICRkcmF3ZXIgPSAkd3JhcHBlci5jaGlsZHJlbihsYXlvdXRfY2xhc3Nlcy5sYXlvdXRfX2RyYXdlcik7XG5cbiAgICAgICAgLy8gVG9nZ2xlIHZpc2libGUgc3RhdGVcbiAgICAgICAgJG9iZnVzY2F0b3IudG9nZ2xlQ2xhc3MobGF5b3V0X2NsYXNzZXMub2JmdXNjYXRvcl9pc192aXNpYmxlKTtcbiAgICAgICAgJGRyYXdlci50b2dnbGVDbGFzcyhsYXlvdXRfY2xhc3Nlcy5kcmF3ZXJfaXNfdmlzaWJsZSk7XG5cbiAgICAgICAgLy8gQWx0ZXIgYXJpYS1oaWRkZW4gc3RhdHVzXG4gICAgICAgICRkcmF3ZXIuYXR0cignYXJpYS1oaWRkZW4nLCAoJGRyYXdlci5oYXNDbGFzcyhsYXlvdXRfY2xhc3Nlcy5kcmF3ZXJfaXNfdmlzaWJsZSkpID8gZmFsc2UgOiB0cnVlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBXYXRlcmZhbGwgaGVhZGVyXG4gICAgICovXG4gICAgZnVuY3Rpb24gd2F0ZXJmYWxsSGVhZGVyKCRkb2N1bWVudCkge1xuICAgICAgICB2YXIgJHdyYXBwZXIgPSAkZG9jdW1lbnQuY2xvc2VzdChsYXlvdXRfY2xhc3Nlcy5sYXlvdXRfX3dyYXBwZXIpLFxuICAgICAgICAgICAgJGhlYWRlciA9ICR3cmFwcGVyLmNoaWxkcmVuKGxheW91dF9jbGFzc2VzLmxheW91dF9faGVhZGVyKSxcbiAgICAgICAgICAgIGRpc3RhbmNlID0gJGRvY3VtZW50LnNjcm9sbFRvcCgpO1xuXG4gICAgICAgIGlmIChkaXN0YW5jZSA+IDApIHtcbiAgICAgICAgICAgICRoZWFkZXIuYWRkQ2xhc3MobGF5b3V0X2NsYXNzZXMuaGVhZGVyX2lzX2NvbXBhY3QpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgJGhlYWRlci5yZW1vdmVDbGFzcyhsYXlvdXRfY2xhc3Nlcy5oZWFkZXJfaXNfY29tcGFjdCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgY2xhc3NlcyB0byBlbGVtZW50cywgYmFzZWQgb24gYXR0YWNoZWQgY2xhc3Nlc1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIGFkZEVsZW1lbnRDbGFzc2VzKCkge1xuXG4gICAgICAgICQobGF5b3V0X2NsYXNzZXMubGF5b3V0X193cmFwcGVyKS5lYWNoKGZ1bmN0aW9uKGluZGV4LCBlbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgJHdyYXBwZXIgPSAkKHRoaXMpLFxuICAgICAgICAgICAgICAgICRoZWFkZXIgPSAkd3JhcHBlci5jaGlsZHJlbihsYXlvdXRfY2xhc3Nlcy5sYXlvdXRfX2hlYWRlciksXG4gICAgICAgICAgICAgICAgJGRyYXdlciA9ICR3cmFwcGVyLmNoaWxkcmVuKGxheW91dF9jbGFzc2VzLmxheW91dF9fZHJhd2VyKTtcblxuICAgICAgICAgICAgLy8gU2Nyb2xsIGhlYWRlclxuICAgICAgICAgICAgaWYgKCRoZWFkZXIuaGFzQ2xhc3MobGF5b3V0X2NsYXNzZXMuaGVhZGVyX3Njcm9sbCkpIHtcbiAgICAgICAgICAgICAgICAkd3JhcHBlci5hZGRDbGFzcyhsYXlvdXRfY2xhc3Nlcy53cmFwcGVyX2hhc19zY3JvbGxpbmdfaGVhZGVyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRHJhd2VyXG4gICAgICAgICAgICBpZiAoJGRyYXdlci5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgJHdyYXBwZXIuYWRkQ2xhc3MobGF5b3V0X2NsYXNzZXMud3JhcHBlcl9oYXNfZHJhd2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVXBncmFkZWRcbiAgICAgICAgICAgIGlmICgkd3JhcHBlci5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgJHdyYXBwZXIuYWRkQ2xhc3MobGF5b3V0X2NsYXNzZXMud3JhcHBlcl9pc191cGdyYWRlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBwdWI7XG59KShqUXVlcnkpO1xuIiwiLy8gRG9jdW1lbnQgcmVhZHlcbihmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gRmxhdHRlbiBzdHJ1Y3R1cmUgb2YgbW9kYWxzLCBzbyB0aGV5IGFyZSBub3QgbmVzdGVkLlxuICAvLyBFeC4gLm1vZGFsID4gLm1vZGFsID4gLm1vZGFsXG4gIHZhciAkbW9kYWxzID0gJCgnLm1vZGFsJyk7XG4gICQoJ2JvZHknKS5hcHBlbmQoJG1vZGFscyk7XG5cbiAgLy8gRW5hYmxlIGxheW91dFxuICBsYXlvdXQuaW5pdCgpO1xuXG4gIC8vIFNsaW5reVxuICAkKCcuc2xpbmt5LW1lbnUnKVxuICAgICAgLmZpbmQoJ3VsLCBsaSwgYScpXG4gICAgICAucmVtb3ZlQ2xhc3MoKTtcblxuICAkKCcucmVnaW9uLW1vYmlsZS1oZWFkZXItbmF2aWdhdGlvbiAuc2xpbmt5LW1lbnUnKS5zbGlua3koe1xuICAgIHRpdGxlOiB0cnVlLFxuICAgIGxhYmVsOiAnJ1xuICB9KTtcblxuICAvLyBUYWJsZVxuICAkKCcubGF5b3V0X19jb250ZW50JykuZmluZCgndGFibGUnKVxuICAgICAgLmFkZENsYXNzKCd0YWJsZSB0YWJsZS1zdHJpcGVkIHRhYmxlLWhvdmVyJyk7XG5cbiAgLy8gTm90aWZ5XG4gIHZhciAkbm90aWZpY2F0aW9ucyA9ICQoJy5ub3RpZnknKTtcbiAgaWYgKCRub3RpZmljYXRpb25zLmxlbmd0aCkge1xuXG4gICAgJG5vdGlmaWNhdGlvbnMuZWFjaChmdW5jdGlvbihpbmRleCwgdmFsKSB7XG4gICAgICB2YXIgJGRvY3VtZW50ID0gJCgnLmxheW91dF9fZG9jdW1lbnQnKSxcbiAgICAgICAgICAkcmVnaW9uID0gJCgnLnJlZ2lvbi1ub3RpZnknKSxcbiAgICAgICAgICAkZWxlbWVudCA9ICQodGhpcyksXG4gICAgICAgICAgY29va2llX2lkID0gJ25vdGlmeV9pZF8nICsgJGVsZW1lbnQuYXR0cignaWQnKSxcbiAgICAgICAgICAkY2xvc2UgPSAkZWxlbWVudC5maW5kKCcubm90aWZ5X19jbG9zZScpO1xuXG4gICAgICAvLyBGbGV4IG1hZ2ljIC0gZml4aW5nIGRpc3BsYXk6IGJsb2NrIG9uIGZhZGVJbiAoc2VlOiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yODkwNDY5OC9ob3ctZmFkZS1pbi1hLWZsZXgtYm94KVxuICAgICAgJGVsZW1lbnQuY3NzKCdkaXNwbGF5JywgJ2ZsZXgnKS5oaWRlKCk7XG5cbiAgICAgIC8vIE5vIGNvb2tpZSBoYXMgYmVlbiBzZXQgeWV0XG4gICAgICBpZiAoISBDb29raWVzLmdldChjb29raWVfaWQpKSB7XG5cbiAgICAgICAgLy8gRmFkZSB0aGUgZWxlbWVudCBpblxuICAgICAgICAkZWxlbWVudFxuICAgICAgICAgICAgLmRlbGF5KDIwMDApXG4gICAgICAgICAgICAuZmFkZUluKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICB2YXIgaGVpZ2h0ID0gJHJlZ2lvbi5vdXRlckhlaWdodCh0cnVlKTtcblxuICAgICAgICAgICAgICAkZG9jdW1lbnQuY3NzKCdwYWRkaW5nLWJvdHRvbScsIGhlaWdodCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2xvc2VkXG4gICAgICAkY2xvc2Uub24oJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgJGVsZW1lbnQuZmFkZU91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAkZG9jdW1lbnQuY3NzKCdwYWRkaW5nLWJvdHRvbScsIDApO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBTZXQgYSBjb29raWUsIHRvIHN0b3AgdGhpcyBub3RpZmljYXRpb24gZnJvbSBiZWluZyBkaXNwbGF5ZWQgYWdhaW5cbiAgICAgICAgQ29va2llcy5zZXQoY29va2llX2lkLCB0cnVlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgJChcIiN0b2dnbGVfbW9iaWxlX21lbnVcIikuY2xpY2soZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgJCgnI21haW4tbWVudScpLnRvZ2dsZUNsYXNzKCdtb2JpbGUtbWVudS1vcGVuJyk7XG4gICAgJCgnLmxheW91dF9fZG9jdW1lbnQnKS50b2dnbGVDbGFzcygnbW9iaWxlLW1lbnUtb3BlbicpO1xuICB9KTtcblxuICAvL1Nob3cgc2VhcmNoIGZvcm0gYmxvY2tcbiAgJChcIi5zZWFyY2gtYnV0dG9uXCIpLmNsaWNrKGZ1bmN0aW9uIChldmVudCkge1xuICAgIGlmICgkKFwiI3NlYXJjaC1mb3JtLXBvcG92ZXJcIikuaGFzQ2xhc3MoXCJoaWRkZW5cIikpIHtcbiAgICAgICQoXCIjc2VhcmNoLWZvcm0tcG9wb3ZlclwiKS5yZW1vdmVDbGFzcygnaGlkZGVuJyk7XG4gICAgICAkKFwiLmZvcm0tY29udHJvbFwiKS5mb2N1cygpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy9IaWRlIHNlYXJjaCBmb3JtIGJsb2NrXG4gICQoZG9jdW1lbnQpLmNsaWNrKGZ1bmN0aW9uIChldmVudCkge1xuICAgIGlmICghJChldmVudC50YXJnZXQpLmNsb3Nlc3QoJyNzZWFyY2gtZm9ybS1wb3BvdmVyJykubGVuZ3RoICYmICEkKGV2ZW50LnRhcmdldCkuY2xvc2VzdCgnLnNlYXJjaC1idXR0b24nKS5sZW5ndGgpIHtcbiAgICAgIGlmICghJChcIiNzZWFyY2gtZm9ybS1wb3BvdmVyXCIpLmhhc0NsYXNzKFwiaGlkZGVuXCIpKSB7XG4gICAgICAgICQoXCIjc2VhcmNoLWZvcm0tcG9wb3ZlclwiKS5hZGRDbGFzcygnaGlkZGVuJyk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICAvL0ltcHJvdmluZyB1c2FiaWxpdHkgZm9yIG1lbnVkcm9wZG93bnMgZm9yIG1vYmlsZSBkZXZpY2VzXG4gIGlmICghISgnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cpKSB7Ly9jaGVjayBmb3IgdG91Y2ggZGV2aWNlXG4gICAgJCgnbGkuZHJvcGRvd24ubGF5b3V0LW5hdmlnYXRpb25fX2Ryb3Bkb3duJykuZmluZCgnPiBhJykuY2xpY2soZnVuY3Rpb24gKGUpIHtcbiAgICAgIGlmICgkKHRoaXMpLnBhcmVudCgpLmhhc0NsYXNzKFwiZXhwYW5kZWRcIikpIHtcbiAgICAgICAgLy8kKHRoaXMpLnBhcmVudCgpLnJlbW92ZUNsYXNzKFwiZXhwYW5kZWRcIik7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAkKHRoaXMpLnBhcmVudCgpLmFkZENsYXNzKFwiZXhwYW5kZWRcIik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgZWxzZSB7Ly9rZWVwaW5nIGl0IGNvbXBhdGlibGUgd2l0aCBkZXNrdG9wIGRldmljZXNcbiAgICAkKCdsaS5kcm9wZG93bi5sYXlvdXQtbmF2aWdhdGlvbl9fZHJvcGRvd24nKS5ob3ZlcihcbiAgICAgICAgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKFwiZXhwYW5kZWRcIik7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcyhcImV4cGFuZGVkXCIpO1xuICAgICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIC8vIFRvZ2dsZXJcbiAgJCgnW2RhdGEtdG9nZ2xlcl0nKS5vbignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICB2YXIgJGVsZW1lbnQgPSAkKHRoaXMpLFxuICAgICAgICB0YXJnZXQgPSAkZWxlbWVudC5hdHRyKCdkYXRhLXRvZ2dsZXInKSxcbiAgICAgICAgJHBhcmVudCA9ICRlbGVtZW50LnBhcmVudHMoJy50b2dnbGVyJyksXG4gICAgICAgICR0YXJnZXQgPSAkcGFyZW50LmZpbmQodGFyZ2V0KSxcbiAgICAgICAgJGFsbF90b2dnbGVfYnV0dG9ucyA9ICRwYXJlbnQuZmluZCgnW2RhdGEtdG9nZ2xlcl0nKSxcbiAgICAgICAgJHRvZ2dsZV9idXR0b24gPSAkcGFyZW50LmZpbmQoJ1tkYXRhLXRvZ2dsZXI9XCInICsgdGFyZ2V0ICsgJ1wiXScpLFxuICAgICAgICAkYWxsX2NvbnRlbnQgPSAkcGFyZW50LmZpbmQoJy50b2dnbGVyX19jb250ZW50Jyk7XG5cbiAgICAvLyBSZW1vdmUgYWxsIGFjdGl2ZSB0b2dnbGVyc1xuICAgICRhbGxfdG9nZ2xlX2J1dHRvbnNcbiAgICAgICAgLnBhcmVudCgpXG4gICAgICAgIC5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG5cbiAgICAkYWxsX2NvbnRlbnQucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuXG4gICAgLy8gU2hvd1xuICAgICR0b2dnbGVfYnV0dG9uLnBhcmVudCgpLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAkdGFyZ2V0LmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgfSk7XG5cbiAgJChcIi50b2dnbGVyXCIpLmVhY2goZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAkKHRoaXMpLmZpbmQoJy50b2dnbGVyX19idXR0b24nKS5maXJzdCgpLnRyaWdnZXIoJ2NsaWNrJyk7XG4gIH0pO1xuXG4gIC8vIFVzZSBtdWx0aXBsZSBtb2RhbHMgKGh0dHA6Ly9qc2ZpZGRsZS5uZXQvbGlraGkxL3d0ajZuYWNkLylcbiAgJChkb2N1bWVudCkub24oe1xuICAgICdzaG93LmJzLm1vZGFsJzogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHpJbmRleCA9IDEwNDAgKyAoMTAgKiAkKCcubW9kYWw6dmlzaWJsZScpLmxlbmd0aCk7XG4gICAgICAkKHRoaXMpLmNzcygnei1pbmRleCcsIHpJbmRleCk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCgnLm1vZGFsLWJhY2tkcm9wJykubm90KCcubW9kYWwtc3RhY2snKS5jc3MoJ3otaW5kZXgnLCB6SW5kZXggLSAxKS5hZGRDbGFzcygnbW9kYWwtc3RhY2snKTtcbiAgICAgIH0sIDApO1xuICAgIH0sXG4gICAgJ2hpZGRlbi5icy5tb2RhbCc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICgkKCcubW9kYWw6dmlzaWJsZScpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gcmVzdG9yZSB0aGUgbW9kYWwtb3BlbiBjbGFzcyB0byB0aGUgYm9keSBlbGVtZW50LCBzbyB0aGF0IHNjcm9sbGluZ1xuICAgICAgICAvLyB3b3JrcyBwcm9wZXJseSBhZnRlciBkZS1zdGFja2luZyBhIG1vZGFsLlxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAkKGRvY3VtZW50LmJvZHkpLmFkZENsYXNzKCdtb2RhbC1vcGVuJyk7XG4gICAgICAgIH0sIDApO1xuICAgICAgfVxuICAgIH1cbiAgfSwgJy5tb2RhbCcpO1xuXG59KShqUXVlcnkpO1xuIl19
