"use strict";

module.exports = {
  plugins: ["plugins/markdown"],
  sourceType: "module",

  source: {
    include: [
      "../daisy-sdk/README.md", 
      "../daisy-sdk/browser", 
      "../daisy-sdk/common", 
      "../daisy-sdk/private"
    ],
  },
  opts: {
    template: "./",
    encoding: "utf8",
    destination: "docs/",
    "tutorials": "./tutorials",
    recurse: true,
    verbose: true,
  },
  templates: {
    default: {
      includeDate: false,
      staticFiles: {
        include: [
            "./tutorials/assets"
        ],
      }
    }
  },
  docdash: {
    sectionOrder: [
      "Tutorials",
      "Classes",
      "Modules",
      "Externals",
      "Events",
      "Namespaces",
      "Mixins",
      "Interfaces"
    ]
  },
};
