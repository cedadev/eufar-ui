# EUFAR Flight Finder Docs

## About

The EUFAR Flight Finder is a client-side Javascript web application to search
for flights in a near-real time manner and display them on an interactive map
interface.


## Project Tools

This project was developed mostly in Javascript, and contains no real surprises
with regards to HTML or CSS - it's all fairly standard.


## Depedency Management

This project has a number of resources that it depends on to function
correctly, and these are managed with [Bower](http://bower.io/).

All dependencies, project URLs, and download URLs are stored in the project
root, in the file `bower.json`.

A list of dependencies for quick reference:

* [Bootstrap](http://getbootstrap.com/)
* [Bootstrap Datepicker](https://github.com/eternicode/bootstrap-datepicker)
* [Bootstrap Multiselect](https://github.com/lou/multi-select)
* [Highcharts](http://www.highcharts.com/)
* [JQuery](http://jquery.com/)


## Project layout

```
eufar-ui
    ├── bower.json
    ├── css
    │   └── index.css
    ├── eff-docs
    │   ├── docs
    │   │   ├── about.md
    │   │   └── index.md
    │   └── mkdocs.yml
    ├── img
    │   ├── camera.png
    │   └── switch.png
    ├── index.html
    ├── js
    │   └── eufar.js
    ├── LICENSE
    ├── README.md
    └── TESTING.md
```
