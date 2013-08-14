'use strict';

var ___FC = {
	models: {},
	views: {},
	utils: {},
	dao: {}
};

// -------------------------------------------------- Utilities ---------------------------------------------------- //

// The Template Loader. Used to asynchronously load templates located in separate .html files
___FC.utils.templateLoader = {
	templates: {},
	
	load: function(names, callback) {
		var deferreds = [],
			self = this;
		
		$.each(names, function(index, name) {
			deferreds.push($.get('modules/templates/' + name + '.html', function(data) {
				self.templates[name] = data;
			}));
		});
		$.when.apply(null, deferreds).done(callback);
	},
	
	get: function(name) {
		return this.templates[name];
	}
};



//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DAO PARCOURS
___FC.dao.ParcoursDAO = function(db) {
	this.db = db;
};
_.extend(___FC.dao.ParcoursDAO.prototype, {
	findByName: function(key, callback) {
		this.db.transaction(function(tx) {
			var sql = 
				"SELECT id, nom, latitude_centre, longitude_centre, fichier_carte, ce_critere " +
				"FROM parcours " +
				"WHERE nom LIKE ? " +
				"ORDER BY nom";
			tx.executeSql(sql, ['%' + key + '%'], function(tx, results) {
				var len = results.rows.length,
					parcours = [],
					i = 0;
				for (; i < len; i = i + 1) {
					parcours[i] = results.rows.item(i);
				}
				callback(parcours);
			});
		},
		function(tx, error) {
			alert('Transaction Error: ' + error);
		});
	},
	
	findById: function(id, callback) {
		this.db.transaction(function(tx) {
			var sql = 
				"SELECT id, nom, latitude_centre, longitude_centre, fichier_carte, description, photos, ce_critere " +
				"FROM parcours " +
				"WHERE id = :id_parcours";
			tx.executeSql(sql, [id], function(tx, results) {
				callback(results.rows.length === 1 ? results.rows.item(0) : null);
			});
		},
		function(tx, error) {
			alert('Transaction Error: ' + error);
			console.log('DB | Error processing SQL: ' + error.code, error);
		});
	},
	
	findAll: function(callback) {
		this.db.transaction(function(tx) {
			var sql = 
				"SELECT id, nom, latitude_centre, longitude_centre, fichier_carte, description, photos " +
				"FROM parcours";
			tx.executeSql(sql, [], function(tx, results) {
				callback(results.rows.item);
			});
		},
		function(error) {
			console.log('DB | Error processing SQL: ' + error.code, error);
		});
	},
	
	populate: function(callback) {
		___FC.db.transaction(function(tx) {
			console.log('Dropping PARCOURS table');
			tx.executeSql('DROP TABLE IF EXISTS parcours');
			
			var sql =
				"CREATE TABLE IF NOT EXISTS parcours (" +
					"id INT NOT NULL ," +
					"nom VARCHAR(255) NOT NULL ," +
					"latitude_centre DECIMAL NULL ," +
					"longitude_centre DECIMAL NULL ," +
					"fichier_carte VARCHAR(255) NULL ," +
					"photos VARCHAR(255) NULL ," +
					"description TEXT NULL ," +
					"ce_critere INT NULL ," +
				"PRIMARY KEY (id)," +
				"CONSTRAINT ce_critere " +
					"FOREIGN KEY (ce_critere)" +
					"REFERENCES critere (id_critere)" + 
					"ON DELETE NO ACTION " + 
					"ON UPDATE NO ACTION " + 
				")";
			console.log('Creating PARCOURS table');
			tx.executeSql(sql);
		},
		function(error) {
			//alert('Transaction error ' + error);
			console.log('DB | Error processing SQL: ' + error.code, error);
		},
		function(tx) {	});
		
		console.log('Inserting parcours');
		$.ajax({
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
						if (j < (arr_valeurs.length - 1)) {
							sql += ',';
						}
					}
					arr_sql.push(
						"INSERT INTO parcours "
						+ "(id, nom, latitude_centre, longitude_centre, fichier_carte, photos, description, ce_critere) "
						+ "VALUES (" + sql + ")"
					);
				}
				//console.log(arr_sql);
				___FC.db.transaction(function (tx) {
					for (var c = 0; c < arr_sql.length; c++) {
						tx.executeSql(arr_sql[c]);
					}
				}, 
				function(error) {
					console.log('DB | Error processing SQL: ' + error.code, error);
				},
				function(tx) {	});
			},
			error : function(jqXHR, textStatus, errorThrown) {
				console.log(textStatus);
			}
		});
	}
});
_.extend(___FC.dao.ParcoursDAO.prototype, ___FC.dao.baseDAOBD);


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DAO ESPECE
___FC.dao.EspeceDAO = function(db) {
	this.db = db;
};
_.extend(___FC.dao.EspeceDAO.prototype, {
	findByName: function(key, callback) {
		this.db.transaction(function(tx) {
			var sql = 
				"SELECT num_nom, nom_sci, famille, nom_vernaculaire,  photos " +
				"FROM espece " + 
				"WHERE nom_sci || ' ' || nom_vernaculaire || ' ' || famille LIKE ? " +
				"ORDER BY nom_vernaculaire";
			tx.executeSql(sql, ['%' + key + '%'], function(tx, results) {
				var len = results.rows.length,
					especes = [],
					i = 0;
				for (; i < len; i = i + 1) {
					especes[i] = results.rows.item(i);
				}
				callback(especes);
			});
		},
		function(tx, error) {
			alert('Transaction Error: ' + error);
		});
	},
	
	findById: function(id, callback) {
		this.db.transaction(function(tx) {
			var sql = 
				"SELECT num_nom, nom_sci, famille, nom_vernaculaire, description, photos, referentiel, famille, num_taxon " +
				"FROM espece " +
				"WHERE num_nom = :id_espece";
			tx.executeSql(sql, [id], function(tx, results) {
				callback(results.rows.length === 1 ? results.rows.item(0) : null);
			});
		},
		function(error) {
			console.log('DB | Error processing SQL: ' + error.code, error);
		});
	},
	
	findByParcours: function(id, callback) {
		this.db.transaction(function(tx) {
			var sql = 
				"SELECT e.num_nom, e.nom_sci, e.famille, e.nom_vernaculaire, e.photos, c.vue " +
				"FROM espece e " +
				"JOIN avoir_critere c ON e.num_nom = c.id_espece " +
				"WHERE c.id_critere = :id_parcours " + 
				"ORDER BY nom_vernaculaire";
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
		});
	},
	
	findAll: function(callback) {
		this.db.transaction(function(tx) {
			var sql = 
				"SELECT num_nom, nom_sci, famille, nom_vernaculaire, photos " +
				"FROM espece " +
				"ORDER BY nom_vernaculaire";
			tx.executeSql(sql, [], function(tx, results) {
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
		});
	},
	
	populate: function(callback) {
		___FC.db.transaction(function(tx) {
			console.log('Dropping ESPECE table');
			tx.executeSql('DROP TABLE IF EXISTS espece');
			
			var sql =
				"CREATE TABLE IF NOT EXISTS espece (" +
					"num_nom INT NOT NULL ," +
					"nom_sci VARCHAR(255) NOT NULL ," +
					"famille VARCHAR(255) NULL ," +
					"num_taxon INT NULL ," +
					"referentiel VARCHAR(45) NOT NULL DEFAULT 'bdtfx' ," +
					"nom_vernaculaire VARCHAR(255) NULL ," +
					"description TEXT NULL ," +
					"photos VARCHAR(255) NULL ," +
				"PRIMARY KEY (num_nom) )";
			console.log('Creating ESPECE table');
			tx.executeSql(sql);
		},
		function(error) {
			console.log('DB | Error processing SQL: ' + error.code, error);
		},
		function(tx) {	});
		
		console.log('Inserting espece');
		$.ajax({
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
					arr_sql.push(
						"INSERT INTO espece "
						+ "(nom_sci, num_nom, famille, num_taxon, nom_vernaculaire, description, photos, referentiel) "
						+ "VALUES (" + sql + ")"
					);
				}
				//console.log(arr_sql);
				___FC.db.transaction(function (tx) {
					for (var c = 0; c < arr_sql.length; c++) {
						tx.executeSql(arr_sql[c]);
					}
				}, 
				function(error) {
					console.log('DB | Error processing SQL: ' + error.code, error);
				},
				function(tx) {	});
			},
			error : function(jqXHR, textStatus, errorThrown) {
				console.log(textStatus);
			}
		});
	}
});
_.extend(___FC.dao.EspeceDAO.prototype, ___FC.dao.baseDAOBD);


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DAO CRITERE
___FC.dao.CritereDAO = function(db) {
	this.db = db;
};
_.extend(___FC.dao.CritereDAO.prototype, {
	findAll: function(callback) {
		this.db.transaction(function(tx) {
			var sql = 
					"SELECT c.id_critere, intitule, url_img, ce_parent FROM critere c " +
					"WHERE ce_parent NOT IN ( " +
						"SELECT id_critere FROM critere " +
						"WHERE intitule LIKE '%parcours%' " + 
					") " + 
					"AND ce_parent NOT IN ( " +
						"SELECT id_critere FROM critere " +
						"WHERE intitule LIKE '%pheno%' " + 
					") " + 
					"AND intitule NOT LIKE '%parcours%' " +
					"AND intitule NOT LIKE '%pheno%' ";
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
		function(error) {
			console.log('DB | Error processing SQL: ' + error.code, error);
		});
	},
	
	populate: function(callback) {
		this.db.transaction(function(tx) {
			console.log('Dropping CRITERE table');
			tx.executeSql('DROP TABLE IF EXISTS critere');
			
			var sql =
				"CREATE TABLE IF NOT EXISTS critere (" +
					"id_critere INT NOT NULL ," +
					"intitule VARCHAR(45) NOT NULL ," +
					"url_img VARCHAR(45) NULL ," +
					"ce_parent INT NULL ," +
					"PRIMARY KEY (id_critere) ," +
					"CONSTRAINT ce_parent " +
						"FOREIGN KEY (ce_parent)" +
						"REFERENCES critere (id_critere)" + 
						"ON DELETE NO ACTION " + 
						"ON UPDATE NO ACTION " + 
				")";
			console.log('Creating CRITERE table');
			tx.executeSql(sql);
		},
		function(error) {
			console.log('DB | Error processing SQL: ' + error.code, error);
		},
		function(tx) {	});
		
		console.log('Inserting critere');
		$.ajax({
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
						if (j < (arr_valeurs.length - 1)) {
							sql += ',';
						}
					}
					arr_sql.push(sql);
				}
				//console.log(arr_sql);
				___FC.db.transaction(function (tx) {
					for (var c = 0; c < arr_sql.length; c++) {
						tx.executeSql(
							"INSERT INTO critere " +
							"(id_critere, intitule, url_img, ce_parent) VALUES (" + arr_sql[c] + ")"
						);
					}
				}, 
				function(error) {
					console.log('DB | Error processing SQL: ' + error.code, error);
				},
				function(tx) {	});
			},
			error : function(jqXHR, textStatus, errorThrown) {
				console.log(textStatus);
			}
		});
	}
});
_.extend(___FC.dao.CritereDAO.prototype, ___FC.dao.baseDAOBD);


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DAO AVOIR_CRITERE
___FC.dao.AvoirCritereDAO = function(db) {
	this.db = db;
};
_.extend(___FC.dao.AvoirCritereDAO.prototype, {
	populate: function(callback) {
		___FC.db.transaction(function(tx) {
			console.log('Dropping AVOIR_CRITERE table');
			tx.executeSql('DROP TABLE IF EXISTS avoir_critere');
			
			var sql =
				"CREATE TABLE IF NOT EXISTS avoir_critere (" +
					"id_espece INT NOT NULL ," +
					"id_critere INT NOT NULL ," +
					"vue BOOLEAN NULL ," +
					"PRIMARY KEY (id_espece, id_critere) , " +
					"CONSTRAINT id_critere " + 
						"FOREIGN KEY (id_critere)" +
						"REFERENCES critere (id_critere) " +
						"ON DELETE NO ACTION " +
						"ON UPDATE NO ACTION," +
					"CONSTRAINT id_espece " +
						"FOREIGN KEY (id_espece)" +
						"REFERENCES espece (num_nom)" +
						"ON DELETE NO ACTION " + 
						"ON UPDATE NO ACTION " + 
				")";
			console.log('Creating AVOIR_CRITERE table');
			tx.executeSql(sql);
		},
		function(error) {
			console.log('DB | Error processing SQL: ' + error.code, error);
		},
		function(tx) {	});
		
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
				___FC.db.transaction(function (tx) {
					for (var c = 0; c < arr_sql.length; c++) {
						tx.executeSql(
							"INSERT INTO avoir_critere " +
							"(id_espece, id_critere) VALUES (" + arr_sql[c] + ")"
						);
					}
				}, 
				function(error) {
					console.log('DB | Error processing SQL: ' + error.code, error);
				},
				function(tx) {	});
			},
			error : function(jqXHR, textStatus, errorThrown) {
				console.log(textStatus);
			}
		});
	}
});
_.extend(___FC.dao.AvoirCritereDAO.prototype, ___FC.dao.baseDAOBD);


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DAO OBSERVATION
___FC.dao.ObsDAO = function(db) {
	this.db = db;
};
_.extend(___FC.dao.ObsDAO.prototype, {
	findById: function(id, callback) {
		this.db.transaction(function(tx) {
			var sql = 
				"SELECT num_nom, nom_sci, nom_vernaculaire, id_obs, date, commune, code_insee " +
				"FROM espece e " +
				"JOIN obs o ON e.num_nom = o.ce_espece " +
				"WHERE id_obs = :id_obs";
			tx.executeSql(sql, [id], function(tx, results) {
				callback(results.rows.length === 1 ? results.rows.item(0) : null);
			});
		},
		function(error) {
			console.log('DB | Error processing SQL: ' + error.code, error);
		});
	},
	
	findAll: function(callback) {
		this.db.transaction(function(tx) {
			var sql = 
				"SELECT num_nom, nom_sci, nom_vernaculaire, id_obs, date, commune, code_insee, a_ete_transmise " +
				"FROM espece " +
				"JOIN obs ON num_nom = ce_espece " +
				"ORDER BY a_ete_transmise ASC, id_obs DESC";
			tx.executeSql(sql, [], function(tx, results) {
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
		});
	},
	
	findForTransmission: function(callback) {
		this.db.transaction(function(tx) {
			var sql = 
				"SELECT num_nom, nom_sci, num_taxon, famille, referentiel, " + 
						"id_obs, latitude, longitude, date, commune, code_insee, mise_a_jour " +
				"FROM espece " +
				"JOIN obs ON num_nom = ce_espece " +
				"ORDER BY id_obs DESC";
			tx.executeSql(sql, [], function(tx, results) {
				 var nbre = results.rows.length,
					obs = [],
					i = 0;
				for (; i < nbre; i = i + 1) {
					obs[i] = results.rows.item(i);
				}
				callback(obs);
			});
		},
		function(error) {
			console.log('DB | Error processing SQL: ' + error.code, error);
		});
	},
	
	populate: function(callback) {
		___FC.db.transaction(function(tx) {
			//console.log('Dropping OBS table');
			//tx.executeSql('DROP TABLE IF EXISTS obs');
			
			var sql =
				"CREATE TABLE IF NOT EXISTS obs (" +
					"id_obs INT NOT NULL ,"+
					"date DATE NOT NULL ," +
					"latitude DECIMAL NULL ," +
					"longitude DECIMAL NULL ," +
					"commune VARCHAR(255) NULL ," +
					"code_insee INT NULL ," +
					"mise_a_jour TINYINT(1) NOT NULL DEFAULT 0 ," +
					"a_ete_transmise TINYINT(1) NOT NULL DEFAULT 0 ," +
					"ce_espece INT NOT NULL," +
					"PRIMARY KEY (id_obs)," +
					"CONSTRAINT ce_espece " +
						"FOREIGN KEY (ce_espece)" +
						"REFERENCES espece (num_nom)" +
						"ON DELETE NO ACTION " +
						"ON UPDATE NO ACTION " +
				")";
			console.log('Creating OBS table');
			tx.executeSql(sql);
		},
		function(error) {
			console.log('DB | Error processing SQL: ' + error.code, error);
		},
		function(tx) {	});
	}
});
_.extend(___FC.dao.ObsDAO.prototype, ___FC.dao.baseDAOBD);


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DAO PHOTO
___FC.dao.PhotoDAO = function(db) {
	this.db = db;
};
_.extend(___FC.dao.PhotoDAO.prototype, {
	findByObs: function(id, callback) {
		this.db.transaction(function(tx) {
			var sql = 
				"SELECT id_photo, chemin " +
				"FROM photo " +
				"WHERE ce_obs = :id_obs";

			tx.executeSql(sql, [id], function(tx, results) {
				 var nbre = results.rows.length,
					photos = [],
					i = 0;
				for (; i < nbre; i = i + 1) {
					photos[i] = results.rows.item(i);
				}
				callback(photos);
			});
		},
		function(error) {
			console.log('DB | Error processing SQL: ' + error.code, error);
		});
	},
	
	populate: function(callback) {
		___FC.db.transaction(function(tx) {
			//console.log('Dropping PHOTO table');
			//tx.executeSql('DROP TABLE IF EXISTS photo');
			
			var sql =
				"CREATE TABLE IF NOT EXISTS photo (" +
					"id_photo INT NOT NULL ," +
					"chemin TEXT NOT NULL ," +
					"ce_obs INT NOT NULL ," +
					"PRIMARY KEY (id_photo) ," +
					"CONSTRAINT ce_obs " +
						"FOREIGN KEY (ce_obs) " +
						"REFERENCES obs (id_obs) " +
						"ON DELETE NO ACTION " + 
						"ON UPDATE NO ACTION " +
				")";
			console.log('Creating PHOTO table');
			tx.executeSql(sql);
		},
		function(error) {
			console.log('DB | Error processing SQL: ' + error.code, error);
		},
		function(tx) {	});
	}
});
_.extend(___FC.dao.PhotoDAO.prototype, ___FC.dao.baseDAOBD);


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DAO UTILISATEUR
___FC.dao.UtilisateurDAO = function(db) {
	this.db = db;
};
_.extend(___FC.dao.UtilisateurDAO.prototype, {
	findOne: function(callback) {
		this.db.transaction(function(tx) {
			var sql = 
				"SELECT id_user, nom, prenom, email, compte_verifie " +
				"FROM utilisateur " + 
				"WHERE compte_verifie LIKE 'true' "
				"ORDER BY id_user DESC";
			tx.executeSql(sql, [], function(tx, results) {
				callback(results.rows.length >= 1 ? results.rows.item(0) : null);
			});
		},
		function(error) {
			console.log('DB | Error processing SQL: ' + error.code, error);
		});
	},
	
	populate: function(callback) {
		___FC.db.transaction(function(tx) {
			//console.log('Dropping UTILISATEUR table');
			//tx.executeSql('DROP TABLE IF EXISTS utilisateur');
			
			var sql =
				"CREATE TABLE IF NOT EXISTS utilisateur (" +
					"id_user INT NOT NULL, " +
					"nom VARCHAR(255) NULL, " +
					"prenom VARCHAR(255) NULL, " +
					"email VARCHAR(255) NOT NULL, " +
					"compte_verifie BOOLEAN NOT NULL, " +
					"PRIMARY KEY (id_user) " +
				")";
			console.log('Creating UTILISATEUR table');
			tx.executeSql(sql);
		},
		function(error) {
			console.log('DB | Error processing SQL: ' + error.code, error);
		},
		function(tx) {	});
	}
});
_.extend(___FC.dao.UtilisateurDAO.prototype, ___FC.dao.baseDAOBD);



// Overriding Backbone's sync method. Replace the default RESTful services-based implementation
// with a simple local database approach.
Backbone.sync = function(method, model, options) {
	var dao = new model.dao(___FC.db);
	
	if (method === 'read') {
		if (model.id) {
			dao.findById(model.id, function(data) {
				options.success(data);
			});
		} else {
			if (model.id_obs) {
				dao.findByObs(model.id_obs, function(data) {
					options.success(data);
				});
			} else {
				dao.findAll(function(data) {
					options.success(data);
				});
			}
		}
	}
};



// -------------------------------------------------- The Models ---------------------------------------------------- //



//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Modèle PARCOURS
___FC.models.Parcours = Backbone.Model.extend({
	dao: ___FC.dao.ParcoursDAO,
	initialize: function() {	}
});
___FC.models.ParcoursCollection = Backbone.Collection.extend({
	dao: ___FC.dao.ParcoursDAO,
	model: ___FC.models.Parcours,

	findByName: function(key) {
		var parcoursDAO = new ___FC.dao.ParcoursDAO(___FC.db),
			self = this;
		parcoursDAO.findByName(key, function(data) {
			//console.log('ParcoursCollection | findByName ', data);
			self.reset(data);
		});
	},
	
	findAll: function() {
		var parcoursDAO = new ___FC.dao.ParcoursDAO(___FC.db),
			self = this;
		parcoursDAO.findAll(function(data) {
			//console.log('ParcoursCollection | findAll ', data);
			self.reset(data);
		});
	}
});


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Modèle ESPECE
___FC.models.Espece = Backbone.Model.extend({
	dao: ___FC.dao.EspeceDAO,
	initialize: function() {	}
});
___FC.models.EspeceCollection = Backbone.Collection.extend({
	dao: ___FC.dao.EspeceDAO,
	model: ___FC.models.Espece,
	
	findByName: function(key) {
		var especeDAO = new ___FC.dao.EspeceDAO(___FC.db),
			self = this;
		especeDAO.findByName(key, function(data) {
			//console.log('EspeceCollection | findByName ', data);
			self.reset(data);
		});
	}, 
	
	findById: function(key) {
		var especeDAO = new ___FC.dao.EspeceDAO(___FC.db),
			self = this;
		especeDAO.findById(key, function(data) {
			//console.log('EspeceCollection | findById ', data);
			self.reset(data);
		});
	}, 
	
	findByParcours: function(key) {
		var especeDAO = new ___FC.dao.EspeceDAO(___FC.db),
			self = this;
		especeDAO.findByParcours(key, function(data) {
			self.reset(data);
			//console.log('EspeceCollection | findByParcours ', data);
		});
	},
	
	findAll: function() {
		var especeDAO = new ___FC.dao.EspeceDAO(___FC.db),
			self = this;
		especeDAO.findAll(function(data) {
			self.reset(data);
			//console.log('EspeceCollection | findAll ', data);
		});
	}
});


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Modèle CRITERE
___FC.models.Critere = Backbone.Model.extend({
	dao: ___FC.dao.ParcoursDAO,
	initialize: function() {	}
});
___FC.models.CritereCollection = Backbone.Collection.extend({
	dao: ___FC.dao.CritereDAO,
	model: ___FC.models.Critere,
	
	findAll: function() {
		var critereDAO = new ___FC.dao.CritereDAO(___FC.db),
			self = this;
		critereDAO.findAll(function(data) {
			//console.log("critereCollection ", data);
			self.reset(data);
		});
	}
});


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Modèle OBSERVATION
___FC.models.Obs = Backbone.Model.extend({
	dao: ___FC.dao.ObsDAO,
	initialize: function() {	}
});
___FC.models.ObsCollection = Backbone.Collection.extend({
	dao: ___FC.dao.ObsDAO,
	model: ___FC.models.Obs,
	
	findById: function(key) {
		var obsDAO = new ___FC.dao.ObsDAO(___FC.db),
			self = this;
		obsDAO.findById(key, function(data) {
			//console.log('ObsCollection | findById ', data);
			self.reset(data);
		});
	},
	
	findAll: function() {
		var obsDAO = new ___FC.dao.ObsDAO(___FC.db),
			self = this;
		obsDAO.findAll(function(data) {
			//console.log('ObsCollection | findAll ', data);
			self.reset(data);
		});
	}
});


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Modèle PHOTO
___FC.models.Photo = Backbone.Model.extend({
	dao: ___FC.dao.PhotoDAO,
	initialize: function() {	}
});
___FC.models.PhotoCollection = Backbone.Collection.extend({
	dao: ___FC.dao.PhotoDAO,
	model: ___FC.models.Photo,
	
	findByObs: function(key) {
		var photoDAO = new ___FC.dao.PhotoDAO(___FC.db),
			self = this;
		photoDAO.findByObs(key, function(data) {
			//console.log('PhotoCollection | findByObs ', data);
			self.reset(data);
		});
	}
});


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Modèle UTILISATEUR
___FC.models.Utilisateur = Backbone.Model.extend({
	dao: ___FC.dao.UtilisateurDAO,
	initialize: function() {	}
});
___FC.models.UtilisateurCollection = Backbone.Collection.extend({
	dao: ___FC.dao.UtilisateurDAO,
	model: ___FC.models.Utilisateur,
	
	findOne: function() {
		var utilisateurDAO = new ___FC.dao.UtilisateurDAO(___FC.db),
			self = this;
		utilisateurDAO.findOne(function(data) {
			//console.log('UtilisateurCollection | findOne ', data);
			self.reset(data);
		});
	}
});



// -------------------------------------------------- The Views ---------------------------------------------------- //



//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Vue Liste PARCOURS
___FC.views.SearchPage = Backbone.View.extend({
	templateLoader: ___FC.utils.templateLoader,

	initialize: function() {
		this.template = _.template(this.templateLoader.get('parcours-liste'));
		this.model.findByName('');
	},
	
	render: function(eventName) {
		$(this.el).html(this.template(this.model.toJSON()));
		this.listView = new ___FC.views.ParcoursListView({el: $('ul', this.el), model: this.model});
		this.listView.render();
		return this;
	}
});
___FC.views.ParcoursListView = Backbone.View.extend({
	initialize: function() {
		this.model.bind('reset', this.render, this);
	},
	
	render: function(eventName) {
		$(this.el).empty();
		_.each(this.model.models, function(parcours) {
			$(this.el).append(new ___FC.views.ParcoursListItemView({model: parcours}).render().el);
		}, this);
		return this;
	}
});
___FC.views.ParcoursListItemView = Backbone.View.extend({
	tagName: 'li',
	
	initialize: function(data) {
		this.template = _.template(___FC.utils.templateLoader.get('parcours-liste-item'));
	},
	
	render: function(eventName) {
		$(this.el).html(this.template(this.model.toJSON()));
		return this;
	}
});


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Vue Détails PARCOURS
___FC.views.ParcoursPage = Backbone.View.extend({
	initialize: function(data) {
		___FC.liste = new Array();
		___FC.criteria = new Array();
		___FC.nbre_criteres = new Array();
		___FC.nbre_especes = null;

		//console.log(this.model);	
		this.model.bind('reset', this.render, this);	
		this.template = _.template(___FC.utils.templateLoader.get('parcours-page'));
	},
	
	render: function(eventName) {
		var arr_photos = new Array(),
			temp_photos = String(this.model.attributes.photos).split(',');
		for (var i = 0; i < temp_photos.length; i++) {
			if (temp_photos[i] != '') {
				arr_photos.push(temp_photos[i]);
			}
		}
		//console.log(___FC.parcours);
		this.model.attributes.total = null;
		this.model.attributes.nbre_vues = null;
		for (var i = 0; i < ___FC.parcours.length; i++) {
			if (___FC.parcours[i]['ce_critere'] == this.model.attributes.ce_critere) {
				this.model.attributes.total = ___FC.parcours[i]['total'];
				this.model.attributes.nbre_vues = ___FC.parcours[i]['nbre_vues'];
			}
		}
		this.model.attributes.photos = arr_photos;
		$(this.el).html(this.template(this.model.toJSON()));
		return this;
	}
});


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Vue Liste ESPECE
___FC.views.ListPage = Backbone.View.extend({
	templateLoader: ___FC.utils.templateLoader,
	
	initialize: function(data) {
		//console.log(data);		
		this.model = new ___FC.models.EspeceCollection();
		this.model.id = data.model.attributes.id;
		this.model.name = data.model.attributes.name;
		this.model.id_critere = data.model.attributes.id_critere;
		if (this.model.id == 0) {
			this.model.findAll();
		} else {
			this.model.findByParcours(this.model.id_critere);
		}
		this.template = _.template(this.templateLoader.get('espece-liste'));
	},
	
	render: function(eventName) {
		var lien = (this.model.id == 0) ? '' : '/'+this.model.id,
			profil = (this.model.id == 0) ? 'transmission' : 'profil/'+this.model.id+'/	'+this.model.name,
			json = {
				'nom_parcours' : this.model.name,
				'id_parcours' : this.model.id,
				'id_critere' : this.model.id_critere,
				'lien_parcours' : 'parcours'+lien,
				'lien_profil' : profil
			};
		
		$(this.el).html(this.template(json));
		this.listView = new ___FC.views.EspeceListView({el: $('ul', this.el), model: this.model});
		this.listView.render();
		return this;
	}
});
___FC.views.EspeceListView = Backbone.View.extend({
	initialize: function(data) {
		//console.log(data);
		this.ce_critere = data.model.id_critere;
		this.model.bind('reset', this.render, this);
	},
	
	render: function(eventName) {
		var arr_especes = new Array(),
			arr_temp = this.model.models,
			arr_ids = new Array(),
			nbre_triees = ___FC.liste.length;
			
		if (___FC.nbre_choix != null) {
			for (var pourcentage = ___FC.nbre_choix; pourcentage >= 0; pourcentage--) {
				for (var i = 0; i < arr_temp.length; i++) {
					if (___FC.nbre_criteres[arr_temp[i].attributes.num_nom] == pourcentage) {
						arr_temp[i].attributes.pourcentage = pourcentage + '/' + ___FC.nbre_choix;
						arr_especes.push(arr_temp[i]);
					}
				}
			}
			
			for (var i = 0; i < arr_temp.length; i++) {
				var index_liste = $.inArray(arr_temp[i].attributes.num_nom, ___FC.liste),
					index_criteres = (typeof ___FC.nbre_criteres[arr_temp[i].attributes.num_nom] === 'undefined') ? -1 : 0;
				if (index_liste == -1 && index_criteres == -1) {
					arr_temp[i].attributes.pourcentage = 0 + '/' + ___FC.nbre_choix;
					arr_especes.push(arr_temp[i]);
				}
			}
			this.model.models = arr_especes;
		}
		
		//console.log(this.model.models);
		$(this.el).empty();
		_.each(this.model.models, function(espece) {
			espece.attributes.ce_critere = this.ce_critere;
			espece.attributes.action_vue = (espece.attributes.vue == 1) ? 'bleu' : 'blanc';
			$(this.el).append(new ___FC.views.EspeceListItemView({model: espece}).render().el);
		}, this);
		return this;
	}

});
___FC.views.EspeceListItemView = Backbone.View.extend({
	tagName: 'li',
	
	initialize: function(data) {
		//console.log(data);
		this.template = _.template(___FC.utils.templateLoader.get('espece-liste-item'));
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


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Vue Détails ESPECE
___FC.views.EspecePage = Backbone.View.extend({
	templateLoader: ___FC.utils.templateLoader,
	
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
		
		___FC.db.transaction(function(tx) {
			var sql =
				"SELECT vue " +
				"FROM avoir_critere " +
				"WHERE id_espece = :num_nom " +
				"AND id_critere = :ce_critere ";
			tx.executeSql(sql, [num_nom, ce_critere], function(tx, results) {
				if (results.rows.length != 0) {
					if (results.rows.item(0).vue == 1) {
						$('#btn-vue-espece').html('Déjà vue !');
						$('#btn-vue-espece').addClass('bleu');
					}
				}
			});
		},
		function(error) {
			console.log('DB | Error processing SQL: ' + error.code, error);
		});
		return this;
	}
});


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Vue Page CRITERE (Clef)
___FC.views.CriterePage = Backbone.View.extend({
	templateLoader: ___FC.utils.templateLoader,
	
	initialize: function(data) {
		//console.log(data);
		this.model = new ___FC.models.CritereCollection();
		this.model.id = data.model.attributes.id;
		this.model.nom = data.model.attributes.nom;
		this.model.ce_critere = data.model.attributes.ce_parcours;
		this.model.findAll(this.model.id);
		this.model.bind('reset', this.render, this);
		this.template = _.template(___FC.utils.templateLoader.get('critere-liste'));
	},
	
	render: function(eventName) {
		var arr_criteres = new Array(),
			models = this.model.models;
		for (var i = 0; i < models.length; i++) {
			var critere = models[i].attributes;
			if (critere.ce_parent == 'null') {
				arr_criteres[critere.id_critere] = new Array();
				arr_criteres[critere.id_critere].push(critere.intitule);
			} else {
				var valeur = critere.id_critere+';'+critere.intitule;
				valeur += (critere.url_img == '') ? '' : ';'+critere.url_img;
				arr_criteres[critere.ce_parent].push(valeur);
			}
		}		
		//console.log(arr_criteres);
		var arr_floraison = new Array(),
			arr_feuillaison = new Array(),
			arr_fructification = new Array();
			
		arr_floraison.push('La plante est-elle en fleur ?');
		arr_floraison.push('floraison;La plante est en fleur.;pheno_fleur.png');
		
		arr_feuillaison.push('L\'espèce est-elle en feuille ?');
		arr_feuillaison.push('feuillaison;;pheno_feuille.png');
		
		arr_fructification.push('Des fruits sont-ils présents ?');
		arr_fructification.push('fructification;Il y a des fruits.;mail.png');
		
		arr_criteres.push(arr_floraison);
		arr_criteres.push(arr_feuillaison);
		arr_criteres.push(arr_fructification);
		
		var json = {
			'id' : this.model.id,
			'nom' : this.model.nom,
			'ce_critere' : this.model.ce_critere,
			'criteres' : arr_criteres,
			'total': ___FC.nbre_especes
		};
		
		$(this.el).empty();
		$(this.el).html(this.template(json));
		 _.each(arr_criteres, function(criteres) {
			$('#criteres-liste').append(new ___FC.views.CritereListItemView({el: $('#criteres-liste', this.el), model: criteres}).render().el);
		}, this);
		return this;
	}
});
___FC.views.CritereListItemView = Backbone.View.extend({
	initialize: function(data) {
		//console.log(data);
		this.template = _.template(___FC.utils.templateLoader.get('critere-liste-item'));
	},
	
	render: function(eventName) {
		var arr_valeurs = new Array(),
			arr_checked = new Array();
		for (var i = 1; i < this.model.length; i++) {
			arr_checked.push(___FC.criteria[this.model[0]] == this.model[i]);
			arr_valeurs.push(this.model[i]);
		}
		
		var json = {
			'titre' : this.model[0],
			'valeurs' : arr_valeurs,
			'checked' : arr_checked
		};
		$(this.el).append(this.template(json));
		return this;
	}
});


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Vue Page Accueil
___FC.views.Accueil = Backbone.View.extend({
	templateLoader: ___FC.utils.templateLoader,
	
	initialize: function(data) {
		//console.log(data);
		this.template = _.template(this.templateLoader.get('accueil'));
	},

	render: function(eventName) {
		$(this.el).html(this.template());
		return this;
	}
});


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Vue Page Saisie OBS
___FC.views.saisieObs = Backbone.View.extend({
	initialize: function() {
		geolocaliser();
		var date = new Date(),
			jour = date.getDate(),
			mois = date.getMonth() + 1,
			annee = date.getFullYear(),
			aujourdhui = 
				( (''+jour).length < 2 ? '0' : '') + jour + '/' +
				( (''+mois).length < 2 ? '0' : '') + mois + '/' +
				annee;
		this.model.attributes.date = aujourdhui;
		this.template = _.template(___FC.utils.templateLoader.get('obs-saisie'));
	},
	
	render: function(eventName) {
		this.model.attributes.position = this.position;
		//console.log(this.model);
		$(this.el).html(this.template(this.model.toJSON()));
		return this;
	}
});


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Vue Détails OBS
___FC.views.ObsPage = Backbone.View.extend({
	initialize: function(data) {
		//console.log(data);
		this.data = data.model.attributes;
		this.model = new ___FC.models.PhotoCollection();
		this.model.findByObs(data.model.attributes.id_obs);
		this.model.bind('reset', this.render, this);		
		this.template = _.template(___FC.utils.templateLoader.get('obs-page'));
	},

	render: function(eventName) { 	
		console.log(this.data);
		var photos = new Array();
		for (var i = 0; i < this.model.models.length; i++) {
			photos.push(this.model.models[i].attributes);
		}
		
		var json = {
			'obs' : this.data,
			'photos' : photos
		}
		$(this.el).html(this.template(json));
		return this;
	}
});


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Vue Liste OBS
___FC.views.transmissionObs = Backbone.View.extend({
	initialize: function(data) {
		this.model = new ___FC.models.ObsCollection();
		this.model.findAll();
		this.model.bind('reset', this.render, this);
		
		this.utilisateur = new ___FC.models.UtilisateurCollection();
		this.utilisateur.findOne();
		this.utilisateur.bind('reset', this.render, this);
		
		this.template = _.template(___FC.utils.templateLoader.get('obs-liste'));
	},

	render: function(eventName) { 
		var arr_obs = new Array(),
			arr_transmises = new Array();
		
		for (var i = 0; i < this.model.models.length; i++) {
			if (this.model.models[i].attributes.a_ete_transmise == 1) {
				arr_transmises.push(this.model.models[i]);
			} else {
				arr_obs.push(this.model.models[i]);
			}
		}
		var json = {
			'obs' : arr_obs,
			'transmises' : arr_transmises,
			'user' : (this.utilisateur.models[0] == undefined) ? null : this.utilisateur.models[0].attributes.email
		}
		
		$(this.el).html(this.template(json));
		return this;
	}
});


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Vue Page Compte
___FC.views.comptePage = Backbone.View.extend({
	initialize: function() {
		this.utilisateur = new ___FC.models.UtilisateurCollection();
		this.utilisateur.findOne();
		this.utilisateur.bind('reset', this.render, this);
		this.template = _.template(___FC.utils.templateLoader.get('compte'));
	},
	
	render: function(eventName) {
		//console.log(this.model);
		var json = {
			'email' : (this.utilisateur.models[0] == undefined) ? null : this.utilisateur.models[0].attributes.email,
			'prenom' : (this.utilisateur.models[0] == undefined) ? null : this.utilisateur.models[0].attributes.prenom,
			'nom' : (this.utilisateur.models[0] == undefined) ? null : this.utilisateur.models[0].attributes.nom
		}
		
		$(this.el).html(this.template(json));
		return this;
	}
});


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Vue Page Compte
___FC.views.profilPage = Backbone.View.extend({
	initialize: function(data) {
		//console.log(data);
		for (var i = 0; i < ___FC.parcours.length; i++) {
			if (___FC.parcours[i]['id'] == data.id) {
				this.nbre_vues = ___FC.parcours[i]['nbre_vues'];
				this.total = ___FC.parcours[i]['total'];
			}
		}
		this.id = data.id;
		this.nom = data.nom;
		this.template = _.template(___FC.utils.templateLoader.get('parcours-profil'));
	},
	
	render: function(eventName) {
		var json = {
			'id' : this.id,
			'nom' : this.nom,
			'total' : this.total,
			'nbre_vues' : this.nbre_vues
		}
		$(this.el).html(this.template(json));
		return this;
	}
});


// ------------------------------------------------------ Globals ------------------------------------------------- //
___FC.liste = new Array();
___FC.criteria = new Array();
___FC.pheno = new Object();
___FC.pheno['floraison'] = new Array();
___FC.pheno['feuillaison'] = new Array();
___FC.pheno['fructification'] = new Array();
___FC.pheno.liste = new Array();
___FC.nbre_criteres = new Array();
___FC.nbre_especes = null;
___FC.nbre_choix = null;
___FC.parcours = new Array();



// ----------------------------------------------- The Application Router ------------------------------------------ //
___FC.Router = Backbone.Router.extend({
	routes: {
		'' : 'accueil',
		'parcours' : 'list',
		'parcours/:id_parcours' : 'parcoursDetails',
		'espece/:id_espece/:ce_parcours' : 'especeDetails',
		'liste/:id_parcours/:nom_parcours/:id_critere' : 'listeEspeces',
		'clef/:id_parcours/:nom_parcours/:ce_parcours' : 'clefByParcours', 
		'obs/:id_espece/:nom_sci' : 'nouvelleObs',
		'observation/:id_obs' : 'detailsObs',
		'transmission' : 'transmissionObs',
		'compte' : 'compteUtilisateur',
		'profil/:id_parcours/:nom_parcours' : 'compteDebutant'
	},
	
	initialize: function() {
		var self = this;
		
		
		___FC.db.transaction(function (tx) {
			//tx.executeSql("UPDATE obs SET a_ete_transmise = 1");
			//tx.executeSql("INSERT INTO photo (id_photo, chemin, ce_obs) VALUES (2, 'img/61872.jpg', 1)");
			//tx.executeSql("INSERT INTO photo (id_photo, chemin, ce_obs) VALUES (3, 'img/62318.jpg', 1)");
			//tx.executeSql("INSERT INTO photo (id_photo, chemin, ce_obs) VALUES (4, 'img/87533.jpg', 1)");
			//tx.executeSql("INSERT INTO photo (id_photo, chemin, ce_obs) VALUES (5, 'img/90094.jpg', 1)");
			//tx.executeSql("INSERT INTO utilisateur (id_user, email, compte_verifie) VALUES (1, 'test@tela-botanica.org', 'true')");
		},
		function(error) {
			console.log('DB | Error processing SQL: ' + error.code, error);
		});
		
		
		
		___FC.db.transaction(function (tx) {
			var sql = 
				"SELECT id, ce_critere FROM parcours";
			tx.executeSql(sql, [], function(tx, results) {
				var nbre = results.rows.length,
					i = 0;
				
				for (; i < nbre; i = i + 1) {
					var id = results.rows.item(i).id,
						ce_critere = results.rows.item(i).ce_critere,
						sql_total = 
							"SELECT count(id_espece) AS total, COALESCE(NULL, NULL, '" + ce_critere + "') AS parcours, " +
							"COALESCE(NULL, NULL, '" + id + "') AS id " +
							"FROM avoir_critere " +
							"WHERE id_critere = " + ce_critere;
					tx.executeSql(sql_total, [], function(tx, results) {
						var nbre = results.rows.length,
							i = 0;
						
						for (; i < nbre; i = i + 1) {
							var arr_parcours = new Array();
							arr_parcours['id'] = results.rows.item(i).id;
							arr_parcours['ce_critere'] = results.rows.item(i).parcours;
							arr_parcours['total'] = results.rows.item(i).total;
							___FC.parcours.push(arr_parcours);
							
							var sql_vues = 
								"SELECT count(id_espece) AS vues, COALESCE(NULL, NULL, '" + arr_parcours['ce_critere'] + "') AS parcours " +
								"FROM avoir_critere " +
								"WHERE id_critere = " + arr_parcours['ce_critere'] + " " +
								"AND vue = 1";
							tx.executeSql(sql_vues, [], function(tx, results) {
								for (var i = 0; i < ___FC.parcours.length; i++) {
									if (___FC.parcours[i]['ce_critere'] == results.rows.item(0).parcours) {
										___FC.parcours[i]['nbre_vues'] = results.rows.item(0).vues;
									}
								}
							},
							function(error) {
								console.log('DB | Error processing SQL: ' + error.code, error);
							});
						}
					},
					function(error) {
						console.log('DB | Error processing SQL: ' + error.code, error);
					});
				}
			});
		});
		
		
		
		___FC.db.transaction(function (tx) {
			var sql = 
				"SELECT id_critere, intitule FROM critere " +
				"WHERE intitule LIKE '%feuillaison%' ";
			tx.executeSql(sql, [], function(tx, results) {
				var nbre = results.rows.length,
					i = 0;
				for (; i < nbre; i = i + 1) {
					var critere = results.rows.item(i);
					if (critere.intitule.indexOf('debut') != -1) {
						___FC.pheno['feuillaison']['debut'] = critere.id_critere;
					} else {
						___FC.pheno['feuillaison']['fin'] = critere.id_critere;
					}
				}
			});
		});
		___FC.db.transaction(function (tx) {
			var sql = 
				"SELECT id_critere, intitule FROM critere  " +
				"WHERE intitule LIKE '%floraison%' ";
			tx.executeSql(sql, [], function(tx, results) {
				var nbre = results.rows.length,
					i = 0;
				for (; i < nbre; i = i + 1) {
					var critere = results.rows.item(i);
					if (critere.intitule.indexOf('debut') != -1) {
						___FC.pheno['floraison']['debut'] = critere.id_critere;
					} else {
						___FC.pheno['floraison']['fin'] = critere.id_critere;
					}
				}
			});
		});
		___FC.db.transaction(function (tx) {
			var sql = 
				"SELECT id_critere, intitule FROM critere  " +
				"WHERE intitule LIKE '%fructification%' ";
			tx.executeSql(sql, [], function(tx, results) {
				var nbre = results.rows.length,
					i = 0;
				for (; i < nbre; i = i + 1) {
					var critere = results.rows.item(i);
					if (critere.intitule.indexOf('debut') != -1) {
						___FC.pheno['fructification']['debut'] = critere.id_critere;
					} else {
						___FC.pheno['fructification']['fin'] = critere.id_critere;
					}
				}
			});
		});
		
		
		
		// Keep track of the history of pages (we only store the page URL). Used to identify the direction
		// (left or right) of the sliding transition between pages.
		this.pageHistory = [];
		
		// Register event listener for back button troughout the app
		$('#content').on('click', '.header-back-button', function(event) {
			window.history.back();
			return false;
		});
		
		$('body').on('click', '#parcours-modal-reset', function(event) {
			var id = event.currentTarget.attributes.id.value;
			var hash = window.location.hash,
				arr_hash = hash.split('/'),
				id = arr_hash[arr_hash.length-1];
			___FC.db.transaction(function(tx) {
				var sql =
					"UPDATE avoir_critere " +
					"SET vue = 0 " +
					"WHERE id_critere = " +
						"(SELECT ce_critere " +
						"FROM parcours " +
						"WHERE id = :id_parcours)";
				tx.executeSql(sql, [id]);
				
				for (var i = 0; i < ___FC.parcours.length; i++) {
					if (___FC.parcours[i]['id'] == id) {
						___FC.parcours[i]['nbre_vues'] = 0;
						$('#nbre-vues').html('0');
					}
				}
				$('.toutes-vues').addClass('hide');
			},
			function(error) {
				console.log('DB | Error processing SQL: ' + error.code, error);
			});
			$('#parcours-modal').modal('hide');
		});
		
		$('#content').on('click', '.choix-parcours', function(event) {
			var id = this.id;
			for (var i = 0; i < ___FC.parcours.length; i++) {
				if (___FC.parcours[i]['ce_critere'] == id) {
					if (___FC.parcours[i]['nbre_vues'] != 0) {
						$('#parcours-modal').modal('show');	
					}
				}
			}
		});
		
		$('#content').on('click', '.vue-espece', function(event) {
			var hash = window.location.hash,
				arr_hash = hash.split('/'),
				num_nom = arr_hash[arr_hash.length - 2],
				ce_critere = arr_hash[arr_hash.length - 1];
				
			___FC.db.transaction(function(tx) {
				var sql =
					"UPDATE avoir_critere " +
						"SET vue = 1 " +
						"WHERE id_espece = :num_nom " +
						"AND id_critere = :ce_critere";
				tx.executeSql(sql, [num_nom, ce_critere], function(tx, results) {
					for (var i = 0; i < ___FC.parcours.length; i++) {
						if (___FC.parcours[i]['ce_critere'] == ce_critere) {
							___FC.parcours[i]['nbre_vues'] += 1;
							if (___FC.parcours[i]['nbre_vues'] == ___FC.parcours[i]['total']) {
								$('.toutes-vues').removeClass('hide');
							}
						}
					}
				});
			},
			function(error) {
				console.log('DB | Error processing SQL: ' + error.code, error);
			});
			
			$('#vue-modal').modal('show');
			window.history.back();
		});
		
		
		$('#content').on('click', '.criterium', function(event) {
			rechercherDetermination(this.value);
		});
		$('#content').on('click', '.img_criterium', function(event) {
			var id = this.alt,
				valeur = $('#'+id).attr('value');
			document.getElementById(id).checked = !document.getElementById(id).checked;
			rechercherDetermination(valeur);
		});
		$('#content').on('click', '.criteres-reset', function(event) {			
			var parent = document.getElementById('criteres-liste'),
				inputs = parent.getElementsByTagName('input');
				
			for (var i = 0; i < inputs.length; i++) {
				inputs[i].checked = false;
				$('#img_'+inputs[i].id).removeClass('selection-critere');
			}
			reinitialiserClef(true);
		});
		
		
		$('#content').on('click', '#geolocaliser', geolocaliser);
		$('#content').on('click', '#sauver-obs', function(event) {
			___FC.db.transaction(function(tx) {
				var sql =
					"SELECT id_obs " +
					"FROM obs " + 
					"ORDER BY id_obs DESC";
				tx.executeSql(sql, [], function(tx, results) {
					var obs = new Array(),
						id = (results.rows.length == 0) ? 1 : results.rows.item(0).id_obs+1;
						sql =
							"INSERT INTO obs " +
							"(id_obs, date, latitude, longitude, commune, code_insee, mise_a_jour, ce_espece) VALUES " + 
							"(?, ?, ?, ?, ?, ?, ?, ?) ";
						
					obs.push(id);
					obs.push($('#date').html());
					obs.push($('#lat').html());
					obs.push($('#lng').html());
					obs.push($('#location').html());
					obs.push($('#code_insee').val());
					obs.push(($('#code_insee').val() > 0) ? 1 : 0);
					obs.push($('#num_nom_select').val());
					tx.executeSql(sql, obs);
					
					
					var i = 0,
						parent = document.getElementById('obs-photos'),
						imgs = parent.getElementsByTagName('img');
					
					sql =
						"SELECT id_photo " +
						"FROM photo " + 
						"ORDER BY id_photo DESC";
					tx.executeSql(sql, [], function(tx, results) {
						var sql_photo =
								"INSERT INTO photo " +
								"(id_photo, chemin, ce_obs) VALUES " + 
								"(?, ?, ?)",
							id_photo = (results.rows.length == 0) ? 1 : results.rows.item(0).id_photo + 1;

						for (; i < imgs.length; i++) {
							var photo = new Array();
								photo.push(id_photo++);
								photo.push(imgs[i].src);
								photo.push(id);
							tx.executeSql(sql_photo, photo);
						}
					},
					function(error) {
						alert('DB | Error processing SQL: ' + error);
					});
				});
			},
			function(error) {
				console.log('DB | Error processing SQL: ' + error.code, error);
			});
		});
		$('#content').on('click', '.suppression-obs', function() {
			supprimerObs(this.id, true);
		});
		$('#content').on('click', '.supprimer-obs-transmises', function() {
			___FC.db.transaction(function(tx) {
				var sql =
					"SELECT id_obs " +
					"FROM obs " + 
					"WHERE a_ete_transmise = 1";
				tx.executeSql(sql, [], function(tx, results) {
					for (var i = 0; i < results.rows.length; i = i + 1) {
						supprimerObs(results.rows.item(i).id_obs, false);
					}
					$('#obs-transmises-infos').html('');
				});
			},
			function(error) {
				console.log('DB | Error processing SQL: ' + error.code, error);
				var txt = 'Erreur de suppression dans la base de données.';
				$('#obs-suppression-infos').html('<p class="text-center alert alert-error alert-block">' + txt + '</p>')
					.fadeIn(0)
					.delay(1600)
					.fadeOut('slow');	
			});
		});
		
		
		$('#content').on('click', '.ajouter-photos', function(event) {
			var options = { 
				destinationType: destinationType.FILE_URI,
				encodingType: Camera.EncodingType.JPEG
			};
			if (this.id == 'chercher-photos') {
				options.sourceType = pictureSource.PHOTOLIBRARY;
			}
			navigator.camera.getPicture(
				onPhotoSuccess, 
				function(message){
					//alert('Erreur camera: ' + message);
					console.log('CAMERA failed because: ' + message);
				}
			);
		});
		$('#content').on('click', '.supprimer-photos', function() {
			var id = this.id;
			___FC.db.transaction(function(tx) {
				tx.executeSql("DELETE FROM photo WHERE id_photo = " + id);
				
				var fichier = new FileEntry();
				fichier.fullPath = $('#img_'+id).attr('src');
				fichier.remove(null, null);
				
				$('#elt_'+id).remove();
				$('#nbre-photos').html($('#nbre-photos').html()-1);
				$('#prendre-photos').removeClass('hide');
				if ($('#nbre-photos').html() == 0) {
					$('#prendre-photos-texte').html('Ajouter une photo...');
				}
			},
			function(error) {
				console.log('DB | Error processing SQL: ' + error.code, error);
				$('#obs-photos-info').addClass('alert-error');
				$('#obs-photos-info').removeClass('alert-success');
				$('#obs-photos-info').html('Erreur de suppression dans la base de données.')
					.fadeIn(0)
					.delay(1600)
					.fadeOut('slow');
			});
		});
		
		
		$('#content').on('keypress', '#courriel', function(event) {
			if (event.which == 13) {
				requeterIdentite(event);
			}
		});
		$('#content').on('click', '#valider_courriel', requeterIdentite);
		$('#content').on('click', '.transmettre-obs', function(event) {
			if (typeof $('#transmission-courriel').html() === 'undefined') {
				window.location = '#compte';
			} else {
				$('#nbre_obs').html('0');
				$('#obs-transmission-infos').html('');
				$('#transmission-modal').modal('show');
				transmettreObs();
			}
		});
		
		
		$('.fermer-obs-modal').on('click', function(event) {
			$('#sauvegarde-obs-modal').modal('hide');
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
		this.searchResults = new ___FC.models.ParcoursCollection();
		this.searchPage = new ___FC.views.SearchPage({model: this.searchResults});
		this.searchPage.render();
		$(this.searchPage.el).attr('id', 'searchPage');
	},
	
	accueil: function() {
		reinitialiserClef(false);
		var self = this;
		self.slidePage(new ___FC.views.Accueil().render());
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

	parcoursDetails: function(id) {
		var parcours = new ___FC.models.Parcours({id: id}),
			self = this;
		parcours.fetch({
			success: function(data) {
				self.slidePage(new ___FC.views.ParcoursPage({model: data}).render());
			}
		});
	},
	
	listeEspeces: function(id, nom, critere) {
		var espece = new ___FC.models.Espece({id: id, name: nom, id_critere: critere}),
			self = this;
		espece.fetch({
			success: function(data) {
				//console.log(data); //viens fumer un joint
				self.slidePage(new ___FC.views.ListPage({model: data}).render());
			}
		});
	},
	
	especeDetails: function(id, ce_critere) {
		var espece = new ___FC.models.Espece({id: id, ce_critere: ce_critere}),
			self = this;
		espece.fetch({
			success: function(data) {
				self.slidePage(new ___FC.views.EspecePage({model: data}).render());
			}
		});
	},
	
	clefByParcours: function(id, nom, ce_parcours) {
		var critere = new ___FC.models.Critere({id: id, nom: nom, ce_parcours: ce_parcours}),
			self = this;
		critere.fetch({
			success: function(data) {
				self.slidePage(new ___FC.views.CriterePage({model: data}).render());
			}
		});
	},
	
	nouvelleObs: function(num_nom, nom_sci) {
		var obs = new ___FC.models.Obs({ id: num_nom, nom_sci: nom_sci }),
			self = this;
		reinitialiserClef(false);
		obs.fetch({
			success: function(data) {
				self.slidePage(new ___FC.views.saisieObs({model: data}).render());
			}
		});
	},
	
	detailsObs: function(id_obs) {
		var obs = new ___FC.models.Obs({ id: id_obs }),
			self = this;
		obs.fetch({
			success: function(data) {
				self.slidePage(new ___FC.views.ObsPage({model: data}).render());
			}
		});
	},

	transmissionObs: function(data) {
		this.slidePage(new ___FC.views.transmissionObs().render());
	},
	
	compteUtilisateur: function(data) {
		this.slidePage(new ___FC.views.comptePage().render());
	},
	
	compteDebutant: function(id, nom) {
		this.slidePage(new ___FC.views.profilPage({id: id, nom: nom}).render());
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
			slideFrom = 'left';
			$(page.el).attr('class', 'page stage-left');
			// Reinitialize page history
			this.pageHistory = [window.location.hash];
		} else if (this.pageHistory.length > 1 && window.location.hash === this.pageHistory[this.pageHistory.length - 2]) {
			// The new page is the same as the previous page -> Back transition
			slideFrom = 'left';
			$(page.el).attr('class', 'page stage-left');
			this.pageHistory.pop();
		} else {
			// Forward transition (slide from right)
			slideFrom = 'right';
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
___FC.db = window.openDatabase('FloraClapasApp', '1.0', 'Data Base Flora Clapas', 1024*1024*20);
___FC.storage = window.localStorage;

$().ready(function() {
	if (___FC.storage.getItem('version') != VERSION_APP) {
		(new ___FC.dao.EspeceDAO(___FC.db)).populate();
		(new ___FC.dao.ParcoursDAO(___FC.db)).populate();
		(new ___FC.dao.CritereDAO(___FC.db)).populate();
		(new ___FC.dao.AvoirCritereDAO(___FC.db)).populate();
		(new ___FC.dao.ObsDAO(___FC.db)).populate();
		(new ___FC.dao.PhotoDAO(___FC.db)).populate();
		(new ___FC.dao.UtilisateurDAO(___FC.db)).populate();

		___FC.storage.setItem('version', VERSION_APP);
	}
	
	___FC.utils.templateLoader.load(
		['accueil', 'parcours-liste', 'parcours-liste-item', 'parcours-page', 'parcours-profil', 
		 'espece-liste', 'espece-liste-item', 'espece-page', 'critere-liste', 'critere-liste-item', 
		 'obs-liste', 'obs-page', 'obs-saisie', 'compte'],
		function() {
			___FC.app = new ___FC.Router();
			Backbone.history.start();
		}
	);
});



function moisPhenoEstCouvert( debut, fin) {
	var mois_actuel = new Date().getMonth() + 1,
		flag = false;
	
	if (debut != -1 && fin != -1) {
		if (debut <= fin) {
			flag = (mois_actuel >= debut && mois_actuel <= fin);
		}
		if (debut == fin) {
			flag = (mois_actuel == debut);
		}
		if (debut >= fin) {
			flag = (mois_actuel >= debut && mois_actuel <= 12 || mois_actuel >= 1 && mois_actuel <= fin);
		}
	}
	
	return(flag);
}



function rechercherDetermination(valeur) {
	var sql_select = '',
		sql_and = '',
		sql_where = '',
		sql_order_by = '',
		arr_ids = new Array(),
		nbre_choix = 0,
		hash = window.location.hash,
		arr_hash = hash.split('/'),
		id_parcours = arr_hash[arr_hash.length - 1],
		parent = document.getElementById('criteres-liste'),
		inputs = parent.getElementsByTagName('input');
	
	if (id_parcours != 0) {
		sql_where = 
			"WHERE num_nom IN ( " +
				"SELECT num_nom " +
				"FROM espece e " +  
				"JOIN avoir_critere a ON a.id_espece = e.num_nom " +
				"WHERE id_critere = :ce_parcours " +
			" ) ";
		arr_ids.push(id_parcours);
	} else {
		sql_where = "";
	}
	
	___FC.pheno.liste = new Array();
	for (var i = 0; i < inputs.length; i++) {
		$('#img_'+inputs[i].id).removeClass('selection-critere');
		if (inputs[i].checked) {
			if (___FC.criteria[inputs[i].name] == valeur) {
				inputs[i].checked = false;
				delete ___FC.criteria[inputs[i].name];
			} else {
				$('#img_'+inputs[i].id).addClass('selection-critere');
				___FC.criteria[inputs[i].name] = inputs[i].value;
				nbre_choix++;
				var id = inputs[i].value.split(';')[0];
				if (id % 1 === 0) {		//id est-il un nombre ?
					arr_ids.push(id);
				} else {
					___FC.pheno.liste.push(id);
				}
			}
		}
	}
	
	if (nbre_choix > 0) {
		$('#resultats-recherche').removeClass('hide');
		var sql_conditions = '',
			index = (id_parcours == 0) ? 0 : 1; 
		for (var i = index; i < arr_ids.length; i++) {
			sql_conditions += '?';
			if (i <= arr_ids.length - 2) {
				sql_conditions += ', ';
			}
		}
		if (arr_ids.length != 0) {
			if (id_parcours != 0 && arr_ids.length == 1) {
				sql_select = ", COALESCE(NULL, 0) AS count ";
			} else {
				sql_select = ", count(num_nom) AS count ";
			}
			
			if (id_parcours != 0 && arr_ids.length > 1 || id_parcours == 0) {
				sql_and = (sql_where == "") ? "WHERE" : "AND";
				sql_and += 
				" id_critere IN (" +
					sql_conditions + 
				") ";
			}
			sql_order_by = "count DESC, ";
		}
		
		
		var i = 0,
			criteres = [];
		___FC.nbre_especes = 0;
		for (var index in ___FC.nbre_criteres) {
			___FC.nbre_criteres[index] = 0;
		}
		___FC.db.transaction(function(ta) {
			var sql =
				"SELECT num_nom " + sql_select + 
				"FROM espece e " +
				"JOIN avoir_critere a ON a.id_espece = e.num_nom " +
				sql_where + 
				sql_and + 
				"GROUP BY num_nom " +
				"ORDER BY " + sql_order_by + "nom_vernaculaire ASC " ;
			ta.executeSql(sql, arr_ids, function(tx, results) {
				var nbre = results.rows.length,
					arr_pheno = ___FC.pheno.liste;
				if (nbre == 0) {
					$('#resultats-recherche').html(' ' + nbre + ' ');
				}
				for (i = 0; i < nbre; i = i + 1) {	
					criteres[i] = results.rows.item(i).num_nom;
					if (results.rows.item(i).count !== undefined) {
						___FC.nbre_criteres[criteres[i]] = results.rows.item(i).count;
					} else {
						___FC.nbre_criteres[criteres[i]] = 0;
					}
					
					if (___FC.nbre_criteres[criteres[i]] == nbre_choix) {
						___FC.nbre_especes++;
					}
				}
				___FC.liste = criteres;
				___FC.nbre_choix = nbre_choix;
				//console.log(___FC.liste);
				//console.log(___FC.nbre_criteres, nbre_choix);
				$('#resultats-recherche').html(' ' + ___FC.nbre_especes + ' ');
				
				
				var j = 0;
				for (; j < arr_pheno.length; j++) {
					var sql_where_pheno = 
						"WHERE id_espece IN ( " +
							"SELECT num_nom " +
							"FROM espece e " +  
							"JOIN avoir_critere a ON a.id_espece = e.num_nom " +
							"WHERE id_critere = " + id_parcours + 
						" ) ",
						sql_parent = (sql_where == '') ? "WHERE " : sql_where_pheno+"AND ",
						parametres = new Array(),
						sql = 
							"SELECT id_espece, intitule, ce_parent, " + 
							"COALESCE(NULL, NULL, ?) AS tour_boucle " +
							"FROM critere c " +
							"JOIN avoir_critere ac ON c.id_critere = ac.id_critere " +
							sql_parent + " ce_parent IN ( ?, ? )";
					parametres.push(j);
					parametres.push(___FC.pheno[arr_pheno[j]]["debut"]); 
					parametres.push(___FC.pheno[arr_pheno[j]]["fin"]);
					ta.executeSql(sql, parametres, function(tx, results) {
						var debut = -1,
							fin = -1,
							tour = -1,
							nbre = results.rows.length,
							k = 0;
						for (; k < nbre; k = k + 1) {
							tour += 1;
							var num_nom = results.rows.item(k).id_espece;
							for (var m = 0; m < ___FC.pheno.liste.length; m++) {
								if (results.rows.item(k).ce_parent == ___FC.pheno[___FC.pheno.liste[m]]["debut"]) {
									debut = results.rows.item(k).intitule;
								} 
								if (results.rows.item(k).ce_parent == ___FC.pheno[___FC.pheno.liste[m]]["fin"]) {
									fin = results.rows.item(k).intitule;
								}
							}
							
							if (tour == 1) {
								tour = -1;
								if (moisPhenoEstCouvert(debut, fin)) {
									if ($.inArray(num_nom, ___FC.liste) == -1) {
										___FC.liste.push(num_nom);
									}
									if (___FC.nbre_criteres[num_nom] === undefined) {
										___FC.nbre_criteres[num_nom] = 0;
									}
									___FC.nbre_criteres[num_nom]++;
								}
							}	
						}
						
						if (results.rows.item(k-1).tour_boucle == arr_pheno.length-1) {
							for (var l = 0; l < criteres.length; l++) {
								var index = criteres[l];
								if (___FC.nbre_criteres[index] == nbre_choix) {
									___FC.nbre_especes++;
								}
							}
							$('#resultats-recherche').html(' ' + ___FC.nbre_especes + ' ');
						}
						___FC.liste = criteres;
						___FC.nbre_choix = nbre_choix;
						console.log(___FC.liste);
						console.log(___FC.nbre_criteres, nbre_choix);
					});
				}
			});
		},
		function(error) {
			console.log('DB | Error processing SQL: ' + error.code, error);
		});	
	} else {
		reinitialiserClef(true);
	}
}
function reinitialiserClef(flag) {
	___FC.liste = new Array();
	___FC.criteria = new Array();
	___FC.nbre_criteres = new Array();
	___FC.nbre_especes = null;
	___FC.nbre_choix = null;
	
	if (flag) {
		$('#resultats-recherche').addClass('hide');
		$('#resultats-recherche').html(' ');
	}
}



function supprimerObs(id, flag) {
	___FC.db.transaction(function(tx) {
		var sql =
			"SELECT id_photo, chemin " +
			"FROM photo " + 
			"WHERE ce_obs = " + id;
		tx.executeSql(sql, [], function(tx, results) {
			for (var i = 0; i < results.rows.length; i = i + 1) {
				var fichier = new FileEntry();
				fichier.fullPath = results.rows.item(i).chemin;
				fichier.remove(null, null);
				tx.executeSql("DELETE FROM photo WHERE id_photo = " + results.rows.item(i).id_photo);
			}
		});
		tx.executeSql("DELETE FROM obs WHERE id_obs = " + id);
		
		if (flag) {
			var txt = 'Observation n° ' + id + ' supprimée.';
			$('#obs-suppression-infos').html('<p class="text-center alert alert-success alert-block">'+txt+'</p>')
				.fadeIn(0)
				.delay(1600)
				.fadeOut('slow');
		}		

		if ($('#'+id).hasClass('a-transmettre')) {
			var nbre = parseInt($('#nbre-a-transmettre').html()) - 1;
			$('#nbre-a-transmettre').html(nbre);
			if (nbre < 3) {
				$('#obs-a-transmettre-btn').addClass('hide');
			}
			if (nbre == 0) {
				$('.transmettre-obs').addClass('hide');
			}
		} else {
			if ($('#'+id).hasClass('transmises')) {
				var nbre = parseInt($('#nbre-transmises').html()) - 1;
				$('#nbre-transmises').html(nbre);
				if (nbre == 0) {
					$('#obs-transmises-infos').addClass('hide');
				}
			}
		}
		$('#li_'+id).remove();
	},
	function(error) {
		console.log('DB | Error processing SQL: ' + error.code, error);
		var txt = 'Erreur de suppression dans la base de données.';
		$('#obs-suppression-infos').html('<p class="text-center alert alert-error alert-block">' + txt + '</p>')
			.fadeIn(0)
			.delay(1600)
			.fadeOut('slow');	
	});
}
function miseAJourTransmission(id) {
	___FC.db.transaction(function(tx) {
		var sql =
			"UPDATE obs " +
			"SET a_ete_transmise = 1 " +
			"WHERE id_obs = :id_obs ";
		tx.executeSql(sql, [id]);
	},
	function(error) {
		console.log('DB | Error processing SQL: ' + error.code, error);
	});
}



function onPhotoSuccess(imageData){
	fileSystem.root.getDirectory('FlorasClapas', { create: true, exclusive: false }, function(dossier) {
		var fichier = new FileEntry();
		fichier.fullPath = imageData;
		fichier.copyTo(dossier, (new Date()).getTime()+'.jpg', surPhotoSuccesCopie, surPhotoErreurAjout);
	}, surPhotoErreurAjout);
}
function surPhotoSuccesCopie(entry) {
	___FC.db.transaction(function(tx) {
		var hash = window.location.hash,
			ce_obs = hash[hash.length - 1],
			chemin = entry.fullPath,
			id = Math.floor(Math.random()*100),
			nbre_photos = parseInt($('#nbre-photos').html()) + 1 ,
			elt = 
				'<div class="pull-left miniature text-center" id="elt_' + id + '">' + 
					'<img src="' + chemin + '" alt="' + id + '" id="img_' + id + '"/>' +
					'<span id="' + id + '" class="suppression-element supprimer-photos"><span></span></span>' + 
				'</div>';
		$('#obs-photos').append(elt);
		$('#nbre-photos').html(nbre_photos);
		$('#prendre-photos-texte').html('Prendre une autre photo...');
		if (nbre_photos == LIMITE_NBRE_PHOTOS) {
			$('#prendre-photos').addClass('hide');
		}
	},
	surPhotoErreurAjout);
}
function surPhotoErreurAjout(error) {
	$('#obs-photos-info').addClass('text-error');
	$('#obs-photos-info').removeClass('text-info');
	$('#obs-photos-info').html('Erreur de traitement. Ajout impossible.');
	console.log('PHOTO | Error: ' + error.code, error);
}
function surPhotoErreurSuppression(error) {
	var texte = 'Erreur de traitement. Le fichier n\'a pas été supprimé de la mémoire.';
	$('#obs-photos-info').html('<p class="text-center alert alert-error alert-block">' + texte +'</p>')
		.fadeIn(0)
		.delay(1600)
		.fadeOut('slow');
}



function geolocaliser() {
	$('#geo-infos').html('Calcul en cours...');
	$('#obs-attente-icone').removeClass('hide');
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(surSuccesGeoloc, surErreurGeoloc);
	} else {
		var erreur = { code: '0', message: 'Géolocalisation non supportée par le navigateur.'};
		surErreurGeoloc(erreur);
	}
}
function surSuccesGeoloc(position) {
	if (position) {
		var lat = position.coords.latitude;
		var lng = position.coords.longitude;
		$('#lat').html(lat);
		$('#lng').html(lng);

		$('#geo-infos').html(''); 
		$('#sauver-obs').removeClass('hide');
		console.log('Geolocation SUCCESS');
	} else {
		$('#geo-infos').addClass('text-error');
		$('#geo-infos').removeClass('text-info');
		$('#geo-infos').html('Impossible de continuer l\'enregistrement.'); 
	}
	$('#obs-attente-icone').addClass('hide');
}
function surErreurGeoloc(error){
	$('#obs-attente-icone').addClass('hide');
	$('#geo-infos').addClass('text-error');
	$('#geo-infos').removeClass('text-info');
	$('#geo-infos').html('Calcul impossible.');
	console.log('Echec de la géolocalisation, code: ' + error.code + ' message: '+ error.message);
}



function requeterIdentite() {
	var courriel = ($('#courriel').val()).toLowerCase();
	if (validerCourriel(courriel)) {
		$('#utilisateur-infos').addClass('text-info');
		$('#utilisateur-infos').removeClass('text-error');
		$('#utilisateur-infos').html('Vérification en cours...');
		var urlAnnuaire = SERVICE_ANNUAIRE + courriel;
		$.ajax({
			url : urlAnnuaire,
			type : 'GET', 
			success : function(data, textStatus, jqXHR) {
				console.log('Annuaire SUCCESS: ' + textStatus);
				$('#utilisateur-infos').html('');
				if (data != undefined && data[courriel] != undefined) {
					var infos = data[courriel];
					$('#id_utilisateur').val(infos.id);
					$('#prenom_utilisateur').val(infos.prenom);
					$('#nom_utilisateur').val(infos.nom);
					$('#courriel_confirmation').val(courriel);
					$('#prenom_utilisateur, #nom_utilisateur, #courriel_confirmation').attr('disabled', 'disabled');
				} else {
					surErreurCompletionCourriel();
				}
			},
			error : function(jqXHR, textStatus, errorThrown) {
				console.log('Annuaire ERROR: ' + textStatus);
				surErreurCompletionCourriel();
			},
			complete : function(jqXHR, textStatus) {
				miseAJourCourriel(courriel);
				console.log('Annuaire COMPLETE: ' + textStatus);
				$('#zone_prenom_nom').removeClass('hide');
				$('#zone_courriel_confirmation').removeClass('hide');
			}
		});
	} else {
		$('#utilisateur-infos').addClass('text-error');
		$('#utilisateur-infos').removeClass('text-info');
		$('#utilisateur-infos').html('Courriel invalide.');
	}
}
function validerCourriel(email) { 
	var regex = new RegExp(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i),
		flag = regex.test(email);
	
	console.log('Valid email ? (', email, ') : ', flag);
	return flag;
} 
function miseAJourCourriel(courriel) {
	___FC.db.transaction(function(tx) {
		var sql =
			"SELECT id_user, email, compte_verifie " +
			"FROM utilisateur " +
			"ORDER BY id_user DESC";
		tx.executeSql(sql, [], function(tx, results) {
			var id = (results.rows.length == 0) ? 1 : results.rows.item(0).id_user+1,
				sql = '',
				parametres = new Array(),
				utilisateurs = [];
			for (var i = 0; i < results.rows.length; i = i + 1) {
				utilisateurs[results.rows.item(i).id_user] = results.rows.item(i).email;
			}
			
			var index = $.inArray(courriel, utilisateurs);
			parametres.push($('#nom_utilisateur').val());
			parametres.push($('#prenom_utilisateur').val());
			parametres.push($('#courriel_confirmation').val() == courriel);
			if (index == -1) {
				sql = 
					"INSERT INTO utilisateur " +
					"(nom, prenom, compte_verifie, id_user, email) VALUES " + 
					"(?, ?, ?, ?, ?) ";
				parametres.push(id);
				parametres.push(courriel);
			} else {
				if (!utilisateurs[index].compte_verifie) {
					sql = 
						"UPDATE utilisateur " +
						"SET nom = ?, prenom = ?, compte_verifie = ? " +
						"WHERE id_user = ?";
					parametres.push(index);
				}
			}
			
			if (sql != '') {
				tx.executeSql(sql, parametres);
			}
		});
	},
	function(error) {
		console.log('DB | Error processing SQL: ' + error.code, error);
	});
}
function surErreurCompletionCourriel() {
	$('#utilisateur-infos').addClass('text-error');
	$('#utilisateur-infos').removeClass('text-info');
	$('#utilisateur-infos').html('Echec de la vérification.');
	$('#prenom_utilisateur, #nom_utilisateur, #courriel_confirmation').val('');
	$('#prenom_utilisateur, #nom_utilisateur, #courriel_confirmation').removeAttr('disabled');
}



var arr_obs = new Array();
function transmettreObs() {
	var msg = '';
	if (verifierConnexion()) {	
		___FC.db.transaction(function(tx) {
			var sql = 
				"SELECT num_nom, nom_sci, num_taxon, famille, referentiel, " + 
					"id_obs, latitude, longitude, date, commune, code_insee, mise_a_jour " +
				"FROM espece " +
				"JOIN obs ON num_nom = ce_espece " +
				"WHERE a_ete_transmise = '0' " + 
				"ORDER BY id_obs " +
				"LIMIT " + LIMITE_NBRE_TRANSMISSION;
			tx.executeSql(sql, [], function(tx, results) {
				var nbre_obs = results.rows.length;
				$('#total_obs').html(nbre_obs);	
				for (var i = 0; i < nbre_obs; i = i + 1) {
					var id = results.rows.item(i).id_obs;
					arr_obs[id] = results.rows.item(i);
					enregistrerPhotosObs(id);
				}
			});
		},
		function(error) {
			console.log('DB | Error processing SQL: ' + error.code, error);
		});
	} else {
		msg = 'Aucune connexion disponible. Merci de réessayer ultérieurement.';
	}
		
	if (msg != '') {
		$('#details-obs').html('<p class="alert alert-info alert-block">' + msg + '</p>')
			.fadeIn(0)
			.delay(2000)
			.fadeOut('slow');
	}
}
function verifierConnexion() {
	return ( ('onLine' in navigator) && (navigator.onLine) );
}
function enregistrerPhotosObs(identifiant) {
	var	k = 0,
		img_noms = new Array(),
		img_codes = new Array(),
		arr_photos = new Array();
	___FC.db.transaction(function(tx) {
		tx.executeSql("SELECT * FROM photo WHERE ce_obs = ?", [identifiant], function(tx, results) {
			var photo = null,
				nbre_photos = results.rows.length;
			
			if (nbre_photos == 0) {
				construireObs(identifiant, img_codes, img_noms);
			} else {
				for (var j = 0; j < nbre_photos; j++) {
					photo = results.rows.item(j);
					arr_photos.push(results.rows.item(j));
					
					var fichier = new FileEntry();
					fichier.fullPath = arr_photos[arr_photos.length-1].chemin;
					fichier.file(
						function(file) {
							var reader = new FileReader();
							reader.onerror = function(error) {
								alert('Erreur de la lecture de l\'image.');
							};
							reader.onloadend = function(evt) {
								k++;
								img_codes.push(evt.target.result);
								img_noms.push(file.name);
								
								if (k == nbre_photos) {
									construireObs(identifiant, img_codes, img_noms);
								}
							};
							reader.readAsDataURL(file);
						}, function(error) {
							alert('Fichier inaccessible.');
						}
					);
				}
			}
		}, null);
	});
}
function construireObs(id, img_codes, img_noms) {
	var obs = arr_obs[id],
		json = {
			'date' : obs.date, 
			'notes' : '',
			
			'nom_sel' : obs.nom_sci,
			'num_nom_sel' : obs.num_nom,
			'nom_ret' : obs.nom_sci,
			'num_nom_ret' : obs.num_nom,
			'num_taxon' : obs.num_taxon,
			'famille' : obs.famille,
			'referentiel' : obs.referentiel,
			
			'latitude' : obs.latitude,
			'longitude' : obs.longitude,
			'commune_nom' : obs.commune,
			'commune_code_insee' : obs.code_insee,
			'lieudit' : '',
			'station' : '',
			'milieu' : '',
			
			//Ajout des champs images
			'image_nom' : img_noms,
			'image_b64' : img_codes 
		};
	jQuery.data($('div')[0], ''+obs.id_obs, json);
	var msg = '',
		observations = { 'obsId1' : jQuery.data($('div')[0], ''+obs.id_obs) };
	if (observations == undefined || jQuery.isEmptyObject(observations)) {
		msg = 'Aucune observation à transmettre.';
	} else {
		msg = 'Transmission en cours...';
		observations['projet'] = TAG_PROJET;
		observations['tag-obs'] = '';
		observations['tag-img'] = '';
		
		var utilisateur = new Object();
		utilisateur.id_utilisateur = null;
		utilisateur.prenom = null;
		utilisateur.nom = null;
		utilisateur.courriel = $('#transmission-courriel').html();
		observations['utilisateur'] = utilisateur;
		
		envoyerObsAuCel(observations, obs.id_obs);	
	}
	
	$('#details-obs').removeClass('hide');
	$('#details-obs').html(msg)
		.fadeIn(0)
		.delay(2000)
		.fadeOut('slow');
}
function envoyerObsAuCel(obs, id_obs) {
	console.log(obs);
	
	var msg = '',
		erreurMsg = '';
	$.ajax({
		url : SERVICE_SAISIE_URL,
		type : 'POST',
		data : obs,
		dataType : 'json',
		success : function(data, textStatus, jqXHR) {
			console.log('Transmission SUCCESS.');
			$('#nbre_obs').html(parseInt($('#nbre_obs').html()) + 1);
			$('#details-obs').addClass('alert-success');
			msg = 'Transmission réussie ! Vos observations sont désormais disponibles sur votre carnet en ligne. Bravo !';
			miseAJourTransmission(id_obs);
		},
		statusCode : {
			500 : function(jqXHR, textStatus, errorThrown) {
				msg = 'Erreur 500. Merci de contacter le responsable.';
				erreurMsg += 'Erreur 500 :\ntype : ' + textStatus + '\n' + errorThrown + '\n';
				afficherMsgTransmission(msg);
			}
		},
		error : function(jqXHR, textStatus, errorThrown) {
			$('#details-obs').addClass('alert-error');
			msg = 'Erreur indéterminée. Merci de contacter le responsable.';
			erreurMsg += 'Erreur Ajax de type : ' + textStatus + '\n' + errorThrown + '\n';
			try {
				var reponse = jQuery.parseJSON(jqXHR.responseText);
				if (reponse != null) {
					$.each(reponse, function (cle, valeur) {
						erreurMsg += valeur + '\n';
					});
				}
			} catch(e) {
				erreurMsg += 'L\'erreur n\'était pas en JSON.';
			}
			console.log(erreurMsg);
			afficherMsgTransmission(msg);
		},
		complete : function(jqXHR, textStatus) {
			console.log('Transmission COMPLETE.');
			if ($('#total_obs').html() == $('#nbre_obs').html()) {
				afficherMsgTransmission(msg);
			}
		}
	});
}
function afficherMsgTransmission(msg) {
	$('#obs-transmission-texte').addClass('hide');
	$('#obs-transmission-btn').removeClass('hide');
	$('#obs-transmission-infos').html('<p>' + msg + '</p>');
}