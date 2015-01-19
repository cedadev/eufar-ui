/*jslint browser: true, devel: true, sloppy: true*/
/*global google, $*/

function getParameterByName(name) {
    // Function from: http://stackoverflow.com/a/901144
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
        results = regex.exec(location.search);
    if (!results) {
        return null;
    } else {
        return decodeURIComponent(results[1].replace(/\+/g, ' '));
    }
}

// Window constants
var INDEX = getParameterByName('index') || 'badc';
var ES_URL = 'http://fatcat-test.jc.rl.ac.uk:9200/' + INDEX + '/_search';
var WPS_URL = 'http://ceda-wps2.badc.rl.ac.uk:8080/submit/form?proc_id=PlotTimeSeries&FilePath=';
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
    } else {
        return '';
    }
}

// ---------------------------'Export Results' Modal---------------------------
function updateExportResultsModal(hits) {
    $('#results').html(JSON.stringify(hits, null, '    '));
}

// -------------------------------ElasticSearch--------------------------------
function requestFromFilters(full_text) {
    var i, ft, req, vars;

    req = [];
    if (full_text.length > 0) {
        ft = full_text.split(' ');
        for (i = 0; i < ft.length; i += 1) {
            req.push({
                term: {
                    _all: ft[i]
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
                'spatial.geometries.summary',
                'temporal'
            ]
        },
        'filter': {
            'and': {
                'must': [
                    {
                        'geo_shape': {
                            'bbox': {
                                'shape': {
                                    'type': 'envelope',
                                    'coordinates': [nw, se]
                                }
                            }
                        }
                    }
                ]
            }
        },
        'aggs': {
            'variables': {
                'terms': {
                    'field': 'value',
                    'size': 30
                }
            }
        },
        'size': size
    };

    no_photography = {
        'not': {
            'term': {
                'file.path': 'photography'
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
            'temporal.start_time': {
                to: null,
                from: null
            }
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

    if (temporal.range['temporal.start_time'].to !== null &&
            temporal.range['temporal.start_time'].from !== null) {
        request.filter.and.must.push(temporal);
    }

    return request;
}

function sendElasticsearchRequest(gmap, full_text) {
    var xhr, request, response;

    request = createElasticsearchRequest(gmap.getBounds(), full_text, 300);

    // Construct and send XMLHttpRequest
    xhr = new XMLHttpRequest();
    xhr.open('POST', ES_URL, true);
    xhr.send(JSON.stringify(request));
    xhr.onload = function (e) {
        if (xhr.readyState === 4) {
            response = JSON.parse(xhr.responseText);
            if (response.hits) {
                $('#resptime').html(response.took);
                $('#numresults').html(response.hits.total);

                drawFlightTracks(gmap, response.hits.hits);
            }

            if (response.aggregations) {
                displayAggregatedVariables(response.aggregations);
            }
        }
    };
}

// -----------------------------------Map--------------------------------------
var flight_tracks = [];
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

    content += '<p><a href="http://badc.nerc.ac.uk/browse' +
               hit.file.path.truncatePath(2) + '">Get data</a></p>';

    if (hit.data_format.format.search('RAF') > 0) {
        content += '<p><a href="' + WPS_URL + hit.file.path +
                   '" target="_blank">Plot time-series</a></p>';
    }

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
    var coords, corrected_coords, colour_index,
        hit, info_window, i, j, marker, track;

    for (i = 0; i < hits.length; i += 1) {
        hit = hits[i];

        // Construct flight track (flipping coordinates in the process)
        coords = hit._source.spatial.geometries.summary.coordinates;
        corrected_coords = [];
        for (j = 0; j < coords.length; j += 1) {
            corrected_coords.push(
                new google.maps.LatLng(coords[j][1], coords[j][0])
            );
        }

        colour_index = (hit._id.hashCode() % TRACK_COLOURS.length);
        if (colour_index < 0) {
            colour_index = -colour_index;
        }

        if (corrected_coords.length > 1) {
            // Construct and display track
            track = new google.maps.Polyline({
                path: corrected_coords,
                geodesic: false,
                strokeColor: TRACK_COLOURS[colour_index],
                strokeWeight: 5,
                strokeOpacity: 0.6
            });
            track.setMap(gmap);
            flight_tracks.push(track);
        } else {
            marker = new google.maps.Marker({
                position: corrected_coords[0],
                icon: './img/camera.png'
            });
            marker.setMap(gmap);
            flight_tracks.push(marker);
        }

        // Construct info window
        info_window = createInfoWindow(hit);

        // Add to lists
        info_windows.push(info_window);
    }

    for (i = 0; i < flight_tracks.length; i += 1) {
        google.maps.event.addListener(flight_tracks[i], 'click',
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
            })(i));
    }
}

function cleanup() {
    var i;

    for (i = 0; i < flight_tracks.length; i += 1) {
        flight_tracks[i].setMap(null);
    }
    flight_tracks = [];

    for (i = 0; i < info_windows.length; i += 1) {
        info_windows[i].close();
    }
    info_windows = [];
}

function redrawMap(gmap, add_listener) {
    var full_text;

    cleanup();

    // Draw flight tracks
    full_text = $('#ftext').val();
    sendElasticsearchRequest(gmap, full_text);

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
                            'field': 'start_time',
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
    var geocoder, lat, lon, map, picker;

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
            var full_text, req, response, xhr;

            req = createElasticsearchRequest(map.getBounds(), full_text, 500);
            xhr = new XMLHttpRequest();
            xhr.open('POST', ES_URL, true);
            xhr.send(JSON.stringify(req));
            xhr.onload = function (e) {
                if (xhr.readyState === 4) {
                    response = JSON.parse(xhr.responseText);
                    updateExportResultsModal(response.hits.hits);
                }
            };
        }
    );

    $('#file_paths').click(
        function () {
            var full_text, h, i, req, response, xhr;

            req = createElasticsearchRequest(map.getBounds(), full_text, 500);
            xhr = new XMLHttpRequest();
            xhr.open('POST', ES_URL, true);
            xhr.send(JSON.stringify(req));
            xhr.onload = function (e) {
                if (xhr.readyState === 4) {
                    response = JSON.parse(xhr.responseText);
                    h = response.hits.hits;

                    var paths = [];
                    for (i = 0; i < h.length; i += 1) {
                        paths.push(h[i]._source.file.path);
                    }
                    updateExportResultsModal(paths);
                }
            };
        }
    );

    $('#dl_urls').click(
        function () {
            var full_text, h, i, req, response, xhr;

            req = createElasticsearchRequest(map.getBounds(), full_text, 500);
            xhr = new XMLHttpRequest();
            xhr.open('POST', ES_URL, true);
            xhr.send(JSON.stringify(req));
            xhr.onload = function (e) {
                if (xhr.readyState === 4) {
                    response = JSON.parse(xhr.responseText);
                    h = response.hits.hits;

                    var paths = [];
                    for (i = 0; i < h.length; i += 1) {
                        paths.push('http://badc.nerc.ac.uk/browse' + h[i]._source.file.path);
                    }
                    updateExportResultsModal(paths);
                }
            };
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
