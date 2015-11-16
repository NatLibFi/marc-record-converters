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
        define(['chai', 'chai-as-promised', 'xmldom', '../../lib/converters/marcxml'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('chai'), require('chai-as-promised'), require('xmldom'), require('../../lib/converters/marcxml'));
    }

}(this, factory));

function factory(chai, chaiAsPromised, xmldom, createConverter)
{

    'use strict';

    return function(getResources)
    {

	var expect = chai.expect;
	var should = chai.should();
	var xml_parser = new xmldom.DOMParser();
	var resources = {
	    from: 'test/resources/marcxml/from',
	    fromMultiple: 'test/resources/marcxml/from_multiple',
	    fromInvalidLeaders: 'test/resources/marcxml/from_invalid_leaders',
	    to: 'test/resources/marcxml/to',
	    toMultiple: 'test/resources/marcxml/to_multiple',
	};
	
	chai.use(chaiAsPromised);

	describe('converter-marcxml', function() {

	    before(function(done) {
		getResources(resources).then(
		    function(){ done(); },
		    done
		);
	    });

	    describe('factory', function() {

		it('Should return the expected object', function() {

		    var converter = createConverter();

		    expect(converter).to.contain.all.keys([
			'createReader',
			'convertFrom',
			'createWriter',
			'convertTo'
		    ]);

		    expect(converter.createReader).to.be.a('function');
		    expect(converter.convertFrom).to.be.a('function');
		    expect(converter.createWriter).to.be.a('function');
		    expect(converter.convertTo).to.be.a('function');

		});

	    });

	    describe('#createReader', function() {

		it('Should successfully create a new reader', function() {

		    var obj = createConverter(function(){}).createReader();

		    expect(obj).to.contain.all.keys(['read']);
		    expect(obj.read).to.be.a('function');

		});

		it('Should successfully convert data', function() {

		    function iterate(count)
		    {

			count = count === undefined ? 0 : count;

			return reader.read().then(function(result) {
			    if (result.done) {
				return count;
			    } else if (result.value !== undefined) {
				return iterate(count + 1);
			    } else {
				return Promise.reject('Invalid value');
			    }
			});

		    }

		    var reader = createConverter(function(source, cb_process, cb_error, cb_done) {
			return function()
			{
			    cb_process(xml_parser.parseFromString(resources.from));
			    cb_done();
			};
		    }).createReader();

		    return iterate().should.eventually.eql(1);

		});
		
		it('Should reject because reading fails', function() {
		    return createConverter(function(source, cb_process, cb_error) {
			return function(){ cb_error(new Error('Foo')); };
		    }).createReader().read().should.eventually.be.rejectedWith(/^Error: Foo/);
		});

	    });

	    describe('#createWriter', function() {});

	    describe('#convertFrom', function() {

		it('Should convert data', function() {

		    var records = createConverter().convertFrom(xml_parser.parseFromString(resources.from));

		    expect(records).to.be.an('array');
		    expect(records).to.have.length(1);
		    expect(records[0].toString()).to.eql(resources.to);

		});

		it('Should convert data with multiple records in it', function() {

		    var records = createConverter().convertFrom(xml_parser.parseFromString(resources.fromMultiple));

		    expect(records).to.be.an('array');
		    expect(records).to.have.length(2);
		    expect(
			records[0].toString() + records[1].toString()
		    ).to.eql(resources.toMultiple);

		});

		it('Should throw because data is invalid', function() {
		    expect(function() {
			createConverter().convertFrom('foo');
		    }).to.throw(/^Invalid XML object/);
		});

		it('Should throw because record is invalid', function() {

		    expect(function() {
			createConverter().convertFrom(xml_parser.parseFromString(resources.fromInvalidLeaders));
		    }).to.throw(/^Record has invalid leader/);

		});
		
	    });

	    describe('#convertTo', function() {});

	});

    };

}
