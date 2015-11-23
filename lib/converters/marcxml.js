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
        define(['es6-polyfills/lib/promise', 'marc-record-js', 'xmldom'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('es6-polyfills/lib/promise'), require('marc-record-js'), require('xmldom'));
    }

}(this, factory));

function factory(Promise, MarcRecord, xmldom)
{

    'use strict';

    var NODE_TYPE = {
	text_node: 3
    };


    function convertToXml(record)
    {

	function mkDatafield(field) {
	    
	    var datafield = mkElement('datafield');

	    datafield.setAttribute('tag', field.tag);
	    datafield.setAttribute('ind1', formatIndicator(field.ind1));
	    datafield.setAttribute('ind2', formatIndicator(field.ind2));

	    field.subfields.forEach(function(subfield) {

		var sub = mkElementValue('subfield', subfield.value);

		sub.setAttribute('code', subfield.code);
		datafield.appendChild(sub);

	    });

	    return datafield;

	}

	function formatIndicator(ind) {
	    return ind == '_' ? ' ' : ind;
	}

	function mkElementValue(name, value) {

	    var el = mkElement(name),
	    t = xmldoc.createTextNode(value);

	    el.appendChild(t);

	    return el;

	}

	function mkElement(name) {
	    return xmldoc.createElement(name);
	}

	function mkControlfield(tag, value) {

	    var cf = mkElement('controlfield'),
	    t = xmldoc.createTextNode(value);

	    cf.setAttribute('tag', tag);
	    cf.appendChild(t);

	    return cf;

	}

	var xmldoc = new xmldom.DOMImplementation().createDocument(),
	xml = mkElement('record'),
	leader = mkElementValue('leader', record.leader);

	xml.appendChild(leader);

	record.getControlfields().forEach(function(field) {
	    xml.appendChild(mkControlfield(field.tag, field.value));
	});

	record.getDatafields().forEach(function(field) {
	    xml.appendChild(mkDatafield(field));
	});

	return xml;

    }

    function convertFromXml(xml)
    {

	function getRecords(offset, records)
	{

	    function notTextNode(node) {
		return node.nodeType !== NODE_TYPE.text_node;
	    }

	    function handleLeaderNode(node) {
		if (node.childNodes[0] !== undefined && node.childNodes[0].nodeType === NODE_TYPE.text_node
		    && node.childNodes[0].data.trim().length > 0) {
		    record.leader = node.childNodes[0].data;
		} else {
		    throw new Error('Record has invalid leader');
		}
	    }

	    function handleControlfieldNode(node) {
		
		var value,
		tag = node.getAttribute('tag');

		if (node.childNodes[0] !== undefined && node.childNodes[0].nodeType === NODE_TYPE.text_node) {
		    value = node.childNodes[0].data;
		    record.appendControlField([tag, value]);
		} else {
		    throw new Error('Unable to parse controlfield: ' + tag);
		}

	    }

	    function handleDatafieldNode(node) {

		var tag = node.getAttribute('tag'),
		ind1 = node.getAttribute('ind1'),
		ind2 = node.getAttribute('ind2'),
		subfields  = Array.prototype.slice.call(node.childNodes).filter(notTextNode).map(function(subfieldNode) {
		    
		    var code = subfieldNode.getAttribute('code');
		    var text = getChildTextNodeContents(subfieldNode).join('');

		    return {
			code: code,
			value: text
		    };

		});

		record.appendField({
		    tag: tag,
		    ind1: ind1,
		    ind2: ind2,
		    subfields: subfields
		});

	    }
	    
	    function getChildTextNodeContents(node) {
		
		var nodes_child = Array.prototype.slice.call(node.childNodes),
		nodes_text = nodes_child.filter(function(node) {
		    return node.nodeType === NODE_TYPE.text_node;
		});

		return nodes_text.map(function(node) {
		    return node.data;
		});

	    }

	    var nodes_child, node_record,
	    record = new MarcRecord();

	    offset = offset === undefined ? 0 : offset;
	    records = records === undefined ? [] : records;	    

	    node_record = nodes_record.item(offset);
	    
	    if (node_record === undefined) {
		return records;
	    } else {

		nodes_child = (node_record !== undefined) ?  Array.prototype.slice.call(node_record.childNodes) : [];

		nodes_child.filter(notTextNode).forEach(function(node) {
		    switch (node.tagName) {
		    case 'leader':
			handleLeaderNode(node);
			break;
		    case 'controlfield':
			handleControlfieldNode(node);
			break;
		    case 'datafield':
			handleDatafieldNode(node);
			break;
		    default:
			throw new Error('Unable to parse node: ' + node.tagName);
		    }
		});

		return getRecords(offset + 1, records.concat(record));

	    }

	}

	var nodes_record,
	xmldoc = new xmldom.DOMImplementation().createDocument();

	try {
	    nodes_record = xml.getElementsByTagName('record'); 
	} catch (e) {
	    throw new Error('Invalid XML object');
	}

	return getRecords();

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

		function getRecords()
		{

		    var offset = charbuffer.indexOf('<record');

		    if (offset >= 0) {

			charbuffer = charbuffer.substr(offset);
			offset = charbuffer.indexOf('</record>');

			if (offset >= 0) {
			    try {

				records.push(convertFromXml(
				    parser.parseFromString(charbuffer.substr(0, offset + 10))
				).shift());

				charbuffer = charbuffer.substr(offset + 10);
				resolve();
				getRecords();

			    } catch (e) {
				handleError(e);
			    }
			}

		    }

		}
		
		var parser = new xmldom.DOMParser();

		charbuffer += chunk;

		getRecords();
		
	    }
	    
	    function processingDone()
	    {
		done = 1;
		resolve();
	    }

	    var error, done, pending_resolve, pending_reject, reading_started,
	    charbuffer = '',
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
	    convertFrom: convertFromXml,
	    convertTo: convertToXml,
	    createWriter: function()
	    {
		throw new Error('Not implemented');
	    },
	};

    };

}