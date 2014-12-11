/*jslint browser: true, devel: true, sloppy: true*/
/*global google, $*/

// Window constants
var wps_url = "http://ceda-wps2.badc.rl.ac.uk:8080/submit/form?proc_id=PlotTimeSeries&FilePath=";
var track_colours = ["#4D4D4D", "#5DA5DA", "#FAA43A",
                     "#60BD68", "#F17CB0", "#B2912F",
                     "#B276B2", "#DECF3F", "#F15854"];

// -----------------------------String.hashCode--------------------------------
String.prototype.hashCode = function () {
    // Please see: http://bit.ly/1dSyf18 for original
    var i, c, hash;

    hash = 0;
    if (this.length === 0) {
        return hash;
    }

    for (i = 0; i < this.length; i++) {
        c = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + c;
    }

    return hash;
};

String.prototype.truncatePath = function (levels) {
    // Removes 'levels' directories from a path, e.g.:
    // "/usr/bin/path/to/something/useful".truncatePath(3);
    //     => "/usr/bin/path
    parts = this.split("/");
    t_path = parts.slice(0, parts.length - levels).join("/");
    return t_path;
}

// ------------------------------Variable Filter-------------------------------
function clear_aggregated_variables() {
    select = $("#multiselect").html("");
    select.multiSelect("refresh");
}

function display_aggregated_variables(aggregations) {
    var select, i, buckets;

    select = $("#multiselect");
    buckets = aggregations.variables.buckets;
    for (i = 0; i < buckets.length; i += 1) {
        select.multiSelect("addOption", {
            value: buckets[i].key,
            text: (buckets[i].key + " (" + buckets[i].doc_count + ")")
        });
    }
}

function request_from_multiselect() {
    var i, vars, req;
    req = [];
    vars = $("#multiselect").val();

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
        return "";
    }
}

// ---------------------------"Export Results" Modal---------------------------
function update_export_results_modal(hits) {
    $("#results").html(JSON.stringify(hits, null, "    "));
}

