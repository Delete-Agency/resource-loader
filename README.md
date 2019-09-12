# Resource Loader

Resource Loader is a javascript library that helps dynamically load styles and js files to the page.
The main feature is that it loads resources only when they are not already included to the page.
So it makes sure none of the required resources will be duplicated.

[Live Demo](https://delete-agency.github.io/resource-loader/)

## Motivation

There is a popular approach in server-side languages with asset management 
when you can declare which css and js files your component or widget depends on.
Basically you register a Bundle (essentially it's a collection of css and js files) and then reference to it in your view file (according MVC architecture).
For example: [Yii2](https://www.yiiframework.com/doc/guide/2.0/en/structure-assets), [ASP.NET MVC](https://docs.microsoft.com/en-us/aspnet/mvc/overview/performance/bundling-and-minification), [Cassette](http://getcassette.net/), [webassets](https://webassets.readthedocs.io/) and so on.

This approach is often part of performance optimization
because it's always good for your users to download and execute only code that is needed for the particular page

This approach works well but becomes tricky when you want to load some html from the server without page refreshing (i.e asynchronously)
If that html can contain components that rely on additional css or js files which were't loaded to the page initially,
you have to load them first. 

## Installation

Use the package manager [npm](https://docs.npmjs.com/about-npm/) for installation.

```
$ npm install @deleteagency/resource-loader
```

## Usage

```js
import resourceLoader from  '@deleteagency/resource-loader';
// an abstract function that can init your js components based on the data-attributes
import initComponents from  'init-components';
const element = document.getElementById('app');

/**
* Server response example:
* {
*     resources: ["/accordion.css", "/accordion.js", "/buttons.css"],
*     html: `
*         <div data-accordion class="accordion">
*             <buttons class="accordion__trigger button button--green" data-accordion-trigger>Open me</div>
*             <div data-accordion-content>
*                  Nulla sodales interdum velit vitae luctus. Integer rutrum neque vel ultrices tincidunt. 
*                  Suspendisse ac risus scelerisque, iaculis nisl in, tristique est. 
*             </div>
*         </div>
*     `
* }
*/
fetch("/get-some-markup")
    .then(({ data }) => {
        const resourcesList = data.resources;
        return resourceLoader.load(resourcesList).then(() => {
            return data.html;
        })
    })
    .then((html) => {
        element.innerHTML = html;
        initComponents(element);
    })
```

## API

### resourceLoader.loadResource(resourceUrl)

Returns `Promise`.

Add specified resource to the page. 
Returned promise will be resolved once we understand that resource was already loaded 
or after we insert it into the page and then wait until loading is complete.

#### resourceUrl

*Required*<br>
Type: `string`

Relative or absolute URL of the resource that should be loaded

### resourceLoader.load(resources)

Returns `Promise`.

Add specified list of the resources to the page. 
Return value is same as for loadResource method except it wait until all resource is loaded.

#### resources

*Required*<br>
Type: `Array<string>`

An array of relative or absolute URLs of the resources that should be loaded

### resourceLoader.isResourceLoaded(resourceUrl)

Returns `Boolean`.

Return if the specified resource was already loaded

#### resourceUrl

*Required*<br>
Type: `string`

Relative or absolute URL of the resource

### resourceLoader.setDebug(debug = true)

Enable (or disable) debug mode for logging messages during loadResource() or load() about how and why a particular resource is going to be loaded 

#### debug

*Required*<br>
Type: `string`<br>
Default: `true`

Relative or absolute URL of the resource

## Note
There can be some cases when we can get stuck waiting for the loading of the particular resource forever after calling loadResource() or load().
It can happen when the desired resource is already rendered within the page and failed to load by the time we are trying to load them with resourceLoader.
It happens because we rely on window.performance (Performance Timing API) which is inconsistent between browsers at the moment: 
some of the implementations (Safari, Chrome) don't add PerformanceResource entry when particular resource is failed to load (but they will in the future according to the issue above).
More details here: https://github.com/w3c/resource-timing/issues/12.
As a result we think that the resource is still loading and will be waiting forever because obviously load and error events are not gonna be triggered.
These cases aren't covered at the moment and will likely be fixed after browsers have consistent Performance Timing API implementation

## License
[MIT](https://choosealicense.com/licenses/mit/)