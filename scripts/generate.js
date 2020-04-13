#!/usr/bin/env node
"use strict";
const path = require("path");
const chalk = require("chalk");
const prompts = require("prompts");
const { generate, addToProject, getInteractively } = require("../lib/generate");
const log = (text, dim = false) => console.log(dim ? chalk.dim(text) : text);
const base = {};
(async () => {
  try {
    const options = await getInteractively(base);
    await generate(options);
    const { add } = await prompts([
      {
        name: "add",
        type: "confirm",
        message:
          "Assets created. Update your ios project to use the new launch storyboard?",
        default: true,
      },
    ]);
    if (add && path) {
      return addToProject(path);
    }
  } catch (error) {
    log(chalk.red.bold(error.toString()));
  }
})();
//Now go to town
