/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Convert MARC records between different formats
 *
 * This file is part of marc-record-converters 
 *
 * Modified work: Copyright (c) 2015 University Of Helsinki (The National Library Of Finland)
 * Original work: Copyright (c) 2015 Pasi Tuominen
 *
 * LICENSE DISCLAIMER FOR MODIFIED WORK:
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
 * LICENSE DISCLAIMER FOR ORIGINAL WORK:
 *
 * Text of the ISC License:

 * Copyright © 2004-2012 by Internet Systems Consortium, Inc. ("ISC")
 * Copyright © 1995-2003 by Internet Software Consortium
 *  
 *  
 *  
 * Permission to use, copy, modify, and/or distribute this software for
 * any purpose with or without fee is hereby granted, provided that the
 * above copyright notice and this permission notice appear in all
 * copies.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS" AND ISC DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL ISC BE LIABLE FOR ANY
 * SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT
 * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 **/

/* istanbul ignore next: umd wrapper */
(function(root, factory) {

    'use strict';

    if (typeof define === 'function' && define.amd) {
        define(['es6-polyfills/lib/polyfills/promise', 'marc-record-js'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('es6-polyfills/lib/polyfills/promise'), require('marc-record-js'));
    }

}(this, factory));

function factory(Promise, MarcRecord)
{

    'use strict';

    var FIXED_FIELD_TAGS = [
	'FMT',
	'001',
	'002',
	'003',
	'004',
	'005',
	'006',
	'007',
	'008',
	'009'
    ];

    function convertFromLinebuffer(data)
    {

	function parseLines(offset)
	{
	    
	    var line_next;

	    offset = offset === undefined ? 0 : offset;

	    if (offset < data.length) {

		line_next = data[offset + 1];

		if (line_next !== undefined && line_next !== '' && isContinueFieldLine(line_next)) {
		    
		    if (data[offset].substr(-1) === '^') {
			data[offset] = data[offset].substr(0, data[offset].length - 1);
		    }
		    
		    data[offset] += parseContinueLineData(line_next);
		    data.splice(offset + 1, 1);
		    parseLines(offset);
		}
		
		parseLines(offset + 1);
		
	    }
	    
	}

	function parseContinueLineData(line)
	{
	    
	    var field = parseFieldFromLine(line),
	    subfield_first = field.subfields[0];

	    if (subfield_first.value === '^') {
		return line.substr(22);	
	    }
	    if (subfield_first.value === '^^') {

		return " " + line.substring(26, line.length - 1);
	    }

	    throw new Error('Could not parse Aleph Sequential subfield 9-continued line.');

	}

	function isContinueFieldLine(line)
	{

	    var subfield_first,
	    field = parseFieldFromLine(line);
	    
	    if (isControlfield(field)) {
		return false;
	    }

	    subfield_first = field.subfields[0];
	    
	    return (subfield_first.code === '9' && (subfield_first.value === '^' || subfield_first.value === '^^'));

	}

	function isControlfield(field)
	{
	    if (field.subfields === undefined) {
		return true;
	    }
	}
	

	function isFixFieldTag(tag)
	{
	    return FIXED_FIELD_TAGS.indexOf(tag) !== -1;
	}

	function parseFieldFromLine(line)
	{

	    var value,
	    tag = line.substr(10, 3);

	    if (isFixFieldTag(tag) || tag === 'LDR') {

		value = line.substr(18);

		return {
		    tag: tag,
		    value: value
		};

	    } else {

		// varfield
		var ind1 = line.substr(13, 1);
		var ind2 = line.substr(14, 1);
		var subfieldData = line.substr(18);
		var subfields = subfieldData.split('$$')
		    .filter(function(sf) { return sf.length !== 0; })
		    .map(function(subfield) {

			var code = subfield.substr(0,1);
			var value = subfield.substr(1);

			return {
			    code: code,
			    value: value
			};

		    });

		return {
		    tag: tag,
		    ind1: ind1,
		    ind2: ind2,
		    subfields: subfields
		};

	    }

	}

	var record = new MarcRecord();

	record.fields = [];
	parseLines();

	data.forEach(function(line) {

	    var field = parseFieldFromLine(line);

	    // Drop Aleph specific FMT fields.
	    if (field.tag === 'FMT') {
		return;
	    }
	    
	    if (field.tag === 'LDR') {
		record.leader = field.value;
	    } else {
		record.fields.push(field);
	    }
	    
	});

	return record;

    }

    function convertFromString(string_data)
    {

	var linebuffer, records = [];

	if (typeof string_data !== 'string') {
	    throw new Error('Argument is not a string');
	}

	linebuffer = string_data.split('\n').filter(function(line) {
	    return line !== '';
	});
	
	if (linebuffer.length > 0) {

	    records = getRecordsFromLinebuffer(linebuffer);
	   
	    if (linebuffer.length > 0) {
		records.push(convertFromLinebuffer(linebuffer));
	    }
	    
	}

	return records;

    }

    function convertToAlephSequential(record)
    {

	function createLine(tag, value, ind1, ind2)
	{

	    ind1 = ind1 === undefined || ind1.length === 0 ? ' ' : ind1;
	    ind2 = ind2 === undefined || ind2.length === 0 ? ' ' : ind2;
	    value = typeof value === 'string' ? value : value.reduce(function(result, subfield) {
		return result + '$$' + subfield.code + subfield.value;
	    }, '');

	    return id + ' ' + tag + ind1 + ind2 + ' L ' + value + '\n';

	}

	var id = record.get(/^001$/).length > 0 ? record.get(/^001$/)[0].value : '';
	var record_str = '';

	id = id.length === 9 ? id : Array.apply(undefined, {length: 9 - (id.length <= 9 ? id.length : 0)}).reduce(function(result) {
	    return result + '0';
	});

	record_str += createLine('LDR', record.leader);
	
	record.fields.forEach(function(field) {
	    record_str += createLine(field.tag, field.hasOwnProperty('value') ? field.value : field.subfields, field.ind1, field.ind2);
	});

	return record_str;

    }

    function getRecordsFromLinebuffer(linebuffer, records, id_current, offset)
    {
	
	function getIdFromLine(line) {
	    return line.split(' ')[0];
	}

	var id_line;

	records = records === undefined ? [] : records;
	id_current = id_current === undefined ? getIdFromLine(linebuffer[0]) : id_current;
	offset = offset === undefined ? 0 : offset;
	
	if (offset < linebuffer.length && linebuffer[offset].length >= 9) {
	    
	    id_line = getIdFromLine(linebuffer[offset]);
	    
	    if (id_current !== id_line) {

		records.push(convertFromLinebuffer(linebuffer.splice(0, offset)));
		id_current = id_line;
		offset = 0;
		
	    }
	    
	    return getRecordsFromLinebuffer(linebuffer, records, id_current, offset + 1);
	    
	} else {
	    return records;
	}
	
    }

    return function(fn_create_adapter)
    {

	function createReader(source)
	{

	    function resolve()
	    {
		if (pending_resolve) {
		    if (error) {

			pending_reject(error);
			pending_resolve = pending_reject = undefined;

		    } else if (records.length > 0) {

			pending_resolve({
			    value: records.shift(),
			    done: false
			});

			pending_resolve = pending_reject = undefined;

		    } else if (done) {

			pending_resolve({
			    value: undefined,
			    done: true
			});

			pending_resolve = pending_reject = undefined;

		    }
		}
	    }

	    function handleError(e)
	    {
		error = e === undefined ? new Error() : e;
		resolve();
	    }

	    function processChunk(chunk)
	    {

		var new_records;
		
		linebuffer = linebuffer.concat(chunk.split('\n').filter(function(line) {
		    return line !== '';
		}));
		
		if (linebuffer.length > 0) {
		    try {

			new_records = getRecordsFromLinebuffer(linebuffer);

			if (new_records.length > 0) {			  
			    records = records.concat(new_records);
			    resolve();
			}

		    } catch (e) {
			handleError(e);
		    }
		}
		
	    }
	    
	    function processingDone()
	    {
		if (linebuffer.length > 0) {    
		    try {
			records.push(convertFromLinebuffer(linebuffer));
			done = 1;
			resolve();
		    } catch (e) {
			handleError(e);
			resolve();
		    }
		}
	    }

	    var id_current, error, done, pending_resolve, pending_reject, reading_started,
	    linebuffer = [],
	    records = [],
	    adapter = typeof fn_create_adapter === 'function'
		? fn_create_adapter(source, processChunk, handleError, processingDone)
		: function() {
		    processChunk(source);
		    processingDone();
		};
	    
	    return {
		read: function()
		{

		    if (!reading_started) {
			adapter();
			reading_started = 1;
		    }

		    if (error) {

			return Promise.reject(error);

		    } else if (records.length > 0) {

			return Promise.resolve({
			    value: records.shift(),
			    done: false
			});

		    } else if (done) {

			return Promise.resolve({
			    value: undefined,
			    done: true
			});

		    } else {

			return new Promise(function(resolve, reject) {
			    pending_resolve = resolve;
			    pending_reject = reject;
			});

		    }

		}
	    };

	}

	return {
	    createReader: createReader,
	    convertFrom: convertFromString,
	    convertTo: convertToAlephSequential,
	    createWriter: function() {
		throw new Error('Not implemented');
	    }
	};
    };

}