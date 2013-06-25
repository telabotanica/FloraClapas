"use strict";

// Creating the application namespace
var directory = {
    models: {},
    views: {},
    utils: {},
    dao: {}
};

// -------------------------------------------------- Utilities ---------------------------------------------------- //

// The Template Loader. Used to asynchronously load templates located in separate .html files
directory.utils.templateLoader = {

    templates: {},

    load: function(names, callback) {

        var deferreds = [],
            self = this;

        $.each(names, function(index, name) {
            deferreds.push($.get('tpl/' + name + '.html', function(data) {
                self.templates[name] = data;
            }));
        });

        $.when.apply(null, deferreds).done(callback);
    },

    // Get template by name from hash of preloaded templates
    get: function(name) {
        return this.templates[name];
    }

};

// The Employee Data Access Object (DAO). Encapsulates logic (in this case SQL statements) to access employee data.
directory.dao.ParcoursDAO = function(db) {
    this.db = db;
};

_.extend(directory.dao.ParcoursDAO.prototype, {

    findByName: function(key, callback) {
        this.db.transaction(
            function(tx) {
                var sql = 
					'SELECT id, nom, latitude_centre, longitude_centre, fichier_carte ' +
                    'FROM parcours ' +
                    'WHERE nom LIKE ? ' +
                    'ORDER BY nom';

                tx.executeSql(sql, ['%' + key + '%'], function(tx, results) {
                    var len = results.rows.length,
                        employees = [],
                        i = 0;
                    for (; i < len; i = i + 1) {
                        employees[i] = results.rows.item(i);
                    }
                    callback(employees);
                });
            },
            function(tx, error) {
                alert('Transaction Error: ' + error);
            }
        );
    },

    findById: function(id, callback) {
        this.db.transaction(
            function(tx) {
                var sql = 
					'SELECT id, nom, latitude_centre, longitude_centre, fichier_carte, description, photos, ce_critere, est_commence ' +
                    'FROM parcours ' +
                    'WHERE id=:id_parcours';

                tx.executeSql(sql, [id], function(tx, results) {
                    callback(results.rows.length === 1 ? results.rows.item(0) : null);
                });
            },
            function(tx, error) {
                alert('Transaction Error: ' + error);
				console.log('DB | Error processing SQL: ' + error.code, error);
            }
        );
    },

    findAll: function(callback) {
        this.db.transaction(
            function(tx) {
                var sql = 
					'SELECT id, nom, latitude_centre, longitude_centre, fichier_carte, description, photos ' +
                    'FROM parcours';

                tx.executeSql(sql, function(tx, results) {
                    callback(results.rows.item);
                });
            },
            function(error) {
				console.log('DB | Error processing SQL: ' + error.code, error);
            }
        );
    },

    // Populate Employee table with sample data
    populate: function(callback) {
        directory.db.transaction(
            function(tx) {
                console.log('Dropping PARCOURS table');
                tx.executeSql('DROP TABLE IF EXISTS parcours');
                var sql =
					'CREATE TABLE IF NOT EXISTS parcours (' +
						'id INT NOT NULL ,' +
						'nom VARCHAR(255) NOT NULL ,' +
						'latitude_centre DECIMAL NULL ,' +
						'longitude_centre DECIMAL NULL ,' +
						'fichier_carte VARCHAR(255) NULL ,' +
						'photos VARCHAR(255) NULL ,' +
						'description TEXT NULL ,' +
						'est_commence BOOLEAN NULL , ' +
						'ce_critere INT NULL ,' +
					'PRIMARY KEY (id),' +
					'CONSTRAINT ce_critere ' +
						'FOREIGN KEY (ce_critere)' +
						'REFERENCES critere (id_critere)' + 
						'ON DELETE NO ACTION ' + 
						'ON UPDATE NO ACTION ' + 
					')';
                console.log('Creating PARCOURS table');
                tx.executeSql(sql);
            },
            function(error) {
                alert('Transaction error ' + error);
				console.log('DB | Error processing SQL: ' + error.code, error);
            },
            function(tx) {
                //callback();
            }
        );
		console.log('Inserting parcours');
        $.ajax( {
			type: 'GET',
			url: './parcours.csv',
			dataType: 'text',
			success: function(fichier) { 
				var arr_lignes = fichier.split(/\r\n|\r|\n/),
					arr_sql = new Array(),
					max = arr_lignes.length - 1;
				for (var i = 1; i < max; i++) {
					var sql = '',
						arr_valeurs = arr_lignes[i].split(';');
					for (var j = 0; j < arr_valeurs.length; j++) {
						sql += arr_valeurs[j];
						if (j < (arr_valeurs.length - 2)) {
							sql += ',';
						}
					}
					arr_sql.push('INSERT INTO parcours '
							+ '(id, nom, latitude_centre, longitude_centre, fichier_carte, photos, description, ce_critere) '
							+ 'VALUES ('+sql+')');
				}
				//console.log(arr_sql);
				directory.db.transaction(function (tx) {
					for (var c = 0; c < arr_sql.length; c++) {
						tx.executeSql(arr_sql[c]);
					}
				});
				
			},
			error : function(jqXHR, textStatus, errorThrown) {
				console.log(textStatus);
			}
		});
    }
});
_.extend(directory.dao.ParcoursDAO.prototype, directory.dao.baseDAOBD);

