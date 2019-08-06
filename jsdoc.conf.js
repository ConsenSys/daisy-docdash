"use strict";

module.exports = {
  plugins: ["plugins/markdown"],
  readme: "README",
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
    "tutorials": "../daisy-widget/docs/tutorials",
    recurse: true,
    verbose: true,
  },
  templates: {
    default: {
      staticFiles: {
        include: [
            "../daisy-widget/docs/tutorials/assets"
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
