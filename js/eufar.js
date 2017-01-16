/*jslint browser: true, devel: true, sloppy: true*/
/*global google, $, GeoJSON*/

function getParameterByName(name) {
    // Function from: http://stackoverflow.com/a/901144
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
        results = regex.exec(location.search);
    if (!results) {
        return null;
    }
    return decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Window constants
var REQUEST_SIZE = 400;
var INDEX = getParameterByName('index') || 'eufar';
var ES_URL = 'http://jasmin-es1.ceda.ac.uk:9000/' + INDEX + '/_search';
var TRACK_COLOURS = [
    '#4D4D4D', '#5DA5DA', '#FAA43A',
    '#60BD68', '#F17CB0', '#B2912F',
    '#B276B2', '#DECF3F', '#F15854'
];

// -----------------------------------String-----------------------------------
String.prototype.hashCode = function () {
    // Please see: http://bit.ly/1dSyf18 for original
    var i, c, hash;

    hash = 0;
    if (this.length === 0) {
        return hash;
    }

    for (i = 0; i < this.length; i += 1) {
        c = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + c;
    }

    return hash;
};

String.prototype.truncatePath = function (levels) {
    // Removes 'levels' directories from a path, e.g.:
    // '/usr/bin/path/to/something/useful'.truncatePath(3);
    //     => '/usr/bin/path
    var parts, t_path;
    parts = this.split('/');
    t_path = parts.slice(0, parts.length - levels).join('/');
    return t_path;
};

// ------------------------------Variable Filter-------------------------------
function clearAggregatedVariables() {
    var select = $('#multiselect').html('');
    select.multiSelect('refresh');
}

function displayAggregatedVariables(aggregations) {
    var select, i, buckets;

    select = $('#multiselect');
    buckets = aggregations.variables.buckets;
    for (i = 0; i < buckets.length; i += 1) {
        select.multiSelect('addOption', {
            value: buckets[i].key,
            text: (buckets[i].key + ' (' + buckets[i].doc_count + ')')
        });
    }
}

function requestFromMultiselect() {
    var i, vars, req;
    req = [];
    vars = $('#multiselect').val();

    if (vars) {
        for (i = 0; i < vars.length; i += 1) {
            req.push({
                term: {
                    _all: vars[i]
                }
            });
        }
        return req;
    }
    return '';
}

// ---------------------------'Export Results' Modal---------------------------
function updateExportResultsModal(hits) {
    $('#results').html(JSON.stringify(hits, null, '    '));
}

// -------------------------------ElasticSearch--------------------------------
function requestFromFilters(full_text) {
    var i, ft, req;

    req = [];
    if (full_text.length > 0) {
        ft = full_text.split(' ');
        for (i = 0; i < ft.length; i += 1) {
            req.push({
                term: {
                    _all: ft[i].toLowerCase()
                }
            });
        }
        return req;
    }
}

function createElasticsearchRequest(gmaps_corners, full_text, size) {
    var i, end_time, tmp_ne, tmp_sw, no_photography, nw,
        se, start_time, request, temporal, tf, vars;

    tmp_ne = gmaps_corners.getNorthEast();
    tmp_sw = gmaps_corners.getSouthWest();
    nw = [tmp_sw.lng().toString(), tmp_ne.lat().toString()];
    se = [tmp_ne.lng().toString(), tmp_sw.lat().toString()];

    // ElasticSearch request
    request = {
        '_source': {
            'include': [
                'data_format.format',
                'file.filename',
                'file.path',
                'misc',
                'spatial.geometries.display',
                'temporal'
            ]
        },
        'filter': {
            'and': {
                'must': [
                    {
                        'geo_shape': {
                            'spatial.geometries.search': {
                                'shape': {
                                    'type': 'envelope',
                                    'coordinates': [nw, se]
                                }
                            }
                        }
                    },
                    {
                        "not": {
                            "missing": {
                                "field": "spatial.geometries.display.type"
                            }
                        }
                    }
                ]
            }
        },
        'aggs': {
            'variables': {
                'terms': {
                    'field': 'parameters.value',
                    'size': 30
                }
            }
        },
        'size': size
    };

    no_photography = {
        'not': {
            'term': {
                'spatial.geometries.display.type': 'point'
            }
        }
    };

    if (!$('#photography_checkbox').prop('checked')) {
        request.filter.and.must.push(no_photography);
    }

    // Add other filters from page to query
    tf = requestFromFilters(full_text);
    if (tf) {
        for (i = 0; i < tf.length; i += 1) {
            request.filter.and.must.push(tf[i]);
        }
    }

    vars = requestFromMultiselect();
    if (vars) {
        for (i = 0; i < vars.length; i += 1) {
            request.filter.and.must.push(vars[i]);
        }
    }

    temporal = {
        range: {
            'temporal.start_time': {}
        }
    };

    start_time = $('#start_time').val();
    if (start_time !== '') {
        temporal.range['temporal.start_time'].from = start_time;
    }

    end_time = $('#end_time').val();
    if (end_time !== '') {
        temporal.range['temporal.start_time'].to = end_time;
    }

    if (temporal.range['temporal.start_time'].to !== null ||
            temporal.range['temporal.start_time'].from !== null) {
        request.filter.and.must.push(temporal);
    }

    return request;
}

function sendElasticsearchRequest(request, callback, gmap) {
    var xhr, response;

    // Construct and send XMLHttpRequest
    xhr = new XMLHttpRequest();
    xhr.open('POST', ES_URL, true);
    xhr.send(JSON.stringify(request));
    xhr.onload = function () {
        if (xhr.readyState === 4) {
            response = JSON.parse(xhr.responseText);

            if (gmap) {
                callback(response, gmap);
            } else {
                callback(response);
            }
        }
    };
}

function updateMap(response, gmap) {
    if (response.hits) {
        // Update "hits" and "response time" fields
        $('#resptime').html(response.took);
        $('#numresults').html(response.hits.total);

        // Draw flight tracks on a map
        drawFlightTracks(gmap, response.hits.hits);
    }

    if (response.aggregations) {
        // Generate variable aggregation on map and display
        displayAggregatedVariables(response.aggregations);
    }
}

function updateRawJSON(response) {
    updateExportResultsModal(response.hits.hits);
}

function updateFilePaths(response) {
    var h, i, paths;
    h = response.hits.hits;

    paths = [];
    for (i = 0; i < h.length; i += 1) {
        paths.push(h[i]._source.file.path);
    }

    updateExportResultsModal(paths);
}

function updateDownloadPaths(response) {
    var h, i, paths;
    h = response.hits.hits;

    paths = [];
    for (i = 0; i < h.length; i += 1) {
        paths.push('http://badc.nerc.ac.uk/browse' + h[i]._source.file.path);
    }

    updateExportResultsModal(paths);
}


// -----------------------------------Map--------------------------------------
var geometries = [];
var info_windows = [];

function centreMap(gmap, geocoder, loc) {
    if (loc !== '') {
        geocoder.geocode(
            {
                address: loc
            },
            function (results, status) {
                if (status === 'OK') {
                    gmap.panTo(results[0].geometry.location);
                } else {
                    alert('Could not find "' + loc + '"');
                }
            }
        );
    }
}

function createInfoWindow(hit) {
    var content, info;

    hit = hit._source;
    content = '<section><p><strong>Filename: </strong>' +
              hit.file.filename + '</p>';

    if (hit.temporal) {
        content += '<p><strong>Start Time: </strong>' +
                   hit.temporal.start_time + '</p>' +
                   '<p><strong>End Time: </strong>' +
                   hit.temporal.end_time + '</p>';
    }

    if (hit.misc.flight_info) {
        if (hit.misc.flight_info.flight_num) {
            content += '<p><strong>Flight Num: </strong>"' +
                       hit.misc.flight_info.flight_num + '"</p>';
        }

        if (hit.misc.flight_info.organisation) {
            content += '<p><strong>Organisation: </strong>"' +
                       hit.misc.flight_info.organisation + '"</p>';
        }
    }

    if (hit.misc.instrument) {
        if (hit.misc.instrument.instrument) {
            content += '<p><strong>Instrument: </strong>"' +
                       hit.misc.instrument.instrument + '"</p>';
        }
    }

    content += '<p><a target="_blank" href="http://badc.nerc.ac.uk/browse' +
               hit.file.path + '">Get this data file</a></p>';

    content += '<p><a target="_blank" href="http://badc.nerc.ac.uk/browse' +
               hit.file.path.truncatePath(2) + '">Get data for this flight</a></p>';    

    content += '</section>';
    info = new google.maps.InfoWindow(
        {
            content: content,
            disableAutoPan: false
        }
    );

    return info;
}

function drawFlightTracks(gmap, hits) {
    var colour_index, geom, hit, i, info_window, options, display;

    for (i = 0; i < hits.length; i += 1) {
        hit = hits[i];

        colour_index = (hit._id.hashCode() % TRACK_COLOURS.length);
        if (colour_index < 0) {
            colour_index = -colour_index;
        }

        options = {
            strokeColor: TRACK_COLOURS[colour_index],
            strokeWeight: 5,
            strokeOpacity: 0.6
        };

        // Create GeoJSON object
        display = hit._source.spatial.geometries.display;
        geom = GeoJSON(display, options);

        geom.setMap(gmap);
        geometries.push(geom);

        // Construct info window
        info_window = createInfoWindow(hit);
        info_windows.push(info_window);
    }

    for (i = 0; i < geometries.length; i += 1) {
        google.maps.event.addListener(geometries[i], 'click',
            (function (i, e) {
                return function (e) {
                    var j;

                    google.maps.event.clearListeners(gmap, 'bounds_changed');

                    for (j = 0; j < info_windows.length; j += 1) {
                        info_windows[j].close();
                    }

                    info_windows[i].setPosition(e.latLng);
                    info_windows[i].open(gmap, null);

                    window.setTimeout(function () {
                        addBoundsChangedListener(gmap);
                    }, 500);
                };
            }
        )(i));
    }
}

function cleanup() {
    var i;

    for (i = 0; i < geometries.length; i += 1) {
        geometries[i].setMap(null);
    }
    geometries = [];

    for (i = 0; i < info_windows.length; i += 1) {
        info_windows[i].close();
    }
    info_windows = [];
}

function redrawMap(gmap, add_listener) {
    var full_text, request;

    cleanup();

    // Draw flight tracks
    full_text = $('#ftext').val();
    request = createElasticsearchRequest(gmap.getBounds(), full_text, REQUEST_SIZE);
    sendElasticsearchRequest(request, updateMap, gmap);

    if (add_listener === true) {
        window.setTimeout(function () {
            addBoundsChangedListener(gmap);
        }, 500);
    }
}

function addBoundsChangedListener(gmap) {
    google.maps.event.addListenerOnce(gmap, 'bounds_changed', function () {
        redrawMap(gmap, true);
    });
}

// ---------------------------------Histogram----------------------------------
function drawHistogram(request) {
    var ost, buckets, keys, counts, i;

    ost = request.aggregations.only_sensible_timestamps;
    buckets = ost.docs_over_time.buckets;
    keys = [];
    counts = [];
    for (i = 0; i < buckets.length; i += 1) {
        keys.push(buckets[i].key_as_string);
        counts.push(buckets[i].doc_count);
    }

    $('#date_histogram').highcharts({
        chart: {
            type: 'column',
            height: 200,
            width: document.getElementById('filter').offsetWidth * 0.75
        },
        title: {
            text: ''
        },
        xAxis: {
            categories: keys,
            labels: {
                step: 6,
                rotation: 270,
                useHTML: true
            }
        },
        yAxis: {
            title: {
                text: null
            },
            type: 'logarithmic'
        },
        legend: {
            enabled: false
        },
        plotOptions: {
            column: {
                borderWidth: 0,
                groupPadding: 0,
                pointPadding: 0
            }
        },
        series: [{
            name: 'Number of documents',
            data: counts
        }]
    });
}

function sendHistogramRequest() {
    var req, response, xhr;

    req = {
        'aggs': {
            'only_sensible_timestamps': {
                'filter': {
                    'range': {
                        'temporal.start_time': {
                            'gt': '2000-01-01'
                        }
                    }
                },
                'aggs': {
                    'docs_over_time': {
                        'date_histogram': {
                            'field': 'temporal.start_time',
                            'format': 'MM-yyyy',
                            'interval': 'month',
                            'min_doc_count': 0
                        }
                    }
                }
            }
        },
        'size': 0
    };

    xhr = new XMLHttpRequest();
    xhr.open('POST', ES_URL, true);
    xhr.send(JSON.stringify(req));
    xhr.onload = function (e) {
        if (xhr.readyState === 4) {
            response = JSON.parse(xhr.responseText);
            drawHistogram(response);
        }
    };
}

// ------------------------------window.onload---------------------------------
window.onload = function () {
    var geocoder, lat, lon, map;

    // Google Maps geocoder and map object
    geocoder = new google.maps.Geocoder();
    map = new google.maps.Map(
        document.getElementById('map'),
        {
            mapTypeId: google.maps.MapTypeId.TERRAIN,
            zoom: 4
        }
    );

    centreMap(map, geocoder, 'Lake Balaton, Hungary');
    google.maps.event.addListener(map, 'mousemove', function (event) {
        // Add listener to update mouse position
        // see: http://bit.ly/1zAfter
        lat = event.latLng.lat().toFixed(4);
        lon = event.latLng.lng().toFixed(4);
		$('#mouse').html(lat + ', ' + lon);
	});

    //------------------------------- Buttons -------------------------------
    $('#location_search').click(
        function () {
            centreMap(map, geocoder, $('#location').val());
        }
    );

    $('#ftext').keypress(
        function (e) {
            var charcode = e.charCode || e.keyCode || e.which;
            if (charcode === 13) {
                cleanup();
                redrawMap(map, false);
                return false;
            }
        }
    );

    $('#location').keypress(
        function (e) {
            var charcode = e.charCode || e.keyCode || e.which;
            if (charcode === 13) {
                centreMap(map, geocoder, $('#location').val());
                return false;
            }
        }
    );

    $('#applyfil').click(
        function () {
            cleanup();
            redrawMap(map, false);
        }
    );

    $('#clearfil').click(
        function () {
            $('#start_time').val('');
            $('#end_time').val('');
            $('#ftext').val('');
            clearAggregatedVariables();
            cleanup();
            redrawMap(map, false);
        }
    );

    //--------------------------- 'Export Results' ---------------------------
    $('#raw_json').click(
        function () {
            var req;
            req = createElasticsearchRequest(map.getBounds(), $('#ftext').val(), 100);
            sendElasticsearchRequest(req, updateRawJSON);
        }
    );

    $('#file_paths').click(
        function () {
            var req;
            sendElasticsearchRequest(req, updateFilePaths);
            req = createElasticsearchRequest(map.getBounds(), $('#ftext').val(), 100);
        }
    );

    $('#dl_urls').click(
        function () {
            var req;
            sendElasticsearchRequest(req, updateDownloadPaths);
            req = createElasticsearchRequest(map.getBounds(), $('#ftext').val(), 100);
        }
    );

    $('#export_modal_close').click(
        function () {
            updateExportResultsModal(null);
        }
    );

    //----------------------------- UI Widgets -------------------------------
    $('#multiselect').multiSelect(
        {
            afterSelect: function () {
                redrawMap(map, false);
            },
            afterDeselect: function () {
                redrawMap(map, false);
            }
        }
    );

    // Kick off help text popovers
    // http://stackoverflow.com/a/18537617
    $('[data-toggle="popover"]').popover({
        'trigger': 'hover',
        'placement': 'top'
    });

    // Datepicker
    picker = $('#datepicker').datepicker({
        autoclose: true,
        format: 'yyyy-mm-dd',
        startView: 2
    });

    // Draw histogram
    sendHistogramRequest();

    // 'Include photography' checkbox
    $('#photography_checkbox').change(function () {
        redrawMap(map, false);
    });

    //---------------------------- Map main loop ------------------------------
    addBoundsChangedListener(map);
};
