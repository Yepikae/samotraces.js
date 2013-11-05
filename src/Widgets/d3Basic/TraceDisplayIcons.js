
// Check if relevant namespaces exist - or create them.
var Samotraces = Samotraces || {};
Samotraces.Widgets = Samotraces.Widgets || {};
Samotraces.Widgets.d3Basic = Samotraces.Widgets.d3Basic || {};

/**
 * @class Generic Widget for visualising traces with images.
 * @author Benoît Mathern
 * @requires d3.js framework (see <a href="http://d3js.org">d3js.org</a>)
 * @constructor
 * @augments Samotraces.Widgets.Widget
 * @description
 * Samotraces.Widgets.d3Basic.TraceDisplayIcons is a generic
 * Widget to visualise traces with images. This widget uses 
 * d3.js to display traces as images in a SVG image.
 * The default settings are set up to visualise 16x16 pixels
 * icons. If no url is defined (see options), a questionmark 
 * icon will be displayed by default for each obsel.
 *
 * @param {String}	divId
 *     Id of the DIV element where the widget will be
 *     instantiated
 * @param {Trace}	trace
 *     Trace object to display
 * @param {Samotraces.Objects.ObselSelector} obsel_selector
 *     ObselSelector object that will be updated when
 *     clicking on one Obsel
 * @param time_window
 *     TimeWindowCenteredOnTime object

 * @param {Object} options
 *     Object determining how to display the icons
 *     (Optional). All the options field can be either 
 *     a value or a function that will be called by 
 *     d3.js. The function will receive as the first
 *     argument the Obsel to display and should return 
 *     the calculated value.
 *     If a function is defined as an argument, it will
 *     be binded to the TraceDisplayIcons instance.
 *     This means that you can call any method of the 
 *     TraceDisplayIcons instance to help calculate 
 *     the x position or y position of an icon. This 
 *     makes it easy to define various types of behaviours.
 *     Relevant methods to use are:
 *     link Samotraces.Widgets.d3Basic.TraceDisplayIcons.calculate_x}
 * @param {Number|Function}	options.x		
 *     X coordinates of the top-left corner of the 
 *     image (default: <code>function(o) {
 *         return this.calculate_x(o.timestamp) - 8;
 *     })</code>)
 * @param {Number|Function}	options.y
 *     Y coordinates of the top-left corner of the 
 *     image (default: 17)
 * @param {Number|Function}	options.width
 *     Width of the image (default: 16)
 * @param {Number|Function}	options.height
 *     Height of the image (default: 16)
 * @param {String|Function}	options.url
 *     Url of the image to display (default: a 
 *     questionmark dataurl)
 *
 * @example
 * Example of options:
 * <code>
 * var options = {
 *     y: 20,
 *     width: 32,
 *     height: 32,
 *     url: function(obsel) {
 *         switch(obsel.type) {
 *             case 'click':
 *                 return 'images/click.png';
 *             case 'focus':
 *                 return 'images/focus.png';
 *             default:
 *                 return 'images/default.png';
 *         }
 *     },
 * };
 * </code>
 */
