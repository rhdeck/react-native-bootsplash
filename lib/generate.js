"use strict";
const { join } = require("path");
const chalk = require("chalk");
const { readFileSync, writeFileSync, existsSync } = require("fs");
const prompts = require("prompts");
const mustache = require("mustache");
const { ios, android } = require("@raydeck/react-native-utilities");
const Jimp = require("jimp");
const getTemplate = name => {
  const path = join(__dirname, "..", "templates", name);
  return readFileSync(path, { encoding: "utf8" });
};
const getImageDimensions = async path => {
  const i = await Jimp.read(path);
  return [i.bitmap.width, i.bitmap.height];
};
const getStoryboard = ({ height, width, backgroundColor, imageAsset }) => {
  const template = getTemplate("bootsplash.storyboard");
  return mustache.render(template, {
    height: parseFloat(height).toFixed(1),
    width: parseFloat(width).toFixed(1),
    x: (414 - parseFloat(width) / 2.0).toFixed(1),
    y: (896 - parseFloat(height) / 2.0).toFixed(1),
    imageAsset,
    backgroundColor,
  });
};
const log = (text, dim = false) => console.log(dim ? chalk.dim(text) : text);
const isValidHexadecimal = value => /^#?([0-9A-F]{3}){1,2}$/i.test(value);
const generate = async ({
  projectPath = ".",
  iconPath,
  backgroundColor = "system",
  darkIconPath,
  darkBackgroundColor = "system",
  iconWidth,
  name = "BootSplash",
}) => {
  if (!projectPath || !iconPath || !backgroundColor || !iconWidth) {
    throw "Missing arguments";
  }
  const [rawLightWidth, rawLightHeight] = iconPath
    ? await getImageDimensions(iconPath)
    : [1, 1];
  const [rawDarkWidth, rawDarkHeight] = darkIconPath
    ? await getImageDimensions(darkIconPath)
    : [1, 1];
  const lightHeight = (rawLightHeight / rawLightWidth) * iconWidth;
  const darkHeight = (rawDarkHeight / rawDarkWidth) * iconWidth;

  log("👍  Looking good! Generating files…");
  //#region ios
  if (!ios.getProjectName(projectPath)) {
    log("No valid ios project at path " + projectPath);
  } else {
    await ios.makeImageAsset({
      lightFile: iconPath,
      darkFile: darkIconPath,
      name,
      height: lightHeight,
      width: iconWidth,
    });
    await ios.makeColorAsset({
      lightColor:
        backgroundColor === "system"
          ? "systemBackgroundColor"
          : backgroundColor,
      darkColor:
        darkBackgroundColor === "system"
          ? "systemBackgroundColor"
          : darkBackgroundColor,
      name,
    });
    writeFileSync(
      join(ios.getProjectDir(projectPath), name + ".storyboard"),
      getStoryboard({
        height: lightHeight,
        width: iconWidth,
        imageAsset: name,
        backgroundColor: name,
      }),
    );
    log(`✨ iOS done`, true);
  }
  //#endregion
  //#region android
  name = name.toLowerCase();
  if (!android.getMainPath(projectPath)) {
    log("No valid android project at path " + projectPath);
  } else {
    const dp = android.getDrawablePath(projectPath);
    console.log({ dp });
    const drawable = join(android.getDrawablePath(projectPath), name + ".xml");
    const body = mustache.render(getTemplate("bootsplash.xml"), {
      imageName: name + "_image",
      colorName: name + "_color",
    });
    writeFileSync(drawable, body);
    await android.makeImageAsset({
      sourcePath: iconPath,
      root: projectPath,
      targetBase: name + "_image.png",
      isNight: false,
      height: lightHeight,
      width: iconWidth,
    });
    if (darkIconPath)
      await android.makeImageAsset({
        sourcePath: darkIconPath,
        root: projectPath,
        targetBase: name + "_image.png",
        isNight: true,
        height: darkHeight,
        width: iconWidth,
      });
    await android.makeColorAsset({
      root: projectPath,
      name: name + "_color",
      colorString: backgroundColor === "system" ? "#FFFFFF" : backgroundColor,
    });
    if (darkBackgroundColor)
      await android.makeColorAsset({
        root: projectPath,
        name: name + "_color",
        colorString:
          darkBackgroundColor === "system" ? "#000000" : darkBackgroundColor,
        isNight: true,
      });
    log(`✨  Android done`, true);
  }
  //#endregion
  log(
    `✅  Done! Thanks for using ${chalk.underline("react-native-bootsplash")}.`,
  );
  return projectPath;
};
const addToProject = (root = process.cwd(), name = "BootSplash") => {
  ios.addResource(join(ios.getProjectDir(), name + ".storyboard"));
  ios.setPlistValue("UILaunchStoryboardName", name + ".storyboard");
};
const questions = [
  {
    name: "projectPath",
    type: "text",
    initial: ".",
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
