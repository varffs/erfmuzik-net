/* jshint browser: true, devel: true, indent: 2, curly: true, eqeqeq: true, futurehostile: true, latedef: true, undef: true, unused: true */
/* global jQuery, $, document, Site, Modernizr */

Site = {
  mobileThreshold: 601,
  init: function() {
    var _this = this;

    $(window).resize(function(){
      _this.onResize();
    });

    _this.$background = $('#background');

    _this.blurAmount = 9;

    _this.player = SC.Widget(document.querySelector('#embed'));

    _this.bindPlayer();
  },

  onResize: function() {
    var _this = this;

  },

  fixWidows: function() {
    // utility class mainly for use on headines to avoid widows [single words on a new line]
    $('.js-fix-widows').each(function(){
      var string = $(this).html();
      string = string.replace(/ ([^ ]*)$/,'&nbsp;$1');
      $(this).html(string);
    });
  },

  bindPlayer: function() {
    var _this = this;

    _this.player.bind(SC.Widget.Events.PLAY, function() {
      _this.scrollBelowFold();
    });

    _this.player.bind(SC.Widget.Events.PLAY_PROGRESS, function(e) {
      _this.setBackgroundEffect(e.relativePosition)
    });

    _this.player.bind(SC.Widget.Events.PAUSE, function() {
      _this.$background.css({
        'filter': 'blur(0px)'
      });
    });
  },

  setBackgroundEffect: function(percent) {
    var _this = this;

    var blur = (_this.blurAmount - (_this.blurAmount * .15)) - ((_this.blurAmount * percent));

    _this.$background.css({
      'filter': 'blur(' + blur + 'px)'
    });

  },

  scrollBelowFold: function() {
    $('html, body').animate({
      scrollTop: $('#player-holder').offset().top - 20
    }, 1000);
  },
};

jQuery(document).ready(function () {
  'use strict';

  Site.init();

});