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
flight data that was recorded within that period. If you aren't sure when the
data started (or ended), you can leave the start or end field empty.

To help you see the distribution of data over time, there is a convenient
histogram underneath the start and end time box. A larger bar means that more
data files were recorded within that time period. Note that the histogram
displays counts for **all** flights, and is not modified by selecting
geographical or variable filters.


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
dataset, the most common variable name is `air_pressure` - with the largest
number of  files recording that variable name. Clicking one of these variable
names in the left hand panel will restrict your search to **only** files that
contain that variable name.


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
