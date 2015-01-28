EUFAR Flight Finder Help Pages
==============================

The Interface
-------------

The screen in front of you should be split into two sections. On the left
should be a side panel with accordion-style expanding elements that contain
useful elements for refining your search parameters. On the right should be a
large map with coloured flight tracks overlaid on top.

These flight tracks are simple 30-coordinate tracks extracted from flight data
contained within the EUFAR archive. They should give a fairly good overview of
where a particular flight went - but they may not be totally accurate as they
are only short summaries, and the track resolution is not very high. This is
done on purpose as it makes the user interface faster!

You can pan around the map by clicking and dragging on the map. The map's
bounding box will automatically change, and the interface will automatically
search for and display flights within the area. You can also zoom in and out
using the controls in the top-left of the map. The map is from Google Maps, so
the interface should be familiar if you have used that before.


Refining Your Search
--------------------

### Geographical Search

This element allows you to search for a location. If it finds what you're
searching for, the map will centre on the matching location. You can enter
several different types of things to find a location. For example, all of the
things below are valid location searches:

* Place names (e.g. "Scotland", "London", or "Turl Street")
* Postcodes (e.g. "90210" or "OX11 0QN")
* Coordinates (e.g. "51.2W, 31.0N" or "51.7595, -1.2325")


### Temporal Filter

This element will allow you to refine your search with temporal parameters.
You can enter a start time and end time, and the interface will search for
flight data that was recorded within those two times. If you aren't sure when
the data started (or ended), you can leave the start or end field empty.

To help you see the distribution of data over time, there is a convenient
histogram underneath the start and end time box. A larger bar means that more
data files were recorded within that time period.


### Keyword Search

This element will allow you to search for any distinct keyword in the metadata
of each flight's data file. This includes being able to search for:

* Variable names ("oxygen", "downwelling", "air\_temperature", etc)
* Organisation names ("safire", "faam", etc)
* Parts of the file name or file path:
    * Folder names: ("badc", "eufar", etc)
    * Dates: ("20100518", etc)
    * Flight numbers: ("b531", etc)


### Variable Filter

This element will show you the most common variable names within the dataset,
ranking each one by frequency of occurrence. For example, in the `eufar`
dataset, the most common variable name is `air_pressure` - with 122 files
recording that variable name. Clicking one of these variable names in the left
hand panel will restrict your search to **only** files that contain that
variable name.


### Include Photography

Some datasets include high-resolution GeoTIFF photograph images as a
supplementary feature. Tick this checkbox to include photograph images in your
search criteria. If there is any photography in a given area, you will see a
small cluster of camera icons to denote photographs.


### Apply Filters and Clear Filters

These buttons simply apply any search criteria you may have entered. For
example, if you have supplied a date range and a keyword, clicking "Apply
Filters" will apply these criteria to your search.

Certain things are done automatically - the Geographical Search and Variable
Filter are applied without needing to click "Apply Filters".


Looking at Your Results
-----------------------

Each flight track is clickable and will bring up an information dialogue when
selected. This will provide some basic information about each individual file
including a link to the BADC archive to download the data, the recorded start
and end time for the data, the file name, the organisation ID and flight
number.


Getting Your Results
--------------------

### Export Results

This dialogue box will help you export any search hits you may have for a
given area. It will allow you to export the data in 3 given formats:

* Raw Elasticsearch JSON documents. This is generally intended for software
  developers or people who can directly interact with the Elasticsearch
  installation. This does include an amount of useful raw metadata, but
  generally it's not as useful as the other options.
* File Paths. This will export a JSON list of BADC system file paths. This is
  useful if you have filesystem access to the EUFAR archive - e.g. on JASMIN
  or through another entry point.
* Download URLs. This is probably the most useful option to you. This will
  provide a JSON list of URLs which can be directly used to download any
  matching data files.
