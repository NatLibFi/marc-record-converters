/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Convert MARC records between different formats
 *
 * Copyright (c) 2015 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of marc-record-converters 
 *
 * marc-record-converters is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 **/

(function(root, factory) {

    'use strict';

    if (typeof define === 'function' && define.amd) {
        define(['../test_modules/aleph-sequential', './get-resources'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('../test_modules/aleph-sequential'), require('./get-resources'));
    }

}(this, factory));

function factory(testModule, getResources)
{

    'use strict';

    return testModule(getResources);
}