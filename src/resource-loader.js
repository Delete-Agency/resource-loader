const RESOURCE_TYPE_SCRIPT = 'script';
const RESOURCE_TYPE_STYLES = 'styles';

/**
 * Note: There can be some cases when we are trying to get promise from node which was failed to load.
 * It happens because isResourceLoaded relies on window.performance (0Performance Timing API0 that is inconsistent between browsers at the moment:
 * https://github.com/w3c/resource-timing/issues/12
 * Some of the implementations (Safari, Chrome) don't add PerformanceResource entry
 * when particular resource is failed (but they will in the future according to the issue above).
 * As a result we think that the resource is still loading and will be waiting forever
 * because obviously load and error events are not gonna be triggered.
 * These cases aren't covered at the moment and will likely be fixed after browsers have consistent Performance Timing API implementation
 */
export default class ResourceLoader {
    constructor(preloadedResources = []) {
        this._preloadedResources = preloadedResources.map(url => this._getResolvedResourceUrl(url));
        this._loadingResources = {};
    }

    /**
     * @param {Array} resources
     * @return {Promise}
     */
    load(resources) {
        return Promise.all(resources.map(this.loadResource.bind(this)));
    }

    /**
     * @param {string} resourceUrl
     * @return {Promise}
     */
    loadResource(resourceUrl) {
        function reflect(promise) {
            return promise.then(
                (v) => {
                    return { status: 'fulfilled', value: v };
                },
                (error) => {
                    return { status: 'rejected', reason: error };
                }
            );
        }

        return reflect(this._getLoadingPromise(resourceUrl));
    }

    /**
     * @param {string} resourceUrl
     * @return {boolean}
     */
    isResourceLoaded(resourceUrl) {
        // first check if we mark this resources as preloaded by passing it to the constructor
        const preloadedResources = this._preloadedResources.filter(preloadedResourceUrl => preloadedResourceUrl === this._getResolvedResourceUrl(resourceUrl));
        if (preloadedResources.length !== 0) {
            return true;
        }

        // then check if the resource has already been loaded
        // we can should resolved url as a name in performance entries
        const loadedResource = window.performance.getEntriesByName(this._getResolvedResourceUrl(resourceUrl), 'resource');
        if (loadedResource.length !== 0) {
            console.log(`${resourceUrl} is already loaded`);
            return true;
        }

        return false;
    }

    _getLoadingPromise(resourceUrl) {
        try {
            if (this.isResourceLoaded(resourceUrl)) {
                return Promise.resolve();
            }

            const node = this._findResourceNodeByUrl(resourceUrl);
            if (node) {
                console.log(`${resourceUrl} is found as a node`);
                return this._getLoadingPromiseFromNode(node, resourceUrl);
            }

            return this._loadResource(resourceUrl);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    _findResourceNodeByUrl(resourceUrl) {
        let selector = this._getQuerySelectorByUrl(resourceUrl);
        const resolvedUrl = this._getResolvedResourceUrl(resourceUrl);
        if (resourceUrl !== resolvedUrl) {
            selector += `,${this._getQuerySelectorByUrl(resolvedUrl)}`
        }
        return document.querySelector(selector);
    }

    _getQuerySelectorByUrl(url) {
        const type = this._getResourceTypeByUrl(url);
        switch (type) {
            case RESOURCE_TYPE_SCRIPT:
                return `${this._getScriptSelector(url)}`;
            case RESOURCE_TYPE_STYLES:
                return `${this._getStyleLinkSelector(url)}`;
        }
    }

    _getLoadingPromiseFromNode(node) {
        return new Promise((resolve, reject) => {
            node.addEventListener('load', (e) => {
                resolve();
            });
            node.addEventListener('error', (error) => {
                reject(error);
            });
        });
    }

    _loadResource(resourceUrl) {
        console.log(`${resourceUrl} will be inserted`);
        const url = this._getResolvedResourceUrl(resourceUrl);
        // if not we should load it ourselves
        // but in case it is currently loading we should store a promise
        // to avoid multiple downloading of the same request
        if (!(url in this._loadingResources)) {
            const loadPromise = this._getLoadingPromiseOfInsertion(url);
            this._loadingResources[url] = loadPromise;
            // after a promise is either fulfilled or rejected
            // we should remove it from the loading resources collection
            // we can repeat the process
            // and try to load again next time this resource is requested
            const removeFromResources = () => delete this._loadingResources[url];
            loadPromise.then(removeFromResources, removeFromResources);
        }
        return this._loadingResources[url];
    }

    _getLoadingPromiseOfInsertion(url) {
        const type = this._getResourceTypeByUrl(url);
        let node = null;
        switch (type) {
            case RESOURCE_TYPE_SCRIPT:
                node = this._insertScript(url);
                break;
            case RESOURCE_TYPE_STYLES:
                node = this._insertStyleLink(url);
                break;
        }
        return this._getLoadingPromiseFromNode(node);
    }

    _getResolvedResourceUrl(resource) {
        if (!this._resolvingAnchor) {
            this._resolvingAnchor = document.createElement('a')
        }
        this._resolvingAnchor.href = resource;
        return this._resolvingAnchor.href;
    }

    _getResourceTypeByUrl(url) {
        if (url.match(/.\.css$/)) {
            return RESOURCE_TYPE_STYLES;
        } else if (url.match(/.\.js$/)) {
            return RESOURCE_TYPE_SCRIPT;
        }

        throw new Error(`The type of resource ${url} could not be recognized`);
    }

    _insertScript(url) {
        const script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.src = url;
        const s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(script, s);
        return script;
    }

    _insertStyleLink(url) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.insertAdjacentElement('beforeend', link);
        return link;
    }

    _getScriptSelector(url) {
        return `script[src="${url}"]`
    }

    _getStyleLinkSelector(url) {
        return `link[href="${url}"]`;
    }
}