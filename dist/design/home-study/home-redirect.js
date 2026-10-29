// Keep existing bookmarks and feature anchors while using one product home URL.
const home = new URL('index.html', location.href);
home.search = location.search;
home.hash = location.hash;
location.replace(home.href);
