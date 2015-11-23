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

/* istanbul ignore next: umd wrapper */
(function(root, factory) {

    'use strict';

    if (typeof define === 'function' && define.amd) {
        define(['./converters/aleph-sequential', './converters/marcxml'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./converters/aleph-sequential'), require('./converters/marcxml'));
    }

}(this, factory));

function factory(createAlephSequential, createMarcXml, createIso2709)
{

    'use strict';

    return {
	alephsequential: createAlephSequential(),
	marcxml: createMarcXml()/*,
	iso2709: createIso2709(adapter)*/
    };

}