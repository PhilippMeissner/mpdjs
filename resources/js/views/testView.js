define([
		'jquery',
		'./BaseView',
		'text!templates/test1.html'],
function($, BaseView, template){
	var View = BaseView.extend({
		initialize: function() {
			// Wird benötigt, um das Menü zu erzeugen (Enthält den Titel der Seite)
			var options = {
					header: {
						title: "Test1"
					}
			};

			// Erstellt das Menü und den Header
			this.constructor.__super__.initialize.apply(this, [options]);
			// Lädt unser test1.html template in die Variable
			this.template = template;
		},
		render: function(){
			// Fügt HTML aus test1.html in das Dokument ein.
				$(this.el).html( this.headerTemplate + this.template + this.menuTemplate );
		}
	});

	return View;
});
