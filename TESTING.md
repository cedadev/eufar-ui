Browser Testing Plan
====================

Markup/Layout
-------------

| Functionality | IE | Firefox | Chrome | Opera |
|---------------|----|---------|--------|-------|
| Bootstrap fonts/css loading | | YES | YES | |
| Layout correct | | YES | YES | |
| Concertina elements expand | | YES | YES | |
| Concertina elements only open one at a time | | YES | YES | |
| Documentation | N/A | N/A | N/A | N/A |
| Help popovers / hover dialogs | | YES | YES | |


Map
---

| Functionality | IE | Firefox | Chrome | Opera |
|---------------|----|---------|--------|-------|
| Map | | YES | YES | |
| Drawing tracks on map | | YES | YES | |
| Coordinate tracks only drawn once (regression - used to be drawn 'n' times) | | YES | YES | |
| Colours of tracks are persistent | | YES | YES | |
| Redoing search and redrawing tracks when map bounds change | | YES | YES | |
| Info windows (start/end time, links, file name, etc) | | YES | YES | |
| Mouse pointer coordinates update | | YES | YES | |
| Geocoder / "centre map on location" functioning | | YES | YES | |


Filters/Elasticsearch Client-Side
---------------------------------

| Functionality | IE | Firefox | Chrome | Opera |
|---------------|----|---------|--------|-------|
| Date range filter | | YES | YES | |
| Date histogram | | YES | YES | |
| Keyword search | | YES | YES | |
| Variable filter aggregation | | YES | YES | |
| Photography filter checkbox | | YES | YES | |
| 'Hits' and 'Response time' elements working | | YES | YES | |


Export Results
--------------

| Functionality | IE | Firefox | Chrome | Opera |
|---------------|----|---------|--------|-------|
| Raw JSON | | YES | YES (but slow) | |
| File paths | | YES | YES | |
| File download URLs | | YES | YES | |


Searching
---------

Note: This is testing search facilities on the Elasticsearch installation, not
      on the Javascript embedded in the web page.

| Functionality | Implemented/Functioning |
|---------------|-------------------------|
| Project name | NO |
| Aircraft name | NO |
| Instrument name | YES |
| Variable name filter | YES |
