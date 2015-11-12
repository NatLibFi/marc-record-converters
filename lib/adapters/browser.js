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
        define(factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    }

}(this, factory));

function factory()
{

    'use strict';

    /**
     * @internal 512kB
     */
    var WEB_API_FILE_BLOB_SIZE = 500000;
    
    return function(source, cb_process, cb_error, cb_done)
    {
	return function()
	{

	    function process(offset)
	    {
		
		var blob;
		
		offset = offset === undefined ? 0 : offset;
		blob = source.slice(offset, WEB_API_FILE_BLOB_SIZE);
		
		if (blob.size > 0) {
		    reader.readAsText(blob)
			.onload(function() {
			    cb_process(reader.result);
			    process(offset + WEB_API_FILE_BLOB_SIZE); 
			})
			.onerror(function() {
			    cb_error(reader.error.message);
			});
		} else {
		    cb_done();
		}
		
	    }
	    
	    var reader = new FileReader();
	    process();

	};
    };

}