// The Employee Data Access Object (DAO). Encapsulates logic (in this case SQL statements) to access employee data.
directory.dao.EspeceDAO = function(db) {
    this.db = db;
};

_.extend(directory.dao.EspeceDAO.prototype, {

    findByName: function(key, callback) {
        this.db.transaction(
            function(tx) {
                var sql = 
					'SELECT num_nom, nom_sci, famille, nom_vernaculaire,  photos ' +
                    'FROM espece ' + 
                    "WHERE nom_sci || ' ' || nom_vernaculaire || ' ' || famille LIKE ? " +
                    'ORDER BY nom_vernaculaire';

                tx.executeSql(sql, ['%' + key + '%'], function(tx, results) {
                    var len = results.rows.length,
                        employees = [],
                        i = 0;
                    for (; i < len; i = i + 1) {
                        employees[i] = results.rows.item(i);
                    }
                    callback(employees);
                });
            },
            function(tx, error) {
                alert('Transaction Error: ' + error);
            }
        );
    },

    findById: function(id, callback) {
        this.db.transaction(
            function(tx) {
                var sql = 
					'SELECT num_nom, nom_sci, famille, nom_vernaculaire, description, photos ' +
                    'FROM espece ' +
                    'WHERE num_nom = :id_espece';

                tx.executeSql(sql, [id], function(tx, results) {
                    callback(results.rows.length === 1 ? results.rows.item(0) : null);
                });
            },
            function(error) {
				console.log('DB | Error processing SQL: ' + error.code, error);
            }
        );
    },

    findByParcours: function(id, callback) {
        this.db.transaction(
            function(tx) {
                var sql = 
					'SELECT e.num_nom, e.nom_sci, e.famille, e.nom_vernaculaire, e.photos, c.vue ' +
                    'FROM espece e ' +
                    'JOIN avoir_critere c ON e.num_nom = c.id_espece ' +
                    'WHERE c.id_critere = :id_parcours ' + 
                    'ORDER BY nom_vernaculaire';
				//console.log(sql);
                tx.executeSql(sql, [id], function(tx, results) {
                     var nbre = results.rows.length,
                        especes = [],
                        i = 0;
                    for (; i < nbre; i = i + 1) {
                        especes[i] = results.rows.item(i);
                    }
                    callback(especes);
                });
            },
            function(error) {
				console.log('DB | Error processing SQL: ' + error.code, error);
            }
        );
    },

    findAll: function(callback) {
        this.db.transaction(
            function(tx) {

                var sql = 
					'SELECT num_nom, nom_sci, famille, nom_vernaculaire, photos ' +
                    'FROM espece';

                tx.executeSql(sql, [], function(tx, results) {
                    callback(results.rows.length === 1 ? results.rows.item(0) : null);
                });
            },
            function(tx, error) {
                alert('Transaction Error: ' + error);
            }
        );
    },

    // Populate Employee table with sample data
    populate: function(callback) {
        directory.db.transaction(
            function(tx) {
                console.log('Dropping ESPECE table');
                tx.executeSql('DROP TABLE IF EXISTS espece');
                var sql =
					'CREATE TABLE IF NOT EXISTS espece (' +
						'num_nom INT NOT NULL ,' +
						'nom_sci VARCHAR(255) NOT NULL ,' +
						'famille VARCHAR(255) NULL ,' +
						'num_taxon INT NULL ,' +
						'referentiel VARCHAR(45) NOT NULL DEFAULT "bdtfx" ,' +
						'nom_vernaculaire VARCHAR(255) NULL ,' +
						'description TEXT NULL ,' +
						'photos VARCHAR(255) NULL ,' +
					'PRIMARY KEY (num_nom) )';
                console.log('Creating ESPECE table');
                tx.executeSql(sql);
            },
            function(error) {
                alert('Transaction error ' + error);
				console.log('DB | Error processing SQL: ' + error.code, error);
            },
            function(tx) {
                //callback();
            }
        );
		console.log('Inserting espece');
		$.ajax( {
			type: 'GET',
			url: './espece.csv',
			dataType: 'text',
			success: function(fichier) { 
				var arr_lignes = fichier.split(/\r\n|\r|\n/),
					arr_sql = new Array(),
					max = arr_lignes.length - 1;
				for (var i = 1; i < max; i++) {
					var sql = '',
						arr_valeurs = arr_lignes[i].split(';');
					for (var j = 0; j < arr_valeurs.length; j++) {
						sql += arr_valeurs[j];
						if (j < (arr_valeurs.length - 1)) {
							sql += ',';
						}
					}
					arr_sql.push('INSERT INTO espece '
							+ '(nom_sci, num_nom, famille, num_taxon, nom_vernaculaire, description, photos, referentiel) '
							+ 'VALUES ('+sql+')');
				}
				//console.log(arr_sql);
				directory.db.transaction(function (tx) {
					for (var c = 0; c < arr_sql.length; c++) {
						tx.executeSql(arr_sql[c]);
					}
				}, 
				function(error) {
					alert('Transaction error ' + error);
					console.log('DB | Error processing SQL: ' + error.code, error);
				},
				function(tx) {
					//callback();
				});
			},
			error : function(jqXHR, textStatus, errorThrown) {
				console.log(textStatus);
			}
		});
    }
});
_.extend(directory.dao.EspeceDAO.prototype, directory.dao.baseDAOBD);


