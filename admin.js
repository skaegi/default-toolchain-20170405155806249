#!/usr/bin/env node
// Licensed under the Apache 2.0 License. See footer for details.

var express = require('express'),
    path = require('path'),
    cloudant = require('cloudant'),
    program = require('commander'),
    dotenv = require('dotenv'),
    pkg = require(path.join(__dirname, 'package.json'));

dotenv.load();

var app = express();

(function(app) {
  if (process.env.VCAP_SERVICES) {
    var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
    app.set('vcapServices', vcapServices);
    if (vcapServices.cloudantNoSQLDB && vcapServices.cloudantNoSQLDB.length > 0) {
      var service = vcapServices.cloudantNoSQLDB[0];
      if (service.credentials) {
        app.set('deployment-tracker-db', cloudant({
          username: service.credentials.username,
          password: service.credentials.password,
          account: service.credentials.username
        }));
      }
    }
  }
})(app);

program.version(pkg.version);

program
  .command('db <method>')
  .description('Create (put) or delete the database')
  .action(function(method, options) {
    var deploymentTrackerDb = app.get('deployment-tracker-db');
    if (!deploymentTrackerDb) {
      console.error('No database configured');
      return;
    }
    switch (method) {
      case 'put':
        deploymentTrackerDb.db.create('events', function(err, body) {
          if (!err) {
            console.log('Deployment tracker events database created');
          } else {
            if (412 == err.status_code) {
              console.log('Deployment tracker events database already exists');
            } else {
              console.error('Error creating deployment tracker events database');
            }
          }
        });
        break;
      case 'delete':
        deploymentTrackerDb.db.destroy('events', function(err, body) {
          if (!err) {
            console.log('Deployment tracker events database deleted');
          } else {
            if (404 == err.status_code) {
              console.log('Deployment tracker events database does not exist');
            } else {
              console.error('Error deleting deployment tracker events database');
            }
          }
        });
        break;
    }
  }).on('--help', function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ db put');
    console.log('    $ db delete');
    console.log();
  });

program.parse(process.argv);

//-------------------------------------------------------------------------------
// Copyright IBM Corp. 2015
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//-------------------------------------------------------------------------------
