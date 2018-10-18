'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* ========================================================================
 * Bootstrap: affix.js v3.3.7
 * http://getbootstrap.com/javascript/#affix
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+function ($) {
  'use strict';

  // AFFIX CLASS DEFINITION
  // ======================

  var Affix = function Affix(element, options) {
    this.options = $.extend({}, Affix.DEFAULTS, options);

    this.$target = $(this.options.target).on('scroll.bs.affix.data-api', $.proxy(this.checkPosition, this)).on('click.bs.affix.data-api', $.proxy(this.checkPositionWithEventLoop, this));

    this.$element = $(element);
    this.affixed = null;
    this.unpin = null;
    this.pinnedOffset = null;

    this.checkPosition();
  };

  Affix.VERSION = '3.3.7';

  Affix.RESET = 'affix affix-top affix-bottom';

  Affix.DEFAULTS = {
    offset: 0,
    target: window
  };

  Affix.prototype.getState = function (scrollHeight, height, offsetTop, offsetBottom) {
    var scrollTop = this.$target.scrollTop();
    var position = this.$element.offset();
    var targetHeight = this.$target.height();

    if (offsetTop != null && this.affixed == 'top') return scrollTop < offsetTop ? 'top' : false;

    if (this.affixed == 'bottom') {
      if (offsetTop != null) return scrollTop + this.unpin <= position.top ? false : 'bottom';
      return scrollTop + targetHeight <= scrollHeight - offsetBottom ? false : 'bottom';
    }

    var initializing = this.affixed == null;
    var colliderTop = initializing ? scrollTop : position.top;
    var colliderHeight = initializing ? targetHeight : height;

    if (offsetTop != null && scrollTop <= offsetTop) return 'top';
    if (offsetBottom != null && colliderTop + colliderHeight >= scrollHeight - offsetBottom) return 'bottom';

    return false;
  };

  Affix.prototype.getPinnedOffset = function () {
    if (this.pinnedOffset) return this.pinnedOffset;
    this.$element.removeClass(Affix.RESET).addClass('affix');
    var scrollTop = this.$target.scrollTop();
    var position = this.$element.offset();
    return this.pinnedOffset = position.top - scrollTop;
  };

  Affix.prototype.checkPositionWithEventLoop = function () {
    setTimeout($.proxy(this.checkPosition, this), 1);
  };

  Affix.prototype.checkPosition = function () {
    if (!this.$element.is(':visible')) return;

    var height = this.$element.height();
    var offset = this.options.offset;
    var offsetTop = offset.top;
    var offsetBottom = offset.bottom;
    var scrollHeight = Math.max($(document).height(), $(document.body).height());

    if ((typeof offset === 'undefined' ? 'undefined' : _typeof(offset)) != 'object') offsetBottom = offsetTop = offset;
    if (typeof offsetTop == 'function') offsetTop = offset.top(this.$element);
    if (typeof offsetBottom == 'function') offsetBottom = offset.bottom(this.$element);

    var affix = this.getState(scrollHeight, height, offsetTop, offsetBottom);

    if (this.affixed != affix) {
      if (this.unpin != null) this.$element.css('top', '');

      var affixType = 'affix' + (affix ? '-' + affix : '');
      var e = $.Event(affixType + '.bs.affix');

      this.$element.trigger(e);

      if (e.isDefaultPrevented()) return;

      this.affixed = affix;
      this.unpin = affix == 'bottom' ? this.getPinnedOffset() : null;

      this.$element.removeClass(Affix.RESET).addClass(affixType).trigger(affixType.replace('affix', 'affixed') + '.bs.affix');
    }

    if (affix == 'bottom') {
      this.$element.offset({
        top: scrollHeight - height - offsetBottom
      });
    }
  };

  // AFFIX PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.affix');
      var options = (typeof option === 'undefined' ? 'undefined' : _typeof(option)) == 'object' && option;

      if (!data) $this.data('bs.affix', data = new Affix(this, options));
      if (typeof option == 'string') data[option]();
    });
  }

  var old = $.fn.affix;

  $.fn.affix = Plugin;
  $.fn.affix.Constructor = Affix;

  // AFFIX NO CONFLICT
  // =================

  $.fn.affix.noConflict = function () {
    $.fn.affix = old;
    return this;
  };

  // AFFIX DATA-API
  // ==============

  $(window).on('load', function () {
    $('[data-spy="affix"]').each(function () {
      var $spy = $(this);
      var data = $spy.data();

      data.offset = data.offset || {};

      if (data.offsetBottom != null) data.offset.bottom = data.offsetBottom;
      if (data.offsetTop != null) data.offset.top = data.offsetTop;

      Plugin.call($spy, data);
    });
  });
}(jQuery);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFmZml4LmpzIiwidGFiLmpzIiwiY29sbGFwc2UuanMiLCJ0cmFuc2l0aW9uLmpzIiwidG9vbHRpcC5qcyIsInBvcG92ZXIuanMiLCJtb2RhbC5qcyIsImpzLmNvb2tpZS5qcyIsImN1c3RvbS1zbGlua3kuanMiLCJsYXlvdXQuanMiLCJhcHAuanMiXSwibmFtZXMiOlsiJCIsIkFmZml4IiwiZWxlbWVudCIsIm9wdGlvbnMiLCJleHRlbmQiLCJERUZBVUxUUyIsIiR0YXJnZXQiLCJ0YXJnZXQiLCJvbiIsInByb3h5IiwiY2hlY2tQb3NpdGlvbiIsImNoZWNrUG9zaXRpb25XaXRoRXZlbnRMb29wIiwiJGVsZW1lbnQiLCJhZmZpeGVkIiwidW5waW4iLCJwaW5uZWRPZmZzZXQiLCJWRVJTSU9OIiwiUkVTRVQiLCJvZmZzZXQiLCJ3aW5kb3ciLCJwcm90b3R5cGUiLCJnZXRTdGF0ZSIsInNjcm9sbEhlaWdodCIsImhlaWdodCIsIm9mZnNldFRvcCIsIm9mZnNldEJvdHRvbSIsInNjcm9sbFRvcCIsInBvc2l0aW9uIiwidGFyZ2V0SGVpZ2h0IiwidG9wIiwiaW5pdGlhbGl6aW5nIiwiY29sbGlkZXJUb3AiLCJjb2xsaWRlckhlaWdodCIsImdldFBpbm5lZE9mZnNldCIsInJlbW92ZUNsYXNzIiwiYWRkQ2xhc3MiLCJzZXRUaW1lb3V0IiwiaXMiLCJib3R0b20iLCJNYXRoIiwibWF4IiwiZG9jdW1lbnQiLCJib2R5IiwiYWZmaXgiLCJjc3MiLCJhZmZpeFR5cGUiLCJlIiwiRXZlbnQiLCJ0cmlnZ2VyIiwiaXNEZWZhdWx0UHJldmVudGVkIiwicmVwbGFjZSIsIlBsdWdpbiIsIm9wdGlvbiIsImVhY2giLCIkdGhpcyIsImRhdGEiLCJvbGQiLCJmbiIsIkNvbnN0cnVjdG9yIiwibm9Db25mbGljdCIsIiRzcHkiLCJjYWxsIiwialF1ZXJ5IiwiVGFiIiwiVFJBTlNJVElPTl9EVVJBVElPTiIsInNob3ciLCIkdWwiLCJjbG9zZXN0Iiwic2VsZWN0b3IiLCJhdHRyIiwicGFyZW50IiwiaGFzQ2xhc3MiLCIkcHJldmlvdXMiLCJmaW5kIiwiaGlkZUV2ZW50IiwicmVsYXRlZFRhcmdldCIsInNob3dFdmVudCIsImFjdGl2YXRlIiwidHlwZSIsImNvbnRhaW5lciIsImNhbGxiYWNrIiwiJGFjdGl2ZSIsInRyYW5zaXRpb24iLCJzdXBwb3J0IiwibGVuZ3RoIiwibmV4dCIsImVuZCIsIm9mZnNldFdpZHRoIiwib25lIiwiZW11bGF0ZVRyYW5zaXRpb25FbmQiLCJ0YWIiLCJjbGlja0hhbmRsZXIiLCJwcmV2ZW50RGVmYXVsdCIsIkNvbGxhcHNlIiwiJHRyaWdnZXIiLCJpZCIsInRyYW5zaXRpb25pbmciLCIkcGFyZW50IiwiZ2V0UGFyZW50IiwiYWRkQXJpYUFuZENvbGxhcHNlZENsYXNzIiwidG9nZ2xlIiwiZGltZW5zaW9uIiwiaGFzV2lkdGgiLCJhY3RpdmVzRGF0YSIsImFjdGl2ZXMiLCJjaGlsZHJlbiIsInN0YXJ0RXZlbnQiLCJjb21wbGV0ZSIsInNjcm9sbFNpemUiLCJjYW1lbENhc2UiLCJqb2luIiwiaGlkZSIsIm9mZnNldEhlaWdodCIsImkiLCJnZXRUYXJnZXRGcm9tVHJpZ2dlciIsImlzT3BlbiIsInRvZ2dsZUNsYXNzIiwiaHJlZiIsInRlc3QiLCJjb2xsYXBzZSIsInRyYW5zaXRpb25FbmQiLCJlbCIsImNyZWF0ZUVsZW1lbnQiLCJ0cmFuc0VuZEV2ZW50TmFtZXMiLCJXZWJraXRUcmFuc2l0aW9uIiwiTW96VHJhbnNpdGlvbiIsIk9UcmFuc2l0aW9uIiwibmFtZSIsInN0eWxlIiwidW5kZWZpbmVkIiwiZHVyYXRpb24iLCJjYWxsZWQiLCIkZWwiLCJldmVudCIsInNwZWNpYWwiLCJic1RyYW5zaXRpb25FbmQiLCJiaW5kVHlwZSIsImRlbGVnYXRlVHlwZSIsImhhbmRsZSIsImhhbmRsZU9iaiIsImhhbmRsZXIiLCJhcHBseSIsImFyZ3VtZW50cyIsIlRvb2x0aXAiLCJlbmFibGVkIiwidGltZW91dCIsImhvdmVyU3RhdGUiLCJpblN0YXRlIiwiaW5pdCIsImFuaW1hdGlvbiIsInBsYWNlbWVudCIsInRlbXBsYXRlIiwidGl0bGUiLCJkZWxheSIsImh0bWwiLCJ2aWV3cG9ydCIsInBhZGRpbmciLCJnZXRPcHRpb25zIiwiJHZpZXdwb3J0IiwiaXNGdW5jdGlvbiIsImNsaWNrIiwiaG92ZXIiLCJmb2N1cyIsImNvbnN0cnVjdG9yIiwiRXJyb3IiLCJ0cmlnZ2VycyIsInNwbGl0IiwiZXZlbnRJbiIsImV2ZW50T3V0IiwiZW50ZXIiLCJsZWF2ZSIsIl9vcHRpb25zIiwiZml4VGl0bGUiLCJnZXREZWZhdWx0cyIsImdldERlbGVnYXRlT3B0aW9ucyIsImRlZmF1bHRzIiwia2V5IiwidmFsdWUiLCJvYmoiLCJzZWxmIiwiY3VycmVudFRhcmdldCIsInRpcCIsImNsZWFyVGltZW91dCIsImlzSW5TdGF0ZVRydWUiLCJoYXNDb250ZW50IiwiaW5Eb20iLCJjb250YWlucyIsIm93bmVyRG9jdW1lbnQiLCJkb2N1bWVudEVsZW1lbnQiLCJ0aGF0IiwiJHRpcCIsInRpcElkIiwiZ2V0VUlEIiwic2V0Q29udGVudCIsImF1dG9Ub2tlbiIsImF1dG9QbGFjZSIsImRldGFjaCIsImxlZnQiLCJkaXNwbGF5IiwiYXBwZW5kVG8iLCJpbnNlcnRBZnRlciIsInBvcyIsImdldFBvc2l0aW9uIiwiYWN0dWFsV2lkdGgiLCJhY3R1YWxIZWlnaHQiLCJvcmdQbGFjZW1lbnQiLCJ2aWV3cG9ydERpbSIsInJpZ2h0Iiwid2lkdGgiLCJjYWxjdWxhdGVkT2Zmc2V0IiwiZ2V0Q2FsY3VsYXRlZE9mZnNldCIsImFwcGx5UGxhY2VtZW50IiwicHJldkhvdmVyU3RhdGUiLCJtYXJnaW5Ub3AiLCJwYXJzZUludCIsIm1hcmdpbkxlZnQiLCJpc05hTiIsInNldE9mZnNldCIsInVzaW5nIiwicHJvcHMiLCJyb3VuZCIsImRlbHRhIiwiZ2V0Vmlld3BvcnRBZGp1c3RlZERlbHRhIiwiaXNWZXJ0aWNhbCIsImFycm93RGVsdGEiLCJhcnJvd09mZnNldFBvc2l0aW9uIiwicmVwbGFjZUFycm93IiwiYXJyb3ciLCJnZXRUaXRsZSIsInJlbW92ZUF0dHIiLCIkZSIsImlzQm9keSIsInRhZ05hbWUiLCJlbFJlY3QiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJpc1N2ZyIsIlNWR0VsZW1lbnQiLCJlbE9mZnNldCIsInNjcm9sbCIsIm91dGVyRGltcyIsInZpZXdwb3J0UGFkZGluZyIsInZpZXdwb3J0RGltZW5zaW9ucyIsInRvcEVkZ2VPZmZzZXQiLCJib3R0b21FZGdlT2Zmc2V0IiwibGVmdEVkZ2VPZmZzZXQiLCJyaWdodEVkZ2VPZmZzZXQiLCJvIiwicHJlZml4IiwicmFuZG9tIiwiZ2V0RWxlbWVudEJ5SWQiLCIkYXJyb3ciLCJlbmFibGUiLCJkaXNhYmxlIiwidG9nZ2xlRW5hYmxlZCIsImRlc3Ryb3kiLCJvZmYiLCJyZW1vdmVEYXRhIiwidG9vbHRpcCIsIlBvcG92ZXIiLCJjb250ZW50IiwiZ2V0Q29udGVudCIsInBvcG92ZXIiLCJNb2RhbCIsIiRib2R5IiwiJGRpYWxvZyIsIiRiYWNrZHJvcCIsImlzU2hvd24iLCJvcmlnaW5hbEJvZHlQYWQiLCJzY3JvbGxiYXJXaWR0aCIsImlnbm9yZUJhY2tkcm9wQ2xpY2siLCJyZW1vdGUiLCJsb2FkIiwiQkFDS0RST1BfVFJBTlNJVElPTl9EVVJBVElPTiIsImJhY2tkcm9wIiwia2V5Ym9hcmQiLCJfcmVsYXRlZFRhcmdldCIsImNoZWNrU2Nyb2xsYmFyIiwic2V0U2Nyb2xsYmFyIiwiZXNjYXBlIiwicmVzaXplIiwiYWRqdXN0RGlhbG9nIiwiZW5mb3JjZUZvY3VzIiwiaGlkZU1vZGFsIiwiaGFzIiwid2hpY2giLCJoYW5kbGVVcGRhdGUiLCJyZXNldEFkanVzdG1lbnRzIiwicmVzZXRTY3JvbGxiYXIiLCJyZW1vdmVCYWNrZHJvcCIsInJlbW92ZSIsImFuaW1hdGUiLCJkb0FuaW1hdGUiLCJjYWxsYmFja1JlbW92ZSIsIm1vZGFsSXNPdmVyZmxvd2luZyIsImNsaWVudEhlaWdodCIsInBhZGRpbmdMZWZ0IiwiYm9keUlzT3ZlcmZsb3dpbmciLCJwYWRkaW5nUmlnaHQiLCJmdWxsV2luZG93V2lkdGgiLCJpbm5lcldpZHRoIiwiZG9jdW1lbnRFbGVtZW50UmVjdCIsImFicyIsImNsaWVudFdpZHRoIiwibWVhc3VyZVNjcm9sbGJhciIsImJvZHlQYWQiLCJzY3JvbGxEaXYiLCJjbGFzc05hbWUiLCJhcHBlbmQiLCJyZW1vdmVDaGlsZCIsIm1vZGFsIiwiZmFjdG9yeSIsInJlZ2lzdGVyZWRJbk1vZHVsZUxvYWRlciIsImRlZmluZSIsImFtZCIsImV4cG9ydHMiLCJtb2R1bGUiLCJPbGRDb29raWVzIiwiQ29va2llcyIsImFwaSIsInJlc3VsdCIsImF0dHJpYnV0ZXMiLCJjb252ZXJ0ZXIiLCJwYXRoIiwiZXhwaXJlcyIsIkRhdGUiLCJzZXRNaWxsaXNlY29uZHMiLCJnZXRNaWxsaXNlY29uZHMiLCJ0b1VUQ1N0cmluZyIsIkpTT04iLCJzdHJpbmdpZnkiLCJ3cml0ZSIsImVuY29kZVVSSUNvbXBvbmVudCIsIlN0cmluZyIsImRlY29kZVVSSUNvbXBvbmVudCIsInN0cmluZ2lmaWVkQXR0cmlidXRlcyIsImF0dHJpYnV0ZU5hbWUiLCJjb29raWUiLCJjb29raWVzIiwicmRlY29kZSIsInBhcnRzIiwic2xpY2UiLCJqc29uIiwiY2hhckF0IiwicmVhZCIsInBhcnNlIiwic2V0IiwiZ2V0IiwiZ2V0SlNPTiIsIndpdGhDb252ZXJ0ZXIiLCJsYXN0Q2xpY2siLCJzbGlua3kiLCJzZXR0aW5ncyIsImxhYmVsIiwic3BlZWQiLCJhY3RpdmVDbGFzcyIsImhlYWRlckNsYXNzIiwiaGVhZGluZ1RhZyIsImJhY2tGaXJzdCIsIm1lbnUiLCJyb290IiwiZmlyc3QiLCJtb3ZlIiwiZGVwdGgiLCJvdXRlckhlaWdodCIsInByZXYiLCJwcmVwZW5kIiwiJGxpbmsiLCJ0ZXh0IiwiYmFja0xpbmsiLCJwcm9wIiwibm93IiwiYSIsInBhcmVudHNVbnRpbCIsImp1bXAiLCJ0byIsImFjdGl2ZSIsIm1lbnVzIiwiaG9tZSIsImNvdW50IiwibGF5b3V0IiwicHViIiwiJGxheW91dF9faGVhZGVyIiwiJGxheW91dF9fZG9jdW1lbnQiLCJsYXlvdXRfY2xhc3NlcyIsInJlZ2lzdGVyRXZlbnRIYW5kbGVycyIsInJlZ2lzdGVyQm9vdEV2ZW50SGFuZGxlcnMiLCJhZGRFbGVtZW50Q2xhc3NlcyIsImFkZCIsImxheW91dF9fb2JmdXNjYXRvciIsInRvZ2dsZURyYXdlciIsImhlYWRlcl93YXRlcmZhbGwiLCIkZG9jdW1lbnQiLCJ3YXRlcmZhbGxIZWFkZXIiLCIkd3JhcHBlciIsImxheW91dF9fd3JhcHBlciIsIiRvYmZ1c2NhdG9yIiwiJGRyYXdlciIsImxheW91dF9fZHJhd2VyIiwib2JmdXNjYXRvcl9pc192aXNpYmxlIiwiZHJhd2VyX2lzX3Zpc2libGUiLCIkaGVhZGVyIiwibGF5b3V0X19oZWFkZXIiLCJkaXN0YW5jZSIsImhlYWRlcl9pc19jb21wYWN0IiwiaW5kZXgiLCJoZWFkZXJfc2Nyb2xsIiwid3JhcHBlcl9oYXNfc2Nyb2xsaW5nX2hlYWRlciIsIndyYXBwZXJfaGFzX2RyYXdlciIsIndyYXBwZXJfaXNfdXBncmFkZWQiLCIkbW9kYWxzIiwiJG5vdGlmaWNhdGlvbnMiLCJ2YWwiLCIkcmVnaW9uIiwiY29va2llX2lkIiwiJGNsb3NlIiwiZmFkZUluIiwiZmFkZU91dCIsInBhcmVudHMiLCIkYWxsX3RvZ2dsZV9idXR0b25zIiwiJHRvZ2dsZV9idXR0b24iLCIkYWxsX2NvbnRlbnQiLCJ6SW5kZXgiLCJub3QiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7Ozs7Ozs7QUFTQSxDQUFDLFVBQVVBLENBQVYsRUFBYTtBQUNaOztBQUVBO0FBQ0E7O0FBRUEsTUFBSUMsUUFBUSxTQUFSQSxLQUFRLENBQVVDLE9BQVYsRUFBbUJDLE9BQW5CLEVBQTRCO0FBQ3RDLFNBQUtBLE9BQUwsR0FBZUgsRUFBRUksTUFBRixDQUFTLEVBQVQsRUFBYUgsTUFBTUksUUFBbkIsRUFBNkJGLE9BQTdCLENBQWY7O0FBRUEsU0FBS0csT0FBTCxHQUFlTixFQUFFLEtBQUtHLE9BQUwsQ0FBYUks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LFFBakJIO0FBbUJELENBNUpELEVBNEpHMkIsTUE1SkgiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IGFmZml4LmpzIHYzLjMuN1xuICogaHR0cDovL2dldGJvb3RzdHJhcC5jb20vamF2YXNjcmlwdC8jYWZmaXhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxNiBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBBRkZJWCBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgQWZmaXggPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBBZmZpeC5ERUZBVUxUUywgb3B0aW9ucylcblxuICAgIHRoaXMuJHRhcmdldCA9ICQodGhpcy5vcHRpb25zLnRhcmdldClcbiAgICAgIC5vbignc2Nyb2xsLmJzLmFmZml4LmRhdGEtYXBpJywgJC5wcm94eSh0aGlzLmNoZWNrUG9zaXRpb24sIHRoaXMpKVxuICAgICAgLm9uKCdjbGljay5icy5hZmZpeC5kYXRhLWFwaScsICAkLnByb3h5KHRoaXMuY2hlY2tQb3NpdGlvbldpdGhFdmVudExvb3AsIHRoaXMpKVxuXG4gICAgdGhpcy4kZWxlbWVudCAgICAgPSAkKGVsZW1lbnQpXG4gICAgdGhpcy5hZmZpeGVkICAgICAgPSBudWxsXG4gICAgdGhpcy51bnBpbiAgICAgICAgPSBudWxsXG4gICAgdGhpcy5waW5uZWRPZmZzZXQgPSBudWxsXG5cbiAgICB0aGlzLmNoZWNrUG9zaXRpb24oKVxuICB9XG5cbiAgQWZmaXguVkVSU0lPTiAgPSAnMy4zLjcnXG5cbiAgQWZmaXguUkVTRVQgICAgPSAnYWZmaXggYWZmaXgtdG9wIGFmZml4LWJvdHRvbSdcblxuICBBZmZpeC5ERUZBVUxUUyA9IHtcbiAgICBvZmZzZXQ6IDAsXG4gICAgdGFyZ2V0OiB3aW5kb3dcbiAgfVxuXG4gIEFmZml4LnByb3RvdHlwZS5nZXRTdGF0ZSA9IGZ1bmN0aW9uIChzY3JvbGxIZWlnaHQsIGhlaWdodCwgb2Zmc2V0VG9wLCBvZmZzZXRCb3R0b20pIHtcbiAgICB2YXIgc2Nyb2xsVG9wICAgID0gdGhpcy4kdGFyZ2V0LnNjcm9sbFRvcCgpXG4gICAgdmFyIHBvc2l0aW9uICAgICA9IHRoaXMuJGVsZW1lbnQub2Zmc2V0KClcbiAgICB2YXIgdGFyZ2V0SGVpZ2h0ID0gdGhpcy4kdGFyZ2V0LmhlaWdodCgpXG5cbiAgICBpZiAob2Zmc2V0VG9wICE9IG51bGwgJiYgdGhpcy5hZmZpeGVkID09ICd0b3AnKSByZXR1cm4gc2Nyb2xsVG9wIDwgb2Zmc2V0VG9wID8gJ3RvcCcgOiBmYWxzZVxuXG4gICAgaWYgKHRoaXMuYWZmaXhlZCA9PSAnYm90dG9tJykge1xuICAgICAgaWYgKG9mZnNldFRvcCAhPSBudWxsKSByZXR1cm4gKHNjcm9sbFRvcCArIHRoaXMudW5waW4gPD0gcG9zaXRpb24udG9wKSA/IGZhbHNlIDogJ2JvdHRvbSdcbiAgICAgIHJldHVybiAoc2Nyb2xsVG9wICsgdGFyZ2V0SGVpZ2h0IDw9IHNjcm9sbEhlaWdodCAtIG9mZnNldEJvdHRvbSkgPyBmYWxzZSA6ICdib3R0b20nXG4gICAgfVxuXG4gICAgdmFyIGluaXRpYWxpemluZyAgID0gdGhpcy5hZmZpeGVkID09IG51bGxcbiAgICB2YXIgY29sbGlkZXJUb3AgICAgPSBpbml0aWFsaXppbmcgPyBzY3JvbGxUb3AgOiBwb3NpdGlvbi50b3BcbiAgICB2YXIgY29sbGlkZXJIZWlnaHQgPSBpbml0aWFsaXppbmcgPyB0YXJnZXRIZWlnaHQgOiBoZWlnaHRcblxuICAgIGlmIChvZmZzZXRUb3AgIT0gbnVsbCAmJiBzY3JvbGxUb3AgPD0gb2Zmc2V0VG9wKSByZXR1cm4gJ3RvcCdcbiAgICBpZiAob2Zmc2V0Qm90dG9tICE9IG51bGwgJiYgKGNvbGxpZGVyVG9wICsgY29sbGlkZXJIZWlnaHQgPj0gc2Nyb2xsSGVpZ2h0IC0gb2Zmc2V0Qm90dG9tKSkgcmV0dXJuICdib3R0b20nXG5cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIEFmZml4LnByb3RvdHlwZS5nZXRQaW5uZWRPZmZzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMucGlubmVkT2Zmc2V0KSByZXR1cm4gdGhpcy5waW5uZWRPZmZzZXRcbiAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKEFmZml4LlJFU0VUKS5hZGRDbGFzcygnYWZmaXgnKVxuICAgIHZhciBzY3JvbGxUb3AgPSB0aGlzLiR0YXJnZXQuc2Nyb2xsVG9wKClcbiAgICB2YXIgcG9zaXRpb24gID0gdGhpcy4kZWxlbWVudC5vZmZzZXQoKVxuICAgIHJldHVybiAodGhpcy5waW5uZWRPZmZzZXQgPSBwb3NpdGlvbi50b3AgLSBzY3JvbGxUb3ApXG4gIH1cblxuICBBZmZpeC5wcm90b3R5cGUuY2hlY2tQb3NpdGlvbldpdGhFdmVudExvb3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgc2V0VGltZW91dCgkLnByb3h5KHRoaXMuY2hlY2tQb3NpdGlvbiwgdGhpcyksIDEpXG4gIH1cblxuICBBZmZpeC5wcm90b3R5cGUuY2hlY2tQb3NpdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuJGVsZW1lbnQuaXMoJzp2aXNpYmxlJykpIHJldHVyblxuXG4gICAgdmFyIGhlaWdodCAgICAgICA9IHRoaXMuJGVsZW1lbnQuaGVpZ2h0KClcbiAgICB2YXIgb2Zmc2V0ICAgICAgID0gdGhpcy5vcHRpb25zLm9mZnNldFxuICAgIHZhciBvZmZzZXRUb3AgICAgPSBvZmZzZXQudG9wXG4gICAgdmFyIG9mZnNldEJvdHRvbSA9IG9mZnNldC5ib3R0b21cbiAgICB2YXIgc2Nyb2xsSGVpZ2h0ID0gTWF0aC5tYXgoJChkb2N1bWVudCkuaGVpZ2h0KCksICQoZG9jdW1lbnQuYm9keSkuaGVpZ2h0KCkpXG5cbiAgICBpZiAodHlwZW9mIG9mZnNldCAhPSAnb2JqZWN0JykgICAgICAgICBvZmZzZXRCb3R0b20gPSBvZmZzZXRUb3AgPSBvZmZzZXRcbiAgICBpZiAodHlwZW9mIG9mZnNldFRvcCA9PSAnZnVuY3Rpb24nKSAgICBvZmZzZXRUb3AgICAgPSBvZmZzZXQudG9wKHRoaXMuJGVsZW1lbnQpXG4gICAgaWYgKHR5cGVvZiBvZmZzZXRCb3R0b20gPT0gJ2Z1bmN0aW9uJykgb2Zmc2V0Qm90dG9tID0gb2Zmc2V0LmJvdHRvbSh0aGlzLiRlbGVtZW50KVxuXG4gICAgdmFyIGFmZml4ID0gdGhpcy5nZXRTdGF0ZShzY3JvbGxIZWlnaHQsIGhlaWdodCwgb2Zmc2V0VG9wLCBvZmZzZXRCb3R0b20pXG5cbiAgICBpZiAodGhpcy5hZmZpeGVkICE9IGFmZml4KSB7XG4gICAgICBpZiAodGhpcy51bnBpbiAhPSBudWxsKSB0aGlzLiRlbGVtZW50LmNzcygndG9wJywgJycpXG5cbiAgICAgIHZhciBhZmZpeFR5cGUgPSAnYWZmaXgnICsgKGFmZml4ID8gJy0nICsgYWZmaXggOiAnJylcbiAgICAgIHZhciBlICAgICAgICAgPSAkLkV2ZW50KGFmZml4VHlwZSArICcuYnMuYWZmaXgnKVxuXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoZSlcblxuICAgICAgaWYgKGUuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgICB0aGlzLmFmZml4ZWQgPSBhZmZpeFxuICAgICAgdGhpcy51bnBpbiA9IGFmZml4ID09ICdib3R0b20nID8gdGhpcy5nZXRQaW5uZWRPZmZzZXQoKSA6IG51bGxcblxuICAgICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAucmVtb3ZlQ2xhc3MoQWZmaXguUkVTRVQpXG4gICAgICAgIC5hZGRDbGFzcyhhZmZpeFR5cGUpXG4gICAgICAgIC50cmlnZ2VyKGFmZml4VHlwZS5yZXBsYWNlKCdhZmZpeCcsICdhZmZpeGVkJykgKyAnLmJzLmFmZml4JylcbiAgICB9XG5cbiAgICBpZiAoYWZmaXggPT0gJ2JvdHRvbScpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQub2Zmc2V0KHtcbiAgICAgICAgdG9wOiBzY3JvbGxIZWlnaHQgLSBoZWlnaHQgLSBvZmZzZXRCb3R0b21cbiAgICAgIH0pXG4gICAgfVxuICB9XG5cblxuICAvLyBBRkZJWCBQTFVHSU4gREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgICAgPSAkdGhpcy5kYXRhKCdicy5hZmZpeCcpXG4gICAgICB2YXIgb3B0aW9ucyA9IHR5cGVvZiBvcHRpb24gPT0gJ29iamVjdCcgJiYgb3B0aW9uXG5cbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMuYWZmaXgnLCAoZGF0YSA9IG5ldyBBZmZpeCh0aGlzLCBvcHRpb25zKSkpXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJykgZGF0YVtvcHRpb25dKClcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4uYWZmaXhcblxuICAkLmZuLmFmZml4ICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4uYWZmaXguQ29uc3RydWN0b3IgPSBBZmZpeFxuXG5cbiAgLy8gQUZGSVggTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT1cblxuICAkLmZuLmFmZml4Lm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi5hZmZpeCA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIEFGRklYIERBVEEtQVBJXG4gIC8vID09PT09PT09PT09PT09XG5cbiAgJCh3aW5kb3cpLm9uKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICQoJ1tkYXRhLXNweT1cImFmZml4XCJdJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHNweSA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhID0gJHNweS5kYXRhKClcblxuICAgICAgZGF0YS5vZmZzZXQgPSBkYXRhLm9mZnNldCB8fCB7fVxuXG4gICAgICBpZiAoZGF0YS5vZmZzZXRCb3R0b20gIT0gbnVsbCkgZGF0YS5vZmZzZXQuYm90dG9tID0gZGF0YS5vZmZzZXRCb3R0b21cbiAgICAgIGlmIChkYXRhLm9mZnNldFRvcCAgICAhPSBudWxsKSBkYXRhLm9mZnNldC50b3AgICAgPSBkYXRhLm9mZnNldFRvcFxuXG4gICAgICBQbHVnaW4uY2FsbCgkc3B5LCBkYXRhKVxuICAgIH0pXG4gIH0pXG5cbn0oalF1ZXJ5KTtcbiIsIi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiB0YWIuanMgdjMuMy43XG4gKiBodHRwOi8vZ2V0Ym9vdHN0cmFwLmNvbS9qYXZhc2NyaXB0LyN0YWJzXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTYgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gVEFCIENMQVNTIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgVGFiID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAvLyBqc2NzOmRpc2FibGUgcmVxdWlyZURvbGxhckJlZm9yZWpRdWVyeUFzc2lnbm1lbnRcbiAgICB0aGlzLmVsZW1lbnQgPSAkKGVsZW1lbnQpXG4gICAgLy8ganNjczplbmFibGUgcmVxdWlyZURvbGxhckJlZm9yZWpRdWVyeUFzc2lnbm1lbnRcbiAgfVxuXG4gIFRhYi5WRVJTSU9OID0gJzMuMy43J1xuXG4gIFRhYi5UUkFOU0lUSU9OX0RVUkFUSU9OID0gMTUwXG5cbiAgVGFiLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciAkdGhpcyAgICA9IHRoaXMuZWxlbWVudFxuICAgIHZhciAkdWwgICAgICA9ICR0aGlzLmNsb3Nlc3QoJ3VsOm5vdCguZHJvcGRvd24tbWVudSknKVxuICAgIHZhciBzZWxlY3RvciA9ICR0aGlzLmRhdGEoJ3RhcmdldCcpXG5cbiAgICBpZiAoIXNlbGVjdG9yKSB7XG4gICAgICBzZWxlY3RvciA9ICR0aGlzLmF0dHIoJ2hyZWYnKVxuICAgICAgc2VsZWN0b3IgPSBzZWxlY3RvciAmJiBzZWxlY3Rvci5yZXBsYWNlKC8uKig/PSNbXlxcc10qJCkvLCAnJykgLy8gc3RyaXAgZm9yIGllN1xuICAgIH1cblxuICAgIGlmICgkdGhpcy5wYXJlbnQoJ2xpJykuaGFzQ2xhc3MoJ2FjdGl2ZScpKSByZXR1cm5cblxuICAgIHZhciAkcHJldmlvdXMgPSAkdWwuZmluZCgnLmFjdGl2ZTpsYXN0IGEnKVxuICAgIHZhciBoaWRlRXZlbnQgPSAkLkV2ZW50KCdoaWRlLmJzLnRhYicsIHtcbiAgICAgIHJlbGF0ZWRUYXJnZXQ6ICR0aGlzWzBdXG4gICAgfSlcbiAgICB2YXIgc2hvd0V2ZW50ID0gJC5FdmVudCgnc2hvdy5icy50YWInLCB7XG4gICAgICByZWxhdGVkVGFyZ2V0OiAkcHJldmlvdXNbMF1cbiAgICB9KVxuXG4gICAgJHByZXZpb3VzLnRyaWdnZXIoaGlkZUV2ZW50KVxuICAgICR0aGlzLnRyaWdnZXIoc2hvd0V2ZW50KVxuXG4gICAgaWYgKHNob3dFdmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQoKSB8fCBoaWRlRXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgdmFyICR0YXJnZXQgPSAkKHNlbGVjdG9yKVxuXG4gICAgdGhpcy5hY3RpdmF0ZSgkdGhpcy5jbG9zZXN0KCdsaScpLCAkdWwpXG4gICAgdGhpcy5hY3RpdmF0ZSgkdGFyZ2V0LCAkdGFyZ2V0LnBhcmVudCgpLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkcHJldmlvdXMudHJpZ2dlcih7XG4gICAgICAgIHR5cGU6ICdoaWRkZW4uYnMudGFiJyxcbiAgICAgICAgcmVsYXRlZFRhcmdldDogJHRoaXNbMF1cbiAgICAgIH0pXG4gICAgICAkdGhpcy50cmlnZ2VyKHtcbiAgICAgICAgdHlwZTogJ3Nob3duLmJzLnRhYicsXG4gICAgICAgIHJlbGF0ZWRUYXJnZXQ6ICRwcmV2aW91c1swXVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgVGFiLnByb3RvdHlwZS5hY3RpdmF0ZSA9IGZ1bmN0aW9uIChlbGVtZW50LCBjb250YWluZXIsIGNhbGxiYWNrKSB7XG4gICAgdmFyICRhY3RpdmUgICAgPSBjb250YWluZXIuZmluZCgnPiAuYWN0aXZlJylcbiAgICB2YXIgdHJhbnNpdGlvbiA9IGNhbGxiYWNrXG4gICAgICAmJiAkLnN1cHBvcnQudHJhbnNpdGlvblxuICAgICAgJiYgKCRhY3RpdmUubGVuZ3RoICYmICRhY3RpdmUuaGFzQ2xhc3MoJ2ZhZGUnKSB8fCAhIWNvbnRhaW5lci5maW5kKCc+IC5mYWRlJykubGVuZ3RoKVxuXG4gICAgZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgICRhY3RpdmVcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgICAuZmluZCgnPiAuZHJvcGRvd24tbWVudSA+IC5hY3RpdmUnKVxuICAgICAgICAgIC5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgICAgICAgLmVuZCgpXG4gICAgICAgIC5maW5kKCdbZGF0YS10b2dnbGU9XCJ0YWJcIl0nKVxuICAgICAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgZmFsc2UpXG5cbiAgICAgIGVsZW1lbnRcbiAgICAgICAgLmFkZENsYXNzKCdhY3RpdmUnKVxuICAgICAgICAuZmluZCgnW2RhdGEtdG9nZ2xlPVwidGFiXCJdJylcbiAgICAgICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIHRydWUpXG5cbiAgICAgIGlmICh0cmFuc2l0aW9uKSB7XG4gICAgICAgIGVsZW1lbnRbMF0ub2Zmc2V0V2lkdGggLy8gcmVmbG93IGZvciB0cmFuc2l0aW9uXG4gICAgICAgIGVsZW1lbnQuYWRkQ2xhc3MoJ2luJylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2ZhZGUnKVxuICAgICAgfVxuXG4gICAgICBpZiAoZWxlbWVudC5wYXJlbnQoJy5kcm9wZG93bi1tZW51JykubGVuZ3RoKSB7XG4gICAgICAgIGVsZW1lbnRcbiAgICAgICAgICAuY2xvc2VzdCgnbGkuZHJvcGRvd24nKVxuICAgICAgICAgICAgLmFkZENsYXNzKCdhY3RpdmUnKVxuICAgICAgICAgIC5lbmQoKVxuICAgICAgICAgIC5maW5kKCdbZGF0YS10b2dnbGU9XCJ0YWJcIl0nKVxuICAgICAgICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCB0cnVlKVxuICAgICAgfVxuXG4gICAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygpXG4gICAgfVxuXG4gICAgJGFjdGl2ZS5sZW5ndGggJiYgdHJhbnNpdGlvbiA/XG4gICAgICAkYWN0aXZlXG4gICAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIG5leHQpXG4gICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChUYWIuVFJBTlNJVElPTl9EVVJBVElPTikgOlxuICAgICAgbmV4dCgpXG5cbiAgICAkYWN0aXZlLnJlbW92ZUNsYXNzKCdpbicpXG4gIH1cblxuXG4gIC8vIFRBQiBQTFVHSU4gREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiBQbHVnaW4ob3B0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSAgPSAkdGhpcy5kYXRhKCdicy50YWInKVxuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLnRhYicsIChkYXRhID0gbmV3IFRhYih0aGlzKSkpXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJykgZGF0YVtvcHRpb25dKClcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4udGFiXG5cbiAgJC5mbi50YWIgICAgICAgICAgICAgPSBQbHVnaW5cbiAgJC5mbi50YWIuQ29uc3RydWN0b3IgPSBUYWJcblxuXG4gIC8vIFRBQiBOTyBDT05GTElDVFxuICAvLyA9PT09PT09PT09PT09PT1cblxuICAkLmZuLnRhYi5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4udGFiID0gb2xkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG5cbiAgLy8gVEFCIERBVEEtQVBJXG4gIC8vID09PT09PT09PT09PVxuXG4gIHZhciBjbGlja0hhbmRsZXIgPSBmdW5jdGlvbiAoZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIFBsdWdpbi5jYWxsKCQodGhpcyksICdzaG93JylcbiAgfVxuXG4gICQoZG9jdW1lbnQpXG4gICAgLm9uKCdjbGljay5icy50YWIuZGF0YS1hcGknLCAnW2RhdGEtdG9nZ2xlPVwidGFiXCJdJywgY2xpY2tIYW5kbGVyKVxuICAgIC5vbignY2xpY2suYnMudGFiLmRhdGEtYXBpJywgJ1tkYXRhLXRvZ2dsZT1cInBpbGxcIl0nLCBjbGlja0hhbmRsZXIpXG5cbn0oalF1ZXJ5KTtcbiIsIi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiBjb2xsYXBzZS5qcyB2My4zLjdcbiAqIGh0dHA6Ly9nZXRib290c3RyYXAuY29tL2phdmFzY3JpcHQvI2NvbGxhcHNlXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTYgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG4vKiBqc2hpbnQgbGF0ZWRlZjogZmFsc2UgKi9cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBDT0xMQVBTRSBQVUJMSUMgQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIHZhciBDb2xsYXBzZSA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCAgICAgID0gJChlbGVtZW50KVxuICAgIHRoaXMub3B0aW9ucyAgICAgICA9ICQuZXh0ZW5kKHt9LCBDb2xsYXBzZS5ERUZBVUxUUywgb3B0aW9ucylcbiAgICB0aGlzLiR0cmlnZ2VyICAgICAgPSAkKCdbZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiXVtocmVmPVwiIycgKyBlbGVtZW50LmlkICsgJ1wiXSwnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICdbZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiXVtkYXRhLXRhcmdldD1cIiMnICsgZWxlbWVudC5pZCArICdcIl0nKVxuICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IG51bGxcblxuICAgIGlmICh0aGlzLm9wdGlvbnMucGFyZW50KSB7XG4gICAgICB0aGlzLiRwYXJlbnQgPSB0aGlzLmdldFBhcmVudCgpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYWRkQXJpYUFuZENvbGxhcHNlZENsYXNzKHRoaXMuJGVsZW1lbnQsIHRoaXMuJHRyaWdnZXIpXG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy50b2dnbGUpIHRoaXMudG9nZ2xlKClcbiAgfVxuXG4gIENvbGxhcHNlLlZFUlNJT04gID0gJzMuMy43J1xuXG4gIENvbGxhcHNlLlRSQU5TSVRJT05fRFVSQVRJT04gPSAzNTBcblxuICBDb2xsYXBzZS5ERUZBVUxUUyA9IHtcbiAgICB0b2dnbGU6IHRydWVcbiAgfVxuXG4gIENvbGxhcHNlLnByb3RvdHlwZS5kaW1lbnNpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGhhc1dpZHRoID0gdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnd2lkdGgnKVxuICAgIHJldHVybiBoYXNXaWR0aCA/ICd3aWR0aCcgOiAnaGVpZ2h0J1xuICB9XG5cbiAgQ29sbGFwc2UucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMudHJhbnNpdGlvbmluZyB8fCB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpbicpKSByZXR1cm5cblxuICAgIHZhciBhY3RpdmVzRGF0YVxuICAgIHZhciBhY3RpdmVzID0gdGhpcy4kcGFyZW50ICYmIHRoaXMuJHBhcmVudC5jaGlsZHJlbignLnBhbmVsJykuY2hpbGRyZW4oJy5pbiwgLmNvbGxhcHNpbmcnKVxuXG4gICAgaWYgKGFjdGl2ZXMgJiYgYWN0aXZlcy5sZW5ndGgpIHtcbiAgICAgIGFjdGl2ZXNEYXRhID0gYWN0aXZlcy5kYXRhKCdicy5jb2xsYXBzZScpXG4gICAgICBpZiAoYWN0aXZlc0RhdGEgJiYgYWN0aXZlc0RhdGEudHJhbnNpdGlvbmluZykgcmV0dXJuXG4gICAgfVxuXG4gICAgdmFyIHN0YXJ0RXZlbnQgPSAkLkV2ZW50KCdzaG93LmJzLmNvbGxhcHNlJylcbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoc3RhcnRFdmVudClcbiAgICBpZiAoc3RhcnRFdmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgcmV0dXJuXG5cbiAgICBpZiAoYWN0aXZlcyAmJiBhY3RpdmVzLmxlbmd0aCkge1xuICAgICAgUGx1Z2luLmNhbGwoYWN0aXZlcywgJ2hpZGUnKVxuICAgICAgYWN0aXZlc0RhdGEgfHwgYWN0aXZlcy5kYXRhKCdicy5jb2xsYXBzZScsIG51bGwpXG4gICAgfVxuXG4gICAgdmFyIGRpbWVuc2lvbiA9IHRoaXMuZGltZW5zaW9uKClcblxuICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5yZW1vdmVDbGFzcygnY29sbGFwc2UnKVxuICAgICAgLmFkZENsYXNzKCdjb2xsYXBzaW5nJylbZGltZW5zaW9uXSgwKVxuICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCB0cnVlKVxuXG4gICAgdGhpcy4kdHJpZ2dlclxuICAgICAgLnJlbW92ZUNsYXNzKCdjb2xsYXBzZWQnKVxuICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCB0cnVlKVxuXG4gICAgdGhpcy50cmFuc2l0aW9uaW5nID0gMVxuXG4gICAgdmFyIGNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2NvbGxhcHNpbmcnKVxuICAgICAgICAuYWRkQ2xhc3MoJ2NvbGxhcHNlIGluJylbZGltZW5zaW9uXSgnJylcbiAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IDBcbiAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgLnRyaWdnZXIoJ3Nob3duLmJzLmNvbGxhcHNlJylcbiAgICB9XG5cbiAgICBpZiAoISQuc3VwcG9ydC50cmFuc2l0aW9uKSByZXR1cm4gY29tcGxldGUuY2FsbCh0aGlzKVxuXG4gICAgdmFyIHNjcm9sbFNpemUgPSAkLmNhbWVsQ2FzZShbJ3Njcm9sbCcsIGRpbWVuc2lvbl0uam9pbignLScpKVxuXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgJC5wcm94eShjb21wbGV0ZSwgdGhpcykpXG4gICAgICAuZW11bGF0ZVRyYW5zaXRpb25FbmQoQ29sbGFwc2UuVFJBTlNJVElPTl9EVVJBVElPTilbZGltZW5zaW9uXSh0aGlzLiRlbGVtZW50WzBdW3Njcm9sbFNpemVdKVxuICB9XG5cbiAgQ29sbGFwc2UucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMudHJhbnNpdGlvbmluZyB8fCAhdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaW4nKSkgcmV0dXJuXG5cbiAgICB2YXIgc3RhcnRFdmVudCA9ICQuRXZlbnQoJ2hpZGUuYnMuY29sbGFwc2UnKVxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcihzdGFydEV2ZW50KVxuICAgIGlmIChzdGFydEV2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgIHZhciBkaW1lbnNpb24gPSB0aGlzLmRpbWVuc2lvbigpXG5cbiAgICB0aGlzLiRlbGVtZW50W2RpbWVuc2lvbl0odGhpcy4kZWxlbWVudFtkaW1lbnNpb25dKCkpWzBdLm9mZnNldEhlaWdodFxuXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLmFkZENsYXNzKCdjb2xsYXBzaW5nJylcbiAgICAgIC5yZW1vdmVDbGFzcygnY29sbGFwc2UgaW4nKVxuICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBmYWxzZSlcblxuICAgIHRoaXMuJHRyaWdnZXJcbiAgICAgIC5hZGRDbGFzcygnY29sbGFwc2VkJylcbiAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgZmFsc2UpXG5cbiAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSAxXG5cbiAgICB2YXIgY29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSAwXG4gICAgICB0aGlzLiRlbGVtZW50XG4gICAgICAgIC5yZW1vdmVDbGFzcygnY29sbGFwc2luZycpXG4gICAgICAgIC5hZGRDbGFzcygnY29sbGFwc2UnKVxuICAgICAgICAudHJpZ2dlcignaGlkZGVuLmJzLmNvbGxhcHNlJylcbiAgICB9XG5cbiAgICBpZiAoISQuc3VwcG9ydC50cmFuc2l0aW9uKSByZXR1cm4gY29tcGxldGUuY2FsbCh0aGlzKVxuXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgW2RpbWVuc2lvbl0oMClcbiAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsICQucHJveHkoY29tcGxldGUsIHRoaXMpKVxuICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKENvbGxhcHNlLlRSQU5TSVRJT05fRFVSQVRJT04pXG4gIH1cblxuICBDb2xsYXBzZS5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXNbdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaW4nKSA/ICdoaWRlJyA6ICdzaG93J10oKVxuICB9XG5cbiAgQ29sbGFwc2UucHJvdG90eXBlLmdldFBhcmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJCh0aGlzLm9wdGlvbnMucGFyZW50KVxuICAgICAgLmZpbmQoJ1tkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCJdW2RhdGEtcGFyZW50PVwiJyArIHRoaXMub3B0aW9ucy5wYXJlbnQgKyAnXCJdJylcbiAgICAgIC5lYWNoKCQucHJveHkoZnVuY3Rpb24gKGksIGVsZW1lbnQpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChlbGVtZW50KVxuICAgICAgICB0aGlzLmFkZEFyaWFBbmRDb2xsYXBzZWRDbGFzcyhnZXRUYXJnZXRGcm9tVHJpZ2dlcigkZWxlbWVudCksICRlbGVtZW50KVxuICAgICAgfSwgdGhpcykpXG4gICAgICAuZW5kKClcbiAgfVxuXG4gIENvbGxhcHNlLnByb3RvdHlwZS5hZGRBcmlhQW5kQ29sbGFwc2VkQ2xhc3MgPSBmdW5jdGlvbiAoJGVsZW1lbnQsICR0cmlnZ2VyKSB7XG4gICAgdmFyIGlzT3BlbiA9ICRlbGVtZW50Lmhhc0NsYXNzKCdpbicpXG5cbiAgICAkZWxlbWVudC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgaXNPcGVuKVxuICAgICR0cmlnZ2VyXG4gICAgICAudG9nZ2xlQ2xhc3MoJ2NvbGxhcHNlZCcsICFpc09wZW4pXG4gICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIGlzT3BlbilcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFRhcmdldEZyb21UcmlnZ2VyKCR0cmlnZ2VyKSB7XG4gICAgdmFyIGhyZWZcbiAgICB2YXIgdGFyZ2V0ID0gJHRyaWdnZXIuYXR0cignZGF0YS10YXJnZXQnKVxuICAgICAgfHwgKGhyZWYgPSAkdHJpZ2dlci5hdHRyKCdocmVmJykpICYmIGhyZWYucmVwbGFjZSgvLiooPz0jW15cXHNdKyQpLywgJycpIC8vIHN0cmlwIGZvciBpZTdcblxuICAgIHJldHVybiAkKHRhcmdldClcbiAgfVxuXG5cbiAgLy8gQ09MTEFQU0UgUExVR0lOIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiBQbHVnaW4ob3B0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgICA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhICAgID0gJHRoaXMuZGF0YSgnYnMuY29sbGFwc2UnKVxuICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgQ29sbGFwc2UuREVGQVVMVFMsICR0aGlzLmRhdGEoKSwgdHlwZW9mIG9wdGlvbiA9PSAnb2JqZWN0JyAmJiBvcHRpb24pXG5cbiAgICAgIGlmICghZGF0YSAmJiBvcHRpb25zLnRvZ2dsZSAmJiAvc2hvd3xoaWRlLy50ZXN0KG9wdGlvbikpIG9wdGlvbnMudG9nZ2xlID0gZmFsc2VcbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMuY29sbGFwc2UnLCAoZGF0YSA9IG5ldyBDb2xsYXBzZSh0aGlzLCBvcHRpb25zKSkpXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJykgZGF0YVtvcHRpb25dKClcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4uY29sbGFwc2VcblxuICAkLmZuLmNvbGxhcHNlICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4uY29sbGFwc2UuQ29uc3RydWN0b3IgPSBDb2xsYXBzZVxuXG5cbiAgLy8gQ09MTEFQU0UgTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT09PT1cblxuICAkLmZuLmNvbGxhcHNlLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi5jb2xsYXBzZSA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIENPTExBUFNFIERBVEEtQVBJXG4gIC8vID09PT09PT09PT09PT09PT09XG5cbiAgJChkb2N1bWVudCkub24oJ2NsaWNrLmJzLmNvbGxhcHNlLmRhdGEtYXBpJywgJ1tkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCJdJywgZnVuY3Rpb24gKGUpIHtcbiAgICB2YXIgJHRoaXMgICA9ICQodGhpcylcblxuICAgIGlmICghJHRoaXMuYXR0cignZGF0YS10YXJnZXQnKSkgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICB2YXIgJHRhcmdldCA9IGdldFRhcmdldEZyb21UcmlnZ2VyKCR0aGlzKVxuICAgIHZhciBkYXRhICAgID0gJHRhcmdldC5kYXRhKCdicy5jb2xsYXBzZScpXG4gICAgdmFyIG9wdGlvbiAgPSBkYXRhID8gJ3RvZ2dsZScgOiAkdGhpcy5kYXRhKClcblxuICAgIFBsdWdpbi5jYWxsKCR0YXJnZXQsIG9wdGlvbilcbiAgfSlcblxufShqUXVlcnkpO1xuIiwiLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IHRyYW5zaXRpb24uanMgdjMuMy43XG4gKiBodHRwOi8vZ2V0Ym9vdHN0cmFwLmNvbS9qYXZhc2NyaXB0LyN0cmFuc2l0aW9uc1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE2IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIENTUyBUUkFOU0lUSU9OIFNVUFBPUlQgKFNob3V0b3V0OiBodHRwOi8vd3d3Lm1vZGVybml6ci5jb20vKVxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiB0cmFuc2l0aW9uRW5kKCkge1xuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2Jvb3RzdHJhcCcpXG5cbiAgICB2YXIgdHJhbnNFbmRFdmVudE5hbWVzID0ge1xuICAgICAgV2Via2l0VHJhbnNpdGlvbiA6ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcbiAgICAgIE1velRyYW5zaXRpb24gICAgOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgICBPVHJhbnNpdGlvbiAgICAgIDogJ29UcmFuc2l0aW9uRW5kIG90cmFuc2l0aW9uZW5kJyxcbiAgICAgIHRyYW5zaXRpb24gICAgICAgOiAndHJhbnNpdGlvbmVuZCdcbiAgICB9XG5cbiAgICBmb3IgKHZhciBuYW1lIGluIHRyYW5zRW5kRXZlbnROYW1lcykge1xuICAgICAgaWYgKGVsLnN0eWxlW25hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHsgZW5kOiB0cmFuc0VuZEV2ZW50TmFtZXNbbmFtZV0gfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZSAvLyBleHBsaWNpdCBmb3IgaWU4ICggIC5fLilcbiAgfVxuXG4gIC8vIGh0dHA6Ly9ibG9nLmFsZXhtYWNjYXcuY29tL2Nzcy10cmFuc2l0aW9uc1xuICAkLmZuLmVtdWxhdGVUcmFuc2l0aW9uRW5kID0gZnVuY3Rpb24gKGR1cmF0aW9uKSB7XG4gICAgdmFyIGNhbGxlZCA9IGZhbHNlXG4gICAgdmFyICRlbCA9IHRoaXNcbiAgICAkKHRoaXMpLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgZnVuY3Rpb24gKCkgeyBjYWxsZWQgPSB0cnVlIH0pXG4gICAgdmFyIGNhbGxiYWNrID0gZnVuY3Rpb24gKCkgeyBpZiAoIWNhbGxlZCkgJCgkZWwpLnRyaWdnZXIoJC5zdXBwb3J0LnRyYW5zaXRpb24uZW5kKSB9XG4gICAgc2V0VGltZW91dChjYWxsYmFjaywgZHVyYXRpb24pXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gICQoZnVuY3Rpb24gKCkge1xuICAgICQuc3VwcG9ydC50cmFuc2l0aW9uID0gdHJhbnNpdGlvbkVuZCgpXG5cbiAgICBpZiAoISQuc3VwcG9ydC50cmFuc2l0aW9uKSByZXR1cm5cblxuICAgICQuZXZlbnQuc3BlY2lhbC5ic1RyYW5zaXRpb25FbmQgPSB7XG4gICAgICBiaW5kVHlwZTogJC5zdXBwb3J0LnRyYW5zaXRpb24uZW5kLFxuICAgICAgZGVsZWdhdGVUeXBlOiAkLnN1cHBvcnQudHJhbnNpdGlvbi5lbmQsXG4gICAgICBoYW5kbGU6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmICgkKGUudGFyZ2V0KS5pcyh0aGlzKSkgcmV0dXJuIGUuaGFuZGxlT2JqLmhhbmRsZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgfVxuICAgIH1cbiAgfSlcblxufShqUXVlcnkpO1xuIiwiLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IHRvb2x0aXAuanMgdjMuMy43XG4gKiBodHRwOi8vZ2V0Ym9vdHN0cmFwLmNvbS9qYXZhc2NyaXB0LyN0b29sdGlwXG4gKiBJbnNwaXJlZCBieSB0aGUgb3JpZ2luYWwgalF1ZXJ5LnRpcHN5IGJ5IEphc29uIEZyYW1lXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTYgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gVE9PTFRJUCBQVUJMSUMgQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgdmFyIFRvb2x0aXAgPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMudHlwZSAgICAgICA9IG51bGxcbiAgICB0aGlzLm9wdGlvbnMgICAgPSBudWxsXG4gICAgdGhpcy5lbmFibGVkICAgID0gbnVsbFxuICAgIHRoaXMudGltZW91dCAgICA9IG51bGxcbiAgICB0aGlzLmhvdmVyU3RhdGUgPSBudWxsXG4gICAgdGhpcy4kZWxlbWVudCAgID0gbnVsbFxuICAgIHRoaXMuaW5TdGF0ZSAgICA9IG51bGxcblxuICAgIHRoaXMuaW5pdCgndG9vbHRpcCcsIGVsZW1lbnQsIG9wdGlvbnMpXG4gIH1cblxuICBUb29sdGlwLlZFUlNJT04gID0gJzMuMy43J1xuXG4gIFRvb2x0aXAuVFJBTlNJVElPTl9EVVJBVElPTiA9IDE1MFxuXG4gIFRvb2x0aXAuREVGQVVMVFMgPSB7XG4gICAgYW5pbWF0aW9uOiB0cnVlLFxuICAgIHBsYWNlbWVudDogJ3RvcCcsXG4gICAgc2VsZWN0b3I6IGZhbHNlLFxuICAgIHRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cInRvb2x0aXBcIiByb2xlPVwidG9vbHRpcFwiPjxkaXYgY2xhc3M9XCJ0b29sdGlwLWFycm93XCI+PC9kaXY+PGRpdiBjbGFzcz1cInRvb2x0aXAtaW5uZXJcIj48L2Rpdj48L2Rpdj4nLFxuICAgIHRyaWdnZXI6ICdob3ZlciBmb2N1cycsXG4gICAgdGl0bGU6ICcnLFxuICAgIGRlbGF5OiAwLFxuICAgIGh0bWw6IGZhbHNlLFxuICAgIGNvbnRhaW5lcjogZmFsc2UsXG4gICAgdmlld3BvcnQ6IHtcbiAgICAgIHNlbGVjdG9yOiAnYm9keScsXG4gICAgICBwYWRkaW5nOiAwXG4gICAgfVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uICh0eXBlLCBlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy5lbmFibGVkICAgPSB0cnVlXG4gICAgdGhpcy50eXBlICAgICAgPSB0eXBlXG4gICAgdGhpcy4kZWxlbWVudCAgPSAkKGVsZW1lbnQpXG4gICAgdGhpcy5vcHRpb25zICAgPSB0aGlzLmdldE9wdGlvbnMob3B0aW9ucylcbiAgICB0aGlzLiR2aWV3cG9ydCA9IHRoaXMub3B0aW9ucy52aWV3cG9ydCAmJiAkKCQuaXNGdW5jdGlvbih0aGlzLm9wdGlvbnMudmlld3BvcnQpID8gdGhpcy5vcHRpb25zLnZpZXdwb3J0LmNhbGwodGhpcywgdGhpcy4kZWxlbWVudCkgOiAodGhpcy5vcHRpb25zLnZpZXdwb3J0LnNlbGVjdG9yIHx8IHRoaXMub3B0aW9ucy52aWV3cG9ydCkpXG4gICAgdGhpcy5pblN0YXRlICAgPSB7IGNsaWNrOiBmYWxzZSwgaG92ZXI6IGZhbHNlLCBmb2N1czogZmFsc2UgfVxuXG4gICAgaWYgKHRoaXMuJGVsZW1lbnRbMF0gaW5zdGFuY2VvZiBkb2N1bWVudC5jb25zdHJ1Y3RvciAmJiAhdGhpcy5vcHRpb25zLnNlbGVjdG9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2BzZWxlY3RvcmAgb3B0aW9uIG11c3QgYmUgc3BlY2lmaWVkIHdoZW4gaW5pdGlhbGl6aW5nICcgKyB0aGlzLnR5cGUgKyAnIG9uIHRoZSB3aW5kb3cuZG9jdW1lbnQgb2JqZWN0IScpXG4gICAgfVxuXG4gICAgdmFyIHRyaWdnZXJzID0gdGhpcy5vcHRpb25zLnRyaWdnZXIuc3BsaXQoJyAnKVxuXG4gICAgZm9yICh2YXIgaSA9IHRyaWdnZXJzLmxlbmd0aDsgaS0tOykge1xuICAgICAgdmFyIHRyaWdnZXIgPSB0cmlnZ2Vyc1tpXVxuXG4gICAgICBpZiAodHJpZ2dlciA9PSAnY2xpY2snKSB7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQub24oJ2NsaWNrLicgKyB0aGlzLnR5cGUsIHRoaXMub3B0aW9ucy5zZWxlY3RvciwgJC5wcm94eSh0aGlzLnRvZ2dsZSwgdGhpcykpXG4gICAgICB9IGVsc2UgaWYgKHRyaWdnZXIgIT0gJ21hbnVhbCcpIHtcbiAgICAgICAgdmFyIGV2ZW50SW4gID0gdHJpZ2dlciA9PSAnaG92ZXInID8gJ21vdXNlZW50ZXInIDogJ2ZvY3VzaW4nXG4gICAgICAgIHZhciBldmVudE91dCA9IHRyaWdnZXIgPT0gJ2hvdmVyJyA/ICdtb3VzZWxlYXZlJyA6ICdmb2N1c291dCdcblxuICAgICAgICB0aGlzLiRlbGVtZW50Lm9uKGV2ZW50SW4gICsgJy4nICsgdGhpcy50eXBlLCB0aGlzLm9wdGlvbnMuc2VsZWN0b3IsICQucHJveHkodGhpcy5lbnRlciwgdGhpcykpXG4gICAgICAgIHRoaXMuJGVsZW1lbnQub24oZXZlbnRPdXQgKyAnLicgKyB0aGlzLnR5cGUsIHRoaXMub3B0aW9ucy5zZWxlY3RvciwgJC5wcm94eSh0aGlzLmxlYXZlLCB0aGlzKSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLm9wdGlvbnMuc2VsZWN0b3IgP1xuICAgICAgKHRoaXMuX29wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCB7IHRyaWdnZXI6ICdtYW51YWwnLCBzZWxlY3RvcjogJycgfSkpIDpcbiAgICAgIHRoaXMuZml4VGl0bGUoKVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZ2V0RGVmYXVsdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFRvb2x0aXAuREVGQVVMVFNcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdGhpcy5nZXREZWZhdWx0cygpLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucylcblxuICAgIGlmIChvcHRpb25zLmRlbGF5ICYmIHR5cGVvZiBvcHRpb25zLmRlbGF5ID09ICdudW1iZXInKSB7XG4gICAgICBvcHRpb25zLmRlbGF5ID0ge1xuICAgICAgICBzaG93OiBvcHRpb25zLmRlbGF5LFxuICAgICAgICBoaWRlOiBvcHRpb25zLmRlbGF5XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG9wdGlvbnNcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldERlbGVnYXRlT3B0aW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgb3B0aW9ucyAgPSB7fVxuICAgIHZhciBkZWZhdWx0cyA9IHRoaXMuZ2V0RGVmYXVsdHMoKVxuXG4gICAgdGhpcy5fb3B0aW9ucyAmJiAkLmVhY2godGhpcy5fb3B0aW9ucywgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgIGlmIChkZWZhdWx0c1trZXldICE9IHZhbHVlKSBvcHRpb25zW2tleV0gPSB2YWx1ZVxuICAgIH0pXG5cbiAgICByZXR1cm4gb3B0aW9uc1xuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZW50ZXIgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHNlbGYgPSBvYmogaW5zdGFuY2VvZiB0aGlzLmNvbnN0cnVjdG9yID9cbiAgICAgIG9iaiA6ICQob2JqLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ2JzLicgKyB0aGlzLnR5cGUpXG5cbiAgICBpZiAoIXNlbGYpIHtcbiAgICAgIHNlbGYgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcihvYmouY3VycmVudFRhcmdldCwgdGhpcy5nZXREZWxlZ2F0ZU9wdGlvbnMoKSlcbiAgICAgICQob2JqLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ2JzLicgKyB0aGlzLnR5cGUsIHNlbGYpXG4gICAgfVxuXG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mICQuRXZlbnQpIHtcbiAgICAgIHNlbGYuaW5TdGF0ZVtvYmoudHlwZSA9PSAnZm9jdXNpbicgPyAnZm9jdXMnIDogJ2hvdmVyJ10gPSB0cnVlXG4gICAgfVxuXG4gICAgaWYgKHNlbGYudGlwKCkuaGFzQ2xhc3MoJ2luJykgfHwgc2VsZi5ob3ZlclN0YXRlID09ICdpbicpIHtcbiAgICAgIHNlbGYuaG92ZXJTdGF0ZSA9ICdpbidcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNsZWFyVGltZW91dChzZWxmLnRpbWVvdXQpXG5cbiAgICBzZWxmLmhvdmVyU3RhdGUgPSAnaW4nXG5cbiAgICBpZiAoIXNlbGYub3B0aW9ucy5kZWxheSB8fCAhc2VsZi5vcHRpb25zLmRlbGF5LnNob3cpIHJldHVybiBzZWxmLnNob3coKVxuXG4gICAgc2VsZi50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoc2VsZi5ob3ZlclN0YXRlID09ICdpbicpIHNlbGYuc2hvdygpXG4gICAgfSwgc2VsZi5vcHRpb25zLmRlbGF5LnNob3cpXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5pc0luU3RhdGVUcnVlID0gZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIGtleSBpbiB0aGlzLmluU3RhdGUpIHtcbiAgICAgIGlmICh0aGlzLmluU3RhdGVba2V5XSkgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmxlYXZlID0gZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciBzZWxmID0gb2JqIGluc3RhbmNlb2YgdGhpcy5jb25zdHJ1Y3RvciA/XG4gICAgICBvYmogOiAkKG9iai5jdXJyZW50VGFyZ2V0KS5kYXRhKCdicy4nICsgdGhpcy50eXBlKVxuXG4gICAgaWYgKCFzZWxmKSB7XG4gICAgICBzZWxmID0gbmV3IHRoaXMuY29uc3RydWN0b3Iob2JqLmN1cnJlbnRUYXJnZXQsIHRoaXMuZ2V0RGVsZWdhdGVPcHRpb25zKCkpXG4gICAgICAkKG9iai5jdXJyZW50VGFyZ2V0KS5kYXRhKCdicy4nICsgdGhpcy50eXBlLCBzZWxmKVxuICAgIH1cblxuICAgIGlmIChvYmogaW5zdGFuY2VvZiAkLkV2ZW50KSB7XG4gICAgICBzZWxmLmluU3RhdGVbb2JqLnR5cGUgPT0gJ2ZvY3Vzb3V0JyA/ICdmb2N1cycgOiAnaG92ZXInXSA9IGZhbHNlXG4gICAgfVxuXG4gICAgaWYgKHNlbGYuaXNJblN0YXRlVHJ1ZSgpKSByZXR1cm5cblxuICAgIGNsZWFyVGltZW91dChzZWxmLnRpbWVvdXQpXG5cbiAgICBzZWxmLmhvdmVyU3RhdGUgPSAnb3V0J1xuXG4gICAgaWYgKCFzZWxmLm9wdGlvbnMuZGVsYXkgfHwgIXNlbGYub3B0aW9ucy5kZWxheS5oaWRlKSByZXR1cm4gc2VsZi5oaWRlKClcblxuICAgIHNlbGYudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHNlbGYuaG92ZXJTdGF0ZSA9PSAnb3V0Jykgc2VsZi5oaWRlKClcbiAgICB9LCBzZWxmLm9wdGlvbnMuZGVsYXkuaGlkZSlcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGUgPSAkLkV2ZW50KCdzaG93LmJzLicgKyB0aGlzLnR5cGUpXG5cbiAgICBpZiAodGhpcy5oYXNDb250ZW50KCkgJiYgdGhpcy5lbmFibGVkKSB7XG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoZSlcblxuICAgICAgdmFyIGluRG9tID0gJC5jb250YWlucyh0aGlzLiRlbGVtZW50WzBdLm93bmVyRG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCB0aGlzLiRlbGVtZW50WzBdKVxuICAgICAgaWYgKGUuaXNEZWZhdWx0UHJldmVudGVkKCkgfHwgIWluRG9tKSByZXR1cm5cbiAgICAgIHZhciB0aGF0ID0gdGhpc1xuXG4gICAgICB2YXIgJHRpcCA9IHRoaXMudGlwKClcblxuICAgICAgdmFyIHRpcElkID0gdGhpcy5nZXRVSUQodGhpcy50eXBlKVxuXG4gICAgICB0aGlzLnNldENvbnRlbnQoKVxuICAgICAgJHRpcC5hdHRyKCdpZCcsIHRpcElkKVxuICAgICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWRlc2NyaWJlZGJ5JywgdGlwSWQpXG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuYW5pbWF0aW9uKSAkdGlwLmFkZENsYXNzKCdmYWRlJylcblxuICAgICAgdmFyIHBsYWNlbWVudCA9IHR5cGVvZiB0aGlzLm9wdGlvbnMucGxhY2VtZW50ID09ICdmdW5jdGlvbicgP1xuICAgICAgICB0aGlzLm9wdGlvbnMucGxhY2VtZW50LmNhbGwodGhpcywgJHRpcFswXSwgdGhpcy4kZWxlbWVudFswXSkgOlxuICAgICAgICB0aGlzLm9wdGlvbnMucGxhY2VtZW50XG5cbiAgICAgIHZhciBhdXRvVG9rZW4gPSAvXFxzP2F1dG8/XFxzPy9pXG4gICAgICB2YXIgYXV0b1BsYWNlID0gYXV0b1Rva2VuLnRlc3QocGxhY2VtZW50KVxuICAgICAgaWYgKGF1dG9QbGFjZSkgcGxhY2VtZW50ID0gcGxhY2VtZW50LnJlcGxhY2UoYXV0b1Rva2VuLCAnJykgfHwgJ3RvcCdcblxuICAgICAgJHRpcFxuICAgICAgICAuZGV0YWNoKClcbiAgICAgICAgLmNzcyh7IHRvcDogMCwgbGVmdDogMCwgZGlzcGxheTogJ2Jsb2NrJyB9KVxuICAgICAgICAuYWRkQ2xhc3MocGxhY2VtZW50KVxuICAgICAgICAuZGF0YSgnYnMuJyArIHRoaXMudHlwZSwgdGhpcylcblxuICAgICAgdGhpcy5vcHRpb25zLmNvbnRhaW5lciA/ICR0aXAuYXBwZW5kVG8odGhpcy5vcHRpb25zLmNvbnRhaW5lcikgOiAkdGlwLmluc2VydEFmdGVyKHRoaXMuJGVsZW1lbnQpXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2luc2VydGVkLmJzLicgKyB0aGlzLnR5cGUpXG5cbiAgICAgIHZhciBwb3MgICAgICAgICAgPSB0aGlzLmdldFBvc2l0aW9uKClcbiAgICAgIHZhciBhY3R1YWxXaWR0aCAgPSAkdGlwWzBdLm9mZnNldFdpZHRoXG4gICAgICB2YXIgYWN0dWFsSGVpZ2h0ID0gJHRpcFswXS5vZmZzZXRIZWlnaHRcblxuICAgICAgaWYgKGF1dG9QbGFjZSkge1xuICAgICAgICB2YXIgb3JnUGxhY2VtZW50ID0gcGxhY2VtZW50XG4gICAgICAgIHZhciB2aWV3cG9ydERpbSA9IHRoaXMuZ2V0UG9zaXRpb24odGhpcy4kdmlld3BvcnQpXG5cbiAgICAgICAgcGxhY2VtZW50ID0gcGxhY2VtZW50ID09ICdib3R0b20nICYmIHBvcy5ib3R0b20gKyBhY3R1YWxIZWlnaHQgPiB2aWV3cG9ydERpbS5ib3R0b20gPyAndG9wJyAgICA6XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlbWVudCA9PSAndG9wJyAgICAmJiBwb3MudG9wICAgIC0gYWN0dWFsSGVpZ2h0IDwgdmlld3BvcnREaW0udG9wICAgID8gJ2JvdHRvbScgOlxuICAgICAgICAgICAgICAgICAgICBwbGFjZW1lbnQgPT0gJ3JpZ2h0JyAgJiYgcG9zLnJpZ2h0ICArIGFjdHVhbFdpZHRoICA+IHZpZXdwb3J0RGltLndpZHRoICA/ICdsZWZ0JyAgIDpcbiAgICAgICAgICAgICAgICAgICAgcGxhY2VtZW50ID09ICdsZWZ0JyAgICYmIHBvcy5sZWZ0ICAgLSBhY3R1YWxXaWR0aCAgPCB2aWV3cG9ydERpbS5sZWZ0ICAgPyAncmlnaHQnICA6XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlbWVudFxuXG4gICAgICAgICR0aXBcbiAgICAgICAgICAucmVtb3ZlQ2xhc3Mob3JnUGxhY2VtZW50KVxuICAgICAgICAgIC5hZGRDbGFzcyhwbGFjZW1lbnQpXG4gICAgICB9XG5cbiAgICAgIHZhciBjYWxjdWxhdGVkT2Zmc2V0ID0gdGhpcy5nZXRDYWxjdWxhdGVkT2Zmc2V0KHBsYWNlbWVudCwgcG9zLCBhY3R1YWxXaWR0aCwgYWN0dWFsSGVpZ2h0KVxuXG4gICAgICB0aGlzLmFwcGx5UGxhY2VtZW50KGNhbGN1bGF0ZWRPZmZzZXQsIHBsYWNlbWVudClcblxuICAgICAgdmFyIGNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcHJldkhvdmVyU3RhdGUgPSB0aGF0LmhvdmVyU3RhdGVcbiAgICAgICAgdGhhdC4kZWxlbWVudC50cmlnZ2VyKCdzaG93bi5icy4nICsgdGhhdC50eXBlKVxuICAgICAgICB0aGF0LmhvdmVyU3RhdGUgPSBudWxsXG5cbiAgICAgICAgaWYgKHByZXZIb3ZlclN0YXRlID09ICdvdXQnKSB0aGF0LmxlYXZlKHRoYXQpXG4gICAgICB9XG5cbiAgICAgICQuc3VwcG9ydC50cmFuc2l0aW9uICYmIHRoaXMuJHRpcC5oYXNDbGFzcygnZmFkZScpID9cbiAgICAgICAgJHRpcFxuICAgICAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIGNvbXBsZXRlKVxuICAgICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChUb29sdGlwLlRSQU5TSVRJT05fRFVSQVRJT04pIDpcbiAgICAgICAgY29tcGxldGUoKVxuICAgIH1cbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmFwcGx5UGxhY2VtZW50ID0gZnVuY3Rpb24gKG9mZnNldCwgcGxhY2VtZW50KSB7XG4gICAgdmFyICR0aXAgICA9IHRoaXMudGlwKClcbiAgICB2YXIgd2lkdGggID0gJHRpcFswXS5vZmZzZXRXaWR0aFxuICAgIHZhciBoZWlnaHQgPSAkdGlwWzBdLm9mZnNldEhlaWdodFxuXG4gICAgLy8gbWFudWFsbHkgcmVhZCBtYXJnaW5zIGJlY2F1c2UgZ2V0Qm91bmRpbmdDbGllbnRSZWN0IGluY2x1ZGVzIGRpZmZlcmVuY2VcbiAgICB2YXIgbWFyZ2luVG9wID0gcGFyc2VJbnQoJHRpcC5jc3MoJ21hcmdpbi10b3AnKSwgMTApXG4gICAgdmFyIG1hcmdpbkxlZnQgPSBwYXJzZUludCgkdGlwLmNzcygnbWFyZ2luLWxlZnQnKSwgMTApXG5cbiAgICAvLyB3ZSBtdXN0IGNoZWNrIGZvciBOYU4gZm9yIGllIDgvOVxuICAgIGlmIChpc05hTihtYXJnaW5Ub3ApKSAgbWFyZ2luVG9wICA9IDBcbiAgICBpZiAoaXNOYU4obWFyZ2luTGVmdCkpIG1hcmdpbkxlZnQgPSAwXG5cbiAgICBvZmZzZXQudG9wICArPSBtYXJnaW5Ub3BcbiAgICBvZmZzZXQubGVmdCArPSBtYXJnaW5MZWZ0XG5cbiAgICAvLyAkLmZuLm9mZnNldCBkb2Vzbid0IHJvdW5kIHBpeGVsIHZhbHVlc1xuICAgIC8vIHNvIHdlIHVzZSBzZXRPZmZzZXQgZGlyZWN0bHkgd2l0aCBvdXIgb3duIGZ1bmN0aW9uIEItMFxuICAgICQub2Zmc2V0LnNldE9mZnNldCgkdGlwWzBdLCAkLmV4dGVuZCh7XG4gICAgICB1c2luZzogZnVuY3Rpb24gKHByb3BzKSB7XG4gICAgICAgICR0aXAuY3NzKHtcbiAgICAgICAgICB0b3A6IE1hdGgucm91bmQocHJvcHMudG9wKSxcbiAgICAgICAgICBsZWZ0OiBNYXRoLnJvdW5kKHByb3BzLmxlZnQpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSwgb2Zmc2V0KSwgMClcblxuICAgICR0aXAuYWRkQ2xhc3MoJ2luJylcblxuICAgIC8vIGNoZWNrIHRvIHNlZSBpZiBwbGFjaW5nIHRpcCBpbiBuZXcgb2Zmc2V0IGNhdXNlZCB0aGUgdGlwIHRvIHJlc2l6ZSBpdHNlbGZcbiAgICB2YXIgYWN0dWFsV2lkdGggID0gJHRpcFswXS5vZmZzZXRXaWR0aFxuICAgIHZhciBhY3R1YWxIZWlnaHQgPSAkdGlwWzBdLm9mZnNldEhlaWdodFxuXG4gICAgaWYgKHBsYWNlbWVudCA9PSAndG9wJyAmJiBhY3R1YWxIZWlnaHQgIT0gaGVpZ2h0KSB7XG4gICAgICBvZmZzZXQudG9wID0gb2Zmc2V0LnRvcCArIGhlaWdodCAtIGFjdHVhbEhlaWdodFxuICAgIH1cblxuICAgIHZhciBkZWx0YSA9IHRoaXMuZ2V0Vmlld3BvcnRBZGp1c3RlZERlbHRhKHBsYWNlbWVudCwgb2Zmc2V0LCBhY3R1YWxXaWR0aCwgYWN0dWFsSGVpZ2h0KVxuXG4gICAgaWYgKGRlbHRhLmxlZnQpIG9mZnNldC5sZWZ0ICs9IGRlbHRhLmxlZnRcbiAgICBlbHNlIG9mZnNldC50b3AgKz0gZGVsdGEudG9wXG5cbiAgICB2YXIgaXNWZXJ0aWNhbCAgICAgICAgICA9IC90b3B8Ym90dG9tLy50ZXN0KHBsYWNlbWVudClcbiAgICB2YXIgYXJyb3dEZWx0YSAgICAgICAgICA9IGlzVmVydGljYWwgPyBkZWx0YS5sZWZ0ICogMiAtIHdpZHRoICsgYWN0dWFsV2lkdGggOiBkZWx0YS50b3AgKiAyIC0gaGVpZ2h0ICsgYWN0dWFsSGVpZ2h0XG4gICAgdmFyIGFycm93T2Zmc2V0UG9zaXRpb24gPSBpc1ZlcnRpY2FsID8gJ29mZnNldFdpZHRoJyA6ICdvZmZzZXRIZWlnaHQnXG5cbiAgICAkdGlwLm9mZnNldChvZmZzZXQpXG4gICAgdGhpcy5yZXBsYWNlQXJyb3coYXJyb3dEZWx0YSwgJHRpcFswXVthcnJvd09mZnNldFBvc2l0aW9uXSwgaXNWZXJ0aWNhbClcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLnJlcGxhY2VBcnJvdyA9IGZ1bmN0aW9uIChkZWx0YSwgZGltZW5zaW9uLCBpc1ZlcnRpY2FsKSB7XG4gICAgdGhpcy5hcnJvdygpXG4gICAgICAuY3NzKGlzVmVydGljYWwgPyAnbGVmdCcgOiAndG9wJywgNTAgKiAoMSAtIGRlbHRhIC8gZGltZW5zaW9uKSArICclJylcbiAgICAgIC5jc3MoaXNWZXJ0aWNhbCA/ICd0b3AnIDogJ2xlZnQnLCAnJylcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLnNldENvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICR0aXAgID0gdGhpcy50aXAoKVxuICAgIHZhciB0aXRsZSA9IHRoaXMuZ2V0VGl0bGUoKVxuXG4gICAgJHRpcC5maW5kKCcudG9vbHRpcC1pbm5lcicpW3RoaXMub3B0aW9ucy5odG1sID8gJ2h0bWwnIDogJ3RleHQnXSh0aXRsZSlcbiAgICAkdGlwLnJlbW92ZUNsYXNzKCdmYWRlIGluIHRvcCBib3R0b20gbGVmdCByaWdodCcpXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzXG4gICAgdmFyICR0aXAgPSAkKHRoaXMuJHRpcClcbiAgICB2YXIgZSAgICA9ICQuRXZlbnQoJ2hpZGUuYnMuJyArIHRoaXMudHlwZSlcblxuICAgIGZ1bmN0aW9uIGNvbXBsZXRlKCkge1xuICAgICAgaWYgKHRoYXQuaG92ZXJTdGF0ZSAhPSAnaW4nKSAkdGlwLmRldGFjaCgpXG4gICAgICBpZiAodGhhdC4kZWxlbWVudCkgeyAvLyBUT0RPOiBDaGVjayB3aGV0aGVyIGd1YXJkaW5nIHRoaXMgY29kZSB3aXRoIHRoaXMgYGlmYCBpcyByZWFsbHkgbmVjZXNzYXJ5LlxuICAgICAgICB0aGF0LiRlbGVtZW50XG4gICAgICAgICAgLnJlbW92ZUF0dHIoJ2FyaWEtZGVzY3JpYmVkYnknKVxuICAgICAgICAgIC50cmlnZ2VyKCdoaWRkZW4uYnMuJyArIHRoYXQudHlwZSlcbiAgICAgIH1cbiAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKClcbiAgICB9XG5cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoZSlcblxuICAgIGlmIChlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgICR0aXAucmVtb3ZlQ2xhc3MoJ2luJylcblxuICAgICQuc3VwcG9ydC50cmFuc2l0aW9uICYmICR0aXAuaGFzQ2xhc3MoJ2ZhZGUnKSA/XG4gICAgICAkdGlwXG4gICAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIGNvbXBsZXRlKVxuICAgICAgICAuZW11bGF0ZVRyYW5zaXRpb25FbmQoVG9vbHRpcC5UUkFOU0lUSU9OX0RVUkFUSU9OKSA6XG4gICAgICBjb21wbGV0ZSgpXG5cbiAgICB0aGlzLmhvdmVyU3RhdGUgPSBudWxsXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZml4VGl0bGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICRlID0gdGhpcy4kZWxlbWVudFxuICAgIGlmICgkZS5hdHRyKCd0aXRsZScpIHx8IHR5cGVvZiAkZS5hdHRyKCdkYXRhLW9yaWdpbmFsLXRpdGxlJykgIT0gJ3N0cmluZycpIHtcbiAgICAgICRlLmF0dHIoJ2RhdGEtb3JpZ2luYWwtdGl0bGUnLCAkZS5hdHRyKCd0aXRsZScpIHx8ICcnKS5hdHRyKCd0aXRsZScsICcnKVxuICAgIH1cbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmhhc0NvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0VGl0bGUoKVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZ2V0UG9zaXRpb24gPSBmdW5jdGlvbiAoJGVsZW1lbnQpIHtcbiAgICAkZWxlbWVudCAgID0gJGVsZW1lbnQgfHwgdGhpcy4kZWxlbWVudFxuXG4gICAgdmFyIGVsICAgICA9ICRlbGVtZW50WzBdXG4gICAgdmFyIGlzQm9keSA9IGVsLnRhZ05hbWUgPT0gJ0JPRFknXG5cbiAgICB2YXIgZWxSZWN0ICAgID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICBpZiAoZWxSZWN0LndpZHRoID09IG51bGwpIHtcbiAgICAgIC8vIHdpZHRoIGFuZCBoZWlnaHQgYXJlIG1pc3NpbmcgaW4gSUU4LCBzbyBjb21wdXRlIHRoZW0gbWFudWFsbHk7IHNlZSBodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvaXNzdWVzLzE0MDkzXG4gICAgICBlbFJlY3QgPSAkLmV4dGVuZCh7fSwgZWxSZWN0LCB7IHdpZHRoOiBlbFJlY3QucmlnaHQgLSBlbFJlY3QubGVmdCwgaGVpZ2h0OiBlbFJlY3QuYm90dG9tIC0gZWxSZWN0LnRvcCB9KVxuICAgIH1cbiAgICB2YXIgaXNTdmcgPSB3aW5kb3cuU1ZHRWxlbWVudCAmJiBlbCBpbnN0YW5jZW9mIHdpbmRvdy5TVkdFbGVtZW50XG4gICAgLy8gQXZvaWQgdXNpbmcgJC5vZmZzZXQoKSBvbiBTVkdzIHNpbmNlIGl0IGdpdmVzIGluY29ycmVjdCByZXN1bHRzIGluIGpRdWVyeSAzLlxuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvaXNzdWVzLzIwMjgwXG4gICAgdmFyIGVsT2Zmc2V0ICA9IGlzQm9keSA/IHsgdG9wOiAwLCBsZWZ0OiAwIH0gOiAoaXNTdmcgPyBudWxsIDogJGVsZW1lbnQub2Zmc2V0KCkpXG4gICAgdmFyIHNjcm9sbCAgICA9IHsgc2Nyb2xsOiBpc0JvZHkgPyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wIHx8IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wIDogJGVsZW1lbnQuc2Nyb2xsVG9wKCkgfVxuICAgIHZhciBvdXRlckRpbXMgPSBpc0JvZHkgPyB7IHdpZHRoOiAkKHdpbmRvdykud2lkdGgoKSwgaGVpZ2h0OiAkKHdpbmRvdykuaGVpZ2h0KCkgfSA6IG51bGxcblxuICAgIHJldHVybiAkLmV4dGVuZCh7fSwgZWxSZWN0LCBzY3JvbGwsIG91dGVyRGltcywgZWxPZmZzZXQpXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5nZXRDYWxjdWxhdGVkT2Zmc2V0ID0gZnVuY3Rpb24gKHBsYWNlbWVudCwgcG9zLCBhY3R1YWxXaWR0aCwgYWN0dWFsSGVpZ2h0KSB7XG4gICAgcmV0dXJuIHBsYWNlbWVudCA9PSAnYm90dG9tJyA/IHsgdG9wOiBwb3MudG9wICsgcG9zLmhlaWdodCwgICBsZWZ0OiBwb3MubGVmdCArIHBvcy53aWR0aCAvIDIgLSBhY3R1YWxXaWR0aCAvIDIgfSA6XG4gICAgICAgICAgIHBsYWNlbWVudCA9PSAndG9wJyAgICA/IHsgdG9wOiBwb3MudG9wIC0gYWN0dWFsSGVpZ2h0LCBsZWZ0OiBwb3MubGVmdCArIHBvcy53aWR0aCAvIDIgLSBhY3R1YWxXaWR0aCAvIDIgfSA6XG4gICAgICAgICAgIHBsYWNlbWVudCA9PSAnbGVmdCcgICA/IHsgdG9wOiBwb3MudG9wICsgcG9zLmhlaWdodCAvIDIgLSBhY3R1YWxIZWlnaHQgLyAyLCBsZWZ0OiBwb3MubGVmdCAtIGFjdHVhbFdpZHRoIH0gOlxuICAgICAgICAvKiBwbGFjZW1lbnQgPT0gJ3JpZ2h0JyAqLyB7IHRvcDogcG9zLnRvcCArIHBvcy5oZWlnaHQgLyAyIC0gYWN0dWFsSGVpZ2h0IC8gMiwgbGVmdDogcG9zLmxlZnQgKyBwb3Mud2lkdGggfVxuXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5nZXRWaWV3cG9ydEFkanVzdGVkRGVsdGEgPSBmdW5jdGlvbiAocGxhY2VtZW50LCBwb3MsIGFjdHVhbFdpZHRoLCBhY3R1YWxIZWlnaHQpIHtcbiAgICB2YXIgZGVsdGEgPSB7IHRvcDogMCwgbGVmdDogMCB9XG4gICAgaWYgKCF0aGlzLiR2aWV3cG9ydCkgcmV0dXJuIGRlbHRhXG5cbiAgICB2YXIgdmlld3BvcnRQYWRkaW5nID0gdGhpcy5vcHRpb25zLnZpZXdwb3J0ICYmIHRoaXMub3B0aW9ucy52aWV3cG9ydC5wYWRkaW5nIHx8IDBcbiAgICB2YXIgdmlld3BvcnREaW1lbnNpb25zID0gdGhpcy5nZXRQb3NpdGlvbih0aGlzLiR2aWV3cG9ydClcblxuICAgIGlmICgvcmlnaHR8bGVmdC8udGVzdChwbGFjZW1lbnQpKSB7XG4gICAgICB2YXIgdG9wRWRnZU9mZnNldCAgICA9IHBvcy50b3AgLSB2aWV3cG9ydFBhZGRpbmcgLSB2aWV3cG9ydERpbWVuc2lvbnMuc2Nyb2xsXG4gICAgICB2YXIgYm90dG9tRWRnZU9mZnNldCA9IHBvcy50b3AgKyB2aWV3cG9ydFBhZGRpbmcgLSB2aWV3cG9ydERpbWVuc2lvbnMuc2Nyb2xsICsgYWN0dWFsSGVpZ2h0XG4gICAgICBpZiAodG9wRWRnZU9mZnNldCA8IHZpZXdwb3J0RGltZW5zaW9ucy50b3ApIHsgLy8gdG9wIG92ZXJmbG93XG4gICAgICAgIGRlbHRhLnRvcCA9IHZpZXdwb3J0RGltZW5zaW9ucy50b3AgLSB0b3BFZGdlT2Zmc2V0XG4gICAgICB9IGVsc2UgaWYgKGJvdHRvbUVkZ2VPZmZzZXQgPiB2aWV3cG9ydERpbWVuc2lvbnMudG9wICsgdmlld3BvcnREaW1lbnNpb25zLmhlaWdodCkgeyAvLyBib3R0b20gb3ZlcmZsb3dcbiAgICAgICAgZGVsdGEudG9wID0gdmlld3BvcnREaW1lbnNpb25zLnRvcCArIHZpZXdwb3J0RGltZW5zaW9ucy5oZWlnaHQgLSBib3R0b21FZGdlT2Zmc2V0XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBsZWZ0RWRnZU9mZnNldCAgPSBwb3MubGVmdCAtIHZpZXdwb3J0UGFkZGluZ1xuICAgICAgdmFyIHJpZ2h0RWRnZU9mZnNldCA9IHBvcy5sZWZ0ICsgdmlld3BvcnRQYWRkaW5nICsgYWN0dWFsV2lkdGhcbiAgICAgIGlmIChsZWZ0RWRnZU9mZnNldCA8IHZpZXdwb3J0RGltZW5zaW9ucy5sZWZ0KSB7IC8vIGxlZnQgb3ZlcmZsb3dcbiAgICAgICAgZGVsdGEubGVmdCA9IHZpZXdwb3J0RGltZW5zaW9ucy5sZWZ0IC0gbGVmdEVkZ2VPZmZzZXRcbiAgICAgIH0gZWxzZSBpZiAocmlnaHRFZGdlT2Zmc2V0ID4gdmlld3BvcnREaW1lbnNpb25zLnJpZ2h0KSB7IC8vIHJpZ2h0IG92ZXJmbG93XG4gICAgICAgIGRlbHRhLmxlZnQgPSB2aWV3cG9ydERpbWVuc2lvbnMubGVmdCArIHZpZXdwb3J0RGltZW5zaW9ucy53aWR0aCAtIHJpZ2h0RWRnZU9mZnNldFxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkZWx0YVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZ2V0VGl0bGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRpdGxlXG4gICAgdmFyICRlID0gdGhpcy4kZWxlbWVudFxuICAgIHZhciBvICA9IHRoaXMub3B0aW9uc1xuXG4gICAgdGl0bGUgPSAkZS5hdHRyKCdkYXRhLW9yaWdpbmFsLXRpdGxlJylcbiAgICAgIHx8ICh0eXBlb2Ygby50aXRsZSA9PSAnZnVuY3Rpb24nID8gby50aXRsZS5jYWxsKCRlWzBdKSA6ICBvLnRpdGxlKVxuXG4gICAgcmV0dXJuIHRpdGxlXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5nZXRVSUQgPSBmdW5jdGlvbiAocHJlZml4KSB7XG4gICAgZG8gcHJlZml4ICs9IH5+KE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwKVxuICAgIHdoaWxlIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChwcmVmaXgpKVxuICAgIHJldHVybiBwcmVmaXhcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLnRpcCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuJHRpcCkge1xuICAgICAgdGhpcy4kdGlwID0gJCh0aGlzLm9wdGlvbnMudGVtcGxhdGUpXG4gICAgICBpZiAodGhpcy4kdGlwLmxlbmd0aCAhPSAxKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcih0aGlzLnR5cGUgKyAnIGB0ZW1wbGF0ZWAgb3B0aW9uIG11c3QgY29uc2lzdCBvZiBleGFjdGx5IDEgdG9wLWxldmVsIGVsZW1lbnQhJylcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuJHRpcFxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuYXJyb3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLiRhcnJvdyA9IHRoaXMuJGFycm93IHx8IHRoaXMudGlwKCkuZmluZCgnLnRvb2x0aXAtYXJyb3cnKSlcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmVuYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmVuYWJsZWQgPSB0cnVlXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5kaXNhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS50b2dnbGVFbmFibGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZW5hYmxlZCA9ICF0aGlzLmVuYWJsZWRcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgaWYgKGUpIHtcbiAgICAgIHNlbGYgPSAkKGUuY3VycmVudFRhcmdldCkuZGF0YSgnYnMuJyArIHRoaXMudHlwZSlcbiAgICAgIGlmICghc2VsZikge1xuICAgICAgICBzZWxmID0gbmV3IHRoaXMuY29uc3RydWN0b3IoZS5jdXJyZW50VGFyZ2V0LCB0aGlzLmdldERlbGVnYXRlT3B0aW9ucygpKVxuICAgICAgICAkKGUuY3VycmVudFRhcmdldCkuZGF0YSgnYnMuJyArIHRoaXMudHlwZSwgc2VsZilcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZSkge1xuICAgICAgc2VsZi5pblN0YXRlLmNsaWNrID0gIXNlbGYuaW5TdGF0ZS5jbGlja1xuICAgICAgaWYgKHNlbGYuaXNJblN0YXRlVHJ1ZSgpKSBzZWxmLmVudGVyKHNlbGYpXG4gICAgICBlbHNlIHNlbGYubGVhdmUoc2VsZilcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZi50aXAoKS5oYXNDbGFzcygnaW4nKSA/IHNlbGYubGVhdmUoc2VsZikgOiBzZWxmLmVudGVyKHNlbGYpXG4gICAgfVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KVxuICAgIHRoaXMuaGlkZShmdW5jdGlvbiAoKSB7XG4gICAgICB0aGF0LiRlbGVtZW50Lm9mZignLicgKyB0aGF0LnR5cGUpLnJlbW92ZURhdGEoJ2JzLicgKyB0aGF0LnR5cGUpXG4gICAgICBpZiAodGhhdC4kdGlwKSB7XG4gICAgICAgIHRoYXQuJHRpcC5kZXRhY2goKVxuICAgICAgfVxuICAgICAgdGhhdC4kdGlwID0gbnVsbFxuICAgICAgdGhhdC4kYXJyb3cgPSBudWxsXG4gICAgICB0aGF0LiR2aWV3cG9ydCA9IG51bGxcbiAgICAgIHRoYXQuJGVsZW1lbnQgPSBudWxsXG4gICAgfSlcbiAgfVxuXG5cbiAgLy8gVE9PTFRJUCBQTFVHSU4gREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbikge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzICAgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSAgICA9ICR0aGlzLmRhdGEoJ2JzLnRvb2x0aXAnKVxuICAgICAgdmFyIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09ICdvYmplY3QnICYmIG9wdGlvblxuXG4gICAgICBpZiAoIWRhdGEgJiYgL2Rlc3Ryb3l8aGlkZS8udGVzdChvcHRpb24pKSByZXR1cm5cbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMudG9vbHRpcCcsIChkYXRhID0gbmV3IFRvb2x0aXAodGhpcywgb3B0aW9ucykpKVxuICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ3N0cmluZycpIGRhdGFbb3B0aW9uXSgpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLnRvb2x0aXBcblxuICAkLmZuLnRvb2x0aXAgICAgICAgICAgICAgPSBQbHVnaW5cbiAgJC5mbi50b29sdGlwLkNvbnN0cnVjdG9yID0gVG9vbHRpcFxuXG5cbiAgLy8gVE9PTFRJUCBOTyBDT05GTElDVFxuICAvLyA9PT09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi50b29sdGlwLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi50b29sdGlwID0gb2xkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG59KGpRdWVyeSk7XG4iLCIvKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogcG9wb3Zlci5qcyB2My4zLjdcbiAqIGh0dHA6Ly9nZXRib290c3RyYXAuY29tL2phdmFzY3JpcHQvI3BvcG92ZXJzXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTYgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gUE9QT1ZFUiBQVUJMSUMgQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgdmFyIFBvcG92ZXIgPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuaW5pdCgncG9wb3ZlcicsIGVsZW1lbnQsIG9wdGlvbnMpXG4gIH1cblxuICBpZiAoISQuZm4udG9vbHRpcCkgdGhyb3cgbmV3IEVycm9yKCdQb3BvdmVyIHJlcXVpcmVzIHRvb2x0aXAuanMnKVxuXG4gIFBvcG92ZXIuVkVSU0lPTiAgPSAnMy4zLjcnXG5cbiAgUG9wb3Zlci5ERUZBVUxUUyA9ICQuZXh0ZW5kKHt9LCAkLmZuLnRvb2x0aXAuQ29uc3RydWN0b3IuREVGQVVMVFMsIHtcbiAgICBwbGFjZW1lbnQ6ICdyaWdodCcsXG4gICAgdHJpZ2dlcjogJ2NsaWNrJyxcbiAgICBjb250ZW50OiAnJyxcbiAgICB0ZW1wbGF0ZTogJzxkaXYgY2xhc3M9XCJwb3BvdmVyXCIgcm9sZT1cInRvb2x0aXBcIj48ZGl2IGNsYXNzPVwiYXJyb3dcIj48L2Rpdj48aDMgY2xhc3M9XCJwb3BvdmVyLXRpdGxlXCI+PC9oMz48ZGl2IGNsYXNzPVwicG9wb3Zlci1jb250ZW50XCI+PC9kaXY+PC9kaXY+J1xuICB9KVxuXG5cbiAgLy8gTk9URTogUE9QT1ZFUiBFWFRFTkRTIHRvb2x0aXAuanNcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICBQb3BvdmVyLnByb3RvdHlwZSA9ICQuZXh0ZW5kKHt9LCAkLmZuLnRvb2x0aXAuQ29uc3RydWN0b3IucHJvdG90eXBlKVxuXG4gIFBvcG92ZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUG9wb3ZlclxuXG4gIFBvcG92ZXIucHJvdG90eXBlLmdldERlZmF1bHRzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBQb3BvdmVyLkRFRkFVTFRTXG4gIH1cblxuICBQb3BvdmVyLnByb3RvdHlwZS5zZXRDb250ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciAkdGlwICAgID0gdGhpcy50aXAoKVxuICAgIHZhciB0aXRsZSAgID0gdGhpcy5nZXRUaXRsZSgpXG4gICAgdmFyIGNvbnRlbnQgPSB0aGlzLmdldENvbnRlbnQoKVxuXG4gICAgJHRpcC5maW5kKCcucG9wb3Zlci10aXRsZScpW3RoaXMub3B0aW9ucy5odG1sID8gJ2h0bWwnIDogJ3RleHQnXSh0aXRsZSlcbiAgICAkdGlwLmZpbmQoJy5wb3BvdmVyLWNvbnRlbnQnKS5jaGlsZHJlbigpLmRldGFjaCgpLmVuZCgpWyAvLyB3ZSB1c2UgYXBwZW5kIGZvciBodG1sIG9iamVjdHMgdG8gbWFpbnRhaW4ganMgZXZlbnRzXG4gICAgICB0aGlzLm9wdGlvbnMuaHRtbCA/ICh0eXBlb2YgY29udGVudCA9PSAnc3RyaW5nJyA/ICdodG1sJyA6ICdhcHBlbmQnKSA6ICd0ZXh0J1xuICAgIF0oY29udGVudClcblxuICAgICR0aXAucmVtb3ZlQ2xhc3MoJ2ZhZGUgdG9wIGJvdHRvbSBsZWZ0IHJpZ2h0IGluJylcblxuICAgIC8vIElFOCBkb2Vzbid0IGFjY2VwdCBoaWRpbmcgdmlhIHRoZSBgOmVtcHR5YCBwc2V1ZG8gc2VsZWN0b3IsIHdlIGhhdmUgdG8gZG9cbiAgICAvLyB0aGlzIG1hbnVhbGx5IGJ5IGNoZWNraW5nIHRoZSBjb250ZW50cy5cbiAgICBpZiAoISR0aXAuZmluZCgnLnBvcG92ZXItdGl0bGUnKS5odG1sKCkpICR0aXAuZmluZCgnLnBvcG92ZXItdGl0bGUnKS5oaWRlKClcbiAgfVxuXG4gIFBvcG92ZXIucHJvdG90eXBlLmhhc0NvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0VGl0bGUoKSB8fCB0aGlzLmdldENvbnRlbnQoKVxuICB9XG5cbiAgUG9wb3Zlci5wcm90b3R5cGUuZ2V0Q29udGVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJGUgPSB0aGlzLiRlbGVtZW50XG4gICAgdmFyIG8gID0gdGhpcy5vcHRpb25zXG5cbiAgICByZXR1cm4gJGUuYXR0cignZGF0YS1jb250ZW50JylcbiAgICAgIHx8ICh0eXBlb2Ygby5jb250ZW50ID09ICdmdW5jdGlvbicgP1xuICAgICAgICAgICAgby5jb250ZW50LmNhbGwoJGVbMF0pIDpcbiAgICAgICAgICAgIG8uY29udGVudClcbiAgfVxuXG4gIFBvcG92ZXIucHJvdG90eXBlLmFycm93ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy4kYXJyb3cgPSB0aGlzLiRhcnJvdyB8fCB0aGlzLnRpcCgpLmZpbmQoJy5hcnJvdycpKVxuICB9XG5cblxuICAvLyBQT1BPVkVSIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiBQbHVnaW4ob3B0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgICA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhICAgID0gJHRoaXMuZGF0YSgnYnMucG9wb3ZlcicpXG4gICAgICB2YXIgb3B0aW9ucyA9IHR5cGVvZiBvcHRpb24gPT0gJ29iamVjdCcgJiYgb3B0aW9uXG5cbiAgICAgIGlmICghZGF0YSAmJiAvZGVzdHJveXxoaWRlLy50ZXN0KG9wdGlvbikpIHJldHVyblxuICAgICAgaWYgKCFkYXRhKSAkdGhpcy5kYXRhKCdicy5wb3BvdmVyJywgKGRhdGEgPSBuZXcgUG9wb3Zlcih0aGlzLCBvcHRpb25zKSkpXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJykgZGF0YVtvcHRpb25dKClcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4ucG9wb3ZlclxuXG4gICQuZm4ucG9wb3ZlciAgICAgICAgICAgICA9IFBsdWdpblxuICAkLmZuLnBvcG92ZXIuQ29uc3RydWN0b3IgPSBQb3BvdmVyXG5cblxuICAvLyBQT1BPVkVSIE5PIENPTkZMSUNUXG4gIC8vID09PT09PT09PT09PT09PT09PT1cblxuICAkLmZuLnBvcG92ZXIubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAkLmZuLnBvcG92ZXIgPSBvbGRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbn0oalF1ZXJ5KTtcbiIsIi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiBtb2RhbC5qcyB2My4zLjdcbiAqIGh0dHA6Ly9nZXRib290c3RyYXAuY29tL2phdmFzY3JpcHQvI21vZGFsc1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE2IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIE1PREFMIENMQVNTIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PVxuXG4gIHZhciBNb2RhbCA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zICAgICAgICAgICAgID0gb3B0aW9uc1xuICAgIHRoaXMuJGJvZHkgICAgICAgICAgICAgICA9ICQoZG9jdW1lbnQuYm9keSlcbiAgICB0aGlzLiRlbGVtZW50ICAgICAgICAgICAgPSAkKGVsZW1lbnQpXG4gICAgdGhpcy4kZGlhbG9nICAgICAgICAgICAgID0gdGhpcy4kZWxlbWVudC5maW5kKCcubW9kYWwtZGlhbG9nJylcbiAgICB0aGlzLiRiYWNrZHJvcCAgICAgICAgICAgPSBudWxsXG4gICAgdGhpcy5pc1Nob3duICAgICAgICAgICAgID0gbnVsbFxuICAgIHRoaXMub3JpZ2luYWxCb2R5UGFkICAgICA9IG51bGxcbiAgICB0aGlzLnNjcm9sbGJhcldpZHRoICAgICAgPSAwXG4gICAgdGhpcy5pZ25vcmVCYWNrZHJvcENsaWNrID0gZmFsc2VcblxuICAgIGlmICh0aGlzLm9wdGlvbnMucmVtb3RlKSB7XG4gICAgICB0aGlzLiRlbGVtZW50XG4gICAgICAgIC5maW5kKCcubW9kYWwtY29udGVudCcpXG4gICAgICAgIC5sb2FkKHRoaXMub3B0aW9ucy5yZW1vdGUsICQucHJveHkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignbG9hZGVkLmJzLm1vZGFsJylcbiAgICAgICAgfSwgdGhpcykpXG4gICAgfVxuICB9XG5cbiAgTW9kYWwuVkVSU0lPTiAgPSAnMy4zLjcnXG5cbiAgTW9kYWwuVFJBTlNJVElPTl9EVVJBVElPTiA9IDMwMFxuICBNb2RhbC5CQUNLRFJPUF9UUkFOU0lUSU9OX0RVUkFUSU9OID0gMTUwXG5cbiAgTW9kYWwuREVGQVVMVFMgPSB7XG4gICAgYmFja2Ryb3A6IHRydWUsXG4gICAga2V5Ym9hcmQ6IHRydWUsXG4gICAgc2hvdzogdHJ1ZVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uIChfcmVsYXRlZFRhcmdldCkge1xuICAgIHJldHVybiB0aGlzLmlzU2hvd24gPyB0aGlzLmhpZGUoKSA6IHRoaXMuc2hvdyhfcmVsYXRlZFRhcmdldClcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gKF9yZWxhdGVkVGFyZ2V0KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzXG4gICAgdmFyIGUgICAgPSAkLkV2ZW50KCdzaG93LmJzLm1vZGFsJywgeyByZWxhdGVkVGFyZ2V0OiBfcmVsYXRlZFRhcmdldCB9KVxuXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKGUpXG5cbiAgICBpZiAodGhpcy5pc1Nob3duIHx8IGUuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgdGhpcy5pc1Nob3duID0gdHJ1ZVxuXG4gICAgdGhpcy5jaGVja1Njcm9sbGJhcigpXG4gICAgdGhpcy5zZXRTY3JvbGxiYXIoKVxuICAgIHRoaXMuJGJvZHkuYWRkQ2xhc3MoJ21vZGFsLW9wZW4nKVxuXG4gICAgdGhpcy5lc2NhcGUoKVxuICAgIHRoaXMucmVzaXplKClcblxuICAgIHRoaXMuJGVsZW1lbnQub24oJ2NsaWNrLmRpc21pc3MuYnMubW9kYWwnLCAnW2RhdGEtZGlzbWlzcz1cIm1vZGFsXCJdJywgJC5wcm94eSh0aGlzLmhpZGUsIHRoaXMpKVxuXG4gICAgdGhpcy4kZGlhbG9nLm9uKCdtb3VzZWRvd24uZGlzbWlzcy5icy5tb2RhbCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoYXQuJGVsZW1lbnQub25lKCdtb3VzZXVwLmRpc21pc3MuYnMubW9kYWwnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAoJChlLnRhcmdldCkuaXModGhhdC4kZWxlbWVudCkpIHRoYXQuaWdub3JlQmFja2Ryb3BDbGljayA9IHRydWVcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIHRoaXMuYmFja2Ryb3AoZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHRyYW5zaXRpb24gPSAkLnN1cHBvcnQudHJhbnNpdGlvbiAmJiB0aGF0LiRlbGVtZW50Lmhhc0NsYXNzKCdmYWRlJylcblxuICAgICAgaWYgKCF0aGF0LiRlbGVtZW50LnBhcmVudCgpLmxlbmd0aCkge1xuICAgICAgICB0aGF0LiRlbGVtZW50LmFwcGVuZFRvKHRoYXQuJGJvZHkpIC8vIGRvbid0IG1vdmUgbW9kYWxzIGRvbSBwb3NpdGlvblxuICAgICAgfVxuXG4gICAgICB0aGF0LiRlbGVtZW50XG4gICAgICAgIC5zaG93KClcbiAgICAgICAgLnNjcm9sbFRvcCgwKVxuXG4gICAgICB0aGF0LmFkanVzdERpYWxvZygpXG5cbiAgICAgIGlmICh0cmFuc2l0aW9uKSB7XG4gICAgICAgIHRoYXQuJGVsZW1lbnRbMF0ub2Zmc2V0V2lkdGggLy8gZm9yY2UgcmVmbG93XG4gICAgICB9XG5cbiAgICAgIHRoYXQuJGVsZW1lbnQuYWRkQ2xhc3MoJ2luJylcblxuICAgICAgdGhhdC5lbmZvcmNlRm9jdXMoKVxuXG4gICAgICB2YXIgZSA9ICQuRXZlbnQoJ3Nob3duLmJzLm1vZGFsJywgeyByZWxhdGVkVGFyZ2V0OiBfcmVsYXRlZFRhcmdldCB9KVxuXG4gICAgICB0cmFuc2l0aW9uID9cbiAgICAgICAgdGhhdC4kZGlhbG9nIC8vIHdhaXQgZm9yIG1vZGFsIHRvIHNsaWRlIGluXG4gICAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhhdC4kZWxlbWVudC50cmlnZ2VyKCdmb2N1cycpLnRyaWdnZXIoZSlcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChNb2RhbC5UUkFOU0lUSU9OX0RVUkFUSU9OKSA6XG4gICAgICAgIHRoYXQuJGVsZW1lbnQudHJpZ2dlcignZm9jdXMnKS50cmlnZ2VyKGUpXG4gICAgfSlcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoZSkgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBlID0gJC5FdmVudCgnaGlkZS5icy5tb2RhbCcpXG5cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoZSlcblxuICAgIGlmICghdGhpcy5pc1Nob3duIHx8IGUuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgdGhpcy5pc1Nob3duID0gZmFsc2VcblxuICAgIHRoaXMuZXNjYXBlKClcbiAgICB0aGlzLnJlc2l6ZSgpXG5cbiAgICAkKGRvY3VtZW50KS5vZmYoJ2ZvY3VzaW4uYnMubW9kYWwnKVxuXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLnJlbW92ZUNsYXNzKCdpbicpXG4gICAgICAub2ZmKCdjbGljay5kaXNtaXNzLmJzLm1vZGFsJylcbiAgICAgIC5vZmYoJ21vdXNldXAuZGlzbWlzcy5icy5tb2RhbCcpXG5cbiAgICB0aGlzLiRkaWFsb2cub2ZmKCdtb3VzZWRvd24uZGlzbWlzcy5icy5tb2RhbCcpXG5cbiAgICAkLnN1cHBvcnQudHJhbnNpdGlvbiAmJiB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdmYWRlJykgP1xuICAgICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAub25lKCdic1RyYW5zaXRpb25FbmQnLCAkLnByb3h5KHRoaXMuaGlkZU1vZGFsLCB0aGlzKSlcbiAgICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKE1vZGFsLlRSQU5TSVRJT05fRFVSQVRJT04pIDpcbiAgICAgIHRoaXMuaGlkZU1vZGFsKClcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5lbmZvcmNlRm9jdXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgJChkb2N1bWVudClcbiAgICAgIC5vZmYoJ2ZvY3VzaW4uYnMubW9kYWwnKSAvLyBndWFyZCBhZ2FpbnN0IGluZmluaXRlIGZvY3VzIGxvb3BcbiAgICAgIC5vbignZm9jdXNpbi5icy5tb2RhbCcsICQucHJveHkoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKGRvY3VtZW50ICE9PSBlLnRhcmdldCAmJlxuICAgICAgICAgICAgdGhpcy4kZWxlbWVudFswXSAhPT0gZS50YXJnZXQgJiZcbiAgICAgICAgICAgICF0aGlzLiRlbGVtZW50LmhhcyhlLnRhcmdldCkubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdmb2N1cycpXG4gICAgICAgIH1cbiAgICAgIH0sIHRoaXMpKVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLmVzY2FwZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5pc1Nob3duICYmIHRoaXMub3B0aW9ucy5rZXlib2FyZCkge1xuICAgICAgdGhpcy4kZWxlbWVudC5vbigna2V5ZG93bi5kaXNtaXNzLmJzLm1vZGFsJywgJC5wcm94eShmdW5jdGlvbiAoZSkge1xuICAgICAgICBlLndoaWNoID09IDI3ICYmIHRoaXMuaGlkZSgpXG4gICAgICB9LCB0aGlzKSlcbiAgICB9IGVsc2UgaWYgKCF0aGlzLmlzU2hvd24pIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdrZXlkb3duLmRpc21pc3MuYnMubW9kYWwnKVxuICAgIH1cbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5yZXNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuaXNTaG93bikge1xuICAgICAgJCh3aW5kb3cpLm9uKCdyZXNpemUuYnMubW9kYWwnLCAkLnByb3h5KHRoaXMuaGFuZGxlVXBkYXRlLCB0aGlzKSlcbiAgICB9IGVsc2Uge1xuICAgICAgJCh3aW5kb3cpLm9mZigncmVzaXplLmJzLm1vZGFsJylcbiAgICB9XG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuaGlkZU1vZGFsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgIHRoaXMuJGVsZW1lbnQuaGlkZSgpXG4gICAgdGhpcy5iYWNrZHJvcChmdW5jdGlvbiAoKSB7XG4gICAgICB0aGF0LiRib2R5LnJlbW92ZUNsYXNzKCdtb2RhbC1vcGVuJylcbiAgICAgIHRoYXQucmVzZXRBZGp1c3RtZW50cygpXG4gICAgICB0aGF0LnJlc2V0U2Nyb2xsYmFyKClcbiAgICAgIHRoYXQuJGVsZW1lbnQudHJpZ2dlcignaGlkZGVuLmJzLm1vZGFsJylcbiAgICB9KVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLnJlbW92ZUJhY2tkcm9wID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuJGJhY2tkcm9wICYmIHRoaXMuJGJhY2tkcm9wLnJlbW92ZSgpXG4gICAgdGhpcy4kYmFja2Ryb3AgPSBudWxsXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuYmFja2Ryb3AgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICB2YXIgYW5pbWF0ZSA9IHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2ZhZGUnKSA/ICdmYWRlJyA6ICcnXG5cbiAgICBpZiAodGhpcy5pc1Nob3duICYmIHRoaXMub3B0aW9ucy5iYWNrZHJvcCkge1xuICAgICAgdmFyIGRvQW5pbWF0ZSA9ICQuc3VwcG9ydC50cmFuc2l0aW9uICYmIGFuaW1hdGVcblxuICAgICAgdGhpcy4kYmFja2Ryb3AgPSAkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKVxuICAgICAgICAuYWRkQ2xhc3MoJ21vZGFsLWJhY2tkcm9wICcgKyBhbmltYXRlKVxuICAgICAgICAuYXBwZW5kVG8odGhpcy4kYm9keSlcblxuICAgICAgdGhpcy4kZWxlbWVudC5vbignY2xpY2suZGlzbWlzcy5icy5tb2RhbCcsICQucHJveHkoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKHRoaXMuaWdub3JlQmFja2Ryb3BDbGljaykge1xuICAgICAgICAgIHRoaXMuaWdub3JlQmFja2Ryb3BDbGljayA9IGZhbHNlXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGUudGFyZ2V0ICE9PSBlLmN1cnJlbnRUYXJnZXQpIHJldHVyblxuICAgICAgICB0aGlzLm9wdGlvbnMuYmFja2Ryb3AgPT0gJ3N0YXRpYydcbiAgICAgICAgICA/IHRoaXMuJGVsZW1lbnRbMF0uZm9jdXMoKVxuICAgICAgICAgIDogdGhpcy5oaWRlKClcbiAgICAgIH0sIHRoaXMpKVxuXG4gICAgICBpZiAoZG9BbmltYXRlKSB0aGlzLiRiYWNrZHJvcFswXS5vZmZzZXRXaWR0aCAvLyBmb3JjZSByZWZsb3dcblxuICAgICAgdGhpcy4kYmFja2Ryb3AuYWRkQ2xhc3MoJ2luJylcblxuICAgICAgaWYgKCFjYWxsYmFjaykgcmV0dXJuXG5cbiAgICAgIGRvQW5pbWF0ZSA/XG4gICAgICAgIHRoaXMuJGJhY2tkcm9wXG4gICAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgY2FsbGJhY2spXG4gICAgICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKE1vZGFsLkJBQ0tEUk9QX1RSQU5TSVRJT05fRFVSQVRJT04pIDpcbiAgICAgICAgY2FsbGJhY2soKVxuXG4gICAgfSBlbHNlIGlmICghdGhpcy5pc1Nob3duICYmIHRoaXMuJGJhY2tkcm9wKSB7XG4gICAgICB0aGlzLiRiYWNrZHJvcC5yZW1vdmVDbGFzcygnaW4nKVxuXG4gICAgICB2YXIgY2FsbGJhY2tSZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoYXQucmVtb3ZlQmFja2Ryb3AoKVxuICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygpXG4gICAgICB9XG4gICAgICAkLnN1cHBvcnQudHJhbnNpdGlvbiAmJiB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdmYWRlJykgP1xuICAgICAgICB0aGlzLiRiYWNrZHJvcFxuICAgICAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIGNhbGxiYWNrUmVtb3ZlKVxuICAgICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChNb2RhbC5CQUNLRFJPUF9UUkFOU0lUSU9OX0RVUkFUSU9OKSA6XG4gICAgICAgIGNhbGxiYWNrUmVtb3ZlKClcblxuICAgIH0gZWxzZSBpZiAoY2FsbGJhY2spIHtcbiAgICAgIGNhbGxiYWNrKClcbiAgICB9XG4gIH1cblxuICAvLyB0aGVzZSBmb2xsb3dpbmcgbWV0aG9kcyBhcmUgdXNlZCB0byBoYW5kbGUgb3ZlcmZsb3dpbmcgbW9kYWxzXG5cbiAgTW9kYWwucHJvdG90eXBlLmhhbmRsZVVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmFkanVzdERpYWxvZygpXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuYWRqdXN0RGlhbG9nID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBtb2RhbElzT3ZlcmZsb3dpbmcgPSB0aGlzLiRlbGVtZW50WzBdLnNjcm9sbEhlaWdodCA+IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHRcblxuICAgIHRoaXMuJGVsZW1lbnQuY3NzKHtcbiAgICAgIHBhZGRpbmdMZWZ0OiAgIXRoaXMuYm9keUlzT3ZlcmZsb3dpbmcgJiYgbW9kYWxJc092ZXJmbG93aW5nID8gdGhpcy5zY3JvbGxiYXJXaWR0aCA6ICcnLFxuICAgICAgcGFkZGluZ1JpZ2h0OiB0aGlzLmJvZHlJc092ZXJmbG93aW5nICYmICFtb2RhbElzT3ZlcmZsb3dpbmcgPyB0aGlzLnNjcm9sbGJhcldpZHRoIDogJydcbiAgICB9KVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLnJlc2V0QWRqdXN0bWVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy4kZWxlbWVudC5jc3Moe1xuICAgICAgcGFkZGluZ0xlZnQ6ICcnLFxuICAgICAgcGFkZGluZ1JpZ2h0OiAnJ1xuICAgIH0pXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuY2hlY2tTY3JvbGxiYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGZ1bGxXaW5kb3dXaWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoXG4gICAgaWYgKCFmdWxsV2luZG93V2lkdGgpIHsgLy8gd29ya2Fyb3VuZCBmb3IgbWlzc2luZyB3aW5kb3cuaW5uZXJXaWR0aCBpbiBJRThcbiAgICAgIHZhciBkb2N1bWVudEVsZW1lbnRSZWN0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICBmdWxsV2luZG93V2lkdGggPSBkb2N1bWVudEVsZW1lbnRSZWN0LnJpZ2h0IC0gTWF0aC5hYnMoZG9jdW1lbnRFbGVtZW50UmVjdC5sZWZ0KVxuICAgIH1cbiAgICB0aGlzLmJvZHlJc092ZXJmbG93aW5nID0gZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aCA8IGZ1bGxXaW5kb3dXaWR0aFxuICAgIHRoaXMuc2Nyb2xsYmFyV2lkdGggPSB0aGlzLm1lYXN1cmVTY3JvbGxiYXIoKVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLnNldFNjcm9sbGJhciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYm9keVBhZCA9IHBhcnNlSW50KCh0aGlzLiRib2R5LmNzcygncGFkZGluZy1yaWdodCcpIHx8IDApLCAxMClcbiAgICB0aGlzLm9yaWdpbmFsQm9keVBhZCA9IGRvY3VtZW50LmJvZHkuc3R5bGUucGFkZGluZ1JpZ2h0IHx8ICcnXG4gICAgaWYgKHRoaXMuYm9keUlzT3ZlcmZsb3dpbmcpIHRoaXMuJGJvZHkuY3NzKCdwYWRkaW5nLXJpZ2h0JywgYm9keVBhZCArIHRoaXMuc2Nyb2xsYmFyV2lkdGgpXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUucmVzZXRTY3JvbGxiYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy4kYm9keS5jc3MoJ3BhZGRpbmctcmlnaHQnLCB0aGlzLm9yaWdpbmFsQm9keVBhZClcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5tZWFzdXJlU2Nyb2xsYmFyID0gZnVuY3Rpb24gKCkgeyAvLyB0aHggd2Fsc2hcbiAgICB2YXIgc2Nyb2xsRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICBzY3JvbGxEaXYuY2xhc3NOYW1lID0gJ21vZGFsLXNjcm9sbGJhci1tZWFzdXJlJ1xuICAgIHRoaXMuJGJvZHkuYXBwZW5kKHNjcm9sbERpdilcbiAgICB2YXIgc2Nyb2xsYmFyV2lkdGggPSBzY3JvbGxEaXYub2Zmc2V0V2lkdGggLSBzY3JvbGxEaXYuY2xpZW50V2lkdGhcbiAgICB0aGlzLiRib2R5WzBdLnJlbW92ZUNoaWxkKHNjcm9sbERpdilcbiAgICByZXR1cm4gc2Nyb2xsYmFyV2lkdGhcbiAgfVxuXG5cbiAgLy8gTU9EQUwgUExVR0lOIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiBQbHVnaW4ob3B0aW9uLCBfcmVsYXRlZFRhcmdldCkge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzICAgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSAgICA9ICR0aGlzLmRhdGEoJ2JzLm1vZGFsJylcbiAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoe30sIE1vZGFsLkRFRkFVTFRTLCAkdGhpcy5kYXRhKCksIHR5cGVvZiBvcHRpb24gPT0gJ29iamVjdCcgJiYgb3B0aW9uKVxuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLm1vZGFsJywgKGRhdGEgPSBuZXcgTW9kYWwodGhpcywgb3B0aW9ucykpKVxuICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ3N0cmluZycpIGRhdGFbb3B0aW9uXShfcmVsYXRlZFRhcmdldClcbiAgICAgIGVsc2UgaWYgKG9wdGlvbnMuc2hvdykgZGF0YS5zaG93KF9yZWxhdGVkVGFyZ2V0KVxuICAgIH0pXG4gIH1cblxuICB2YXIgb2xkID0gJC5mbi5tb2RhbFxuXG4gICQuZm4ubW9kYWwgICAgICAgICAgICAgPSBQbHVnaW5cbiAgJC5mbi5tb2RhbC5Db25zdHJ1Y3RvciA9IE1vZGFsXG5cblxuICAvLyBNT0RBTCBOTyBDT05GTElDVFxuICAvLyA9PT09PT09PT09PT09PT09PVxuXG4gICQuZm4ubW9kYWwubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAkLmZuLm1vZGFsID0gb2xkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG5cbiAgLy8gTU9EQUwgREFUQS1BUElcbiAgLy8gPT09PT09PT09PT09PT1cblxuICAkKGRvY3VtZW50KS5vbignY2xpY2suYnMubW9kYWwuZGF0YS1hcGknLCAnW2RhdGEtdG9nZ2xlPVwibW9kYWxcIl0nLCBmdW5jdGlvbiAoZSkge1xuICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuICAgIHZhciBocmVmICAgID0gJHRoaXMuYXR0cignaHJlZicpXG4gICAgdmFyICR0YXJnZXQgPSAkKCR0aGlzLmF0dHIoJ2RhdGEtdGFyZ2V0JykgfHwgKGhyZWYgJiYgaHJlZi5yZXBsYWNlKC8uKig/PSNbXlxcc10rJCkvLCAnJykpKSAvLyBzdHJpcCBmb3IgaWU3XG4gICAgdmFyIG9wdGlvbiAgPSAkdGFyZ2V0LmRhdGEoJ2JzLm1vZGFsJykgPyAndG9nZ2xlJyA6ICQuZXh0ZW5kKHsgcmVtb3RlOiAhLyMvLnRlc3QoaHJlZikgJiYgaHJlZiB9LCAkdGFyZ2V0LmRhdGEoKSwgJHRoaXMuZGF0YSgpKVxuXG4gICAgaWYgKCR0aGlzLmlzKCdhJykpIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgJHRhcmdldC5vbmUoJ3Nob3cuYnMubW9kYWwnLCBmdW5jdGlvbiAoc2hvd0V2ZW50KSB7XG4gICAgICBpZiAoc2hvd0V2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm4gLy8gb25seSByZWdpc3RlciBmb2N1cyByZXN0b3JlciBpZiBtb2RhbCB3aWxsIGFjdHVhbGx5IGdldCBzaG93blxuICAgICAgJHRhcmdldC5vbmUoJ2hpZGRlbi5icy5tb2RhbCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHRoaXMuaXMoJzp2aXNpYmxlJykgJiYgJHRoaXMudHJpZ2dlcignZm9jdXMnKVxuICAgICAgfSlcbiAgICB9KVxuICAgIFBsdWdpbi5jYWxsKCR0YXJnZXQsIG9wdGlvbiwgdGhpcylcbiAgfSlcblxufShqUXVlcnkpO1xuIiwiLyohXG4gKiBKYXZhU2NyaXB0IENvb2tpZSB2Mi4yLjBcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9qcy1jb29raWUvanMtY29va2llXG4gKlxuICogQ29weXJpZ2h0IDIwMDYsIDIwMTUgS2xhdXMgSGFydGwgJiBGYWduZXIgQnJhY2tcbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICovXG47KGZ1bmN0aW9uIChmYWN0b3J5KSB7XG5cdHZhciByZWdpc3RlcmVkSW5Nb2R1bGVMb2FkZXIgPSBmYWxzZTtcblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuXHRcdGRlZmluZShmYWN0b3J5KTtcblx0XHRyZWdpc3RlcmVkSW5Nb2R1bGVMb2FkZXIgPSB0cnVlO1xuXHR9XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0XHRyZWdpc3RlcmVkSW5Nb2R1bGVMb2FkZXIgPSB0cnVlO1xuXHR9XG5cdGlmICghcmVnaXN0ZXJlZEluTW9kdWxlTG9hZGVyKSB7XG5cdFx0dmFyIE9sZENvb2tpZXMgPSB3aW5kb3cuQ29va2llcztcblx0XHR2YXIgYXBpID0gd2luZG93LkNvb2tpZXMgPSBmYWN0b3J5KCk7XG5cdFx0YXBpLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR3aW5kb3cuQ29va2llcyA9IE9sZENvb2tpZXM7XG5cdFx0XHRyZXR1cm4gYXBpO1xuXHRcdH07XG5cdH1cbn0oZnVuY3Rpb24gKCkge1xuXHRmdW5jdGlvbiBleHRlbmQgKCkge1xuXHRcdHZhciBpID0gMDtcblx0XHR2YXIgcmVzdWx0ID0ge307XG5cdFx0Zm9yICg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBhdHRyaWJ1dGVzID0gYXJndW1lbnRzWyBpIF07XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gYXR0cmlidXRlcykge1xuXHRcdFx0XHRyZXN1bHRba2V5XSA9IGF0dHJpYnV0ZXNba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXG5cdGZ1bmN0aW9uIGluaXQgKGNvbnZlcnRlcikge1xuXHRcdGZ1bmN0aW9uIGFwaSAoa2V5LCB2YWx1ZSwgYXR0cmlidXRlcykge1xuXHRcdFx0dmFyIHJlc3VsdDtcblx0XHRcdGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gV3JpdGVcblxuXHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG5cdFx0XHRcdGF0dHJpYnV0ZXMgPSBleHRlbmQoe1xuXHRcdFx0XHRcdHBhdGg6ICcvJ1xuXHRcdFx0XHR9LCBhcGkuZGVmYXVsdHMsIGF0dHJpYnV0ZXMpO1xuXG5cdFx0XHRcdGlmICh0eXBlb2YgYXR0cmlidXRlcy5leHBpcmVzID09PSAnbnVtYmVyJykge1xuXHRcdFx0XHRcdHZhciBleHBpcmVzID0gbmV3IERhdGUoKTtcblx0XHRcdFx0XHRleHBpcmVzLnNldE1pbGxpc2Vjb25kcyhleHBpcmVzLmdldE1pbGxpc2Vjb25kcygpICsgYXR0cmlidXRlcy5leHBpcmVzICogODY0ZSs1KTtcblx0XHRcdFx0XHRhdHRyaWJ1dGVzLmV4cGlyZXMgPSBleHBpcmVzO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gV2UncmUgdXNpbmcgXCJleHBpcmVzXCIgYmVjYXVzZSBcIm1heC1hZ2VcIiBpcyBub3Qgc3VwcG9ydGVkIGJ5IElFXG5cdFx0XHRcdGF0dHJpYnV0ZXMuZXhwaXJlcyA9IGF0dHJpYnV0ZXMuZXhwaXJlcyA/IGF0dHJpYnV0ZXMuZXhwaXJlcy50b1VUQ1N0cmluZygpIDogJyc7XG5cblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRyZXN1bHQgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG5cdFx0XHRcdFx0aWYgKC9eW1xce1xcW10vLnRlc3QocmVzdWx0KSkge1xuXHRcdFx0XHRcdFx0dmFsdWUgPSByZXN1bHQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGNhdGNoIChlKSB7fVxuXG5cdFx0XHRcdGlmICghY29udmVydGVyLndyaXRlKSB7XG5cdFx0XHRcdFx0dmFsdWUgPSBlbmNvZGVVUklDb21wb25lbnQoU3RyaW5nKHZhbHVlKSlcblx0XHRcdFx0XHRcdC5yZXBsYWNlKC8lKDIzfDI0fDI2fDJCfDNBfDNDfDNFfDNEfDJGfDNGfDQwfDVCfDVEfDVFfDYwfDdCfDdEfDdDKS9nLCBkZWNvZGVVUklDb21wb25lbnQpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHZhbHVlID0gY29udmVydGVyLndyaXRlKHZhbHVlLCBrZXkpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0a2V5ID0gZW5jb2RlVVJJQ29tcG9uZW50KFN0cmluZyhrZXkpKTtcblx0XHRcdFx0a2V5ID0ga2V5LnJlcGxhY2UoLyUoMjN8MjR8MjZ8MkJ8NUV8NjB8N0MpL2csIGRlY29kZVVSSUNvbXBvbmVudCk7XG5cdFx0XHRcdGtleSA9IGtleS5yZXBsYWNlKC9bXFwoXFwpXS9nLCBlc2NhcGUpO1xuXG5cdFx0XHRcdHZhciBzdHJpbmdpZmllZEF0dHJpYnV0ZXMgPSAnJztcblxuXHRcdFx0XHRmb3IgKHZhciBhdHRyaWJ1dGVOYW1lIGluIGF0dHJpYnV0ZXMpIHtcblx0XHRcdFx0XHRpZiAoIWF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0pIHtcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRzdHJpbmdpZmllZEF0dHJpYnV0ZXMgKz0gJzsgJyArIGF0dHJpYnV0ZU5hbWU7XG5cdFx0XHRcdFx0aWYgKGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0gPT09IHRydWUpIHtcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRzdHJpbmdpZmllZEF0dHJpYnV0ZXMgKz0gJz0nICsgYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gKGRvY3VtZW50LmNvb2tpZSA9IGtleSArICc9JyArIHZhbHVlICsgc3RyaW5naWZpZWRBdHRyaWJ1dGVzKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gUmVhZFxuXG5cdFx0XHRpZiAoIWtleSkge1xuXHRcdFx0XHRyZXN1bHQgPSB7fTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gVG8gcHJldmVudCB0aGUgZm9yIGxvb3AgaW4gdGhlIGZpcnN0IHBsYWNlIGFzc2lnbiBhbiBlbXB0eSBhcnJheVxuXHRcdFx0Ly8gaW4gY2FzZSB0aGVyZSBhcmUgbm8gY29va2llcyBhdCBhbGwuIEFsc28gcHJldmVudHMgb2RkIHJlc3VsdCB3aGVuXG5cdFx0XHQvLyBjYWxsaW5nIFwiZ2V0KClcIlxuXHRcdFx0dmFyIGNvb2tpZXMgPSBkb2N1bWVudC5jb29raWUgPyBkb2N1bWVudC5jb29raWUuc3BsaXQoJzsgJykgOiBbXTtcblx0XHRcdHZhciByZGVjb2RlID0gLyglWzAtOUEtWl17Mn0pKy9nO1xuXHRcdFx0dmFyIGkgPSAwO1xuXG5cdFx0XHRmb3IgKDsgaSA8IGNvb2tpZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0dmFyIHBhcnRzID0gY29va2llc1tpXS5zcGxpdCgnPScpO1xuXHRcdFx0XHR2YXIgY29va2llID0gcGFydHMuc2xpY2UoMSkuam9pbignPScpO1xuXG5cdFx0XHRcdGlmICghdGhpcy5qc29uICYmIGNvb2tpZS5jaGFyQXQoMCkgPT09ICdcIicpIHtcblx0XHRcdFx0XHRjb29raWUgPSBjb29raWUuc2xpY2UoMSwgLTEpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHR2YXIgbmFtZSA9IHBhcnRzWzBdLnJlcGxhY2UocmRlY29kZSwgZGVjb2RlVVJJQ29tcG9uZW50KTtcblx0XHRcdFx0XHRjb29raWUgPSBjb252ZXJ0ZXIucmVhZCA/XG5cdFx0XHRcdFx0XHRjb252ZXJ0ZXIucmVhZChjb29raWUsIG5hbWUpIDogY29udmVydGVyKGNvb2tpZSwgbmFtZSkgfHxcblx0XHRcdFx0XHRcdGNvb2tpZS5yZXBsYWNlKHJkZWNvZGUsIGRlY29kZVVSSUNvbXBvbmVudCk7XG5cblx0XHRcdFx0XHRpZiAodGhpcy5qc29uKSB7XG5cdFx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0XHRjb29raWUgPSBKU09OLnBhcnNlKGNvb2tpZSk7XG5cdFx0XHRcdFx0XHR9IGNhdGNoIChlKSB7fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChrZXkgPT09IG5hbWUpIHtcblx0XHRcdFx0XHRcdHJlc3VsdCA9IGNvb2tpZTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmICgha2V5KSB7XG5cdFx0XHRcdFx0XHRyZXN1bHRbbmFtZV0gPSBjb29raWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGNhdGNoIChlKSB7fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH1cblxuXHRcdGFwaS5zZXQgPSBhcGk7XG5cdFx0YXBpLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcblx0XHRcdHJldHVybiBhcGkuY2FsbChhcGksIGtleSk7XG5cdFx0fTtcblx0XHRhcGkuZ2V0SlNPTiA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBhcGkuYXBwbHkoe1xuXHRcdFx0XHRqc29uOiB0cnVlXG5cdFx0XHR9LCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xuXHRcdH07XG5cdFx0YXBpLmRlZmF1bHRzID0ge307XG5cblx0XHRhcGkucmVtb3ZlID0gZnVuY3Rpb24gKGtleSwgYXR0cmlidXRlcykge1xuXHRcdFx0YXBpKGtleSwgJycsIGV4dGVuZChhdHRyaWJ1dGVzLCB7XG5cdFx0XHRcdGV4cGlyZXM6IC0xXG5cdFx0XHR9KSk7XG5cdFx0fTtcblxuXHRcdGFwaS53aXRoQ29udmVydGVyID0gaW5pdDtcblxuXHRcdHJldHVybiBhcGk7XG5cdH1cblxuXHRyZXR1cm4gaW5pdChmdW5jdGlvbiAoKSB7fSk7XG59KSk7XG4iLCIvKlxuICogU2xpbmt5XG4gKiBBIGxpZ2h0LXdlaWdodCwgcmVzcG9uc2l2ZSwgbW9iaWxlLWxpa2UgbmF2aWdhdGlvbiBtZW51IHBsdWdpbiBmb3IgalF1ZXJ5XG4gKiBCdWlsdCBieSBBbGkgWmFoaWQgPGFsaS56YWhpZEBsaXZlLmNvbT5cbiAqIFB1Ymxpc2hlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqL1xuXG47KGZ1bmN0aW9uKCQpXG57XG4gICAgdmFyIGxhc3RDbGljaztcblxuICAgICQuZm4uc2xpbmt5ID0gZnVuY3Rpb24ob3B0aW9ucylcbiAgICB7XG4gICAgICAgIHZhciBzZXR0aW5ncyA9ICQuZXh0ZW5kXG4gICAgICAgICh7XG4gICAgICAgICAgICBsYWJlbDogJ0JhY2snLFxuICAgICAgICAgICAgdGl0bGU6IGZhbHNlLFxuICAgICAgICAgICAgc3BlZWQ6IDMwMCxcbiAgICAgICAgICAgIHJlc2l6ZTogdHJ1ZSxcbiAgICAgICAgICAgIGFjdGl2ZUNsYXNzOiAnYWN0aXZlJyxcbiAgICAgICAgICAgIGhlYWRlckNsYXNzOiAnaGVhZGVyJyxcbiAgICAgICAgICAgIGhlYWRpbmdUYWc6ICc8aDI+JyxcbiAgICAgICAgICAgIGJhY2tGaXJzdDogZmFsc2UsXG4gICAgICAgIH0sIG9wdGlvbnMpO1xuXG4gICAgICAgIHZhciBtZW51ID0gJCh0aGlzKSxcbiAgICAgICAgICAgIHJvb3QgPSBtZW51LmNoaWxkcmVuKCkuZmlyc3QoKTtcblxuICAgICAgICBtZW51LmFkZENsYXNzKCdzbGlua3ktbWVudScpO1xuXG4gICAgICAgIHZhciBtb3ZlID0gZnVuY3Rpb24oZGVwdGgsIGNhbGxiYWNrKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgbGVmdCA9IE1hdGgucm91bmQocGFyc2VJbnQocm9vdC5nZXQoMCkuc3R5bGUubGVmdCkpIHx8IDA7XG5cbiAgICAgICAgICAgIHJvb3QuY3NzKCdsZWZ0JywgbGVmdCAtIChkZXB0aCAqIDEwMCkgKyAnJScpO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoY2FsbGJhY2ssIHNldHRpbmdzLnNwZWVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcmVzaXplID0gZnVuY3Rpb24oY29udGVudClcbiAgICAgICAge1xuICAgICAgICAgICAgbWVudS5oZWlnaHQoY29udGVudC5vdXRlckhlaWdodCgpKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgdHJhbnNpdGlvbiA9IGZ1bmN0aW9uKHNwZWVkKVxuICAgICAgICB7XG4gICAgICAgICAgICBtZW51LmNzcygndHJhbnNpdGlvbi1kdXJhdGlvbicsIHNwZWVkICsgJ21zJyk7XG4gICAgICAgICAgICByb290LmNzcygndHJhbnNpdGlvbi1kdXJhdGlvbicsIHNwZWVkICsgJ21zJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdHJhbnNpdGlvbihzZXR0aW5ncy5zcGVlZCk7XG5cbiAgICAgICAgJCgnYSArIHVsJywgbWVudSkucHJldigpLmFkZENsYXNzKCduZXh0Jyk7XG5cbiAgICAgICAgJCgnbGkgPiB1bCcsIG1lbnUpLnByZXBlbmQoJzxsaSBjbGFzcz1cIicgKyBzZXR0aW5ncy5oZWFkZXJDbGFzcyArICdcIj4nKTtcblxuICAgICAgICBpZiAoc2V0dGluZ3MudGl0bGUgPT09IHRydWUpXG4gICAgICAgIHtcbiAgICAgICAgICAgICQoJ2xpID4gdWwnLCBtZW51KS5lYWNoKGZ1bmN0aW9uKClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2YXIgJGxpbmsgPSAkKHRoaXMpLnBhcmVudCgpLmZpbmQoJ2EnKS5maXJzdCgpLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbCA9ICRsaW5rLnRleHQoKSxcbiAgICAgICAgICAgICAgICAgICAgdGl0bGUgPSAkKCc8YT4nKS5hZGRDbGFzcygndGl0bGUnKS50ZXh0KGxhYmVsKS5hdHRyKCdocmVmJywgJGxpbmsuYXR0cignaHJlZicpKTtcblxuICAgICAgICAgICAgICAgICQoJz4gLicgKyBzZXR0aW5ncy5oZWFkZXJDbGFzcywgdGhpcykuYXBwZW5kKHRpdGxlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzZXR0aW5ncy50aXRsZSAmJiBzZXR0aW5ncy5sYWJlbCA9PT0gdHJ1ZSlcbiAgICAgICAge1xuICAgICAgICAgICAgJCgnbGkgPiB1bCcsIG1lbnUpLmVhY2goZnVuY3Rpb24oKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHZhciBsYWJlbCA9ICQodGhpcykucGFyZW50KCkuZmluZCgnYScpLmZpcnN0KCkudGV4dCgpLFxuICAgICAgICAgICAgICAgICAgICBiYWNrTGluayA9ICQoJzxhPicpLnRleHQobGFiZWwpLnByb3AoJ2hyZWYnLCAnIycpLmFkZENsYXNzKCdiYWNrJyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3MuYmFja0ZpcnN0KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgJCgnPiAuJyArIHNldHRpbmdzLmhlYWRlckNsYXNzLCB0aGlzKS5wcmVwZW5kKGJhY2tMaW5rKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgJCgnPiAuJyArIHNldHRpbmdzLmhlYWRlckNsYXNzLCB0aGlzKS5hcHBlbmQoYmFja0xpbmspO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIGJhY2tMaW5rID0gJCgnPGE+JykudGV4dChzZXR0aW5ncy5sYWJlbCkucHJvcCgnaHJlZicsICcjJykuYWRkQ2xhc3MoJ2JhY2snKTtcblxuICAgICAgICAgICAgaWYgKHNldHRpbmdzLmJhY2tGaXJzdClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAkKCcuJyArIHNldHRpbmdzLmhlYWRlckNsYXNzLCBtZW51KS5wcmVwZW5kKGJhY2tMaW5rKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAkKCcuJyArIHNldHRpbmdzLmhlYWRlckNsYXNzLCBtZW51KS5hcHBlbmQoYmFja0xpbmspO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgJCgnYScsIG1lbnUpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmICgobGFzdENsaWNrICsgc2V0dGluZ3Muc3BlZWQpID4gRGF0ZS5ub3coKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxhc3RDbGljayA9IERhdGUubm93KCk7XG5cbiAgICAgICAgICAgIHZhciBhID0gJCh0aGlzKTtcblxuICAgICAgICAgICAgaWYgKGEuaGFzQ2xhc3MoJ25leHQnKSB8fCBhLmhhc0NsYXNzKCdiYWNrJykpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYS5oYXNDbGFzcygnbmV4dCcpKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lbnUuZmluZCgnLicgKyBzZXR0aW5ncy5hY3RpdmVDbGFzcykucmVtb3ZlQ2xhc3Moc2V0dGluZ3MuYWN0aXZlQ2xhc3MpO1xuXG4gICAgICAgICAgICAgICAgYS5uZXh0KCkuc2hvdygpLmFkZENsYXNzKHNldHRpbmdzLmFjdGl2ZUNsYXNzKTtcblxuICAgICAgICAgICAgICAgIG1vdmUoMSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3MucmVzaXplKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzaXplKGEubmV4dCgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChhLmhhc0NsYXNzKCdiYWNrJykpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbW92ZSgtMSwgZnVuY3Rpb24oKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbWVudS5maW5kKCcuJyArIHNldHRpbmdzLmFjdGl2ZUNsYXNzKS5yZW1vdmVDbGFzcyhzZXR0aW5ncy5hY3RpdmVDbGFzcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgYS5wYXJlbnQoKS5wYXJlbnQoKS5oaWRlKCkucGFyZW50c1VudGlsKG1lbnUsICd1bCcpLmZpcnN0KCkuYWRkQ2xhc3Moc2V0dGluZ3MuYWN0aXZlQ2xhc3MpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHNldHRpbmdzLnJlc2l6ZSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJlc2l6ZShhLnBhcmVudCgpLnBhcmVudCgpLnBhcmVudHNVbnRpbChtZW51LCAndWwnKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmp1bXAgPSBmdW5jdGlvbih0bywgYW5pbWF0ZSlcbiAgICAgICAge1xuICAgICAgICAgICAgdG8gPSAkKHRvKTtcblxuICAgICAgICAgICAgdmFyIGFjdGl2ZSA9IG1lbnUuZmluZCgnLicgKyBzZXR0aW5ncy5hY3RpdmVDbGFzcyk7XG5cbiAgICAgICAgICAgIGlmIChhY3RpdmUubGVuZ3RoID4gMClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBhY3RpdmUgPSBhY3RpdmUucGFyZW50c1VudGlsKG1lbnUsICd1bCcpLmxlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBhY3RpdmUgPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBtZW51LmZpbmQoJ3VsJykucmVtb3ZlQ2xhc3Moc2V0dGluZ3MuYWN0aXZlQ2xhc3MpLmhpZGUoKTtcblxuICAgICAgICAgICAgdmFyIG1lbnVzID0gdG8ucGFyZW50c1VudGlsKG1lbnUsICd1bCcpO1xuXG4gICAgICAgICAgICBtZW51cy5zaG93KCk7XG4gICAgICAgICAgICB0by5zaG93KCkuYWRkQ2xhc3Moc2V0dGluZ3MuYWN0aXZlQ2xhc3MpO1xuXG4gICAgICAgICAgICBpZiAoYW5pbWF0ZSA9PT0gZmFsc2UpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbigwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbW92ZShtZW51cy5sZW5ndGggLSBhY3RpdmUpO1xuXG4gICAgICAgICAgICBpZiAoc2V0dGluZ3MucmVzaXplKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJlc2l6ZSh0byk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChhbmltYXRlID09PSBmYWxzZSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0cmFuc2l0aW9uKHNldHRpbmdzLnNwZWVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmhvbWUgPSBmdW5jdGlvbihhbmltYXRlKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAoYW5pbWF0ZSA9PT0gZmFsc2UpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbigwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGFjdGl2ZSA9IG1lbnUuZmluZCgnLicgKyBzZXR0aW5ncy5hY3RpdmVDbGFzcyksXG4gICAgICAgICAgICAgICAgY291bnQgPSBhY3RpdmUucGFyZW50c1VudGlsKG1lbnUsICdsaScpLmxlbmd0aDtcblxuICAgICAgICAgICAgaWYgKGNvdW50ID4gMClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtb3ZlKC1jb3VudCwgZnVuY3Rpb24oKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlLnJlbW92ZUNsYXNzKHNldHRpbmdzLmFjdGl2ZUNsYXNzKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmIChzZXR0aW5ncy5yZXNpemUpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXNpemUoJChhY3RpdmUucGFyZW50c1VudGlsKG1lbnUsICdsaScpLmdldChjb3VudCAtIDEpKS5wYXJlbnQoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYW5pbWF0ZSA9PT0gZmFsc2UpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbihzZXR0aW5ncy5zcGVlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24oKVxuICAgICAgICB7XG4gICAgICAgICAgICAkKCcuJyArIHNldHRpbmdzLmhlYWRlckNsYXNzLCBtZW51KS5yZW1vdmUoKTtcbiAgICAgICAgICAgICQoJ2EnLCBtZW51KS5yZW1vdmVDbGFzcygnbmV4dCcpLm9mZignY2xpY2snKTtcblxuICAgICAgICAgICAgbWVudS5yZW1vdmVDbGFzcygnc2xpbmt5LW1lbnUnKS5jc3MoJ3RyYW5zaXRpb24tZHVyYXRpb24nLCAnJyk7XG4gICAgICAgICAgICByb290LmNzcygndHJhbnNpdGlvbi1kdXJhdGlvbicsICcnKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgYWN0aXZlID0gbWVudS5maW5kKCcuJyArIHNldHRpbmdzLmFjdGl2ZUNsYXNzKTtcblxuICAgICAgICBpZiAoYWN0aXZlLmxlbmd0aCA+IDApXG4gICAgICAgIHtcbiAgICAgICAgICAgIGFjdGl2ZS5yZW1vdmVDbGFzcyhzZXR0aW5ncy5hY3RpdmVDbGFzcyk7XG5cbiAgICAgICAgICAgIHRoaXMuanVtcChhY3RpdmUsIGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG59KGpRdWVyeSkpO1xuIiwiLy8gfC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyB8IExheW91dFxuLy8gfC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyB8XG4vLyB8IFRoaXMgalF1ZXJ5IHNjcmlwdCBpcyB3cml0dGVuIGJ5XG4vLyB8XG4vLyB8IE1vcnRlbiBOaXNzZW5cbi8vIHwgaGplbW1lc2lkZWtvbmdlbi5ka1xuLy8gfFxudmFyIGxheW91dCA9IChmdW5jdGlvbiAoJCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBwdWIgPSB7fSxcbiAgICAgICAgJGxheW91dF9faGVhZGVyID0gJCgnLmxheW91dF9faGVhZGVyJyksXG4gICAgICAgICRsYXlvdXRfX2RvY3VtZW50ID0gJCgnLmxheW91dF9fZG9jdW1lbnQnKSxcbiAgICAgICAgbGF5b3V0X2NsYXNzZXMgPSB7XG4gICAgICAgICAgICAnbGF5b3V0X193cmFwcGVyJzogJy5sYXlvdXRfX3dyYXBwZXInLFxuICAgICAgICAgICAgJ2xheW91dF9fZHJhd2VyJzogJy5sYXlvdXRfX2RyYXdlcicsXG4gICAgICAgICAgICAnbGF5b3V0X19oZWFkZXInOiAnLmxheW91dF9faGVhZGVyJyxcbiAgICAgICAgICAgICdsYXlvdXRfX29iZnVzY2F0b3InOiAnLmxheW91dF9fb2JmdXNjYXRvcicsXG4gICAgICAgICAgICAnbGF5b3V0X19kb2N1bWVudCc6ICcubGF5b3V0X19kb2N1bWVudCcsXG5cbiAgICAgICAgICAgICd3cmFwcGVyX2lzX3VwZ3JhZGVkJzogJ2lzLXVwZ3JhZGVkJyxcbiAgICAgICAgICAgICd3cmFwcGVyX2hhc19kcmF3ZXInOiAnaGFzLWRyYXdlcicsXG4gICAgICAgICAgICAnd3JhcHBlcl9oYXNfc2Nyb2xsaW5nX2hlYWRlcic6ICdoYXMtc2Nyb2xsaW5nLWhlYWRlcicsXG4gICAgICAgICAgICAnaGVhZGVyX3Njcm9sbCc6ICdsYXlvdXRfX2hlYWRlci0tc2Nyb2xsJyxcbiAgICAgICAgICAgICdoZWFkZXJfaXNfY29tcGFjdCc6ICdpcy1jb21wYWN0JyxcbiAgICAgICAgICAgICdoZWFkZXJfd2F0ZXJmYWxsJzogJ2xheW91dF9faGVhZGVyLS13YXRlcmZhbGwnLFxuICAgICAgICAgICAgJ2RyYXdlcl9pc192aXNpYmxlJzogJ2lzLXZpc2libGUnLFxuICAgICAgICAgICAgJ29iZnVzY2F0b3JfaXNfdmlzaWJsZSc6ICdpcy12aXNpYmxlJ1xuICAgICAgICB9O1xuXG4gICAgLyoqXG4gICAgICogSW5zdGFudGlhdGVcbiAgICAgKi9cbiAgICBwdWIuaW5pdCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHJlZ2lzdGVyRXZlbnRIYW5kbGVycygpO1xuICAgICAgICByZWdpc3RlckJvb3RFdmVudEhhbmRsZXJzKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyIGJvb3QgZXZlbnQgaGFuZGxlcnNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZWdpc3RlckJvb3RFdmVudEhhbmRsZXJzKCkge1xuXG4gICAgICAgIC8vIEFkZCBjbGFzc2VzIHRvIGVsZW1lbnRzXG4gICAgICAgIGFkZEVsZW1lbnRDbGFzc2VzKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgZXZlbnQgaGFuZGxlcnNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZWdpc3RlckV2ZW50SGFuZGxlcnMoKSB7XG5cbiAgICAgICAgLy8gVG9nZ2xlIGRyYXdlclxuICAgICAgICAkKCdbZGF0YS10b2dnbGUtZHJhd2VyXScpLmFkZCgkKGxheW91dF9jbGFzc2VzLmxheW91dF9fb2JmdXNjYXRvcikpLm9uKCdjbGljayB0b3VjaHN0YXJ0JywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKHRoaXMpO1xuXG4gICAgICAgICAgICB0b2dnbGVEcmF3ZXIoJGVsZW1lbnQpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBXYXRlcmZhbGwgaGVhZGVyXG4gICAgICAgIGlmICgkbGF5b3V0X19oZWFkZXIuaGFzQ2xhc3MobGF5b3V0X2NsYXNzZXMuaGVhZGVyX3dhdGVyZmFsbCkpIHtcblxuICAgICAgICAgICAgJGxheW91dF9fZG9jdW1lbnQub24oJ3RvdWNobW92ZSBzY3JvbGwnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgIHZhciAkZG9jdW1lbnQgPSAkKHRoaXMpO1xuXG4gICAgICAgICAgICAgICAgd2F0ZXJmYWxsSGVhZGVyKCRkb2N1bWVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRvZ2dsZSBkcmF3ZXJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0b2dnbGVEcmF3ZXIoJGVsZW1lbnQpIHtcbiAgICAgICAgdmFyICR3cmFwcGVyID0gJGVsZW1lbnQuY2xvc2VzdChsYXlvdXRfY2xhc3Nlcy5sYXlvdXRfX3dyYXBwZXIpLFxuICAgICAgICAgICAgJG9iZnVzY2F0b3IgPSAkd3JhcHBlci5jaGlsZHJlbihsYXlvdXRfY2xhc3Nlcy5sYXlvdXRfX29iZnVzY2F0b3IpLFxuICAgICAgICAgICAgJGRyYXdlciA9ICR3cmFwcGVyLmNoaWxkcmVuKGxheW91dF9jbGFzc2VzLmxheW91dF9fZHJhd2VyKTtcblxuICAgICAgICAvLyBUb2dnbGUgdmlzaWJsZSBzdGF0ZVxuICAgICAgICAkb2JmdXNjYXRvci50b2dnbGVDbGFzcyhsYXlvdXRfY2xhc3Nlcy5vYmZ1c2NhdG9yX2lzX3Zpc2libGUpO1xuICAgICAgICAkZHJhd2VyLnRvZ2dsZUNsYXNzKGxheW91dF9jbGFzc2VzLmRyYXdlcl9pc192aXNpYmxlKTtcblxuICAgICAgICAvLyBBbHRlciBhcmlhLWhpZGRlbiBzdGF0dXNcbiAgICAgICAgJGRyYXdlci5hdHRyKCdhcmlhLWhpZGRlbicsICgkZHJhd2VyLmhhc0NsYXNzKGxheW91dF9jbGFzc2VzLmRyYXdlcl9pc192aXNpYmxlKSkgPyBmYWxzZSA6IHRydWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFdhdGVyZmFsbCBoZWFkZXJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiB3YXRlcmZhbGxIZWFkZXIoJGRvY3VtZW50KSB7XG4gICAgICAgIHZhciAkd3JhcHBlciA9ICRkb2N1bWVudC5jbG9zZXN0KGxheW91dF9jbGFzc2VzLmxheW91dF9fd3JhcHBlciksXG4gICAgICAgICAgICAkaGVhZGVyID0gJHdyYXBwZXIuY2hpbGRyZW4obGF5b3V0X2NsYXNzZXMubGF5b3V0X19oZWFkZXIpLFxuICAgICAgICAgICAgZGlzdGFuY2UgPSAkZG9jdW1lbnQuc2Nyb2xsVG9wKCk7XG5cbiAgICAgICAgaWYgKGRpc3RhbmNlID4gMCkge1xuICAgICAgICAgICAgJGhlYWRlci5hZGRDbGFzcyhsYXlvdXRfY2xhc3Nlcy5oZWFkZXJfaXNfY29tcGFjdCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAkaGVhZGVyLnJlbW92ZUNsYXNzKGxheW91dF9jbGFzc2VzLmhlYWRlcl9pc19jb21wYWN0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBjbGFzc2VzIHRvIGVsZW1lbnRzLCBiYXNlZCBvbiBhdHRhY2hlZCBjbGFzc2VzXG4gICAgICovXG4gICAgZnVuY3Rpb24gYWRkRWxlbWVudENsYXNzZXMoKSB7XG5cbiAgICAgICAgJChsYXlvdXRfY2xhc3Nlcy5sYXlvdXRfX3dyYXBwZXIpLmVhY2goZnVuY3Rpb24oaW5kZXgsIGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciAkd3JhcHBlciA9ICQodGhpcyksXG4gICAgICAgICAgICAgICAgJGhlYWRlciA9ICR3cmFwcGVyLmNoaWxkcmVuKGxheW91dF9jbGFzc2VzLmxheW91dF9faGVhZGVyKSxcbiAgICAgICAgICAgICAgICAkZHJhd2VyID0gJHdyYXBwZXIuY2hpbGRyZW4obGF5b3V0X2NsYXNzZXMubGF5b3V0X19kcmF3ZXIpO1xuXG4gICAgICAgICAgICAvLyBTY3JvbGwgaGVhZGVyXG4gICAgICAgICAgICBpZiAoJGhlYWRlci5oYXNDbGFzcyhsYXlvdXRfY2xhc3Nlcy5oZWFkZXJfc2Nyb2xsKSkge1xuICAgICAgICAgICAgICAgICR3cmFwcGVyLmFkZENsYXNzKGxheW91dF9jbGFzc2VzLndyYXBwZXJfaGFzX3Njcm9sbGluZ19oZWFkZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBEcmF3ZXJcbiAgICAgICAgICAgIGlmICgkZHJhd2VyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAkd3JhcHBlci5hZGRDbGFzcyhsYXlvdXRfY2xhc3Nlcy53cmFwcGVyX2hhc19kcmF3ZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBVcGdyYWRlZFxuICAgICAgICAgICAgaWYgKCR3cmFwcGVyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAkd3JhcHBlci5hZGRDbGFzcyhsYXlvdXRfY2xhc3Nlcy53cmFwcGVyX2lzX3VwZ3JhZGVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHB1Yjtcbn0pKGpRdWVyeSk7XG4iLCIvLyBEb2N1bWVudCByZWFkeVxuKGZ1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBGbGF0dGVuIHN0cnVjdHVyZSBvZiBtb2RhbHMsIHNvIHRoZXkgYXJlIG5vdCBuZXN0ZWQuXG4gIC8vIEV4LiAubW9kYWwgPiAubW9kYWwgPiAubW9kYWxcbiAgdmFyICRtb2RhbHMgPSAkKCcubW9kYWwnKTtcbiAgJCgnYm9keScpLmFwcGVuZCgkbW9kYWxzKTtcblxuICAvLyBFbmFibGUgbGF5b3V0XG4gIGxheW91dC5pbml0KCk7XG5cbiAgLy8gU2xpbmt5XG4gICQoJy5zbGlua3ktbWVudScpXG4gICAgICAuZmluZCgndWwsIGxpLCBhJylcbiAgICAgIC5yZW1vdmVDbGFzcygpO1xuXG4gICQoJy5yZWdpb24tbW9iaWxlLWhlYWRlci1uYXZpZ2F0aW9uIC5zbGlua3ktbWVudScpLnNsaW5reSh7XG4gICAgdGl0bGU6IHRydWUsXG4gICAgbGFiZWw6ICcnXG4gIH0pO1xuXG4gIC8vIFRhYmxlXG4gICQoJy5sYXlvdXRfX2NvbnRlbnQnKS5maW5kKCd0YWJsZScpXG4gICAgICAuYWRkQ2xhc3MoJ3RhYmxlIHRhYmxlLXN0cmlwZWQgdGFibGUtaG92ZXInKTtcblxuICAvLyBOb3RpZnlcbiAgdmFyICRub3RpZmljYXRpb25zID0gJCgnLm5vdGlmeScpO1xuICBpZiAoJG5vdGlmaWNhdGlvbnMubGVuZ3RoKSB7XG5cbiAgICAkbm90aWZpY2F0aW9ucy5lYWNoKGZ1bmN0aW9uKGluZGV4LCB2YWwpIHtcbiAgICAgIHZhciAkZG9jdW1lbnQgPSAkKCcubGF5b3V0X19kb2N1bWVudCcpLFxuICAgICAgICAgICRyZWdpb24gPSAkKCcucmVnaW9uLW5vdGlmeScpLFxuICAgICAgICAgICRlbGVtZW50ID0gJCh0aGlzKSxcbiAgICAgICAgICBjb29raWVfaWQgPSAnbm90aWZ5X2lkXycgKyAkZWxlbWVudC5hdHRyKCdpZCcpLFxuICAgICAgICAgICRjbG9zZSA9ICRlbGVtZW50LmZpbmQoJy5ub3RpZnlfX2Nsb3NlJyk7XG5cbiAgICAgIC8vIEZsZXggbWFnaWMgLSBmaXhpbmcgZGlzcGxheTogYmxvY2sgb24gZmFkZUluIChzZWU6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI4OTA0Njk4L2hvdy1mYWRlLWluLWEtZmxleC1ib3gpXG4gICAgICAkZWxlbWVudC5jc3MoJ2Rpc3BsYXknLCAnZmxleCcpLmhpZGUoKTtcblxuICAgICAgLy8gTm8gY29va2llIGhhcyBiZWVuIHNldCB5ZXRcbiAgICAgIGlmICghIENvb2tpZXMuZ2V0KGNvb2tpZV9pZCkpIHtcblxuICAgICAgICAvLyBGYWRlIHRoZSBlbGVtZW50IGluXG4gICAgICAgICRlbGVtZW50XG4gICAgICAgICAgICAuZGVsYXkoMjAwMClcbiAgICAgICAgICAgIC5mYWRlSW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHZhciBoZWlnaHQgPSAkcmVnaW9uLm91dGVySGVpZ2h0KHRydWUpO1xuXG4gICAgICAgICAgICAgICRkb2N1bWVudC5jc3MoJ3BhZGRpbmctYm90dG9tJywgaGVpZ2h0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBDbG9zZWRcbiAgICAgICRjbG9zZS5vbignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAkZWxlbWVudC5mYWRlT3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICRkb2N1bWVudC5jc3MoJ3BhZGRpbmctYm90dG9tJywgMCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFNldCBhIGNvb2tpZSwgdG8gc3RvcCB0aGlzIG5vdGlmaWNhdGlvbiBmcm9tIGJlaW5nIGRpc3BsYXllZCBhZ2FpblxuICAgICAgICBDb29raWVzLnNldChjb29raWVfaWQsIHRydWUpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAkKFwiI3RvZ2dsZV9tb2JpbGVfbWVudVwiKS5jbGljayhmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAkKCcjbWFpbi1tZW51JykudG9nZ2xlQ2xhc3MoJ21vYmlsZS1tZW51LW9wZW4nKTtcbiAgICAkKCcubGF5b3V0X19kb2N1bWVudCcpLnRvZ2dsZUNsYXNzKCdtb2JpbGUtbWVudS1vcGVuJyk7XG4gIH0pO1xuXG4gIC8vU2hvdyBzZWFyY2ggZm9ybSBibG9ja1xuICAkKFwiLnNlYXJjaC1idXR0b25cIikuY2xpY2soZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgaWYgKCQoXCIjc2VhcmNoLWZvcm0tcG9wb3ZlclwiKS5oYXNDbGFzcyhcImhpZGRlblwiKSkge1xuICAgICAgJChcIiNzZWFyY2gtZm9ybS1wb3BvdmVyXCIpLnJlbW92ZUNsYXNzKCdoaWRkZW4nKTtcbiAgICAgICQoXCIuZm9ybS1jb250cm9sXCIpLmZvY3VzKCk7XG4gICAgfVxuICB9KTtcblxuICAvL0hpZGUgc2VhcmNoIGZvcm0gYmxvY2tcbiAgJChkb2N1bWVudCkuY2xpY2soZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgaWYgKCEkKGV2ZW50LnRhcmdldCkuY2xvc2VzdCgnI3NlYXJjaC1mb3JtLXBvcG92ZXInKS5sZW5ndGggJiYgISQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KCcuc2VhcmNoLWJ1dHRvbicpLmxlbmd0aCkge1xuICAgICAgaWYgKCEkKFwiI3NlYXJjaC1mb3JtLXBvcG92ZXJcIikuaGFzQ2xhc3MoXCJoaWRkZW5cIikpIHtcbiAgICAgICAgJChcIiNzZWFyY2gtZm9ybS1wb3BvdmVyXCIpLmFkZENsYXNzKCdoaWRkZW4nKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIC8vSW1wcm92aW5nIHVzYWJpbGl0eSBmb3IgbWVudWRyb3Bkb3ducyBmb3IgbW9iaWxlIGRldmljZXNcbiAgaWYgKCEhKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdykpIHsvL2NoZWNrIGZvciB0b3VjaCBkZXZpY2VcbiAgICAkKCdsaS5kcm9wZG93bi5sYXlvdXQtbmF2aWdhdGlvbl9fZHJvcGRvd24nKS5maW5kKCc+IGEnKS5jbGljayhmdW5jdGlvbiAoZSkge1xuICAgICAgaWYgKCQodGhpcykucGFyZW50KCkuaGFzQ2xhc3MoXCJleHBhbmRlZFwiKSkge1xuICAgICAgICAvLyQodGhpcykucGFyZW50KCkucmVtb3ZlQ2xhc3MoXCJleHBhbmRlZFwiKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICQodGhpcykucGFyZW50KCkuYWRkQ2xhc3MoXCJleHBhbmRlZFwiKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBlbHNlIHsvL2tlZXBpbmcgaXQgY29tcGF0aWJsZSB3aXRoIGRlc2t0b3AgZGV2aWNlc1xuICAgICQoJ2xpLmRyb3Bkb3duLmxheW91dC1uYXZpZ2F0aW9uX19kcm9wZG93bicpLmhvdmVyKFxuICAgICAgICBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoXCJleHBhbmRlZFwiKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKFwiZXhwYW5kZWRcIik7XG4gICAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgLy8gVG9nZ2xlclxuICAkKCdbZGF0YS10b2dnbGVyXScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIHZhciAkZWxlbWVudCA9ICQodGhpcyksXG4gICAgICAgIHRhcmdldCA9ICRlbGVtZW50LmF0dHIoJ2RhdGEtdG9nZ2xlcicpLFxuICAgICAgICAkcGFyZW50ID0gJGVsZW1lbnQucGFyZW50cygnLnRvZ2dsZXInKSxcbiAgICAgICAgJHRhcmdldCA9ICRwYXJlbnQuZmluZCh0YXJnZXQpLFxuICAgICAgICAkYWxsX3RvZ2dsZV9idXR0b25zID0gJHBhcmVudC5maW5kKCdbZGF0YS10b2dnbGVyXScpLFxuICAgICAgICAkdG9nZ2xlX2J1dHRvbiA9ICRwYXJlbnQuZmluZCgnW2RhdGEtdG9nZ2xlcj1cIicgKyB0YXJnZXQgKyAnXCJdJyksXG4gICAgICAgICRhbGxfY29udGVudCA9ICRwYXJlbnQuZmluZCgnLnRvZ2dsZXJfX2NvbnRlbnQnKTtcblxuICAgIC8vIFJlbW92ZSBhbGwgYWN0aXZlIHRvZ2dsZXJzXG4gICAgJGFsbF90b2dnbGVfYnV0dG9uc1xuICAgICAgICAucGFyZW50KClcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcblxuICAgICRhbGxfY29udGVudC5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG5cbiAgICAvLyBTaG93XG4gICAgJHRvZ2dsZV9idXR0b24ucGFyZW50KCkuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICR0YXJnZXQuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICB9KTtcblxuICAkKFwiLnRvZ2dsZXJcIikuZWFjaChmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICQodGhpcykuZmluZCgnLnRvZ2dsZXJfX2J1dHRvbicpLmZpcnN0KCkudHJpZ2dlcignY2xpY2snKTtcbiAgfSk7XG5cbiAgLy8gVXNlIG11bHRpcGxlIG1vZGFscyAoaHR0cDovL2pzZmlkZGxlLm5ldC9saWtoaTEvd3RqNm5hY2QvKVxuICAkKGRvY3VtZW50KS5vbih7XG4gICAgJ3Nob3cuYnMubW9kYWwnOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgekluZGV4ID0gMTA0MCArICgxMCAqICQoJy5tb2RhbDp2aXNpYmxlJykubGVuZ3RoKTtcbiAgICAgICQodGhpcykuY3NzKCd6LWluZGV4JywgekluZGV4KTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAkKCcubW9kYWwtYmFja2Ryb3AnKS5ub3QoJy5tb2RhbC1zdGFjaycpLmNzcygnei1pbmRleCcsIHpJbmRleCAtIDEpLmFkZENsYXNzKCdtb2RhbC1zdGFjaycpO1xuICAgICAgfSwgMCk7XG4gICAgfSxcbiAgICAnaGlkZGVuLmJzLm1vZGFsJzogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCQoJy5tb2RhbDp2aXNpYmxlJykubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyByZXN0b3JlIHRoZSBtb2RhbC1vcGVuIGNsYXNzIHRvIHRoZSBib2R5IGVsZW1lbnQsIHNvIHRoYXQgc2Nyb2xsaW5nXG4gICAgICAgIC8vIHdvcmtzIHByb3Blcmx5IGFmdGVyIGRlLXN0YWNraW5nIGEgbW9kYWwuXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICQoZG9jdW1lbnQuYm9keSkuYWRkQ2xhc3MoJ21vZGFsLW9wZW4nKTtcbiAgICAgICAgfSwgMCk7XG4gICAgICB9XG4gICAgfVxuICB9LCAnLm1vZGFsJyk7XG5cbn0pKGpRdWVyeSk7XG4iXX0=