// The Employee Data Access Object (DAO). Encapsulates logic (in this case SQL statements) to access employee data.
directory.dao.CritereDAO = function(db) {
    this.db = db;
};
_.extend(directory.dao.CritereDAO.prototype, {
    findAll: function(callback) {
        this.db.transaction(
            function(tx) {

                var sql = 
					'SELECT intitule, url_img, ce_parent ' +
                    'FROM critere ';

                tx.executeSql(sql, [], function(tx, results) {
					var nbre = results.rows.length,
                        criteres = [],
                        i = 0;
                    for (; i < nbre; i = i + 1) {
                        criteres[i] = results.rows.item(i);
                    }
                    callback(criteres);
                });
            },
            function(tx, error) {
                alert('Transaction Error: ' + error);
            }
        );
    },
    
    // Populate Employee table with sample data
    populate: function(callback) {
        directory.db.transaction(
            function(tx) {
                console.log('Dropping CRITERE table');
                tx.executeSql('DROP TABLE IF EXISTS critere');
                var sql =
					'CREATE TABLE IF NOT EXISTS critere (' +
						'id_critere INT NOT NULL ,' +
						'intitule VARCHAR(45) NOT NULL ,' +
						'url_img VARCHAR(45) NULL ,' +
						'ce_parent INT NULL ,' +
						'PRIMARY KEY (id_critere) ,' +
						'CONSTRAINT ce_parent ' +
							'FOREIGN KEY (ce_parent)' +
							'REFERENCES critere (id_critere)' + 
							'ON DELETE NO ACTION ' + 
							'ON UPDATE NO ACTION ' + 
					')';
                console.log('Creating CRITERE table');
                tx.executeSql(sql);
            },
            function(error) {
                alert('Transaction error ' + error);
				console.log('DB | Error processing SQL: ' + error.code, error);
            },
            function(tx) {
                //callback();
            }
        );
		console.log('Inserting critere');
		$.ajax( {
			type: 'GET',
			url: './critere.csv',
			dataType: 'text',
			success: function(fichier) { 
				var arr_lignes = fichier.split(/\r\n|\r|\n/),
					arr_sql = new Array(),
					max = arr_lignes.length - 1;
				for (var i = 1; i < max; i++) {
					var sql = '',
						arr_valeurs = arr_lignes[i].split(';');
					for (var j = 0; j < arr_valeurs.length; j++) {
						sql += arr_valeurs[j];
						if (j < (arr_valeurs.length - 2)) {
							sql += ',';
						}
					}
					arr_sql.push(sql);
				}
				//console.log(arr_sql);
				directory.db.transaction(function (tx) {
					for (var c = 0; c < arr_sql.length; c++) {
						tx.executeSql("INSERT INTO critere (id_critere, intitule, url_img, ce_parent) VALUES ("+arr_sql[c]+")");
					}
				}, 
				function(error) {
					alert('Transaction error ' + error);
					console.log('DB | Error processing SQL: ' + error.code, error);
				},
				function(tx) {
					//callback();
				});
			},
			error : function(jqXHR, textStatus, errorThrown) {
				console.log(textStatus);
			}
		});
    }
});
_.extend(directory.dao.CritereDAO.prototype, directory.dao.baseDAOBD);


