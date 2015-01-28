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
