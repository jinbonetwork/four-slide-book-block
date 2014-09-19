/**
 * jquery.fsbb v1.0
 * http://taogi.net
 *
 * this project is forked from jquery.bookblock.js
 * and dependent on jquery.bookblock.js
 * http://www.codrops.com
 * 
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * CopyLeft JinboNet
 * http://lab.jinbo.net
 */
;( function( $, window, undefined ) {

	var $window = jQuery(window);

	jQuery.fn.fsbb_attr = function( options ) {
		this.each(function() {
			var self = jQuery(this);
			jQuery.each(options, function(k,v) {
				self.attr(k,v);
			});
		});
	};

	jQuery.FourSlideBookBlock = function( options, element ) {
		this.$el = jQuery( element );
        this._init( options );
	};

	jQuery.FourSlideBookBlock.defaults = {
		mode : 'cover',
		theme : 'sewol',
		teaser_spead : '1s',
		title : '',
		title_pos : {'left' : 0, 'top' : 0},
		background : '',
		useCoverAnimate : true,
		bb_after: function(page) {
			return false;
		}
	};
	jQuery.FourSlideBookBlock.bb_defaults = {
		chapter : 1,
		bb_after : function() {
			return false;
        }
	};

	jQuery.FourSlideBookBlock.prototype = {
		_init : function(options) {
			var self = this;
			// option
			this.options = $.extend( true, {}, $.FourSlideBookBlock.defaults, options );
			this.$items = [];
			var $items = this.$el.children('.four-item');

			if ('ontouchstart' in window) {
				//iOS & android
				this.supportsTouch = true;
			} else if(window.navigator.msPointerEnabled) {
				//Win8
				this.supportsTouch = true;
			}

			var transEndEventNames = {
				'WebkitTransition': 'webkitTransitionEnd',
				'MozTransition': 'transitionend',
				'OTransition': 'oTransitionEnd',
				'msTransition': 'MSTransitionEnd',
				'transition': 'transitionend'
            };
			this.transEndEventName = transEndEventNames[Modernizr.prefixed( 'transition' )] + '.fsbb';
            // support css 3d transforms && css transitions && Modernizr.csstransformspreserve3d
			this.support = Modernizr.csstransitions && Modernizr.csstransforms3d && Modernizr.csstransformspreserve3d;

			this.$el.wrap('<div class="fsbb-wrapper"><div class="fsbb-container"></div></div>');
			this.$cel = this.$el.parent();
			this.$wel = this.$cel.parent();
			this.$wel.addClass(this.options.theme);

			if(this.options.title.match(/^[\.#].+/)) {
				this.$title = jQuery(this.options.title);
				this.$title.addClass('fsbb-title');
			} else if(this.options.title) {
				this.$title = jQuery('<h1 class="fsbb-title hide">'+this.options.title+'</h1>');
				this.$title.prependTo(self.$wel);
			}
			if(this.options.useCoverAnimate) {
				this.$wel.addClass('cover-animate');
				this.$title.addClass('cover-animate');
			}
			var tsvg = this.$title.find('svg');
			if(tsvg.length < 1) {
				tsvg = this.$title.find('img');
			}
			this.tlWidth = 0;
			if(tsvg.length > 0) {
				this.$titleSVG = tsvg;
				this.resizeTitle = true;
				var w = parseInt(tsvg.attr('width'));
				if(w === 'undefined' || w) {
					w = tsvg.width();
				}
				if(w) this.tlWidth = w;
			} else {
				this.$titleSVG = null;
			}

			this.$vline = jQuery('<div class="fsbb-vertical-wrap"><div class="line"></div></div>');
			this.$hline = jQuery('<div class="fsbb-horizontal-wrap"><div class="line"></div></div>');
			this.$vline.prependTo(this.$wel);
			this.$hline.prependTo(this.$wel);

			this.osbWidth = 0;
			this.sbWidth = 0;
			this.$wnavi = jQuery('<div class="fsbb-navi-wrap"><ul class="fsbb-navi"></ul></div>');
			this.$navi = this.$wnavi.children('ul.fsbb-navi');
			this.$navis = [];
			$items.each(function(i) {
				var obj = {};
				obj.item = jQuery(this);
				obj.subject = obj.item.find('.subject');
				obj.summary = obj.item.find('.summary');
				obj.content = obj.item.find('.content');
				obj.item.addClass('four-item');
				obj.item.addClass('chapter-item');
				obj.item.addClass('chapter'+(i+1)+'-item');
				obj.item.data('chapter', (i+1) );
				if(self.options.background) {
					obj.item.append('<div class="item-background"></div>');
				}
				var $navis = jQuery('<li id="fsbb-navi-chapter'+(i+1)+'"><div class="fsbb-navi-inner"><div class="label">'+obj.item.attr('data-label')+'</div><div class="title">'+obj.item.attr('data-title')+'</div></div></li>');
				self.$navis.push($navis);
				self.$navi.append($navis);
				if(obj.subject.find('img').length > 0 || obj.subject.find('svg').length > 0) {
					self.resizeSubject = true;
					var t = obj.subject.find('svg');
					if(t.length > 0) {
					} else {
						t = obj.subject.find('img');
					}
					if(t.length > 0) {
						obj.svg = t;
						var w = parseInt(obj.svg.attr('width'));
						if(typeof(w) === 'undefined' || !w) w = obj.svg.width();
						if(self.osbWidth < w) self.osbWidth = w;
						if(self.sbWidth < w) self.sbWidth = w;
					} else {
						obj.svg = null;
					}
				}
				self.$items.push(obj);
			});
			this.$wel.append(this.$wnavi);

			if(this.options.background) {
				this.$background = this.$wel.find('img.background');
				if(this.$background.length < 1) {
					this.$background = jQuery('<img src="'+this.options.background+'" class="background" />');
					this.$background.prependTo(self.$wel);
				}
				this.$el.addClass('transparent');
				for(var i=0; i<this.$items.length; i++) {
					var cb = this.$background.clone();
					cb.prependTo(this.$items[i].item);
					this.$items[i].background = cb;
				}
				var plw = jQuery('<div id="fsbb-page_preloading"></div>');
				var pl = jQuery('<div class="loading"></div>');
				pl.wrap(plw);
				plw.appendTo('body');
				pl.css({
					'left': parseInt((jQuery(window).width() - pl.width()) / 2)+'px',
					'top': parseInt((jQuery(window).height() - pl.height()) / 2)+'px',
				});
				var hiddenImg = new Image();
				hiddenImg.onload = function() {
					plw.remove();
					self._atertLoadInit();
				};
				hiddenImg.src = self.$background.attr('src');
			} else {
				this._atertLoadInit();
			}
		},
		_atertLoadInit : function() {
			var self = this;
			this.init({});
			this.BBPage = (function() {
				var config = {
					$bookBlock : self.$el,
					$page1 : self.$navis[0],
					$page2 : self.$navis[1],
					$page3 : self.$navis[2],
					$page4 : self.$navis[3]
				},
				init = function(page) {
					config.$bookBlock.bookblock( {
						startPage : page,
						speed : 1000,
						shadowSides : 0.8,
						shadowFlip : 0.4,
						onEndFlip : function(o,p,isLimit) {
							self.options.bb_after((p+1));
							self.$navi.children('#fsbb-navi-chapter'+(p+1)).addClass('current').siblings().removeClass('current');
							self.currentChapter = (p+1);
							self.perfect_scroll(self.$items[p].item.find('.item-wrapper'));
						}
					} );
					initEvents();
				},
				initEvents = function() {
					var $slides = config.$bookBlock.children();

					config.$page1.on( 'click touchstart', function() {
						config.$bookBlock.bookblock( 'jump' , 1);
						return false;
					} );
					config.$page2.on( 'click touchstart', function() {
						config.$bookBlock.bookblock( 'jump' , 2);
						return false;
					} );
					config.$page3.on( 'click touchstart', function() {
						config.$bookBlock.bookblock( 'jump' , 3);
						return false;
					} );
					config.$page4.on( 'click touchstart', function() {
						config.$bookBlock.bookblock( 'jump' , 4);
						return false;
					} );

					$slides.on( {
						'swipeleft' : function( event ) {
							config.$bookBlock.bookblock( 'next' );
							return false;
						},
						'swiperight' : function( event ) {
							config.$bookBlock.bookblock( 'prev' );
							return false;
						}
					} );

					jQuery( document ).bind('keydown.fsbb', function(e) {
						var keyCode = e.keyCode || e.which,
						arrow = {
							left : 37,
							up : 38,
							right : 39,
							down : 40
						};

						switch (keyCode) {
							case arrow.left:
								config.$bookBlock.bookblock( 'prev' );
								break;
							case arrow.right:
								config.$bookBlock.bookblock( 'next' );
								break;
						}
					} );
				},
				destroy = function() {
					var $slides = config.$bookBlock.children();
					config.$bookBlock.bookblock( 'destroy' );
					config.$bookBlock.removeData( 'bookblock' );
					$slides.unbind('swipeleft');
					$slides.unbind('swiperight');
					jQuery( document ).unbind('keydown.fsbb');
				};

				return { init : init , destroy : destroy };

			})();
		},
		init : function(options) {
			var self = this;
			// orientation class
			if(this.pageMode == 'bookblock') {
				this.bbDestruct();
			}
			var opt = $.extend( true, {}, self.options, options );
			this.fs_mode = opt.mode;
			this.elWidth = this.$wel.width();
			this.elHeight = this.$wel.height();
			this.$el.addClass('four-slide');
			for(var i=0; i<this.$items.length; i++) {
				var item = this.$items[i];
				item.item.addClass('four-item');
				item.item.addClass('chapter'+(i+1)+'-item');
				item.item.data('chapter', (i+1) );
				item.subject.css( { 'top' : '' } );
				item.subject.unbind(self.transEndEventName);
				if(i > 1) {
					item.summary.css( { 'top' : '' } );
				}
				item.summary.unbind(self.transEndEventName);
			}

			if(opt.title !== 'undefined' && opt.title) {
				this.$title = jQuery(opt.title);
			} else if(this.options.title) {
				this.$title = jQuery('h1.fsbb-title');
			}
			if(opt.title_pos.left > 0 || opt.title_pos.top > 0) {
				this.$title.data('left',opt.title_pos.left);
				this.$title.data('top',opt.title_pos.top);
			} else {
				this.$title.data('left', 0);
				this.$title.data('top', 0);
			}
			this.initEvents();
		},
		initEvents : function() {
			var self = this;
			this.pageMode = 'four-slide';
			this.$wel.addClass('fs-mode').addClass(this.fs_mode);
			this.$el.addClass('four-slide');
			this.$vline.css('display','block').removeClass('anmiate2bb');
			this.$hline.css('display','block').removeClass('anmiate2bb');
			this.$background.css('display','block');
			for(var i=0; i < this.$items.length; i++) {
				var item = this.$items[i];
				if(item.item.data('clickEvent') !== true) {
					if(this.supportsTouch == true) {
						item.item.bind('touchstart.fsbb',function(e) {
							if(self.pageMode != 'four-slide') return;
							if(jQuery(this).hasClass('hover')) {
								var ch = jQuery(this).data('chapter');
								self.bb_activate({ chapter : ch });
							} else {
								jQuery(this).addClass('hover').siblings().removeClass('hover');
							}
						});
					} else {
						item.item.bind('click.fsbb',function(e) {
							if(self.pageMode != 'four-slide') return;
							if(jQuery(e.target).closest('.subject, .summary').length < 1 && self.fs_mode != 'cover') return;
							var ch = jQuery(this).data('chapter');
							self.bb_activate({ chapter : ch });
						});
						item.item.find('.subject, .summary').bind('click.fsbb',function(e) {
							var ch = jQuery(this).parents('.chapter-item').data('chapter');
							self.bb_activate({ chapter : ch });
						});
					}
					item.item.data('clickEvent',true);
				}
			}
			this.set_Pos();
			this.animate_cover();

			$window.bind('resize.fsbb',function() {
				self.elWidth = self.$wel.width();
				self.elHeight = self.$wel.height();
				if(self.pageMode == 'four-slide') {
					self.set_Pos();
					self.set_ePos();
				} else if(self.pageMode == 'bookblock') {
					self.hiddenTitlePos();
				}
			});
		},
		set_Pos : function() {
			var self = this;
			if(this.resizeTitle === true && this.$titleSVG) {
				var curTitleWidth = parseInt(this.$titleSVG.attr('width'));
				if(curTitleWidth === 'undefined' || !curTitleWidth) {
					curTitleWidth = this.$titleSVG.width();
				}
				var curTitleHeight = parseInt(this.$titleSVG.attr('height'));
				if(curTitleHeight === 'undefined' || !curTitleHeight) {
					curTitleHeight = this.$titleSVG.height();
				}
				var m_tl_width = Math.min( this.tlWidth, parseInt(this.elWidth / 3) );
				if( ( curTitleWidth > m_tl_width ) || ( m_tl_width < this.tlWidth && curTitleWidth < this.tlWidth ) ) {
					var tratio = 1 - ((curTitleWidth - m_tl_width) / curTitleWidth);
					var r_h = parseInt(curTitleHeight * tratio);
					this.$titleSVG.fsbb_attr({ 'width' : m_tl_width , 'height' : r_h });
				}
			}
			this.$title.css({
				'left': ( ( this.$title.data('left') > 0 ) ? this.$title.data('left') : parseInt((this.elWidth - this.$title.outerWidth()) / 2) )+'px',
				'top' : ( ( this.$title.data('top') > 0 ) ? this.$title.data('top') : parseInt((this.elHeight - this.$title.outerHeight()) / 2) )+'px'
			});
			this.$vline.css({
				'height' : this.elHeight+'px',
				'left'   : parseInt((this.elWidth - this.$vline.outerWidth()) / 2)+'px'
			});
			this.$vline.children('.line').css({ 'height' : this.elHeight+'px' });
			this.$hline.css({
				'width' :this.elWidth+'px',
				'top'   : parseInt((this.elHeight - this.$hline.outerHeight()) / 2)+'px'
			});
			this.$hline.children('.line').css({ 'width'  : this.elWidth+'px'  });
			if(this.options.background) {
				var bl = parseInt((this.$el.outerWidth() - this.$background.width()) / 2);
				var bt = parseInt((this.$el.outerHeight() - this.$background.height()) / 2);
				this.$background.css({
					'left' : bl+'px',
					'top'  : bt+'px'
				});
				for(var i=0; i<this.$items.length; i++) {
					this.$items[i].background.css({
						'left' : bl+'px',
						'top'  : bt+'px'
					});
				}
			}
			if(this.resizeSubject === true) {
				var s_m_w = Math.min(parseInt((this.elWidth / 2) * 0.8), this.osbWidth);
				if( (s_m_w < this.sbWidth) || ( (this.osbWidth > this.sbWidth) && (this.sbWidth < s_m_w) ) ) {
					var ratio = 1 - ((this.sbWidth - s_m_w) / this.sbWidth);
					this.sbWidth = 0;
					for(var i=0; i<this.$items.length; i++) {
						var item = this.$items[i];
						if(item.svg) {
							var w = parseInt(item.svg.attr('width'));
							if(w === 'undefined' || !w) w = item.svg.width();
							var h = parseInt(item.svg.attr('height'));
							if(h === 'undefined' || !h) h = item.svg.height();
							var r_w = parseInt(w * ratio);
							var r_h = parseInt(h * ratio);
							item.svg.fsbb_attr({ 'width' : r_w , 'height' : r_h });
							if(self.sbWidth < w) self.sbWidth = r_w;
						}
					}
				}
			}
			if(this.fs_mode == 'quart') {
				for(var i=0; i<this.$items.length; i++) {
					var max_h = parseInt( (this.elHeight / 2 ) * 0.8 )  - (this.$items[i].subject.outerHeight() * 2);
					this.$items[i].content.height(max_h);
					this.perfect_scroll(this.$items[i].content);
				}
			}
		},
		set_ePos : function() {
			var self = this;
			for(var i=0; i<this.$items.length; i++) {
				var obj = this.$items[i];
				var item = obj.item;
				var targetY = parseInt(item.height() * 0.1) + obj.subject.outerHeight() + parseInt(obj.subject.css('margin-top')) + parseInt(obj.subject.css('margin-bottom'));
				if(i < 2) {
					obj.summary.css( { 'top' : targetY+'px' } );
				} else {
					obj.summary.css( { 'bottom' : targetY+'px' } );
				}
				var maxHeight = parseInt(item.height() * 0.95) - targetY - parseInt(this.$title.height() / 2);
				obj.summary.css( { 'max-height' : maxHeight+'px' } );
			}
		},
		hiddenTitlePos : function() {
			var $t = jQuery('h1.fsbb-title')
			if(this.currentChapter % 2) {
				$t.css({ 'left': this.elWidth+'px' });
	        } else {
				$t.css({ 'left': '-'+$t.outerWidth()+'px' });
	        }
		},
		resize_element : function() {
		},
		animate_cover : function() {
			var self = this;
			if(this.options.useCoverAnimate === true) {
				this.$vline.children('.line').css({ 'height' : self.elHeight+'px' });
				this.$hline.children('.line').css({ 'width'  : self.elWidth+'px'  });
				if(this.transEndEventName) {
					this.$hline.bind(self.transEndEventName, function(e) {
						for(var i=0; i<self.$items.length; i++) {
							self.$items[i].item.addClass('show');
						}
						self.set_ePos();
						jQuery(this).unbind(self.transEndEventName);
					});
				} else {
					this.$items.each(function(i) {
						this.item.addClass('show');
					});
					this.set_ePos();
				}
			} else {
				this.$items.each(function(i) {
					this.item.addClass('show');
				});
				this.set_ePos();
			}
		},
		bb_activate : function(options) {
			var opt = $.extend( true, {}, jQuery.FourSlideBookBlock.bb_defaults, options );
			var ch = opt.chapter;
			var self = this;
			if(parseInt(ch) % 2) {
				this.$title.css({ 'left': this.elWidth+'px' });
	        } else {
				this.$title.css({ 'left': '-'+this.$title.outerWidth()+'px' });
	        }
			this.$vline.addClass('animate2bb').addClass('chapter'+ch);
			this.$hline.addClass('animate2bb').addClass('chapter'+ch);
			this.$el.addClass('anmiate2bb').addClass('animate'+ch);
			if(this.transEndEventName) {
				var tX = parseInt(this.elHeight * 0.1);
				var s = this.$items[(ch-1)].subject;
				var sX = tX + s.outerHeight() + parseInt(s.css('margin-top')) + parseInt(s.css('margin-bottom'));
				s.css( { 'top' : tX+'px' } );
				var su = this.$items[(ch-1)].summary;
				s.bind(self.transEndEventName,function(e) {
					jQuery(this).css( { 'top' : '' } );
					su.css( { 'top' : '' , 'max-height' : 'none'} );
					jQuery(this).unbind(self.transEndEventName);
				});
				su.css( { 'top' : sX+'px' } );
				su.bind(self.transEndEventName,function(e) {
					s.css( { 'top' : '' } );
					jQuery(this).css( { 'top' : '', 'max-height' : 'none' } );
					jQuery(this).unbind(self.transEndEventName);
				});
			}
			setTimeout(function() {
				self.destruct();
				self.bbInit(ch);
				self.perfect_scroll(self.$items[(ch-1)].item.find('.item-wrapper'));
				opt.bb_after();
			}, 1010);
		},
		destruct : function() {
			this.$background.css('display','none');
			this.$vline.css('display','none')
				.removeClass('animate2bb')
				.removeClass('chapter1')
				.removeClass('chapter2')
				.removeClass('chapter3')
				.removeClass('chapter4');
			this.$vline.find('.line').css( { 'height' : 0 } );
			this.$hline.css('display','none')
				.removeClass('animate2bb')
				.removeClass('chapter1')
				.removeClass('chapter2')
				.removeClass('chapter3')
				.removeClass('chapter4');
			this.$hline.find('.line').css( { 'width' : 0 } );
			this.$wel.removeClass('fs-mode').removeClass(this.fs_mode);
			for(var i=0; i<this.$items.length; i++) {
				var item = this.$items[i].item;
				this.remove_scroll(this.$items[i].content);
				item.unbind('touchstart.fsbb');
				var el = item.find( '.subject, .summary' );
				el.unbind( 'click.fsbb touchstart.fsbb');
				item.removeClass('four-item').removeClass('show');
			}
			this.$el.removeClass('four-slide')
				.removeClass('anmiate2bb')
				.removeClass('animate1')
				.removeClass('animate2')
				.removeClass('animate3')
				.removeClass('animate4');
		},
		bbInit : function(ch) {
			var self = this;
			this.pageMode = 'bookblock';
			this.$wel.addClass('bb-mode');
			this.$el.addClass('bb-bookblock');
			for(var i=0; i<this.$items.length; i++) {
				var item = this.$items[i].item;
				item.addClass('bb-item');
				this.$items[i].subject.css( { 'top' : '' , 'bottom' : '' } );
				this.$items[i].summary.css( { 'top' : '' , 'bottom' : '', 'max-height' : 'none' } );
			}

			this.BBPage.init(ch);
			this.$navi.children('#fsbb-navi-chapter'+(ch)).addClass('current').siblings().removeClass('current');
			this.currentChapter = ch;
			self.options.bb_after(ch);
		},
		bbDestruct : function() {
			this.BBPage.destroy();
			this.$wel.removeClass('bb-mode');
			this.$el.removeClass('bb-bookblock');
			for(var i=0; i<this.$items.length; i++) {
				var item = this.$items[i].item;
				item.removeClass('bb-item');
				this.remove_scroll(item.find('.item-wrapper'));
			}
			this.pageMode = '';
		},
		perfect_scroll : function(obj) {
			obj.addClass('perfect-scroll');
			if(obj.data('perfect-scrollbar') === true) {
				obj.perfectScrollbar('update');
			} else {
				obj.perfectScrollbar();
			}
		},
		remove_scroll : function(obj) {
			obj.removeClass('perfect-scroll').data('perfect-scrollbar',false);
			obj.perfectScrollbar('destroy');
		},
		get_currentChapter : function() {
			return this.currentChapter;
		}
	}

	jQuery.fn.fsbb = function( options ) {
		if ( typeof options === 'string' ) {
			var args = Array.prototype.slice.call( arguments, 1 );
			this.each(function() {
				var instance = $.data( this, 'fsbb' );
				if ( !instance ) {
					logError( "cannot call methods on fsbb prior to initialization; " +
					"attempted to call method '" + options + "'" );
					return;
				}
				if ( !jQuery.isFunction( instance[options] ) || options.charAt(0) === "_" ) {
					logError( "no such method '" + options + "' for fsbb instance" );
					return;
				}
				instance[ options ].apply( instance, args );
			});
		}
		else {
			this.each(function() {
				var instance = jQuery.data( this, 'fsbb' );
				if ( instance ) {
					instance._init();
				}
				else {
					instance = jQuery.data( this, 'fsbb', new jQuery.FourSlideBookBlock( options, this ) );
				}
			});
		}
		return this;
	};

} )( jQuery, window );