// The Employee Data Access Object (DAO). Encapsulates logic (in this case SQL statements) to access employee data.
directory.dao.AvoirCritereDAO = function(db) {
    this.db = db;
};
_.extend(directory.dao.AvoirCritereDAO.prototype, {
    // Populate Employee table with sample data
    populate: function(callback) {
        directory.db.transaction(
            function(tx) {
                console.log('Dropping AVOIR_CRITERE table');
                tx.executeSql('DROP TABLE IF EXISTS avoir_critere');
                var sql =
					'CREATE TABLE IF NOT EXISTS avoir_critere (' +
						'id_espece INT NOT NULL ,' +
						'id_critere INT NOT NULL ,' +
						'vue BOOLEAN NULL ,' +
						'PRIMARY KEY (id_espece, id_critere) , ' +
						'CONSTRAINT id_critere ' + 
							'FOREIGN KEY (id_critere)' +
							'REFERENCES critere (id_critere) ' +
							'ON DELETE NO ACTION ' +
							'ON UPDATE NO ACTION,' +
						'CONSTRAINT id_espece ' +
							'FOREIGN KEY (id_espece)' +
							'REFERENCES espece (num_nom)' +
							'ON DELETE NO ACTION ' + 
							'ON UPDATE NO ACTION ' + 
					')';
                console.log('Creating AVOIR_CRITERE table');
                tx.executeSql(sql);
            },
            function(error) {
                alert('Transaction error ' + error);
				console.log('DB | Error processing SQL: ' + error.code, error);
            },
            function(tx) {
                //callback();
            }
        );
		console.log('Inserting avoir_critere');
		$.ajax( {
			type: 'GET',
			url: './avoir_critere.csv',
			dataType: 'text',
			success: function(fichier) { 
				var arr_lignes = fichier.split(/\r\n|\r|\n/),
					arr_sql = new Array(),
					max = arr_lignes.length - 1;
				for (var i = 1; i < max; i++) {
					var sql = '',
						arr_valeurs = arr_lignes[i].split(';');
					if (arr_valeurs[1] != 'null') {
						for (var j = 0; j < arr_valeurs.length; j++) {
							sql += arr_valeurs[j];
							if (j < (arr_valeurs.length - 2)) {
								sql += ',';
							}
						}
						arr_sql.push(sql);
					}
				}
				//console.log(arr_sql);
				directory.db.transaction(function (tx) {
					for (var c = 0; c < arr_sql.length; c++) {
						tx.executeSql("INSERT INTO avoir_critere (id_espece, id_critere) VALUES ("+arr_sql[c]+")");
					}
				}, 
				function(error) {
					alert('Transaction error ' + error);
					console.log('DB | Error processing SQL: ' + error.code, error);
				},
				function(tx) {
					//callback();
				});
			},
			error : function(jqXHR, textStatus, errorThrown) {
				console.log(textStatus);
			}
		});
    }
});
_.extend(directory.dao.AvoirCritereDAO.prototype, directory.dao.baseDAOBD);


