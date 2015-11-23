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
        define(['fs', 'stream'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('fs'), require('stream'));
    }

}(this, factory));

function factory(fs, stream)
{

    'use strict';

    return function(source, cb_process, cb_error, cb_done)
    {

	source = typeof source === 'string' ? fs.createReadStream(source) : source;

	if (source instanceof stream.Readable) {
	    return function()
	    {
		source
		    .setEncoding('utf8')
		    .on('data', function(data) {
			cb_process(data);
		    })
		    .on('error', function(error) {
			cb_error(error.message);
		    })
		    .on('end', function() {
			cb_done();
		    });
	    };
	} else {
	    throw new Error('Unsupported source');
	}

    };

}