"use strict";
const { join } = require("path");
const chalk = require("chalk");
const { join } = path;
const { readFileSync, writeFileSync, existsSync } = fs;
const prompts = require("prompts");
const mustache = require("mustache");
const { ios, android } = require("@raydeck/react-native-utilities");
const getTemplate = name => {
  const path = join(__dirname, "..", "templates", name);
  return readFileSync(path, { encoding: "utf8" });
};
const getStoryboard = ({ height, width, backgroundColor, imageAsset }) => {
  const template = getTemplate("bootsplash.storyboard");
  return mustache.render(template, {
    height,
    width,
    x: 414 - width,
    y: 896 - height,
    imageAsset,
    backgroundColor,
  });
};
const log = (text, dim = false) => console.log(dim ? chalk.dim(text) : text);
const isValidHexadecimal = value => /^#?([0-9A-F]{3}){1,2}$/i.test(value);
async function generate({
  projectPath = ".",
  iconPath,
  backgroundColor,
  darkIconPath,
  darkBackgroundColor,
  iconWidth,
  name = "BootSplash",
}) {
  if (
    !projectPath ||
    !iconPath ||
    !backgroundColor ||
    !darkIconPath ||
    !darkBackgroundColor ||
    !iconWidth
  ) {
    throw "Missing arguments";
  }
  log("👍  Looking good! Generating files…");
  //#region ios
  if (!ios.getProjectName(projectPath)) {
    log("No valid ios project at path " + projectPath);
  } else {
    await ios.makeImageAsset({
      lightFile: iconPath,
      darkFile: darkIconPath,
      name,
      height,
      width,
    });
    await ios.makeColorAsset({
      lightColor: backgroundColor,
      darkColor: darkBackgroundColor,
      name,
    });
    writeFileSync(
      join(getProjectPath(projectPath), name + ".storyboard"),
      getStoryboard({ height: iconWidth, width: iconWidth, ...appleColors }),
    );
    log(`✨ iOS done`, true);
  }
  //#endregion
  //#region android
  name = name.toLowerCase();
  if (!getAndroidMainPath(projectPath)) {
    log("No valid android project at path " + projectPath);
  } else {
    ensureDir(android.getDrawablePath(projectPath));
    const drawable = join(android.getDrawablePath(projectPath), name + ".xml");
    writeFileSync(
      drawable,
      mustache.render(getTemplate("bootsplash.xml"), {
        imageName: name,
        colorName: name,
      }),
    );
    android.makeColorAsset({
      root: projectPath,
      name,
      colorString: backgroundColor,
    });
    if (darkBackgroundColor)
      android.makeColorAsset({
        root: projectPath,
        name,
        colorString: backgroundColor,
        isNight: true,
      });
    log(`✨  Android done`, true);
  }
  //#endregion
  log(
    `✅  Done! Thanks for using ${chalk.underline("react-native-bootsplash")}.`,
  );
  return projectPath;
}
const addToProject = (root = process.cwd(), name = "BootSplash") => {
  ios.addToProject(join(ios.getProjectPath(), name + ".storyboard"));
  ios.addToPlist("UILaunchStoryboardName", name + ".storyboard");
};
const questions = [
  {
    name: "projectPath",
    type: "text",
    initial: initialProjectPath,
    message: "The path to the root of your React Native project",

    validate: value => {
      if (!existsSync(value)) {
        return `Invalid project path. The directory ${chalk.bold(
          value,
        )} could not be found.`;
      }

      projectName = getProjectName(value);

      if (!projectName) {
        return `Invalid React Native project. A valid ${chalk.bold(
          "app.json",
        )} file could not be found.`;
      }

      return true;
    },
  },
  {
    name: "iconPath",
    type: "text",
    message: "Your original icon file",
    initial: prev => join(prev, `${logoFileName}_original.png`),

    validate: value => {
      if (!existsSync(value)) {
        return `Invalid icon file path. The file ${chalk.bold(
          value,
        )} could not be found.`;
      }

      return true;
    },
  },
  {
    name: "backgroundColor",
    type: "text",
    message: "The bootsplash background color (in hexadecimal)",
    initial: "#FFF",

    validate: value => {
      if (!isValidHexadecimal(value)) {
        return "Invalid hexadecimal color.";
      }
      return true;
    },
  },
  {
    name: "iconWidth",
    type: "number",
    message: "The desired icon width (in dp - we recommand approximately ~100)",
    initial: 100,
    min: 1,
    max: 1000,
  },
  {
    name: "confirmation",
    type: "confirm",
    message:
      "Are you sure? All the existing bootsplash images will be overwritten!",
    initial: true,
  },
];
const getInteractively = async ({ options }) => {
  //gets anything that hasn't been passed through options
  const filteredQuestions = questions.filter(
    ({ name }) => typeof options[name] === "undefined",
  );
  const answers = filteredQuestions.length
    ? await prompts(filteredQuestions)
    : {};
  return { ...options, ...answers };
};
module.exports = { generate, addToProject, getInteractively };