// Overriding Backbone's sync method. Replace the default RESTful services-based implementation
// with a simple local database approach.
Backbone.sync = function(method, model, options) {
    var dao = new model.dao(directory.db);

    if (method === "read") {
        if (model.id) {
            dao.findById(model.id, function(data) {
                options.success(data);
            });
        } else {
            dao.findAll(function(data) {
                options.success(data);
            });
        }
    }

};

// -------------------------------------------------- The Models ---------------------------------------------------- //

// The Employee Model
directory.models.Employee = Backbone.Model.extend({
    dao: directory.dao.ParcoursDAO,

    initialize: function() {
        //this.reports = new directory.models.EmployeeCollection();
        //this.reports.managerId = this.id;
    }

});

// The EmployeeCollection Model
directory.models.EmployeeCollection = Backbone.Collection.extend({
    dao: directory.dao.ParcoursDAO,
    model: directory.models.Employee,

    findByName: function(key) {
        var employeeDAO = new directory.dao.ParcoursDAO(directory.db),
            self = this;
        employeeDAO.findByName(key, function(data) {
			console.log("EmployeeCollection " + data);
            self.reset(data);
        });
    },
    
    findAll: function() {
        var employeeDAO = new directory.dao.ParcoursDAO(directory.db),
            self = this;
        employeeDAO.findAll(function(data) {
			console.log("EmployeeCollection " + data);
            self.reset(data);
        });
    }

});


directory.models.Espece = Backbone.Model.extend({

    dao: directory.dao.EspeceDAO,

    initialize: function() {
        //this.reports = new directory.models.EmployeeCollection();
        //this.reports.managerId = this.id;
    }

});


directory.models.EspeceCollection = Backbone.Collection.extend({
    dao: directory.dao.EspeceDAO,
    model: directory.models.Espece,

    findByName: function(key) {
        var especeDAO = new directory.dao.EspeceDAO(directory.db),
            self = this;
        especeDAO.findByName(key, function(data) {
			console.log("EspeceCollection | findByName", data);
            self.reset(data);
        });
    }, 
    
    findById: function(key) {
        var especeDAO = new directory.dao.EspeceDAO(directory.db),
            self = this;
        especeDAO.findById(key, function(data) {
			console.log("EspeceCollection | findById", data);
            self.reset(data);
        });
    }, 
    
    findByParcours: function(key) {
        var especeDAO = new directory.dao.EspeceDAO(directory.db),
            self = this;
        especeDAO.findByParcours(key, function(data) {
            self.reset(data);
			//console.log("EspeceCollection | findByParcours ", data);
        });
    }

});


directory.models.Critere = Backbone.Model.extend({
    dao: directory.dao.ParcoursDAO,

    initialize: function() {
        //this.reports = new directory.models.EmployeeCollection();
        //this.reports.managerId = this.id;
    }

});


directory.models.CritereCollection = Backbone.Collection.extend({
    dao: directory.dao.CritereDAO,
    model: directory.models.Critere,

    findAll: function() {
        var critereDAO = new directory.dao.CritereDAO(directory.db),
            self = this;
        critereDAO.findAll(function(data) {
			console.log("critereCollection ", data);
            self.reset(data);
        });
    }
});


// -------------------------------------------------- The Views ---------------------------------------------------- //

directory.views.SearchPage = Backbone.View.extend({
    templateLoader: directory.utils.templateLoader,
    EmployeeListView: directory.views.EmployeeListView,

    initialize: function() {
        this.template = _.template(this.templateLoader.get('search-page'));
        this.model.findByName('');
    },

    render: function(eventName) {
        $(this.el).html(this.template(this.model.toJSON()));
        this.listView = new directory.views.EmployeeListView({el: $('ul', this.el), model: this.model});
        this.listView.render();
        return this;
    }
});

directory.views.EmployeeListView = Backbone.View.extend({
    initialize: function() {
        this.model.bind('reset', this.render, this);
    },

    render: function(eventName) {
        $(this.el).empty();
        _.each(this.model.models, function(employee) {
            $(this.el).append(new directory.views.EmployeeListItemView({model: employee}).render().el);
        }, this);
        return this;
    }

});

directory.views.EmployeeListItemView = Backbone.View.extend({
    tagName: 'li',

    initialize: function(data) {
        this.template = _.template(directory.utils.templateLoader.get('parcours-list-item'));
    },

    render: function(eventName) {
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
    }

});