// -------------------------------ElasticSearch--------------------------------
var es_url = "http://fatcat-test.jc.rl.ac.uk/es/badc/eufar/_search";
function request_from_filters(full_text) {
    var i, req, vars;

    req = [];
    if (full_text.length > 0) {
        ft = full_text.split(" ");
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

function create_elasticsearch_request(gmaps_corners, full_text, size) {
    var i, tmp_ne, tmp_sw, nw, se, request, tf, vars;

    tmp_ne = gmaps_corners.getNorthEast();
    tmp_sw = gmaps_corners.getSouthWest();
    nw = [tmp_sw.lng().toString(), tmp_ne.lat().toString()];
    se = [tmp_ne.lng().toString(), tmp_sw.lat().toString()];

    // ElasticSearch request
    request = {
        "_source": {
            "include": [
                "data_format.format",
                "file.filename",
                "file.path",
                "misc",
                "spatial.geometries.summary",
                "temporal"
                    ]
        },
        "filter": {
            "and": {
                "must": [
                    {
                        "geo_shape": {
                            "bbox": {
                                "shape": {
                                    "type": "envelope",
                                    "coordinates": [nw, se]
                                }
                            }
                        }
                    }
                ]
            }
        },
        "aggs": {
            "variables": {
                "terms": {
                    "field": "value",
                    "size": 30
                }
            }
        },
        "size": size
    };

    no_photography = {
       "not": {
           "term": {
               "file.path": "photography"
           }
       }
    };

    if (! $("#photography_checkbox").prop("checked")) {
        request.filter.and.must.push(no_photography);
    }

    // Add other filters from page to query
    tf = request_from_filters(full_text);
    if (tf) {
        for (i = 0; i < tf.length; i += 1) {
            request.filter.and.must.push(tf[i]);
        }
    }

    vars = request_from_multiselect();
    if (vars) {
        for (i = 0; i < vars.length; i += 1) {
            request.filter.and.must.push(vars[i]);
        }
    }

    temporal = {
        range: {
            "temporal.start_time": {
                to: null,
                from: null
            }
        }
    };
    start_time = $("#start_time").val();
    if (start_time !== "") {
        temporal.range["temporal.start_time"].from = start_time;
    }

    end_time = $("#end_time").val();
    if (end_time !== "") {
        temporal.range["temporal.start_time"].to = end_time;
    }

    if (temporal.range["temporal.start_time"].to !== null &&
            temporal.range["temporal.start_time"].from !== null) {
        request.filter.and.must.push(temporal);
    }

    return request;
}

function send_elasticsearch_request(gmap, full_text) {
    var xhr, request, response;

    request = create_elasticsearch_request(gmap.getBounds(), full_text, 300);

    // Construct and send XMLHttpRequest
    xhr = new XMLHttpRequest();
    xhr.open("POST", es_url, true);
    xhr.send(JSON.stringify(request));
    xhr.onload = function (e) {
        if (xhr.readyState === 4) {
            response = JSON.parse(xhr.responseText);
            console.log(JSON.stringify(response, null, "    "));
            if (response.hits) {
                $("#resptime").html(response.took);
                $("#numresults").html(response.hits.total);

                draw_flight_tracks(gmap, response.hits.hits);
            }

            if (response.aggregations) {
                display_aggregated_variables(response.aggregations);
            }
        }
    };
}

// -----------------------------------Map--------------------------------------
var flight_tracks = [];
var info_windows = [];

function centre_map(gmap, geocoder, loc) {
    if (loc !== "") {
        geocoder.geocode({
            address: loc
        },
        function (results, status) {
            if (status === "OK") {
                gmap.panTo(results[0].geometry.location);
            } else {
                alert("Could not find \"" + loc + "\"");
            }
        });
    }
}

function create_info_window(hit) {
    var content, info;

    hit = hit._source;
    content = "<section><p><strong>Filename: </strong>" + hit.file.filename + "</p>";
    if (hit.temporal) {
        content += "<p><strong>Start Time: </strong>" + hit.temporal.start_time + "</p>" +
                   "<p><strong>End Time: </strong>" + hit.temporal.end_time + "</p>";
    }

    if (hit.misc.flight_num) {
        content += "<p><strong>Flight Num: </strong>\"" + hit.misc.flight_num + "\"</p>";
    }

    if (hit.misc.organisation) {
        content += "<p><strong>Organisation: </strong>\"" + hit.misc.organisation + "\"</p>";
    }

    content += "<p><a href=\"http://badc.nerc.ac.uk/browse" + hit.file.path.truncatePath(2) + "\">Get data</a></p>";
    if (hit.data_format.format.search("RAF") > 0) {
        content += "<p><a href=\"" + wps_url + hit.file.path + "\" target=\"_blank\">Plot time-series</a></p>";
    }

    content += "</section>";
    info = new google.maps.InfoWindow(
        {
            content: content,
            disableAutoPan: false
        }
    );

    return info;
}

function draw_flight_tracks(gmap, hits) {
    var i, j, coords, corrected_coords, colour_index, track, hit, info_window;

    for (i = 0; i < hits.length; i+= 1) {
        hit = hits[i];

        // Construct flight track (flipping coordinates in the process)
        coords = hit._source.spatial.geometries.summary.coordinates;
        corrected_coords = [];
        for (j = 0; j < coords.length; j += 1) {
            corrected_coords.push(
                    new google.maps.LatLng(coords[j][1], coords[j][0]));
        }

        colour_index = (hit._id.hashCode() % track_colours.length);
        if (colour_index < 0) {
            colour_index = -colour_index;
        }

        if (corrected_coords.length > 1) {
            // Construct and display track
            track = new google.maps.Polyline({
                path: corrected_coords,
                geodesic: false,
                strokeColor: track_colours[colour_index],
                strokeWeight: 5,
                strokeOpacity: 0.6
            });
            track.setMap(gmap);
            flight_tracks.push(track);
        } else {
            marker = new google.maps.Marker({
                position: corrected_coords[0],
                icon: "./img/camera.png"
            });
            marker.setMap(gmap);
            flight_tracks.push(marker);
        }

        // Construct info window
        info_window = create_info_window(hit);

        // Add to lists
        info_windows.push(info_window);
    }

    for (i = 0; i < flight_tracks.length; i++) {
        google.maps.event.addListener(flight_tracks[i], 'click',
            (function (i, e) {
                return function (e) {
                    google.maps.event.clearListeners(gmap, "bounds_changed");

                    for (var j = 0; j < info_windows.length; j++) {
                        info_windows[j].close();
                    }

                    info_windows[i].setPosition(e.latLng);
                    info_windows[i].open(gmap, null);

                    window.setTimeout(function () {
                        add_bounds_changed_listener(gmap);
                    }, 500);
                };
            }
        )(i));
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

function redraw_map(gmap, add_listener) {
    cleanup();

    // Draw flight tracks
    full_text = $("#ftext").val();
    send_elasticsearch_request(gmap, full_text);

    if (add_listener) {
        window.setTimeout(function () {
            add_bounds_changed_listener(gmap);
        }, 500);
    }
}

function add_bounds_changed_listener(gmap) {
    google.maps.event.addListenerOnce(gmap, "bounds_changed", function () {
        redraw_map(gmap, true);
    });
}

// ---------------------------------Histogram----------------------------------
function draw_histogram(request) {
    ost = request.aggregations.only_sensible_timestamps;
    buckets = ost.docs_over_time.buckets;
    keys = [];
    counts = [];
    for (i = 0; i < buckets.length; i += 1) {
        keys.push(buckets[i].key_as_string);
        counts.push(buckets[i].doc_count);
    }

    $("#date_histogram").highcharts({
        chart: {
            type: "column",
            height: 200,
            width: document.getElementById("filter").offsetWidth * 0.75
        },
        title: {
            text: ""
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
            type: "logarithmic"
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
            name: "Number of documents",
            data: counts
        }]
    });
}

function send_histogram_request() {
    req = {
        "aggs": {
            "only_sensible_timestamps": {
                "filter": {
                    "range": {
                        "temporal.start_time": {
                            "gt": "2000-01-01"
                        }
                    }
                },
                "aggs": {
                    "docs_over_time": {
                        "date_histogram": {
                            "field": "start_time",
                            "format": "MM-yyyy",
                            "interval": "month",
                            "min_doc_count": 0
                        }
                    }
                }
            }
        },
        "size": 0
    };

    xhr = new XMLHttpRequest();
    xhr.open("POST", es_url, true);
    xhr.send(JSON.stringify(req));
    xhr.onload = function (e) {
        if (xhr.readyState === 4) {
            response = JSON.parse(xhr.responseText);
            draw_histogram(response);
        }
    };
}

// ------------------------------window.onload---------------------------------
window.onload = function () {
    var geocoder, lat, lon, map;

    // Google Maps geocoder and map object
    geocoder = new google.maps.Geocoder();
    map = new google.maps.Map(
        document.getElementById("map"),
        {
            mapTypeId: google.maps.MapTypeId.TERRAIN,
            zoom: 4
        }
    );

    centre_map(map, geocoder, "Lake Balaton, Hungary");
    google.maps.event.addListener(map, 'mousemove', function(event) {
        // Add listener to update mouse position
        // see: http://bit.ly/1zAfter
        lat = event.latLng.lat().toFixed(4);
        lon = event.latLng.lng().toFixed(4);
		$("#mouse").html(lat + ', ' + lon);
	});

    //------------------------------- Buttons -------------------------------
    $("#location_search").click(
        function () {
            centre_map(map, geocoder, $("#location").val());
        }
    );

    $("#ftext").keypress(
        function (e) {
            var charcode = e.charCode || e.keyCode || e.which;
            if (charcode === 13) {
                cleanup();
                redraw_map(map, false);
                return false;
            }
        }
    );

    $("#location").keypress(
        function (e) {
            var charcode = e.charCode || e.keyCode || e.which;
            if (charcode === 13) {
                centre_map(map, geocoder, $("#location").val());
                return false;
            }
        }
    );

    $("#applyfil").click(
        function () {
            cleanup();
            redraw_map(map, false);
        }
    );

    $("#clearfil").click(
        function () {
            $("#start_time").val("");
            $("#end_time").val("");
            $("#ftext").val("");
            clear_aggregated_variables();
            cleanup();
            redraw_map(map, false);
        }
    );

    //--------------------------- "Export Results" ---------------------------
    $("#raw_json").click(
        function () {
            req = create_elasticsearch_request(map.getBounds(), full_text, 500);
            xhr = new XMLHttpRequest();
            xhr.open("POST", es_url, true);
            xhr.send(JSON.stringify(req));
            xhr.onload = function (e) {
                if (xhr.readyState === 4) {
                    response = JSON.parse(xhr.responseText);
                    update_export_results_modal(response.hits.hits);
                }
            }
        }
    );

    $("#file_paths").click(
        function () {
            req = create_elasticsearch_request(map.getBounds(), full_text, 500);
            xhr = new XMLHttpRequest();
            xhr.open("POST", es_url, true);
            xhr.send(JSON.stringify(req));
            xhr.onload = function (e) {
                if (xhr.readyState === 4) {
                    response = JSON.parse(xhr.responseText);
                    h = response.hits.hits;

                    var paths = [];
                    for (var i = 0; i < h.length; i += 1) {
                        paths.push(h[i]["_source"].file.path);
                    }
                    update_export_results_modal(paths);
                }
            }
        }
    );

    $("#dl_urls").click(
        function () {
            req = create_elasticsearch_request(map.getBounds(), full_text, 500);
            xhr = new XMLHttpRequest();
            xhr.open("POST", es_url, true);
            xhr.send(JSON.stringify(req));
            xhr.onload = function (e) {
                if (xhr.readyState === 4) {
                    response = JSON.parse(xhr.responseText);
                    h = response.hits.hits;

                    var paths = [];
                    for (var i = 0; i < h.length; i += 1) {
                        paths.push("http://badc.nerc.ac.uk/browse" + h[i]["_source"].file.path);
                    }
                    update_export_results_modal(paths);
                }
            }
        }
    );

    //----------------------------- UI Widgets -------------------------------
    $("#multiselect").multiSelect(
        {
            afterSelect: function () {
                redraw_map(map, false);
            },
            afterDeselect: function () {
                redraw_map(map, false);
            },
        }
    );

    // Kick off help text popovers
    // http://stackoverflow.com/a/18537617
    $('[data-toggle="popover"]').popover({
        'trigger': 'hover',
        'placement': 'top'
    });

    // Datepicker
    var picker = $("#datepicker").datepicker({
        autoclose: true,
        format: "yyyy-mm-dd",
        startView: 2
    });

    // Draw histogram
    send_histogram_request();

    // "Include photography" checkbox
    $("#photography_checkbox").change(function () {
        redraw_map(map, false);
    });

    //---------------------------- Map main loop ------------------------------
    add_bounds_changed_listener(map);
};