Samotraces.Widgets.d3Basic.TraceDisplayIcons = function(divId,trace,obsel_selector,time_window,options) {

	// WidgetBasicTimeForm is a Widget
	Samotraces.Widgets.Widget.call(this,divId);

	this.add_class('WidgetTraceDisplayIcons');
	Samotraces.Objects.WindowState.addEventListener('resize',this.refresh_x.bind(this));

	this.trace = trace;
	trace.addObserver(this);

	this.window = time_window;
	this.window.addEventListener('updateTimeWindow',this.refresh_x.bind(this));

	this.obsel_selector = obsel_selector;
//	this.window.addEventListener('',this..bind(this));

	this.init_DOM();
	this.data = this.trace.traceSet;

	this.options = {};
	options = options || {};

	// create function that returns value or function
	var this_widget = this;
	var bind_function = function(val_or_fun) {
			if(val_or_fun instanceof Function) {
				return val_or_fun.bind(this_widget);
			} else {
				return val_or_fun;
			}
		};
	this.options.x = bind_function(options.x || function(o) {
			return this.calculate_x(o.timestamp) - 8;
		});
	this.options.y = bind_function(options.y || 17);
	this.options.width = bind_function(options.width || 16);
	this.options.height = bind_function(options.height || 16);
	this.options.url = bind_function(options.url || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAG7AAABuwBHnU4NQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAKsSURBVDiNrZNLaFNpFMd/33fvTa5tYpuq0yatFWugRhEXw9AuhJEZBCkiqJWCIErrxp241C6L6650M/WBowunoyCDCjKrGYZ0IbiwxkdUbGyaPmgSm8d9f25MbXUlzH95zv/8OOdwjlBKsVajU1kEtJiavNBsaKcBqq5/3fKDSwrKY33JdX7RAIxOZQGM3bHIymCyPZhZqT8p2d4sQGtY7+yObvhxMjsvp4uVKOA2QEIpxehUFl2IvuFUZ3rZcu/+9X7RWqg7Jxw/QAFhTdLRFJoY6N4SazONo1czs/2eUlNjfUn0Risne+Pp9yv18TvZwrl9iVb2J2JEQhoKKNke6UJ55LfMB4aSHeMne+Ppay/yAkBcTL9ma7Np7Yu3/n1lOjdQ8wLO793GzlgzFdcjYujoUpAt17j8LIfjB5zdvfXBv3OlX3NVy5SAOJVKhP94M29UXB8FFGoWE89nufTkHQ9nFlEKejZuoLe1iYrr8+fbee9UKhEGhB6SYrBoudPLtnsAQCnF768Kq1v2AxAC6l7AsuUCsGS5h4uWOx2SYlBqQoyUHW/O9gO+1i9dbfyciKGA/wol3pTrANh+QNnx5jQhRuQ3VZ+1Z1OUg92biZkG/+SL3Hu7gPfVzQBIX6mJlpAeD2vrWds3mth+wOtSlUczS1RdfzUX1iQtIT3uKzWhO4GajJnGnc2mcf+j4x1umJ4uVShUbRSwUHPWwdvCxuOYaRxwAjUpAXUjk7eP9bTrEUNbNf30Q5ThXV0c6WknGvoSjxgax3e0uzcyeRtQcqwvSa5qmaYuB4aSHeMNiEJgahJ9zWQRQ2Mo2TFu6nIgV7XMdZd48+Vc/3CqM30m1XX3wcxi8d3H2sitl3mUACkEyZam24e2bTHbTOPc1cxsf6Pu/3mmtfred/4ESQNKXG8VACoAAAAASUVORK5CYII=');

	this.draw();
};

Samotraces.Widgets.d3Basic.TraceDisplayIcons.prototype = {
	init_DOM: function() {
		var div_elmt = d3.select('#'+this.id);
		this.svg = div_elmt.append('svg');

		// create the (red) line representing current time
		this.svg.append('line')
			.attr('x1','50%')
			.attr('y1','0%')
			.attr('x2','50%')
			.attr('y2','100%')
			.attr('stroke-width','1px')
			.attr('stroke','red')
			.attr('opacity','0.3');
		this.svg_gp = this.svg.append('g')
						.attr('transform', 'translate(0,0)');
		this.svg_selected_obsel = this.svg.append('line')
			.attr('x1','0')
			.attr('y1','0%')
			.attr('x2','0')
			.attr('y2','100%')
			.attr('stroke-width','1px')
			.attr('stroke','black')
			.attr('opacity','0.3')
			.attr('transform', 'translate(0,0)')
			.style('display','none');

		// event listeners
		var widget = this;
		Samotraces.Lib.addBehaviour('changeTimeOnDrag',this.element,{
				onUpCallback: function(delta_x) {
					var time_delta = -delta_x*widget.window.get_width()/widget.element.clientWidth;
					widget.window.translate(time_delta);	
				//	var new_time = widget.timer.time - delta_x*widget.window.get_width()/widget.element.clientWidth;
					// replace element.getSize() by element.clientWidth?
					widget.svg_gp.attr('transform','translate(0,0)');
				//	widget.timer.set(new_time);
					
				},
				onMoveCallback: function(offset) {
					widget.svg_gp.attr('transform','translate('+offset+',0)');
				},
			});
		Samotraces.Lib.addBehaviour('zommOnScroll',this.element,{timeWindow: this.window});
//		this.element.addEventListener('wheel',this.build_callback('wheel'));
//		this.element.addEventListener('mousedown',this.build_callback('mousedown'));
	},

	update: function(message,object) {
		switch(message) {
			case 'updateTrace':
				this.data = this.trace.traceSet;
				this.draw();	
				break;
/*			case 'updateTimeWindow':
				this.refresh_x();
				break;*/
/*			case 'resize':
				this.refresh_x(); // TODO: REFRESH_Y as well?
				break;*/
			case 'newObsel':
				obs = object;
				this.addObsel(obs);	
				break;
			case 'updateObsel':
				old_obs = object.old_obs;
				new_obs = object.new_obs;
				this.updateObsel(old_obs,new_obs);
				break;
			case 'obselSelected':
				obs = object;
//				this.selectObsel(obs);
				break;
			case 'obselUnselected':
				obs = object;
//				this.unselectObsel(obs);
				break;
			case 'removeObsel':
				obs = object;
				this.removeObsel(obs);	
				break;
			default:
				break;
		}
	},
	// TODO: needs to be named following a convention 
	// to be decided on
	/**
	 * Calculates the X position in pixels corresponding to 
	 * the time given in parameter.
	 * @param {Number} time Time for which to seek the corresponding x parameter
	 */
	calculate_x: function(time) {
//console.log(time);
		var x = (time - this.window.start)*this.element.clientWidth/this.window.get_width();
//console.log(x);
		return x;
	},

	refresh_x: function() {
		this.d3Obsels()
			.attr('x',this.options.x)
			.attr('y',this.options.y);
	},
/*	translate_x: function() {
		this.time
		var delta_x = this.timer.time - 
var new_time = widget.timer.time - delta_x*widget.window.get_width()/widget.element.clientWidth;
		this.current_offset = this.current_offset + offset;
		this.svg_gp.attr('transform','translate('+this.current_offset+',0)');
	},*/

	draw: function() {
		this.d3Obsels()
			.enter()
			.append('image')
			.attr('x',this.options.x)
			.attr('y',this.options.y)
			.attr('width',this.options.width)
			.attr('height',this.options.height)
			.attr('xlink:href',this.options.url);
		this.updateEventListener();
	},
	drawObsel: function(obs) {
		this.draw();	
	},

	d3Obsels: function() {
		return this.svg_gp
					.selectAll('circle,image,rect')
					// TODO: ATTENTION! WARNING! obsels MUST have a field id -> used as a key.
					.data(this.data); //,function(d) { return d.id;});
	},

	// TODO: is it relevant to keep this function? Or merged into build_callback?
	updateEventListener: function() {
		this.d3Obsels()
			.on('click',this.obsel_selector.select.bind(this.obsel_selector));
	},


};