directory.views.ParcoursPage = Backbone.View.extend({

    initialize: function() {
        this.template = _.template(directory.utils.templateLoader.get('parcours-page'));
    },

    render: function(eventName) {
		var arr_photos = new Array();
		var temp_photos = this.model.attributes.photos.split(',');
		for (var i = 0; i < temp_photos.length; i++) {
			if (temp_photos[i] != '') {
				arr_photos.push(temp_photos[i]);
			}
		}
		this.model.attributes.photos = arr_photos;
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
    }

});


directory.views.ListPage = Backbone.View.extend({
    templateLoader: directory.utils.templateLoader,
    
    initialize: function(data) {
		//console.log(data);
		this.model = new directory.models.EspeceCollection();
		this.model.id = data.model.attributes.id;
		this.model.name = data.model.attributes.name;
        this.model.id_critere = data.model.attributes.id_critere;
        this.model.findByParcours(this.model.id_critere);
        this.template = _.template(this.templateLoader.get('list-page'));
    },

    render: function(eventName) {
		var json = {
			"nom_parcours" : this.model.name,
			"id_parcours" : this.model.id,
			"id_critere" : this.model.id_critere
		};
        $(this.el).html(this.template(json));
        this.listView = new directory.views.EspeceListView({el: $('ul', this.el), model: this.model});
        this.listView.render();
        return this;
    }
});


directory.views.EspeceListView = Backbone.View.extend({

    initialize: function(data) {
		//console.log(data);
		this.ce_critere = data.model.id_critere;
        this.model.bind('reset', this.render, this);
    },

    render: function(eventName) {
        $(this.el).empty();
        _.each(this.model.models, function(espece) {
			espece.attributes.ce_critere = this.ce_critere;
			espece.attributes.action_vue = (espece.attributes.vue == 1) ? 'bleu' : 'blanc';
            $(this.el).append(new directory.views.EspeceListItemView({model: espece}).render().el);
        }, this);
        return this;
    }

});

directory.views.EspeceListItemView = Backbone.View.extend({
    tagName: 'li',

    initialize: function(data) {
		//console.log(data);
        this.template = _.template(directory.utils.templateLoader.get('espece-list-item'));
    },

    render: function(eventName) {
		var temp_photos = this.model.attributes.photos.split(',');
		if (temp_photos[0] != '') {
			this.model.attributes.photos = temp_photos[0];
		}
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
    }

});


directory.views.EspecePage = Backbone.View.extend({
    templateLoader: directory.utils.templateLoader,
    
    initialize: function(data) {
		//console.log(data);
        this.template = _.template(this.templateLoader.get('espece-page'));
    },

    render: function(eventName) {
		var num_nom = this.model.attributes.id,
			ce_critere = this.model.attributes.ce_critere,
			arr_photos = new Array(),
			temp_photos = this.model.attributes.photos.split(',');
		for (var i = 0; i < temp_photos.length; i++) {
			if (temp_photos[i] != '') {
				arr_photos.push(temp_photos[i]);
			}
		}
		this.model.attributes.photos = arr_photos;
        $(this.el).html(this.template(this.model.toJSON()));
        
		directory.db.transaction(
			function(tx) {
				var sql =
					'SELECT vue ' +
					'FROM avoir_critere ' +
					'WHERE id_espece = :num_nom ' +
					'AND id_critere = :ce_critere ';
				tx.executeSql(sql, [num_nom, ce_critere], function(tx, results) {
					console.log(sql, num_nom, ce_critere, results);
				});
			},
			function(error) {
				console.log('DB | Error processing SQL: ' + error.code, error);
			}
		);
		
        return this;
    }
});


directory.views.CriterePage = Backbone.View.extend({
    templateLoader: directory.utils.templateLoader,
    
    initialize: function(data) {
		//console.log(data);
		this.model = new directory.models.CritereCollection();
		this.model.id = data.model.attributes.id;
        this.model.findAll(this.model.id);
    },

    render: function(eventName) {
	/*
		var json = {
			"nom_parcours" : this.model.name,
			"id_parcours" : this.model.id,
			"id_critere" : this.model.id_critere
		};
        $(this.el).html(this.template(json));
        this.listView = new directory.views.EspeceListView({el: $('ul', this.el), model: this.model});
        this.listView.render();
    */
        return this;
    }
});

directory.views.Accueil = Backbone.View.extend({
    templateLoader: directory.utils.templateLoader,
    
    initialize: function(data) {
		//console.log(data);
        this.template = _.template(this.templateLoader.get('accueil-page'));
    },

    render: function(eventName) {
        $(this.el).html(this.template());
        return this;
    }
});

// ----------------------------------------------- The Application Router ------------------------------------------ //

directory.Router = Backbone.Router.extend({
    routes: {
        "" : "accueil",
        "parcours" : "list",
        "parcours/:id_parcours" : "employeeDetails",
        "liste/:id_parcours/:nom_parcours/:id_critere" : "listeEspeces",
        "espece/:id_espece/:ce_parcours" : "especeDetails",
        "clef/:id_parcours" : "clefByParcours"
    },

    initialize: function() {

        var self = this;

	
        // Keep track of the history of pages (we only store the page URL). Used to identify the direction
        // (left or right) of the sliding transition between pages.
        this.pageHistory = [];

        // Register event listener for back button troughout the app
        $('#content').on('click', '.header-back-button', function(event) {
            window.history.back();
            return false;
        });
        
        $('body').on('click', '#modalReset', function(event) {
			var id = event.currentTarget.attributes.id.value;
			var hash = window.location.hash,
				arr_hash = hash.split('/'),
				id = arr_hash[arr_hash.length-1];
			directory.db.transaction(
				function(tx) {
					var sql =
						'UPDATE parcours ' +
						'SET est_commence = 0 ' +
						'WHERE id = :id_parcours';
					tx.executeSql(sql, [id]);
					
					sql =
						'UPDATE avoir_critere ' +
						'SET vue = 0 ' +
						'WHERE id_critere = ' +
							'(SELECT ce_critere ' +
							'FROM parcours ' +
							'WHERE id = :id_parcours)';
					tx.executeSql(sql, [id]);
				},
				function(error) {
					console.log('DB | Error processing SQL: ' + error.code, error);
				}
			);
			$('#myModal').modal('hide');
        });
        
        $('#content').on('click', '.choix-parcours', function(event) {
			var id = this.id;
			directory.db.transaction(
				function(tx) {
					var sql =
						'SELECT est_commence ' +
						'FROM parcours ' +
						'WHERE id = :id_parcours';
					tx.executeSql(sql, [id], function(tx, results) {
						if (results.rows.item(0).est_commence == 1) {
							$('#myModal').modal('show');	
						}
					});
				},
				function(error) {
					console.log('DB | Error processing SQL: ' + error.code, error);
				}
			);
			directory.db.transaction(
				function(tx) {
					var sql =
						'UPDATE parcours ' +
						'SET est_commence = 1 ' +
						'WHERE id = :id_parcours';
					tx.executeSql(sql, [id]);
				},
				function(error) {
					console.log('DB | Error processing SQL: ' + error.code, error);
				}
			);
        });
        
        $('#content').on('click', '.vue-espece', function(event) {
			var hash = window.location.hash,
				arr_hash = hash.split('/'),
				num_nom = arr_hash[arr_hash.length - 2],
				ce_critere = arr_hash[arr_hash.length - 1];
				
			directory.db.transaction(
				function(tx) {
					var sql =
						'UPDATE avoir_critere ' +
							'SET vue = 1 ' +
							'WHERE id_espece = :num_nom ' +
							'AND id_critere = :ce_critere';
					tx.executeSql(sql, [num_nom, ce_critere]);
				},
				function(error) {
					console.log('DB | Error processing SQL: ' + error.code, error);
				}
			);
			
			$('#btn-vue-espece').html('Bien joué ! ');
        });
        

        // Check of browser supports touch events...
        if (document.documentElement.hasOwnProperty('ontouchstart')) {
            // ... if yes: register touch event listener to change the "selected" state of the item
            $('#content').on('touchstart', 'a', function(event) {
                self.selectItem(event);
            });
            $('#content').on('touchend', 'a', function(event) {
                self.deselectItem(event);
            });
        } else {
            // ... if not: register mouse events instead
            $('#content').on('mousedown', 'a', function(event) {
                self.selectItem(event);
            });
            $('#content').on('mouseup', 'a', function(event) {
                self.deselectItem(event);
            });
        }

        // We keep a single instance of the SearchPage and its associated Employee collection throughout the app
        this.searchResults = new directory.models.EmployeeCollection();
        this.searchPage = new directory.views.SearchPage({model: this.searchResults});
        this.searchPage.render();
        $(this.searchPage.el).attr('id', 'searchPage');
    },
    
    accueil: function() {
        var self = this;
        self.slidePage(new directory.views.Accueil().render());
	},

    selectItem: function(event) {
        $(event.target).addClass('tappable-active');
    },

    deselectItem: function(event) {
        $(event.target).removeClass('tappable-active');
    },

    list: function() {
        var self = this;
        this.slidePage(this.searchPage);
    },

    employeeDetails: function(id) {
        var employee = new directory.models.Employee({id: id}),
            self = this;
        employee.fetch({
            success: function(data) {
                self.slidePage(new directory.views.ParcoursPage({model: data}).render());
            }
        });
    },
    
    listeEspeces: function(id, nom, critere) {
        var espece = new directory.models.Espece({id: id, name: nom, id_critere: critere}),
            self = this;
        espece.fetch({
            success: function(data) {
				//console.log(data);
                self.slidePage(new directory.views.ListPage({model: data}).render());
            }
        });
    },
    
    especeDetails: function(id, ce_critere) {
        var espece = new directory.models.Espece({id: id, ce_critere: ce_critere}),
            self = this;
        espece.fetch({
            success: function(data) {
				//console.log(data);
                self.slidePage(new directory.views.EspecePage({model: data}).render());
            }
        });
    },
    
    clefByParcours: function(id) {
        var critere = new directory.models.Espece({id: id}),
            self = this;
        critere.fetch({
            success: function(data) {
				//console.log(data);
                self.slidePage(new directory.views.CriterePage({model: data}).render());
            }
        });
		
	},

    slidePage: function(page) {

        var slideFrom,
            self = this;

        // If there is no current page (app just started) -> No transition: Position new page in the view port
        if (!this.currentPage) {
            $(page.el).attr('class', 'page stage-center');
            $('#content').append(page.el);
            this.pageHistory = [window.location.hash];
            this.currentPage = page;
            return;
        }

        // Cleaning up: remove old pages that were moved out of the viewport
        $('.stage-right, .stage-left').not('#searchPage').remove();

        if (page === this.searchPage) {
            // Always apply a Back (slide from left) transition when we go back to the search page
            slideFrom = "left";
            $(page.el).attr('class', 'page stage-left');
            // Reinitialize page history
            this.pageHistory = [window.location.hash];
        } else if (this.pageHistory.length > 1 && window.location.hash === this.pageHistory[this.pageHistory.length - 2]) {
            // The new page is the same as the previous page -> Back transition
            slideFrom = "left";
            $(page.el).attr('class', 'page stage-left');
            this.pageHistory.pop();
        } else {
            // Forward transition (slide from right)
            slideFrom = "right";
            $(page.el).attr('class', 'page stage-right');
            this.pageHistory.push(window.location.hash);
        }

        $('#content').html(page.el);

        // Wait until the new page has been added to the DOM...
        setTimeout(function() {
            // Slide out the current page: If new page slides from the right -> slide current page to the left, and vice versa
            $(self.currentPage.el).attr('class', 'page transition ' + (slideFrom === "right" ? 'stage-left' : 'stage-right'));
            // Slide in the new page
            $(page.el).attr('class', 'page stage-center transition');
            self.currentPage = page;
        });

    }

});

// Bootstrap the application
directory.db = window.openDatabase("ParcoursDAO", "1.0", "Employee Demo DB", 200000);
var employeeDAO = new directory.dao.ParcoursDAO(directory.db);
var especeDAO = new directory.dao.EspeceDAO(directory.db);
var critereDAO = new directory.dao.CritereDAO(directory.db);
var avr_critereDAO = new directory.dao.AvoirCritereDAO(directory.db);
especeDAO.populate();
employeeDAO.populate();
critereDAO.populate();
avr_critereDAO.populate();
$().ready(function() {
    directory.utils.templateLoader.load(['search-page', 'accueil-page', 'parcours-page', 'parcours-list-item', 'espece-list-item', 'list-page', 'espece-page'],
        function() {
            directory.app = new directory.Router();
            Backbone.history.start();
        });
});
